import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { HERO_SLIDES } from '../../data/heroSlides'
import HeroSlider from './HeroSlider'
import './Hero.css'

const MotionLink = motion(Link)

const Hero = ({ branchData }) => {
  const [activeSlide, setActiveSlide] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  // Fade scroll indicator after first scroll
  useEffect(() => {
    const handler = () => { if (window.scrollY > 80) setScrolled(true) }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Hero content from Supabase or sensible defaults
  const heroContent = branchData?.pageContent?.hero || {}
  const branchName  = branchData?.branch?.branch_name
  const title = heroContent.content_title
    || (branchName ? `OrthoHouse ${branchName}` : 'Advanced Prosthetics & Biomedical Engineering')
  const subtitle = heroContent.content_text ||
    'Transforming lives through innovative technology and personalised care. We are committed to excellence in prosthetics and biomedical solutions.'

  const [motionRef, motionInView] = useInView({ triggerOnce: true, threshold: 0.35 })

  // ── Framer Motion variants (unchanged from original) ──────────────────────

  const heroContentVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.85,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const heroTextVariants = {
    hidden:  { opacity: 0, y: 26, skewY: 6,  filter: 'blur(6px)' },
    visible: { opacity: 1, y: 0,  skewY: 0,  filter: 'blur(0px)',
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
  }

  const heroTitleLineVariants = {
    hidden:  { opacity: 0, x: -36, skewX: 6,  scale: 0.96 },
    visible: { opacity: 1, x: 0,   skewX: 0,  scale: 1,
      transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1] } }
  }

  const heroSubtitleVariants = {
    hidden:  { opacity: 0, y: 26, filter: 'blur(8px)', letterSpacing: '0.04em' },
    visible: { opacity: 1, y: 0,  filter: 'blur(0px)', letterSpacing: '0.02em',
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }
  }

  const heroButtonsVariants = {
    hidden:  { opacity: 0, y: 28, rotateX: -12 },
    visible: { opacity: 1, y: 0,  rotateX: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.12 } }
  }

  const heroButtonItemVariants = {
    hidden:  { opacity: 0, y: 16, scale: 0.95 },
    visible: { opacity: 1, y: 0,  scale: 1,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
  }

  const eyebrowVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
    exit:    { opacity: 0, y: -6, transition: { duration: 0.25 } }
  }

  return (
    <section
      className="hero-section"
      aria-label="OrthoHouse UK — advanced prosthetics and biomedical engineering"
    >
      {/* Background image slider */}
      <HeroSlider onSlideChange={setActiveSlide} />

      {/* Gradient overlay for WCAG AA text contrast */}
      <div className="hero-overlay" aria-hidden="true" />

      {/* Grain texture */}
      <div className="hero-grain" aria-hidden="true" />

      {/* Content layer */}
      <div className="container">
        <div className="hero-content">
          <motion.div
            variants={heroContentVariants}
            initial="hidden"
            animate={motionInView ? 'visible' : 'hidden'}
            ref={motionRef}
          >
            {/* Per-slide eyebrow — crossfades on slide change */}
            <AnimatePresence mode="wait">
              <motion.span
                key={`eyebrow-${activeSlide}`}
                className="hero-eyebrow"
                variants={eyebrowVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {HERO_SLIDES[activeSlide]?.eyebrow}
              </motion.span>
            </AnimatePresence>

            <motion.h1 className="hero-title" variants={heroTextVariants} role="presentation">
              {title.split('\n').map((line, index, arr) => (
                <motion.span key={`hero-line-${index}`} variants={heroTitleLineVariants}>
                  <span className="hero-title__inner">{line}</span>
                  {index < arr.length - 1 && <br />}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p className="hero-subtitle" variants={heroSubtitleVariants}>
              {subtitle}
            </motion.p>

            <motion.div className="hero-buttons" variants={heroButtonsVariants}>
              <MotionLink to="/partners" className="btn btn-main" variants={heroButtonItemVariants}>
                Our Partners
              </MotionLink>
              <MotionLink to="/contact" className="btn btn-outline" variants={heroButtonItemVariants}>
                Get In Touch
              </MotionLink>
            </motion.div>
          </motion.div>

          {/* Scroll indicator — fades when user scrolls */}
          <AnimatePresence>
            {!scrolled && (
              <motion.div
                className="hero-scroll-indicator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
                transition={{ opacity: { duration: 0.8, delay: 1.5 }, y: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } }}
                aria-hidden="true"
              >
                <i className="fas fa-chevron-down"></i>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

export default Hero
