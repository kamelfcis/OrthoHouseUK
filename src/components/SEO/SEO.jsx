import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

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
  const siteName = 'OrthoHouse UK - Prosthetics & Biomedical Engineering'
  const defaultTitle = 'OrthoHouse UK - Advanced Prosthetics & Biomedical Engineering Solutions'
  const defaultDescription = 'OrthoHouse UK - Leading provider of prosthetic limbs, orthotic solutions, biomedical devices, and rehabilitation services. Expert consultations and personalized care for patients worldwide.'
  const defaultKeywords = 'orthohouseuk, orthohouse uk, prosthetics, orthotics, biomedical engineering, prosthetic limbs, orthotic devices, rehabilitation, medical devices, custom prosthetics, patient care, healthcare technology, UK prosthetics'

  useEffect(() => {
    // Update document title
    document.title = title ? `${title} | ${siteName}` : defaultTitle

    // Update or create meta tags
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

    // Basic meta tags
    updateMetaTag('description', description || defaultDescription)
    updateMetaTag('keywords', keywords || defaultKeywords)
    if (author) updateMetaTag('author', author)
    
    // Open Graph tags
    updateMetaTag('og:title', title || defaultTitle, 'property')
    updateMetaTag('og:description', description || defaultDescription, 'property')
    updateMetaTag('og:image', ogImage, 'property')
    updateMetaTag('og:url', currentUrl, 'property')
    updateMetaTag('og:type', type, 'property')
    updateMetaTag('og:site_name', siteName, 'property')
    updateMetaTag('og:locale', 'en_US', 'property')
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', 'name')
    updateMetaTag('twitter:title', title || defaultTitle, 'name')
    updateMetaTag('twitter:description', description || defaultDescription, 'name')
    updateMetaTag('twitter:image', ogImage, 'name')
    
    // Article specific tags
    if (type === 'article') {
      if (publishedTime) updateMetaTag('article:published_time', publishedTime, 'property')
      if (modifiedTime) updateMetaTag('article:modified_time', modifiedTime, 'property')
      if (author) updateMetaTag('article:author', author, 'property')
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', currentUrl)

    // Structured Data (JSON-LD)
    if (structuredData) {
      // Remove existing structured data script
      const existingScript = document.querySelector('script[type="application/ld+json"]')
      if (existingScript) {
        existingScript.remove()
      }

      // Add new structured data
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(structuredData)
      document.head.appendChild(script)
    }
  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, structuredData, currentUrl, ogImage, defaultTitle, defaultDescription, defaultKeywords, siteName])

  return null
}

export default SEO

