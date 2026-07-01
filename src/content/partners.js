import { partnersHeroImage } from '../data/localAssets'

export const partnersPage = {
  seo: {
    title: 'Partners — Global Orthopaedic Manufacturers',
    description:
      'OrthoHouse UK partners with leading orthopaedic manufacturers. MHRA-registered distribution, UK Responsible Person services, and NHS framework access.',
    keywords:
      'orthopaedic partners, medical device distribution UK, MHRA distributor, UKRP, NHS Scotland framework'
  },
  hero: {
    eyebrow: 'Our Partners',
    title: ['Trusted Global', 'Manufacturing Partners'],
    subtitle:
      'We represent world-class orthopaedic brands with full regulatory compliance, clinical education, and dedicated UK market support.',
    // Local: legacy partners-hero — Unsplash as remote fallback only
    localImage: partnersHeroImage,
    imageQuery: 'healthcare professional surgeon',
    imageAlt: partnersHeroImage.alt,
    imageFallback:
      'https://images.unsplash.com/photo-1537368916624-89d682267b36?w=1920&h=1080&fit=crop&q=80',
    useLocalOnly: true
  },
  loadMore: 'View more partners',
  empty: 'No partners are currently listed for the UK branch.',
  cardCta: 'View partner profile'
}

export const partnerDetail = {
  loading: 'Loading partner profile…',
  notFound: 'Partner not found',
  notFoundDefault: 'This partner profile may no longer be available.',
  notFoundMessage: 'This partner profile may no longer be available.',
  backToPartners: 'Back to partners',
  browseAll: 'Browse all partners',
  trustedPartner: 'Trusted partner',
  officialWebsite: 'Official website',
  visitWebsite: 'Visit website',
  websiteCta: 'Visit website',
  emailPartner: 'Email partner',
  callPartner: 'Call partner',
  keyDetails: 'Key details',
  connectWith: (name) => `Connect with ${name}`,
  about: (name) => `About ${name}`,
  productsHeading: 'Partner Products',
  requestPortfolio: 'Request portfolio',
  labels: {
    website: 'Website',
    email: 'Email',
    phone: 'Phone'
  },
  stats: {
    products: 'Products',
    categories: 'Specialities'
  },
  portfolioModal: {
    title: (name) => `Request ${name} portfolio`,
    subtitle: 'Enter your email and we will send the partner brochures directly to your inbox.',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@company.com',
    privacy:
      'We only use your email to send this portfolio request. Your details are handled in line with UK data protection law.',
    submit: 'Send portfolio',
    submitting: 'Sending…',
    cancel: 'Cancel',
    close: 'Close',
    done: 'Done',
    successTitle: 'Check your inbox',
    successMessage: 'Your portfolio is on its way.',
    successToast: 'Check your inbox — your portfolio is on its way',
    errors: {
      emailRequired: 'Please enter your email address.',
      emailInvalid: 'Please enter a valid email address.',
      rateLimited: 'Too many requests. Please try again in an hour.',
      notAvailable: 'Portfolio not available for this partner yet.',
      sandboxRestricted:
        'Portfolio emails are temporarily limited while our email domain is being verified. Please contact us if you need immediate access.',
      network: 'Unable to connect. Please check your connection and try again.',
      generic: 'Unable to send portfolio. Please try again.'
    }
  }
}
