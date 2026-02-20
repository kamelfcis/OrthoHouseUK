import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook to handle smooth scrolling for anchor links
 */
export const useSmoothScroll = () => {
  const location = useLocation()

  useEffect(() => {
    // Handle anchor links
    const handleAnchorClick = (e) => {
      const href = e.target.getAttribute('href')
      if (href && href.startsWith('#')) {
        e.preventDefault()
        const targetId = href.substring(1)
        const targetElement = document.getElementById(targetId)
        if (targetElement) {
          const navbarHeight = document.querySelector('.lte-nav-wrapper')?.offsetHeight || 0
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          })
        }
      }
    }

    // Handle scroll to top on route change
    if (location.hash) {
      setTimeout(() => {
        const element = document.querySelector(location.hash)
        if (element) {
          const navbarHeight = document.querySelector('.lte-nav-wrapper')?.offsetHeight || 0
          const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          })
        }
      }, 100)
    } else {
      window.scrollTo(0, 0)
    }

    document.addEventListener('click', handleAnchorClick)
    return () => document.removeEventListener('click', handleAnchorClick)
  }, [location])
}

