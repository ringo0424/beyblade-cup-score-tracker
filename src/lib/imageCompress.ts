const DEFAULT_MAX_WIDTH = 960;
const DEFAULT_QUALITY = 0.82;
const DEFAULT_MAX_BYTES = 380_000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("無法讀取圖片"));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("無法讀取檔案"));
    reader.readAsDataURL(file);
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL("image/jpeg", quality);
}

function estimateBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

export async function fileToCompressedDataUrl(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxBytes?: number;
  }
): Promise<string> {
  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = options?.maxHeight ?? maxWidth;
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  let quality = options?.quality ?? DEFAULT_QUALITY;

  const raw = await readFileAsDataUrl(file);
  const img = await loadImage(raw);

  let w = img.naturalWidth;
  let h = img.naturalHeight;
  const ratio = Math.min(maxWidth / w, maxHeight / h, 1);
  w = Math.round(w * ratio);
  h = Math.round(h * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法處理圖片");
  ctx.drawImage(img, 0, 0, w, h);

  let dataUrl = canvasToJpeg(canvas, quality);
  while (estimateBytes(dataUrl) > maxBytes && quality > 0.45) {
    quality -= 0.08;
    dataUrl = canvasToJpeg(canvas, quality);
  }

  if (estimateBytes(dataUrl) > maxBytes) {
    throw new Error("圖片太大，請改用較小的照片");
  }

  return dataUrl;
}
