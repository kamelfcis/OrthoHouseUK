import { Link } from 'react-router-dom'
import useNearViewport from '../../hooks/useNearViewport'
import SectionHeading from '../common/SectionHeading'
import SectionMedia from '../common/SectionMedia'
import useSectionImages from '../../hooks/useSectionImages'
import { homeWhyChooseUs } from '../../content/home'
import './home-editorial.css'
import './HomeWhyChooseUs.css'

const WHY_CHOOSE_IMAGE_SPECS = homeWhyChooseUs.items.map(
  ({ id, imageQuery, imageFallback, imageAlt, localImage, useLocalOnly }) => ({
    id,
    imageQuery,
    imageFallback,
    imageAlt,
    localImage,
    useLocalOnly
  })
)

const HomeWhyChooseUs = () => {
  const [ref, inView] = useNearViewport()
  const images = useSectionImages(WHY_CHOOSE_IMAGE_SPECS, { enabled: inView })

  return (
    <section
      className="home-why-choose ds-section"
      ref={ref}
      aria-labelledby="home-why-choose-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeWhyChooseUs.eyebrow}
          title={homeWhyChooseUs.title}
          subtitle={homeWhyChooseUs.subtitle}
          titleId="home-why-choose-heading"
        />

        <div className={`home-editorial-stack reveal-stagger${inView ? ' is-visible' : ''}`}>
          {homeWhyChooseUs.items.map((item, index) => {
            const image = images[item.id]

            return (
              <article
                key={item.id}
                className="home-editorial-stack__item reveal-item"
                style={{ '--reveal-delay': `${index * 0.1}s` }}
              >
                <div className="home-editorial-stack__content">
                  <h3 className="home-editorial-stack__title">{item.title}</h3>
                  <p className="home-editorial-stack__desc">{item.text}</p>
                </div>
                <figure className="home-editorial-stack__media">
                  <SectionMedia
                    image={image}
                    fallbackSrc={item.imageFallback}
                    alt={item.imageAlt}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    width={800}
                    height={550}
                  />
                </figure>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HomeWhyChooseUs
