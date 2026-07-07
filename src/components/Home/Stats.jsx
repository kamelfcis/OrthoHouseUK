import { useEffect, useState } from 'react'
import useNearViewport from '../../hooks/useNearViewport'
import CountUp from 'react-countup'
import SectionHeading from '../common/SectionHeading'
import { homeStats as homeStatsContent } from '../../content/home'
import { fetchHomeStats } from '../../lib/homeStats'
import './Stats.css'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const getInitialStatsContent = () => ({
  eyebrow: homeStatsContent.eyebrow,
  title: homeStatsContent.title,
  subtitle: homeStatsContent.subtitle,
  items: homeStatsContent.items,
})

const Stats = () => {
  const [ref, inView] = useNearViewport()
  const [statsContent, setStatsContent] = useState(getInitialStatsContent)

  useEffect(() => {
    let cancelled = false

    fetchHomeStats('UK')
      .then((data) => {
        if (!cancelled) setStatsContent(data)
      })
      .catch(() => {
        if (!cancelled) setStatsContent(getInitialStatsContent())
      })

    return () => {
      cancelled = true
    }
  }, [])

  const reduced = prefersReducedMotion()

  return (
    <section className="stats-section ds-section" ref={ref} aria-labelledby="stats-heading">
      <div className="container">
        <SectionHeading
          eyebrow={statsContent.eyebrow}
          title={statsContent.title}
          subtitle={statsContent.subtitle}
          titleId="stats-heading"
          className="stats-section__head"
        />

        <div className={`stats-grid reveal-stagger${inView ? ' is-visible' : ''}`}>
          {statsContent.items.map((stat, index) => (
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
