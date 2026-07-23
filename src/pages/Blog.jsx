import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { getBranchDataSnapshot } from '../lib/branchDataCache'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import { blogPage } from '../content/blog'
import {
  mergeBlogPosts,
  filterBlogPostsBySearch
} from '../utils/blogPosts'
import { MARKET_ENGAGEMENT_CATEGORY } from '../data/marketEngagementBlogs'
import './Blog.css'

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [highlightedPost, setHighlightedPost] = useState(null)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })
  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.25
  })

  const heroContainerVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.85,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  }

  const heroChildVariants = {
    hidden: { opacity: 0, y: 24, skewY: 4 },
    visible: {
      opacity: 1,
      y: 0,
      skewY: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const heroLineVariants = {
    hidden: { opacity: 0, x: -36 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const breakpointColumnsObj = {
    default: 3,
    1400: 2,
    900: 1
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      setError(null)

      let branch = getBranchDataSnapshot('UK').data?.branch
      if (!branch) {
        const { data, error: branchError } = await supabase
          .from('branches')
          .select('branch_id, branch_code, is_active')
          .eq('branch_code', 'UK')
          .eq('is_active', true)
          .single()

        if (branchError) throw branchError
        if (!data) throw new Error('UK branch not found')
        branch = data
      }

      const [blogsRes, categoriesRes] = await Promise.all([
        supabase
          .from('blogs')
          .select(`
            blog_id,
            title,
            excerpt,
            featured_image,
            author_id,
            published_at,
            status,
            is_public,
            blog_categories:blog_category_assignments(
              blog_categories (blog_category_id, category_name)
            ),
            authors:app_users (first_name, last_name)
          `)
          .eq('branch_id', branch.branch_id)
          .eq('status', 'published')
          .eq('is_public', true)
          .order('published_at', { ascending: false }),
        supabase
          .from('blog_categories')
          .select('blog_category_id, category_name, description')
          .order('category_name', { ascending: true })
      ])

      if (blogsRes.error) throw blogsRes.error
      if (categoriesRes.error) throw categoriesRes.error

      const mergedPosts = mergeBlogPosts(blogsRes.data || [])
      const dbCategories = categoriesRes.data || []
      const hasMarketCategory = dbCategories.some(
        (c) => c.category_name === MARKET_ENGAGEMENT_CATEGORY
      )
      const allCategories = hasMarketCategory
        ? dbCategories
        : [
            ...dbCategories,
            {
              blog_category_id: 'market-engagement',
              category_name: MARKET_ENGAGEMENT_CATEGORY
            }
          ]

      setPosts(mergedPosts)
      setCategories(allCategories)
      setHighlightedPost(mergedPosts[0] || null)
    } catch (err) {
      console.error('Error fetching blogs:', err)
      setError(err.message || 'Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  const categoryFilteredPosts = useMemo(() => {
    if (activeCategory === 'all') return posts
    return posts.filter((post) => post.categories.includes(activeCategory))
  }, [activeCategory, posts])

  const searchedPosts = useMemo(
    () => filterBlogPostsBySearch(categoryFilteredPosts, searchQuery),
    [categoryFilteredPosts, searchQuery]
  )

  const visibleHighlight = searchQuery.trim() ? null : highlightedPost

  const gridPosts = useMemo(() => {
    const data = searchedPosts
    return visibleHighlight
      ? data.filter((post) => post.id !== visibleHighlight.id)
      : data
  }, [searchedPosts, visibleHighlight])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const value = String(formData.get('search') || '').trim()
    if (value) {
      setSearchParams({ search: value })
    } else {
      setSearchParams({})
    }
  }

  const clearSearch = () => {
    setSearchParams({})
  }

  return (
    <div className="blog-page">
      <SEO
        title={pageSeo.blog.title}
        description={pageSeo.blog.description}
        keywords={pageSeo.blog.keywords}
      />
      <div className="blog-hero">
        <div className="blog-hero__media" role="presentation" />
        <div className="blog-hero__overlay" aria-hidden="true" />
        <div className="blog-hero__container container">
          <motion.div
            className="blog-hero__content"
            ref={heroRef}
            variants={heroContainerVariants}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
          >
            <motion.div className="blog-hero__eyebrow" variants={heroChildVariants}>
              {blogPage.hero.eyebrow}
            </motion.div>
            <motion.h1 className="blog-hero__title" variants={heroChildVariants}>
              <motion.span variants={heroLineVariants}>{blogPage.hero.titleLine1}</motion.span>
              <motion.span variants={heroLineVariants}>{blogPage.hero.titleLine2}</motion.span>
            </motion.h1>
            <motion.p className="blog-hero__subtitle" variants={heroChildVariants}>
              {blogPage.hero.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="blog-content">
        <div className="container">
          {loading ? (
            <div className="blog-loading">
              <div className="blog-spinner"></div>
              <p>{blogPage.loading}</p>
            </div>
          ) : error ? (
            <div className="blog-error">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="blog-empty">
              <i className="fas fa-newspaper"></i>
              <p>{blogPage.empty}</p>
            </div>
          ) : gridPosts.length === 0 && searchQuery.trim() ? (
            <div className="blog-empty">
              <i className="fas fa-search"></i>
              <p>{blogPage.empty}</p>
              <button type="button" className="blog-search-clear" onClick={clearSearch}>
                Clear search
              </button>
            </div>
          ) : (
            <>
              {visibleHighlight && (
                <motion.section
                  className="blog-highlight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="highlight-image">
                    <img
                      src={visibleHighlight.image}
                      alt={visibleHighlight.title}
                      loading="lazy"
                    />
                    <span className="highlight-category">{blogPage.featured}</span>
                  </div>
                  <div className="highlight-content">
                    <span className="highlight-meta">
                      {new Date(visibleHighlight.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      &nbsp;•&nbsp;{visibleHighlight.readTime}
                    </span>
                    <h2>{visibleHighlight.title}</h2>
                    <p>{visibleHighlight.excerpt}</p>
                    <div className="highlight-author">By {visibleHighlight.author}</div>
                    <Link to={`/blog/${visibleHighlight.id}`} className="highlight-link">
                      {blogPage.continueReading} <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </motion.section>
              )}

              <form className="blog-search" onSubmit={handleSearchSubmit} role="search">
                <label htmlFor="blog-search-input" className="visually-hidden">
                  {blogPage.searchPlaceholder}
                </label>
                <input
                  id="blog-search-input"
                  name="search"
                  type="search"
                  defaultValue={searchQuery}
                  key={searchQuery}
                  placeholder={blogPage.searchPlaceholder}
                  aria-label={blogPage.searchPlaceholder}
                />
                <button type="submit" className="blog-search-submit">
                  <i className="fas fa-search" aria-hidden="true"></i>
                  <span className="visually-hidden">Search</span>
                </button>
                {searchQuery.trim() && (
                  <p className="blog-search-summary" aria-live="polite">
                    {blogPage.searchResults(searchedPosts.length, searchQuery)}
                  </p>
                )}
              </form>

              <div className="blog-filters" role="tablist" aria-label="Blog categories">
                <button
                  type="button"
                  className={`blog-filter ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                  role="tab"
                  aria-selected={activeCategory === 'all'}
                >
                  {blogPage.filterAll}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.blog_category_id}
                    type="button"
                    className={`blog-filter ${activeCategory === category.category_name ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category.category_name)}
                    role="tab"
                    aria-selected={activeCategory === category.category_name}
                  >
                    {category.category_name}
                  </button>
                ))}
              </div>

              <div className="blog-grid" ref={ref}>
                <AnimatePresence>
                  {gridPosts.map((post, index) => (
              <motion.article
                key={post.id}
                className="blog-card"
                initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 30 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, delay: index * 0.08 }}
                      whileHover={{ y: -6 }}
              >
                <div className="blog-card-image">
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <div className="blog-category">{post.category}</div>
                </div>
                <div className="blog-card-content">
                  <div className="blog-meta">
                    <span className="blog-date">
                            <i className="fas fa-calendar"></i> {new Date(post.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="blog-read-time">
                      <i className="fas fa-clock"></i> {post.readTime}
                    </span>
                  </div>
                  <h2 className="blog-title">
                    <Link to={`/blog/${post.id}`}>{post.title}</Link>
                  </h2>
                  <p className="blog-author">
                    <i className="fas fa-user"></i> By {post.author}
                  </p>
                  <p className="blog-excerpt">{post.excerpt}</p>
                  <Link to={`/blog/${post.id}`} className="blog-read-more">
                    {blogPage.readMore} <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </motion.article>
            ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Blog
