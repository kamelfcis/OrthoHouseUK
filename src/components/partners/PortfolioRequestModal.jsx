import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { partnerDetail } from '../../content/partners'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PortfolioRequestModal = ({ isOpen, onClose, partnerId, partnerName }) => {
  const copy = partnerDetail.portfolioModal ?? {}
  const emailInputRef = useRef(null)
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    emailInputRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setHoneypot('')
      setError('')
      setIsSubmitting(false)
      setIsSuccess(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const resolveErrorMessage = (invokeError, responseData) => {
    const errors = copy.errors ?? {}
    const code = responseData?.code ?? responseData?.error_code
    const message = (
      responseData?.message ??
      responseData?.error ??
      invokeError?.message ??
      ''
    ).toLowerCase()

    if (code === 'rate_limited' || message.includes('rate limit')) {
      return errors.rateLimited
    }
    if (
      code === 'no_portfolio' ||
      code === 'not_available' ||
      message.includes('not available') ||
      message.includes('no pdf')
    ) {
      return errors.notAvailable
    }
    if (code === 'invalid_email' || message.includes('invalid email')) {
      return errors.emailInvalid
    }
    if (code === 'email_sandbox_restricted') {
      return (
        responseData?.message ??
        errors.sandboxRestricted ??
        'Portfolio emails are limited until our email domain is verified.'
      )
    }
    if (code === 'email_send_failed') {
      return responseData?.message ?? errors.generic
    }
    if (invokeError?.name === 'FunctionsFetchError' || message.includes('failed to fetch')) {
      return errors.network
    }

    if (responseData?.message && typeof responseData.message === 'string') {
      return responseData.message
    }

    return errors.generic
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    const errors = copy.errors ?? {}

    if (!trimmedEmail) {
      setError(errors.emailRequired)
      return
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(errors.emailInvalid)
      return
    }

    if (honeypot.trim()) {
      setIsSuccess(true)
      toast.success(copy.successToast)
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('send-portfolio', {
        body: {
          partner_id: partnerId,
          email: trimmedEmail
        }
      })

      if (invokeError) {
        let responseData = data
        if (!responseData && invokeError.context) {
          try {
            responseData = await invokeError.context.json()
          } catch {
            responseData = null
          }
        }
        throw new Error(resolveErrorMessage(invokeError, responseData))
      }

      if (data?.error || data?.success === false) {
        throw new Error(resolveErrorMessage(null, data))
      }

      setIsSuccess(true)
      toast.success(copy.successToast)
    } catch (submitError) {
      const message =
        typeof submitError?.message === 'string' && submitError.message !== '[object Object]'
          ? submitError.message
          : (copy.errors?.generic ?? 'Unable to send portfolio. Please try again.')
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const title =
    typeof copy.title === 'function' ? copy.title(partnerName) : copy.title ?? 'Request portfolio'

  return (
    <div
      className="portfolio-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="portfolio-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolio-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="portfolio-modal-header">
          <h2 id="portfolio-modal-title">{title}</h2>
          <button
            type="button"
            className="portfolio-modal-close"
            onClick={onClose}
            aria-label={copy.close ?? 'Close'}
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        {isSuccess ? (
          <div className="portfolio-modal-body portfolio-modal-body--success">
            <div className="portfolio-modal-success-icon" aria-hidden="true">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>{copy.successTitle ?? 'Check your inbox'}</h3>
            <p>{copy.successMessage ?? 'Your portfolio is on its way.'}</p>
            <button type="button" className="ds-btn ds-btn--primary" onClick={onClose}>
              {copy.done ?? 'Done'}
            </button>
          </div>
        ) : (
          <form className="portfolio-modal-form" onSubmit={handleSubmit} noValidate>
            {copy.subtitle && <p className="portfolio-modal-subtitle">{copy.subtitle}</p>}

            <div className="portfolio-modal-honeypot" aria-hidden="true">
              <label htmlFor="portfolio-company">Company</label>
              <input
                id="portfolio-company"
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
              />
            </div>

            <div className={`ds-form-field${error ? ' is-error' : ''}`}>
              <label className="ds-label" htmlFor="portfolio-email">
                {copy.emailLabel ?? 'Email address'}
              </label>
              <input
                ref={emailInputRef}
                id="portfolio-email"
                type="email"
                name="email"
                className={`ds-input${error ? ' is-error' : ''}`}
                placeholder={copy.emailPlaceholder ?? 'you@company.com'}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (error) setError('')
                }}
                disabled={isSubmitting}
                autoComplete="email"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'portfolio-email-error' : undefined}
              />
              {error && (
                <p id="portfolio-email-error" className="ds-error-text" role="alert">
                  {error}
                </p>
              )}
            </div>

            {copy.privacy && <p className="portfolio-modal-privacy">{copy.privacy}</p>}

            <div className="portfolio-modal-actions">
              <button
                type="button"
                className="ds-btn ds-btn--secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {copy.cancel ?? 'Cancel'}
              </button>
              <button
                type="submit"
                className="ds-btn ds-btn--primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="portfolio-modal-spinner" aria-hidden="true"></span>
                    {copy.submitting ?? 'Sending…'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane" aria-hidden="true"></i>
                    {copy.submit ?? 'Send portfolio'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PortfolioRequestModal
