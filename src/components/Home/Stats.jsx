import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import './Stats.css'

const Stats = ({ branchData }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 })

  const statistics = branchData?.statistics || {}
  const latestStats = {}
  Object.keys(statistics).forEach((type) => {
    if (statistics[type]?.length > 0) {
      latestStats[type] = statistics[type][0].stat_value
    }
  })

  const stats = [
    { icon: 'fa-people-group',  number: latestStats.patients  || 1000, suffix: '+', label: 'Patients Served' },
    { icon: 'fa-user-doctor',   number: latestStats.surgeons  || 15,   suffix: '+', label: 'Expert Surgeons' },
    { icon: 'fa-hospital',      number: latestStats.hospitals || 50,   suffix: '+', label: 'Partner Hospitals' },
    { icon: 'fa-users-gear',    number: latestStats.employees || 98,   suffix: '+', label: 'Team Members' }
  ]

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } }
  }

  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  }

  return (
    <section className="stats-section" ref={ref} aria-labelledby="stats-heading">
      <div className="container">
        <h2 id="stats-heading" className="sr-only">OrthoHouse UK by the numbers</h2>
        <motion.div
          className="stats-grid"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {stats.map((stat, index) => (
            <motion.div key={index} className="stat-item" variants={itemVariants}>
              <span className="stat-icon" aria-hidden="true">
                <i className={`fas ${stat.icon}`}></i>
              </span>
              <div className="stat-number">
                {inView && (
                  <CountUp start={0} end={stat.number} duration={2.5} suffix={stat.suffix} />
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
