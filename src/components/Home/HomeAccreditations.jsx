import useNearViewport from '../../hooks/useNearViewport'
import SectionHeading from '../common/SectionHeading'
import { homeAccreditations } from '../../content/home'
import './HomeAccreditations.css'

const HomeAccreditations = () => {
  const [ref, inView] = useNearViewport()

  return (
    <section
      className="home-accreditations ds-section"
      ref={ref}
      aria-labelledby="home-accreditations-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeAccreditations.eyebrow}
          title={homeAccreditations.title}
          subtitle={homeAccreditations.subtitle}
          titleId="home-accreditations-heading"
        />

        <ul className={`home-accreditations__grid reveal-stagger${inView ? ' is-visible' : ''}`}>
          {homeAccreditations.items.map((item, index) => (
            <li
              key={item.id}
              className="home-accreditations__badge ds-card reveal-item"
              style={{ '--reveal-delay': `${index * 0.1}s` }}
            >
              <div className="home-accreditations__icon">
                <img
                  src={item.image}
                  alt={item.imageAlt}
                  loading="lazy"
                  width="64"
                  height="64"
                />
              </div>
              <h3 className="home-accreditations__title">{item.title}</h3>
              <p className="home-accreditations__desc">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default HomeAccreditations
