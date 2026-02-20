import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import './NotFound.css'

const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="container">
        <motion.div
          className="not-found-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">Page Not Found</h2>
          <p className="not-found-text">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link to="/" className="btn btn-main">
            Go Back Home
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export default NotFound
