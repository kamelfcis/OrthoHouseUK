import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import SEO from '../components/SEO/SEO'
import { siteName } from '../content/site'
import './FaqMedia.css'

const ease = [0.22, 1, 0.36, 1]

const isSafeMediaSrc = (raw) => {
  if (!raw || typeof raw !== 'string') return false
  const trimmed = raw.trim()
  if (!trimmed) return false
  if (/^(javascript|data|vbscript|blob):/i.test(trimmed)) return false

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true
  }

  try {
    const url = new URL(trimmed, window.location.origin)
    return url.origin === window.location.origin
  } catch {
    return false
  }
}

const resolveMediaSrc = (raw) => {
  if (!isSafeMediaSrc(raw)) return null
  const trimmed = raw.trim()
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed
  }
  try {
    const url = new URL(trimmed, window.location.origin)
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

const FaqMedia = () => {
  const [searchParams] = useSearchParams()
  const prefersReducedMotion = useReducedMotion()
  const rawSrc = searchParams.get('src') || ''
  const title = (searchParams.get('title') || '').trim()
  const safeSrc = useMemo(() => resolveMediaSrc(rawSrc), [rawSrc])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        window.location.assign('/faqs')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const pageTitle = title || 'FAQ illustration'

  return (
    <div className="faq-media-page">
      <SEO
        title={pageTitle}
        description="View the FAQ illustration in a dedicated viewer."
      />

      <div className="faq-media-page__backdrop" aria-hidden="true" />
      <div className="faq-media-page__grain" aria-hidden="true" />

      <div className="faq-media-page__shell">
        <motion.header
          className="faq-media-page__toolbar"
          initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
        >
          <Link to="/faqs" className="faq-media-page__back">
            <i className="fas fa-arrow-left" aria-hidden="true" />
            <span>Back to FAQs</span>
          </Link>
          <p className="faq-media-page__brand">{siteName}</p>
        </motion.header>

        {safeSrc ? (
          <motion.figure
            className="faq-media-page__stage"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease, delay: prefersReducedMotion ? 0 : 0.06 }}
          >
            <div className="faq-media-page__frame">
              <motion.img
                className="faq-media-page__image"
                src={safeSrc}
                alt={title || 'FAQ illustration'}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease, delay: prefersReducedMotion ? 0 : 0.18 }}
              />
            </div>
            {title ? (
              <figcaption className="faq-media-page__caption">{title}</figcaption>
            ) : null}
          </motion.figure>
        ) : (
          <motion.div
            className="faq-media-page__empty"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            role="status"
          >
            <p className="faq-media-page__empty-title">Illustration unavailable</p>
            <p className="faq-media-page__empty-text">
              This media link is missing or not allowed. Return to the FAQs to continue.
            </p>
            <Link to="/faqs" className="faq-media-page__empty-cta">
              Back to FAQs
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default FaqMedia
