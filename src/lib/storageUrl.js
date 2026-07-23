const getSupabaseUrl = () =>
  (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')

export const toPublicStorageUrl = (bucket, path, options = {}) => {
  if (!path) return null

  const { width, quality, cacheKey } = options
  const cleanPath = path.trim().replace(/^\/+/, '')

  if (/^https?:\/\//i.test(cleanPath)) {
    return cleanPath
  }

  const supabaseUrl = getSupabaseUrl()
  if (!supabaseUrl) return null

  const base = `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`
  if (width) {
    const renderBase = `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${cleanPath}`
    const params = new URLSearchParams()
    params.set('width', String(width))
    if (quality) params.set('quality', String(quality))
    if (cacheKey != null) params.set('v', String(cacheKey))
    return `${renderBase}?${params.toString()}`
  }

  if (cacheKey != null) {
    const separator = base.includes('?') ? '&' : '?'
    return `${base}${separator}v=${encodeURIComponent(cacheKey)}`
  }

  return base
}

/**
 * Derive the full-resolution `object` URL from a resized `render/image` URL,
 * preserving the cache-busting `v` param. Returns null when the URL is not a
 * render URL, so error handlers can retry once before showing a placeholder.
 */
export const toOriginalStorageUrl = (url) => {
  if (!url || !url.includes('/storage/v1/render/image/public/')) return null
  try {
    const parsed = new URL(url)
    parsed.pathname = parsed.pathname.replace(
      '/storage/v1/render/image/public/',
      '/storage/v1/object/public/'
    )
    const cacheKey = parsed.searchParams.get('v')
    parsed.search = cacheKey != null ? `?v=${encodeURIComponent(cacheKey)}` : ''
    return parsed.toString()
  } catch {
    return null
  }
}
