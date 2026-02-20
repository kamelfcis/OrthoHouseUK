import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './AdminLayout.css'

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { appUser, signOut, isAdmin, isBranchManager } = useAuth()

  useEffect(() => {
    if (!appUser) {
      navigate('/admin/login')
    }
  }, [appUser, navigate])

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileSidebarOpen && window.innerWidth <= 1024) {
        const sidebar = document.querySelector('.admin-sidebar')
        const toggleButton = document.querySelector('.mobile-sidebar-toggle')
        if (sidebar && !sidebar.contains(event.target) && 
            toggleButton && !toggleButton.contains(event.target)) {
          setMobileSidebarOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileSidebarOpen])

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setMobileSidebarOpen(false)
    }
  }, [location.pathname])

  if (!appUser) {
    return null
  }

  const menuItems = [
    {
      icon: 'fas fa-home',
      label: 'Dashboard',
      path: '/admin/dashboard',
      show: true,
    },
    {
      icon: 'fas fa-box',
      label: 'Products',
      path: '/admin/products',
      show: true,
    },
    {
      icon: 'fas fa-newspaper',
      label: 'Blog Posts',
      path: '/admin/blogs',
      show: true,
    },
    {
      icon: 'fas fa-handshake',
      label: 'Partners',
      path: '/admin/partners',
      show: true,
    },
    {
      icon: 'fas fa-tags',
      label: 'Categories',
      path: '/admin/categories',
      show: true,
    },
    {
      icon: 'fas fa-edit',
      label: 'Page Content',
      path: '/admin/page-content',
      show: true,
    },
    {
      icon: 'fas fa-envelope',
      label: 'Messages',
      path: '/admin/messages',
      show: true,
    },
    {
      icon: 'fas fa-users',
      label: 'Users',
      path: '/admin/users',
      show: isAdmin,
    },
    {
      icon: 'fas fa-building',
      label: 'Branches',
      path: '/admin/branches',
      show: isAdmin,
    },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <button
        className="mobile-sidebar-toggle"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <i className="fas fa-bars"></i>
      </button>

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/admin/dashboard" className="sidebar-logo" onClick={() => window.innerWidth <= 1024 && setMobileSidebarOpen(false)}>
            <img src="/assets/images/Logo_SVG.png" alt="OrthoHouse" />
            {sidebarOpen && <span>Admin Panel</span>}
          </Link>
          <button
            className="sidebar-toggle"
            onClick={() => {
              setSidebarOpen(!sidebarOpen)
              if (window.innerWidth <= 1024) {
                setMobileSidebarOpen(false)
              }
            }}
            aria-label="Toggle sidebar"
          >
            <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems
            .filter(item => item.show)
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${
                  location.pathname.startsWith(item.path) ? 'active' : ''
                }`}
                onClick={() => window.innerWidth <= 1024 && setMobileSidebarOpen(false)}
              >
                <i className={item.icon}></i>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              <i className="fas fa-user"></i>
            </div>
            {sidebarOpen && (
              <div className="user-info">
                <div className="user-name">
                  {appUser.first_name} {appUser.last_name}
                </div>
                <div className="user-role">
                  {isAdmin ? 'Administrator' : 'Branch Manager'}
                </div>
              </div>
            )}
          </div>
          <button className="sidebar-logout" onClick={handleSignOut}>
            <i className="fas fa-sign-out-alt"></i>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content" style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout

