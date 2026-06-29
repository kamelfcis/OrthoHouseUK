import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import SectionHeading from '../common/SectionHeading'
import SectionMedia from '../common/SectionMedia'
import useSectionImages from '../../hooks/useSectionImages'
import useSectionVideos from '../../hooks/useSectionVideos'
import { homeSpecialties } from '../../content/home'
import './home-editorial.css'
import './HomeSpecialties.css'

const SPECIALTY_IMAGE_SPECS = homeSpecialties.items.map(
  ({ id, imageQuery, imageFallback, imageAlt }) => ({
    id,
    imageQuery,
    imageFallback,
    imageAlt
  })
)

const SPECIALTY_VIDEO_SPECS = homeSpecialties.items
  .filter(({ videoQuery }) => videoQuery)
  .map(({ id, videoQuery, imageFallback, imageAlt }) => ({
    id,
    videoQuery,
    videoFallback: imageFallback,
    imageAlt
  }))

const HomeSpecialties = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()
  const images = useSectionImages(SPECIALTY_IMAGE_SPECS)
  const videos = useSectionVideos(SPECIALTY_VIDEO_SPECS)

  const itemVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 24 },
        visible: (i) => ({
          opacity: 1,
          y: 0,
          transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
        })
      }

  return (
    <section
      className="home-specialties ds-section ds-section--muted"
      ref={ref}
      aria-labelledby="home-specialties-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeSpecialties.eyebrow}
          title={homeSpecialties.title}
          subtitle={homeSpecialties.subtitle}
          titleId="home-specialties-heading"
        />

        <div className="home-specialties__list">
          {homeSpecialties.items.map((item, index) => {
            const image = images[item.id]
            const useVideo = Boolean(item.videoQuery)

            return (
              <motion.article
                key={item.id}
                className={`home-specialties__row${index % 2 === 1 ? ' is-reverse' : ''}`}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
              >
                <Link to={item.link} className="home-specialties__link-wrap">
                  <figure className="home-specialties__media">
                    <SectionMedia
                      image={image}
                      video={useVideo ? videos[item.id] : undefined}
                      useVideo={useVideo}
                      fallbackSrc={item.imageFallback}
                      alt={item.imageAlt}
                      sizes="(max-width: 768px) 100vw, 40vw"
                      width={640}
                      height={480}
                    />
                    <span className="home-specialties__overlay" aria-hidden="true" />
                  </figure>
                  <div className="home-specialties__body">
                    <h3 className="home-specialties__title">{item.title}</h3>
                    <p className="home-specialties__desc">{item.description}</p>
                    <span className="home-specialties__cta">
                      {homeSpecialties.linkLabel}
                      <i className="fas fa-arrow-right" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HomeSpecialties
