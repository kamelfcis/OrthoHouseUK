import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react'
import { HERO_SLIDES as FALLBACK_SLIDES } from '../../data/heroSlides'
import {
  useHeroVideoMode,
  usePrefersReducedMotion,
  useResponsiveVideoSrc
} from '../../hooks/useHeroVideoMode'

const AUTOPLAY_DELAY_MS = 5500
const FADE_MS = 1200
const VIDEO_AUTOPLAY_DELAY_MS = 12000

const HeroSlideMedia = memo(function HeroSlideMedia({
  slide,
  isActive,
  isNext,
  isVideo,
  reduced,
  index,
  mounted
}) {
  const videoRef = useRef(null)
  const [videoReady, setVideoReady] = useState(false)
  const resolvedSrc = useResponsiveVideoSrc(isVideo ? slide : null)
  const shouldAttachVideo = isVideo && (isActive || isNext)

  useEffect(() => {
    setVideoReady(false)
  }, [resolvedSrc, isActive])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isVideo || !resolvedSrc || !shouldAttachVideo) return undefined

    if (isActive && !reduced) {
      video.load()
      const playPromise = video.play()
      if (playPromise?.catch) {
        playPromise.catch(() => {})
      }
    } else {
      video.pause()
      if (!isNext) video.currentTime = 0
    }

    return undefined
  }, [isActive, isVideo, reduced, resolvedSrc, shouldAttachVideo, isNext])

  if (isVideo) {
    return (
      <div className="hero-slide-media">
        {shouldAttachVideo && resolvedSrc ? (
          <video
            ref={videoRef}
            className={`hero-slide-video${videoReady ? ' is-ready' : ''}`}
            src={resolvedSrc}
            muted
            playsInline
            autoPlay={isActive && !reduced}
            loop
            preload={isActive ? 'auto' : 'none'}
            onCanPlay={() => setVideoReady(true)}
            aria-hidden="true"
            tabIndex={-1}
          />
        ) : null}
      </div>
    )
  }

  // Slides are stacked in-viewport, so loading="lazy" alone cannot defer them.
  // Only mount images once a slide becomes active or upcoming; keep mounted
  // slides in the DOM so the crossfade to/from them stays smooth.
  if (!mounted) {
    return <div className="hero-slide-media" />
  }

  return (
    <div className="hero-slide-media">
      <img
        className="hero-slide-img"
        src={slide.src}
        srcSet={`${slide.srcMobile} 800w, ${slide.src} 1200w`}
        sizes="100vw"
        alt={slide.alt}
        width={1200}
        height={675}
        loading={index === 0 ? 'eager' : 'lazy'}
        fetchpriority={index === 0 ? 'high' : 'low'}
        decoding={index === 0 ? 'auto' : 'async'}
        draggable={false}
      />
    </div>
  )
})

/**
 * Full-bleed background slider for the homepage hero.
 * Uses Pexels video slides when available (all viewports); falls back to Unsplash images.
 */
const HeroSlider = ({ slides, videoSlides = [], onSlideChange }) => {
  const useVideoMode = useHeroVideoMode(videoSlides)
  const reduced = usePrefersReducedMotion()

  const slideList = useMemo(() => {
    if (useVideoMode) return videoSlides
    return slides?.length ? slides : FALLBACK_SLIDES
  }, [useVideoMode, videoSlides, slides])

  const slideCount = slideList.length
  const isVideoCarousel = useVideoMode && slideList[0]?.type === 'video'

  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const activeIdxRef = useRef(0)

  const nextIdx = useMemo(
    () => (slideCount > 0 ? (activeIdx + 1) % slideCount : 0),
    [activeIdx, slideCount]
  )

  // Indexes whose media has been mounted. Starts with the first slide plus the
  // upcoming one (preloaded during the dwell time); grows as slides are shown
  // and never shrinks, so crossfades to/from shown slides stay seamless.
  const [mountedIdxs, setMountedIdxs] = useState(() => new Set([0, 1]))

  useEffect(() => {
    setMountedIdxs((prev) => {
      if (prev.has(activeIdx) && prev.has(nextIdx)) return prev
      const next = new Set(prev)
      next.add(activeIdx)
      next.add(nextIdx)
      return next
    })
  }, [activeIdx, nextIdx])

  useEffect(() => {
    activeIdxRef.current = 0
    setActiveIdx(0)
    setMountedIdxs(new Set([0, 1]))
    onSlideChange?.(0)
  }, [slideList, onSlideChange])

  const goTo = useCallback(
    (index) => {
      const next = ((index % slideCount) + slideCount) % slideCount
      if (next === activeIdxRef.current) return
      activeIdxRef.current = next
      setActiveIdx(next)
      onSlideChange?.(next)
    },
    [slideCount, onSlideChange]
  )

  const goNext = useCallback(() => {
    goTo(activeIdxRef.current + 1)
  }, [goTo])

  const autoplayDelay = isVideoCarousel ? VIDEO_AUTOPLAY_DELAY_MS : AUTOPLAY_DELAY_MS

  useEffect(() => {
    if (reduced || paused || slideCount <= 1) return undefined

    const timer = window.setInterval(goNext, autoplayDelay)
    return () => window.clearInterval(timer)
  }, [reduced, paused, activeIdx, goNext, autoplayDelay, slideCount])

  useEffect(() => {
    const section = document.querySelector('.hero-section')
    if (!section) return undefined

    const pause = () => setPaused(true)
    const resume = () => setPaused(false)
    const onFocusOut = (event) => {
      if (!section.contains(event.relatedTarget)) resume()
    }

    section.addEventListener('mouseenter', pause)
    section.addEventListener('mouseleave', resume)
    section.addEventListener('focusin', pause)
    section.addEventListener('focusout', onFocusOut)

    return () => {
      section.removeEventListener('mouseenter', pause)
      section.removeEventListener('mouseleave', resume)
      section.removeEventListener('focusin', pause)
      section.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  const fadeDuration = reduced ? 0 : FADE_MS

  return (
    <>
      <div
        className={`hero-slider${isVideoCarousel ? ' hero-slider--video' : ''}`}
        role="region"
        aria-roledescription="carousel"
        aria-label="Hero imagery — ORTHOHOUSE UK"
      >
        {slideList.map((slide, index) => {
          const isActive = index === activeIdx
          const isNext = index === nextIdx
          return (
            <div
              key={slide.id}
              className={`hero-slide${isActive ? ' is-active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${slideCount}: ${slide.eyebrow}`}
              aria-hidden={!isActive}
              style={{ transitionDuration: `${fadeDuration}ms` }}
            >
              <HeroSlideMedia
                slide={slide}
                isActive={isActive}
                isNext={isNext}
                isVideo={isVideoCarousel}
                reduced={reduced}
                index={index}
                mounted={mountedIdxs.has(index)}
              />
            </div>
          )
        })}
      </div>

      {slideCount > 1 && (
        <div className="hero-slider-dots" role="tablist" aria-label="Choose a slide">
          {slideList.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              className={`hero-dot${i === activeIdx ? ' is-active' : ''}`}
              aria-selected={i === activeIdx}
              aria-label={`Go to slide ${i + 1}: ${slide.eyebrow}`}
              onClick={() => goTo(i)}
            >
              {i === activeIdx && !reduced && (
                <span
                  className="hero-dot-progress"
                  aria-hidden="true"
                  style={{ animationDuration: `${autoplayDelay}ms` }}
                  key={`progress-${activeIdx}`}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export default memo(HeroSlider)
