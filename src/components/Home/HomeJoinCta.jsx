import { Link } from 'react-router-dom'
import useNearViewport from '../../hooks/useNearViewport'
import useSectionImages from '../../hooks/useSectionImages'
import { homeJoinCta } from '../../content/home'
import './HomeJoinCta.css'

const JOIN_CTA_IMAGE_SPEC = [{
  id: 'bg',
  imageQuery: homeJoinCta.imageQuery,
  imageFallback: homeJoinCta.imageFallback,
  imageAlt: homeJoinCta.imageAlt,
  localImage: homeJoinCta.localImage,
  useLocalOnly: homeJoinCta.useLocalOnly
}]

const HomeJoinCta = () => {
  const [ref, inView] = useNearViewport()
  const images = useSectionImages(JOIN_CTA_IMAGE_SPEC, { enabled: inView })
  const bgSrc = images.bg?.src ?? homeJoinCta.imageFallback

  return (
    <section
      className="home-join-cta ds-section"
      ref={ref}
      aria-labelledby="home-join-heading"
    >
      <div className="container">
        <div className={`home-join-cta__panel reveal${inView ? ' is-visible' : ''}`}>
          <div
            className="home-join-cta__bg"
            aria-hidden="true"
            style={{ backgroundImage: `url(${bgSrc})` }}
          />
          <div className="home-join-cta__bg-overlay" aria-hidden="true" />

          <div className="home-join-cta__content">
            <span className="ds-eyebrow home-join-cta__eyebrow">{homeJoinCta.eyebrow}</span>
            <h2 id="home-join-heading" className="home-join-cta__title">
              {homeJoinCta.title}
            </h2>
            <p className="home-join-cta__tagline">{homeJoinCta.tagline}</p>

            <ul className="home-join-cta__bullets">
              {homeJoinCta.bullets.map((bullet) => (
                <li key={bullet}>
                  <i className="fas fa-check" aria-hidden="true" />
                  {bullet}
                </li>
              ))}
            </ul>

            <address className="home-join-cta__office">
              <strong>{homeJoinCta.office.label}</strong>
              <span>{homeJoinCta.office.address}</span>
            </address>

            <div className="home-join-cta__actions">
              <Link to={homeJoinCta.office.contactLink} className="btn btn-main">
                {homeJoinCta.cta}
              </Link>
              <Link to={homeJoinCta.secondaryLink} className="btn btn-outline-white">
                {homeJoinCta.secondaryCta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeJoinCta
