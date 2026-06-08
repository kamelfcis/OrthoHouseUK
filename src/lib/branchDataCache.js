const CACHE_TTL_MS = 5 * 60 * 1000
const STALE_TTL_MS = 30 * 60 * 1000

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

const fetchBranchDataFromApi = async (branchCode) => {
  const supabase = await loadSupabase()

  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .select('*')
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
    blogsResult
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
      .select('*')
      .eq('branch_id', branch.branch_id)
      .eq('status', 'published')
      .eq('is_public', true)
      .order('published_at', { ascending: false })
      .limit(6)
  ])

  if (contentResult.error) throw contentResult.error
  if (infoResult.error) throw infoResult.error
  if (statsResult.error) throw statsResult.error
  if (productsResult.error) throw productsResult.error
  if (partnersResult.error) throw partnersResult.error
  if (blogsResult.error) throw blogsResult.error

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

  return {
    branch,
    pageContent: contentBySection,
    companyInfo: infoByType,
    statistics: statsByType,
    products: productsResult.data || [],
    partners: partnersResult.data || [],
    blogs: blogsResult.data || []
  }
}

const requestBranchData = async (branchCode, { force = false } = {}) => {
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
