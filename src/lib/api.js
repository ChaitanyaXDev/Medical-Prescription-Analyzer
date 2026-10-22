/**
 * Client API for calling MedScript Analyzer Netlify function
 */
export async function analyzePrescription(base64Image, mimeType) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch('/.netlify/functions/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: base64Image,
        mimeType: mimeType
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => {
      throw new Error('Unable to parse server response. Please try again.');
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Analysis request limit reached. Please wait a minute and try again.');
      }
      if (response.status === 422 || data.error === 'not_prescription') {
        throw new Error(data.message || 'This image does not look like a clear medical prescription. Please provide a clear, well-lit photo.');
      }
      if (response.status === 504) {
        throw new Error('Analysis timed out. Please check your internet connection or upload a smaller, clearer file.');
      }
      throw new Error(data.error || data.message || `Analysis failed (${response.status}). Please try again.`);
    }

    if (!data || !data.data) {
      throw new Error('Received incomplete prescription analysis from the server.');
    }

    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 60 seconds. Please try again with a clearer or smaller image.');
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error: Unable to connect to the analysis service. Please check your connection.');
    }
    throw error;
  }
}
