/**
 * Image optimization utility for multimodal AI models.
 * Resizes large smartphone camera photos (often 12MP-48MP, 5MB-20MB)
 * down to crisp ~1024px JPEGs (typically 80KB-180KB).
 *
 * This prevents HTTP payload limits, mobile browser tab crashes,
 * and high network latencies, while retaining high detail for AI vision.
 */
export async function optimizeImageForAI(
  input: File | Blob | string,
  maxDimension = 1024,
  quality = 0.88
): Promise<{ base64: string; mimeType: string; dataUrl: string }> {
  // 1. If input is File/Blob and createImageBitmap is available, use fast native decoding
  if (typeof input !== 'string' && typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(input);
      let width = bitmap.width;
      let height = bitmap.height;

      if (width > 0 && height > 0) {
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(bitmap, 0, 0, width, height);
          bitmap.close();

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const cleanBase64 = (dataUrl.split(',')[1] || '').replace(/\s+/g, '');
          if (cleanBase64.length > 50) {
            return {
              base64: cleanBase64,
              mimeType: 'image/jpeg',
              dataUrl,
            };
          }
        }
      }
    } catch (bitmapErr) {
      console.warn('createImageBitmap fallback to standard image loader:', bitmapErr);
    }
  }

  // 2. Standard HTMLImageElement / FileReader fallback
  return new Promise((resolve, reject) => {
    const processImg = (img: HTMLImageElement, originalDataUrl?: string) => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        width = 800;
        height = 600;
      }

      // Calculate aspect-preserving dimensions capped at maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (originalDataUrl) {
          const clean = originalDataUrl.includes(',') ? originalDataUrl.split(',')[1].replace(/\s+/g, '') : originalDataUrl.replace(/\s+/g, '');
          resolve({
            base64: clean,
            mimeType: 'image/jpeg',
            dataUrl: originalDataUrl,
          });
          return;
        }
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      // Fill with clean white background in case of transparent PNG/WEBP
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Draw downscaled image with smooth high-quality interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = (dataUrl.split(',')[1] || '').replace(/\s+/g, '');

      resolve({
        base64,
        mimeType: 'image/jpeg',
        dataUrl,
      });
    };

    if (typeof input === 'string') {
      const img = new Image();
      if (!input.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => processImg(img, input);
      img.onerror = () => {
        const clean = (input.includes(',') ? input.split(',')[1] : input).replace(/\s+/g, '');
        resolve({
          base64: clean,
          mimeType: 'image/jpeg',
          dataUrl: input,
        });
      };
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const img = new Image();
        img.onload = () => processImg(img, result);
        img.onerror = () => {
          const clean = (result.includes(',') ? result.split(',')[1] : result).replace(/\s+/g, '');
          resolve({
            base64: clean,
            mimeType: input.type || 'image/jpeg',
            dataUrl: result,
          });
        };
        img.src = result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(input);
    }
  });
}
