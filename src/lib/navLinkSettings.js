import { nav } from '../content/site'

/** @typedef {'partners'|'blog'} NavToggleKey */
/** @typedef {'home_specialties'|'home_featured_products'|'home_resources'} HomeSectionKey */

/** @type {Record<NavToggleKey, { label: string; path: string; displayOrder: number }>} */
export const NAV_TOGGLE_META = {
  partners: { label: 'Our Partners', path: '/partners', displayOrder: 1 },
  blog: { label: 'Blog', path: '/blog', displayOrder: 2 },
}

/** @type {Record<HomeSectionKey, { label: string; subtitle: string; checkboxLabel: string; displayOrder: number }>} */
export const HOME_SECTION_META = {
  home_specialties: {
    label: 'Clinical specialties',
    subtitle: 'Orthopaedic categories we serve',
    checkboxLabel: 'Show Clinical specialties section on homepage',
    displayOrder: 10,
  },
  home_featured_products: {
    label: 'Featured implant systems',
    subtitle: 'Product portfolio',
    checkboxLabel: 'Show Featured products section on homepage',
    displayOrder: 20,
  },
  home_resources: {
    label: 'Latest from our blog',
    subtitle: 'Resources and insights',
    checkboxLabel: 'Show Latest from our blog section on homepage',
    displayOrder: 30,
  },
}

export const NAV_TOGGLE_KEYS = Object.keys(NAV_TOGGLE_META)
export const HOME_SECTION_KEYS = Object.keys(HOME_SECTION_META)

const DEFAULT_NAV_VISIBILITY = /** @type {Record<NavToggleKey, boolean>} */ ({
  partners: false,
  blog: false,
})

const DEFAULT_HOME_SECTION_VISIBILITY = /** @type {Record<HomeSectionKey, boolean>} */ ({
  home_specialties: true,
  home_featured_products: true,
  home_resources: true,
})

const pathToNavKey = (path) => {
  const entry = NAV_TOGGLE_KEYS.find((key) => NAV_TOGGLE_META[key].path === path)
  return entry || null
}

export const getDefaultNavLinkRows = (branchId = 2) =>
  NAV_TOGGLE_KEYS.map((navKey) => ({
    branch_id: branchId,
    nav_key: navKey,
    is_visible: DEFAULT_NAV_VISIBILITY[navKey],
    display_order: NAV_TOGGLE_META[navKey].displayOrder,
  }))

export const getDefaultHomeSectionRows = (branchId = 2) =>
  HOME_SECTION_KEYS.map((sectionKey) => ({
    branch_id: branchId,
    nav_key: sectionKey,
    is_visible: DEFAULT_HOME_SECTION_VISIBILITY[sectionKey],
    display_order: HOME_SECTION_META[sectionKey].displayOrder,
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
      is_visible: existing?.is_visible ?? DEFAULT_NAV_VISIBILITY[navKey],
      display_order: existing?.display_order ?? meta.displayOrder,
      label: meta.label,
      path: meta.path,
    }
  })
}

export const mergeHomeSectionRowsWithDefaults = (rows, branchId) => {
  const rowByKey = new Map((rows || []).map((row) => [row.nav_key, row]))

  return HOME_SECTION_KEYS.map((sectionKey) => {
    const existing = rowByKey.get(sectionKey)
    const meta = HOME_SECTION_META[sectionKey]

    return {
      nav_link_setting_id: existing?.nav_link_setting_id ?? null,
      branch_id: existing?.branch_id ?? branchId,
      nav_key: sectionKey,
      is_visible: existing?.is_visible ?? DEFAULT_HOME_SECTION_VISIBILITY[sectionKey],
      display_order: existing?.display_order ?? meta.displayOrder,
      label: meta.label,
      subtitle: meta.subtitle,
      checkboxLabel: meta.checkboxLabel,
    }
  })
}

const rowsToNavVisibility = (rows) => {
  const visibility = { ...DEFAULT_NAV_VISIBILITY }

  for (const row of rows || []) {
    if (NAV_TOGGLE_KEYS.includes(row.nav_key)) {
      visibility[row.nav_key] = Boolean(row.is_visible)
    }
  }

  return visibility
}

const rowsToHomeSectionVisibility = (rows) => {
  const visibility = { ...DEFAULT_HOME_SECTION_VISIBILITY }

  for (const row of rows || []) {
    if (HOME_SECTION_KEYS.includes(row.nav_key)) {
      visibility[row.nav_key] = Boolean(row.is_visible)
    }
  }

  return visibility
}

const fetchBranchSettingsRows = async (branchCode) => {
  const { supabase } = await import('./supabase')

  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .select('branch_id')
    .eq('branch_code', branchCode)
    .eq('is_active', true)
    .maybeSingle()

  if (branchError) throw branchError
  if (!branch) return []

  const { data, error } = await supabase
    .from('nav_link_settings')
    .select('nav_key, is_visible')
    .eq('branch_id', branch.branch_id)

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return []
    }
    throw error
  }

  return data || []
}

export const fetchNavVisibility = async (branchCode = 'UK') => {
  try {
    const rows = await fetchBranchSettingsRows(branchCode)
    if (!rows.length) return { ...DEFAULT_NAV_VISIBILITY }
    return rowsToNavVisibility(rows)
  } catch {
    return { ...DEFAULT_NAV_VISIBILITY }
  }
}

export const fetchHomeSectionVisibility = async (branchCode = 'UK') => {
  try {
    const rows = await fetchBranchSettingsRows(branchCode)
    if (!rows.length) return { ...DEFAULT_HOME_SECTION_VISIBILITY }
    return rowsToHomeSectionVisibility(rows)
  } catch {
    return { ...DEFAULT_HOME_SECTION_VISIBILITY }
  }
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

export const fetchHomeSectionSettingsForAdmin = async (branchId) => {
  const { supabase } = await import('./supabase')

  const { data, error } = await supabase
    .from('nav_link_settings')
    .select('*')
    .eq('branch_id', branchId)
    .order('display_order')

  if (error) throw error

  return mergeHomeSectionRowsWithDefaults(data, branchId)
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
