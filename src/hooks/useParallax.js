import { useEffect, useRef } from 'react'

/**
 * Hook for parallax effect matching original template
 */
export const useParallax = (speed = 0.5, enabled = true) => {
  const elementRef = useRef(null)

  useEffect(() => {
    if (!enabled || !elementRef.current) return

    const handleParallax = () => {
      // Only enable on desktop
      if (window.innerWidth <= 768) return

      const scrolled = window.pageYOffset
      const element = elementRef.current
      if (element) {
        const rect = element.getBoundingClientRect()
        const elementTop = rect.top + window.pageYOffset
        const elementHeight = rect.height
        const windowHeight = window.innerHeight

        // Only apply parallax when element is in viewport
        if (scrolled + windowHeight > elementTop && scrolled < elementTop + elementHeight) {
          const rate = (scrolled - elementTop) * speed
          element.style.transform = `translateY(${rate}px)`
        }
      }
    }

    // Throttle scroll events
    let ticking = false
    const scrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleParallax()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', scrollHandler, { passive: true })
    handleParallax() // Initial call

    return () => window.removeEventListener('scroll', scrollHandler)
  }, [speed, enabled])

  return elementRef
}

