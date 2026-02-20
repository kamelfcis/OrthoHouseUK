import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import './Testimonials.css'

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const testimonials = [
    {
      name: 'John Smith',
      role: 'Prosthetic Patient',
      image: '/assets/images/testimonial-1.jpg',
      text: 'The prosthetic limb I received from Cybron has completely transformed my life. The quality and attention to detail is outstanding, and the team provided exceptional support throughout my journey.',
      rating: 5
    },
    {
      name: 'Sarah Johnson',
      role: 'Orthotic Patient',
      image: '/assets/images/testimonial-2.jpg',
      text: 'The team at Cybron provided exceptional care throughout my entire journey. From the initial consultation to ongoing support, I couldn\'t be happier with the results.',
      rating: 5
    },
    {
      name: 'Michael Brown',
      role: 'Biomedical Device User',
      image: '/assets/images/testimonial-3.jpg',
      text: 'Professional, caring, and innovative. Cybron exceeded all my expectations. The custom solution they created for me has significantly improved my quality of life.',
      rating: 5
    },
    {
      name: 'Emily Davis',
      role: 'Prosthetic Patient',
      image: '/assets/images/testimonial-4.jpg',
      text: 'I am so grateful to the team at Cybron. They listened to my needs and created a solution that perfectly fits my lifestyle. The ongoing support has been incredible.',
      rating: 5
    },
    {
      name: 'Robert Wilson',
      role: 'Orthotic Patient',
      image: '/assets/images/testimonial-5.jpg',
      text: 'The expertise and professionalism at Cybron is unmatched. They helped me regain mobility and confidence. I highly recommend their services to anyone in need.',
      rating: 5
    }
  ]

  useEffect(() => {
    window.scrollTo(0, 0)
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  return (
    <div className="testimonials-page">
      <div className="page-header">
        <div className="container">
          <h1>Testimonials</h1>
          <p>Hear from our patients about their experiences</p>
        </div>
      </div>

      <div className="testimonials-content">
        <div className="container">
          <div className="testimonials-slider" ref={ref}>
            <motion.div
              key={currentIndex}
              className="testimonial-card"
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
                  <div className="author-image">
                    <img src={testimonials[currentIndex].image} alt={testimonials[currentIndex].name} />
                  </div>
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
      </div>
    </div>
  )
}

export default Testimonials
