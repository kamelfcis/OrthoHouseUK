import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import SectionHeading from '../common/SectionHeading'
import { homeUkJourney } from '../../content/home'
import './HomeUkJourney.css'

const HomeUkJourney = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 })
  const prefersReducedMotion = useReducedMotion()

  const itemVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
          opacity: 1,
          y: 0,
          transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
        })
      }

  return (
    <section
      className="home-journey ds-section ds-section--muted"
      ref={ref}
      aria-labelledby="home-journey-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeUkJourney.eyebrow}
          title={homeUkJourney.title}
          subtitle={homeUkJourney.subtitle}
          titleId="home-journey-heading"
        />

        <ol className="home-journey__timeline">
          {homeUkJourney.milestones.map((milestone, index) => (
            <motion.li
              key={milestone.date + milestone.title}
              className="home-journey__step"
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              <div className="home-journey__marker" aria-hidden="true">
                <span className="home-journey__dot" />
              </div>
              <div className="home-journey__content ds-card">
                <time className="home-journey__date" dateTime={milestone.date}>
                  {milestone.date}
                </time>
                <h3 className="home-journey__step-title">{milestone.title}</h3>
                <p className="home-journey__step-desc">{milestone.description}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default HomeUkJourney
