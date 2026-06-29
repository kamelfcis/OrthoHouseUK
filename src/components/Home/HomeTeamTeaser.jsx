import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import SectionHeading from '../common/SectionHeading'
import { homeTeamTeaser } from '../../content/home'
import { teamPage } from '../../content/team'
import './HomeTeamTeaser.css'

const HomeTeamTeaser = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.12 })
  const prefersReducedMotion = useReducedMotion()

  const members = teamPage.members.slice(0, homeTeamTeaser.featuredCount)

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
    <section
      className="home-team-teaser ds-section"
      ref={ref}
      aria-labelledby="home-team-teaser-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeTeamTeaser.eyebrow}
          title={homeTeamTeaser.title}
          subtitle={homeTeamTeaser.subtitle}
          titleId="home-team-teaser-heading"
        />

        <motion.ul
          className="home-team-teaser__grid"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {members.map((member) => (
            <motion.li key={member.name} variants={itemVariants}>
              <article className="home-team-teaser__card ds-card">
                <div className="home-team-teaser__avatar" aria-hidden="true">
                  <span className="home-team-teaser__initials">
                    {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="home-team-teaser__body">
                  <h3 className="home-team-teaser__name">{member.name}</h3>
                  <p className="home-team-teaser__role">{member.role}</p>
                  {member.credentials && (
                    <p className="home-team-teaser__credentials">{member.credentials}</p>
                  )}
                  <p className="home-team-teaser__bio">{member.bio}</p>
                </div>
              </article>
            </motion.li>
          ))}
        </motion.ul>

        <div className="home-team-teaser__footer">
          <Link to={homeTeamTeaser.viewAllPath} className="btn btn-main">
            {homeTeamTeaser.viewAll}
            <i className="fas fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HomeTeamTeaser
