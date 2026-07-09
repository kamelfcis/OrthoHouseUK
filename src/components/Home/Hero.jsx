import { useState, useEffect, memo } from 'react'
import { useInView } from 'react-intersection-observer'
import { HERO_SLIDES } from '../../data/heroSlides'
import { fetchHeroSlides } from '../../lib/unsplash'
import { homeHero } from '../../content/home'
import { nav } from '../../content/site'
import { brandLogos } from '../../data/localAssets'
import HeroSlider from './HeroSlider'
import './Hero.css'

const normalizeHeroTitle = (rawTitle) => {
  if (!rawTitle) return null

  const normalized = rawTitle
    .replace(/Ortho\s*House/gi, 'ORTHOHOUSE')
    .replace(/OrthoHouse/g, 'ORTHOHOUSE')
    .replace(/ORTHO\s+HOUSE/gi, 'ORTHOHOUSE')
    .trim()

  if (!normalized) return null

  if (/^ORTHOHOUSE\s+UK$/i.test(normalized)) {
    return 'ORTHOHOUSE\nUK'
  }

  return normalized
}

const Hero = ({ branchData }) => {
  const [slides, setSlides] = useState(HERO_SLIDES)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchHeroSlides().then((fetched) => {
      if (!cancelled && fetched?.length) setSlides(fetched)
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
  const title =
    normalizeHeroTitle(heroContent.content_title) || homeHero.titleDefault

  const [motionRef, motionInView] = useInView({ triggerOnce: true, threshold: 0.35 })

  return (
    <section className="hero-section" aria-label={homeHero.ariaLabel}>
      <HeroSlider slides={slides} />

      <div className="hero-overlay" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="container">
        <div className="hero-content">
          <div
            className={`hero-content-inner${motionInView ? ' is-visible' : ''}`}
            ref={motionRef}
          >
            <div className="hero-logo-wrap hero-animate-item">
              <img
                src={brandLogos.nav}
                alt={nav.logoAlt}
                className="hero-logo"
                width={200}
                height={114}
                decoding="async"
                fetchpriority="high"
              />
            </div>
            <h1 className="hero-title hero-animate-item" role="presentation">
              {title.split('\n').map((line, index, arr) => (
                <span key={`hero-line-${index}`} className="hero-animate-item">
                  <span className="hero-title__inner">{line}</span>
                  {index < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>
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
