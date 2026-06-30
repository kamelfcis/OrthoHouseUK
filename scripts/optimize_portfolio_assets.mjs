#!/usr/bin/env node
/**
 * Optimise portfolio raw images → public/assets/partners/
 * Usage: node scripts/optimize_portfolio_assets.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MANIFEST_PATH = path.join(ROOT, 'scripts', 'tmp', 'portfolio_manifest.json')
const RAW_DIR = path.join(ROOT, 'scripts', 'tmp', 'portfolio', 'raw')
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'partners')
const DOC_IMAGES = path.join(ROOT, 'scripts', 'tmp', 'product_images')
const REPORT_PATH = path.join(ROOT, 'scripts', 'tmp', 'portfolio_assets_report.json')

const PRODUCT_WIDTHS = [400, 800, 1200]
const MIN_SIZE = 200

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function optimizeLogo(srcPath, destPath) {
  await fs.mkdir(path.dirname(destPath), { recursive: true })
  await sharp(srcPath)
    .resize({ width: 512, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(destPath)
  const stat = await fs.stat(destPath)
  return { path: destPath, bytes: stat.size }
}

async function optimizeProduct(srcPath, destBase) {
  const results = []
  for (const w of PRODUCT_WIDTHS) {
    const out = `${destBase}-${w}.webp`
    await fs.mkdir(path.dirname(out), { recursive: true })
    await sharp(srcPath)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(out)
    const stat = await fs.stat(out)
    results.push({ width: w, path: out, bytes: stat.size })
  }
  return results
}

function resolveImagePath(relPath) {
  if (!relPath) return null
  if (relPath.includes('/')) {
    return path.join(RAW_DIR, relPath)
  }
  return path.join(DOC_IMAGES, relPath)
}

async function main() {
  if (!(await exists(MANIFEST_PATH))) {
    console.error('Run extract-portfolio first:', MANIFEST_PATH)
    process.exit(1)
  }

  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'))
  const report = { logos: [], products: [], errors: [] }

  for (const partner of manifest.partners || []) {
    const code = partner.partner_code
    if (!partner.logo_file) {
      report.errors.push(`No logo for ${code}`)
      continue
    }
    const src = path.join(RAW_DIR, partner.logo_file)
    if (!(await exists(src))) {
      report.errors.push(`Missing logo source: ${src}`)
      continue
    }
    const dest = path.join(OUT_DIR, code.toLowerCase(), 'logo.webp')
    const info = await optimizeLogo(src, dest)
    partner.logo_optimized = `/assets/partners/${code.toLowerCase()}/logo.webp`
    report.logos.push({ partner: code, ...info })
    console.log(`Logo ${code}: ${info.bytes} bytes`)
  }

  for (const product of manifest.products || []) {
    const partnerCode = (product.partner_code || 'ASTROLABE').toLowerCase()
    const productKey = (product.key || product.product_code || 'product').toLowerCase()
    const imageRefs = [
      ...(product.portfolio_images || []),
      ...(product.images || []).map((f) => (f.includes('/') ? f : null)).filter(Boolean),
    ]

    let srcPath = null
    for (const ref of imageRefs) {
      const candidate = resolveImagePath(ref)
      if (candidate && (await exists(candidate))) {
        srcPath = candidate
        break
      }
    }

    // Fallback: docx product images
    if (!srcPath && product.images?.length) {
      const docPath = path.join(DOC_IMAGES, product.images[0])
      if (await exists(docPath)) srcPath = docPath
    }

    if (!srcPath) {
      report.errors.push(`No image for ${product.name}`)
      continue
    }

    const meta = await sharp(srcPath).metadata()
    if ((meta.width || 0) < MIN_SIZE && (meta.height || 0) < MIN_SIZE) {
      report.errors.push(`Too small: ${product.name}`)
      continue
    }

    const destBase = path.join(OUT_DIR, partnerCode, 'products', productKey)
    const variants = await optimizeProduct(srcPath, destBase)
    product.image_optimized_base = `/assets/partners/${partnerCode}/products/${productKey}`
    product.image_variants = variants.map((v) => ({
      width: v.width,
      path: v.path.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '/'),
    }))
    report.products.push({ product: product.name, variants: variants.length })
    console.log(`Product ${product.name}: ${variants.length} sizes`)
  }

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`\nReport: ${REPORT_PATH}`)
  console.log(`Logos: ${report.logos.length}, Products: ${report.products.length}, Errors: ${report.errors.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
