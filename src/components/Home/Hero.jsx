import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useParallax } from '../../hooks/useParallax'
import './Hero.css'

const MotionLink = motion(Link)
const HERO_VIDEO_URL =
  'https://www.youtube.com/embed/ms8gRumejhg?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=ms8gRumejhg&playsinline=1&enablejsapi=1&modestbranding=1'

const Hero = ({ branchData }) => {
  const [parallaxEnabled, setParallaxEnabled] = useState(false)
  const heroRef = useParallax(0.5, parallaxEnabled)

  useEffect(() => {
    const enableParallax = () => setParallaxEnabled(true)
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(enableParallax, { timeout: 3000 })
      : setTimeout(enableParallax, 2000)

    return () => {
      if (window.requestIdleCallback) {
        window.cancelIdleCallback(idleId)
      } else {
        clearTimeout(idleId)
      }
    }
  }, [])

  // Get hero content from Supabase or use defaults
  const heroContent = branchData?.pageContent?.hero || {}
  const title = heroContent.content_title || branchData?.branch?.branch_name 
    ? `OrthoHouse ${branchData.branch.branch_name}` 
    : 'Advanced Prosthetics & Biomedical Engineering'
  const subtitle = heroContent.content_text || 
    'Transforming lives through innovative technology and personalized care. We are committed to excellence in prosthetics and biomedical solutions.'

  const [motionRef, motionInView] = useInView({
    triggerOnce: true,
    threshold: 0.35
  })

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
    hidden: { opacity: 0, y: 26, skewY: 6, filter: 'blur(6px)' },
    visible: {
      opacity: 1,
      y: 0,
      skewY: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const heroTitleLineVariants = {
    hidden: { opacity: 0, x: -36, skewX: 6, scale: 0.96 },
    visible: {
      opacity: 1,
      x: 0,
      skewX: 0,
      scale: 1,
      transition: {
        duration: 0.68,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const heroSubtitleVariants = {
    hidden: { opacity: 0, y: 26, filter: 'blur(8px)', letterSpacing: '0.04em' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      letterSpacing: '0.02em',
      transition: {
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const heroButtonsVariants = {
    hidden: { opacity: 0, y: 28, rotateX: -12 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.12
      }
    }
  }

  const heroButtonItemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <section className="hero-section elementor-section elementor-section-stretched elementor-section-boxed" ref={heroRef}>
      <div className="elementor-background-video-container" aria-hidden="true">
        <iframe
          className="elementor-background-video-hosted"
          src={HERO_VIDEO_URL}
          title="OrthoHouse UK Hero Video"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="hero-overlay"></div>
      
      <div className="container">
        <div className="hero-content">
          <motion.div
            variants={heroContentVariants}
            initial="hidden"
            animate={motionInView ? 'visible' : 'hidden'}
            ref={motionRef}
          >
            <motion.h1 className="hero-title" variants={heroTextVariants} role="presentation">
              {title.split('\n').map((line, index, arr) => (
                <motion.span
                  key={`hero-line-${index}`}
                  variants={heroTitleLineVariants}
                >
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
        </div>
      </div>
    </section>
  )
}

export default Hero
