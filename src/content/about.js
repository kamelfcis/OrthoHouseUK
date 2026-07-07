import { aboutHeroImage } from '../data/localAssets'

export const aboutPage = {
  hero: {
    eyebrow: 'About OrthoHouse UK',
    titleLine1: 'Advancing Orthopaedic',
    titleLine2: 'Care Across the UK',
    subtitle:
      'We connect surgeons and hospitals with innovative implants and clinical support — built on regulatory excellence and long-term partnerships.',
    // Local: office trade show photography — Unsplash retained only as remote fallback
    localImage: aboutHeroImage,
    imageQuery: 'medical team healthcare professional',
    imageAlt: aboutHeroImage.alt,
    imageFallback:
      'https://images.unsplash.com/photo-1631815582920-54d7714370ab?w=1920&h=1080&fit=crop&q=80',
    useLocalOnly: true
  },
  philosophy: {
    heading: 'Our Philosophy',
    paragraphs: [
      'OrthoHouse UK was established to bring world-class orthopaedic innovation to British surgeons and hospitals. We specialise in trauma fixation, arthroplasty, foot & ankle, and bone graft solutions — distributed with full MHRA compliance.',
      'We combine advanced orthopaedic technology with dedicated clinical support to deliver exceptional outcomes for surgeons and patients across the United Kingdom.'
    ]
  },
  ukJourney: {
    eyebrow: '',
    title: 'Ortho House UK journey',
    subtitle:
      '',
    milestones: [
      {
        date: 'Jul 2022',
        dateTime: '2022-07',
        title: 'UK establishment',
        description:
          'OrthoHouse Solutions LTD UK was established to serve the British orthopaedic market.'
      },
      {
        date: 'Oct 2022',
        dateTime: '2022-10',
        title: 'London headquarters',
        description: 'Opened our first office in London at 2 Kingdom Street, Paddington.'
      },
      {
        date: 'Jun 2023',
        dateTime: '2023-06',
        title: 'Foot & ankle business unit',
        description:
          'Launched the foot & ankle business unit through a strategic partnership with Episcan SRL in the UK.'
      },
      {
        date: 'Dec 2023',
        dateTime: '2023-12',
        title: 'Trauma business unit',
        description: 'Partnered with Astrolabe to establish the trauma business unit.'
      },
      {
        date: 'Feb 2024',
        dateTime: '2024-02',
        title: 'Eincobio bone graft',
        description:
          'Partnered with Eincobio, introducing an advanced portfolio of bone graft solutions.'
      },
      {
        date: '2024',
        dateTime: '2024',
        title: 'Permedica arthroplasty',
        description:
          'Entered a strategic partnership with Permedica to strengthen our arthroplasty portfolio.'
      },
      {
        date: 'Oct 2025',
        dateTime: '2025-10',
        title: 'NHS Scotland framework',
        description:
          'Successfully appointed as a trusted supplier within the Scottish framework for orthopaedic trauma & extremity.'
      }
    ]
  },
  values: {
    heading: 'What Guides Us',
    items: [
      {
        title: 'Clinical Excellence',
        icon: 'fas fa-user-doctor',
        text: 'Supporting surgeons with evidence-based products and specialist education programmes.'
      },
      {
        title: 'Regulatory Integrity',
        icon: 'fas fa-shield-halved',
        text: 'MHRA registration and UKRP services ensuring compliant device distribution post-Brexit.'
      },
      {
        title: 'Partnership Focus',
        icon: 'fas fa-handshake',
        text: 'Long-term relationships with manufacturers, hospitals, and the wider orthopaedic community.'
      },
      {
        title: 'Patient Outcomes',
        icon: 'fas fa-heart-pulse',
        text: 'Every decision measured against its impact on the patients we ultimately serve.'
      }
    ]
  }
}

export const ceoVisionMission = {
  tabs: {
    ceo: 'CEO message',
    vision: 'Vision',
    mission: 'Mission'
  },
  content: {
    ceo: {
      title: 'A message from our chief executive',
      text: 'My aim is to build an organisation that makes a genuine difference across the UK healthcare sector. At OrthoHouse UK, we are dedicated to advancing orthopaedic care by supplying high-quality implants and clinical support to surgeons and hospitals nationwide. We look forward to continuing our growth alongside NHS and private-sector partners, and to strengthening our contribution to clinical education across the United Kingdom.',
      author: {
        name: 'Waleed Emad',
        title: 'Chief executive & founder'
      }
    },
    vision: {
      title: 'Vision',
      text: 'We aspire to be one of the top leading medical devices providers in the Orthopaedic surgical field in the World',
      brandLine: 'ORTHOHOUSE',
      author: null
    },
    mission: {
      title: 'Mission',
      text: 'Delivering innovative Orthopaedic solutions aligned with industry needs through strategic partnerships, premium products, and value-driven healthcare services.',
      brandLine: 'ORTHOHOUSE',
      author: null
    }
  },
  ceoImageAlt: 'Waleed Emad, chief executive and founder of OrthoHouse UK'
}
