/**
 * Hero background slider — curated Unsplash photography.
 * Theme: orthopaedic surgery, surgeon, operating theatre, joint replacement, spine, rehabilitation.
 */

const U = 'https://images.unsplash.com'

const img = (id, w = 1200) =>
  `${U}/${id}?auto=format&fit=crop&w=${w}&q=80`

export const HERO_SLIDES = [
  {
    id: 'surgery',
    eyebrow: 'Clinical excellence',
    src: img('photo-1551601651-2a8555f1a136'),
    srcMobile: img('photo-1551601651-2a8555f1a136', 800),
    alt: 'Surgical team performing a precision orthopaedic procedure under operating-theatre lights',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1551601651-2a8555f1a136'
    }
  },
  {
    id: 'surgeon',
    eyebrow: 'Surgeon partnership',
    src: img('photo-1763198302745-57cb94135f11'),
    srcMobile: img('photo-1763198302745-57cb94135f11', 800),
    alt: 'Orthopaedic surgeon in a clinical setting',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1763198302745-57cb94135f11'
    }
  },
  {
    id: 'operating-theatre',
    eyebrow: 'Operating theatre',
    src: img('photo-1748407408885-9b62df0e2527'),
    srcMobile: img('photo-1748407408885-9b62df0e2527', 800),
    alt: 'Orthopaedic surgeon performing wound closure in an operating theatre',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/surgeon-is-using-tools-to-stitch-a-wound-KP0I9mQ8B0E'
    }
  },
  {
    id: 'hip-replacement',
    eyebrow: 'Arthroplasty solutions',
    src: img('photo-1581595219315-a187dd40c322'),
    srcMobile: img('photo-1581595219315-a187dd40c322', 800),
    alt: 'Hip replacement implant components arranged for clinical review',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1581595219315-a187dd40c322'
    }
  },
  {
    id: 'spine',
    eyebrow: 'Spine and trauma',
    src: img('photo-1602052577122-f73b9710adba'),
    srcMobile: img('photo-1602052577122-f73b9710adba', 800),
    alt: 'Advanced medical technology supporting spine and bone reconstruction',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1602052577122-f73b9710adba'
    }
  },
  {
    id: 'rehabilitation',
    eyebrow: 'Patient pathways',
    src: img('photo-1649751361457-01d3a696c7e6'),
    srcMobile: img('photo-1649751361457-01d3a696c7e6', 800),
    alt: 'Physiotherapist guiding a patient through rehabilitation exercises',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1649751361457-01d3a696c7e6'
    }
  }
]

export default HERO_SLIDES
