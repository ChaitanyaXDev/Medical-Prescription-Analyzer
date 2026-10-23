/**
 * MedScript Analyzer - Netlify Serverless Function
 *
 * Pipeline:
 *   1. [Optional] Azure AI Vision Read OCR -> extracts raw text from image
 *   2. Google Gemini Vision API            -> structured prescription analysis
 *      OR NVIDIA NIM vision model          -> (if NVIDIA key is configured)
 *   3. [Fallback] Demo mode               -> when no AI keys are configured
 *
 * Environment variables (set in .env or Netlify dashboard):
 *   GEMINI_API_KEY    - Google Gemini API key (primary AI provider)
 *   NVIDIA_API_KEY    - NVIDIA NIM API key (secondary AI provider, optional)
 *   AZURE_CV_ENDPOINT - Azure AI Vision endpoint URL (optional OCR layer)
 *   AZURE_CV_KEY      - Azure AI Vision subscription key (optional OCR layer)
 *
 * Security:
 *   - All keys stay server-side. Never expose them to the browser.
 *   - Prescriptions are processed in memory only; nothing is stored.
 *   - No personal data is logged.
 */

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
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
]);

const SYSTEM_PROMPT = `You are a medical prescription reader. Extract only what is legible from the prescription image or the provided OCR text.
RULES:
- Never guess or invent a medicine name or dose. Write "unclear" and add the field to uncertainFields.
- If the image is not a prescription, return {"error":"not_prescription"}.
- Use simple, plain language understandable to a non-medical person.
- Do not give diagnosis or treatment advice.
- Reply with valid JSON only - no markdown, no explanation text outside JSON.`;

function buildUserPrompt(ocrText) {
  const ocrSection = ocrText
    ? `\n\nADDITIONAL OCR TEXT EXTRACTED BY AZURE AI VISION (may contain errors - cross-reference with the image):\n"""\n${ocrText}\n"""\n`
    : '';

  return `Analyze this medical prescription image${ocrText ? ' (and the OCR text provided)' : ''} and return structured JSON matching this exact schema:
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
      "purpose": "Plain-language description of what this medicine is commonly used for"
    }
  ],
  "interactions": [
    "Potential interaction warning between listed medicines, if any, in plain language"
  ],
  "precautions": [
    "Important precaution or safety note for taking these medicines"
  ],
  "sideEffects": [
    "Common side effect to watch for"
  ],
  "instructions": "Doctor general advice, dietary guidance, follow-up notes, or other instructions visible on the prescription",
  "uncertainFields": [
    "Description of any field that was illegible, cut off, or unclear"
  ],
  "audioSummary": "A concise, friendly spoken summary (2-4 paragraphs) explaining the medicines, when and how to take them, what they do, key precautions, and a reminder to verify with a doctor."
}${ocrSection}
If this image does not contain a medical prescription, or is too degraded to read even with OCR assistance, return exactly: {"error": "not_prescription"}`;
}

/**
 * Azure AI Vision Read API - extracts text from prescription images.
 * Supports both printed and handwritten text.
 * Returns null if Azure is unavailable or fails (non-fatal fallback).
 * Reference: https://learn.microsoft.com/azure/ai-services/computer-vision/how-to/call-read-api
 */
async function runAzureOCR(base64Image, mimeType, endpoint, apiKey) {
  try {
    const analyzeUrl = `${endpoint.replace(/\/$/, '')}/computervision/imageanalysis:analyze?api-version=2024-02-01&features=read`;
    const imageBuffer = Buffer.from(base64Image, 'base64');

    const submitRes = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': mimeType === 'application/pdf' ? 'application/pdf' : mimeType
      },
      body: imageBuffer
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.warn('[AzureOCR] Submission failed:', submitRes.status, errText);
      return null;
    }

    const result = await submitRes.json();
    const readResult = result?.readResult;
    if (!readResult?.blocks) return null;

    const lines = [];
    for (const block of readResult.blocks) {
      for (const line of (block.lines || [])) {
        lines.push(line.text);
      }
    }

    const extracted = lines.join('\n').trim();
    return extracted.length > 10 ? extracted : null;
  } catch (err) {
    console.warn('[AzureOCR] Error:', err.message);
    return null;
  }
}

/**
 * Demo mode - returns clearly labelled synthetic data when no API keys configured.
 * NEVER present this as real analysis results.
 */
function getDemoResult() {
  return {
    _demoMode: true,
    _demoNotice: 'DEMO MODE - No AI API keys are configured. This is synthetic example data, NOT from a real prescription analysis.',
    patient: { name: 'Demo Patient', age: '35', gender: 'Female' },
    doctor: { name: 'Dr. Demo', clinic: 'MedScript Demo Clinic' },
    medicines: [
      {
        name: 'Amoxicillin (DEMO)',
        strength: '500mg',
        dose: '1 capsule',
        frequency: 'Three times daily',
        duration: '7 days',
        timing: 'After meals',
        purpose: 'Antibiotic commonly used to treat bacterial infections (DEMO)'
      },
      {
        name: 'Paracetamol (DEMO)',
        strength: '650mg',
        dose: '1 tablet',
        frequency: 'As needed (maximum 4 times daily)',
        duration: 'As required',
        timing: 'After food',
        purpose: 'Pain reliever and fever reducer (DEMO)'
      }
    ],
    interactions: ['No significant interactions identified between these example medicines (DEMO).'],
    precautions: [
      'DEMO: Complete the full course of antibiotics even if you feel better.',
      'DEMO: Do not exceed the maximum paracetamol dose in 24 hours.'
    ],
    sideEffects: [
      'DEMO: Amoxicillin may cause nausea or diarrhoea.',
      'DEMO: High-dose paracetamol can affect liver function.'
    ],
    instructions: 'DEMO MODE - This is example data only. To enable real analysis, add a GEMINI_API_KEY to your .env file and restart the dev server.',
    uncertainFields: [],
    audioSummary: 'This is a demonstration of MedScript Analyzer running in Demo Mode. No real prescription was analyzed because no API keys are configured. To use real AI analysis, add your Gemini API key to the dot env file and restart the development server. In a real analysis, I would read out your prescribed medicines, dosages, timing, and any precautions, and remind you to verify everything with your doctor.'
  };
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
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
  const nvidiaKey =
    process.env.NVIDIA_API_KEY ||
    (geminiKey && geminiKey.startsWith('nvapi-') ? geminiKey : null);
  const azureEndpoint = process.env.AZURE_CV_ENDPOINT;
  const azureKey = process.env.AZURE_CV_KEY;

  const hasAI = !!(geminiKey || nvidiaKey);
  const hasAzure = !!(azureEndpoint && azureKey);

  let bodyData;
  try {
    bodyData = JSON.parse(event.body || '{}');
  } catch {
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
      body: JSON.stringify({ error: 'Missing image or mimeType in request.' })
    };
  }

  const normalizedMime = mimeType.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: `Unsupported file format: ${mimeType}. Please upload JPG, PNG, WEBP, or PDF.`
      })
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

  // Demo mode when no AI keys available
  if (!hasAI) {
    console.log('[MedScript] No AI API key found - returning demo result.');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: getDemoResult() })
    };
  }

  // Azure AI Vision OCR pre-processing step (optional)
  let azureOcrText = null;
  let azureOcrUsed = false;

  if (hasAzure) {
    console.log('[MedScript] Running Azure AI Vision OCR...');
    azureOcrText = await runAzureOCR(cleanBase64, normalizedMime, azureEndpoint, azureKey);
    azureOcrUsed = true;
    if (azureOcrText) {
      console.log('[MedScript] Azure OCR extracted text successfully.');
    } else {
      console.log('[MedScript] Azure OCR returned no usable text - continuing with image-only analysis.');
    }
  }

  const userPrompt = buildUserPrompt(azureOcrText);

  // NVIDIA NIM Provider
  if (nvidiaKey) {
    try {
      const nvidiaEndpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';
      const models = ['meta/llama-3.2-11b-vision-instruct', 'meta/llama-3.2-90b-vision-instruct'];
      let candidateText = null;
      let lastErr = null;

      for (const model of models) {
        try {
          const payload = {
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: [
                  { type: 'text', text: userPrompt + '\nRespond with JSON only.' },
                  {
                    type: 'image_url',
                    image_url: { url: `data:${normalizedMime};base64,${cleanBase64}` }
                  }
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
              Authorization: `Bearer ${nvidiaKey}`
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

      if (azureOcrUsed) {
        parsed._azureOcrUsed = true;
        parsed._azureOcrText = azureOcrText || null;
      }

      return { statusCode: 200, headers, body: JSON.stringify({ data: parsed }) };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to process prescription with NVIDIA vision model.' })
      };
    }
  }

  // Google Gemini Provider
  // Fixed model names (were gemini-3.5-flash / gemini-3.6-flash which do not exist):
  //   gemini-2.0-flash  - fast, multimodal, recommended
  //   gemini-1.5-flash  - fallback
  //   gemini-1.5-pro    - fallback (higher quota cost)
  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

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
            { text: userPrompt }
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
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
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
              await new Promise((r) => setTimeout(r, 1500));
              continue;
            }
            // 404 = model not found, try next model
            if (response.status === 404) break;
          }
        } catch (err) {
          lastError = err.message;
          if (err.name === 'AbortError') break;
        }
      }
      if (geminiData) break;
    }

    if (!geminiData) {
      let friendlyError = lastError || 'Unable to connect to AI vision service.';
      if (typeof friendlyError === 'string' && friendlyError.includes('high demand')) {
        friendlyError = 'Google AI servers are currently experiencing high demand. Please try again in a few seconds.';
      }
      if (typeof friendlyError === 'string' && friendlyError.includes('API_KEY_INVALID')) {
        friendlyError = 'The configured GEMINI_API_KEY is invalid or expired. Please update it in your .env file.';
      }
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: friendlyError })
      };
    }

    const candidate = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidate) {
      const finishReason = geminiData?.candidates?.[0]?.finishReason;
      const safetyFeedback = geminiData?.promptFeedback?.blockReason;
      if (safetyFeedback) {
        return {
          statusCode: 422,
          headers,
          body: JSON.stringify({
            error: 'The image was blocked by content safety filters. Please ensure the prescription image is clear and appropriate.'
          })
        };
      }
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: `No response received from AI model. Finish reason: ${finishReason || 'unknown'}`
        })
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
    } catch {
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

    if (azureOcrUsed) {
      parsedResult._azureOcrUsed = true;
      parsedResult._azureOcrText = azureOcrText || null;
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
        body: JSON.stringify({
          error: 'Prescription analysis timed out. Please try again with a clearer image.'
        })
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'An unexpected error occurred while analyzing the prescription.'
      })
    };
  }
};

export default handler;
