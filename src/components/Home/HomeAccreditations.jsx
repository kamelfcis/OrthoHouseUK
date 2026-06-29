import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import SectionHeading from '../common/SectionHeading'
import { homeAccreditations } from '../../content/home'
import './HomeAccreditations.css'

const HomeAccreditations = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })
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
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
      }

  return (
    <section
      className="home-accreditations ds-section"
      ref={ref}
      aria-labelledby="home-accreditations-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeAccreditations.eyebrow}
          title={homeAccreditations.title}
          subtitle={homeAccreditations.subtitle}
          titleId="home-accreditations-heading"
        />

        <motion.ul
          className="home-accreditations__grid"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {homeAccreditations.items.map((item) => (
            <motion.li
              key={item.id}
              className="home-accreditations__badge ds-card"
              variants={itemVariants}
            >
              <div className="home-accreditations__icon" aria-hidden="true">
                <i className={`fas ${item.icon}`} />
              </div>
              <h3 className="home-accreditations__title">{item.title}</h3>
              <p className="home-accreditations__desc">{item.description}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

export default HomeAccreditations
