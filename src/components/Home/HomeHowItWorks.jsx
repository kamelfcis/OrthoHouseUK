import { Link } from 'react-router-dom'
import useNearViewport from '../../hooks/useNearViewport'
import SectionHeading from '../common/SectionHeading'
import { homeHowItWorks } from '../../content/home'
import './HomeHowItWorks.css'

const HomeHowItWorks = () => {
  const [ref, inView] = useNearViewport()

  return (
    <section
      className="home-how-it-works ds-section"
      ref={ref}
      aria-labelledby="home-how-it-works-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeHowItWorks.eyebrow}
          title={homeHowItWorks.title}
          subtitle={homeHowItWorks.subtitle}
          titleId="home-how-it-works-heading"
        />

        <ol className={`home-how-it-works__steps reveal-stagger${inView ? ' is-visible' : ''}`}>
          {homeHowItWorks.steps.map((step, index) => (
            <li
              key={step.number}
              className="home-how-it-works__step reveal-item"
              style={{ '--reveal-delay': `${index * 0.12}s` }}
            >
              <span className="home-how-it-works__number" aria-hidden="true">
                {step.number}
              </span>
              <div className="home-how-it-works__content">
                <h3 className="home-how-it-works__title">{step.title}</h3>
                <p className="home-how-it-works__text">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="home-how-it-works__cta">
          <Link to={homeHowItWorks.ctaLink} className="btn btn-main">
            {homeHowItWorks.cta}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HomeHowItWorks
