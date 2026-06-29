import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { matchHeight } from '../../utils/animations'
import { homeSpecialties } from '../../content/home'
import './Services.css'

const Services = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const servicesGridRef = useRef(null)

  const services = homeSpecialties.items.map((item) => ({
    icon: 'fa-bone',
    title: item.title,
    description: item.description,
    link: item.link
  }))

  useEffect(() => {
    if (window.innerWidth > 768 && servicesGridRef.current) {
      matchHeight('.service-card')

      const handleResize = () => {
        if (window.innerWidth > 768) {
          matchHeight('.service-card')
        }
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <section className="services-section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">{homeSpecialties.eyebrow}</span>
          <h2 className="section-title">{homeSpecialties.title}</h2>
          <p className="section-subtitle">
            {homeSpecialties.subtitle}
          </p>
        </motion.div>

        <div className="services-grid" ref={servicesGridRef}>
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              className="service-card"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="service-icon">
                <i className={`fas ${service.icon}`}></i>
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <Link to={service.link} className="service-link">
                Explore <i className="fas fa-arrow-right"></i>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services
