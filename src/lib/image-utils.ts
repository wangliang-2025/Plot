/**
 * Client-side image utilities.
 *
 * Because this project may be deployed to Vercel's free tier (no writable
 * filesystem, limited egress), we intentionally do NOT upload images to a
 * server. Instead we compress them in the browser and inline them as data
 * URLs in the markdown content. This keeps the deployment storage-free at
 * the cost of some row size in the database.
 */

export interface CompressOptions {
  /** Maximum width in pixels (the image is scaled down proportionally). */
  maxWidth?: number;
  /** Maximum height in pixels. */
  maxHeight?: number;
  /** JPEG/WEBP quality 0..1. */
  quality?: number;
  /**
   * Preferred output mime. WebP offers ~25–35% smaller files than JPEG at
   * similar quality and is supported by every evergreen browser. PNGs with
   * alpha fall back to PNG automatically if a transparent pixel is present.
   */
  mime?: 'image/webp' | 'image/jpeg';
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
  mime: 'image/webp',
};

/**
 * Compress a File (or Blob) to a base64 data URL suitable for direct
 * embedding in markdown via `![alt](data:image/webp;base64,...)`.
 *
 * Falls back to returning the original data URL when compression would
 * somehow produce a larger output (rare, e.g. tiny PNGs).
 */
export async function compressImageToDataUrl(
  file: File | Blob,
  opts: CompressOptions = {}
): Promise<string> {
  const merged = { ...DEFAULTS, ...opts };

  // Non-image types fall back to the raw data url
  if (!file.type.startsWith('image/')) {
    return fileToDataUrl(file);
  }

  // SVG & GIF: skip canvas re-encode (would lose animation / vector data).
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return fileToDataUrl(file);
  }

  const bitmap = await loadImage(file);
  const { width, height } = fitWithin(
    bitmap.width,
    bitmap.height,
    merged.maxWidth,
    merged.maxHeight
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return fileToDataUrl(file);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Prefer WebP; if the browser rejects it, try JPEG.
  let compressed = canvas.toDataURL(merged.mime, merged.quality);
  if (!compressed || compressed === 'data:,') {
    compressed = canvas.toDataURL('image/jpeg', merged.quality);
  }

  // If for some reason the "compressed" version is bigger than the original,
  // keep the original (rare but possible for already-optimized tiny images).
  const original = await fileToDataUrl(file);
  return compressed.length < original.length ? compressed : original;
}

function fitWithin(
  w: number,
  h: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  if (w <= maxW && h <= maxH) return { width: w, height: h };
  const ratio = Math.min(maxW / w, maxH / h);
  return {
    width: Math.round(w * ratio),
    height: Math.round(h * ratio),
  };
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/** Pretty-print a byte size. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Rough byte size of a data URL (base64 overhead ≈ 4/3). */
export function dataUrlByteSize(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return dataUrl.length;
  const b64 = dataUrl.slice(comma + 1);
  return Math.floor((b64.length * 3) / 4);
}
