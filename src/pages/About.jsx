import { useEffect, Suspense, lazy } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import SEO from '../components/SEO/SEO'
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
        title="About Us - OrthoHouse"
        description="Learn about OrthoHouse's mission, values, and commitment to providing exceptional prosthetics, orthotics, and biomedical engineering solutions."
        keywords="about OrthoHouse, prosthetics company, orthotic solutions provider, biomedical engineering, healthcare mission"
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
              About OrthoHouse
            </motion.div>
            <motion.h1 className="about-hero__title" variants={heroChildVariants}>
              <motion.span variants={heroLineVariants}>Excellence in</motion.span>
              <motion.span variants={heroLineVariants}>Healthcare Innovation</motion.span>
            </motion.h1>
            <motion.p className="about-hero__subtitle" variants={heroChildVariants}>
              Discover our mission, vision, and commitment to transforming lives through
              advanced prosthetics and biomedical engineering solutions.
            </motion.p>
            <motion.ul className="about-hero__breadcrumbs" variants={heroBreadcrumbVariants}>
              <li><a href="/">Home</a></li>
              <li>About Us</li>
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
      <div className="lte-text-page margin-default">
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
                        <h2>OrthoHouse Philosophy</h2>
                        <p>
                          OrthoHouse for Medical Services and Supplies is a leading regional distributor 
                          of innovative Orthopaedic and surgical solutions. Established in 2009, we have 
                          become a trusted partner for top-tier global manufacturers, delivering advanced 
                          medical technologies across Egypt, the GCC, and selected international markets.
                        </p>
                        <p>
                          Our commitment is to enhance patient outcomes and support healthcare professionals 
                          with high-quality products, technical expertise, and educational support. We are 
                          the exclusive agent for several globally renowned brands and are actively expanding 
                          our international footprint.
                        </p>
                        <p>
                          With years of experience in prosthetics and biomedical engineering, 
                          we are dedicated to providing cutting-edge solutions that enhance 
                          mobility and improve quality of life. Our team of experts combines 
                          advanced technology with personalized care to deliver exceptional results.
                        </p>
                        <p>
                          We understand that every individual has unique needs, which is why 
                          we offer customized solutions tailored to each client. From initial 
                          consultation to ongoing support, we're with you every step of the way.
                        </p>
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
                  <h2 className="text-center">Our Core Values</h2>
                  <div className="values-grid">
                    <div className="value-item">
                      <div className="value-icon">
                        <i className="fas fa-heart"></i>
                      </div>
                      <h4>Compassion</h4>
                      <p>We approach every patient with empathy and understanding, recognizing the emotional journey of recovery.</p>
                    </div>
                    <div className="value-item">
                      <div className="value-icon">
                        <i className="fas fa-flask"></i>
                      </div>
                      <h4>Innovation</h4>
                      <p>We continuously invest in the latest technology and research to provide cutting-edge solutions.</p>
                    </div>
                    <div className="value-item">
                      <div className="value-icon">
                        <i className="fas fa-star"></i>
                      </div>
                      <h4>Excellence</h4>
                      <p>We maintain the highest standards in every aspect of our work, from design to delivery.</p>
                    </div>
                    <div className="value-item">
                      <div className="value-icon">
                        <i className="fas fa-handshake"></i>
                      </div>
                      <h4>Integrity</h4>
                      <p>We build trust through transparency, honesty, and ethical practices in all our interactions.</p>
                    </div>
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
