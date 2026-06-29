import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import { teamPage } from '../content/secondary'
import './Team.css'

const Team = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="team-page">
      <SEO
        title={pageSeo.team.title}
        description={pageSeo.team.description}
        keywords={pageSeo.team.keywords}
      />
      <header className="ds-page-hero team-hero">
        <div className="container">
          <h1>{teamPage.hero.title}</h1>
          <p className="ds-page-hero__subtitle">{teamPage.hero.subtitle}</p>
        </div>
      </header>

      <div className="team-content ds-section">
        <div className="container">
          <div className="team-grid" ref={ref}>
            {teamPage.members.map((member, index) => (
              <motion.article
                key={member.name}
                className="team-card ds-card"
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="team-info">
                  <h2 className="team-name">{member.name}</h2>
                  <p className="team-role">{member.role}</p>
                  <p className="team-credentials">{member.credentials}</p>
                  <p className="team-bio">{member.bio}</p>
                  <div className="team-experience">
                    <i className="fas fa-clock" aria-hidden="true" /> {member.experience}
                  </div>
                  <a href={`mailto:${member.email}`} className="ds-btn ds-btn--ghost team-email">
                    <i className="fas fa-envelope" aria-hidden="true" /> Contact
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Team
