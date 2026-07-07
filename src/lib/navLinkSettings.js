import { nav } from '../content/site'

/** @typedef {'partners'|'blog'} NavToggleKey */

/** @type {Record<NavToggleKey, { label: string; path: string; displayOrder: number }>} */
export const NAV_TOGGLE_META = {
  partners: { label: 'Our Partners', path: '/partners', displayOrder: 1 },
  blog: { label: 'Blog', path: '/blog', displayOrder: 2 },
}

export const NAV_TOGGLE_KEYS = Object.keys(NAV_TOGGLE_META)

const DEFAULT_VISIBILITY = /** @type {Record<NavToggleKey, boolean>} */ ({
  partners: false,
  blog: false,
})

const pathToNavKey = (path) => {
  const entry = NAV_TOGGLE_KEYS.find((key) => NAV_TOGGLE_META[key].path === path)
  return entry || null
}

export const getDefaultNavLinkRows = (branchId = 2) =>
  NAV_TOGGLE_KEYS.map((navKey) => ({
    branch_id: branchId,
    nav_key: navKey,
    is_visible: DEFAULT_VISIBILITY[navKey],
    display_order: NAV_TOGGLE_META[navKey].displayOrder,
  }))

export const mergeNavRowsWithDefaults = (rows, branchId) => {
  const rowByKey = new Map((rows || []).map((row) => [row.nav_key, row]))

  return NAV_TOGGLE_KEYS.map((navKey) => {
    const existing = rowByKey.get(navKey)
    const meta = NAV_TOGGLE_META[navKey]

    return {
      nav_link_setting_id: existing?.nav_link_setting_id ?? null,
      branch_id: existing?.branch_id ?? branchId,
      nav_key: navKey,
      is_visible: existing?.is_visible ?? DEFAULT_VISIBILITY[navKey],
      display_order: existing?.display_order ?? meta.displayOrder,
      label: meta.label,
      path: meta.path,
    }
  })
}

const rowsToVisibility = (rows) => {
  const visibility = { ...DEFAULT_VISIBILITY }

  for (const row of rows || []) {
    if (NAV_TOGGLE_KEYS.includes(row.nav_key)) {
      visibility[row.nav_key] = Boolean(row.is_visible)
    }
  }

  return visibility
}

export const fetchNavVisibility = async (branchCode = 'UK') => {
  const { supabase } = await import('./supabase')

  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .select('branch_id')
    .eq('branch_code', branchCode)
    .eq('is_active', true)
    .maybeSingle()

  if (branchError) throw branchError
  if (!branch) return { ...DEFAULT_VISIBILITY }

  const { data, error } = await supabase
    .from('nav_link_settings')
    .select('nav_key, is_visible')
    .eq('branch_id', branch.branch_id)

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return { ...DEFAULT_VISIBILITY }
    }
    throw error
  }

  if (!data?.length) {
    return { ...DEFAULT_VISIBILITY }
  }

  return rowsToVisibility(data)
}

export const fetchNavLinkSettingsForAdmin = async (branchId) => {
  const { supabase } = await import('./supabase')

  const { data, error } = await supabase
    .from('nav_link_settings')
    .select('*')
    .eq('branch_id', branchId)
    .order('display_order')

  if (error) throw error

  return mergeNavRowsWithDefaults(data, branchId)
}

export const filterNavItems = (items, visibility) =>
  items.filter((item) => {
    if (!item.key) return true
    return Boolean(visibility[item.key])
  })

export const filterFooterResourceLinks = (links, visibility) =>
  links.filter((link) => {
    const navKey = pathToNavKey(link.path)
    if (!navKey) return true
    return Boolean(visibility[navKey])
  })

export const getNavItemsWithKeys = () =>
  nav.items.map((item) => {
    const navKey = NAV_TOGGLE_KEYS.find(
      (key) => NAV_TOGGLE_META[key].path === item.path
    )
    return navKey ? { ...item, key: navKey } : item
  })
