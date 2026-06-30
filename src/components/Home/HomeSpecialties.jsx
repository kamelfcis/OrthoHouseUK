import { Link } from 'react-router-dom'
import useNearViewport from '../../hooks/useNearViewport'
import SectionHeading from '../common/SectionHeading'
import SectionMedia from '../common/SectionMedia'
import useSectionImages from '../../hooks/useSectionImages'
import useSectionVideos from '../../hooks/useSectionVideos'
import { homeSpecialties } from '../../content/home'
import './home-editorial.css'
import './HomeSpecialties.css'

const SPECIALTY_IMAGE_SPECS = homeSpecialties.items.map(
  ({ id, imageQuery, imageFallback, imageAlt, localImage, useLocalOnly }) => ({
    id,
    imageQuery,
    imageFallback,
    imageAlt,
    localImage,
    useLocalOnly
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

const CtaArrow = () => (
  <svg
    className="home-specialties__cta-icon"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 8h10M8.5 4.5 12 8l-3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const CornerAccent = () => (
  <svg
    className="home-specialties__corner"
    viewBox="0 0 52 52"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6 38 C6 10 10 6 38 6"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
  </svg>
)

const SpecialtyCard = ({ item, image, video, useVideo, index }) => (
  <article
    className="home-specialties__card reveal-item"
    style={{ '--reveal-delay': `${index * 0.06}s` }}
  >
    <Link to={item.link} className="home-specialties__card-link">
      <CornerAccent />
      <figure className="home-specialties__media">
        <SectionMedia
          image={image}
          video={useVideo ? video : undefined}
          useVideo={useVideo}
          fallbackSrc={item.imageFallback}
          alt={item.imageAlt}
          sizes="(max-width: 767px) 100vw, 25vw"
          width={480}
          height={320}
        />
      </figure>
      <div className="home-specialties__body">
        {item.layout === 'featured' && (
          <span className="home-specialties__badge">Core portfolio</span>
        )}
        <h3 className="home-specialties__title">{item.title}</h3>
        <p className="home-specialties__desc">{item.description}</p>
        <span className="home-specialties__cta">
          <span>{item.ctaLabel || homeSpecialties.linkLabel}</span>
          <CtaArrow />
        </span>
      </div>
    </Link>
  </article>
)

const HomeSpecialties = () => {
  const [ref, inView] = useNearViewport()
  const images = useSectionImages(SPECIALTY_IMAGE_SPECS, { enabled: inView })
  const videos = useSectionVideos(SPECIALTY_VIDEO_SPECS, { enabled: inView })

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

        <div className={`home-specialties__row reveal-stagger${inView ? ' is-visible' : ''}`}>
          {homeSpecialties.items.map((item, index) => (
            <SpecialtyCard
              key={item.id}
              item={item}
              image={images[item.id]}
              video={videos[item.id]}
              useVideo={Boolean(item.videoQuery)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default HomeSpecialties
