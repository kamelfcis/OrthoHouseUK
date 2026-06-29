import { HERO_SLIDES } from './heroSlides'
import {
  homeValueProp,
  homeCapabilities,
  homeWhyChooseUs,
  homeSpecialties,
  homeJoinCta
} from '../content/home'

/** Extract Unsplash photo slug from a CDN URL, e.g. "photo-1551601651-2a8555f1a136". */
export const extractUnsplashPhotoId = (url) => {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/\/(photo-[a-zA-Z0-9_-]+)/)
  return match?.[1] ?? null
}

const collectFallbackUrls = () => {
  const urls = [
    homeValueProp.imageFallback,
    ...homeCapabilities.items.map((item) => item.imageFallback),
    ...homeWhyChooseUs.items.map((item) => item.imageFallback),
    ...homeSpecialties.items.map((item) => item.imageFallback),
    homeJoinCta.imageFallback,
    ...HERO_SLIDES.map((slide) => slide.src)
  ]
  return urls
}

/**
 * All static homepage fallback photo IDs — reserved so API fetches
 * never assign the same Unsplash photo to two different slots.
 */
export const getHomepageReservedPhotoIds = () => {
  const ids = new Set()
  for (const url of collectFallbackUrls()) {
    const id = extractUnsplashPhotoId(url)
    if (id) ids.add(id)
  }
  return ids
}

export default getHomepageReservedPhotoIds
