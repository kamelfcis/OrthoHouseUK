import { HERO_SLIDES as FALLBACK_SLIDES } from '../data/heroSlides'

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY

const SEARCH_QUERIES = [
  { query: 'orthopedic surgery', eyebrow: 'Clinical Excellence' },
  { query: 'prosthetics rehabilitation', eyebrow: 'Bespoke Prosthetics' },
  { query: 'physiotherapy mobility', eyebrow: 'Rehabilitation & Recovery' },
  { query: 'medical orthopedics', eyebrow: 'Precision Engineering' },
  { query: 'orthopedic prosthetics rehabilitation', eyebrow: 'Patient-Centred Care' }
]

const TARGET_SLIDE_COUNT = SEARCH_QUERIES.length
const PHOTOS_PER_QUERY = 3

const UNSPLASH_HEADERS = () => ({
  Authorization: `Client-ID ${ACCESS_KEY}`,
  'Accept-Version': 'v1'
})

const buildImageUrl = (rawUrl, width) =>
  `${rawUrl}&auto=format&fit=crop&w=${width}&q=80`

const mapPhotoToSlide = (photo, eyebrow) => ({
  id: photo.id,
  eyebrow,
  src: buildImageUrl(photo.urls.raw, 1920),
  srcMobile: buildImageUrl(photo.urls.raw, 800),
  alt:
    photo.alt_description ||
    photo.description ||
    'Orthopedic healthcare and rehabilitation imagery',
  credit: {
    name: photo.user?.name || 'Unsplash',
    url: `${photo.user?.links?.html || photo.links?.html}?utm_source=orthohouse_uk&utm_medium=referral`
  }
})

/** Keep first occurrence of each Unsplash photo id (stable React keys). */
const dedupeSlidesByPhotoId = (slides) => {
  const seen = new Set()
  return slides.filter((slide) => {
    if (!slide?.id || seen.has(slide.id)) return false
    seen.add(slide.id)
    return true
  })
}

/** Pad with static fallbacks when the API returns too few unique photos. */
const fillSlidesToTarget = (slides, target = TARGET_SLIDE_COUNT) => {
  if (slides.length >= target) return slides.slice(0, target)

  const seenIds = new Set(slides.map((slide) => slide.id))
  const filled = [...slides]

  for (const fallback of FALLBACK_SLIDES) {
    if (filled.length >= target) break
    if (seenIds.has(fallback.id)) continue
    filled.push(fallback)
    seenIds.add(fallback.id)
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

/**
 * Fetches curated orthopedic hero imagery from Unsplash.
 * Falls back to static URLs in heroSlides.js when the key is missing or the API fails.
 */
export async function fetchHeroSlides() {
  if (!ACCESS_KEY) {
    if (import.meta.env.DEV) {
      console.warn('VITE_UNSPLASH_ACCESS_KEY not set — using static hero slides.')
    }
    return FALLBACK_SLIDES
  }

  try {
    const batches = await Promise.all(
      SEARCH_QUERIES.map(async ({ query, eyebrow }) => {
        const photos = await searchPhotos(query, PHOTOS_PER_QUERY)
        return photos.map((photo) => mapPhotoToSlide(photo, eyebrow))
      })
    )

    const candidates = batches.flat()
    const uniqueSlides = dedupeSlidesByPhotoId(candidates)
    const slides = fillSlidesToTarget(uniqueSlides)

    return slides.length > 0 ? slides : FALLBACK_SLIDES
  } catch (err) {
    console.warn('Failed to fetch Unsplash hero slides:', err)
    return FALLBACK_SLIDES
  }
}

export default fetchHeroSlides
