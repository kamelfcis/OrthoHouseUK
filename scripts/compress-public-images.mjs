#!/usr/bin/env node
/**
 * Compress large public/ assets → responsive WebP under public/assets/optimized/.
 *
 * Usage: node scripts/compress-public-images.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public', 'assets')
const OPTIMIZED = path.join(PUBLIC, 'optimized')

const WIDTHS = [400, 800, 1200]
const WEBP_QUALITY = 82

/** Canonical sources only — skip exact duplicates under images/ */
const TARGETS = [
  { src: 'about.png', category: 'about', name: 'about', siblingWebp: true },
  { src: 'products/our-products-banner.jpg', category: 'products', name: 'our-products-banner' },
  { src: 'events/gallery.jpg', category: 'events', name: 'gallery' },
  { src: 'heroes/partners-hero.jpg', category: 'heroes', name: 'partners-hero' },
  { src: 'events/blogs.jpg', category: 'events', name: 'blogs' }
]

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function optimizeTarget({ src, category, name, siblingWebp }) {
  const srcPath = path.join(PUBLIC, src)
  if (!(await exists(srcPath))) {
    console.warn(`  skip (missing): ${src}`)
    return null
  }

  const originalStat = await fs.stat(srcPath)
  const originalBytes = originalStat.size
  const meta = await sharp(srcPath).metadata()
  const optDir = path.join(OPTIMIZED, category)
  await fs.mkdir(optDir, { recursive: true })

  let optimizedTotal = 0
  const variants = []

  for (const w of WIDTHS) {
    if ((meta.width ?? 0) < w * 0.5) continue
    const outName = `${name}-${w}.webp`
    const outPath = path.join(optDir, outName)
    await sharp(srcPath)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outPath)
    const stat = await fs.stat(outPath)
    optimizedTotal += stat.size
    variants.push({ width: w, bytes: stat.size, path: `/assets/optimized/${category}/${outName}` })
  }

  let siblingBytes = 0
  if (siblingWebp) {
    const siblingPath = srcPath.replace(/\.[^.]+$/, '.webp')
    await sharp(srcPath)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(siblingPath)
    const stat = await fs.stat(siblingPath)
    siblingBytes = stat.size
  }

  const saved = originalBytes - Math.max(siblingBytes, variants.find((v) => v.width === 1200)?.bytes ?? 0)
  console.log(
    `  ${src}: ${Math.round(originalBytes / 1024)}KB → largest WebP ${Math.round((variants.find((v) => v.width === 1200)?.bytes ?? siblingBytes) / 1024)}KB`
  )

  return {
    src,
    category,
    name,
    originalBytes,
    optimizedTotal,
    siblingBytes,
    variants,
    saved
  }
}

async function main() {
  console.log('Compressing public images…\n')

  const results = []
  for (const target of TARGETS) {
    const result = await optimizeTarget(target)
    if (result) results.push(result)
  }

  const report = {
    generatedAt: new Date().toISOString(),
    targets: results,
    totalOriginalBytes: results.reduce((sum, r) => sum + r.originalBytes, 0),
    estimatedSavingsBytes: results.reduce((sum, r) => sum + Math.max(0, r.saved), 0)
  }

  const reportPath = path.join(ROOT, 'scripts', 'tmp', 'compress_public_images_report.json')
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

  const savedMb = (report.estimatedSavingsBytes / (1024 * 1024)).toFixed(1)
  console.log(`\nEstimated savings (largest WebP vs original): ~${savedMb} MB`)
  console.log(`Report: ${path.relative(ROOT, reportPath)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
