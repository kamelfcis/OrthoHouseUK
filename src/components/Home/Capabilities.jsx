import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SectionHeading from '../common/SectionHeading'
import { homeSpecialties } from '../../content/home'
import './Capabilities.css'

const Capabilities = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 })
  const prefersReducedMotion = useReducedMotion()

  const containerVariants = prefersReducedMotion
    ? {}
    : {
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } }
      }

  const itemVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
      }

  return (
    <section
      className="capabilities-section ds-section"
      ref={ref}
      aria-labelledby="specialties-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeSpecialties.eyebrow}
          title={homeSpecialties.title}
          subtitle={homeSpecialties.subtitle}
          titleId="specialties-heading"
        />

        <motion.div
          className="specialties-grid"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {homeSpecialties.items.map((specialty) => (
            <motion.div key={specialty.id} variants={itemVariants}>
              <Link
                to={specialty.link}
                className="specialty-tile ds-card ds-card--interactive"
              >
                <div className="specialty-tile__media">
                  <img
                    src={specialty.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={260}
                  />
                  <div className="specialty-tile__overlay" aria-hidden="true" />
                </div>
                <div className="specialty-tile__body">
                  <h3 className="specialty-tile__title">{specialty.title}</h3>
                  <p className="specialty-tile__desc">{specialty.description}</p>
                  <span className="specialty-tile__link">
                    Explore products <i className="fas fa-arrow-right" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Capabilities
