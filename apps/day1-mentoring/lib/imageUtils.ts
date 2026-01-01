/**
 * Resize an image file to a maximum dimension while maintaining aspect ratio
 * Returns a base64 encoded string
 */
export async function resizeImage(
  file: File,
  maxSize: number = 256,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Read the file as data URL to load into image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}

