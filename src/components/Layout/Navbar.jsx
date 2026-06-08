import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Partners', path: '/partners' },
    { name: 'Products', path: '/products' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact Us', path: '/contact' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    // Throttle scroll events for better performance
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
    handleScroll() // Initial call
    return () => window.removeEventListener('scroll', scrollHandler)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results page or handle search
      const query = encodeURIComponent(searchQuery.trim())
      window.location.href = `/blog?search=${query}`
      setSearchQuery('')
    }
  }

  return (
    <div id="lte-nav-wrapper" className={`lte-nav-wrapper ${isScrolled ? 'scrolled' : ''}`}>
      <nav className="lte-navbar">
        <div className="container">
          <div className="lte-navbar-logo">
            <Link to="/">
              <img src="/assets/images/Logo_SVG.svg" alt="Cybron Logo" className="logo" width={140} height={48} decoding="async" />
            </Link>
          </div>

          <div className={`lte-navbar-items navbar-mobile navbar-mobile-black ${isMenuOpen ? 'collapse' : ''}`}>
            <div className="toggle-wrap">
              <Link to="/" className="lte-logo mobile-logo">
                <img src="/assets/images/Logo_SVG.svg" alt="Ortho-House Logo" width={120} height={40} decoding="async" />
                <div className="mobile-logo-text">
                  <span className="logo-text">Ortho-House</span>
                 
                </div>
              </Link>
              <button
                type="button"
                className="lte-navbar-toggle collapsed"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="close">&times;</span>
              </button>
              <div className="clearfix"></div>
            </div>

            <ul className="navbar-menu lte-ul-nav">
              {menuItems.map((item) => {
                const hasSubmenu = false
                return (
                  <li key={item.path} className={`${hasSubmenu ? 'menu-item-has-children' : ''} ${location.pathname === item.path ? 'active' : ''}`}>
                    <Link to={item.path}>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="lte-mobile-controls">
              <div className="lte-nav-search">
                <form onSubmit={handleSearch} className="wp-searchform">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    id="lte-top-search-ico-mobile"
                    className="search-submit"
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
