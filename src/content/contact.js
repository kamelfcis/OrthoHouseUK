const SHARED_CONTACT = {
  email: 'infoUK@ortho-house.com',
  phone: '+44 20 3368 3036',
  phoneDial: '+442033683036',
  hours: 'Monday to Friday, 9:00–17:00',
  directionsUrl: 'https://maps.app.goo.gl/Xa8cgaQMRUqE5AZw9?g_st=iw',
  callUs: 'Call us',
  directions: 'Get directions',
  emailLabel: 'Email',
  phoneLabel: 'Telephone',
  addressLabel: 'Address',
  hoursLabel: 'Opening hours'
}

export const contactPage = {
  hero: {
    eyebrow: 'ORTHOHOUSE UK',
    headline: 'Contact us',
    intro:
      'For product enquiries, partnership discussions, or clinical support, our UK and Scotland offices are ready to help.'
  },
  officesSection: {
    eyebrow: 'Our locations',
    title: 'UK Offices'
  },
  offices: [
    {
      id: 'uk',
      heading: 'England Office',
      ...SHARED_CONTACT,
      addressLines: ['2 Kingdom St, W2 6BD London', 'United Kingdom']
    },
    {
      id: 'scotland',
      heading: 'Scotland office',
      ...SHARED_CONTACT,
      addressLines: [
        'Maxim Business Park, Maxim 1 - 1st floor',
        '2 Parklands Way, Eurocentral',
        'Lanarkshire / Dumfries & Galloway Region, ML1 4WR',
        'United Kingdom'
      ]
    }
  ],
  form: {
    heading: 'Send a message',
    intro: 'Complete the form below and our UK team will respond within one business day.',
    submit: 'Send message',
    submitting: 'Sending…',
    footnote:
      'By submitting this form, you agree to be contacted by ORTHOHOUSE UK regarding your enquiry.',
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
