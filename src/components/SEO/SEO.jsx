import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { defaultSeo } from '../../content/seo'

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
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://orthohouseuk.com'
  const currentUrl = url || `${siteUrl}${location.pathname}`
  const defaultImage = `${siteUrl}/assets/images/logo.png`
  const ogImage = image || defaultImage
  const siteName = defaultSeo.siteName
  const defaultTitle = defaultSeo.title
  const defaultDescription = defaultSeo.description
  const defaultKeywords = defaultSeo.keywords

  useEffect(() => {
    document.title = title ? `${title} | ${siteName}` : defaultTitle

    const updateMetaTag = (name, content, attribute = 'name') => {
      if (!content) return

      let element = document.querySelector(`meta[${attribute}="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    updateMetaTag('description', description || defaultDescription)
    updateMetaTag('keywords', keywords || defaultKeywords)
    if (author) updateMetaTag('author', author)

    updateMetaTag('og:title', title || defaultTitle, 'property')
    updateMetaTag('og:description', description || defaultDescription, 'property')
    updateMetaTag('og:image', ogImage, 'property')
    updateMetaTag('og:url', currentUrl, 'property')
    updateMetaTag('og:type', type, 'property')
    updateMetaTag('og:site_name', siteName, 'property')
    updateMetaTag('og:locale', defaultSeo.locale, 'property')

    updateMetaTag('twitter:card', 'summary_large_image', 'name')
    updateMetaTag('twitter:title', title || defaultTitle, 'name')
    updateMetaTag('twitter:description', description || defaultDescription, 'name')
    updateMetaTag('twitter:image', ogImage, 'name')

    if (type === 'article') {
      if (publishedTime) updateMetaTag('article:published_time', publishedTime, 'property')
      if (modifiedTime) updateMetaTag('article:modified_time', modifiedTime, 'property')
      if (author) updateMetaTag('article:author', author, 'property')
    }

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', currentUrl)

    if (structuredData) {
      const existingScript = document.querySelector('script[type="application/ld+json"]')
      if (existingScript) {
        existingScript.remove()
      }

      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(structuredData)
      document.head.appendChild(script)
    }
  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, structuredData, currentUrl, ogImage, defaultTitle, defaultDescription, defaultKeywords, siteName])

  return null
}

export default SEO
