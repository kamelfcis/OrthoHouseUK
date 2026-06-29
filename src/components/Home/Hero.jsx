import { useState, useEffect, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { HERO_SLIDES } from '../../data/heroSlides'
import { fetchHeroSlides } from '../../lib/unsplash'
import { fetchHeroVideos, isPexelsConfigured } from '../../lib/pexels'
import { runWhenIdle } from '../../lib/idle'
import { useHeroVideoMode } from '../../hooks/useHeroVideoMode'
import { homeHero } from '../../content/home'
import HeroSlider from './HeroSlider'
import './Hero.css'

const HERO_SUBTITLE_UK = homeHero.subtitleUk

const HERO_SUBTITLE_DEFAULT = homeHero.subtitleDefault

/** Correct known Supabase casing for UK hero subtitle (DB cannot be edited here). */
const normalizeHeroSubtitle = (text, branchCode) => {
  const trimmed = text?.trim()
  if (!trimmed) {
    return branchCode === 'UK' ? HERO_SUBTITLE_UK : HERO_SUBTITLE_DEFAULT
  }
  if (
    branchCode === 'UK' &&
    trimmed.toLowerCase() ===
      'leading orthopedic solutions in the united kingdom. partnering with top medical institutions.'
  ) {
    return HERO_SUBTITLE_UK
  }
  return text
}

const Hero = ({ branchData }) => {
  const [slides, setSlides] = useState(HERO_SLIDES)
  const [videoSlides, setVideoSlides] = useState([])
  const [activeSlide, setActiveSlide] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let cancelled = false
    let cancelIdle = () => {}

    const loadSlides = () => {
      fetchHeroSlides().then((fetched) => {
        if (!cancelled && fetched?.length) setSlides(fetched)
      })
    }

    // When Pexels video hero is available, defer Unsplash refresh (fallback only).
    if (isPexelsConfigured()) {
      cancelIdle = runWhenIdle(loadSlides, { timeout: 4000 })
    } else {
      loadSlides()
    }

    return () => {
      cancelled = true
      cancelIdle()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchHeroVideos({
      onProgress: (partial) => {
        if (!cancelled && partial.length) setVideoSlides(partial)
      }
    }).then((fetched) => {
      if (!cancelled && fetched?.length) setVideoSlides(fetched)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      if (window.scrollY > 80) setScrolled(true)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const heroContent = branchData?.pageContent?.hero || {}
  const branchCode = branchData?.branch?.branch_code
  const branchName = branchData?.branch?.branch_name
  const title =
    heroContent.content_title ||
    (branchName ? `OrthoHouse ${branchName}` : homeHero.titleFallback)
  const subtitle = normalizeHeroSubtitle(heroContent.content_text, branchCode)

  const [motionRef, motionInView] = useInView({ triggerOnce: true, threshold: 0.35 })
  const useVideoMode = useHeroVideoMode(videoSlides)
  const displaySlides = useVideoMode ? videoSlides : slides

  const handleSlideChange = useCallback((index) => {
    setActiveSlide(index)
  }, [])

  return (
    <section className="hero-section" aria-label={homeHero.ariaLabel}>
      <HeroSlider
        slides={slides}
        videoSlides={videoSlides}
        onSlideChange={handleSlideChange}
      />

      <div className="hero-overlay" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="container">
        <div className="hero-content">
          <div
            className={`hero-content-inner${motionInView ? ' is-visible' : ''}`}
            ref={motionRef}
          >
            <span key={`eyebrow-${activeSlide}`} className="hero-eyebrow hero-animate-item">
              {displaySlides[activeSlide]?.eyebrow}
            </span>

            <h1 className="hero-title hero-animate-item" role="presentation">
              {title.split('\n').map((line, index, arr) => (
                <span key={`hero-line-${index}`} className="hero-animate-item">
                  <span className="hero-title__inner">{line}</span>
                  {index < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="hero-subtitle hero-animate-item">{subtitle}</p>

            <div className="hero-buttons hero-animate-item">
              <Link to="/partners" className="btn btn-main">
                {homeHero.ctaPartners}
              </Link>
              <Link to="/contact" className="btn btn-outline">
                {homeHero.ctaContact}
              </Link>
            </div>
          </div>

          {!scrolled && (
            <div className="hero-scroll-indicator" aria-hidden="true">
              <i className="fas fa-chevron-down"></i>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default memo(Hero)
