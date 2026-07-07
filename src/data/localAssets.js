/**
 * Curated local image registry — OrthoHouse UK
 *
 * Source key:
 *   presentation — extracted from Docs/OH presentation for recruitment (1).pdf
 *   legacy       — original public/assets/images/ files
 *   unsplash     — remote fallback when local quality insufficient
 */
import { buildLocalImage } from '../utils/responsiveImage'

// —— Page heroes —————————————————————————————————————————————————————————————

/** About hero — PDF slide "The heart of OrthoHouse" (p07) */
export const aboutHeroImage = buildLocalImage({
  category: 'presentation',
  name: 'the-heart-of-orthohouse-03-1477x890',
  alt: 'OrthoHouse team collaborating in a modern clinical environment',
  source: 'presentation',
  width: 1477,
  height: 890
})

/** Contact hero — legacy office photography (high resolution) */
export const contactHeroImage = buildLocalImage({
  category: 'office',
  name: 'contact-office',
  alt: 'OrthoHouse UK office and clinical consultation setting in London',
  source: 'legacy',
  width: 5740,
  height: 3827
})

/** Partners / services hero — legacy partners banner */
export const partnersHeroImage = buildLocalImage({
  category: 'heroes',
  name: 'partners-hero',
  alt: 'Healthcare professionals representing OrthoHouse UK manufacturing partnerships',
  source: 'legacy',
  width: 6000,
  height: 4000
})

// —— Homepage editorial ——————————————————————————————————————————————————————

export const homeValuePropImage = buildLocalImage({
  category: 'presentation',
  name: 'the-heart-of-orthohouse-06-1451x826',
  alt: 'Orthopaedic specialist reviewing clinical pathways with hospital colleagues',
  source: 'presentation',
  width: 1451,
  height: 826
})

export const homeCapabilityImages = {
  distribution: buildLocalImage({
    category: 'presentation',
    name: 'life-at-orthohouse-03-838x885',
    alt: 'Hospital partnership and national orthopaedic implant distribution across the UK',
    source: 'presentation',
    width: 838,
    height: 885
  }),
  regulatory: buildLocalImage({
    category: 'presentation',
    name: 'in-2009-orthohouse-03-1536x942',
    alt: 'OrthoHouse heritage and regulatory excellence since 2009',
    source: 'presentation',
    width: 1536,
    height: 942
  }),
  clinical: buildLocalImage({
    category: 'presentation',
    name: '1st-cadaver-courses-in-middle-east-05-895x610',
    alt: 'Surgical education and cadaver training course supported by OrthoHouse',
    source: 'presentation',
    width: 895,
    height: 610
  })
}

export const homeSpecialtyImages = {
  'foot-ankle': buildLocalImage({
    category: 'products',
    name: 'orthotic-solutions',
    alt: 'Foot and ankle orthotic solutions for lower-extremity reconstruction',
    source: 'legacy',
    width: 940,
    height: 788
  }),
  trauma: buildLocalImage({
    category: 'products',
    name: 'biomedical',
    alt: 'Trauma fixation and biomedical implant components',
    source: 'legacy',
    width: 1082,
    height: 720
  }),
  arthroplasty: buildLocalImage({
    category: 'products',
    name: 'prosthetic-limb',
    alt: 'Arthroplasty and joint replacement prosthetic solutions',
    source: 'legacy',
    width: 940,
    height: 788
  }),
  'bone-graft': buildLocalImage({
    category: 'products',
    name: 'rehabilitation',
    alt: 'Bone graft and post-operative rehabilitation pathways',
    source: 'legacy',
    width: 940,
    height: 788
  })
}

// —— Events (UK journey) —————————————————————————————————————————————————————

export const homeEventImages = {
  'boa-2025': buildLocalImage({
    category: 'events',
    name: 'gallery',
    alt: 'OrthoHouse UK exhibition stand at a national orthopaedic congress',
    source: 'legacy',
    width: 8256,
    height: 5504
  }),
  'bofas-2025': buildLocalImage({
    category: 'presentation',
    name: '1st-cadaver-courses-in-middle-east-05-895x610',
    alt: 'Foot and ankle surgical education supported by OrthoHouse',
    source: 'presentation',
    width: 895,
    height: 610
  }),
  'bess-2025': buildLocalImage({
    category: 'events',
    name: 'blogs',
    alt: 'OrthoHouse UK engagement with the upper-extremity orthopaedic community',
    source: 'legacy',
    width: 4032,
    height: 3024
  }),
  'kbp-2025': buildLocalImage({
    category: 'presentation',
    name: 'life-at-orthohouse-03-838x885',
    alt: 'International healthcare collaboration and UK market engagement',
    source: 'presentation',
    width: 838,
    height: 885
  })
}

// —— Brand logos —————————————————————————————————————————————————————————————

export const brandLogos = {
  nav: '/assets/brand/logo-svg-png.png',
  navSvg: '/assets/brand/logo-svg.svg',
  footer: '/assets/brand/logo-svg.svg',
  primary: '/assets/brand/logo-primary.png'
}

/** UK flag icon — navbar locale badge (transparent background) */
export const ukFlagIcon = '/assets/presentation/erasebg-transformed.webp'
