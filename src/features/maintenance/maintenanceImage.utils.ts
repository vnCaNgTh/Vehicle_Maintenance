/**
 * Client-side image resize/compression so receipt photos don't bloat
 * IndexedDB storage. Runs entirely in the browser - nothing is uploaded.
 */

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.8
const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export class UnsupportedImageTypeError extends Error {
  constructor(mimeType: string) {
    super(`"${mimeType || 'unknown file type'}" is not a supported image. Please choose a JPEG, PNG, or WebP photo.`)
    this.name = 'UnsupportedImageTypeError'
  }
}

export interface ProcessedImage {
  blob: Blob
  mimeType: string
  size: number
}

export function isSupportedImageType(mimeType: string): boolean {
  return ACCEPTED_MIME_TYPES.has(mimeType)
}

/** Resizes (if needed) and compresses an image file, preserving PNG transparency. */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  if (!isSupportedImageType(file.type)) {
    throw new UnsupportedImageTypeError(file.type)
  }

  const bitmap = await loadImageBitmap(file)
  try {
    const { width, height } = fitWithinMaxDimension(bitmap.width, bitmap.height, MAX_DIMENSION)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not process this image on this device.')
    }
    context.drawImage(bitmap, 0, 0, width, height)

    const outputMimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const quality = outputMimeType === 'image/jpeg' ? JPEG_QUALITY : undefined
    const blob = await canvasToBlob(canvas, outputMimeType, quality)
    return { blob, mimeType: blob.type || outputMimeType, size: blob.size }
  } finally {
    bitmap.close()
  }
}

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file)
  } catch (error) {
    throw new Error('Could not read this image. Please choose a different file.', { cause: error })
  }
}

function fitWithinMaxDimension(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }
  const scale = width > height ? maxDimension / width : maxDimension / height
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Could not process this image.'))
      }
    }, type, quality)
  })
}
