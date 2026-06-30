/** Responsive WebP paths under public/assets/optimized/ */

export const RESPONSIVE_WIDTHS = [400, 800, 1200]

/**
 * @param {string} category - e.g. presentation, office, heroes
 * @param {string} name - asset slug (without width suffix)
 * @param {number} [width=1200]
 */
export function getOptimizedSrc(category, name, width = 1200) {
  return `/assets/optimized/${category}/${name}-${width}.webp`
}

/**
 * @param {string} category
 * @param {string} name
 * @param {number[]} [widths]
 */
export function getSrcSet(category, name, widths = RESPONSIVE_WIDTHS) {
  return widths.map((w) => `${getOptimizedSrc(category, name, w)} ${w}w`).join(', ')
}

/**
 * Build a responsive image descriptor for React components.
 * @param {object} opts
 * @param {string} opts.category
 * @param {string} opts.name
 * @param {string} opts.alt - UK English alt text
 * @param {'presentation'|'legacy'|'unsplash'} [opts.source='legacy']
 * @param {number} [opts.width=1200]
 * @param {number} [opts.height=720]
 */
export function buildLocalImage({
  category,
  name,
  alt,
  source = 'legacy',
  width = 1200,
  height = 720
}) {
  return {
    category,
    name,
    src: getOptimizedSrc(category, name, 1200),
    srcMobile: getOptimizedSrc(category, name, 800),
    srcSet: getSrcSet(category, name),
    alt,
    width,
    height,
    source
  }
}

/**
 * Merge a local image with an Unsplash fallback URL for progressive enhancement.
 */
export function withUnsplashFallback(localImage, unsplashUrl) {
  return {
    ...localImage,
    unsplashFallback: unsplashUrl
  }
}
