import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import ButtonWithIcon from '../ButtonWithIcon'
import { homeCta } from '../../content/home'
import './CTA.css'

const CTA = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })
  const prefersReducedMotion = useReducedMotion()

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: inView ? { opacity: 1, y: 0 } : {},
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      }

  return (
    <section className="home-cta ds-section" ref={ref} aria-labelledby="home-cta-heading">
      <div className="home-cta__overlay" aria-hidden="true" />
      <div className="container">
        <motion.div className="home-cta__content" {...motionProps}>
          <h2 id="home-cta-heading" className="home-cta__title">
            {homeCta.title}
          </h2>
          <p className="home-cta__text">{homeCta.subtitle}</p>
          <div className="home-cta__actions">
            <ButtonWithIcon
              text={homeCta.primary.label}
              icon="fas fa-hand-pointer"
              to={homeCta.primary.path}
              variant="main"
              iconTeal
            />
            <Link to={homeCta.secondary.path} className="btn btn-outline-white">
              {homeCta.secondary.label}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA
