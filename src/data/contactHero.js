/**
 * Contact page hero — local office photography primary; Unsplash when API key missing.
 */
import { contactHeroImage } from './localAssets'

const U = 'https://images.unsplash.com'

const img = (id, w = 1920) =>
  `${U}/${id}?auto=format&fit=crop&w=${w}&q=80`

export const CONTACT_HERO_QUERY = 'doctor consultation medical consultation'

/** Legacy office image — high-resolution local asset */
export const CONTACT_HERO_LOCAL = contactHeroImage

export const CONTACT_HERO_FALLBACK = {
  id: 'contact-hero-local',
  ...contactHeroImage,
  credit: null
}

/** Remote Unsplash fallback if ever needed without local assets */
export const CONTACT_HERO_UNSPLASH = {
  id: 'contact-hero-unsplash',
  src: img('photo-1586773860435-b3c08ae068877'),
  srcMobile: img('photo-1586773860435-b3c08ae068877', 800),
  alt: 'Doctor consultation in a clinical setting',
  source: 'unsplash',
  credit: {
    name: 'Unsplash',
    url: 'https://unsplash.com/photos/photo-1586773860435-b3c08ae068877'
  }
}

export default CONTACT_HERO_FALLBACK
