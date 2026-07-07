import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { nav } from '../../content/site'
import { brandLogos } from '../../data/localAssets'
import { fetchNavVisibility, filterNavItems } from '../../lib/navLinkSettings'
import './Navbar.css'

const DEFAULT_NAV_VISIBILITY = { partners: false, blog: false }

const LogoMark = ({ width = 168, height = 96, imgClassName = 'logo' }) => (
  <img
    src={brandLogos.navSvg}
    alt={nav.logoAlt}
    className={imgClassName}
    width={width}
    height={height}
    decoding="async"
  />
)

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [navVisibility, setNavVisibility] = useState(DEFAULT_NAV_VISIBILITY)
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

  useEffect(() => {
    let cancelled = false

    fetchNavVisibility('UK')
      .then((visibility) => {
        if (!cancelled) {
          setNavVisibility(visibility)
        }
      })
      .catch((error) => {
        console.error('Navbar: failed to load nav visibility', error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const query = encodeURIComponent(searchQuery.trim())
      window.location.href = `/blog?search=${query}`
      setSearchQuery('')
    }
  }

  const visibleNavItems = filterNavItems(nav.items, navVisibility)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <div
      id="site-nav"
      className={`site-nav ${isScrolled ? 'is-scrolled' : ''}`}
    >
      <nav className="site-navbar" aria-label="Main navigation">
        <div className="container">
          <div className="site-navbar__logo">
            <Link to="/" aria-label={`${nav.logoAlt} — Home`}>
              <LogoMark />
            </Link>
          </div>

          <div className={`site-navbar__panel navbar-mobile navbar-mobile-black ${isMenuOpen ? 'is-open' : ''}`}>
            <div className="toggle-wrap">
              <Link to="/" className="site-navbar__mobile-logo mobile-logo">
                <LogoMark width={140} height={80} />
              </Link>
              <button
                type="button"
                className="site-navbar__toggle is-active"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <span className="close">&times;</span>
              </button>
              <div className="clearfix"></div>
            </div>

            <ul className="navbar-menu site-navbar__list">
              {visibleNavItems.map((item) => (
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

            <div className="site-navbar__mobile-controls">
              <div className="site-navbar__search">
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
                    id="site-nav-search-submit"
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
            className={`site-navbar__toggle ${isMenuOpen ? 'is-active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="site-nav"
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
