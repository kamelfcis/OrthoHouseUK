import { socialLinks as defaultSocialLinks } from '../content/site'

/** @typedef {'linkedin'|'facebook'|'twitter'|'youtube'|'instagram'|'snapchat'|'tiktok'|'email'} SocialPlatform */

/** @type {Record<SocialPlatform, { name: string; icon: string; displayOrder: number }>} */
export const SOCIAL_PLATFORM_META = {
  linkedin: { name: 'LinkedIn', icon: 'fab fa-linkedin-in', displayOrder: 1 },
  facebook: { name: 'Facebook', icon: 'fab fa-facebook-f', displayOrder: 2 },
  twitter: { name: 'X (Twitter)', icon: 'fab fa-twitter', displayOrder: 3 },
  youtube: { name: 'YouTube', icon: 'fab fa-youtube', displayOrder: 4 },
  instagram: { name: 'Instagram', icon: 'fab fa-instagram', displayOrder: 5 },
  snapchat: { name: 'Snapchat', icon: 'fab fa-snapchat-ghost', displayOrder: 6 },
  tiktok: { name: 'TikTok', icon: 'fab fa-tiktok', displayOrder: 7 },
  email: { name: 'Email', icon: 'fas fa-envelope', displayOrder: 8 },
}

export const SOCIAL_PLATFORMS = Object.keys(SOCIAL_PLATFORM_META)

const defaultByPlatform = defaultSocialLinks.reduce((acc, link, index) => {
  const platform = SOCIAL_PLATFORMS[index]
  if (platform) {
    acc[platform] = link.url
  }
  return acc
}, /** @type {Record<string, string>} */ ({}))

export const getDefaultSocialLinkRows = (branchId = 2) =>
  SOCIAL_PLATFORMS.map((platform) => ({
    branch_id: branchId,
    platform,
    url: defaultByPlatform[platform] || '',
    is_visible: true,
    display_order: SOCIAL_PLATFORM_META[platform].displayOrder,
  }))

export const mapSocialRowsToFooterLinks = (rows) => {
  if (!rows?.length) {
    return defaultSocialLinks
  }

  return [...rows]
    .filter((row) => row.is_visible && row.url?.trim())
    .sort((a, b) => a.display_order - b.display_order)
    .map((row) => {
      const meta = SOCIAL_PLATFORM_META[row.platform] || {
        name: row.platform,
        icon: 'fas fa-link',
      }

      return {
        platform: row.platform,
        name: meta.name,
        icon: meta.icon,
        url: row.url,
      }
    })
}

export const mergeSocialRowsWithDefaults = (rows, branchId) => {
  const rowByPlatform = new Map((rows || []).map((row) => [row.platform, row]))

  return SOCIAL_PLATFORMS.map((platform) => {
    const existing = rowByPlatform.get(platform)
    const meta = SOCIAL_PLATFORM_META[platform]

    return {
      social_link_id: existing?.social_link_id ?? null,
      branch_id: existing?.branch_id ?? branchId,
      platform,
      url: existing?.url ?? defaultByPlatform[platform] ?? '',
      is_visible: existing?.is_visible ?? true,
      display_order: existing?.display_order ?? meta.displayOrder,
    }
  })
}

export const fetchVisibleSocialLinks = async (branchCode = 'UK') => {
  const { supabase } = await import('./supabase')

  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .select('branch_id')
    .eq('branch_code', branchCode)
    .eq('is_active', true)
    .maybeSingle()

  if (branchError) throw branchError
  if (!branch) return defaultSocialLinks

  const { data, error } = await supabase
    .from('social_links')
    .select('platform, url, is_visible, display_order')
    .eq('branch_id', branch.branch_id)
    .eq('is_visible', true)
    .order('display_order')

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return defaultSocialLinks
    }
    throw error
  }

  if (!data?.length) {
    return defaultSocialLinks
  }

  return mapSocialRowsToFooterLinks(data)
}

export const fetchSocialLinksForAdmin = async (branchId) => {
  const { supabase } = await import('./supabase')

  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .eq('branch_id', branchId)
    .order('display_order')

  if (error) throw error

  return mergeSocialRowsWithDefaults(data, branchId)
}
