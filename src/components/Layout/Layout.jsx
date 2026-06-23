import { useState, useEffect, lazy, Suspense } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import GoToTop from './GoToTop'
import { useSmoothScroll } from '../../hooks/useSmoothScroll'
import './Layout.css'

const ChatAssistant = lazy(() => import('./ChatAssistant'))

const Layout = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showChat, setShowChat] = useState(false)
  useSmoothScroll()

  useEffect(() => {
    const loadChat = () => setShowChat(true)
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(loadChat, { timeout: 4000 })
      : setTimeout(loadChat, 2500)

    return () => {
      if (window.requestIdleCallback) {
        window.cancelIdleCallback(idleId)
      } else {
        clearTimeout(idleId)
      }
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 400)
    }

    // Throttle scroll events with requestAnimationFrame for better performance
    let ticking = false
    const scrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', scrollHandler, { passive: true })
    return () => window.removeEventListener('scroll', scrollHandler)
  }, [])

  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      {isScrolled && <GoToTop />}
      {showChat && (
        <Suspense fallback={null}>
          <ChatAssistant />
        </Suspense>
      )}
    </div>
  )
}

export default Layout
