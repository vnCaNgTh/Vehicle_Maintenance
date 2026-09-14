import { useEffect, useState } from 'react'
import styles from './MaintenanceImageGallery.module.css'

export interface MaintenanceImageGalleryItem {
  id: string
  blob: Blob
  filename: string
}

interface MaintenanceImageGalleryProps {
  images: MaintenanceImageGalleryItem[]
  /** Omit to render a view-only gallery (no remove buttons). */
  onRemove?: (id: string) => void
  emptyMessage?: string
}

/**
 * Displays receipt/photo thumbnails from Blobs, with a tap-to-enlarge
 * preview. Manages object URL creation/revocation internally so callers
 * never have to think about that lifecycle.
 */
export function MaintenanceImageGallery({ images, onRemove, emptyMessage }: MaintenanceImageGalleryProps) {
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [urls, setUrls] = useState<Map<string, string>>(new Map())

  // Object URLs are a browser-managed external resource: they must be
  // created/revoked from an effect, not computed during render. Creating
  // them here (rather than in a memo that an effect only cleans up) keeps
  // this safe under React StrictMode's dev-only mount/cleanup/mount replay,
  // since each effect run creates and later revokes its own matching set.
  useEffect(() => {
    const next = new Map<string, string>()
    for (const image of images) {
      next.set(image.id, URL.createObjectURL(image.blob))
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizing with the browser's blob URL registry (an external system)
    setUrls(next)
    return () => {
      for (const url of next.values()) {
        URL.revokeObjectURL(url)
      }
    }
  }, [images])

  if (images.length === 0) {
    return emptyMessage ? <p className={styles.emptyMessage}>{emptyMessage}</p> : null
  }

  const previewImage = previewId ? images.find((image) => image.id === previewId) : undefined

  return (
    <>
      <div className={styles.grid}>
        {images.map((image) => (
          <div key={image.id} className={styles.thumbnailWrapper}>
            <button
              type="button"
              className={styles.thumbnailButton}
              onClick={() => setPreviewId(image.id)}
              aria-label={`View ${image.filename}`}
            >
              <img src={urls.get(image.id)} alt={image.filename} className={styles.thumbnail} />
            </button>
            {onRemove && (
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => onRemove(image.id)}
                aria-label={`Remove ${image.filename}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {previewImage && (
        <div className={styles.previewOverlay} role="presentation" onClick={() => setPreviewId(null)}>
          <img src={urls.get(previewImage.id)} alt={previewImage.filename} className={styles.previewImage} />
          <button
            type="button"
            className={styles.previewClose}
            onClick={() => setPreviewId(null)}
            aria-label="Close preview"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
