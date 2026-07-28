import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ceoVisionMission } from '../../content/about'
import './CeoVisionMission.css'

const TAB_KEYS = ['ceo', 'vision', 'mission']

const CeoVisionMission = () => {
  const [activeTab, setActiveTab] = useState('ceo')
  const reduceMotion = useReducedMotion()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.15
  })

  const { tabs, content, ceoImage, ceoImageAlt } = ceoVisionMission
  const currentContent = content[activeTab]
  const isCeoTab = activeTab === 'ceo'
  const panelLabel = currentContent.panelLabel || tabs[activeTab]
  const panelBrand = currentContent.brandLine || 'ORTHOHOUSE'

  const fade = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }

  return (
    <section
      className="ceo-vision-mission-section ds-section"
      ref={ref}
      aria-labelledby="ceo-vision-mission-heading"
    >
      <div className="container">
        <motion.div
          className="ceo-vision-mission-card"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={
            inView || reduceMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 24 }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <div className="ceo-vision-mission-layout">
            <div className="ceo-vision-mission-copy">
              <div className="ceo-vision-mission-inner">
                <header className="ceo-vision-mission-header">
                  <p className="ceo-vision-mission-eyebrow" aria-hidden="true">
                    {tabs[activeTab]}
                  </p>
                  <nav
                    className="ceo-vision-mission-tabs"
                    role="tablist"
                    aria-label="Leadership content"
                  >
                    {TAB_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        id={`ceo-tab-${key}`}
                        className={`ceo-tab${activeTab === key ? ' active' : ''}`}
                        onClick={() => setActiveTab(key)}
                        aria-selected={activeTab === key}
                        aria-controls={`ceo-panel-${key}`}
                        role="tab"
                        tabIndex={activeTab === key ? 0 : -1}
                      >
                        {tabs[key]}
                      </button>
                    ))}
                  </nav>
                </header>

                <div className="ceo-vision-mission-body">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      id={`ceo-panel-${activeTab}`}
                      className="ceo-content-area"
                      role="tabpanel"
                      aria-labelledby={`ceo-tab-${activeTab}`}
                      {...fade}
                      transition={{ duration: reduceMotion ? 0 : 0.22 }}
                    >
                      <h2
                        id="ceo-vision-mission-heading"
                        className="ceo-main-heading"
                      >
                        {currentContent.title}
                      </h2>
                      <p className="ceo-text">{currentContent.text}</p>
                      {currentContent.brandLine && (
                        <footer className="ceo-brand-line">
                          {currentContent.brandLine}
                        </footer>
                      )}
                      {currentContent.author && (
                        <footer className="ceo-author">
                          <div className="ceo-author-name">
                            {currentContent.author.name}
                          </div>
                          <div className="ceo-author-title">
                            {currentContent.author.title}
                          </div>
                        </footer>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <aside className="ceo-vision-mission-visual" aria-hidden={!isCeoTab}>
              <div className="ceo-visual-inset">
                <AnimatePresence mode="wait">
                  {isCeoTab ? (
                    <motion.div
                      key="ceo-portrait"
                      className="ceo-visual-portrait"
                      {...fade}
                      transition={{ duration: reduceMotion ? 0 : 0.28 }}
                    >
                      <picture>
                        <source
                          type="image/webp"
                          srcSet={ceoImage.webpSrcSet}
                          sizes={ceoImage.sizes}
                        />
                        <img
                          src={ceoImage.jpeg}
                          alt={ceoImageAlt}
                          className="ceo-portrait-img"
                          width={800}
                          height={1000}
                          loading="lazy"
                          decoding="async"
                        />
                      </picture>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`brand-${activeTab}`}
                      className="ceo-visual-brand"
                      {...fade}
                      transition={{ duration: reduceMotion ? 0 : 0.28 }}
                    >
                      <span className="ceo-visual-brand-wordmark">{panelBrand}</span>
                      <span className="ceo-visual-brand-rule" />
                      <span className="ceo-visual-brand-label">{panelLabel}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CeoVisionMission
