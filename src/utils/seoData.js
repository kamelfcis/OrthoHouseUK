// SEO data and structured data generators

export const generateOrganizationSchema = (branchData) => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.orthohouseuk.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'OrthoHouse UK',
    alternateName: ['OrthoHouse UK', 'OrthoHouse', 'orthohouseuk'],
    legalName: 'OrthoHouse UK',
    url: siteUrl,
    logo: `${siteUrl}/assets/images/logo.png`,
    description: 'OrthoHouse UK - Leading provider of prosthetic limbs, orthotic solutions, biomedical devices, and rehabilitation services.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: branchData?.branch?.country || 'UK',
      addressLocality: branchData?.branch?.city || '',
      streetAddress: branchData?.branch?.address || ''
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: branchData?.companyInfo?.phone || '',
      contactType: 'Customer Service',
      areaServed: branchData?.branch?.country || 'UK',
      availableLanguage: ['English']
    },
    sameAs: [
      // Add social media links if available
    ]
  }
}

export const generateWebsiteSchema = () => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.orthohouseuk.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'OrthoHouse UK',
    alternateName: ['OrthoHouse UK', 'orthohouseuk'],
    url: siteUrl,
    description: 'OrthoHouse UK - Advanced Prosthetics & Biomedical Engineering Solutions',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/products?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }
}

export const generateBreadcrumbSchema = (items) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

export const generateProductSchema = (product, branchData) => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.product_name,
    description: product.description || product.local_description || '',
    image: product.image ? [product.image] : [],
    brand: {
      '@type': 'Brand',
      name: product.partner || 'Ortho House'
    },
    category: product.category || '',
    sku: product.product_code || '',
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'GBP',
      url: `${siteUrl}/products/${product.id}`
    }
  }
}

export const generateArticleSchema = (blog) => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.excerpt || '',
    image: blog.image ? [blog.image] : [],
    datePublished: blog.date || new Date().toISOString(),
    dateModified: blog.date || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: blog.author || 'OrthoHouse Team'
    },
    publisher: {
      '@type': 'Organization',
      name: 'OrthoHouse',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/assets/images/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${blog.id}`
    }
  }
}

export const generateServiceSchema = (service) => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title || service.name,
    description: service.description || '',
    provider: {
      '@type': 'Organization',
      name: 'Ortho House'
    },
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom'
    },
    serviceType: service.category || 'Medical Service'
  }
}

export const generateLocalBusinessSchema = (branchData) => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.orthohouseuk.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}#organization`,
    name: 'OrthoHouse UK',
    alternateName: ['Ortho House UK', 'OrthoHouse', 'orthohouseuk'],
    legalName: 'OrthoHouse UK',
    image: `${siteUrl}/assets/images/logo.png`,
    url: siteUrl,
    telephone: branchData?.companyInfo?.phone || '',
    address: {
      '@type': 'PostalAddress',
      streetAddress: branchData?.branch?.address || '',
      addressLocality: branchData?.branch?.city || '',
      addressRegion: branchData?.branch?.region || '',
      postalCode: branchData?.branch?.postal_code || '',
      addressCountry: branchData?.branch?.country || 'UK'
    },
    geo: branchData?.branch?.latitude && branchData?.branch?.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: branchData.branch.latitude,
      longitude: branchData.branch.longitude
    } : undefined,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00'
      }
    ]
  }
}

