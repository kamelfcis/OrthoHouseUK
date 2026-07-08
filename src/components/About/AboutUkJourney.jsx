import useNearViewport from '../../hooks/useNearViewport'
import SectionHeading from '../common/SectionHeading'
import { aboutPage } from '../../content/about'
import './AboutUkJourney.css'

const { ukJourney } = aboutPage

const AboutUkJourney = () => {
  const [ref, inView] = useNearViewport()

  return (
    <section
      className="about-uk-journey ds-section"
      ref={ref}
      aria-labelledby="about-uk-journey-heading"
    >
      <div className="about-uk-journey__backdrop" aria-hidden="true">
        <div className="about-uk-journey__grid" />
        <div className="about-uk-journey__glow about-uk-journey__glow--left" />
        <div className="about-uk-journey__glow about-uk-journey__glow--right" />
      </div>

      <div className="container about-uk-journey__inner">
        <SectionHeading
          className="about-uk-journey__head"
          eyebrow={ukJourney.eyebrow}
          title={ukJourney.title}
          subtitle={ukJourney.subtitle}
          titleId="about-uk-journey-heading"
        />

        <div className="about-uk-journey__timeline-wrap">
          <div
            className={`about-uk-journey__spine${inView ? ' is-active' : ''}`}
            aria-hidden="true"
          >
            <span className="about-uk-journey__spine-glow" />
            <span className="about-uk-journey__spine-line" />
          </div>

          <ol className={`about-uk-journey__timeline reveal-stagger${inView ? ' is-visible' : ''}`}>
            {ukJourney.milestones.map((milestone, index) => (
              <li
                key={milestone.dateTime + milestone.title}
                className={`about-uk-journey__step reveal-item${index % 2 === 1 ? ' is-alt' : ''}`}
                style={{ '--reveal-delay': `${index * 0.1}s`, '--step-index': index }}
              >
                <div className="about-uk-journey__node" aria-hidden="true">
                  <span className="about-uk-journey__node-ring" />
                  <span className="about-uk-journey__node-core" />
                </div>

                <article className="about-uk-journey__card">
                  <time
                    className="about-uk-journey__date"
                    dateTime={milestone.dateTime}
                  >
                    {milestone.date}
                  </time>
                  <h3 className="about-uk-journey__step-title">{milestone.title}</h3>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default AboutUkJourney
