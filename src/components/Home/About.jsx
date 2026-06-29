import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { homeMission } from '../../content/home'
import './About.css'

const About = ({ branchData }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  })

  // Get about content from Supabase
  const aboutContent = branchData?.pageContent?.about
  const mission = branchData?.companyInfo?.mission
  const vision = branchData?.companyInfo?.vision

  const title = aboutContent?.content_title || mission?.title || homeMission.title
  const description = aboutContent?.content_text || mission?.content || homeMission.statement

  return (
    <section className="about-section" ref={ref}>
      <div className="about-background-pattern"></div>
      <div className="container">
        <div className="about-content">
          <motion.div
            className="about-text"
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="section-label">
              <span className="label-text">{homeMission.eyebrow}</span>
              <div className="label-line"></div>
            </div>
            <h2 className="section-title">{title}</h2>
            <div className="title-underline"></div>
            <p className="about-description">
              {description}
            </p>
            {vision && (
              <motion.div
                className="vision-box"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="vision-icon">
                  <i className="fas fa-eye"></i>
                </div>
                <div className="vision-content">
                  <h3 className="vision-title">Our Vision</h3>
                  <p className="vision-text">{vision.content}</p>
                </div>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/about" className="lte-btn btn-main about-cta-btn">
                <span className="lte-btn-inner">
                  <span>Learn More About Us</span>
                  <i className="fas fa-arrow-right"></i>
                </span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="about-image"
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="image-decoration"></div>
            <div className="image-wrapper">
              <img src="/assets/images/ourmission.jpg" alt="Our Mission" />
              <div className="image-overlay"></div>
              <div className="image-shine"></div>
            </div>
            <div className="image-badge">
              <i className="fas fa-award"></i>
              <span>Excellence</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default About
