import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { defaultSeo } from '../../content/seo'

const PRODUCTION_SITE_URL = 'https://orthohouseuk.com'
const BRAND_NAME = 'OrthoHouse UK'

const setMeta = (name, content, isProperty = false) => {
  if (!content) return
  const attr = isProperty ? 'property' : 'name'
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

const formatTitle = (title) => {
  if (!title || title === 'Home') return defaultSeo.title
  return `${title} | ${BRAND_NAME}`
}

const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  structuredData
}) => {
  const location = useLocation()
  const siteUrl =
    typeof window !== 'undefined' ? window.location.origin : PRODUCTION_SITE_URL
  const pageUrl = url || `${siteUrl}${location.pathname}`
  const pageTitle = formatTitle(title)
  const pageDescription = description || defaultSeo.description
  const pageImage = image || `${siteUrl}/assets/images/logo.png`
  const pageKeywords = keywords || defaultSeo.keywords

  useEffect(() => {
    document.title = pageTitle
    setMeta('description', pageDescription)
    setMeta('keywords', pageKeywords)
    setMeta('og:title', pageTitle, true)
    setMeta('og:description', pageDescription, true)
    setMeta('og:url', pageUrl, true)
    setMeta('og:type', type, true)
    setMeta('og:image', pageImage, true)
    setMeta('og:site_name', defaultSeo.siteName, true)
    setMeta('og:locale', defaultSeo.locale, true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', pageTitle)
    setMeta('twitter:description', pageDescription)
    setMeta('twitter:image', pageImage)
    if (author) setMeta('article:author', author, true)
    if (publishedTime) setMeta('article:published_time', publishedTime, true)
    if (modifiedTime) setMeta('article:modified_time', modifiedTime, true)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', pageUrl)

    let jsonLd = document.getElementById('seo-json-ld')
    if (structuredData) {
      if (!jsonLd) {
        jsonLd = document.createElement('script')
        jsonLd.id = 'seo-json-ld'
        jsonLd.type = 'application/ld+json'
        document.head.appendChild(jsonLd)
      }
      jsonLd.textContent = JSON.stringify(structuredData)
    } else if (jsonLd) {
      jsonLd.remove()
    }
  }, [
    pageTitle,
    pageDescription,
    pageKeywords,
    pageUrl,
    pageImage,
    type,
    author,
    publishedTime,
    modifiedTime,
    structuredData
  ])

  return null
}

export default SEO
