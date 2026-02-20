import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { useState } from 'react'
import './Capabilities.css'

const Capabilities = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })
  const [flippedCards, setFlippedCards] = useState(new Set())

  const capabilities = [
    {
      icon: 'fa-hand-holding-medical',
      backgroundImage: '/assets/images/protheticlimp.png',
      title: 'Prosthetic Limbs',
      description: 'Advanced prosthetic solutions designed to restore mobility and enhance quality of life for amputees.',
      backTitle: 'Custom Fitted',
      backDescription: 'Each prosthetic is custom-fitted to match your unique anatomy and lifestyle requirements.',
      features: ['Custom Design', 'Advanced Materials', 'Lifetime Support']
    },
    {
      icon: 'fa-cogs',
      backgroundImage: '/assets/images/biomedical.png',
      title: 'Biomedical Devices',
      description: 'Cutting-edge biomedical engineering solutions for medical devices and healthcare technology.',
      backTitle: 'Innovation First',
      backDescription: 'State-of-the-art technology combined with patient-centered design principles.',
      features: ['Research & Development', 'Quality Assurance', 'Regulatory Compliance']
    },
    {
      icon: 'fa-wheelchair',
      backgroundImage: '/assets/images/orthoticsolutions.png',
      title: 'Orthotic Solutions',
      description: 'Specialized orthotic devices designed to support, align, and enhance physical function.',
      backTitle: 'Personalized Care',
      backDescription: 'Comprehensive orthotic solutions tailored to individual needs and conditions.',
      features: ['Custom Molding', 'Comfortable Fit', 'Durable Materials']
    },
    {
      icon: 'fa-user-md',
      backgroundImage: '/assets/images/rehabiliation.png',
      title: 'Rehabilitation',
      description: 'Comprehensive rehabilitation services to help patients adapt and thrive with their devices.',
      backTitle: 'Complete Support',
      backDescription: 'From initial fitting to ongoing therapy, we support you every step of the way.',
      features: ['Physical Therapy', 'Occupational Therapy', 'Patient Education']
    },
    {
      icon: 'fa-stethoscope',
      backgroundImage: '/assets/images/medicalconsultation.png',
      title: 'Medical Consultation',
      description: 'Expert consultations with our team of specialists to determine the best solutions.',
      backTitle: 'Expert Guidance',
      backDescription: 'Our experienced professionals provide personalized recommendations for your care.',
      features: ['Initial Assessment', 'Treatment Planning', 'Follow-up Care']
    },
    {
      icon: 'fa-heartbeat',
      backgroundImage: '/assets/images/mainteinance.png',
      title: 'Maintenance & Repair',
      description: 'Professional maintenance and repair services to keep your devices in optimal condition.',
      backTitle: 'Reliable Service',
      backDescription: 'Regular maintenance ensures your devices perform at their best for years to come.',
      features: ['Regular Check-ups', 'Quick Repairs', 'Warranty Support']
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
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
    <section className="capabilities-section" ref={ref}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          <h2 className="section-title">Our Capabilities</h2>
          <p className="section-subtitle">
            Comprehensive solutions for prosthetics, orthotics, and biomedical engineering
          </p>
        </motion.div>

        <motion.div
          className="capabilities-grid"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {capabilities.map((capability, index) => {
            const isFlipped = flippedCards.has(index)
            return (
              <motion.div
                key={index}
                className={`lte-has-flip-card ${isFlipped ? 'is-flipped' : ''}`}
                variants={itemVariants}
                onClick={() => {
                  const newFlipped = new Set(flippedCards)
                  if (isFlipped) {
                    newFlipped.delete(index)
                  } else {
                    newFlipped.add(index)
                  }
                  setFlippedCards(newFlipped)
                }}
                onTouchStart={(e) => {
                  // Prevent double-tap zoom on mobile
                  if (e.touches.length > 1) return
                }}
              >
              <div className="flip-card-inner">
                <div
                  className={`lte-back-card ${
                    capability.backgroundImage ? 'has-background-image' : ''
                  }`}
                  style={
                    capability.backgroundImage
                      ? { backgroundImage: `url(${capability.backgroundImage})` }
                      : undefined
                  }
                >
                  <div className="lte-icon-content">
                    {!capability.backgroundImage && (
                      <div className="capability-icon">
                        <i className={`fas ${capability.icon}`}></i>
                      </div>
                    )}
                    <h3 className="lte-header capability-title">{capability.title}</h3>
                    <p className="capability-description">{capability.description}</p>
                  </div>
                </div>
                <div
                  className={`lte-front-card ${
                    capability.backgroundImage ? 'has-background-image' : ''
                  }`}
                  style={
                    capability.backgroundImage
                      ? { backgroundImage: `url(${capability.backgroundImage})` }
                      : undefined
                  }
                />
              </div>
            </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

export default Capabilities

