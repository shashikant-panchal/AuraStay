/**
 * Lightweight image compressor for Supabase Free Plan optimization.
 * Resizes images and converts to compact WebP (or JPEG fallback) under a byte ceiling.
 */
export function compressImageFile(file, { maxDim = 320, maxBytes = 28 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No image file selected.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const fallbackUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const fitWithinBudget = (mimeType) => {
          for (let q = 0.72; q >= 0.30; q -= 0.1) {
            const encoded = canvas.toDataURL(mimeType, Number(q.toFixed(2)));
            if (encoded.length <= maxBytes * 1.37) {
              return encoded;
            }
          }
          return canvas.toDataURL(mimeType, 0.28);
        };

        const webp = fitWithinBudget('image/webp');
        if (webp.startsWith('data:image/webp')) {
          resolve(webp);
          return;
        }
        resolve(fitWithinBudget('image/jpeg'));
      };
      img.onerror = () => resolve(fallbackUrl);
      img.src = fallbackUrl;
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}
