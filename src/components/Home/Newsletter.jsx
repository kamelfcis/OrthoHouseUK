import { useState } from 'react'
import { motion } from 'framer-motion'
import { validateEmail } from '../../utils/validation'
import './Newsletter.css'

const Newsletter = () => {
  const [email, setEmail]           = useState('')
  const [status, setStatus]         = useState(null)   // 'success' | 'error' | null
  const [error, setError]           = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      await new Promise((resolve) => setTimeout(resolve, 1000))
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
    <section className="newsletter-section">
      <div className="container">
        <motion.div
          className="newsletter-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="newsletter-text">
            <h2 className="newsletter-title">Stay Updated</h2>
            <p className="newsletter-subtitle">
              Subscribe to our newsletter for the latest news, updates, and insights
              about prosthetics and biomedical engineering.
            </p>
          </div>

          <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <div className="newsletter-input-wrapper">
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                  setStatus(null)
                }}
                className={error ? 'error' : ''}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby="newsletter-status"
                disabled={isSubmitting}
              />
              <button type="submit" className="btn btn-main" disabled={isSubmitting}>
                {isSubmitting ? 'Subscribing…' : 'Subscribe'}
              </button>
            </div>

            <div id="newsletter-status" aria-live="polite" role="status">
              {error && (
                <span className="newsletter-error">
                  <i className="fas fa-exclamation-circle" aria-hidden="true"></i> {error}
                </span>
              )}
              {status === 'success' && (
                <span className="newsletter-success">
                  <i className="fas fa-check-circle" aria-hidden="true"></i> Thank you for subscribing!
                </span>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  )
}

export default Newsletter
