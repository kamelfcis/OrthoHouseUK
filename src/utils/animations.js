/**
 * Animation utilities matching original template functionality
 */

// Smooth scroll to element
export const smoothScrollTo = (target, offset = 0) => {
  const element = typeof target === 'string' ? document.querySelector(target) : target
  if (element) {
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - offset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

// Smooth scroll to top
export const scrollToTop = (duration = 1200) => {
  const start = window.pageYOffset
  const startTime = 'now' in window.performance ? performance.now() : new Date().getTime()

  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  )
  const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight
  const destinationOffsetToScroll = documentHeight - windowHeight
  const destinationOffsetToScrollTo = destinationOffsetToScroll < 0 ? 0 : destinationOffsetToScroll

  if ('requestAnimationFrame' in window === false) {
    window.scroll(0, destinationOffsetToScrollTo)
    return
  }

  function scroll() {
    const now = 'now' in window.performance ? performance.now() : new Date().getTime()
    const time = Math.min(1, ((now - startTime) / duration))
    const timeFunction = easeInOutCubic(time)
    window.scroll(0, Math.ceil((timeFunction * (destinationOffsetToScrollTo - start)) + start))

    if (window.pageYOffset === destinationOffsetToScrollTo) {
      return
    }
    requestAnimationFrame(scroll)
  }
  scroll()
}

// Easing function
const easeInOutCubic = (t) => {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
}

// Parallax effect
export const initParallax = (element, speed = 0.5) => {
  if (!element) return

  const handleScroll = () => {
    if (window.innerWidth > 768) {
      const scrolled = window.pageYOffset
      const rate = scrolled * speed
      element.style.transform = `translateY(${rate}px)`
    }
  }

  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}

// Match height for elements
export const matchHeight = (selector) => {
  const elements = document.querySelectorAll(selector)
  if (elements.length === 0) return

  let maxHeight = 0
  elements.forEach((el) => {
    el.style.height = 'auto'
    const height = el.offsetHeight
    if (height > maxHeight) maxHeight = height
  })

  elements.forEach((el) => {
    el.style.height = `${maxHeight}px`
  })
}

// Debounce function
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

