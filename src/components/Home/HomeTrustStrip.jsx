import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import { homeTrustStrip } from '../../content/home'
import './HomeTrustStrip.css'

const STAT_TYPE_MAP = {
  hospitals: 'hospitals',
  surgeons: 'surgeons',
  partners: 'partners',
  events: 'events'
}

const HomeTrustStrip = ({ branchData }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 })
  const prefersReducedMotion = useReducedMotion()
  const statistics = branchData?.statistics || {}

  const resolveValue = (key, fallback) => {
    const statType = STAT_TYPE_MAP[key]
    const fromDb = statType && statistics[statType]?.[0]?.stat_value
    return fromDb != null ? Number(fromDb) : fallback
  }

  const stats = homeTrustStrip.items.map((item) => ({
    ...item,
    value: resolveValue(item.key, item.fallback)
  }))

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: inView ? { opacity: 1 } : {},
        transition: { duration: 0.5 }
      }

  return (
    <section
      className="home-trust-strip"
      ref={ref}
      aria-label="OrthoHouse UK at a glance"
    >
      <div className="container">
        <motion.ul className="home-trust-strip__list" {...motionProps}>
          {stats.map((stat) => (
            <li key={stat.key} className="home-trust-strip__item">
              <span className="home-trust-strip__value">
                {stat.value}{stat.suffix}
              </span>
              <span className="home-trust-strip__label">{stat.label}</span>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

export default HomeTrustStrip
