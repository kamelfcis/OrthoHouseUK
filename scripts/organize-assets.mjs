#!/usr/bin/env node
/**
 * Organise repo images into structured folders, dedupe, and emit WebP responsive sizes.
 *
 * Usage: node scripts/organize-assets.mjs
 *
 * Source folders:
 *   public/assets/images/          — legacy flat assets
 *   public/assets/presentation/raw — PDF extractions
 *   scripts/tmp/product_images/    — product catalogue extractions (reference only)
 *
 * Output:
 *   public/assets/{brand,team,office,events,partners,products,heroes,presentation}/
 *   public/assets/optimized/{category}/{name}-{400|800|1200}.webp
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public', 'assets')
const LEGACY = path.join(PUBLIC, 'images')
const PDF_RAW = path.join(PUBLIC, 'presentation', 'raw')
const PRODUCT_TMP = path.join(ROOT, 'scripts', 'tmp', 'product_images')
const OPTIMIZED = path.join(PUBLIC, 'optimized')
const MANIFEST_PATH = path.join(ROOT, 'scripts', 'tmp', 'asset_manifest.json')

const WIDTHS = [400, 800, 1200]
const MIN_QUALITY_WIDTH = 800

/** Manual classification for legacy flat images */
const LEGACY_MAP = {
  'ceo.jpeg': { category: 'team', name: 'ceo-waleed-emad' },
  'logo.png': { category: 'brand', name: 'logo-primary' },
  'logo2.png': { category: 'brand', name: 'logo-alt' },
  'logo-white.png': { category: 'brand', name: 'logo-white' },
  'Logo_nav.png': { category: 'brand', name: 'logo-nav' },
  'Logo_SVG.png': { category: 'brand', name: 'logo-svg-png' },
  'Logo_SVG.svg': { category: 'brand', name: 'logo-svg', skipOptimize: true },
  'partners-hero.jpg': { category: 'heroes', name: 'partners-hero' },
  'ourmission.jpg': { category: 'office', name: 'our-mission' },
  'ourproducts.jpg': { category: 'products', name: 'our-products-banner' },
  'contact us.jpg': { category: 'office', name: 'contact-office' },
  'gallery.jpg': { category: 'events', name: 'gallery' },
  'blogs.jpg': { category: 'events', name: 'blogs' },
  'multi-doc.png': { category: 'team', name: 'clinical-team' },
  'medicalconsultation.png': { category: 'office', name: 'medical-consultation' },
  'biomedical.png': { category: 'products', name: 'biomedical' },
  'orthoticsolutions.png': { category: 'products', name: 'orthotic-solutions' },
  'protheticlimp.png': { category: 'products', name: 'prosthetic-limb' },
  'rehabiliation.png': { category: 'products', name: 'rehabilitation' },
  'mainteinance.png': { category: 'office', name: 'maintenance' },
  'location.png': { category: 'office', name: 'location-icon', skipOptimize: true },
  'slider-bg-lines.png': { category: 'brand', name: 'slider-bg-lines', skipOptimize: true },
  'video-play.png': { category: 'brand', name: 'video-play', skipOptimize: true },
  'video-play-big.png': { category: 'brand', name: 'video-play-big', skipOptimize: true },
  'on.png': { category: 'brand', name: 'toggle-on', skipOptimize: true },
  'off.png': { category: 'brand', name: 'toggle-off', skipOptimize: true }
}

/** Keyword-based classification for PDF extractions */
const PDF_KEYWORDS = [
  { pattern: /event|boa|bofas|bess|conference|exhibit/i, category: 'events' },
  { pattern: /team|staff|people|ceo|waleed|founder/i, category: 'team' },
  { pattern: /office|london|kingdom street|headquarter|building/i, category: 'office' },
  { pattern: /partner|manufacturer|brand|logo/i, category: 'partners' },
  { pattern: /product|implant|trauma|arthroplasty|graft/i, category: 'products' },
  { pattern: /hero|cover|welcome|about/i, category: 'heroes' }
]

const hashBuffer = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16)

const classifyPdf = (filename) => {
  for (const { pattern, category } of PDF_KEYWORDS) {
    if (pattern.test(filename)) return category
  }
  return 'presentation'
}

const cleanName = (base) =>
  base
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest))
  await fs.copyFile(src, dest)
}

async function optimizeImage(srcPath, category, name, meta) {
  const isSvg = srcPath.toLowerCase().endsWith('.svg')
  const destCategoryDir = path.join(PUBLIC, category)
  const baseDest = path.join(destCategoryDir, `${name}${path.extname(srcPath)}`)

  await copyFile(srcPath, baseDest)

  if (isSvg || meta.skipOptimize) {
    return {
      ...meta,
      category,
      name,
      source: path.relative(ROOT, srcPath),
      publicPath: `/assets/${category}/${path.basename(baseDest)}`,
      quality_ok: true,
      optimized: false
    }
  }

  const input = sharp(srcPath)
  const info = await input.metadata()
  const qualityOk = (info.width ?? 0) >= MIN_QUALITY_WIDTH

  const optDir = path.join(OPTIMIZED, category)
  await ensureDir(optDir)

  const sizes = {}
  for (const w of WIDTHS) {
    if ((info.width ?? 0) < w * 0.5) continue
    const outName = `${name}-${w}.webp`
    const outPath = path.join(optDir, outName)
    await sharp(srcPath)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outPath)
    sizes[w] = `/assets/optimized/${category}/${outName}`
  }

  // Default src = largest available or original
  const defaultSrc =
    sizes[1200] || sizes[800] || sizes[400] || `/assets/${category}/${path.basename(baseDest)}`

  return {
    ...meta,
    category,
    name,
    source: path.relative(ROOT, srcPath),
    publicPath: defaultSrc,
    srcSet: sizes,
    width: info.width,
    height: info.height,
    quality_ok: qualityOk,
    optimized: true
  }
}

async function collectLegacy() {
  const entries = []
  let files
  try {
    files = await fs.readdir(LEGACY)
  } catch {
    return entries
  }

  for (const file of files) {
    const mapping = LEGACY_MAP[file]
    if (!mapping) {
      const lower = file.toLowerCase()
      if (lower.includes('guideline') || lower.includes('ortho_house')) {
        entries.push({
          src: path.join(LEGACY, file),
          category: 'brand',
          name: 'brand-guideline',
          skipOptimize: true
        })
      }
      continue
    }
    entries.push({ src: path.join(LEGACY, file), ...mapping })
  }
  return entries
}

async function collectPdf() {
  const entries = []
  let files
  try {
    files = await fs.readdir(PDF_RAW)
  } catch {
    return entries
  }

  for (const file of files) {
    const category = classifyPdf(file)
    const name = cleanName(file.replace(/^\d+x\d+\./, '').replace(/p\d{2}-/, ''))
    entries.push({ src: path.join(PDF_RAW, file), category, name })
  }
  return entries
}

async function main() {
  console.log('Organising assets…\n')

  const categories = ['brand', 'team', 'office', 'events', 'partners', 'products', 'heroes', 'presentation']
  for (const cat of categories) {
    await ensureDir(path.join(PUBLIC, cat))
    await ensureDir(path.join(OPTIMIZED, cat))
  }

  const seenHashes = new Map()
  const manifest = []
  const skippedDup = []

  const sources = [...(await collectLegacy()), ...(await collectPdf())]

  for (const item of sources) {
    const buf = await fs.readFile(item.src)
    const hash = hashBuffer(buf)
    if (seenHashes.has(hash)) {
      skippedDup.push({ file: item.src, duplicateOf: seenHashes.get(hash) })
      continue
    }
    seenHashes.set(hash, item.name)

    const entry = await optimizeImage(item.src, item.category, item.name, {
      skipOptimize: item.skipOptimize ?? false
    })
    manifest.push(entry)
    const flag = entry.quality_ok ? 'OK' : 'low-res'
    console.log(`  [${flag}] ${entry.category}/${entry.name}`)
  }

  // Inventory product tmp (no copy — Supabase is source of truth)
  let productCount = 0
  try {
    const productFiles = await fs.readdir(PRODUCT_TMP)
    productCount = productFiles.filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).length
  } catch {
    productCount = 0
  }

  const output = {
    generatedAt: new Date().toISOString(),
    productTmpCount: productCount,
    skippedDuplicates: skippedDup,
    assets: manifest
  }

  await ensureDir(path.dirname(MANIFEST_PATH))
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(output, null, 2))

  console.log(`\nManifest: ${path.relative(ROOT, MANIFEST_PATH)}`)
  console.log(`Assets: ${manifest.length}, duplicates skipped: ${skippedDup.length}`)
  console.log(`Product tmp reference images: ${productCount} (not copied — use Supabase)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
