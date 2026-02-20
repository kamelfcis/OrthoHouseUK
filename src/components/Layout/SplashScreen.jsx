import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './SplashScreen.css'

const SplashScreen = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let hasDispatched = false

    const dispatchFinished = () => {
      if (!hasDispatched) {
        hasDispatched = true
        setIsLoading(false)
        // Dispatch event when splash finishes
        window.dispatchEvent(new CustomEvent('splashFinished'))
      }
    }

    // Maximum splash duration - dismiss after this regardless
    const timer = setTimeout(() => {
      dispatchFinished()
    }, 1200)

    // Dismiss as soon as page is fully loaded (or immediately if already loaded)
    const handleLoad = () => {
      dispatchFinished()
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
    }

    return () => {
      clearTimeout(timer)
      window.removeEventListener('load', handleLoad)
    }
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="splash-content">
            <motion.div
              className="splash-logo-container"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="splash-logo-wrapper">
                <img 
                  src="/assets/images/Logo_SVG.png" 
                  alt="OrthoHouse UK Logo" 
                  className="splash-logo-spinning"
                />
                <div className="splash-pulse-ring"></div>
                <div className="splash-pulse-ring splash-pulse-ring-2"></div>
                <div className="splash-pulse-ring splash-pulse-ring-3"></div>
              </div>
            </motion.div>
            <motion.div
              className="splash-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <span className="splash-text-main">ORTHOHOUSE</span>
            </motion.div>
            <motion.div
              className="splash-loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="loader-dot"></div>
              <div className="loader-dot"></div>
              <div className="loader-dot"></div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SplashScreen

