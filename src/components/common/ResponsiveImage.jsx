import { memo } from 'react'

/**
 * Accessible responsive image with WebP srcset and optional lazy loading.
 * Accepts either a local image descriptor (from localAssets / buildLocalImage)
 * or a plain { src, srcMobile?, alt } object from Unsplash.
 */
const ResponsiveImage = ({
  image,
  fallbackSrc,
  alt,
  className = '',
  sizes = '(max-width: 768px) 100vw, 50vw',
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  fetchpriority,
  decorative = false
}) => {
  const resolvedAlt = decorative ? '' : (image?.alt || alt || 'Orthopaedic healthcare imagery')
  const src = image?.src ?? fallbackSrc
  const srcSet = image?.srcSet
    || (image?.srcMobile && image?.src
      ? `${image.srcMobile} 800w, ${image.src} ${width || 1200}w`
      : undefined)

  if (!src) return null

  return (
    <img
      className={className}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={resolvedAlt}
      width={image?.width ?? width}
      height={image?.height ?? height}
      loading={loading}
      decoding={decoding}
      fetchpriority={fetchpriority}
      draggable={false}
    />
  )
}

export default memo(ResponsiveImage)
