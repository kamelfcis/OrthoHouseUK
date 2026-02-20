import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { useState } from 'react'
import './Testimonials.css'

const Testimonials = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const testimonials = [
    {
      name: 'John Smith',
      role: 'Patient',
      image: '/assets/images/testimonial-1.jpg',
      text: 'The prosthetic limb I received from Cybron has completely transformed my life. The quality and attention to detail is outstanding.',
      rating: 5
    },
    {
      name: 'Sarah Johnson',
      role: 'Patient',
      image: '/assets/images/testimonial-2.jpg',
      text: 'The team at Cybron provided exceptional care throughout my entire journey. I couldn\'t be happier with the results.',
      rating: 5
    },
    {
      name: 'Michael Brown',
      role: 'Patient',
      image: '/assets/images/testimonial-3.jpg',
      text: 'Professional, caring, and innovative. Cybron exceeded all my expectations. Highly recommend their services.',
      rating: 5
    }
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <section className="testimonials-section" ref={ref}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          <h2 className="section-title">What Our Patients Say</h2>
          <p className="section-subtitle">
            Real stories from people whose lives we've improved
          </p>
        </motion.div>

        <div className="testimonials-slider">
          <motion.div
            className="testimonial-card"
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <div className="testimonial-content">
              <div className="testimonial-rating">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <i key={i} className="fas fa-star"></i>
                ))}
              </div>
              <p className="testimonial-text">"{testimonials[currentIndex].text}"</p>
              <div className="testimonial-author">
                <div className="author-info">
                  <h4 className="author-name">{testimonials[currentIndex].name}</h4>
                  <p className="author-role">{testimonials[currentIndex].role}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="testimonial-nav">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`nav-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
