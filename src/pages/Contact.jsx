import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { fetchContactHeroImage } from '../lib/unsplash'
import { CONTACT_HERO_FALLBACK } from '../data/contactHero'
import { formatPhoneNumber } from '../utils/validation'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import { contactPage } from '../content/contact'
import './Contact.css'

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
}

const Contact = () => {
  const [branchId, setBranchId] = useState(null)
  const [heroImage, setHeroImage] = useState(CONTACT_HERO_FALLBACK)
  const [formData, setFormData] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: null, message: '' })
  const [errors, setErrors] = useState({})
  const [isBranchLoading, setIsBranchLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchUkBranch()
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchContactHeroImage().then((image) => {
      if (!cancelled) setHeroImage(image)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const fetchUkBranch = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('branch_id')
        .eq('branch_code', 'UK')
        .eq('is_active', true)
        .single()

      if (error) throw error
      setBranchId(data?.branch_id || null)
    } catch (error) {
      console.error('Contact: failed to resolve UK branch', error)
      setStatus({
        type: 'error',
        message: contactPage.status.branchError
      })
    } finally {
      setIsBranchLoading(false)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'phone' ? formatPhoneNumber(value) : value
    }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = contactPage.validation.name
    if (!formData.email.trim()) {
      newErrors.email = contactPage.validation.emailRequired
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = contactPage.validation.emailInvalid
    }
    if (!formData.subject.trim()) newErrors.subject = contactPage.validation.subject
    if (!formData.message.trim()) newErrors.message = contactPage.validation.message
    return newErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setStatus({
        type: 'error',
        message: contactPage.validation.reviewFields
      })
      return
    }

    if (!branchId) {
      setStatus({
        type: 'error',
        message: contactPage.status.technicalError
      })
      return
    }

    setIsSubmitting(true)
    setStatus({ type: null, message: '' })

    try {
      const { error } = await supabase.from('contact_messages').insert({
        branch_id: branchId,
        visitor_name: formData.name.trim(),
        visitor_email: formData.email.trim(),
        visitor_phone: formData.phone.trim() || null,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        message_type: 'general',
        status: 'new'
      })

      if (error) throw error

      setFormData(initialFormState)
      setStatus({
        type: 'success',
        message: contactPage.status.success
      })
    } catch (error) {
      console.error('Contact: failed to submit message', error)
      setStatus({
        type: 'error',
        message: contactPage.status.sendError
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (fieldKey) => {
    const field = contactPage.form.fields[fieldKey]
    const hasError = Boolean(errors[fieldKey])
    const errorId = `contact-${fieldKey}-error`

    return (
      <div className={`ds-form-field${hasError ? ' is-error' : ''}`}>
        <label className="ds-label" htmlFor={`contact-${fieldKey}`}>
          {field.label}
          {field.required && <span className="contact-required" aria-hidden="true"> *</span>}
        </label>
        <input
          id={`contact-${fieldKey}`}
          className={`ds-input${hasError ? ' is-error' : ''}`}
          type={fieldKey === 'email' ? 'email' : fieldKey === 'phone' ? 'tel' : 'text'}
          name={fieldKey}
          value={formData[fieldKey]}
          onChange={handleChange}
          placeholder={field.placeholder}
          autoComplete={
            fieldKey === 'name'
              ? 'name'
              : fieldKey === 'email'
                ? 'email'
                : fieldKey === 'phone'
                  ? 'tel'
                  : 'off'
          }
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
        />
        {hasError && (
          <p id={errorId} className="ds-error-text" role="alert">
            {errors[fieldKey]}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="contact-page">
      <SEO
        title={pageSeo.contact.title}
        description={pageSeo.contact.description}
        keywords={pageSeo.contact.keywords}
      />

      <header className="contact-hero" aria-labelledby="contact-hero-heading">
        <div
          className="contact-hero__media"
          style={{ backgroundImage: `url(${heroImage.src})` }}
          role="presentation"
        />
        <div className="contact-hero__overlay" />
        <div className="container contact-hero__content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="contact-hero__eyebrow">{contactPage.hero.eyebrow}</span>
            <h1 id="contact-hero-heading">{contactPage.hero.headline}</h1>
            <p className="contact-hero__intro">{contactPage.hero.intro}</p>
          </motion.div>
        </div>
      </header>

      <section className="contact-main ds-section ds-section--muted" aria-label="Contact details and enquiry form">
        <div className="container">
          <div className="contact-grid">
            <motion.aside
              className="contact-office ds-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
              aria-labelledby="contact-office-heading"
            >
              <h2 id="contact-office-heading" className="contact-office__heading">
                {contactPage.office.heading}
              </h2>

              <dl className="contact-office__list">
                <div className="contact-office__item">
                  <dt>
                    <i className="fas fa-envelope" aria-hidden="true" />
                    {contactPage.office.emailLabel}
                  </dt>
                  <dd>
                    <a href={`mailto:${contactPage.office.email}`}>{contactPage.office.email}</a>
                  </dd>
                </div>

                <div className="contact-office__item">
                  <dt>
                    <i className="fas fa-phone" aria-hidden="true" />
                    {contactPage.office.phoneLabel}
                  </dt>
                  <dd>
                    <a href={`tel:${contactPage.office.phoneDial}`}>{contactPage.office.phone}</a>
                  </dd>
                </div>

                <div className="contact-office__item">
                  <dt>
                    <i className="fas fa-map-marker-alt" aria-hidden="true" />
                    {contactPage.office.addressLabel}
                  </dt>
                  <dd>
                    {contactPage.office.addressLines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </dd>
                </div>

                <div className="contact-office__item">
                  <dt>
                    <i className="fas fa-clock" aria-hidden="true" />
                    {contactPage.office.hoursLabel}
                  </dt>
                  <dd>{contactPage.office.hours}</dd>
                </div>
              </dl>

              <div className="contact-office__actions">
                <a className="ds-btn ds-btn--primary" href={`tel:${contactPage.office.phoneDial}`}>
                  <i className="fas fa-phone" aria-hidden="true" />
                  {contactPage.office.callUs}
                </a>
                <a
                  className="ds-btn ds-btn--secondary"
                  href="https://maps.app.goo.gl/Xa8cgaQMRUqE5AZw9?g_st=iw"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-directions" aria-hidden="true" />
                  {contactPage.office.directions}
                </a>
              </div>
            </motion.aside>

            <motion.div
              className="contact-form ds-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              aria-labelledby="contact-form-heading"
            >
              <header className="contact-form__header">
                <h2 id="contact-form-heading">{contactPage.form.heading}</h2>
                <p>{contactPage.form.intro}</p>
              </header>

              {status.type && (
                <div
                  className={`contact-alert contact-alert--${status.type}`}
                  role="alert"
                  aria-live="polite"
                >
                  <i
                    className={`fas ${
                      status.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{status.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="contact-form__grid">
                  {renderField('name')}
                  {renderField('email')}
                  {renderField('phone')}
                  {renderField('subject')}
                </div>

                <div className={`ds-form-field${errors.message ? ' is-error' : ''}`}>
                  <label className="ds-label" htmlFor="contact-message">
                    {contactPage.form.fields.message.label}
                    <span className="contact-required" aria-hidden="true"> *</span>
                  </label>
                  <textarea
                    id="contact-message"
                    className={`ds-input contact-textarea${errors.message ? ' is-error' : ''}`}
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={contactPage.form.fields.message.placeholder}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  />
                  {errors.message && (
                    <p id="contact-message-error" className="ds-error-text" role="alert">
                      {errors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="ds-btn ds-btn--primary contact-submit"
                  disabled={isSubmitting || isBranchLoading}
                >
                  {isSubmitting ? (
                    <>
                      <span className="contact-spinner" aria-hidden="true" />
                      {contactPage.form.submitting}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane" aria-hidden="true" />
                      {contactPage.form.submit}
                    </>
                  )}
                </button>

                <p className="contact-form__footnote">{contactPage.form.footnote}</p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
