// A helper function to encode strings into Base64URL format
function base64url(source) {
  // Encode in classical base64
  let encodedSource = btoa(source);
  // Remove padding equal characters
  encodedSource = encodedSource.replace(/=+$/, '');
  // Replace characters according to base64url specifications
  encodedSource = encodedSource.replace(/\+/g, '-');
  encodedSource = encodedSource.replace(/\//g, '_');
  return encodedSource;
}

/**
 * Generates a JSON Web Token (JWT) for Zhipu AI API authentication.
 * @param {string} apiKey - The full Zhipu API key (id.secret).
 * @param {number} expMilliseconds - The token expiration time in milliseconds.
 * @returns {Promise<string>} - The generated JWT.
 */
async function generateZhipuToken(apiKey, expMilliseconds = 300000) { // Default 5 minutes
  const [id, secret] = apiKey.split('.');
  if (!id || !secret) {
    throw new Error('Invalid Zhipu API Key format. Expected "id.secret".');
  }

  const header = {
    alg: 'HS256',
    sign_type: 'SIGN',
    typ: 'JWT'
  };

  const now = Date.now();
  const payload = {
    api_key: id,
    exp: now + expMilliseconds,
    timestamp: now,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));

  const signatureData = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret), {
      name: 'HMAC',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signatureData));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}


export default {
  /**
   * The main fetch handler for the Cloudflare Worker.
   * @param {Request} request - The incoming HTTP request.
   * @param {object} env - The environment variables, including secrets.
   * @returns {Promise<Response>} - The HTTP response.
   */
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Please use a POST request.', {
        status: 405,
        headers: { 
          'Allow': 'POST',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Check for the ZHIPU_API_KEY secret
    if (!env.ZHIPU_API_KEY) {
      return new Response('ZHIPU_API_KEY environment variable not set.', { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    let holiday, country, language;
    try {
      const body = await request.json();
      holiday = body.holiday;
      country = body.country;
      language = body.language || 'en'; // Default to English if not provided

      if (!holiday || !country) {
        throw new Error('Missing "holiday" or "country" in the request body.');
      }
    } catch (e) {
      return new Response(`Invalid request: ${e.message}`, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    try {
      // 1. Generate the Authentication Token
      const authToken = await generateZhipuToken(env.ZHIPU_API_KEY);

      // 2. Construct the prompt for the model with language support
      const languageInstructions = {
        'en': 'Please respond in English.',
        'zh-CN': '请用简体中文回答。',
        'zh-TW': '請用繁體中文回答。',
        'ja': '日本語で回答してください。',
        'ko': '한국어로 답변해 주세요。',
        'fr': 'Veuillez répondre en français.',
        'de': 'Bitte antworten Sie auf Deutsch.',
        'es': 'Por favor responda en español.'
      };
      
      const languageInstruction = languageInstructions[language] || languageInstructions['en'];
      
      const prompt = `
        ${languageInstruction}
        
        Please provide a comprehensive background on the holiday "${holiday}" as it is understood and celebrated in "${country}".
        Structure your response clearly, covering the following aspects:
        1.  **Historical Background**: Explain the origins of the holiday. What key events or figures are associated with it?
        2.  **Cultural Significance**: What does this holiday represent to the people of ${country}? What are its core values and themes?
        3.  **Social Practices**: Describe common traditions, rituals, foods, and activities associated with the celebration.
        4.  **Political/Societal Context**: Are there any political or broader societal implications or discussions related to this holiday in ${country}? (If not significant, you can state that).

        Provide a well-written, informative, and neutral analysis.
      `;

      // 3. Make the API call to Zhipu AI
      const zhipuApiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

      const response = await fetch(zhipuApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'glm-4-flash', // Using the specified fast model
          messages: [{
            role: 'user',
            content: prompt,
          }, ],
          stream: false, // We want a single, complete response
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Zhipu API Error: ${response.status} ${response.statusText}`, errorText);
        return new Response(`Error from Zhipu API: ${errorText}`, { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const data = await response.json();

      // 4. Extract the content and return it
      const content = data.choices[0]?.message?.content;
      if (!content) {
          return new Response('Failed to get a valid response from the AI model.', { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*'
            }
          });
      }
      
      return new Response(JSON.stringify({ background: content }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });

    } catch (error) {
      console.error('Worker Error:', error);
      return new Response(`An internal error occurred: ${error.message}`, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  },
};