// Holiday info (AI) handler
// Provider priority: Gemini (gemini-2.5-flash) → BigModel (glm-4-flash)

// ── Gemini ────────────────────────────────────────────────────────────────────

async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
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
  encodedSource = encodedSource.replace(/=+$/, '');
  encodedSource = encodedSource.replace(/\+/g, '-');
  encodedSource = encodedSource.replace(/\//g, '_');
  return encodedSource;
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
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function callZhipu(apiKey, prompt) {
  const authToken = await generateZhipuToken(apiKey);

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
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

    Please provide a comprehensive background on the holiday "${holiday}" as it is understood and celebrated in "${country}".
    Structure your response clearly, covering the following aspects:
    1.  **Historical Background**: Explain the origins of the holiday. What key events or figures are associated with it?
    2.  **Cultural Significance**: What does this holiday represent to the people of ${country}? What are its core values and themes?
    3.  **Social Practices**: Describe common traditions, rituals, foods, and activities associated with the celebration.
    4.  **Political/Societal Context**: Are there any political or broader societal implications or discussions related to this holiday in ${country}? (If not significant, you can state that).

    Provide a well-written, informative, and neutral analysis.
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
      content = await callGemini(env.GEMINI_API_KEY, prompt);
      console.log('Gemini succeeded.');
    } catch (err) {
      lastError = err;
      console.error('Gemini failed, falling back to Zhipu:', err.message);
    }
  }

  // 2. Fall back to Zhipu BigModel
  if (!content && env.ZHIPU_API_KEY) {
    try {
      content = await callZhipu(env.ZHIPU_API_KEY, prompt);
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
