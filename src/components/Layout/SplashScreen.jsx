import { useEffect, useState } from 'react'
import './SplashScreen.css'

const SplashScreen = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    document.getElementById('splash-instant')?.remove()

    let hasDispatched = false

    const dispatchFinished = () => {
      if (!hasDispatched) {
        hasDispatched = true
        setIsExiting(true)
        setTimeout(() => {
          setIsLoading(false)
          window.dispatchEvent(new CustomEvent('splashFinished'))
        }, 280)
      }
    }

    const timer = setTimeout(dispatchFinished, 350)

    const handleReady = () => {
      dispatchFinished()
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      handleReady()
    } else {
      document.addEventListener('DOMContentLoaded', handleReady, { once: true })
      window.addEventListener('load', handleReady, { once: true })
    }

    return () => {
      clearTimeout(timer)
      document.removeEventListener('DOMContentLoaded', handleReady)
      window.removeEventListener('load', handleReady)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div className={`splash-screen${isExiting ? ' splash-screen--exit' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo-container splash-logo-visible">
          <div className="splash-logo-wrapper">
            <img
              src="/assets/images/Logo_SVG.svg"
              alt="OrthoHouse UK Logo"
              className="splash-logo-spinning"
              width={200}
              height={200}
              fetchpriority="high"
              decoding="sync"
            />
            <div className="splash-pulse-ring"></div>
            <div className="splash-pulse-ring splash-pulse-ring-2"></div>
            <div className="splash-pulse-ring splash-pulse-ring-3"></div>
          </div>
        </div>
        <div className="splash-text splash-fade-in splash-fade-in--delay-1">
          <span className="splash-text-main">ORTHOHOUSE</span>
        </div>
        <div className="splash-loader splash-fade-in splash-fade-in--delay-2">
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
