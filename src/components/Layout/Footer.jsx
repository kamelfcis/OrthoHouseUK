import { Link } from 'react-router-dom'
import { footer, siteName } from '../../content/site'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const { about, columns, contact, social, copyright } = footer

  return (
    <footer className="lte-footer-wrapper">
      <div className="lte-footer-widgets">
        <div className="container">
          <div className="row footer-row">
            <div className="col-lg-4 col-md-12">
              <div className="footer-widget footer-about">
                <img
                  src="/assets/images/Logo_SVG.svg"
                  alt={`${siteName} logo`}
                  className="footer-logo"
                  width={160}
                  height={56}
                  loading="lazy"
                  decoding="async"
                />
                <h3>{about.title}</h3>
                <p>{about.description}</p>
                <div className="footer-social">
                  {social.map((item) => (
                    <a
                      key={item.name}
                      href={item.url}
                      aria-label={item.name}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <i className={item.icon}></i>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-6 col-md-8">
              <div className="footer-columns">
                <div className="footer-widget">
                  <h3>{columns.company.title}</h3>
                  <ul>
                    {columns.company.links.map((link) => (
                      <li key={link.path}>
                        <Link to={link.path}>{link.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="footer-widget">
                  <h3>{columns.resources.title}</h3>
                  <ul>
                    {columns.resources.links.map((link) => (
                      <li key={link.path}>
                        <Link to={link.path}>{link.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-lg-2 col-md-4 contact-column">
              <div className="footer-widget contact-widget">
                <h3>{contact.title}</h3>
                <ul className="contact-info">
                  <li>
                    <i className="fas fa-phone" aria-hidden="true"></i>
                    <a href={contact.phoneHref}>{contact.phone}</a>
                  </li>
                  <li>
                    <i className="fas fa-envelope" aria-hidden="true"></i>
                    <a href={contact.emailHref}>{contact.email}</a>
                  </li>
                  <li>
                    <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                    {contact.addressLines.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
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
            <p>
              &copy; {currentYear} {siteName} | All Rights Reserved | Powered by{' '}
              <a href={copyright.poweredBy.url} target="_blank" rel="noreferrer">
                {copyright.poweredBy.label}
              </a>
            </p>
            <p>{copyright.tagline}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
