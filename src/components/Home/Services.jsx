import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { matchHeight } from '../../utils/animations'
import './Services.css'

const Services = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const servicesGridRef = useRef(null)

  const services = [
    {
      icon: 'fa-hand-holding-medical',
      title: 'Prosthetics',
      description: 'Custom-designed prosthetic limbs that restore mobility and improve quality of life.',
      link: '/partners'
    },
    {
      icon: 'fa-cogs',
      title: 'Biomedical Engineering',
      description: 'Advanced engineering solutions for medical devices and healthcare technology.',
      link: '/partners'
    },
    {
      icon: 'fa-wheelchair',
      title: 'Orthotics',
      description: 'Specialized orthotic devices to support and enhance physical function.',
      link: '/partners'
    },
    {
      icon: 'fa-user-md',
      title: 'Consultation',
      description: 'Expert consultations to determine the best solutions for your needs.',
      link: '/contact'
    }
  ]

  useEffect(() => {
    // Match height for service cards on desktop
    if (window.innerWidth > 768 && servicesGridRef.current) {
      const cards = servicesGridRef.current.querySelectorAll('.service-card')
      matchHeight('.service-card')
      
      // Re-match on resize
      const handleResize = () => {
        if (window.innerWidth > 768) {
          cards.forEach(card => card.style.height = 'auto')
          matchHeight('.service-card')
        }
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [inView])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  }

  return (
    <section className="services-section" ref={ref}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">
            Comprehensive solutions for prosthetics and biomedical engineering needs
          </p>
        </motion.div>

        <motion.div
          className="services-grid"
          ref={servicesGridRef}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="service-card"
              variants={itemVariants}
              whileHover={{ y: -10 }}
            >
              <div className="service-icon">
                <i className={`fas ${service.icon}`}></i>
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <Link to={service.link} className="service-link">
                Learn More <i className="fas fa-arrow-right"></i>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Services