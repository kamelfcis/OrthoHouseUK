import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import CountUp from 'react-countup'
import SectionHeading from '../common/SectionHeading'
import { homeStats } from '../../data/homeContent'
import './Stats.css'

const STAT_TYPE_MAP = {
  employees: 'employees',
  surgeons: 'surgeons',
  hospitals: 'hospitals',
  operations: 'operations',
  partners: 'partners',
  events: 'events'
}

const Stats = ({ branchData }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.25 })
  const prefersReducedMotion = useReducedMotion()

  const statistics = branchData?.statistics || {}

  const resolveStatValue = (key, fallback) => {
    const statType = STAT_TYPE_MAP[key]
    const fromDb = statType && statistics[statType]?.[0]?.stat_value
    return fromDb != null ? Number(fromDb) : fallback
  }

  const stats = homeStats.items.map((item) => ({
    ...item,
    number: resolveStatValue(item.key, item.number)
  }))

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
    <section className="stats-section ds-section" ref={ref} aria-labelledby="stats-heading">
      <div className="container">
        <SectionHeading
          eyebrow={homeStats.eyebrow}
          title={homeStats.title}
          subtitle={homeStats.subtitle}
          titleId="stats-heading"
          className="stats-section__head"
        />

        <motion.div
          className="stats-grid"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {stats.map((stat) => (
            <motion.div key={stat.key} className="stat-item" variants={itemVariants}>
              <span className="stat-icon" aria-hidden="true">
                <i className={`fas ${stat.icon}`} />
              </span>
              <div className="stat-number" aria-label={`${stat.number}${stat.suffix} ${stat.label}`}>
                {inView && !prefersReducedMotion ? (
                  <CountUp start={0} end={stat.number} duration={2.5} suffix={stat.suffix} />
                ) : (
                  <span>{stat.number}{stat.suffix}</span>
                )}
              </div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Stats
