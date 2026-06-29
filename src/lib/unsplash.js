import { HERO_SLIDES as FALLBACK_SLIDES } from '../data/heroSlides'
import {
  getHomepageReservedPhotoIds,
  extractUnsplashPhotoId
} from '../data/homeImageRegistry'
import {
  CONTACT_HERO_FALLBACK,
  CONTACT_HERO_QUERY
} from '../data/contactHero'
import { readMediaCache, writeMediaCache } from './mediaCache'

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
const HERO_SLIDES_CACHE_KEY = 'unsplash_hero_slides_v3'
const DESKTOP_IMAGE_WIDTH = 1200
const MOBILE_IMAGE_WIDTH = 800

const SEARCH_QUERIES = [
  { query: 'orthopaedic surgery', eyebrow: 'Clinical excellence' },
  { query: 'orthopaedic surgeon', eyebrow: 'Surgeon partnership' },
  { query: 'orthopaedic operating theatre', eyebrow: 'Operating theatre' },
  { query: 'hip replacement', eyebrow: 'Arthroplasty solutions' },
  { query: 'spine orthopaedic', eyebrow: 'Spine & trauma' },
  { query: 'joint physiotherapy rehabilitation', eyebrow: 'Patient pathways' }
]

const TARGET_SLIDE_COUNT = SEARCH_QUERIES.length
const PHOTOS_PER_QUERY = 5
const SECTION_PHOTOS_PER_QUERY = 5

/** Session-wide registry — hero + all homepage sections share this set. */
const sessionUsedPhotoIds = new Set()
let homepageFallbacksReserved = false

const ensureHomepageFallbacksReserved = () => {
  if (homepageFallbacksReserved) return
  getHomepageReservedPhotoIds().forEach((id) => sessionUsedPhotoIds.add(id))
  homepageFallbacksReserved = true
}

const getPhotoKeys = (photoOrSrc) => {
  const keys = new Set()
  if (!photoOrSrc) return keys

  if (typeof photoOrSrc === 'string') {
    const slug = extractUnsplashPhotoId(photoOrSrc)
    if (slug) keys.add(slug)
    else keys.add(photoOrSrc)
    return keys
  }

  if (photoOrSrc.id) keys.add(photoOrSrc.id)
  const slug = extractUnsplashPhotoId(photoOrSrc.urls?.raw || photoOrSrc.src)
  if (slug) keys.add(slug)
  return keys
}

const isPhotoAvailable = (photoOrSrc) => {
  const keys = getPhotoKeys(photoOrSrc)
  if (keys.size === 0) return false
  return [...keys].every((key) => !sessionUsedPhotoIds.has(key))
}

const claimPhoto = (photoOrSrc) => {
  const keys = getPhotoKeys(photoOrSrc)
  if (keys.size === 0 || !isPhotoAvailable(photoOrSrc)) return false
  keys.forEach((key) => sessionUsedPhotoIds.add(key))
  return true
}

const UNSPLASH_HEADERS = () => ({
  Authorization: `Client-ID ${ACCESS_KEY}`,
  'Accept-Version': 'v1'
})

const buildImageUrl = (rawUrl, width) =>
  `${rawUrl}&auto=format&fit=crop&w=${width}&q=80`

const mapPhotoCredit = (photo) => ({
  name: photo.user?.name || 'Unsplash',
  url: `${photo.user?.links?.html || photo.links?.html}?utm_source=orthohouse_uk&utm_medium=referral`
})

const mapPhotoToSlide = (photo, eyebrow) => ({
  id: photo.id,
  eyebrow,
  src: buildImageUrl(photo.urls.raw, DESKTOP_IMAGE_WIDTH),
  srcMobile: buildImageUrl(photo.urls.raw, MOBILE_IMAGE_WIDTH),
  alt:
    photo.alt_description ||
    photo.description ||
    'Orthopaedic surgery and clinical excellence imagery',
  credit: mapPhotoCredit(photo)
})

const mapPhotoToHeroImage = (photo, altFallback) => ({
  id: photo.id,
  src: buildImageUrl(photo.urls.raw, DESKTOP_IMAGE_WIDTH),
  srcMobile: buildImageUrl(photo.urls.raw, MOBILE_IMAGE_WIDTH),
  alt: photo.alt_description || photo.description || altFallback,
  credit: mapPhotoCredit(photo)
})

const mapPhotoToSectionImage = (photo, altFallback, width = 960) => ({
  id: photo.id,
  src: buildImageUrl(photo.urls.raw, width),
  srcMobile: buildImageUrl(photo.urls.raw, Math.min(width, 640)),
  alt: photo.alt_description || photo.description || altFallback,
  credit: mapPhotoCredit(photo)
})

/** Pick the first API result whose photo id is not already used on the homepage. */
const pickUniquePhoto = (photos, mapper) => {
  for (const photo of photos) {
    if (claimPhoto(photo)) {
      return mapper(photo)
    }
  }
  return null
}

/** Keep first occurrence of each Unsplash photo (by API id or CDN slug). */
const dedupeSlidesByPhotoId = (slides) => {
  const seen = new Set()
  return slides.filter((slide) => {
    const keys = getPhotoKeys(slide)
    if (keys.size === 0) return false
    if ([...keys].some((key) => seen.has(key))) return false
    keys.forEach((key) => seen.add(key))
    return true
  })
}

/** Pad with static fallbacks when the API returns too few unique photos. */
const fillSlidesToTarget = (slides, target = TARGET_SLIDE_COUNT) => {
  if (slides.length >= target) return slides.slice(0, target)

  const seenKeys = new Set()
  slides.forEach((slide) => {
    getPhotoKeys(slide).forEach((key) => seenKeys.add(key))
  })

  const filled = [...slides]

  for (const fallback of FALLBACK_SLIDES) {
    if (filled.length >= target) break

    const keys = getPhotoKeys(fallback)
    if ([...keys].some((key) => seenKeys.has(key))) continue

    filled.push(fallback)
    keys.forEach((key) => seenKeys.add(key))
  }

  return filled
}

const searchPhotos = async (query, perPage = 1) => {
  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    orientation: 'landscape'
  })

  const response = await fetch(
    `https://api.unsplash.com/search/photos?${params}`,
    { headers: UNSPLASH_HEADERS() }
  )

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status}`)
  }

  const data = await response.json()
  return data.results ?? []
}

const resolveSectionFallback = (fallback, altFallback) => {
  if (typeof fallback === 'string') {
    return { src: fallback, alt: altFallback }
  }
  return fallback
}

/**
 * Fetches a single landscape hero image from Unsplash for inner pages.
 * Falls back to the provided static image when the key is missing or the API fails.
 */
export async function fetchPageHeroImage(
  query,
  fallback,
  { perPage = 1 } = {}
) {
  if (!ACCESS_KEY) {
    if (import.meta.env.DEV) {
      console.warn(`VITE_UNSPLASH_ACCESS_KEY not set — using static image for "${query}".`)
    }
    return fallback
  }

  try {
    const photos = await searchPhotos(query, perPage)
    if (photos.length === 0) return fallback
    return mapPhotoToHeroImage(photos[0], fallback.alt)
  } catch (err) {
    console.warn(`Failed to fetch Unsplash image for "${query}":`, err)
    return fallback
  }
}

export function fetchContactHeroImage() {
  return fetchPageHeroImage(CONTACT_HERO_QUERY, CONTACT_HERO_FALLBACK)
}

/**
 * Fetches a single editorial/section image from Unsplash.
 * Falls back to the provided static URL when the key is missing or the API fails.
 */
export async function fetchSectionImage(
  query,
  fallback,
  { perPage = SECTION_PHOTOS_PER_QUERY, width = 960, reserveHomepage = true } = {}
) {
  const altFallback =
    typeof fallback === 'string' ? 'Orthopaedic healthcare imagery' : fallback.alt

  const staticFallback = resolveSectionFallback(fallback, altFallback)

  if (reserveHomepage) {
    ensureHomepageFallbacksReserved()
  }

  if (!ACCESS_KEY) {
    if (import.meta.env.DEV) {
      console.warn(`VITE_UNSPLASH_ACCESS_KEY not set — using static image for "${query}".`)
    }
    return staticFallback
  }

  try {
    const photos = await searchPhotos(query, perPage)
    if (photos.length === 0) return staticFallback

    const unique = pickUniquePhoto(photos, (photo) =>
      mapPhotoToSectionImage(photo, altFallback, width)
    )

    return unique ?? staticFallback
  } catch (err) {
    console.warn(`Failed to fetch Unsplash section image for "${query}":`, err)
    return staticFallback
  }
}

/**
 * Batch-fetch section images keyed by item id.
 * Fetched sequentially so each slot can skip photos already used on the homepage.
 * Each spec: { id, imageQuery, imageFallback, imageAlt? }
 */
export async function fetchSectionImages(specs, options = {}) {
  ensureHomepageFallbacksReserved()

  const cacheKey = `unsplash_sections_${specs.map((s) => s.id).join('_')}`
  const cached = readMediaCache(cacheKey)
  if (cached) return cached

  const result = {}

  for (const { id, imageQuery, imageFallback, imageAlt } of specs) {
    const fallback = {
      src: imageFallback,
      alt: imageAlt || 'Orthopaedic healthcare imagery'
    }
    const image = await fetchSectionImage(imageQuery, fallback, {
      ...options,
      reserveHomepage: false
    })
    result[id] = image
  }

  writeMediaCache(cacheKey, result)
  return result
}

/**
 * Fetches curated orthopedic hero imagery from Unsplash.
 * Falls back to static URLs in heroSlides.js when the key is missing or the API fails.
 */
export async function fetchHeroSlides() {
  ensureHomepageFallbacksReserved()

  const cached = readMediaCache(HERO_SLIDES_CACHE_KEY)
  if (cached?.length) return cached

  if (!ACCESS_KEY) {
    if (import.meta.env.DEV) {
      console.warn('VITE_UNSPLASH_ACCESS_KEY not set — using static hero slides.')
    }
    return FALLBACK_SLIDES
  }

  try {
    const candidates = []

    for (const { query, eyebrow } of SEARCH_QUERIES) {
      const photos = await searchPhotos(query, PHOTOS_PER_QUERY)
      const batch = photos
        .map((photo) => mapPhotoToSlide(photo, eyebrow))
        .filter((slide) => claimPhoto(slide))
      candidates.push(...batch)
    }

    const uniqueSlides = dedupeSlidesByPhotoId(candidates)
    const slides = fillSlidesToTarget(uniqueSlides)
    const result = slides.length > 0 ? slides : FALLBACK_SLIDES

    writeMediaCache(HERO_SLIDES_CACHE_KEY, result)
    return result
  } catch (err) {
    console.warn('Failed to fetch Unsplash hero slides:', err)
    return FALLBACK_SLIDES
  }
}

export default fetchHeroSlides
