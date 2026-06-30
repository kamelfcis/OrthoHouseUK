import useNearViewport from '../../hooks/useNearViewport'
import SectionHeading from '../common/SectionHeading'
import ResponsiveImage from '../common/ResponsiveImage'
import { homeEvents } from '../../content/home'
import './HomeEvents.css'

const HomeEvents = () => {
  const [ref, inView] = useNearViewport()

  return (
    <section
      className="home-events ds-section ds-section--muted"
      ref={ref}
      aria-labelledby="home-events-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeEvents.eyebrow}
          title={homeEvents.title}
          subtitle={homeEvents.subtitle}
          titleId="home-events-heading"
        />

        <ul className={`home-events__grid reveal-stagger${inView ? ' is-visible' : ''}`}>
          {homeEvents.items.map((event, index) => (
            <li
              key={event.id}
              className="home-events__card ds-card ds-card--interactive reveal-item"
              style={{ '--reveal-delay': `${index * 0.1}s` }}
            >
              {event.localImage && (
                <figure className="home-events__media">
                  <ResponsiveImage
                    image={event.localImage}
                    alt={event.imageAlt}
                    className="home-events__img"
                    sizes="(max-width: 768px) 100vw, 280px"
                    width={400}
                    height={260}
                    loading="lazy"
                  />
                </figure>
              )}
              <div className="home-events__card-head">
                <time className="home-events__date" dateTime={event.date}>
                  {event.date}
                </time>
                <span className="home-events__badge">{event.badge}</span>
              </div>
              <h3 className="home-events__title">{event.title}</h3>
              <p className="home-events__desc">{event.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default HomeEvents
