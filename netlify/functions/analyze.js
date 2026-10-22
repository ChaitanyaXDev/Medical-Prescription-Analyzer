const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(ip, entry);
    return false;
  }

  entry.count += 1;
  rateLimitMap.set(ip, entry);

  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  return false;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
]);

const SYSTEM_PROMPT = `You read medical prescriptions. Extract only what is legible. Never guess or invent a medicine or dose; write 'unclear' and add the field to uncertainFields. If the image is not a prescription, return {error:'not_prescription'}. Use simple language. No diagnosis or treatment advice. Reply with JSON only.`;

const USER_PROMPT = `Analyze this prescription and return structured JSON with the following exact schema:
{
  "patient": {
    "name": "Patient Name or unclear",
    "age": "Age or unclear",
    "gender": "Gender or unclear"
  },
  "doctor": {
    "name": "Doctor Name or unclear",
    "clinic": "Clinic / Hospital Name or unclear"
  },
  "medicines": [
    {
      "name": "Medicine Name",
      "strength": "e.g. 500mg, 10ml, or unclear",
      "dose": "e.g. 1 tablet, 1 puff, or unclear",
      "frequency": "e.g. Twice daily, once at night, or unclear",
      "duration": "e.g. 5 days, 1 month, or unclear",
      "timing": "e.g. After meals, Before food, or unclear",
      "purpose": "Simple plain-language description of what this medication is commonly used for"
    }
  ],
  "interactions": [
    "Potential interaction warning between listed medicines if any exist, in plain language"
  ],
  "precautions": [
    "Important precaution or safety advice for taking these medicines"
  ],
  "sideEffects": [
    "Common side effects to watch for"
  ],
  "instructions": "Doctor's general advice, dietary guidance, follow-up notes, or additional instructions",
  "uncertainFields": [
    "List of any handwriting or items that were illegible, cut off, or unclear"
  ],
  "audioSummary": "A concise, natural, friendly spoken summary (2-4 paragraphs) explaining the medicines, when and how to take them, what they do, key precautions, and reminder to verify with a doctor."
}
If this image does not contain a medical prescription or is too degraded to read, return exactly: {"error": "not_prescription"}`;

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
    };
  }

  const clientIp =
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    event.headers['client-ip'] ||
    'global';

  if (isRateLimited(clientIp)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: 'Too many requests. Please wait a minute before trying again.' })
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const nvidiaKey = process.env.NVIDIA_API_KEY || (geminiKey && geminiKey.startsWith('nvapi-') ? geminiKey : null);

  if (!geminiKey && !nvidiaKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error: No AI API key configured (set GEMINI_API_KEY or NVIDIA_API_KEY in .env).' })
    };
  }

  let bodyData;
  try {
    bodyData = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON payload in request body.' })
    };
  }

  const { image, mimeType } = bodyData;

  if (!image || !mimeType) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing image or mimeType.' })
    };
  }

  const normalizedMime = mimeType.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Unsupported file format: ${mimeType}. Please upload JPG, PNG, WEBP, or PDF.` })
    };
  }

  const cleanBase64 = image.replace(/^data:[^;]+;base64,/, '');
  const approximateSizeBytes = (cleanBase64.length * 3) / 4;
  if (approximateSizeBytes > 10 * 1024 * 1024) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'File size exceeds the 10 MB limit.' })
    };
  }

  // --- NVIDIA NIM Provider Branch ---
  if (nvidiaKey) {
    try {
      const nvidiaEndpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';
      const models = ['meta/llama-3.2-11b-vision-instruct', 'meta/llama-3.2-90b-vision-instruct'];
      let candidateText = null;
      let lastErr = null;

      for (const model of models) {
        try {
          const payload = {
            model: model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: [
                  { type: 'text', text: USER_PROMPT + '\nRespond with JSON only.' },
                  { type: 'image_url', image_url: { url: `data:${normalizedMime};base64,${cleanBase64}` } }
                ]
              }
            ],
            temperature: 0.1,
            max_tokens: 2048,
            response_format: { type: 'json_object' }
          };

          const res = await fetch(nvidiaEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${nvidiaKey}`
            },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const data = await res.json();
            candidateText = data?.choices?.[0]?.message?.content;
            if (candidateText) break;
          } else {
            lastErr = await res.text();
          }
        } catch (e) {
          lastErr = e.message;
        }
      }

      if (!candidateText) {
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({ error: `NVIDIA AI service error: ${lastErr || 'No response'}` })
        };
      }

      const sanitized = candidateText
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/```$/g, '')
        .trim();
      const parsed = JSON.parse(sanitized);

      if (parsed.error === 'not_prescription') {
        return {
          statusCode: 422,
          headers,
          body: JSON.stringify({
            error: 'not_prescription',
            message: 'The uploaded file does not appear to be a legible prescription. Please ensure the prescription is clearly visible and well-lit, and try again.'
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: parsed })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to process prescription with NVIDIA vision model.' })
      };
    }
  }

  // --- Gemini Provider Branch ---
  const apiKey = geminiKey;
  const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash'];

  try {
    const requestPayload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: normalizedMime,
                data: cleanBase64
              }
            },
            {
              text: USER_PROMPT
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    };

    let geminiData = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      // Try each model, retrying once if 503 high demand occurs
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 45000);

          const response = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload),
            signal: controller.signal
          });

          clearTimeout(timeout);

          if (response.ok) {
            geminiData = await response.json();
            break;
          } else {
            const rawError = await response.text();
            try {
              const parsedErr = JSON.parse(rawError);
              lastError = parsedErr.error?.message || rawError;
            } catch {
              lastError = rawError;
            }

            if (response.status === 503 && attempt === 0) {
              await new Promise((r) => setTimeout(r, 1000));
              continue;
            }
          }
        } catch (err) {
          lastError = err.message;
        }
      }

      if (geminiData) break;
    }

    if (!geminiData) {
      let friendlyError = lastError || 'Unable to connect to AI vision service.';
      if (typeof friendlyError === 'string' && friendlyError.includes('high demand')) {
        friendlyError = 'Google AI servers are currently experiencing high demand. Please try again in a few seconds.';
      }
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: friendlyError })
      };
    }
    const candidate = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidate) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'No response received from AI model.' })
      };
    }

    let parsedResult;
    try {
      const sanitized = candidate
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/```$/g, '')
        .trim();
      parsedResult = JSON.parse(sanitized);
    } catch (e) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Failed to parse AI response into prescription data.' })
      };
    }

    if (parsedResult.error === 'not_prescription') {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({
          error: 'not_prescription',
          message: 'The uploaded file does not appear to be a legible prescription. Please ensure the prescription is clearly visible and well-lit, and try again.'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: parsedResult })
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        statusCode: 504,
        headers,
        body: JSON.stringify({ error: 'Prescription analysis timed out. Please try again with a clearer image.' })
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'An unexpected error occurred while analyzing the prescription.' })
    };
  }
};

export default handler;
