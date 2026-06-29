/**
 * Pexels Video API — healthcare hero backgrounds.
 * https://www.pexels.com/api/documentation/#videos-search
 */

import { readMediaCache, writeMediaCache } from './mediaCache'

const API_KEY = import.meta.env.VITE_PEXELS_API_KEY
const HERO_VIDEOS_CACHE_KEY = 'pexels_hero_videos_v3'

/** Session-wide registry — hero + future sections share this set. */
const sessionUsedVideoIds = new Set()

export const isPexelsConfigured = () => Boolean(API_KEY)

export const getUsedPexelsVideoIds = () => sessionUsedVideoIds

const claimVideo = (videoId) => {
  if (!videoId || sessionUsedVideoIds.has(videoId)) return false
  sessionUsedVideoIds.add(videoId)
  return true
}

const PEXELS_HEADERS = () => ({
  Authorization: API_KEY
})

/** Orthopaedic joint-pain keywords mapped to hero eyebrow labels (max 3 for bandwidth). */
export const HERO_VIDEO_QUERIES = [
  { query: 'orthopaedic joint pain', eyebrow: 'Joint pain' },
  { query: 'knee joint pain rehabilitation', eyebrow: 'Knee rehabilitation' },
  { query: 'joint replacement orthopaedic', eyebrow: 'Joint replacement' }
]

const VIDEOS_PER_QUERY = 4
const MAX_HERO_VIDEOS = HERO_VIDEO_QUERIES.length
const STAGGER_MS = 200
const DESKTOP_PREFERRED_WIDTH = 1280
const DESKTOP_MAX_WIDTH = 1920
const MOBILE_PREFERRED_WIDTH = 640
const MOBILE_MAX_WIDTH = 960

const mapVideoCredit = (video) => ({
  name: video.user?.name || 'Pexels',
  url: video.url || 'https://www.pexels.com/videos/'
})

const qualityRank = (quality, tier) => {
  if (tier === 'mobile') {
    if (quality === 'sd') return 0
    if (quality === 'hd') return 1
    return 2
  }
  if (quality === 'hd') return 0
  if (quality === 'sd') return 1
  return 2
}

/**
 * Prefer landscape MP4 — desktop targets ~1280px HD; mobile prefers SD / smaller HD.
 * @param {'desktop'|'mobile'} tier
 */
export const pickBestVideoFile = (videoFiles = [], { tier = 'desktop' } = {}) => {
  const preferredWidth = tier === 'mobile' ? MOBILE_PREFERRED_WIDTH : DESKTOP_PREFERRED_WIDTH
  const maxWidth = tier === 'mobile' ? MOBILE_MAX_WIDTH : DESKTOP_MAX_WIDTH

  const landscapeMp4 = videoFiles.filter(
    (file) =>
      file.file_type === 'video/mp4' &&
      file.width > file.height &&
      file.width <= maxWidth
  )

  const pool =
    landscapeMp4.length > 0
      ? landscapeMp4
      : videoFiles.filter(
          (file) => file.file_type === 'video/mp4' && file.width > file.height
        )

  if (pool.length === 0) return null

  return pool.sort((a, b) => {
    const aQ = qualityRank(a.quality, tier)
    const bQ = qualityRank(b.quality, tier)
    if (aQ !== bQ) return aQ - bQ

    const aDist = Math.abs(a.width - preferredWidth)
    const bDist = Math.abs(b.width - preferredWidth)
    if (aDist !== bDist) return aDist - bDist

    return tier === 'mobile' ? a.width - b.width : b.width - a.width
  })[0]
}

const mapVideoToSlide = (video, eyebrow) => {
  const desktopFile = pickBestVideoFile(video.video_files, { tier: 'desktop' })
  if (!desktopFile?.link) return null

  const mobileFile =
    pickBestVideoFile(video.video_files, { tier: 'mobile' }) || desktopFile

  const poster =
    video.image ||
    video.video_pictures?.[0]?.picture ||
    video.video_pictures?.[0]?.nr ||
    ''

  return {
    id: `pexels-${video.id}`,
    pexelsId: video.id,
    type: 'video',
    eyebrow,
    videoSrc: desktopFile.link,
    videoSrcMobile: mobileFile.link,
    poster,
    src: poster,
    srcMobile: poster,
    alt:
      video.url?.split('/').pop()?.replace(/-/g, ' ') ||
      `${eyebrow} — healthcare video`,
    credit: mapVideoCredit(video)
  }
}

const searchVideos = async (query, perPage = VIDEOS_PER_QUERY) => {
  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    orientation: 'landscape'
  })

  const response = await fetch(
    `https://api.pexels.com/videos/search?${params}`,
    { headers: PEXELS_HEADERS() }
  )

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`)
  }

  const data = await response.json()
  return data.videos ?? []
}

const pickUniqueVideo = (videos, eyebrow) => {
  for (const video of videos) {
    if (!claimVideo(video.id)) continue
    const slide = mapVideoToSlide(video, eyebrow)
    if (slide) return slide
    sessionUsedVideoIds.delete(video.id)
  }
  return null
}

const resolveSectionVideoFallback = (fallback, altFallback) => {
  if (typeof fallback === 'string') {
    return { src: fallback, alt: altFallback || 'Healthcare video imagery' }
  }
  return fallback
}

const mapVideoToSectionMedia = (video, altFallback) => ({
  type: 'video',
  id: video.id,
  pexelsId: video.pexelsId,
  videoSrc: video.videoSrc,
  videoSrcMobile: video.videoSrcMobile || video.videoSrc,
  poster: video.poster || video.src,
  alt: video.alt || altFallback,
  credit: video.credit
})

/**
 * Fetch a single landscape healthcare video for the given search query.
 * Returns null when the key is missing, the API fails, or no suitable file exists.
 */
export async function fetchPexelsVideo(query, { eyebrow = 'Healthcare', perPage = VIDEOS_PER_QUERY } = {}) {
  if (!API_KEY) {
    if (import.meta.env.DEV) {
      console.warn(`VITE_PEXELS_API_KEY not set — skipping video for "${query}".`)
    }
    return null
  }

  try {
    const videos = await searchVideos(query, perPage)
    return pickUniqueVideo(videos, eyebrow)
  } catch (err) {
    console.warn(`Failed to fetch Pexels video for "${query}":`, err)
    return null
  }
}

/**
 * Fetch curated healthcare hero videos — one unique clip per keyword.
 * Returns an empty array when the key is missing or every query fails.
 */
/**
 * Fetch a single editorial section video from Pexels.
 * Returns null when the key is missing, the API fails, or no unique clip is available.
 */
export async function fetchSectionVideo(
  query,
  fallback,
  { perPage = VIDEOS_PER_QUERY, altFallback = 'Healthcare video imagery' } = {}
) {
  if (!API_KEY) {
    if (import.meta.env.DEV) {
      console.warn(`VITE_PEXELS_API_KEY not set — skipping section video for "${query}".`)
    }
    return null
  }

  const staticFallback = resolveSectionVideoFallback(fallback, altFallback)

  try {
    const video = await fetchPexelsVideo(query, { perPage })
    if (!video) return null
    return mapVideoToSectionMedia(video, staticFallback.alt)
  } catch (err) {
    console.warn(`Failed to fetch Pexels section video for "${query}":`, err)
    return null
  }
}

/**
 * Batch-fetch section videos keyed by item id.
 * Fetched sequentially so each slot skips videos already used on the homepage.
 * Each spec: { id, videoQuery, videoFallback?, imageAlt? }
 */
export async function fetchSectionVideos(specs, options = {}) {
  const cacheKey = `pexels_sections_${specs.map((s) => s.id).join('_')}`
  const cached = readMediaCache(cacheKey)
  if (cached) return cached

  const result = {}

  for (const { id, videoQuery, videoFallback, imageAlt } of specs) {
    const fallback = {
      src: videoFallback,
      alt: imageAlt || 'Healthcare video imagery'
    }
    const video = await fetchSectionVideo(videoQuery, fallback, {
      ...options,
      altFallback: fallback.alt
    })
    if (video) result[id] = video
  }

  writeMediaCache(cacheKey, result)
  return result
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Fetch hero videos sequentially — first clip ASAP, rest staggered to avoid
 * parallel CDN downloads on initial load. Supports progressive UI via onProgress.
 */
export async function fetchHeroVideos({ onProgress } = {}) {
  const cached = readMediaCache(HERO_VIDEOS_CACHE_KEY)
  if (cached?.length) {
    onProgress?.(cached)
    return cached
  }

  if (!API_KEY) {
    if (import.meta.env.DEV) {
      console.warn('VITE_PEXELS_API_KEY not set — hero will use Unsplash image slides.')
    }
    return []
  }

  try {
    const slides = []

    for (const { query, eyebrow } of HERO_VIDEO_QUERIES.slice(0, MAX_HERO_VIDEOS)) {
      const videos = await searchVideos(query, VIDEOS_PER_QUERY)
      const slide = pickUniqueVideo(videos, eyebrow)
      if (slide) {
        slides.push(slide)
        onProgress?.([...slides])
      }
      if (slides.length < MAX_HERO_VIDEOS) {
        await delay(STAGGER_MS)
      }
    }

    if (slides.length > 0) {
      writeMediaCache(HERO_VIDEOS_CACHE_KEY, slides)
      return slides
    }
    return []
  } catch (err) {
    console.warn('Failed to fetch Pexels hero videos:', err)
    return []
  }
}

export default fetchHeroVideos
