/**
 * Hero background slider — curated Unsplash photography.
 * Theme: prosthetics, rehabilitation, mobility, clinical excellence.
 * Dignified, human-centred images — empowering not clinical-cold.
 *
 * All photo IDs verified working (HTTP 200) via curl before use.
 * Follow-up: swap to Supabase CDN URLs for full control of LCP.
 */

const U = 'https://images.unsplash.com'

/** Build a URL for a given photo at a target width. */
const img = (id, w = 1920) =>
  `${U}/${id}?auto=format&fit=crop&w=${w}&q=80`

export const HERO_SLIDES = [
  {
    id: 'mobility',
    eyebrow: 'Precision Engineering',
    src:       img('photo-1760333334115-e75194471dd7'),
    srcMobile: img('photo-1760333334115-e75194471dd7', 800),
    alt: 'Athlete running on a carbon-fibre blade prosthesis along an outdoor track',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1760333334115-e75194471dd7'
    }
  },
  {
    id: 'daily-life',
    eyebrow: 'Patient-Centred Care',
    src:       img('photo-1773207092824-bcd255a384a4'),
    srcMobile: img('photo-1773207092824-bcd255a384a4', 800),
    alt: 'Woman with prosthetic leg walking hand in hand with her child along a city street',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1773207092824-bcd255a384a4'
    }
  },
  {
    id: 'clinical',
    eyebrow: 'Clinical Excellence',
    src:       img('photo-1551601651-2a8555f1a136'),
    srcMobile: img('photo-1551601651-2a8555f1a136', 800),
    alt: 'Surgical team performing a precision procedure under operating-theatre lights',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1551601651-2a8555f1a136'
    }
  },
  {
    id: 'engineering',
    eyebrow: 'Bespoke Prosthetics',
    src:       img('photo-1779363216562-f4400e23fde2'),
    srcMobile: img('photo-1779363216562-f4400e23fde2', 800),
    alt: 'Custom-built prosthetic limb presented against a deep navy background',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1779363216562-f4400e23fde2'
    }
  },
  {
    id: 'rehab',
    eyebrow: 'Rehabilitation & Recovery',
    src:       img('photo-1649751361457-01d3a696c7e6'),
    srcMobile: img('photo-1649751361457-01d3a696c7e6', 800),
    alt: 'Physiotherapist guiding a patient through a knee rehabilitation exercise',
    credit: {
      name: 'Unsplash',
      url: 'https://unsplash.com/photos/photo-1649751361457-01d3a696c7e6'
    }
  }
]

export default HERO_SLIDES
