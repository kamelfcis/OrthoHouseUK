import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import SectionHeading from '../common/SectionHeading'
import SectionMedia from '../common/SectionMedia'
import useSectionImages from '../../hooks/useSectionImages'
import { homeWhyChooseUs } from '../../content/home'
import './home-editorial.css'
import './HomeWhyChooseUs.css'

const WHY_CHOOSE_IMAGE_SPECS = homeWhyChooseUs.items.map(
  ({ id, imageQuery, imageFallback, imageAlt }) => ({
    id,
    imageQuery,
    imageFallback,
    imageAlt
  })
)

const HomeWhyChooseUs = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()
  const images = useSectionImages(WHY_CHOOSE_IMAGE_SPECS)

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

        <div className="home-editorial-stack">
          {homeWhyChooseUs.items.map((item, index) => {
            const image = images[item.id]

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
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HomeWhyChooseUs
