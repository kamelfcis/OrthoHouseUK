import { useState, useEffect } from 'react'
import { cookieConsent as cookieCopy } from '../../content/site'
import './CookieConsent.css'

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true,
    functionality: false,
    experience: false,
    measurement: false,
    marketing: false
  })

  useEffect(() => {
    const handleSplashFinished = () => {
      setTimeout(() => {
        const stored = localStorage.getItem('cookieConsent')
        if (!stored) setShowBanner(true)
      }, 600)
    }

    const checkSplashFinished = () => {
      if (!document.querySelector('.splash-screen')) {
        const stored = localStorage.getItem('cookieConsent')
        if (!stored) setShowBanner(true)
      }
    }

    window.addEventListener('splashFinished', handleSplashFinished)
    const checkTimer = setTimeout(checkSplashFinished, 2000)

    return () => {
      window.removeEventListener('splashFinished', handleSplashFinished)
      clearTimeout(checkTimer)
    }
  }, [])

  const persist = (next) => {
    localStorage.setItem('cookieConsent', JSON.stringify(next))
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    setShowBanner(false)
  }

  const handleAccept = () => {
    const allAccepted = {
      necessary: true,
      functionality: true,
      experience: true,
      measurement: true,
      marketing: true
    }
    setPreferences(allAccepted)
    persist(allAccepted)
  }

  const handleReject = () => {
    const onlyNecessary = {
      necessary: true,
      functionality: false,
      experience: false,
      measurement: false,
      marketing: false
    }
    setPreferences(onlyNecessary)
    persist(onlyNecessary)
  }

  const handleSavePreferences = () => persist(preferences)

  const handleToggle = (category) => {
    if (category === 'necessary') return
    setPreferences((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  const handleClose = () => {
    persist({
      necessary: true,
      functionality: false,
      experience: false,
      measurement: false,
      marketing: false
    })
  }

  if (!showBanner) return null

  return (
    <div className="cookie-consent-overlay" role="dialog" aria-labelledby="cookie-consent-title" aria-modal="true">
      <div className="cookie-consent-banner">
        <button
          type="button"
          className="cookie-consent-close"
          onClick={handleClose}
          aria-label="Close cookie preferences"
        >
          <i className="fas fa-times" aria-hidden="true"></i>
        </button>

        <div className="cookie-consent-content">
          <div className="cookie-consent-text">
            <p id="cookie-consent-title">
              {cookieCopy.banner}{' '}
              <a href={cookieCopy.policyHref} className="cookie-policy-link">
                {cookieCopy.policyLink}
              </a>.
            </p>
          </div>

          {showPreferences && (
            <div className="cookie-preferences">
              {Object.entries(cookieCopy.categories).map(([key, label]) => (
                <div key={key} className="cookie-toggle-item">
                  <label>
                    <span>{label}</span>
                    <div className="cookie-toggle">
                      <input
                        type="checkbox"
                        checked={preferences[key]}
                        disabled={key === 'necessary'}
                        onChange={() => handleToggle(key)}
                      />
                      <span className={`cookie-toggle-slider ${preferences[key] ? 'active' : ''}`}></span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}

          <div className="cookie-consent-actions">
            <button
              type="button"
              className="cookie-btn cookie-btn-change ds-btn ds-btn--ghost"
              onClick={() => setShowPreferences(!showPreferences)}
            >
              {cookieCopy.changePreferences}
            </button>
            <button type="button" className="cookie-btn cookie-btn-reject ds-btn ds-btn--secondary" onClick={handleReject}>
              {cookieCopy.reject}
            </button>
            <button
              type="button"
              className="cookie-btn cookie-btn-accept ds-btn ds-btn--primary"
              onClick={showPreferences ? handleSavePreferences : handleAccept}
            >
              {cookieCopy.accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
