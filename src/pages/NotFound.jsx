import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import { notFoundPage } from '../content/secondary'
import { ctas } from '../content/site'
import './NotFound.css'

const NotFound = () => {
  return (
    <div className="not-found-page ds-section">
      <SEO
        title={pageSeo.notFound.title}
        description={pageSeo.notFound.description}
        keywords={pageSeo.notFound.keywords}
      />
      <div className="container">
        <motion.div
          className="not-found-content ds-empty-state"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="not-found-title" aria-hidden="true">{notFoundPage.title}</p>
          <h1 className="not-found-subtitle">{notFoundPage.heading}</h1>
          <p className="not-found-text ds-empty-state__message">{notFoundPage.message}</p>
          <Link to="/" className="ds-btn ds-btn--primary">
            {ctas.goHome}
          </Link>
          <nav className="not-found-links" aria-label="Helpful links">
            {notFoundPage.links.map((link) => (
              <Link key={link.path} to={link.path} className="ds-btn ds-btn--secondary">
                {link.label}
              </Link>
            ))}
          </nav>
        </motion.div>
      </div>
    </div>
  )
}

export default NotFound
