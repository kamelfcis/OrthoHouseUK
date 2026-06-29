import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import useSectionImages from '../../hooks/useSectionImages'
import { homeJoinCta } from '../../content/home'
import './HomeJoinCta.css'

const JOIN_CTA_IMAGE_SPEC = [{
  id: 'bg',
  imageQuery: homeJoinCta.imageQuery,
  imageFallback: homeJoinCta.imageFallback,
  imageAlt: homeJoinCta.imageAlt
}]

const HomeJoinCta = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })
  const prefersReducedMotion = useReducedMotion()
  const images = useSectionImages(JOIN_CTA_IMAGE_SPEC)
  const bgSrc = images.bg?.src ?? homeJoinCta.imageFallback

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 30 },
        animate: inView ? { opacity: 1, y: 0 } : {},
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      }

  return (
    <section
      className="home-join-cta ds-section"
      ref={ref}
      aria-labelledby="home-join-heading"
    >
      <div className="container">
        <motion.div className="home-join-cta__panel" {...motionProps}>
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
        </motion.div>
      </div>
    </section>
  )
}

export default HomeJoinCta
