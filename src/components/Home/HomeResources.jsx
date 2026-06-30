import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import useNearViewport from '../../hooks/useNearViewport'
import SectionHeading from '../common/SectionHeading'
import { resolveBlogFeaturedImage } from '../../utils/blogPosts'
import { homeResources } from '../../content/home'
import './HomeResources.css'

const FEATURED_COUNT = 3

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

const buildPosts = (blogs = []) =>
  blogs.slice(0, FEATURED_COUNT).map((post) => {
    let image = post.featured_image
    if (image) {
      image = resolveBlogFeaturedImage(image)
    }

    return {
      id: post.blog_id,
      title: post.title,
      excerpt: post.excerpt || post.content?.slice(0, 140) || '',
      image,
      date: post.published_at
    }
  })

const HomeResources = ({ branchData }) => {
  const [ref, inView] = useNearViewport()

  const posts = useMemo(
    () => buildPosts(branchData?.blogs),
    [branchData?.blogs]
  )

  if (posts.length === 0) {
    return (
      <section
        className="home-resources ds-section ds-section--muted"
        ref={ref}
        aria-labelledby="home-resources-heading"
      >
        <div className="container">
          <SectionHeading
            eyebrow={homeResources.eyebrow}
            title={homeResources.title}
            subtitle={homeResources.subtitle}
            titleId="home-resources-heading"
          />
          <p className="home-resources__empty">{homeResources.empty}</p>
          <div className="home-resources__footer">
            <Link to="/blog" className="btn btn-main">
              {homeResources.viewAll}
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="home-resources ds-section ds-section--muted"
      ref={ref}
      aria-labelledby="home-resources-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeResources.eyebrow}
          title={homeResources.title}
          subtitle={homeResources.subtitle}
          titleId="home-resources-heading"
        />

        <div className={`home-resources__grid reveal-stagger${inView ? ' is-visible' : ''}`}>
          {posts.map((post, index) => (
            <article
              key={post.id}
              className="home-resources__card reveal-item"
              style={{ '--reveal-delay': `${index * 0.1}s` }}
            >
              <Link to={`/blog/${post.id}`} className="home-resources__link">
                {post.image && (
                  <figure className="home-resources__media">
                    <img
                      src={post.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      width={480}
                      height={300}
                    />
                  </figure>
                )}
                <div className="home-resources__body">
                  {post.date && (
                    <time className="home-resources__date" dateTime={post.date}>
                      {formatDate(post.date)}
                    </time>
                  )}
                  <h3 className="home-resources__title">{post.title}</h3>
                  {post.excerpt && (
                    <p className="home-resources__excerpt">{post.excerpt}</p>
                  )}
                  <span className="home-resources__read">
                    {homeResources.readMore}
                    <i className="fas fa-arrow-right" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="home-resources__footer">
          <Link to="/blog" className="btn btn-main">
            {homeResources.viewAll}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HomeResources
