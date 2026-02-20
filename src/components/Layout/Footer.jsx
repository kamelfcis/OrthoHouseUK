import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Contact Us', path: '/contact' }
    ],
    resources: [
      { name: 'Blog', path: '/blog' },
      { name: 'Gallery', path: '/gallery' },
      { name: 'Partners', path: '/partners' }
    ]
  }

  const socialLinks = [
    { name: 'LinkedIn', icon: 'fab fa-linkedin-in', url: 'https://uk.linkedin.com/company/orthohouse-uk' },
   
    { name: 'Facebook', icon: 'fab fa-facebook-f', url: 'https://www.facebook.com/OrthoHouseEgy' },
    { name: 'X (Twitter)', icon: 'fab fa-twitter', url: 'https://x.com/OrthoHouseEgy' },
    { name: 'YouTube', icon: 'fab fa-youtube', url: 'https://www.youtube.com/@orthohouse' },
    { name: 'Instagram', icon: 'fab fa-instagram', url: 'https://www.instagram.com/ortho.house/' },
    { name: 'Snapchat', icon: 'fab fa-snapchat-ghost', url: 'https://www.snapchat.com/add/ortho.house1' },
    { name: 'TikTok', icon: 'fab fa-tiktok', url: 'https://www.tiktok.com/@ortho_house/' },
    { name: 'Email', icon: 'fas fa-envelope', url: 'mailto:info@ortho-house.com' },
   
  ]

  return (
    <footer className="lte-footer-wrapper">
      <div className="lte-footer-widgets">
        <div className="container">
          <div className="row footer-row">
            <div className="col-lg-4 col-md-12">
              <div className="footer-widget footer-about">
                <img src="/assets/images/Logo_SVG.png" alt="OrthoHouse UK Logo" className="footer-logo" />
                <h3>About OrthoHouse UK</h3>
                <p>
                  OrthoHouse UK delivers leading prosthetics and biomedical engineering solutions,
                  empowering clinicians and patients with innovative technology across the UK and beyond.
                </p>
                <div className="footer-social">
                  {socialLinks.map((social) => (
                    <a key={social.name} href={social.url} aria-label={social.name} target="_blank" rel="noreferrer">
                      <i className={social.icon}></i>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-8">
              <div className="footer-columns">
                <div className="footer-widget">
                  <h3>Company</h3>
                  <ul>
                    {footerLinks.company.map((link, index) => (
                      <li key={index}>
                        <Link to={link.path}>{link.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="footer-widget">
                  <h3>Resources</h3>
                  <ul>
                    {footerLinks.resources.map((link, index) => (
                      <li key={index}>
                        <Link to={link.path}>{link.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-lg-2 col-md-4 contact-column">
              <div className="footer-widget contact-widget">
                <h3>Contact</h3>
                <ul className="contact-info">
                  <li>
                    <i className="fas fa-phone"></i>
                    <a href="tel:+442033683036">+44 20 3368 3036</a>
                  </li>
                  <li>
                    <i className="fas fa-envelope"></i>
                    <a href="mailto:info@ortho-house.com">info@ortho-house.com</a>
                  </li>
                  <li>
                    <i className="fas fa-map-marker-alt"></i>
                    2 Kingdom Street, London W2 6BD<br />United Kingdom
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="copyright-block">
        <div className="container">
          <div className="copyright-content">
            <p>&copy; {currentYear} OrthoHouse UK | All Rights Reserved | Powered by <a href="https://ngdc.com.eg" target="_blank" rel="noreferrer">ngdc.com.eg</a></p>
            <p>Advanced Prosthetics & Biomedical Engineering Solutions</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
