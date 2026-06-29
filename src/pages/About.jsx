import { useEffect, Suspense, lazy } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import { aboutPage } from '../content/about'
import CeoVisionMission from '../components/Home/CeoVisionMission'
import HomeAboutSection from '../components/Home/About'
import useBranchData from '../hooks/useBranchData'
import './About.css'

const SectionFallback = ({ height = 260 }) => (
  <div className="section-fallback" style={{ minHeight: height }}>
    <div className="section-fallback__spinner" />
  </div>
)

const About = () => {
  const { branchData } = useBranchData('UK')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [ref1, inView1] = useInView({
    triggerOnce: true,
    threshold: 0.2
  })

  const [ref2, inView2] = useInView({
    triggerOnce: true,
    threshold: 0.2
  })

  const [ref3, inView3] = useInView({
    triggerOnce: true,
    threshold: 0.2
  })

  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.25
  })

  const heroContainerVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.85,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  }

  const heroChildVariants = {
    hidden: { opacity: 0, y: 24, skewY: 4 },
    visible: {
      opacity: 1,
      y: 0,
      skewY: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const heroLineVariants = {
    hidden: { opacity: 0, x: -36 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const heroBreadcrumbVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <div className="about-page">
      <SEO
        title={pageSeo.about.title}
        description={pageSeo.about.description}
        keywords={pageSeo.about.keywords}
      />
      {/* Hero Section */}
      <div className="about-hero">
        <div className="about-hero__media" role="presentation" />
        <div className="about-hero__overlay" aria-hidden="true" />
        <div className="about-hero__container container">
          <motion.div
            className="about-hero__content"
            ref={heroRef}
            variants={heroContainerVariants}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
          >
            <motion.div
              className="about-hero__eyebrow"
              variants={heroChildVariants}
            >
              {aboutPage.hero.eyebrow}
            </motion.div>
            <motion.h1 className="about-hero__title" variants={heroChildVariants}>
              <motion.span variants={heroLineVariants}>{aboutPage.hero.titleLine1}</motion.span>
              <motion.span variants={heroLineVariants}>{aboutPage.hero.titleLine2}</motion.span>
            </motion.h1>
            <motion.p className="about-hero__subtitle" variants={heroChildVariants}>
              {aboutPage.hero.subtitle}
            </motion.p>
            <motion.ul className="about-hero__breadcrumbs" variants={heroBreadcrumbVariants}>
              <li><a href="/">{aboutPage.hero.breadcrumbHome}</a></li>
              <li>{aboutPage.hero.breadcrumbCurrent}</li>
            </motion.ul>
          </motion.div>
        </div>
      </div>

      {/* CEO, Vision & Mission Section */}
      <Suspense fallback={<SectionFallback />}>
        <CeoVisionMission />
      </Suspense>

      {/* Hidden About Section from Home (for SEO/content purposes) */}
      <div style={{ display: 'none' }}>
        <HomeAboutSection branchData={branchData} />
      </div>

      {/* Main Content */}
      <div className="about-page-content ds-section">
        <div className="container">
          <div className="row centered">
            <div className="col-xl-12">
              <article className="entry-content clearfix">
                    {/* About Section 1 */}
                    <motion.div
                      className="about-section-content"
                      ref={ref1}
                      initial={{ opacity: 0, y: 30 }}
                      animate={inView1 ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.8 }}
                    >
                      <div className="about-intro">
                        <h2>{aboutPage.philosophy.heading}</h2>
                        {aboutPage.philosophy.paragraphs.map((paragraph) => (
                          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                        ))}
                      </div>
                    </motion.div>

                {/* About Section 3 - Values */}
                <motion.div
                  className="about-values"
                  ref={ref3}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView3 ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <h2 className="text-center">{aboutPage.values.heading}</h2>
                  <div className="values-grid">
                    {aboutPage.values.items.map((value) => (
                      <div className="value-item" key={value.title}>
                        <div className="value-icon">
                          <i className={value.icon}></i>
                        </div>
                        <h4>{value.title}</h4>
                        <p>{value.text}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
