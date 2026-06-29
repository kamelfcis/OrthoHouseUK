import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ceoVisionMission } from '../../content/about'
import './CeoVisionMission.css'

const TAB_KEYS = ['ceo', 'vision', 'mission']

const CeoVisionMission = () => {
  const [activeTab, setActiveTab] = useState('ceo')
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.15
  })

  const { sectionEyebrow, tabs, content, ceoImageAlt } = ceoVisionMission
  const currentContent = content[activeTab]
  const showPortrait = activeTab === 'ceo'

  return (
    <section
      className="ceo-vision-mission-section ds-section"
      ref={ref}
      aria-labelledby="ceo-vision-mission-heading"
    >
      <div className="container">
        <motion.div
          className="ceo-vision-mission-card"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className="ceo-vision-mission-header">
            <span className="ceo-vision-mission-eyebrow">{sectionEyebrow}</span>
            <nav className="ceo-vision-mission-tabs" aria-label="Leadership content">
              {TAB_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`ceo-tab${activeTab === key ? ' active' : ''}`}
                  onClick={() => setActiveTab(key)}
                  aria-selected={activeTab === key}
                  role="tab"
                >
                  {tabs[key]}
                </button>
              ))}
            </nav>
          </header>

          <div className={`ceo-vision-mission-body${showPortrait ? ' has-portrait' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="ceo-content-area"
                role="tabpanel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <h2 id="ceo-vision-mission-heading" className="ceo-main-heading">
                  {currentContent.title}
                </h2>
                <p className="ceo-text">{currentContent.text}</p>
                {currentContent.author && (
                  <footer className="ceo-author">
                    <div className="ceo-author-name">{currentContent.author.name}</div>
                    <div className="ceo-author-title">{currentContent.author.title}</div>
                  </footer>
                )}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {showPortrait && (
                <motion.figure
                  className="ceo-portrait"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="ceo-portrait-frame">
                    <img
                      src="/assets/images/ceo.jpeg"
                      alt={ceoImageAlt}
                      className="ceo-portrait-image"
                      loading="lazy"
                      width={240}
                      height={300}
                    />
                  </div>
                </motion.figure>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CeoVisionMission
