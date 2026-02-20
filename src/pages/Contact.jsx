import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { formatPhoneNumber } from '../utils/validation'
import SEO from '../components/SEO/SEO'
import './Contact.css'

const HERO_IMAGE =
  'https://ortho-house.com/wp-content/uploads/2025/04/Ortho-map-m4v-image.jpg'

const Copy = {
  headline: 'Get in touch',
  subHeadline: 'Any question? Let\'s talk!',
  officeLabel: 'Orthohouse UK Office',
  email: 'infoUK@ortho-house.com',
  phoneMain: '+44 20 3368 3036',
  phoneDial: '+442033683036',
  addressLines: [
    '2 Kingdom St, London W2 6BD',
    'United Kingdom'
  ],
  workingHours: ['Working hours: 9 A.M. – 5 P.M.', 'Working days: Monday – Friday']
}

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
        message:
          'We could not reach our contact service right now. Please try again shortly or email us directly.'
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
    if (!formData.name.trim()) newErrors.name = 'Please enter your name.'
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.'
    }
    if (!formData.subject.trim()) newErrors.subject = 'Please add a subject.'
    if (!formData.message.trim()) newErrors.message = 'Please enter a message.'
    return newErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setStatus({
        type: 'error',
        message: 'Please review the highlighted fields.'
      })
      return
    }

    if (!branchId) {
      setStatus({
        type: 'error',
        message:
          'We are experiencing technical issues connecting to our UK office. Please try again later or email infoUK@ortho-house.com.'
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
        message:
          'Thank you! Your message has been delivered to our UK team. We will get back to you shortly.'
      })
    } catch (error) {
      console.error('Contact: failed to submit message', error)
      setStatus({
        type: 'error',
        message:
          'Something went wrong while sending your message. Please try again or email infoUK@ortho-house.com.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="contact-page">
      <SEO
        title="Contact Us - OrthoHouse"
        description="Get in touch with OrthoHouse. Contact our UK office for consultations, inquiries, or support. Located at 2 Kingdom St, London W2 6BD. Call +44 20 3368 3036 or email infoUK@ortho-house.com"
        keywords="contact OrthoHouse, prosthetics consultation, orthotic services contact, medical device inquiry, UK prosthetics office"
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
              <span className="contact-hero__title-highlight">{Copy.headline}</span>
            </h1>
            <h2>{Copy.subHeadline}</h2>
            <p>
              We’re here for clinical consultations, partnership discussions, and product support
              across the United Kingdom.
            </p>
            <div className="contact-hero__badge">
              <span>OrthoHouse UK</span>
            </div>
          </motion.div>

          <motion.div
            className="contact-hero__card"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <div className="contact-card">
              <div className="contact-card__eyebrow">Orthohouse</div>
              <h3>{Copy.officeLabel}</h3>
              <a href={`mailto:${Copy.email}`} className="contact-card__link">
                {Copy.email}
              </a>
              <div className="contact-card__hours">
                {Copy.workingHours.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
              <div className="contact-card__address">
                {Copy.addressLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>

              <div className="contact-card__actions">
                <a className="contact-card__action" href={`tel:${Copy.phoneDial}`}>
                  <i className="fas fa-phone" aria-hidden="true" />
                  Call us
                </a>
                <a
                  className="contact-card__action secondary"
                  href="https://maps.app.goo.gl/Xa8cgaQMRUqE5AZw9?g_st=iw"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-map-pin" aria-hidden="true" />
                  Directions
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
            <img src={HERO_IMAGE} alt="OrthoHouse UK office map" loading="lazy" />
          </motion.div>

          <motion.div
            className="contact-form"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="contact-form__header">
              <h3>Send a message</h3>
              <p>
                Fill out the form and the OrthoHouse UK team will respond within one business day.
              </p>
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
                  Full name *
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jordan Smith"
                    autoComplete="name"
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </label>

                <label className={errors.email ? 'has-error' : ''}>
                  Email address *
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jordan.smith@example.com"
                    autoComplete="email"
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </label>

                <label>
                  Phone number
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+44 20 3368 3036"
                    autoComplete="tel"
                  />
                </label>

                <label className={errors.subject ? 'has-error' : ''}>
                  Subject *
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                  />
                  {errors.subject && <span className="field-error">{errors.subject}</span>}
                </label>
              </div>

              <label className={`contact-form__message ${errors.message ? 'has-error' : ''}`}>
                Message *
                <textarea
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your enquiry..."
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
                    Sending…
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane" aria-hidden="true" />
                    Send message
                  </>
                )}
              </button>
              <p className="contact-form__footnote">
                By submitting this form you agree to be contacted by OrthoHouse UK regarding your
                enquiry.
              </p>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Contact
