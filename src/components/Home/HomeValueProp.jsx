import { Link } from 'react-router-dom'
import useNearViewport from '../../hooks/useNearViewport'
import SectionMedia from '../common/SectionMedia'
import useSectionImages from '../../hooks/useSectionImages'
import { homeValueProp } from '../../content/home'
import './home-editorial.css'
import './HomeValueProp.css'

const VALUE_PROP_IMAGE_SPEC = [{
  id: 'main',
  imageQuery: homeValueProp.imageQuery,
  imageFallback: homeValueProp.imageFallback,
  imageAlt: homeValueProp.imageAlt,
  localImage: homeValueProp.localImage,
  useLocalOnly: homeValueProp.useLocalOnly
}]

const HomeValueProp = () => {
  const [ref, inView] = useNearViewport()
  const images = useSectionImages(VALUE_PROP_IMAGE_SPEC, { enabled: inView })
  const image = images.main

  return (
    <section
      className="home-value-prop ds-section"
      ref={ref}
      aria-labelledby="home-value-prop-heading"
    >
      <div className="container">
        <div className={`home-editorial reveal${inView ? ' is-visible' : ''}`}>
          <div className="home-editorial__content">
            <span className="ds-eyebrow">{homeValueProp.eyebrow}</span>
            <h2 id="home-value-prop-heading" className="home-editorial__title">
              {homeValueProp.title}
            </h2>
            <p className="home-editorial__lead">{homeValueProp.lead}</p>
            <ul className="home-editorial__points">
              {homeValueProp.points.map((point) => (
                <li key={point.title}>
                  <strong>{point.title}</strong>
                  <span>{point.text}</span>
                </li>
              ))}
            </ul>
            <Link to={homeValueProp.ctaLink} className="home-editorial__link">
              {homeValueProp.cta}
              <i className="fas fa-arrow-right" aria-hidden="true" />
            </Link>
          </div>

          <figure className="home-editorial__media">
            <SectionMedia
              image={image}
              fallbackSrc={homeValueProp.imageFallback}
              alt={homeValueProp.imageAlt}
              sizes="(max-width: 768px) 100vw, 50vw"
              width={960}
              height={720}
              showCredit
            />
          </figure>
        </div>
      </div>
    </section>
  )
}

export default HomeValueProp
