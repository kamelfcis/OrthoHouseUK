import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import { testimonialsPage } from '../content/secondary'
import './Testimonials.css'

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const { items } = testimonialsPage

  useEffect(() => {
    window.scrollTo(0, 0)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [items.length])

  return (
    <div className="testimonials-page">
      <SEO
        title={pageSeo.testimonials.title}
        description={pageSeo.testimonials.description}
        keywords={pageSeo.testimonials.keywords}
      />
      <header className="ds-page-hero testimonials-hero">
        <div className="container">
          <h1>{testimonialsPage.hero.title}</h1>
          <p className="ds-page-hero__subtitle">{testimonialsPage.hero.subtitle}</p>
        </div>
      </header>

      <div className="testimonials-content ds-section">
        <div className="container">
          <div className="testimonials-slider" ref={ref}>
            <motion.blockquote
              key={currentIndex}
              className="testimonial-card ds-card"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="testimonial-content">
                <div className="testimonial-rating" aria-label={`${items[currentIndex].rating} out of 5 stars`}>
                  {[...Array(items[currentIndex].rating)].map((_, i) => (
                    <i key={i} className="fas fa-star" aria-hidden="true" />
                  ))}
                </div>
                <p className="testimonial-text">&ldquo;{items[currentIndex].text}&rdquo;</p>
                <footer className="testimonial-author">
                  <div className="author-info">
                    <cite className="author-name">{items[currentIndex].name}</cite>
                    <p className="author-role">{items[currentIndex].role}</p>
                  </div>
                </footer>
              </div>
            </motion.blockquote>

            <div className="testimonial-nav" role="tablist" aria-label="Testimonials">
              {items.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  className={`nav-dot${index === currentIndex ? ' active' : ''}`}
                  onClick={() => setCurrentIndex(index)}
                  aria-selected={index === currentIndex}
                  aria-label={`Testimonial ${index + 1} of ${items.length}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Testimonials
