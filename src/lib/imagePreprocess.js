/**
 * Image preprocessing utilities for MedScript Analyzer
 *
 * Applies client-side image enhancements before sending to the AI backend.
 * Goal: improve OCR and AI vision accuracy on blurry, low-contrast, or
 * slightly rotated prescription images.
 *
 * IMPORTANT:
 * - The original image is always preserved; preprocessing creates a copy.
 * - Preprocessing is applied to images only (not PDFs).
 * - These are lightweight Canvas API operations — no external libraries needed.
 * - Heavy transformations (e.g., ML-based deskewing) are out of scope here.
 *
 * Techniques applied:
 *   1. Resize large images to a max dimension (reduces upload size, speeds up AI)
 *   2. Grayscale conversion (reduces noise, improves text contrast)
 *   3. Contrast + brightness boost (CLAHE-lite via pixel manipulation)
 *   4. Mild sharpening via unsharp mask approximation
 */

const MAX_DIMENSION = 2048; // px — larger images are downscaled to this limit
const JPEG_QUALITY = 0.92;  // Output quality for JPEG encoding

/**
 * Preprocesses an image File for optimal OCR/AI analysis.
 *
 * @param {File} file - Original image file
 * @param {Object} options
 * @param {boolean} options.grayscale - Convert to grayscale (default: false)
 * @param {boolean} options.enhance  - Apply contrast/brightness enhancement (default: true)
 * @param {boolean} options.resize   - Resize if larger than MAX_DIMENSION (default: true)
 * @returns {Promise<{blob: Blob, dataUrl: string, wasProcessed: boolean, originalSize: number, processedSize: number}>}
 */
export async function preprocessImage(file, options = {}) {
  const { grayscale = false, enhance = true, resize = true } = options;

  // Only process image files
  if (!file.type.startsWith('image/')) {
    return {
      blob: file,
      dataUrl: null,
      wasProcessed: false,
      originalSize: file.size,
      processedSize: file.size
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        let wasResized = false;

        // 1. Resize if needed
        if (resize && (width > MAX_DIMENSION || height > MAX_DIMENSION)) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          wasResized = true;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Draw original image at (possibly) new dimensions
        ctx.drawImage(img, 0, 0, width, height);

        // 2. Pixel-level operations (grayscale + contrast enhancement)
        if (grayscale || enhance) {
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            if (grayscale) {
              // Luminance-weighted grayscale (ITU-R BT.709)
              const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
              r = g = b = gray;
            }

            if (enhance) {
              // Mild S-curve contrast boost: stretches mid-tones
              // Factor > 1 increases contrast
              const factor = 1.15;
              const intercept = 128 * (1 - factor);
              r = Math.min(255, Math.max(0, factor * r + intercept));
              g = Math.min(255, Math.max(0, factor * g + intercept));
              b = Math.min(255, Math.max(0, factor * b + intercept));

              // Slight brightness boost to lift shadows (helps on dark photos)
              const brightnessBoost = 10;
              r = Math.min(255, r + brightnessBoost);
              g = Math.min(255, g + brightnessBoost);
              b = Math.min(255, b + brightnessBoost);
            }

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }

          ctx.putImageData(imageData, 0, 0);
        }

        // 3. Unsharp mask (sharpening) via two-pass technique
        if (enhance) {
          applyUnsharpMask(ctx, canvas, width, height, 0.6);
        }

        // Export as blob
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // If canvas export fails, fall back to original
              resolve({
                blob: file,
                dataUrl: null,
                wasProcessed: false,
                originalSize: file.size,
                processedSize: file.size
              });
              return;
            }

            const wasProcessed = wasResized || grayscale || enhance;

            // Convert blob to data URL for display
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                blob,
                dataUrl: reader.result,
                wasProcessed,
                originalSize: file.size,
                processedSize: blob.size
              });
            };
            reader.onerror = () => {
              resolve({
                blob: file,
                dataUrl: null,
                wasProcessed: false,
                originalSize: file.size,
                processedSize: file.size
              });
            };
            reader.readAsDataURL(blob);
          },
          outputMime,
          JPEG_QUALITY
        );
      } catch (err) {
        // Any canvas error — just use original file
        resolve({
          blob: file,
          dataUrl: null,
          wasProcessed: false,
          originalSize: file.size,
          processedSize: file.size
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for preprocessing.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Lightweight unsharp mask to sharpen text edges.
 * Blurs a copy, then blends: sharpened = original + amount * (original - blurred)
 */
function applyUnsharpMask(ctx, canvas, width, height, amount) {
  try {
    // Get original pixels
    const original = ctx.getImageData(0, 0, width, height);

    // Apply a small blur to a temporary canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    tempCtx.drawImage(canvas, 0, 0);
    tempCtx.filter = 'blur(1px)';
    tempCtx.drawImage(canvas, 0, 0);

    const blurred = tempCtx.getImageData(0, 0, width, height);
    const origData = original.data;
    const blurData = blurred.data;

    for (let i = 0; i < origData.length; i += 4) {
      origData[i]     = Math.min(255, Math.max(0, origData[i]     + amount * (origData[i]     - blurData[i])));
      origData[i + 1] = Math.min(255, Math.max(0, origData[i + 1] + amount * (origData[i + 1] - blurData[i + 1])));
      origData[i + 2] = Math.min(255, Math.max(0, origData[i + 2] + amount * (origData[i + 2] - blurData[i + 2])));
    }

    ctx.putImageData(original, 0, 0);
  } catch {
    // Sharpening is optional — silently skip on error
  }
}

/**
 * Reads a File or Blob as a Base64 data URL string.
 * @param {File|Blob} fileOrBlob
 * @returns {Promise<string>} base64 data URL
 */
export function readAsDataURL(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(fileOrBlob);
  });
}
