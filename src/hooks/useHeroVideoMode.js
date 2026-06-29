import { useState, useEffect } from 'react'

const NARROW_VIEWPORT_MAX = 991

/** True on narrow viewports — used to pick lower-bandwidth Pexels files, not to disable video. */
export const useIsMobileViewport = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: ${NARROW_VIEWPORT_MAX}px)`).matches
      : false
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${NARROW_VIEWPORT_MAX}px)`)
    const update = () => setIsMobile(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isMobile
}

/** Reactively tracks `prefers-reduced-motion`. */
export const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return reduced
}

/** Motion OK → eligible for inline/background Pexels section videos (all viewports). */
export const useSectionVideoMode = () => {
  const reduced = usePrefersReducedMotion()
  return !reduced
}

/** Motion OK + videos loaded → use Pexels video hero (all viewports). */
export const useHeroVideoMode = (videoSlides) => {
  const canPlayVideo = useSectionVideoMode()
  return Boolean(videoSlides?.length) && canPlayVideo
}

/** Picks desktop or mobile Pexels file based on current viewport width. */
export const useResponsiveVideoSrc = (video) => {
  const isNarrow = useIsMobileViewport()
  if (!video?.videoSrc) return null
  if (isNarrow && video.videoSrcMobile) return video.videoSrcMobile
  return video.videoSrc
}

export default useHeroVideoMode
