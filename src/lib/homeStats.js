import { homeStats as homeStatsContent } from '../content/home'

/** @typedef {'employees'|'surgeons'|'hospitals'|'operations'|'partners'|'events'} HomeStatKey */

/** @type {HomeStatKey[]} */
export const HOME_STAT_KEYS = [
  'employees',
  'surgeons',
  'hospitals',
  'operations',
  'partners',
  'events',
]

/** @type {Record<HomeStatKey, { label: string; displayOrder: number }>} */
export const HOME_STAT_META = {
  employees: { label: 'Employees', displayOrder: 1 },
  surgeons: { label: 'Surgeons supported', displayOrder: 2 },
  hospitals: { label: 'Partner hospitals', displayOrder: 3 },
  operations: { label: 'Theatre cases supported daily', displayOrder: 4 },
  partners: { label: 'Manufacturing partners', displayOrder: 5 },
  events: { label: 'Education events per year', displayOrder: 6 },
}

const contentItemByKey = Object.fromEntries(
  (homeStatsContent.items || []).map((item) => [item.key, item])
)

/** @type {Record<HomeStatKey, { stat_value: number; stat_suffix: string; label: string; icon: string; display_order: number }>} */
const DEFAULT_HOME_STATS = HOME_STAT_KEYS.reduce((acc, key, index) => {
  const content = contentItemByKey[key]
  const meta = HOME_STAT_META[key]

  acc[key] = {
    stat_value: content?.number ?? 0,
    stat_suffix: content?.suffix ?? '',
    label: content?.label ?? meta.label,
    icon: content?.icon ?? 'fa-chart-line',
    display_order: meta.displayOrder ?? index + 1,
  }

  return acc
}, /** @type {Record<HomeStatKey, { stat_value: number; stat_suffix: string; label: string; icon: string; display_order: number }>} */ ({}))

export const getDefaultHomeStatRows = (branchId = 2) =>
  HOME_STAT_KEYS.map((statKey) => ({
    branch_id: branchId,
    stat_key: statKey,
    ...DEFAULT_HOME_STATS[statKey],
  }))

export const mergeHomeStatRowsWithDefaults = (rows, branchId) => {
  const rowByKey = new Map((rows || []).map((row) => [row.stat_key, row]))

  return HOME_STAT_KEYS.map((statKey) => {
    const existing = rowByKey.get(statKey)
    const defaults = DEFAULT_HOME_STATS[statKey]
    const meta = HOME_STAT_META[statKey]

    return {
      home_stat_id: existing?.home_stat_id ?? null,
      branch_id: existing?.branch_id ?? branchId,
      stat_key: statKey,
      stat_value: existing?.stat_value ?? defaults.stat_value,
      stat_suffix: existing?.stat_suffix ?? defaults.stat_suffix,
      label: existing?.label ?? defaults.label,
      icon: existing?.icon ?? defaults.icon,
      display_order: existing?.display_order ?? meta.displayOrder,
      metaLabel: meta.label,
    }
  })
}

const rowsToStatItems = (rows) =>
  mergeHomeStatRowsWithDefaults(rows).map((row) => ({
    key: row.stat_key,
    number: Number(row.stat_value),
    suffix: row.stat_suffix || '',
    label: row.label,
    icon: row.icon,
  }))

const fetchBranchId = async (branchCode) => {
  const { supabase } = await import('./supabase')

  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .select('branch_id')
    .eq('branch_code', branchCode)
    .eq('is_active', true)
    .maybeSingle()

  if (branchError) throw branchError
  return branch?.branch_id ?? null
}

export const fetchHomeStats = async (branchCode = 'UK') => {
  try {
    const branchId = await fetchBranchId(branchCode)
    if (!branchId) {
      return {
        eyebrow: homeStatsContent.eyebrow,
        title: homeStatsContent.title,
        subtitle: homeStatsContent.subtitle,
        items: rowsToStatItems([]),
      }
    }

    const { supabase } = await import('./supabase')

    const { data, error } = await supabase
      .from('home_stats')
      .select('stat_key, stat_value, stat_suffix, label, icon, display_order')
      .eq('branch_id', branchId)
      .order('display_order')

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return {
          eyebrow: homeStatsContent.eyebrow,
          title: homeStatsContent.title,
          subtitle: homeStatsContent.subtitle,
          items: rowsToStatItems([]),
        }
      }
      throw error
    }

    return {
      eyebrow: homeStatsContent.eyebrow,
      title: homeStatsContent.title,
      subtitle: homeStatsContent.subtitle,
      items: rowsToStatItems(data),
    }
  } catch {
    return {
      eyebrow: homeStatsContent.eyebrow,
      title: homeStatsContent.title,
      subtitle: homeStatsContent.subtitle,
      items: rowsToStatItems([]),
    }
  }
}

export const fetchHomeStatsForAdmin = async (branchId) => {
  const { supabase } = await import('./supabase')

  const { data, error } = await supabase
    .from('home_stats')
    .select('*')
    .eq('branch_id', branchId)
    .order('display_order')

  if (error) throw error

  return mergeHomeStatRowsWithDefaults(data, branchId)
}

export const saveHomeStatsForAdmin = async (branchId, rows) => {
  const { supabase } = await import('./supabase')

  const payload = rows.map((row) => ({
    branch_id: branchId,
    stat_key: row.stat_key,
    stat_value: Number(row.stat_value) || 0,
    stat_suffix: row.stat_suffix || '',
    label: row.label?.trim() || HOME_STAT_META[row.stat_key]?.label || row.stat_key,
    icon: row.icon || DEFAULT_HOME_STATS[row.stat_key]?.icon || 'fa-chart-line',
    display_order: row.display_order,
  }))

  const { error } = await supabase
    .from('home_stats')
    .upsert(payload, { onConflict: 'branch_id,stat_key' })

  if (error) throw error
}
