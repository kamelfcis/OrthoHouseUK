import { memo } from 'react'
import ResponsiveImage from './ResponsiveImage'
import './HeroBackground.css'

/**
 * Full-bleed hero background — uses responsive WebP with accessible alt on a
 * presentation-only img (visually hidden from assistive tech when decorative).
 */
const HeroBackground = ({
  image,
  fallbackSrc,
  alt,
  className = '',
  loading = 'eager',
  fetchpriority = 'high'
}) => (
  <div className={`hero-background ${className}`.trim()} aria-hidden="true">
    <ResponsiveImage
      image={image}
      fallbackSrc={fallbackSrc}
      alt={alt}
      className="hero-background__img"
      sizes="100vw"
      loading={loading}
      fetchpriority={fetchpriority}
      decorative
    />
  </div>
)

export default memo(HeroBackground)
