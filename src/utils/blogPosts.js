import { supabase } from '../lib/supabase'
import { blogPage } from '../content/blog'
import { MARKET_ENGAGEMENT_BLOGS } from '../data/marketEngagementBlogs'

/**
 * Resolve featured_image to a browser-loadable URL.
 * Supports absolute URLs, local /assets paths, and Supabase storage keys.
 */
export const resolveBlogFeaturedImage = (path) => {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('/assets/')) return path

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://ljfkmtuxqaznnmmxeydf.supabase.co').replace(/\/$/, '')
  const normalized = path.trim().replace(/^\/+/, '')
  const withoutStoragePrefix = normalized.replace(/^storage\/v1\/object\/public\//i, '')
  const withoutBucketPrefix = withoutStoragePrefix.replace(/^blog-images\//i, '')

  const candidates = Array.from(new Set([
    normalized,
    withoutStoragePrefix,
    withoutBucketPrefix,
    `blog-images/${withoutBucketPrefix}`
  ])).filter(Boolean)

  for (const candidate of candidates) {
    const { data } = supabase.storage.from('blog-images').getPublicUrl(candidate)
    if (data?.publicUrl) return data.publicUrl
  }

  return `${supabaseUrl}/storage/v1/object/public/blog-images/${withoutBucketPrefix}`
}

const formatReadTime = (content) =>
  blogPage.readTime(Math.max(3, Math.round((content?.split(/\s+/)?.length || 400) / 200)))

/** Normalise a Supabase blogs row into the public blog card shape. */
export const formatSupabaseBlogPost = (post) => {
  const categories = post.blog_categories?.map((item) => item.blog_categories?.category_name).filter(Boolean) || []
  const firstCategory = categories[0] || 'General'
  const authorName = post.authors?.length
    ? `${post.authors[0].first_name || ''} ${post.authors[0].last_name || ''}`.trim()
    : blogPage.defaultAuthor

  const featuredImage = resolveBlogFeaturedImage(post.featured_image)

  return {
    id: post.blog_id,
    title: post.title,
    excerpt: post.excerpt || post.content?.slice(0, 160) || blogPage.defaultExcerpt,
    content: post.content,
    image: featuredImage || null,
    date: post.published_at,
    category: firstCategory,
    categories,
    author: authorName,
    readTime: formatReadTime(post.content),
    searchKeywords: [],
    source: 'supabase'
  }
}

/** Normalise a static market-engagement row into the public blog card shape. */
export const formatMarketEngagementPost = (post) => ({
  id: post.blog_id,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  image: post.featured_image,
  date: post.published_at,
  category: post.category,
  categories: [post.category],
  author: blogPage.defaultAuthor,
  readTime: formatReadTime(post.content),
  searchKeywords: post.searchKeywords || [],
  source: 'market-engagement'
})

/** Merge Supabase posts with static market-engagement articles (deduped by title). */
export const mergeBlogPosts = (supabasePosts = [], staticPosts = MARKET_ENGAGEMENT_BLOGS) => {
  const supabaseTitles = new Set(supabasePosts.map((p) => p.title?.toLowerCase()))
  const uniqueStatic = staticPosts
    .filter((p) => !supabaseTitles.has(p.title?.toLowerCase()))
    .map(formatMarketEngagementPost)

  return [...supabasePosts.map(formatSupabaseBlogPost), ...uniqueStatic].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )
}

/** Client-side search across title, excerpt, body, categories, and keywords. */
export const filterBlogPostsBySearch = (posts, query) => {
  const q = query?.trim().toLowerCase()
  if (!q) return posts

  return posts.filter((post) => {
    const haystack = [
      post.title,
      post.excerpt,
      post.content,
      post.category,
      ...(post.categories || []),
      ...(post.searchKeywords || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(q)
  })
}

/** Raw static rows shaped like Supabase blogs for HomeResources / branch cache. */
export const marketEngagementBlogsForCache = () =>
  MARKET_ENGAGEMENT_BLOGS.map((post) => ({
    blog_id: post.blog_id,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    featured_image: post.featured_image,
    published_at: post.published_at,
    status: post.status,
    is_public: post.is_public
  }))
