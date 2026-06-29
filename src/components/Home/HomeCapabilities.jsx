import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import SectionHeading from '../common/SectionHeading'
import SectionMedia from '../common/SectionMedia'
import useSectionImages from '../../hooks/useSectionImages'
import useSectionVideos from '../../hooks/useSectionVideos'
import { homeCapabilities } from '../../content/home'
import './home-editorial.css'
import './HomeCapabilities.css'

const CAPABILITY_IMAGE_SPECS = homeCapabilities.items.map(
  ({ id, imageQuery, imageFallback, imageAlt }) => ({
    id,
    imageQuery,
    imageFallback,
    imageAlt
  })
)

const CAPABILITY_VIDEO_SPECS = homeCapabilities.items
  .filter(({ videoQuery }) => videoQuery)
  .map(({ id, videoQuery, imageFallback, imageAlt }) => ({
    id,
    videoQuery,
    videoFallback: imageFallback,
    imageAlt
  }))

const HomeCapabilities = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()
  const images = useSectionImages(CAPABILITY_IMAGE_SPECS)
  const videos = useSectionVideos(CAPABILITY_VIDEO_SPECS)

  const itemVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 24 },
        visible: (i) => ({
          opacity: 1,
          y: 0,
          transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
        })
      }

  return (
    <section
      className="home-capabilities ds-section ds-section--muted"
      ref={ref}
      aria-labelledby="home-capabilities-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeCapabilities.eyebrow}
          title={homeCapabilities.title}
          subtitle={homeCapabilities.subtitle}
          titleId="home-capabilities-heading"
        />

        <div className="home-editorial-stack">
          {homeCapabilities.items.map((item, index) => {
            const image = images[item.id]
            const useVideo = Boolean(item.videoQuery)

            return (
              <motion.article
                key={item.id}
                className="home-editorial-stack__item"
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
              >
                <div className="home-editorial-stack__content">
                  <h3 className="home-editorial-stack__title">{item.title}</h3>
                  <p className="home-editorial-stack__desc">{item.description}</p>
                  <Link to={item.link} className="home-editorial__link">
                    {homeCapabilities.linkLabel}
                    <i className="fas fa-arrow-right" aria-hidden="true" />
                  </Link>
                </div>
                <figure className="home-editorial-stack__media">
                  <SectionMedia
                    image={image}
                    video={useVideo ? videos[item.id] : undefined}
                    useVideo={useVideo}
                    fallbackSrc={item.imageFallback}
                    alt={item.imageAlt}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    width={800}
                    height={550}
                  />
                </figure>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HomeCapabilities
