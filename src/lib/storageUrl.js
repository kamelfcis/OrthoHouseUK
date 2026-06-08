const getSupabaseUrl = () =>
  (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')

export const toPublicStorageUrl = (bucket, path, options = {}) => {
  if (!path) return null

  const { width, quality } = options
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
    return `${renderBase}?${params.toString()}`
  }

  return base
}
