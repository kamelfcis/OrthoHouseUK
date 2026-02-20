import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import SEO from '../components/SEO/SEO'
import { generateArticleSchema, generateBreadcrumbSchema } from '../utils/seoData'
import './BlogDetail.css'

const BlogDetail = () => {
  const { id } = useParams()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true)
        setError(null)

        const blogId = parseInt(id, 10)
        if (Number.isNaN(blogId)) {
          throw new Error('Invalid blog id')
        }

        const { data, error: blogError } = await supabase
          .from('blogs')
          .select(`
            blog_id,
            title,
            excerpt,
            content,
            featured_image,
            published_at,
            status,
            is_public,
            blog_categories:blog_category_assignments(
              blog_categories (blog_category_id, category_name)
            ),
            authors:app_users (first_name, last_name)
          `)
          .eq('blog_id', blogId)
          .eq('status', 'published')
          .eq('is_public', true)
          .maybeSingle()

        if (blogError) throw blogError
        if (!data) {
          throw new Error('Blog post not found')
        }

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
            const { data: imageData } = supabase.storage
              .from('blog-images')
              .getPublicUrl(candidate)

            if (imageData?.publicUrl) {
              return imageData.publicUrl
            }
          }

          return `${supabaseUrl}/storage/v1/object/public/blog-images/${withoutBucketPrefix}`
        }

        const categories = (data.blog_categories || [])
          .map((item) => item.blog_categories?.category_name)
          .filter(Boolean)

        const authorName = data.authors && data.authors.length > 0
          ? `${data.authors[0].first_name || ''} ${data.authors[0].last_name || ''}`.trim()
          : 'OrthoHouse Team'

        const featuredImage = toStorageUrl(data.featured_image)

        setBlog({
          id: data.blog_id,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          image: featuredImage,
          date: data.published_at,
          categories,
          author: authorName,
        })
      } catch (err) {
        console.error('Error loading blog detail:', err)
        setError(err.message || 'Failed to load blog post')
      } finally {
        setLoading(false)
      }
    }

    fetchBlog()
  }, [id])

  const metaInfo = useMemo(() => {
    if (!blog) return {}
    return {
      formattedDate: blog.date
        ? new Date(blog.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
        : null,
    }
  }, [blog])

  const bodySections = useMemo(() => {
    if (!blog?.content) return []
    return blog.content
      .split(/\n{2,}/)
      .map((section) => section.trim())
      .filter(Boolean)
  }, [blog])

  if (loading) {
    return (
      <div className="blog-detail-page">
        <div className="blog-detail-loading">
          <div className="blog-detail-spinner"></div>
          <p>Loading article...</p>
        </div>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="blog-detail-page">
        <div className="blog-detail-error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error || 'Blog post not found.'}</p>
          <Link to="/blog" className="blog-detail-back">
            <i className="fas fa-arrow-left"></i> Back to blog
          </Link>
        </div>
      </div>
    )
  }

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Blog', url: `${siteUrl}/blog` },
    { name: blog.title, url: `${siteUrl}/blog/${blog.id}` }
  ])

  const articleSchema = generateArticleSchema(blog)
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [articleSchema, breadcrumbs]
  }

  return (
    <div className="blog-detail-page">
      <SEO
        title={blog.title}
        description={blog.excerpt || blog.title}
        image={blog.image}
        url={`${siteUrl}/blog/${blog.id}`}
        type="article"
        author={blog.author}
        publishedTime={blog.date}
        modifiedTime={blog.date}
        structuredData={structuredData}
      />
      <div className="container">
        <div className="blog-detail-header">
          <Link to="/blog" className="blog-detail-back">
            <i className="fas fa-arrow-left"></i> Back to blog
          </Link>
          <div className="blog-detail-meta">
            {metaInfo.formattedDate && (
              <span><i className="fas fa-calendar"></i> {metaInfo.formattedDate}</span>
            )}
            <span><i className="fas fa-user"></i> {blog.author}</span>
          </div>
          <h1>{blog.title}</h1>
          {blog.categories?.length > 0 && (
            <div className="blog-detail-tags">
              {blog.categories.map((category) => (
                <span key={category} className="blog-detail-tag">{category}</span>
              ))}
            </div>
          )}
        </div>

        {blog.image && (
          <motion.div
            className="blog-detail-image"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={blog.image}
              alt={blog.title}
              onError={(e) => {
                e.currentTarget.src = `https://via.placeholder.com/1200x700/64d9b9/ffffff?text=${encodeURIComponent(blog.title.substring(0, 40))}`
              }}
            />
          </motion.div>
        )}

        <motion.div
          className="blog-detail-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {blog.excerpt && (
            <p className="blog-detail-excerpt">{blog.excerpt}</p>
          )}
          {bodySections.length > 0 && (
            <div className="blog-detail-body">
              {bodySections.map((section, index) => (
                <p key={index}>{section}</p>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default BlogDetail

