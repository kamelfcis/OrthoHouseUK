import { useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import SectionHeading from '../common/SectionHeading'
import { homeFaq } from '../../content/home'
import './HomeFaq.css'

const HomeFaq = () => {
  const [openId, setOpenId] = useState(null)
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: inView ? { opacity: 1, y: 0 } : {},
        transition: { duration: 0.5 }
      }

  return (
    <section
      className="home-faq ds-section"
      ref={ref}
      aria-labelledby="home-faq-heading"
    >
      <div className="container home-faq__inner">
        <SectionHeading
          eyebrow={homeFaq.eyebrow}
          title={homeFaq.title}
          subtitle={homeFaq.subtitle}
          titleId="home-faq-heading"
          align="left"
          className="home-faq__head"
        />

        <motion.dl className="home-faq__list" {...motionProps}>
          {homeFaq.items.map((item) => {
            const isOpen = openId === item.id
            return (
              <div
                key={item.id}
                className={`home-faq__item${isOpen ? ' is-open' : ''}`}
              >
                <dt>
                  <button
                    type="button"
                    className="home-faq__question"
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                  >
                    <span>{item.question}</span>
                    <i
                      className={`fas fa-chevron-down home-faq__icon${isOpen ? ' is-open' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                </dt>
                <dd id={`faq-answer-${item.id}`}>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        className="home-faq__answer-wrap"
                        initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p className="home-faq__answer">{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </dd>
              </div>
            )
          })}
        </motion.dl>
      </div>
    </section>
  )
}

export default HomeFaq
