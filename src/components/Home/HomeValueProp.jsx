import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import SectionMedia from '../common/SectionMedia'
import useSectionImages from '../../hooks/useSectionImages'
import { homeValueProp } from '../../content/home'
import './home-editorial.css'
import './HomeValueProp.css'

const VALUE_PROP_IMAGE_SPEC = [{
  id: 'main',
  imageQuery: homeValueProp.imageQuery,
  imageFallback: homeValueProp.imageFallback,
  imageAlt: homeValueProp.imageAlt
}]

const HomeValueProp = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 })
  const prefersReducedMotion = useReducedMotion()
  const images = useSectionImages(VALUE_PROP_IMAGE_SPEC)
  const image = images.main

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        animate: inView ? { opacity: 1, y: 0 } : {},
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      }

  return (
    <section
      className="home-value-prop ds-section"
      ref={ref}
      aria-labelledby="home-value-prop-heading"
    >
      <div className="container">
        <motion.div className="home-editorial" {...motionProps}>
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
        </motion.div>
      </div>
    </section>
  )
}

export default HomeValueProp
