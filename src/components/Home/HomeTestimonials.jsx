import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import SectionHeading from '../common/SectionHeading'
import { homeTestimonials } from '../../content/home'
import { testimonialsPage } from '../../content/testimonials'
import './HomeTestimonials.css'

const DISPLAY_COUNT = 3

const HomeTestimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 })
  const prefersReducedMotion = useReducedMotion()
  const testimonials = testimonialsPage.items.slice(0, DISPLAY_COUNT)

  useEffect(() => {
    if (prefersReducedMotion) return undefined

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 7000)

    return () => clearInterval(interval)
  }, [testimonials.length, prefersReducedMotion])

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

        <div className="home-testimonials__panel">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={currentIndex}
              className="home-testimonials__quote"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
            </motion.blockquote>
          </AnimatePresence>

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
