import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import useNearViewport from '../../hooks/useNearViewport'
import { usePrefersReducedMotion } from '../../hooks/useHeroVideoMode'
import SectionHeading from '../common/SectionHeading'
import { homeTestimonials } from '../../content/home'
import { testimonialsPage } from '../../content/testimonials'
import './HomeTestimonials.css'

const DISPLAY_COUNT = 3
const AUTOPLAY_MS = 7000
const RING_RADIUS = 8
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const canFinePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches

const HomeTestimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [ref, inView] = useNearViewport()
  const stageRef = useRef(null)
  const reduced = usePrefersReducedMotion()
  const tiltCapable = useMemo(canFinePointer, [])

  const testimonials = useMemo(() => testimonialsPage.items.slice(0, DISPLAY_COUNT), [])
  const total = testimonials.length

  const goTo = useCallback(
    (index) => {
      const next = ((index % total) + total) % total
      const diff = ((next - currentIndex) % total + total) % total
      setDirection(diff <= total / 2 ? 1 : -1)
      setCurrentIndex(next)
    },
    [currentIndex, total]
  )

  useEffect(() => {
    if (reduced || paused || total <= 1) return undefined

    const timer = window.setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % total)
    }, AUTOPLAY_MS)

    return () => window.clearInterval(timer)
  }, [reduced, paused, total, currentIndex])

  const handleMouseMove = useCallback(
    (event) => {
      if (reduced || !tiltCapable || !stageRef.current) return
      const rect = stageRef.current.getBoundingClientRect()
      const relX = (event.clientX - rect.left) / rect.width - 0.5
      const relY = (event.clientY - rect.top) / rect.height - 0.5
      setTilt({ x: relY * -7, y: relX * 9 })
    },
    [reduced, tiltCapable]
  )

  const resetTilt = useCallback(() => setTilt({ x: 0, y: 0 }), [])

  const handlePauseOn = useCallback(() => setPaused(true), [])
  const handlePauseOff = useCallback(
    (event) => {
      if (event?.currentTarget && event.relatedTarget && event.currentTarget.contains(event.relatedTarget)) {
        return
      }
      setPaused(false)
    },
    []
  )

  const handleNavKeyDown = useCallback(
    (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goTo(currentIndex + 1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goTo(currentIndex - 1)
      }
    },
    [currentIndex, goTo]
  )

  if (!total) return null

  const current = testimonials[currentIndex]
  const stageStyle =
    !reduced && tiltCapable
      ? { '--tilt-x': `${tilt.x}deg`, '--tilt-y': `${tilt.y}deg` }
      : undefined

  return (
    <section
      className="home-testimonials ds-section ds-section--muted"
      ref={ref}
      aria-labelledby="home-testimonials-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeTestimonials.eyebrow}
          title={homeTestimonials.title}
          subtitle={homeTestimonials.subtitle}
          titleId="home-testimonials-heading"
        />

        <div
          className={`home-testimonials__panel reveal${inView ? ' is-visible' : ''}`}
          onMouseEnter={handlePauseOn}
          onMouseLeave={handlePauseOff}
          onFocus={handlePauseOn}
          onBlur={handlePauseOff}
        >
          <div
            className="home-testimonials__stage"
            ref={stageRef}
            style={stageStyle}
            onMouseMove={handleMouseMove}
            onMouseLeave={resetTilt}
          >
            <span className="home-testimonials__glow home-testimonials__glow--a" aria-hidden="true" />
            <span className="home-testimonials__glow home-testimonials__glow--b" aria-hidden="true" />

            <blockquote
              key={currentIndex}
              className={`home-testimonials__quote${reduced ? '' : ' is-animated'}`}
              style={reduced ? undefined : { '--dir': direction }}
            >
              <i className="fas fa-quote-left home-testimonials__quote-glyph" aria-hidden="true" />

              <div
                className="home-testimonials__content"
                aria-live="polite"
                aria-atomic="true"
              >
                <div
                  className="home-testimonials__rating"
                  aria-label={`${current.rating} out of 5 stars`}
                >
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <i
                      key={i}
                      className="fas fa-star"
                      aria-hidden="true"
                      style={reduced ? undefined : { '--i': i }}
                    />
                  ))}
                </div>

                <p>&ldquo;{current.text}&rdquo;</p>

                <span className="home-testimonials__divider" aria-hidden="true" />

                <footer className="home-testimonials__author">
                  <cite className="home-testimonials__name">{current.name}</cite>
                  <span className="home-testimonials__role">{current.role}</span>
                </footer>
              </div>
            </blockquote>
          </div>

          <nav
            className="home-testimonials__nav"
            aria-label="Testimonial navigation"
            onKeyDown={handleNavKeyDown}
          >
            {testimonials.map((item, index) => (
              <button
                key={item.name}
                type="button"
                className={`home-testimonials__dot${index === currentIndex ? ' is-active' : ''}`}
                onClick={() => goTo(index)}
                aria-label={testimonialsPage.navAria(index)}
                aria-current={index === currentIndex ? 'true' : undefined}
              >
                {index === currentIndex && !reduced && (
                  <svg
                    className="home-testimonials__dot-ring"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    key={`ring-${currentIndex}`}
                  >
                    <circle
                      className="home-testimonials__dot-ring-track"
                      cx="10"
                      cy="10"
                      r={RING_RADIUS}
                    />
                    <circle
                      className="home-testimonials__dot-ring-fill"
                      cx="10"
                      cy="10"
                      r={RING_RADIUS}
                      style={{
                        strokeDasharray: RING_CIRCUMFERENCE,
                        strokeDashoffset: RING_CIRCUMFERENCE,
                        animationDuration: `${AUTOPLAY_MS}ms`,
                        animationPlayState: paused ? 'paused' : 'running'
                      }}
                    />
                  </svg>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}

export default HomeTestimonials
