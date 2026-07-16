import { toPublicStorageUrl } from './storageUrl'

const CACHE_TTL_MS = 30 * 1000
const STALE_TTL_MS = 2 * 60 * 1000
const BROADCAST_CHANNEL_NAME = 'orthohouse-cache'

const memoryCache = new Map()
const inflightRequests = new Map()
const listeners = new Map()

const getCacheKey = (branchCode) => `branch_data_${branchCode}`

const readSessionCache = (branchCode) => {
  try {
    const raw = sessionStorage.getItem(getCacheKey(branchCode))
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (!data) return null
    return { data, timestamp }
  } catch {
    return null
  }
}

const writeSessionCache = (branchCode, data) => {
  try {
    sessionStorage.setItem(
      getCacheKey(branchCode),
      JSON.stringify({ data, timestamp: Date.now() })
    )
  } catch {
    // sessionStorage may be unavailable or full
  }
}

const clearSessionCache = (branchCode) => {
  try {
    sessionStorage.removeItem(getCacheKey(branchCode))
  } catch {
    // sessionStorage may be unavailable
  }
}

const getCachedEntry = (branchCode) => {
  const memory = memoryCache.get(branchCode)
  if (memory) return memory

  const session = readSessionCache(branchCode)
  if (!session) return null

  const entry = { data: session.data, timestamp: session.timestamp }
  memoryCache.set(branchCode, entry)
  return entry
}

const notifyListeners = (branchCode, data) => {
  const subs = listeners.get(branchCode)
  if (!subs) return
  subs.forEach((cb) => cb(data))
}

const loadSupabase = async () => {
  const { supabase } = await import('./supabase')
  return supabase
}

const buildProductImageMap = (rows) => {
  const map = {}
  rows?.forEach((img) => {
    if (!map[img.product_id]) {
      map[img.product_id] = toPublicStorageUrl('product-images', img.image_url, {
        cacheKey: img.image_id ?? img.created_at ?? img.image_url
      })
    }
  })
  return map
}

const fetchBranchDataFromApi = async (branchCode) => {
  const supabase = await loadSupabase()

  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .select('branch_id, branch_code, branch_name, country_code, currency, timezone, is_active')
    .eq('branch_code', branchCode)
    .eq('is_active', true)
    .single()

  if (branchError) throw branchError
  if (!branch) throw new Error(`Branch ${branchCode} not found`)

  const [
    contentResult,
    infoResult,
    statsResult,
    productsResult,
    partnersResult,
    blogsResult,
    navSettingsResult,
    productImagesResult
  ] = await Promise.all([
    supabase
      .from('branch_page_content')
      .select(`*, page_sections (*)`)
      .eq('branch_id', branch.branch_id)
      .eq('is_active', true)
      .eq('is_public', true),

    supabase
      .from('company_info')
      .select('*')
      .eq('branch_id', branch.branch_id)
      .eq('is_active', true),

    supabase
      .from('company_statistics')
      .select('*')
      .eq('branch_id', branch.branch_id)
      .order('stat_date', { ascending: false }),

    supabase
      .from('branch_products')
      .select(`*, products (*, product_categories (*), partners (*))`)
      .eq('branch_id', branch.branch_id)
      .eq('is_available', true)
      .eq('is_public', true),

    supabase
      .from('branch_partners')
      .select(`*, partners (*)`)
      .eq('branch_id', branch.branch_id)
      .eq('is_active', true),

    supabase
      .from('blogs')
      .select(
        'blog_id, title, excerpt, featured_image, author_id, published_at, status, is_public, branch_id'
      )
      .eq('branch_id', branch.branch_id)
      .eq('status', 'published')
      .eq('is_public', true)
      .order('published_at', { ascending: false })
      .limit(6),

    supabase
      .from('nav_link_settings')
      .select('nav_key, is_visible')
      .eq('branch_id', branch.branch_id),

    supabase
      .from('product_images')
      .select('image_id, product_id, image_url, is_primary, image_order, created_at')
      .eq('branch_id', branch.branch_id)
      .order('is_primary', { ascending: false })
      .order('image_order', { ascending: true })
  ])

  if (contentResult.error) throw contentResult.error
  if (infoResult.error) throw infoResult.error
  if (statsResult.error) throw statsResult.error
  if (productsResult.error) throw productsResult.error
  if (partnersResult.error) throw partnersResult.error
  if (blogsResult.error) throw blogsResult.error

  if (navSettingsResult.error) {
    if (
      navSettingsResult.error.code !== '42P01' &&
      navSettingsResult.error.code !== 'PGRST205'
    ) {
      throw navSettingsResult.error
    }
  }

  if (productImagesResult.error) throw productImagesResult.error

  const contentBySection = {}
  contentResult.data?.forEach((content) => {
    const sectionName = content.page_sections?.section_name
    if (sectionName) {
      contentBySection[sectionName] = content
    }
  })

  const infoByType = {}
  infoResult.data?.forEach((info) => {
    infoByType[info.info_type] = info
  })

  const statsByType = {}
  statsResult.data?.forEach((stat) => {
    if (!statsByType[stat.stat_type]) {
      statsByType[stat.stat_type] = []
    }
    statsByType[stat.stat_type].push(stat)
  })

  const blogs = (blogsResult.data || []).slice(0, 6)
  const navLinkSettings = navSettingsResult.error ? [] : navSettingsResult.data || []
  const productImages = buildProductImageMap(productImagesResult.data)

  return {
    branch,
    pageContent: contentBySection,
    companyInfo: infoByType,
    statistics: statsByType,
    products: productsResult.data || [],
    partners: partnersResult.data || [],
    blogs,
    navLinkSettings,
    productImages
  }
}

export const requestBranchData = async (branchCode, { force = false } = {}) => {
  if (!force) {
    const existing = inflightRequests.get(branchCode)
    if (existing) return existing
  }

  const promise = fetchBranchDataFromApi(branchCode)
    .then((data) => {
      const entry = { data, timestamp: Date.now() }
      memoryCache.set(branchCode, entry)
      writeSessionCache(branchCode, data)
      notifyListeners(branchCode, data)
      return data
    })
    .finally(() => {
      inflightRequests.delete(branchCode)
    })

  inflightRequests.set(branchCode, promise)
  return promise
}

export const getBranchDataSnapshot = (branchCode) => {
  const entry = getCachedEntry(branchCode)
  if (!entry) return { data: null, isFresh: false, isStale: false }

  const age = Date.now() - entry.timestamp
  return {
    data: entry.data,
    isFresh: age <= CACHE_TTL_MS,
    isStale: age > CACHE_TTL_MS && age <= STALE_TTL_MS
  }
}

export const invalidateBranchData = (branchCode = 'UK') => {
  memoryCache.delete(branchCode)
  clearSessionCache(branchCode)
  inflightRequests.delete(branchCode)
  return requestBranchData(branchCode, { force: true })
}

export const broadcastBranchInvalidation = (branchCode = 'UK') => {
  if (typeof BroadcastChannel === 'undefined') return
  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    channel.postMessage({ type: 'invalidate', branchCode })
    channel.close()
  } catch {
    // BroadcastChannel unavailable
  }
}

if (typeof BroadcastChannel !== 'undefined') {
  try {
    const cacheChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    cacheChannel.onmessage = (event) => {
      if (event?.data?.type === 'invalidate') {
        invalidateBranchData(event.data.branchCode || 'UK').catch(() => {})
      }
    }
  } catch {
    // BroadcastChannel unavailable
  }
}

export const subscribeBranchData = (branchCode, onUpdate, onError) => {
  if (!listeners.has(branchCode)) {
    listeners.set(branchCode, new Set())
  }
  listeners.get(branchCode).add(onUpdate)

  const { data, isFresh, isStale } = getBranchDataSnapshot(branchCode)

  if (data) {
    onUpdate(data)
    if (isFresh) {
      return () => listeners.get(branchCode)?.delete(onUpdate)
    }
    if (isStale) {
      requestBranchData(branchCode).catch((err) => onError?.(err.message))
      return () => listeners.get(branchCode)?.delete(onUpdate)
    }
  }

  requestBranchData(branchCode).catch((err) => onError?.(err.message))

  return () => listeners.get(branchCode)?.delete(onUpdate)
}

export const prefetchBranchData = (branchCode = 'UK') => {
  const { isFresh } = getBranchDataSnapshot(branchCode)
  if (!isFresh) {
    requestBranchData(branchCode).catch(() => {})
  }
}
