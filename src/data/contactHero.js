/**
 * Contact page hero — curated Unsplash fallback when the API key is missing or the request fails.
 */

const U = 'https://images.unsplash.com'

const img = (id, w = 1920) =>
  `${U}/${id}?auto=format&fit=crop&w=${w}&q=80`

export const CONTACT_HERO_QUERY = 'doctor consultation medical consultation'

export const CONTACT_HERO_FALLBACK = {
  id: 'contact-hero-fallback',
  src: img('photo-1586773860435-b3c08ae068877'),
  srcMobile: img('photo-1586773860435-b3c08ae068877', 800),
  alt: 'Doctor consultation in a clinical setting',
  credit: {
    name: 'Unsplash',
    url: 'https://unsplash.com/photos/photo-1586773860435-b3c08ae068877'
  }
}

export default CONTACT_HERO_FALLBACK
