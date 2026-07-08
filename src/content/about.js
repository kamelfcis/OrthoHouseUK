import { aboutHeroImage } from '../data/localAssets'

export const aboutPage = {
  hero: {
    titleLine1: 'Advancing Orthopaedic',
    titleLine2: 'Care Across the UK',
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
      'ORTHOHOUSE UK was established to bring world-class orthopaedic innovation to British surgeons and hospitals. We specialise in trauma fixation, arthroplasty, foot & ankle, and bone graft solutions — distributed with full MHRA compliance.',
      'We combine advanced orthopaedic technology with dedicated clinical support to deliver exceptional outcomes for surgeons and patients across the United Kingdom.'
    ]
  },
  ukJourney: {
    eyebrow: '',
    title: 'ORTHOHOUSE UK journey',
    subtitle:
      '',
    milestones: [
      {
        date: 'Jul 2022',
        dateTime: '2022-07',
        title: 'UK establishment'
      },
      {
        date: 'Oct 2022',
        dateTime: '2022-10',
        title: 'London headquarters'
      },
      {
        date: 'Jun 2023',
        dateTime: '2023-06',
        title: 'Foot & ankle business unit'
      },
      {
        date: 'Dec 2023',
        dateTime: '2023-12',
        title: 'Trauma business unit'
      },
      {
        date: 'Feb 2024',
        dateTime: '2024-02',
        title: 'Eincobio bone graft'
      },
      {
        date: '2024',
        dateTime: '2024',
        title: 'Permedica arthroplasty'
      },
      {
        date: 'Oct 2025',
        dateTime: '2025-10',
        title: 'NHS Scotland framework'
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
      text: 'My aim is to build an organisation that makes a genuine difference across the UK healthcare sector. At ORTHOHOUSE UK, we are dedicated to advancing orthopaedic care by supplying high-quality implants and clinical support to surgeons and hospitals nationwide. We look forward to continuing our growth alongside NHS and private-sector partners, and to strengthening our contribution to clinical education across the United Kingdom.',
      author: {
        name: 'Waleed Emad',
        title: 'Founder & CEO'
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
  ceoImageAlt: 'Waleed Emad, chief executive and founder of ORTHOHOUSE UK'
}
