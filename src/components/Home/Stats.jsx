import { useInView } from 'react-intersection-observer'
import CountUp from 'react-countup'
import './Stats.css'

const Stats = ({ branchData }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.3
  })

  // Get statistics from Supabase or use defaults
  const statistics = branchData?.statistics || {}
  const latestStats = {}
  
  // Get the latest value for each stat type
  Object.keys(statistics).forEach(type => {
    if (statistics[type] && statistics[type].length > 0) {
      latestStats[type] = statistics[type][0].stat_value
    }
  })

  const stats = [
    { 
      number: latestStats.patients || 1000, 
      suffix: '+', 
      label: 'Patients Served' 
    },
    { 
      number: latestStats.surgeons || 15, 
      suffix: '+', 
      label: 'Expert Surgeons' 
    },
    { 
      number: latestStats.hospitals || 50, 
      suffix: '+', 
      label: 'Partner Hospitals' 
    },
    { 
      number: latestStats.employees || 98, 
      suffix: '+', 
      label: 'Team Members' 
    }
  ]

  return (
    <section className="stats-section" ref={ref}>
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-number">
                {inView && (
                  <CountUp
                    start={0}
                    end={stat.number}
                    duration={2.5}
                    suffix={stat.suffix}
                  />
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
