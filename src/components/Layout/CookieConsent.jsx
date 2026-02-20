import { useState, useEffect } from 'react'
import './CookieConsent.css'

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // Always enabled
    functionality: false,
    experience: false,
    measurement: false,
    marketing: false
  })

  useEffect(() => {
    // Wait for splash screen to finish before showing cookie consent
    const handleSplashFinished = () => {
      // Wait a bit for splash exit animation to complete (0.5s animation + small buffer)
      setTimeout(() => {
        // Check if user has already made a choice
        const cookieConsent = localStorage.getItem('cookieConsent')
        if (!cookieConsent) {
          setShowBanner(true)
        }
      }, 600) // Wait for splash exit animation (0.5s) + small buffer
    }

    // Check if splash has already finished (in case event was dispatched before this component mounted)
    const checkSplashFinished = () => {
      // Check if splash screen element exists and is visible
      const splashElement = document.querySelector('.splash-screen')
      if (!splashElement) {
        // Splash already finished, show cookie consent
        const cookieConsent = localStorage.getItem('cookieConsent')
        if (!cookieConsent) {
          setShowBanner(true)
        }
      }
    }

    // Listen for splash finished event
    window.addEventListener('splashFinished', handleSplashFinished)
    
    // Also check after a delay in case splash already finished
    const checkTimer = setTimeout(checkSplashFinished, 2000) // Check after max splash time

    return () => {
      window.removeEventListener('splashFinished', handleSplashFinished)
      clearTimeout(checkTimer)
    }
  }, [])

  const handleAccept = () => {
    // Accept all cookies
    const allAccepted = {
      necessary: true,
      functionality: true,
      experience: true,
      measurement: true,
      marketing: true
    }
    setPreferences(allAccepted)
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted))
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    setShowBanner(false)
  }

  const handleReject = () => {
    // Only necessary cookies
    const onlyNecessary = {
      necessary: true,
      functionality: false,
      experience: false,
      measurement: false,
      marketing: false
    }
    setPreferences(onlyNecessary)
    localStorage.setItem('cookieConsent', JSON.stringify(onlyNecessary))
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    setShowBanner(false)
  }

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences))
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    setShowBanner(false)
  }

  const handleToggle = (category) => {
    if (category === 'necessary') return // Cannot disable necessary cookies
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const handleClose = () => {
    // Close without changing preferences (use default - only necessary)
    const defaultPrefs = {
      necessary: true,
      functionality: false,
      experience: false,
      measurement: false,
      marketing: false
    }
    localStorage.setItem('cookieConsent', JSON.stringify(defaultPrefs))
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="cookie-consent-overlay">
      <div className="cookie-consent-banner">
        <button className="cookie-consent-close" onClick={handleClose} aria-label="Close">
          <i className="fas fa-times"></i>
        </button>

        <div className="cookie-consent-content">
          <div className="cookie-consent-text">
            <p>
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking "Accept", you consent to all cookies. Click "Reject" to use only essential cookies, or customize your preferences. Learn more in our{' '}
              <a href="/cookie-policy" className="cookie-policy-link">Cookie Policy</a>.
            </p>
          </div>

          {showPreferences && (
            <div className="cookie-preferences">
              <div className="cookie-toggle-item">
                <label>
                  <span>Necessary</span>
                  <div className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={preferences.necessary}
                      disabled
                      readOnly
                    />
                    <span className={`cookie-toggle-slider ${preferences.necessary ? 'active' : ''}`}></span>
                  </div>
                </label>
              </div>

              <div className="cookie-toggle-item">
                <label>
                  <span>Functionality</span>
                  <div className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={preferences.functionality}
                      onChange={() => handleToggle('functionality')}
                    />
                    <span className={`cookie-toggle-slider ${preferences.functionality ? 'active' : ''}`}></span>
                  </div>
                </label>
              </div>

              <div className="cookie-toggle-item">
                <label>
                  <span>Experience</span>
                  <div className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={preferences.experience}
                      onChange={() => handleToggle('experience')}
                    />
                    <span className={`cookie-toggle-slider ${preferences.experience ? 'active' : ''}`}></span>
                  </div>
                </label>
              </div>

              <div className="cookie-toggle-item">
                <label>
                  <span>Measurement</span>
                  <div className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={preferences.measurement}
                      onChange={() => handleToggle('measurement')}
                    />
                    <span className={`cookie-toggle-slider ${preferences.measurement ? 'active' : ''}`}></span>
                  </div>
                </label>
              </div>

              <div className="cookie-toggle-item">
                <label>
                  <span>Marketing</span>
                  <div className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={() => handleToggle('marketing')}
                    />
                    <span className={`cookie-toggle-slider ${preferences.marketing ? 'active' : ''}`}></span>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="cookie-consent-actions">
            <button
              className="cookie-btn cookie-btn-change"
              onClick={() => setShowPreferences(!showPreferences)}
            >
              Change preferences
            </button>
            <button
              className="cookie-btn cookie-btn-reject"
              onClick={handleReject}
            >
              Reject
            </button>
            <button
              className="cookie-btn cookie-btn-accept"
              onClick={showPreferences ? handleSavePreferences : handleAccept}
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent

