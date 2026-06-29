import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { HERO_SLIDES as FALLBACK_SLIDES } from '../../data/heroSlides'

const AUTOPLAY_DELAY_MS = 5500
const FADE_MS = 1200

/** Reactively tracks `prefers-reduced-motion`. */
const usePrefersReducedMotion = () => {
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

/**
 * Full-bleed background slider for the homepage hero.
 * Pure React crossfade — avoids Swiper fade + absolute-position slide bugs.
 * Calls onSlideChange(index) so the parent can sync the eyebrow label.
 */
const HeroSlider = ({ slides, onSlideChange }) => {
  const slideList = useMemo(
    () => (slides?.length ? slides : FALLBACK_SLIDES),
    [slides]
  )
  const slideCount = slideList.length

  const reduced = usePrefersReducedMotion()
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const activeIdxRef = useRef(0)

  useEffect(() => {
    activeIdxRef.current = 0
    setActiveIdx(0)
    onSlideChange?.(0)
  }, [slideList, onSlideChange])

  const goTo = useCallback((index) => {
    const next = ((index % slideCount) + slideCount) % slideCount
    if (next === activeIdxRef.current) return
    activeIdxRef.current = next
    setActiveIdx(next)
    onSlideChange?.(next)
  }, [slideCount, onSlideChange])

  const goNext = useCallback(() => {
    goTo(activeIdxRef.current + 1)
  }, [goTo])

  const goPrev = useCallback(() => {
    goTo(activeIdxRef.current - 1)
  }, [goTo])

  // Autoplay — reset timer whenever the active slide or pause state changes.
  useEffect(() => {
    if (reduced || paused) return undefined

    const timer = window.setInterval(goNext, AUTOPLAY_DELAY_MS)
    return () => window.clearInterval(timer)
  }, [reduced, paused, activeIdx, goNext])

  // Pause autoplay while the user hovers/focuses the hero; resume on leave.
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
        className="hero-slider"
        role="region"
        aria-roledescription="carousel"
        aria-label="Hero imagery — OrthoHouse UK"
      >
        {slideList.map((slide, index) => {
          const isActive = index === activeIdx
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
              <div className="hero-slide-media">
                <img
                  className="hero-slide-img"
                  src={slide.src}
                  srcSet={`${slide.srcMobile} 800w, ${slide.src} 1920w`}
                  sizes="100vw"
                  alt={slide.alt}
                  width={1920}
                  height={1080}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchpriority={index === 0 ? 'high' : 'low'}
                  decoding={index === 0 ? 'auto' : 'async'}
                  draggable={false}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Controls sit above .container (z-index 2) — see Hero.css */}
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

      <div
        className="hero-slider-dots"
        role="tablist"
        aria-label="Choose a slide"
      >
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
                style={{ animationDuration: `${AUTOPLAY_DELAY_MS}ms` }}
                key={`progress-${activeIdx}`}
              />
            )}
          </button>
        ))}
      </div>

      {slideList[activeIdx]?.credit && (
        <a
          href={slideList[activeIdx].credit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hero-slide-credit"
          aria-label={`Photo by ${slideList[activeIdx].credit.name} on Unsplash`}
        >
          Photo by {slideList[activeIdx].credit.name} on Unsplash
        </a>
      )}
    </>
  )
}

export default HeroSlider
