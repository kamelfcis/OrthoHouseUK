import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { testimonialsPage } from '../../content/testimonials'
import './Testimonials.css'

const HomeTestimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const { items: testimonials } = testimonialsPage

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  if (!testimonials.length) return null

  const current = testimonials[currentIndex]

  return (
    <section className="home-testimonials" ref={ref} aria-label={testimonialsPage.heading}>
      <div className="container">
        <motion.blockquote
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <p>&ldquo;{current.text}&rdquo;</p>
          <footer>
            <cite>{current.name}</cite>
            <span>{current.role}</span>
          </footer>
        </motion.blockquote>
      </div>
    </section>
  )
}

export default HomeTestimonials
