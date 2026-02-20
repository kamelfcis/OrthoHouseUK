import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import './Blog.css'

const Blog = () => {
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

  const heroBreadcrumbVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
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

      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('branch_code', 'UK')
        .eq('is_active', true)
        .single()

      if (branchError) throw branchError
      if (!branch) throw new Error('UK branch not found')

      const [blogsRes, categoriesRes] = await Promise.all([
        supabase
          .from('blogs')
          .select(`
            blog_id,
            title,
            excerpt,
            content,
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

      const toStorageUrl = (path) => {
        if (!path) return null
        if (/^https?:\/\//i.test(path)) return path

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
          const { data } = supabase.storage
            .from('blog-images')
            .getPublicUrl(candidate)

          if (data?.publicUrl) {
            return data.publicUrl
          }
        }

        return `${supabaseUrl}/storage/v1/object/public/blog-images/${withoutBucketPrefix}`
      }

      const formattedPosts = (blogsRes.data || []).map((post) => {
        const categories = post.blog_categories?.map((item) => item.blog_categories?.category_name).filter(Boolean) || []
        const firstCategory = categories[0] || 'General'
        const authorName = post.authors && post.authors.length > 0
          ? `${post.authors[0].first_name || ''} ${post.authors[0].last_name || ''}`.trim()
          : 'OrthoHouse Team'

        let featuredImage = post.featured_image
        if (post.featured_image && /^https?:\/\//i.test(post.featured_image)) {
          featuredImage = post.featured_image
        } else if (post.featured_image) {
          featuredImage = toStorageUrl(post.featured_image)
        }

        if (!featuredImage) {
          console.warn('Missing featured image for blog', post.blog_id, post.title)
        }

        return {
          id: post.blog_id,
          title: post.title,
          excerpt: post.excerpt || post.content?.slice(0, 160) || 'Discover the latest at OrthoHouse.',
          content: post.content,
          image: featuredImage || `https://via.placeholder.com/800x500/64d9b9/ffffff?text=${encodeURIComponent(post.title.substring(0, 30))}`,
          date: post.published_at,
          category: firstCategory,
          categories,
          author: authorName,
          readTime: `${Math.max(3, Math.round((post.content?.split(' ')?.length || 400) / 200))} min read`
        }
      })

      setPosts(formattedPosts)
      setCategories(categoriesRes.data || [])
      setHighlightedPost(formattedPosts[0] || null)
    } catch (err) {
      console.error('Error fetching blogs:', err)
      setError(err.message || 'Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = useMemo(() => {
    const data = activeCategory === 'all'
      ? posts
      : posts.filter((post) => post.categories.includes(activeCategory))

    return highlightedPost
      ? data.filter((post) => post.id !== highlightedPost.id)
      : data
  }, [activeCategory, posts, highlightedPost])

  return (
    <div className="blog-page">
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
              Insight Hub
            </motion.div>
            <motion.h1 className="blog-hero__title" variants={heroChildVariants}>
              <motion.span variants={heroLineVariants}>Stories & Innovation</motion.span>
              <motion.span variants={heroLineVariants}>From OrthoHouse UK</motion.span>
            </motion.h1>
            <motion.p className="blog-hero__subtitle" variants={heroChildVariants}>
              Thought leadership, patient journeys, and breakthroughs in prosthetics and biomedical
              engineering from our team across the United Kingdom.
            </motion.p>
            <motion.ul className="blog-hero__breadcrumbs" variants={heroBreadcrumbVariants}>
              <li><Link to="/">Home</Link></li>
              <li>Blog</li>
            </motion.ul>
          </motion.div>
        </div>
      </div>

      <div className="blog-content">
        <div className="container">
          {loading ? (
            <div className="blog-loading">
              <div className="blog-spinner"></div>
              <p>Loading articles...</p>
            </div>
          ) : error ? (
            <div className="blog-error">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="blog-empty">
              <i className="fas fa-newspaper"></i>
              <p>No published blog posts for the UK branch yet.</p>
            </div>
          ) : (
            <>
              {highlightedPost && (
                <motion.section
                  className="blog-highlight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="highlight-image">
                    <img
                      src={highlightedPost.image}
                      alt={highlightedPost.title}
                      loading="lazy"
                    />
                    <span className="highlight-category">Featured</span>
                  </div>
                  <div className="highlight-content">
                    <span className="highlight-meta">
                      {new Date(highlightedPost.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      &nbsp;•&nbsp;{highlightedPost.readTime}
                    </span>
                    <h2>{highlightedPost.title}</h2>
                    <p>{highlightedPost.excerpt}</p>
                    <div className="highlight-author">By {highlightedPost.author}</div>
                    <Link to={`/blog/${highlightedPost.id}`} className="highlight-link">
                      Continue Reading <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </motion.section>
              )}

              <div className="blog-filters" role="tablist" aria-label="Blog categories">
                <button
                  type="button"
                  className={`blog-filter ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                  role="tab"
                  aria-selected={activeCategory === 'all'}
                >
                  All
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
                  {filteredPosts.map((post, index) => (
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
                  <img 
                    src={post.image} 
                    alt={post.title}
                          loading="lazy"
                    onError={(e) => {
                            e.currentTarget.src = `https://via.placeholder.com/800x500/64d9b9/ffffff?text=${encodeURIComponent(post.title.substring(0, 30))}`
                    }}
                  />
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
                    Read More <i className="fas fa-arrow-right"></i>
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
