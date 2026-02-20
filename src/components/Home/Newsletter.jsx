import { useState } from 'react'
import { motion } from 'framer-motion'
import { validateEmail } from '../../utils/validation'
import './Newsletter.css'

const Newsletter = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // 'success', 'error', null
  const [error, setError] = useState('')

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

    try {
      // Simulate API call - Replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStatus('success')
      setEmail('')
      
      // Reset status after 5 seconds
      setTimeout(() => setStatus(null), 5000)
    } catch (err) {
      setStatus('error')
      setError('Something went wrong. Please try again.')
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
          transition={{ duration: 0.6 }}
        >
          <div className="newsletter-text">
            <h2 className="newsletter-title">Stay Updated</h2>
            <p className="newsletter-subtitle">
              Subscribe to our newsletter for the latest news, updates, and insights 
              about prosthetics and biomedical engineering.
            </p>
          </div>
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <div className="newsletter-input-wrapper">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                  setStatus(null)
                }}
                className={error ? 'error' : ''}
              />
              <button type="submit" className="btn btn-main">
                Subscribe
              </button>
            </div>
            {error && <span className="newsletter-error">{error}</span>}
            {status === 'success' && (
              <span className="newsletter-success">
                <i className="fas fa-check-circle"></i> Thank you for subscribing!
              </span>
            )}
            {status === 'error' && (
              <span className="newsletter-error">
                <i className="fas fa-exclamation-circle"></i> Something went wrong. Please try again.
              </span>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  )
}

export default Newsletter
