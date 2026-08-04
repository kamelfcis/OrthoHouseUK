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
  ukJourney: {
    eyebrow: '',
    title: 'ORTHOHOUSE UK journey',
    subtitle:
      '',
    milestones: [
      {
        date: 'Jul 2022',
        dateTime: '2022-07',
        title: 'Established in the UK'
      },
      {
        date: 'Oct 2022',
        dateTime: '2022-10',
        title: 'London Office Opening'
      },
      {
        date: 'Jun 2023',
        dateTime: '2023-06',
        title: 'Foot & Ankle Introduction'
      },
      {
        date: 'Dec 2023',
        dateTime: '2023-12',
        title: 'Trauma Incorporation'
      },
      {
        date: 'Feb 2024',
        dateTime: '2024-02',
        title: 'Osteosynt bone substitutes integration'
      },
      {
        date: '2024',
        dateTime: '2024',
        title: 'Permedica Introduction'
      },
      {
        date: 'Nov 2025',
        dateTime: '2025-11',
        title: 'NHS Scotland Inclusion'
      },
      {
        date: 'April 2026',
        dateTime: '2026-04',
        title: 'Scotland Office Opening'
      }
    ]
  },
  values: {
    heading: 'Core Values',
    items: [
      {
        title: 'Clinical Excellence',
        icon: 'fas fa-user-doctor',
        text: 'Supporting surgeons with evidence-based products.'
      },
      {
        title: 'Education',
        icon: 'fas fa-graduation-cap',
        text: 'Provides World Class Continous Medical Education For Junior Surgeons.'
      },
      {
        title: 'Partnership Trust',
        icon: 'fas fa-handshake',
        text: 'Long-term Partnership with manufacturers, hospitals, and the wider orthopaedic community.'
      },
      {
        title: 'Patient Centered',
        icon: 'fas fa-heart-pulse',
        text: 'Every decision measured against its impact on the patients we ultimately serve.'
      }
    ]
  }
}

export const ceoVisionMission = {
  eyebrow: 'Leadership',
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
      panelLabel: 'Vision',
      author: null
    },
    mission: {
      title: 'Mission',
      text: 'We are committed to deliver innovative Orthopaedic solutions aligned with industry needs through strategic partnerships, premium products, and value-driven healthcare services.',
      brandLine: 'ORTHOHOUSE',
      panelLabel: 'Mission',
      author: null
    }
  }
}
