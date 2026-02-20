import { useEffect, useState } from 'react'
import './GoToTop.css'

const GoToTop = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      setIsVisible(scrollTop > 400)
      setIsAtBottom(documentHeight - (scrollTop + windowHeight) < 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    // Smooth scroll matching original template behavior
    const start = window.pageYOffset
    const startTime = 'now' in window.performance ? performance.now() : new Date().getTime()
    const duration = 1200

    const scroll = () => {
      const now = 'now' in window.performance ? performance.now() : new Date().getTime()
      const time = Math.min(1, ((now - startTime) / duration))
      const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
      const timeFunction = easeInOutCubic(time)
      
      window.scrollTo(0, Math.ceil((timeFunction * (0 - start)) + start))

      if (window.pageYOffset > 0) {
        requestAnimationFrame(scroll)
      }
    }
    scroll()
  }

  return (
    <a
      href="#"
      className={`lte-go-top floating lte-go-top-icon ${isVisible ? 'show' : ''} ${isAtBottom ? 'scroll-bottom' : ''}`}
      onClick={(e) => {
        e.preventDefault()
        scrollToTop()
      }}
      aria-label="Go to top"
    >
      <span className="go-top-icon-v2 icon icon-robotic-hand"></span>
    </a>
  )
}

export default GoToTop
