export const contactPage = {
  hero: {
    headline: 'Get in touch',
    subHeadline: 'How can we help?',
    intro:
      'We are here for product enquiries, partnership discussions, and clinical support across the United Kingdom.',
    badge: 'OrthoHouse UK'
  },
  office: {
    eyebrow: 'OrthoHouse UK',
    label: 'OrthoHouse UK Office',
    email: 'infoUK@ortho-house.com',
    phone: '+44 20 3368 3036',
    phoneDial: '+442033683036',
    addressLines: ['2 Kingdom St, London W2 6BD', 'United Kingdom'],
    workingHours: ['Working hours: 9:00 – 17:00', 'Working days: Monday – Friday'],
    callUs: 'Call us',
    directions: 'Directions',
    mapAlt: 'OrthoHouse UK office location map'
  },
  form: {
    heading: 'Send a message',
    intro: 'Complete the form and our UK team will respond within one business day.',
    submit: 'Request Assistance',
    submitting: 'Sending…',
    footnote:
      'By submitting this form you agree to be contacted by OrthoHouse UK regarding your enquiry.',
    fields: {
      name: { label: 'Full name *', placeholder: 'Jordan Smith' },
      email: { label: 'Email address *', placeholder: 'jordan.smith@example.com' },
      phone: { label: 'Phone number', placeholder: '+44 20 3368 3036' },
      subject: { label: 'Subject *', placeholder: 'How can we help you?' },
      message: { label: 'Message *', placeholder: 'Tell us about your enquiry…' }
    }
  },
  validation: {
    name: 'Please enter your name.',
    emailRequired: 'Please enter your email address.',
    emailInvalid: 'Please enter a valid email address.',
    subject: 'Please add a subject.',
    message: 'Please enter a message.',
    reviewFields: 'Please review the highlighted fields.'
  },
  status: {
    success:
      'Thank you. Your message has been delivered to our UK team. We will respond shortly.',
    sendError:
      'Something went wrong while sending your message. Please try again or email infoUK@ortho-house.com.',
    branchError:
      'We could not reach our contact service right now. Please try again shortly or email us directly.',
    technicalError:
      'We are experiencing technical issues connecting to our UK office. Please try again later or email infoUK@ortho-house.com.'
  }
}
