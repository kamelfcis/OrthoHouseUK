import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import SectionHeading from '../common/SectionHeading'
import { homeEvents } from '../../content/home'
import './HomeEvents.css'

const HomeEvents = () => {
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
      className="home-events ds-section ds-section--muted"
      ref={ref}
      aria-labelledby="home-events-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeEvents.eyebrow}
          title={homeEvents.title}
          subtitle={homeEvents.subtitle}
          titleId="home-events-heading"
        />

        <motion.ul
          className="home-events__grid"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {homeEvents.items.map((event) => (
            <motion.li
              key={event.id}
              className="home-events__card ds-card ds-card--interactive"
              variants={itemVariants}
            >
              <div className="home-events__card-head">
                <time className="home-events__date" dateTime={event.date}>
                  {event.date}
                </time>
                <span className="home-events__badge">{event.badge}</span>
              </div>
              <h3 className="home-events__title">{event.title}</h3>
              <p className="home-events__desc">{event.description}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

export default HomeEvents
