export const contactPage = {
  hero: {
    eyebrow: 'OrthoHouse UK',
    headline: 'Contact us',
    intro:
      'For product enquiries, partnership discussions, or clinical support across the United Kingdom, our UK team is ready to help.'
  },
  office: {
    heading: 'UK office',
    email: 'infoUK@ortho-house.com',
    phone: '+44 20 3368 3036',
    phoneDial: '+442033683036',
    addressLines: ['2 Kingdom St, London W2 6BD', 'United Kingdom'],
    hours: 'Monday to Friday, 9:00–17:00',
    callUs: 'Call us',
    directions: 'Get directions',
    emailLabel: 'Email',
    phoneLabel: 'Telephone',
    addressLabel: 'Address',
    hoursLabel: 'Opening hours'
  },
  form: {
    heading: 'Send a message',
    intro: 'Complete the form below and our UK team will respond within one business day.',
    submit: 'Send message',
    submitting: 'Sending…',
    footnote:
      'By submitting this form, you agree to be contacted by OrthoHouse UK regarding your enquiry.',
    fields: {
      name: { label: 'Full name', placeholder: 'Jordan Smith', required: true },
      email: { label: 'Email address', placeholder: 'jordan.smith@example.com', required: true },
      phone: { label: 'Telephone (optional)', placeholder: '+44 20 3368 3036' },
      subject: { label: 'Subject', placeholder: 'How can we help?', required: true },
      message: { label: 'Message', placeholder: 'Tell us about your enquiry…', required: true }
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
