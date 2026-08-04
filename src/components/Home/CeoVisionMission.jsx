import { useState } from 'react'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  LayoutGroup
} from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ceoVisionMission } from '../../content/about'
import './CeoVisionMission.css'

const TAB_KEYS = ['ceo', 'vision', 'mission']
const SIDE_KEYS = ['vision', 'mission']

const previewLine = (text, max = 72) => {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1).trimEnd()}…`
}

const CeoVisionMission = () => {
  const [activeTab, setActiveTab] = useState('ceo')
  const reduceMotion = useReducedMotion()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.12
  })

  const { eyebrow, tabs, content } = ceoVisionMission
  const currentContent = content[activeTab]
  const show = inView || reduceMotion
  const showQuote = activeTab === 'ceo'
  const showWordmark = activeTab !== 'ceo'

  const panelMotion = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, y: -6, filter: 'blur(4px)' }
      }

  const stagger = (delay) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: show ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
          transition: {
            duration: 0.5,
            delay: show ? delay : 0,
            ease: [0.22, 1, 0.36, 1]
          }
        }

  const focusTabAt = (index) => {
    const next = TAB_KEYS[(index + TAB_KEYS.length) % TAB_KEYS.length]
    setActiveTab(next)
    requestAnimationFrame(() => {
      document.getElementById(`ceo-tab-${next}`)?.focus()
    })
  }

  const onTabKeyDown = (event, index) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      focusTabAt(index + 1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      focusTabAt(index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusTabAt(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusTabAt(TAB_KEYS.length - 1)
    }
  }

  return (
    <section
      className="ceo-mix-section ds-section"
      ref={ref}
      aria-labelledby="ceo-vision-mission-heading"
    >
      <div className="ceo-mix-section__wash" aria-hidden="true">
        <span className="ceo-mix-section__arc ceo-mix-section__arc--a" />
        <span className="ceo-mix-section__arc ceo-mix-section__arc--b" />
        <span className="ceo-mix-section__dot ceo-mix-section__dot--a" />
        <span className="ceo-mix-section__dot ceo-mix-section__dot--b" />
        <span className="ceo-mix-section__dot ceo-mix-section__dot--c" />
      </div>

      <div className="container">
        <div className="ceo-mix">
          <motion.header className="ceo-mix__header" {...stagger(0)}>
            <p className="ceo-mix__eyebrow">{eyebrow || 'Leadership'}</p>
            <LayoutGroup id="ceo-mix-tabs">
              <div
                className="ceo-mix__tabs"
                role="tablist"
                aria-label="Leadership content"
              >
                {TAB_KEYS.map((key, index) => {
                  const selected = activeTab === key
                  return (
                    <button
                      key={key}
                      type="button"
                      id={`ceo-tab-${key}`}
                      className={`ceo-mix__tab${selected ? ' is-active' : ''}`}
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`ceo-panel-${key}`}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setActiveTab(key)}
                      onKeyDown={(event) => onTabKeyDown(event, index)}
                    >
                      {selected && !reduceMotion ? (
                        <motion.span
                          layoutId="ceo-mix-indicator"
                          className="ceo-mix__indicator"
                          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                        />
                      ) : selected ? (
                        <span className="ceo-mix__indicator" />
                      ) : null}
                      <span className="ceo-mix__tab-label">{tabs[key]}</span>
                    </button>
                  )
                })}
              </div>
            </LayoutGroup>
          </motion.header>

          <div className="ceo-mix__stage">
            <motion.div className="ceo-mix__glass" {...stagger(0.1)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  id={`ceo-panel-${activeTab}`}
                  className="ceo-mix__panel"
                  role="tabpanel"
                  aria-labelledby={`ceo-tab-${activeTab}`}
                  {...panelMotion}
                  transition={{
                    duration: reduceMotion ? 0 : 0.28,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  {showQuote ? (
                    <span className="ceo-mix__quote" aria-hidden="true">
                      ”
                    </span>
                  ) : null}
                  {showWordmark ? (
                    <span className="ceo-mix__wordmark" aria-hidden="true">
                      ORTHOHOUSE
                    </span>
                  ) : null}

                  <h2
                    id="ceo-vision-mission-heading"
                    className="ceo-mix__title"
                  >
                    {currentContent.title}
                  </h2>
                  <p className="ceo-mix__text">{currentContent.text}</p>

                  {currentContent.author ? (
                    <footer className="ceo-mix__author">
                      <span className="ceo-mix__author-name">
                        {currentContent.author.name}
                      </span>
                      <span className="ceo-mix__author-title">
                        {currentContent.author.title}
                      </span>
                    </footer>
                  ) : currentContent.brandLine ? (
                    <footer className="ceo-mix__mark">
                      <span className="ceo-mix__mark-word">
                        {currentContent.brandLine}
                      </span>
                      {currentContent.panelLabel ? (
                        <span className="ceo-mix__mark-label">
                          {currentContent.panelLabel}
                        </span>
                      ) : null}
                    </footer>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <motion.aside className="ceo-mix__bento" {...stagger(0.18)}>
              {SIDE_KEYS.map((key) => {
                const item = content[key]
                const active = activeTab === key
                return (
                  <button
                    key={key}
                    type="button"
                    className={`ceo-mix__card${active ? ' is-active' : ''}`}
                    onClick={() => setActiveTab(key)}
                    aria-pressed={active}
                    aria-controls={`ceo-panel-${key}`}
                  >
                    <span className="ceo-mix__card-label">{tabs[key]}</span>
                    <span className="ceo-mix__card-preview">
                      {previewLine(item.text)}
                    </span>
                  </button>
                )
              })}
            </motion.aside>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CeoVisionMission
