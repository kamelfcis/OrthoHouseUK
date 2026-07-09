import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { footer, siteName } from '../../content/site'
import { fetchVisibleSocialLinks } from '../../lib/socialLinks'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const { about, columns, contact } = footer
  const [social, setSocial] = useState(footer.social)

  useEffect(() => {
    let cancelled = false

    fetchVisibleSocialLinks('UK')
      .then((links) => {
        if (!cancelled && links?.length) {
          setSocial(links)
        }
      })
      .catch((error) => {
        console.error('Footer: failed to load social links', error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <div className="container">
          <div className="footer-row">
            <div className="footer-col footer-col--about">
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
                <div className="footer-social">
                  {social.map((item) => (
                    <a
                      key={item.platform || item.name}
                      href={item.url}
                      aria-label={item.name}
                      target={item.url.startsWith('mailto:') ? undefined : '_blank'}
                      rel={item.url.startsWith('mailto:') ? undefined : 'noreferrer'}
                    >
                      <i className={item.icon}></i>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="footer-col footer-col--company">
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
            </div>

            <div className="footer-col footer-col--contact">
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
              &copy; {currentYear} {siteName} | All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
