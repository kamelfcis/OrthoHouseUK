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
  index
}) {
  const videoRef = useRef(null)
  const resolvedSrc = useResponsiveVideoSrc(isVideo ? slide : null)
  const shouldAttachVideo = isVideo && (isActive || isNext)

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
    const poster = slide.poster || slide.src

    return (
      <div className="hero-slide-media">
        {shouldAttachVideo ? (
          <video
            ref={videoRef}
            className="hero-slide-video"
            src={resolvedSrc}
            poster={poster}
            muted
            playsInline
            autoPlay={isActive && !reduced}
            loop
            preload={isActive ? 'metadata' : 'none'}
            aria-hidden="true"
            tabIndex={-1}
          />
        ) : (
          <img
            className="hero-slide-img hero-slide-img--poster"
            src={poster}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        )}
        {!isActive && shouldAttachVideo && poster && (
          <img
            className="hero-slide-img hero-slide-img--poster"
            src={poster}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        )}
      </div>
    )
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

  useEffect(() => {
    activeIdxRef.current = 0
    setActiveIdx(0)
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

  const goPrev = useCallback(() => {
    goTo(activeIdxRef.current - 1)
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
  const activeSlide = slideList[activeIdx]
  const creditSource = isVideoCarousel ? 'Pexels' : 'Unsplash'

  return (
    <>
      <div
        className={`hero-slider${isVideoCarousel ? ' hero-slider--video' : ''}`}
        role="region"
        aria-roledescription="carousel"
        aria-label="Hero imagery — OrthoHouse UK"
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
              />
            </div>
          )
        })}
      </div>

      {slideCount > 1 && (
        <div className="hero-slider-nav" aria-hidden="false">
          <button
            type="button"
            className="hero-slider-nav-btn hero-slider-nav-btn--prev"
            aria-label="Previous hero slide"
            onClick={goPrev}
          >
            <i className="fas fa-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="hero-slider-nav-btn hero-slider-nav-btn--next"
            aria-label="Next hero slide"
            onClick={goNext}
          >
            <i className="fas fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      )}

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

      {activeSlide?.credit && (
        <a
          href={activeSlide.credit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hero-slide-credit"
          aria-label={`${isVideoCarousel ? 'Video' : 'Photo'} by ${activeSlide.credit.name} on ${creditSource}`}
        >
          {isVideoCarousel ? 'Video' : 'Photo'} by {activeSlide.credit.name} on {creditSource}
        </a>
      )}
    </>
  )
}

export default memo(HeroSlider)
