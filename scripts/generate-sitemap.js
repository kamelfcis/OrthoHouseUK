// Script to generate sitemap.xml
// Run with: node scripts/generate-sitemap.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const baseUrl = 'https://orthohouseuk.com' // Update with your actual domain
const currentDate = new Date().toISOString().split('T')[0]

// Static pages
const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily', lastmod: currentDate },
  { url: '/about', priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
  { url: '/products', priority: '0.9', changefreq: 'weekly', lastmod: currentDate },
  { url: '/blog', priority: '0.8', changefreq: 'weekly', lastmod: currentDate },
  { url: '/partners', priority: '0.8', changefreq: 'monthly', lastmod: currentDate },
  { url: '/contact', priority: '0.7', changefreq: 'monthly', lastmod: currentDate },
  { url: '/team', priority: '0.6', changefreq: 'monthly', lastmod: currentDate },
  { url: '/gallery', priority: '0.6', changefreq: 'monthly', lastmod: currentDate },
  { url: '/testimonials', priority: '0.6', changefreq: 'monthly', lastmod: currentDate }
]

// Generate sitemap XML
const generateSitemap = (pages) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return xml
}

// Generate the sitemap
const sitemapContent = generateSitemap(staticPages)

// Write to public folder
const publicDir = path.join(__dirname, '..', 'public')
const sitemapPath = path.join(publicDir, 'sitemap.xml')

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// Write sitemap file
fs.writeFileSync(sitemapPath, sitemapContent, 'utf8')

console.log('✅ Sitemap generated successfully!')
console.log(`📄 Location: ${sitemapPath}`)
console.log(`🌐 URL: ${baseUrl}/sitemap.xml`)
console.log(`📊 Total pages: ${staticPages.length}`)

