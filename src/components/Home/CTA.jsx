import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ButtonWithIcon from '../ButtonWithIcon'
import { ctas } from '../../content/site'
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
          <h2 className="cta-title">Ready to Partner with Us?</h2>
          <p className="cta-text">
            Speak with our team about orthopaedic product portfolios, clinical support,
            and partnership opportunities for your hospital or trust.
          </p>
          <div className="cta-buttons">
            <ButtonWithIcon
              text={ctas.speakWithTeam}
              icon="fas fa-hand-pointer"
              to="/contact"
              variant="main"
              iconTeal={true}
            />
            <Link to="/partners" className="btn btn-outline-white">
              {ctas.viewPartners}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA
