import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ceoVisionMission } from '../../content/about'
import './CeoVisionMission.css'

const CeoVisionMission = () => {
  const [activeTab, setActiveTab] = useState('ceo')
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  })

  const { tabs, content, companyName, ceoImageAlt } = ceoVisionMission
  const currentContent = content[activeTab]

  const highlightText = (text, highlightedWords) => {
    if (!highlightedWords || highlightedWords.length === 0) {
      return text
    }

    let result = text
    highlightedWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi')
      result = result.replace(regex, '<span class="highlighted-text">$1</span>')
    })
    return result
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const textVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 }
    }
  }

  const imageVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, delay: 0.2 }
    }
  }

  return (
    <section className="ceo-vision-mission-section" ref={ref}>
      <div className="container">
        <motion.div
          className="ceo-vision-mission-wrapper"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <div className="ceo-vision-mission-content">
            <div className="ceo-vision-mission-tabs">
              <button
                className={`ceo-tab ${activeTab === 'ceo' ? 'active' : ''}`}
                onClick={() => setActiveTab('ceo')}
              >
                {tabs.ceo}
              </button>
              <button
                className={`ceo-tab ${activeTab === 'vision' ? 'active' : ''}`}
                onClick={() => setActiveTab('vision')}
              >
                {tabs.vision}
              </button>
              <button
                className={`ceo-tab ${activeTab === 'mission' ? 'active' : ''}`}
                onClick={() => setActiveTab('mission')}
              >
                {tabs.mission}
              </button>
            </div>

            <motion.div className="ceo-company-name" variants={textVariants}>
              {companyName}
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="ceo-content-area"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="ceo-main-heading">{currentContent.title}</h2>
                {currentContent.subtitle && (
                  <p className="ceo-subtitle">{currentContent.subtitle}</p>
                )}
                <div
                  className="ceo-text"
                  dangerouslySetInnerHTML={{
                    __html: highlightText(currentContent.text, currentContent.highlightedWords)
                  }}
                />
                {currentContent.author && (
                  <div className="ceo-author">
                    <div className="ceo-author-name">{currentContent.author.name}</div>
                    <div className="ceo-author-title">{currentContent.author.title}</div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div
            className="ceo-image-wrapper"
            variants={imageVariants}
          >
            <div className="ceo-image-container">
              <img
                src="/assets/images/ceo.jpeg"
                alt={ceoImageAlt}
                className="ceo-image"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = 'https://via.placeholder.com/600x800/13293d/eff8ff?text=CEO+Photo'
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default CeoVisionMission
