import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import { validateEmail } from '../../utils/validation'
import { homeJoinCta } from '../../data/homeContent'
import './HomeJoinCta.css'

const HomeJoinCta = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })
  const prefersReducedMotion = useReducedMotion()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 30 },
        animate: inView ? { opacity: 1, y: 0 } : {},
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Please enter your email address')
      return
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setStatus('success')
      setEmail('')
      setTimeout(() => setStatus(null), 5000)
    } catch {
      setStatus('error')
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      className="home-join-cta ds-section"
      ref={ref}
      aria-labelledby="home-join-heading"
    >
      <div className="container">
        <motion.div className="home-join-cta__panel" {...motionProps}>
          <div className="home-join-cta__content">
            <span className="ds-eyebrow home-join-cta__eyebrow">{homeJoinCta.eyebrow}</span>
            <h2 id="home-join-heading" className="home-join-cta__title">
              {homeJoinCta.title}
            </h2>
            <p className="home-join-cta__tagline">{homeJoinCta.tagline}</p>

            <ul className="home-join-cta__bullets">
              {homeJoinCta.bullets.map((bullet) => (
                <li key={bullet}>
                  <i className="fas fa-check" aria-hidden="true" />
                  {bullet}
                </li>
              ))}
            </ul>

            <address className="home-join-cta__office">
              <strong>{homeJoinCta.office.label}</strong>
              <span>{homeJoinCta.office.address}</span>
            </address>

            <div className="home-join-cta__actions">
              <Link to={homeJoinCta.office.contactLink} className="btn btn-main">
                Contact Us
              </Link>
              <Link to="/about" className="btn btn-outline-white">
                Learn about us
              </Link>
            </div>
          </div>

          <div className="home-join-cta__form-wrap">
            <h3 className="home-join-cta__form-title">Stay in touch</h3>
            <p className="home-join-cta__form-subtitle">
              Get updates on careers, events, and orthopaedic innovation.
            </p>
            <form className="home-join-cta__form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="join-cta-email" className="sr-only">Email address</label>
              <input
                id="join-cta-email"
                type="email"
                autoComplete="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                  setStatus(null)
                }}
                className={error ? 'has-error' : ''}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby="join-cta-status"
                disabled={isSubmitting}
              />
              <button type="submit" className="btn btn-main" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Subscribe'}
              </button>
              <div id="join-cta-status" aria-live="polite" role="status" className="home-join-cta__status">
                {error && <span className="home-join-cta__error">{error}</span>}
                {status === 'success' && (
                  <span className="home-join-cta__success">Thank you — we&apos;ll be in touch!</span>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default HomeJoinCta
