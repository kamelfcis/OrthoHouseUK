import { useState, useEffect } from 'react'
import useNearViewport from '../../hooks/useNearViewport'
import SectionHeading from '../common/SectionHeading'
import { homeTestimonials } from '../../content/home'
import { testimonialsPage } from '../../content/testimonials'
import './HomeTestimonials.css'

const DISPLAY_COUNT = 3

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const HomeTestimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ref, inView] = useNearViewport()
  const testimonials = testimonialsPage.items.slice(0, DISPLAY_COUNT)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    if (reduced) return undefined

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 7000)

    return () => clearInterval(interval)
  }, [testimonials.length, reduced])

  if (!testimonials.length) return null

  const current = testimonials[currentIndex]

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

        <div className={`home-testimonials__panel reveal${inView ? ' is-visible' : ''}`}>
          <blockquote
            key={currentIndex}
            className={`home-testimonials__quote${reduced ? '' : ' reveal-crossfade'}`}
          >
            <div className="home-testimonials__rating" aria-label={`${current.rating} out of 5 stars`}>
              {Array.from({ length: current.rating }).map((_, i) => (
                <i key={i} className="fas fa-star" aria-hidden="true" />
              ))}
            </div>
            <p>&ldquo;{current.text}&rdquo;</p>
            <footer className="home-testimonials__author">
              <cite className="home-testimonials__name">{current.name}</cite>
              <span className="home-testimonials__role">{current.role}</span>
            </footer>
          </blockquote>

          <nav className="home-testimonials__nav" aria-label="Testimonial navigation">
            {testimonials.map((item, index) => (
              <button
                key={item.name}
                type="button"
                className={`home-testimonials__dot${index === currentIndex ? ' is-active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={testimonialsPage.navAria(index)}
                aria-current={index === currentIndex ? 'true' : undefined}
              />
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}

export default HomeTestimonials
