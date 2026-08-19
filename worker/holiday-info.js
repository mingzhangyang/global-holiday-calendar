// Holiday info (AI) handler
// Provider priority: Gemini (gemini-3.5-flash-lite) → BigModel (glm-4.7-flash).
// Override either model with the corresponding Worker environment variable
// when a provider changes its model catalog.

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_ZHIPU_MODEL = 'glm-4.7-flash';

// ── Gemini ────────────────────────────────────────────────────────────────────

async function callGemini(apiKey, prompt, model = DEFAULT_GEMINI_MODEL) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
  const normalizedModel = model.toLowerCase();
  const generationConfig = normalizedModel.startsWith('gemini-3.7')
    ? { thinkingConfig: { thinkingLevel: 'low' } }
    : normalizedModel.startsWith('gemini-3.')
    ? { thinkingConfig: { thinkingLevel: 'minimal' } }
    : { thinkingConfig: { thinkingBudget: 0 } };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => `Status: ${response.status}`);
    throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('Gemini returned an empty response.');
  return content;
}

// ── BigModel (Zhipu) ──────────────────────────────────────────────────────────

function base64url(source) {
  let encodedSource = btoa(source);
  return normalizeBase64Url(encodedSource);
}

function normalizeBase64Url(encodedSource) {
  encodedSource = encodedSource.replace(/=+$/, '');
  encodedSource = encodedSource.replace(/\+/g, '-');
  encodedSource = encodedSource.replace(/\//g, '_');
  return encodedSource;
}

function base64urlBytes(source) {
  return normalizeBase64Url(btoa(String.fromCharCode(...source)));
}

async function generateZhipuToken(apiKey, expMilliseconds = 300000) {
  const [id, secret] = apiKey.split('.');
  if (!id || !secret) {
    throw new Error('Invalid Zhipu API Key format. Expected "id.secret".');
  }

  const header = { alg: 'HS256', sign_type: 'SIGN', typ: 'JWT' };
  const now = Date.now();
  const payload = { api_key: id, exp: now + expMilliseconds, timestamp: now };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureData = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signatureData));
  const encodedSignature = base64urlBytes(new Uint8Array(signature));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function callZhipu(apiKey, prompt, model = DEFAULT_ZHIPU_MODEL) {
  const authToken = await generateZhipuToken(apiKey);

  const requestBody = {
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  };

  if (/^glm-(?:4\.7|4\.6|4\.5|5(?:\.|-))/.test(model)) {
    requestBody.thinking = { type: 'disabled' };
  }

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => `Status: ${response.status}`);
    throw new Error(`Zhipu API error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Zhipu returned an empty response.');
  return content;
}

// ── Handler ───────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const LANGUAGE_INSTRUCTIONS = {
  'en': 'Please respond in English.',
  'zh-CN': '请用简体中文回答。',
  'zh-TW': '請用繁體中文回答。',
  'ja': '日本語で回答してください。',
  'ko': '한국어로 답변해 주세요。',
  'fr': 'Veuillez répondre en français.',
  'de': 'Bitte antworten Sie auf Deutsch.',
  'es': 'Por favor responda en español.',
};

function buildPrompt(holiday, country, language) {
  const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['en'];
  return `
    ${languageInstruction}

    You are an authoritative cultural anthropologist and historian. Provide a strictly factual, culturally authentic, and well-researched background on the holiday "${holiday}" as understood and celebrated in "${country}".

    Academic & Factuality Guidelines:
    - Base your response on verified historical records, statutory legislation, and authentic anthropological traditions.
    - Clearly distinguish between documented historical facts, religious theology, and popular folklore/legends.
    - If there are regional variations within ${country}, highlight them accurately.
    - Maintain cultural neutrality and academic objectivity.
    - Do NOT fabricate or hallucinate customs, dates, or historical figures.

    Structure your response clearly using Markdown:
    1. **Historical Origin & Statutory Status**: Documented origins, historical milestones, relevant statutory laws, or religious roots.
    2. **Cultural & Spiritual Significance**: Core values, symbolism, and cultural meaning for the people of ${country}.
    3. **Authentic Customs & Traditional Observances**: Genuine rituals, communal activities, traditional foods, and festivities.
    4. **Modern Observance**: How modern society observes this day (e.g., whether public offices/schools close, public parades, family gatherings).
  `;
}

const MAX_HOLIDAY_LENGTH = 150;
const MAX_COUNTRY_LENGTH = 100;
const INFO_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Build a synthetic GET request used as the edge-cache key for an
// AI response (the Cache API cannot key on POST bodies directly).
function buildInfoCacheKey(requestUrl, holiday, country, language) {
  const cacheUrl = new URL('/api/holiday-info/cache', requestUrl);
  cacheUrl.searchParams.set('holiday', holiday);
  cacheUrl.searchParams.set('country', country);
  cacheUrl.searchParams.set('lang', language);
  return new Request(cacheUrl.toString(), { method: 'GET' });
}

export async function handleHolidayInfo(request, env, ctx) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response('Please use a POST request.', {
      status: 405,
      headers: { 'Allow': 'POST', 'Access-Control-Allow-Origin': '*' }
    });
  }

  if (!env.GEMINI_API_KEY && !env.ZHIPU_API_KEY) {
    return new Response('No AI API key configured. Set GEMINI_API_KEY or ZHIPU_API_KEY.', {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  let holiday, country, language;
  try {
    const body = await request.json();
    holiday = typeof body.holiday === 'string' ? body.holiday.trim() : '';
    country = typeof body.country === 'string' ? body.country.trim() : '';
    language = LANGUAGE_INSTRUCTIONS[body.language] ? body.language : 'en';

    if (!holiday || !country) {
      throw new Error('Missing "holiday" or "country" in the request body.');
    }
    if (holiday.length > MAX_HOLIDAY_LENGTH || country.length > MAX_COUNTRY_LENGTH) {
      throw new Error('"holiday" or "country" exceeds the maximum allowed length.');
    }
  } catch (e) {
    return new Response(`Invalid request: ${e.message}`, {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Serve repeated questions from the edge cache instead of the AI providers
  const cache = caches.default;
  const cacheKey = buildInfoCacheKey(request.url, holiday, country, language);
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    const response = new Response(cachedResponse.body, cachedResponse);
    response.headers.set('X-Cache-Hit', 'true');
    return response;
  }

  // Optional rate limiting (configure a "ratelimits" binding in wrangler.toml)
  if (env.HOLIDAY_INFO_RATE_LIMITER) {
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await env.HOLIDAY_INFO_RATE_LIMITER.limit({ key: clientIp });
    if (!success) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  const prompt = buildPrompt(holiday, country, language);
  let content = null;
  let lastError = null;

  // 1. Try Gemini first
  if (env.GEMINI_API_KEY) {
    try {
      content = await callGemini(
        env.GEMINI_API_KEY,
        prompt,
        env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
      );
      console.log('Gemini succeeded.');
    } catch (err) {
      lastError = err;
      console.error('Gemini failed, falling back to Zhipu:', err.message);
    }
  }

  // 2. Fall back to Zhipu BigModel
  if (!content && env.ZHIPU_API_KEY) {
    try {
      content = await callZhipu(
        env.ZHIPU_API_KEY,
        prompt,
        env.ZHIPU_MODEL || DEFAULT_ZHIPU_MODEL
      );
      console.log('Zhipu fallback succeeded.');
    } catch (err) {
      lastError = err;
      console.error('Zhipu fallback also failed:', err.message);
    }
  }

  if (!content) {
    const message = lastError?.message || 'All AI providers failed.';
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  const response = new Response(JSON.stringify({ background: content }), {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${INFO_CACHE_TTL_SECONDS}`,
    },
  });

  ctx?.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}
