import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import GoToTop from './GoToTop'
import ChatAssistant from './ChatAssistant'
import { useSmoothScroll } from '../../hooks/useSmoothScroll'
import './Layout.css'

const Layout = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  useSmoothScroll()

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
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
      {isScrolled && <GoToTop />}
      <ChatAssistant />
    </div>
  )
}

export default Layout
