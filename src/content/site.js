export const siteName = 'ORTHOHOUSE UK'

export const nav = {
  logoAlt: 'ORTHOHOUSE UK Logo',
  items: [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Our Partners', path: '/partners', key: 'partners' },
    { name: 'Products', path: '/products' },
    { name: 'Blog', path: '/blog', key: 'blog' },
    { name: 'Contact Us', path: '/contact' }
  ],
  cta: 'Speak with our team',
  searchPlaceholder: 'Search articles…'
}

export const socialLinks = [
  { name: 'LinkedIn', icon: 'fab fa-linkedin-in', url: 'https://uk.linkedin.com/company/orthohouse-uk' },
  { name: 'Facebook', icon: 'fab fa-facebook-f', url: 'https://www.facebook.com/OrthoHouseEgy' },
  { name: 'X (Twitter)', icon: 'fab fa-twitter', url: 'https://x.com/OrthoHouseEgy' },
  { name: 'YouTube', icon: 'fab fa-youtube', url: 'https://www.youtube.com/@orthohouse' },
  { name: 'Instagram', icon: 'fab fa-instagram', url: 'https://www.instagram.com/ortho.house/' },
  { name: 'Snapchat', icon: 'fab fa-snapchat-ghost', url: 'https://www.snapchat.com/add/ortho.house1' },
  { name: 'TikTok', icon: 'fab fa-tiktok', url: 'https://www.tiktok.com/@ortho_house/' },
  { name: 'Email', icon: 'fas fa-envelope', url: 'mailto:info@ortho-house.com' }
]

export const footer = {
  about: {
    title: 'About ORTHOHOUSE UK'
  },
  columns: {
    company: {
      title: 'Company',
      links: [
        { name: 'About Us', path: '/about' },
        { name: 'Contact Us', path: '/contact' }
      ]
    },
    resources: {
      title: 'Resources',
      links: [
        { name: 'Blog', path: '/blog' },
        { name: 'Gallery', path: '/gallery' },
        { name: 'Partners', path: '/partners' }
      ]
    }
  },
  contact: {
    title: 'Contact',
    phone: '+44 20 3368 3036',
    phoneHref: 'tel:+442033683036',
    email: 'info@ortho-house.com',
    emailHref: 'mailto:info@ortho-house.com',
    addressLines: ['2 Kingdom Street, W2 6BD London ', 'United Kingdom']
  },
  social: socialLinks
}

export const ctas = {
  exploreProducts: 'Explore Our Products',
  viewPartners: 'View Partner Portfolio',
  speakWithTeam: 'Speak with our team',
  requestConsultation: 'Request a Consultation',
  contactTeam: 'Contact Our Team',
  requestAssistance: 'Request Assistance',
  goHome: 'Return to Home',
  sendMessage: 'Send Message'
}

export const cookieConsent = {
  closeLabel: 'Close cookie preferences',
  banner:
    'We use cookies to enhance your browsing experience, analyse site traffic, and personalise content. By clicking "Accept", you consent to all cookies. Click "Reject" to use only essential cookies, or customise your preferences. Learn more in our',
  policyLink: 'Cookie Policy',
  policyHref: '/cookie-policy',
  changePreferences: 'Change preferences',
  reject: 'Reject',
  accept: 'Accept',
  categories: {
    necessary: 'Necessary',
    functionality: 'Functionality',
    experience: 'Experience',
    measurement: 'Measurement',
    marketing: 'Marketing'
  }
}
