import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ButtonWithIcon from '../ButtonWithIcon'
import './CTA.css'

const CTA = () => {
  return (
    <section className="cta-section">
      <div className="cta-overlay"></div>
      <div className="container">
        <motion.div
          className="cta-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-text">
            Contact us today to learn how we can help improve your quality of life
            with our advanced prosthetics and biomedical engineering solutions.
          </p>
          <div className="cta-buttons">
            <ButtonWithIcon 
              text="Contact Us"
              icon="fas fa-hand-pointer"
              to="/contact"
              variant="main"
              iconTeal={true}
            />
            <Link to="/partners" className="btn btn-outline-white">
              View Partners
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA
