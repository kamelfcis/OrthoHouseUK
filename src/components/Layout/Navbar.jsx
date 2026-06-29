import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { nav } from '../../content/site'
import './Navbar.css'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8)
    }

    let ticking = false
    const scrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', scrollHandler, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', scrollHandler)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const query = encodeURIComponent(searchQuery.trim())
      window.location.href = `/blog?search=${query}`
      setSearchQuery('')
    }
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <div
      id="lte-nav-wrapper"
      className={`lte-nav-wrapper ${isScrolled ? 'scrolled' : ''}`}
    >
      <nav className="lte-navbar" aria-label="Main navigation">
        <div className="container">
          <div className="lte-navbar-logo">
            <Link to="/" aria-label={`${nav.logoAlt} — Home`}>
              <img
                src="/assets/images/Logo_SVG.svg"
                alt={nav.logoAlt}
                className="logo"
                width={132}
                height={44}
                decoding="async"
              />
            </Link>
          </div>

          <div className={`lte-navbar-items navbar-mobile navbar-mobile-black ${isMenuOpen ? 'collapse' : ''}`}>
            <div className="toggle-wrap">
              <Link to="/" className="lte-logo mobile-logo">
                <img
                  src="/assets/images/Logo_SVG.svg"
                  alt={nav.logoAlt}
                  width={120}
                  height={40}
                  decoding="async"
                />
                <div className="mobile-logo-text">
                  <span className="logo-text">OrthoHouse UK</span>
                </div>
              </Link>
              <button
                type="button"
                className="lte-navbar-toggle collapsed"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <span className="close">&times;</span>
              </button>
              <div className="clearfix"></div>
            </div>

            <ul className="navbar-menu lte-ul-nav">
              {nav.items.map((item) => (
                <li
                  key={item.path}
                  className={isActive(item.path) ? 'active' : ''}
                >
                  <Link to={item.path} aria-current={isActive(item.path) ? 'page' : undefined}>
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="lte-mobile-controls">
              <div className="lte-nav-search">
                <form onSubmit={handleSearch} className="wp-searchform">
                  <input
                    type="search"
                    placeholder={nav.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label={nav.searchPlaceholder}
                  />
                  <button
                    type="submit"
                    id="lte-top-search-ico-mobile"
                    className="search-submit"
                    aria-label="Search"
                  >
                    <span className="search-icon">
                      <i className="fas fa-search"></i>
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`lte-navbar-toggle ${isMenuOpen ? 'collapsed' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="lte-nav-wrapper"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="icon-bar top-bar"></span>
            <span className="icon-bar middle-bar"></span>
            <span className="icon-bar bottom-bar"></span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default Navbar
