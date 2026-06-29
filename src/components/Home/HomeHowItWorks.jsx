import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import SectionHeading from '../common/SectionHeading'
import { homeHowItWorks } from '../../content/home'
import './HomeHowItWorks.css'

const HomeHowItWorks = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 })
  const prefersReducedMotion = useReducedMotion()

  const containerVariants = prefersReducedMotion
    ? {}
    : {
        hidden: {},
        visible: { transition: { staggerChildren: 0.12 } }
      }

  const itemVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
      }

  return (
    <section
      className="home-how-it-works ds-section"
      ref={ref}
      aria-labelledby="home-how-it-works-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeHowItWorks.eyebrow}
          title={homeHowItWorks.title}
          subtitle={homeHowItWorks.subtitle}
          titleId="home-how-it-works-heading"
        />

        <motion.ol
          className="home-how-it-works__steps"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {homeHowItWorks.steps.map((step) => (
            <motion.li
              key={step.number}
              className="home-how-it-works__step"
              variants={itemVariants}
            >
              <span className="home-how-it-works__number" aria-hidden="true">
                {step.number}
              </span>
              <div className="home-how-it-works__content">
                <h3 className="home-how-it-works__title">{step.title}</h3>
                <p className="home-how-it-works__text">{step.text}</p>
              </div>
            </motion.li>
          ))}
        </motion.ol>

        <div className="home-how-it-works__cta">
          <Link to={homeHowItWorks.ctaLink} className="btn btn-main">
            {homeHowItWorks.cta}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HomeHowItWorks
