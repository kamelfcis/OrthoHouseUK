import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import { homeMission } from '../../content/home'
import './HomeMission.css'

const HomeMission = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })
  const prefersReducedMotion = useReducedMotion()

  const variants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
      }

  return (
    <section
      className="home-mission ds-section"
      ref={ref}
      aria-labelledby="home-mission-heading"
    >
      <div className="container">
        <motion.div
          className="home-mission__band"
          variants={variants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <span className="home-mission__eyebrow">{homeMission.eyebrow}</span>
          <h2 id="home-mission-heading" className="home-mission__title">
            {homeMission.title}
          </h2>
          <p className="home-mission__statement">{homeMission.statement}</p>
          <p className="home-mission__vision">{homeMission.vision}</p>
        </motion.div>
      </div>
    </section>
  )
}

export default HomeMission
