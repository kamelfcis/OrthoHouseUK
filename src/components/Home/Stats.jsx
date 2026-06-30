import useNearViewport from '../../hooks/useNearViewport'
import CountUp from 'react-countup'
import SectionHeading from '../common/SectionHeading'
import { homeStats } from '../../content/home'
import './Stats.css'

const STAT_TYPE_MAP = {
  employees: 'employees',
  surgeons: 'surgeons',
  hospitals: 'hospitals',
  operations: 'operations',
  partners: 'partners',
  events: 'events'
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const Stats = ({ branchData }) => {
  const [ref, inView] = useNearViewport()

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

  const reduced = prefersReducedMotion()

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

        <div className={`stats-grid reveal-stagger${inView ? ' is-visible' : ''}`}>
          {stats.map((stat, index) => (
            <div
              key={stat.key}
              className="stat-item reveal-item"
              style={{ '--reveal-delay': `${index * 0.1}s` }}
            >
              <span className="stat-icon" aria-hidden="true">
                <i className={`fas ${stat.icon}`} />
              </span>
              <div className="stat-number" aria-label={`${stat.number}${stat.suffix} ${stat.label}`}>
                {inView && !reduced ? (
                  <CountUp start={0} end={stat.number} duration={2.5} suffix={stat.suffix} />
                ) : (
                  <span>{stat.number}{stat.suffix}</span>
                )}
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats
