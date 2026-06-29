import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { formatPhoneNumber } from '../utils/validation'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import { contactPage } from '../content/contact'
import './Contact.css'

const HERO_IMAGE =
  'https://ortho-house.com/wp-content/uploads/2025/04/Ortho-map-m4v-image.jpg'

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
}

const Contact = () => {
  const [branchId, setBranchId] = useState(null)
  const [formData, setFormData] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: null, message: '' })
  const [errors, setErrors] = useState({})
  const [isBranchLoading, setIsBranchLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchUkBranch()
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

  return (
    <div className="contact-page">
      <SEO
        title={pageSeo.contact.title}
        description={pageSeo.contact.description}
        keywords={pageSeo.contact.keywords}
      />
      <section className="contact-hero">
        <div className="contact-hero__gradient" />
        <div className="contact-hero__content container">
          <motion.div
            className="contact-hero__copy"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1>
              <span className="contact-hero__title-highlight">{contactPage.hero.headline}</span>
            </h1>
            <h2>{contactPage.hero.subHeadline}</h2>
            <p>{contactPage.hero.intro}</p>
            <div className="contact-hero__badge">
              <span>{contactPage.hero.badge}</span>
            </div>
          </motion.div>

          <motion.div
            className="contact-hero__card"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <div className="contact-card">
              <div className="contact-card__eyebrow">{contactPage.office.eyebrow}</div>
              <h3>{contactPage.office.label}</h3>
              <a href={`mailto:${contactPage.office.email}`} className="contact-card__link">
                {contactPage.office.email}
              </a>
              <div className="contact-card__hours">
                {contactPage.office.workingHours.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
              <div className="contact-card__address">
                {contactPage.office.addressLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>

              <div className="contact-card__actions">
                <a className="contact-card__action" href={`tel:${contactPage.office.phoneDial}`}>
                  <i className="fas fa-phone" aria-hidden="true" />
                  {contactPage.office.callUs}
                </a>
                <a
                  className="contact-card__action secondary"
                  href="https://maps.app.goo.gl/Xa8cgaQMRUqE5AZw9?g_st=iw"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-map-pin" aria-hidden="true" />
                  {contactPage.office.directions}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="contact-body container">
        <div className="contact-columns">
          <motion.div
            className="contact-media"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <img src={HERO_IMAGE} alt={contactPage.office.mapAlt} loading="lazy" />
          </motion.div>

          <motion.div
            className="contact-form"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="contact-form__header">
              <h3>{contactPage.form.heading}</h3>
              <p>{contactPage.form.intro}</p>
            </div>

            {status.type && (
              <div className={`contact-alert contact-alert--${status.type}`} role="alert">
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
                <label className={errors.name ? 'has-error' : ''}>
                  {contactPage.form.fields.name.label}
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={contactPage.form.fields.name.placeholder}
                    autoComplete="name"
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </label>

                <label className={errors.email ? 'has-error' : ''}>
                  {contactPage.form.fields.email.label}
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={contactPage.form.fields.email.placeholder}
                    autoComplete="email"
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </label>

                <label>
                  {contactPage.form.fields.phone.label}
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={contactPage.form.fields.phone.placeholder}
                    autoComplete="tel"
                  />
                </label>

                <label className={errors.subject ? 'has-error' : ''}>
                  {contactPage.form.fields.subject.label}
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={contactPage.form.fields.subject.placeholder}
                  />
                  {errors.subject && <span className="field-error">{errors.subject}</span>}
                </label>
              </div>

              <label className={`contact-form__message ${errors.message ? 'has-error' : ''}`}>
                {contactPage.form.fields.message.label}
                <textarea
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={contactPage.form.fields.message.placeholder}
                />
                {errors.message && <span className="field-error">{errors.message}</span>}
              </label>

              <button
                type="submit"
                className="contact-submit"
                disabled={isSubmitting || isBranchLoading}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
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
      </section>
    </div>
  )
}

export default Contact
