/**
 * Hero background slider — curated Unsplash photography.
 * Theme: orthopaedic surgery, trauma, clinical excellence, rehabilitation.
 */

const U = 'https://images.unsplash.com'

const img = (id, w = 1920) =>
  `${U}/${id}?auto=format&fit=crop&w=${w}&q=80`

export const HERO_SLIDES = [
  {
    id: 'surgery',
    eyebrow: 'Clinical Excellence',
    src: img('photo-1551601651-2a8555f1a136'),
    srcMobile: img('photo-1551601651-2a8555f1a136', 800),
    alt: 'Surgical team performing a precision orthopaedic procedure under operating-theatre lights',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1551601651-2a8555f1a136'
    }
  },
  {
    id: 'trauma',
    eyebrow: 'Trauma & Fixation',
    src: img('photo-1559757141-5c350d0d3c56'),
    srcMobile: img('photo-1559757141-5c350d0d3c56', 800),
    alt: 'Medical imaging and surgical planning for trauma fixation',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1559757141-5c350d0d3c56'
    }
  },
  {
    id: 'arthroplasty',
    eyebrow: 'Arthroplasty Solutions',
    src: img('photo-1581595219315-a187dd40c322'),
    srcMobile: img('photo-1581595219315-a187dd40c322', 800),
    alt: 'Joint replacement implant components arranged for clinical review',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1581595219315-a187dd40c322'
    }
  },
  {
    id: 'rehab',
    eyebrow: 'Patient Pathways',
    src: img('photo-1649751361457-01d3a696c7e6'),
    srcMobile: img('photo-1649751361457-01d3a696c7e6', 800),
    alt: 'Physiotherapist guiding a patient through rehabilitation exercises',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1649751361457-01d3a696c7e6'
    }
  },
  {
    id: 'innovation',
    eyebrow: 'Orthopaedic Innovation',
    src: img('photo-1532187863486-abf9db8811e8'),
    srcMobile: img('photo-1532187863486-abf9db8811e8', 800),
    alt: 'Advanced medical technology supporting bone healing and reconstruction',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1532187863486-abf9db8811e8'
    }
  }
]

export default HERO_SLIDES
