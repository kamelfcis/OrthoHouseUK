export const homeHero = {
  ariaLabel: 'OrthoHouse UK — orthopaedic medical device distribution',
  titleDefault: 'OrthoHouse UK',
  titleFallback: 'Orthopaedic solutions for UK surgeons and hospitals'
}

export const homePartners = {
  eyebrow: 'Manufacturing partners',
  title: 'Trusted by leading',
  titleHighlight: 'orthopaedic brands'
}

export const homeProducts = {
  eyebrow: 'Product portfolio',
  title: 'Featured implant systems',
  subtitle:
    'A curated selection from our partner portfolio — trauma, arthroplasty, foot & ankle, and regenerative bone graft solutions.',
  loading: 'Loading products…',
  viewAll: 'View full product catalogue'
}

export const homeFeaturedProducts = {
  eyebrow: 'Product portfolio',
  title: 'Featured implant systems',
  subtitle:
    'A curated selection from our partner portfolio — trauma, arthroplasty, foot & ankle, and regenerative bone graft solutions.',
  loading: 'Loading featured products…',
  viewAll: 'View full product catalogue',
  viewProduct: 'View product',
  prevAria: 'Previous featured products',
  nextAria: 'Next featured products',
  slideAria: (index, total) => `Featured product ${index + 1} of ${total}`,
  dotAria: (index) => `Go to featured product slide ${index + 1}`
}

export const homeSpecialties = {
  eyebrow: 'Clinical specialties',
  title: 'Orthopaedic categories we serve',
  subtitle: 'Focused business units delivering specialist portfolios across four core areas of UK orthopaedic practice.',
  linkLabel: 'Explore products',
  items: [
    {
      id: 'foot-ankle',
      title: 'Foot & ankle',
      description:
        'Comprehensive lower-extremity implant systems and fixation solutions for complex foot and ankle reconstruction.',
      imageQuery: 'foot ankle cast orthopaedic',
      imageAlt: 'Foot and ankle orthopaedic assessment with cast immobilisation',
      imageFallback:
        'https://images.unsplash.com/photo-1706777193603-76c3e9613553?auto=format&fit=crop&w=800&q=80',
      link: '/products?category=foot_ankle'
    },
    {
      id: 'trauma',
      title: 'Trauma',
      description:
        'Advanced fixation and trauma systems, including the Astrolabe portfolio for fracture management in acute settings.',
      imageQuery: 'fracture trauma leg bones orthopaedic',
      imageAlt: 'Trauma orthopaedic anatomy illustrating fracture fixation and bone injury',
      imageFallback:
        'https://images.unsplash.com/photo-1768644675720-2f274f84c87a?auto=format&fit=crop&w=800&q=80',
      link: '/products?category=hand_wrist'
    },
    {
      id: 'arthroplasty',
      title: 'Arthroplasty',
      description:
        'Joint replacement solutions through Permedica and partner portfolios — supporting elective hip and knee programmes.',
      imageQuery: 'knee joint replacement arthroplasty',
      videoQuery: 'hip replacement rehabilitation',
      imageAlt: 'Knee joint replacement arthroplasty implant systems for elective surgery',
      imageFallback:
        'https://images.unsplash.com/photo-1715531786629-bd8b2dd87066?auto=format&fit=crop&w=800&q=80',
      link: '/products?category=shoulder'
    },
    {
      id: 'bone-graft',
      title: 'Bone graft solutions',
      description:
        'Eincobio regenerative technologies for bone healing, fusion, and reconstruction in complex orthopaedic cases.',
      imageQuery: 'bone graft spine fusion orthopaedic',
      videoQuery: 'bone fracture rehabilitation',
      imageAlt: 'Post-operative orthopaedic rehabilitation supporting bone graft and fusion recovery',
      imageFallback:
        'https://images.unsplash.com/photo-1643834534240-75aee14ecdc8?auto=format&fit=crop&w=800&q=80',
      link: '/products?category=bone_graft'
    }
  ]
}

export const homeHowItWorks = {
  eyebrow: 'How we work',
  title: 'From enquiry to theatre-ready supply',
  subtitle:
    'A straightforward process designed for busy surgical teams and procurement departments.',
  steps: [
    {
      number: '01',
      title: 'Initial enquiry',
      text: 'Tell us about your clinical needs, existing contracts, or product interests. Our team responds within one working day.'
    },
    {
      number: '02',
      title: 'Portfolio alignment',
      text: 'We match your requirements to the right implant systems from our partner portfolio — with full technical and regulatory documentation.'
    },
    {
      number: '03',
      title: 'Supply and onboarding',
      text: 'We coordinate hospital onboarding, consignment or direct supply arrangements, and theatre team product familiarisation.'
    },
    {
      number: '04',
      title: 'Ongoing support',
      text: 'Dedicated account management, case support, and access to our education programme — for the lifetime of the partnership.'
    }
  ],
  cta: 'Speak with our team',
  ctaLink: '/contact'
}

export const homeTrustStrip = {
  items: [
    { key: 'hospitals', fallback: 170, suffix: '+', label: 'Partner hospitals' },
    { key: 'surgeons', fallback: 300, suffix: '+', label: 'Surgeons supported' },
    { key: 'partners', fallback: 10, suffix: '+', label: 'Manufacturing partners' },
    { key: 'events', fallback: 20, suffix: '+', label: 'Education events per year' }
  ]
}

export const homeMission = {
  eyebrow: 'Our purpose',
  title: 'Advancing orthopaedic care across the United Kingdom',
  statement:
    'Through strategic partnerships, proven implant systems, and practical clinical support, OrthoHouse UK connects established manufacturers with surgeons and hospitals nationwide.',
  vision:
    'To be the trusted distribution partner for orthopaedic innovation in the UK — improving patient outcomes through reliable supply, education, and regulatory integrity.'
}

export const homeStats = {
  eyebrow: 'Measurable outcomes',
  title: 'OrthoHouse UK by the numbers',
  subtitle: 'Trusted by surgeons, hospitals, and manufacturing partners across the United Kingdom.',
  items: [
    { key: 'employees', icon: 'fa-users-gear', number: 240, suffix: '', label: 'Employees' },
    { key: 'surgeons', icon: 'fa-user-doctor', number: 300, suffix: '+', label: 'Surgeons supported' },
    { key: 'hospitals', icon: 'fa-hospital', number: 170, suffix: '+', label: 'Partner hospitals' },
    { key: 'operations', icon: 'fa-heart-pulse', number: 80, suffix: '+', label: 'Theatre cases supported daily' },
    { key: 'partners', icon: 'fa-handshake', number: 10, suffix: '+', label: 'Manufacturing partners' },
    { key: 'events', icon: 'fa-calendar-days', number: 20, suffix: '+', label: 'Education events per year' }
  ]
}

export const homeUkJourney = {
  eyebrow: 'Our UK journey',
  title: 'Building OrthoHouse UK',
  subtitle:
    'From establishment in London to NHS framework approval — a measured growth path rooted in clinical partnership.',
  milestones: [
    {
      date: 'Jul 2022',
      title: 'UK establishment',
      description: 'OrthoHouse UK officially established to serve the British orthopaedic market.'
    },
    {
      date: 'Oct 2022',
      title: 'London headquarters',
      description: 'Opened our UK office at 2 Kingdom Street, Paddington, London.'
    },
    {
      date: '2023',
      title: 'Foot & ankle business unit',
      description: 'Launched a dedicated foot & ankle unit with a specialist implant portfolio.'
    },
    {
      date: '2023',
      title: 'Astrolabe trauma',
      description: 'Expanded our trauma offering with Astrolabe fixation systems.'
    },
    {
      date: '2024',
      title: 'Eincobio bone graft',
      description: 'Added Eincobio regenerative bone graft solutions to our portfolio.'
    },
    {
      date: '2024',
      title: 'Permedica arthroplasty',
      description: 'Introduced Permedica joint replacement products for UK surgeons.'
    },
    {
      date: 'Oct 2025',
      title: 'NHS Scotland framework',
      description: 'Approved supplier on the NHS Scotland Orthopaedic Trauma & Extremity framework.'
    }
  ]
}

export const homeTestimonials = {
  eyebrow: 'What our partners say',
  title: 'Trusted by surgeons and hospital teams',
  subtitle:
    'Feedback from clinicians and procurement professionals who work with OrthoHouse UK day to day.'
}

export const homeResources = {
  eyebrow: 'Resources and insights',
  title: 'Latest from our blog',
  subtitle:
    'Clinical perspectives, product updates, and news from the UK orthopaedic community.',
  viewAll: 'View all articles',
  readMore: 'Read article',
  empty: 'New articles coming soon.',
  defaultAuthor: 'OrthoHouse UK'
}

export const homeFaq = {
  eyebrow: 'Common questions',
  title: 'Frequently asked questions',
  subtitle:
    'Answers to the questions surgeons, procurement teams, and manufacturing partners ask most often.',
  items: [
    {
      id: 'who',
      question: 'Who does OrthoHouse UK supply?',
      answer:
        'We supply orthopaedic implant systems to NHS trusts, private hospitals, and independent surgical centres across the United Kingdom. Our customers include trauma teams, arthroplasty units, and foot & ankle specialists.'
    },
    {
      id: 'regulatory',
      question: 'Are your products MHRA compliant?',
      answer:
        'Yes. OrthoHouse UK is registered with the MHRA as a medical device distributor and operates as a UK Responsible Person (UKRP). Every product in our portfolio is distributed under full UK regulatory compliance.'
    },
    {
      id: 'nhs',
      question: 'Do you supply NHS frameworks?',
      answer:
        'We are an approved supplier on the NHS Scotland Orthopaedic Trauma & Extremity framework. For NHS England, Wales, and Northern Ireland, we work directly with trust procurement teams and can support framework applications where required.'
    },
    {
      id: 'support',
      question: 'What clinical support do you provide?',
      answer:
        'Each business unit is backed by product specialists who offer case support, product training, and access to our surgical education programme. We exhibit at BOA, BOFAS, and BESS events annually.'
    },
    {
      id: 'partners',
      question: 'How can manufacturers partner with OrthoHouse UK?',
      answer:
        'We welcome enquiries from orthopaedic manufacturers seeking UK distribution. Contact our partnerships team to discuss regulatory onboarding, UKRP services, and market access strategy.'
    },
    {
      id: 'contact',
      question: 'How do I request product information or a quotation?',
      answer:
        'Use our contact form or call our London office. A member of the relevant business unit will respond within one working day with product literature, pricing guidance, or a follow-up call.'
    }
  ]
}

export const homeTeamTeaser = {
  eyebrow: 'Our people',
  title: 'Meet our specialist team',
  subtitle:
    'Clinical, regulatory, and commercial specialists dedicated to supporting UK surgeons and hospital teams.',
  featuredCount: 3,
  viewAll: 'Meet the full team',
  viewAllPath: '/team'
}
