import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const Dashboard = () => {
  const { appUser, isAdmin, isBranchManager } = useAuth()
  const navigate = useNavigate()
  
  // Track if data has been loaded to prevent refetching on tab switch
  const hasLoadedRef = useRef(false)
  
  const [stats, setStats] = useState({
    products: 0,
    activeProducts: 0,
    blogs: 0,
    publishedBlogs: 0,
    partners: 0,
    categories: 0,
    messages: 0,
    newMessages: 0,
    users: 0,
    branches: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!appUser) {
      navigate('/admin/login')
      return
    }

    // Only fetch if we haven't loaded data yet (avoid refetching on tab switch)
    if (!hasLoadedRef.current) {
      fetchStats()
    } else {
      // We already have stats, just ensure loading is false
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, navigate])

  const fetchStats = async () => {
    try {
      const branchId = isBranchManager ? appUser.branch_id : null

      // Fetch total products count
      let productsQuery = supabase
        .from('branch_products')
        .select('branch_product_id', { count: 'exact', head: true })
      
      if (branchId) {
        productsQuery = productsQuery.eq('branch_id', branchId)
      }

      const { count: productsCount } = await productsQuery

      // Fetch active products count - get all products and filter
      let activeProductsQuery = supabase
        .from('branch_products')
        .select('products(is_active)')
      
      if (branchId) {
        activeProductsQuery = activeProductsQuery.eq('branch_id', branchId)
      }

      const { data: activeProductsData } = await activeProductsQuery
      
      // Calculate active products by filtering
      const activeCount = activeProductsData?.filter(item => item.products?.is_active === true).length || 0

      // Fetch total blogs count
      let blogsQuery = supabase
        .from('blogs')
        .select('blog_id', { count: 'exact', head: true })
      
      if (branchId) {
        blogsQuery = blogsQuery.eq('branch_id', branchId)
      }

      const { count: blogsCount } = await blogsQuery

      // Fetch published blogs count
      let publishedBlogsQuery = supabase
        .from('blogs')
        .select('blog_id', { count: 'exact', head: true })
        .eq('status', 'published')
      
      if (branchId) {
        publishedBlogsQuery = publishedBlogsQuery.eq('branch_id', branchId)
      }

      const { count: publishedBlogsCount } = await publishedBlogsQuery

      // Fetch partners count
      let partnersQuery = supabase
        .from('partners')
        .select('partner_id', { count: 'exact', head: true })
        .eq('is_active', true)

      if (branchId) {
        // For branch managers, count partners linked to their branch
        const { count: branchPartnersCount } = await supabase
          .from('branch_partners')
          .select('branch_partner_id', { count: 'exact', head: true })
          .eq('branch_id', branchId)
          .eq('is_active', true)
        
        setStats(prev => ({ ...prev, partners: branchPartnersCount || 0 }))
      } else {
        const { count: partnersCount } = await partnersQuery
        setStats(prev => ({ ...prev, partners: partnersCount || 0 }))
      }

      // Fetch categories count
      const { count: categoriesCount } = await supabase
        .from('product_categories')
        .select('category_id', { count: 'exact', head: true })
        .eq('is_active', true)

      // Fetch total messages count
      let messagesQuery = supabase
        .from('contact_messages')
        .select('message_id', { count: 'exact', head: true })

      if (branchId) {
        messagesQuery = messagesQuery.eq('branch_id', branchId)
      }

      const { count: messagesCount } = await messagesQuery

      // Fetch new messages count
      let newMessagesQuery = supabase
        .from('contact_messages')
        .select('message_id', { count: 'exact', head: true })
        .eq('status', 'new')

      if (branchId) {
        newMessagesQuery = newMessagesQuery.eq('branch_id', branchId)
      }

      const { count: newMessagesCount } = await newMessagesQuery

      // Fetch users count (admin only)
      let usersCount = 0
      if (isAdmin) {
        const { count } = await supabase
          .from('app_users')
          .select('user_id', { count: 'exact', head: true })
          .eq('is_active', true)
        usersCount = count || 0
      }

      // Fetch branches count (admin only)
      let branchesCount = 0
      if (isAdmin) {
        const { count } = await supabase
          .from('branches')
          .select('branch_id', { count: 'exact', head: true })
          .eq('is_active', true)
        branchesCount = count || 0
      }

      setStats({
        products: productsCount || 0,
        activeProducts: activeCount,
        blogs: blogsCount || 0,
        publishedBlogs: publishedBlogsCount || 0,
        categories: categoriesCount || 0,
        messages: messagesCount || 0,
        newMessages: newMessagesCount || 0,
        users: usersCount,
        branches: branchesCount,
      })
      hasLoadedRef.current = true // Mark as loaded successfully
    } catch (error) {
      console.error('Error fetching stats:', error)
      hasLoadedRef.current = false // Reset on error so user can retry
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h2>Loading dashboard...</h2>
          <p>Please wait while we fetch your statistics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {appUser?.first_name} {appUser?.last_name}</p>
        </div>
        <div className="user-badge">
          <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-manager'}`}>
            {isAdmin ? 'Admin' : 'Branch Manager'}
          </span>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon bg-gradient-brand">
            <i className="fas fa-box"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.products}</h3>
            <p>Total Products</p>
            <span className="stat-subtitle">{stats.activeProducts} Active</span>
          </div>
          <button
            className="stat-action"
            onClick={() => navigate('/admin/products')}
            title="View Products"
          >
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-gradient-brand-reverse">
            <i className="fas fa-newspaper"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.blogs}</h3>
            <p>Blog Posts</p>
            <span className="stat-subtitle">{stats.publishedBlogs} Published</span>
          </div>
          <button
            className="stat-action"
            onClick={() => navigate('/admin/blogs')}
            title="View Blogs"
          >
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-gradient-brand-horizontal">
            <i className="fas fa-handshake"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.partners}</h3>
            <p>Partners</p>
          </div>
          <button
            className="stat-action"
            onClick={() => navigate('/admin/partners')}
            title="View Partners"
          >
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}>
            <i className="fas fa-tags"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.categories}</h3>
            <p>Categories</p>
          </div>
          <button
            className="stat-action"
            onClick={() => navigate('/admin/categories')}
            title="View Categories"
          >
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #c3161b 0%, #e63946 100%)' }}>
            <i className="fas fa-envelope"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.newMessages}</h3>
            <p>New Messages</p>
            <span className="stat-subtitle">{stats.messages} Total</span>
          </div>
          <button
            className="stat-action"
            onClick={() => navigate('/admin/messages')}
            title="View Messages"
          >
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>

        {isAdmin && (
          <>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' }}>
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>{stats.users}</h3>
                <p>Users</p>
              </div>
              <button
                className="stat-action"
                onClick={() => navigate('/admin/users')}
                title="View Users"
              >
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
                <i className="fas fa-building"></i>
              </div>
              <div className="stat-content">
                <h3>{stats.branches}</h3>
                <p>Branches</p>
              </div>
              <button
                className="stat-action"
                onClick={() => navigate('/admin/branches')}
                title="View Branches"
              >
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-quick-actions">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <button
            className="quick-action-btn"
            onClick={() => navigate('/admin/products')}
          >
            <i className="fas fa-box"></i>
            <span>Manage Products</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate('/admin/blogs')}
          >
            <i className="fas fa-newspaper"></i>
            <span>Manage Blogs</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate('/admin/partners')}
          >
            <i className="fas fa-handshake"></i>
            <span>Manage Partners</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate('/admin/categories')}
          >
            <i className="fas fa-tags"></i>
            <span>Manage Categories</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate('/admin/messages')}
          >
            <i className="fas fa-envelope"></i>
            <span>View Messages</span>
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate('/admin/page-content')}
          >
            <i className="fas fa-edit"></i>
            <span>Edit Page Content</span>
          </button>
          {isAdmin && (
            <>
              <button
                className="quick-action-btn"
                onClick={() => navigate('/admin/users')}
              >
                <i className="fas fa-users"></i>
                <span>Manage Users</span>
              </button>
              <button
                className="quick-action-btn"
                onClick={() => navigate('/admin/branches')}
              >
                <i className="fas fa-building"></i>
                <span>Manage Branches</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

