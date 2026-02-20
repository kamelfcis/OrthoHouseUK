import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import './Blogs.css'

const Blogs = () => {
  const { appUser, isBranchManager, isAdmin } = useAuth()
  const [blogs, setBlogs] = useState([])
  const [filteredBlogs, setFilteredBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Track if data has been loaded to prevent refetching on tab switch
  const hasLoadedRef = useRef(false)
  const [showModal, setShowModal] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [filters, setFilters] = useState({
    branch_id: '',
    status: 'all',
    search: '',
  })
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    branch_id: '',
    status: 'draft',
    is_public: true,
  })
  const [branches, setBranches] = useState([])

  useEffect(() => {
    if (appUser) {
      // Only fetch if we haven't loaded data yet (avoid refetching on tab switch)
      if (!hasLoadedRef.current && blogs.length === 0) {
        fetchBlogs()
      } else if (hasLoadedRef.current || blogs.length > 0) {
        // We already have blogs, just ensure loading is false
        setLoading(false)
      }
      
      // Fetch branches - only if empty
      if (branches.length === 0) {
        fetchBranches()
      }
    } else {
      setLoading(false)
      hasLoadedRef.current = false // Reset when user logs out
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('blogs')
        .select('*, branches(branch_code, branch_name)')
        .order('created_at', { ascending: false })

      if (isBranchManager && appUser?.branch_id) {
        query = query.eq('branch_id', appUser.branch_id)
      }

      const { data, error } = await query
      if (error) throw error
      setBlogs(data || [])
      hasLoadedRef.current = true // Mark as loaded successfully
    } catch (error) {
      toast.error('Error fetching blogs: ' + error.message)
      hasLoadedRef.current = false // Reset on error so user can retry
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (blogs.length > 0) {
      applyFilters()
    } else {
      setFilteredBlogs([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogs, filters])

  const applyFilters = () => {
    if (!blogs || blogs.length === 0) {
      setFilteredBlogs([])
      return
    }

    try {
      let filtered = [...blogs]

      if (filters.branch_id) {
        filtered = filtered.filter(b => b.branch_id === parseInt(filters.branch_id))
      }

      if (filters.status !== 'all') {
        filtered = filtered.filter(b => b.status === filters.status)
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(b =>
          b.title?.toLowerCase().includes(searchLower) ||
          b.excerpt?.toLowerCase().includes(searchLower) ||
          b.content?.toLowerCase().includes(searchLower)
        )
      }

      setFilteredBlogs(filtered)
    } catch (error) {
      console.error('Error applying filters:', error)
      setFilteredBlogs(blogs)
    }
  }

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('branch_name')
      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, WebP, or GIF images.')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5242880) {
      toast.error('File size too large. Maximum size is 5MB.')
      return
    }

    setUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `blog-images/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Update form data with the image URL
      setFormData({ ...formData, featured_image: filePath })
      toast.success('Featured image uploaded successfully')
    } catch (error) {
      toast.error('Error uploading image: ' + error.message)
    } finally {
      setUploading(false)
      e.target.value = '' // Reset input
    }
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    // Get project ref from Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ljfkmtuxqaznnmmxeydf.supabase.co'
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
    return `https://${projectRef}.supabase.co/storage/v1/object/public/blog-images/${imagePath}`
  }

  const handleDelete = async (blogId) => {
    if (!confirm('Are you sure you want to delete this blog post? This will also delete the featured image.')) return

    try {
      // Get blog to delete featured image
      const blog = blogs.find(b => b.blog_id === blogId)

      // Delete featured image from storage if exists
      if (blog?.featured_image) {
        try {
          await supabase.storage
            .from('blog-images')
            .remove([blog.featured_image])
        } catch (imageError) {
          console.error('Error deleting featured image:', imageError)
        }
      }

      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('blog_id', blogId)

      if (error) throw error
      toast.success('Blog post deleted successfully')
      fetchBlogs()
    } catch (error) {
      toast.error('Error deleting blog: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Determine published_at
      let published_at = null
      if (formData.status === 'published') {
        if (editingBlog && editingBlog.published_at) {
          // Keep existing published_at if already published
          published_at = editingBlog.published_at
        } else {
          // Set new published_at if publishing for the first time
          published_at = new Date().toISOString()
        }
      }

      const blogData = {
        ...formData,
        branch_id: isBranchManager ? appUser.branch_id : parseInt(formData.branch_id),
        author_id: appUser.user_id,
        published_at: published_at,
      }
      
      // Ensure branch_id is a number
      if (typeof blogData.branch_id === 'string') {
        blogData.branch_id = parseInt(blogData.branch_id)
      }

      if (editingBlog) {
        // If featured image changed, delete old image from storage
        if (editingBlog.featured_image && editingBlog.featured_image !== formData.featured_image) {
          try {
            await supabase.storage
              .from('blog-images')
              .remove([editingBlog.featured_image])
          } catch (imageError) {
            console.error('Error deleting old featured image:', imageError)
          }
        }

        const { error } = await supabase
          .from('blogs')
          .update(blogData)
          .eq('blog_id', editingBlog.blog_id)

        if (error) throw error
        toast.success('Blog post updated successfully')
      } else {
        const { error } = await supabase
          .from('blogs')
          .insert(blogData)

        if (error) throw error
        toast.success('Blog post created successfully')
      }

      setShowModal(false)
      setEditingBlog(null)
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        featured_image: '',
        branch_id: isBranchManager ? (appUser?.branch_id || '') : '',
        status: 'draft',
        is_public: true,
      })
      fetchBlogs()
    } catch (error) {
      toast.error('Error saving blog: ' + error.message)
    }
  }

  if (loading) return <div className="admin-loading">Loading blogs...</div>

  return (
    <div className="admin-blogs">
      {/* Filters Section */}
      {isAdmin && (
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group search-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search blogs..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <label>Branch</label>
              <select
                value={filters.branch_id}
                onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="filter-group filter-group-button">
              <button
                className="lte-btn btn-outline"
                onClick={() => setFilters({
                  branch_id: '',
                  status: 'all',
                  search: '',
                })}
              >
                <i className="fas fa-times-circle"></i> Clear Filters
              </button>
            </div>
            <div className="filter-group">
              <button className="lte-btn" onClick={() => {
                setEditingBlog(null)
                setFormData({
                  title: '',
                  content: '',
                  excerpt: '',
                  featured_image: '',
                  branch_id: isBranchManager ? (appUser?.branch_id || '') : '',
                  status: 'draft',
                  is_public: true,
                })
                setShowModal(true)
              }}>
                <i className="fas fa-plus"></i> Add Blog Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Blog Post Button for Branch Managers */}
      {!isAdmin && (
        <div className="filters-section" style={{ marginBottom: '24px' }}>
          <div className="filters-grid" style={{ justifyContent: 'flex-end' }}>
            <div className="filter-group">
              <button className="lte-btn" onClick={() => {
                setEditingBlog(null)
                setFormData({
                  title: '',
                  content: '',
                  excerpt: '',
                  featured_image: '',
                  branch_id: isBranchManager ? (appUser?.branch_id || '') : '',
                  status: 'draft',
                  is_public: true,
                })
                setShowModal(true)
              }}>
                <i className="fas fa-plus"></i> Add Blog Post
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="blogs-table-container">
        {filteredBlogs.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-blog"></i>
            <h3>No blog posts found</h3>
            <p>
              {blogs.length === 0
                ? 'Get started by adding your first blog post'
                : 'No blog posts match your current filters. Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Featured Image</th>
                <th>Title</th>
                {isAdmin && <th>Branch</th>}
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.map((blog) => (
                <tr key={blog.blog_id}>
                  <td>
                    <div className="blog-image-cell">
                      {blog.featured_image ? (
                        <img
                          src={getImageUrl(blog.featured_image)}
                          alt={blog.title}
                          className="blog-thumbnail"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex'
                            }
                          }}
                        />
                      ) : null}
                      <div className="no-image-placeholder" style={{ display: blog.featured_image ? 'none' : 'flex' }}>
                        <i className="fas fa-image"></i>
                      </div>
                    </div>
                  </td>
                  <td>{blog.title}</td>
                  {isAdmin && <td>{blog.branches?.branch_code || 'N/A'}</td>}
                  <td>
                    <span className={`status-badge ${blog.status}`}>
                      {blog.status}
                    </span>
                  </td>
                  <td>{new Date(blog.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-btn edit"
                        onClick={() => {
                          setEditingBlog(blog)
                          setFormData({
                            title: blog.title,
                            content: blog.content,
                            excerpt: blog.excerpt || '',
                            featured_image: blog.featured_image || '',
                            branch_id: blog.branch_id,
                            status: blog.status,
                            is_public: blog.is_public,
                          })
                          // Fetch branches if admin and not already loaded
                          if (isAdmin && branches.length === 0) {
                            fetchBranches()
                          }
                          setShowModal(true)
                        }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(blog.blog_id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBlog ? 'Edit Blog Post' : 'Add New Blog Post'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Branch Selection for Admin - Only when creating new blog */}
              {isAdmin && !editingBlog && (
                <div className="form-group">
                  <label>Branch *</label>
                  <select
                    value={formData.branch_id || ''}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name} ({branch.branch_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Branch Selection for Admin when editing - can change branch */}
              {isAdmin && editingBlog && (
                <div className="form-group">
                  <label>Branch *</label>
                  <select
                    value={formData.branch_id || ''}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name} ({branch.branch_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Branch display for Branch Managers (read-only) */}
              {isBranchManager && (
                <div className="form-group">
                  <label>Branch</label>
                  <input
                    type="text"
                    value={branches.find(b => b.branch_id === appUser?.branch_id)?.branch_name || 'N/A'}
                    disabled
                    style={{
                      padding: '12px 15px',
                      border: '2px solid var(--gray-border)',
                      borderRadius: '10px',
                      background: 'var(--gray)',
                      color: 'var(--black)',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows="3"
                />
              </div>

              {/* Featured Image Upload Section */}
              <div className="form-group">
                <label>Featured Image</label>
                <div className="image-upload-section">
                  <input
                    type="file"
                    id="featured-image-upload"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                  <label htmlFor="featured-image-upload" className="upload-button">
                    {uploading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                    ) : (
                      <><i className="fas fa-upload"></i> Upload Featured Image</>
                    )}
                  </label>

                  {formData.featured_image && (
                    <div className="featured-image-preview" style={{ marginTop: '16px' }}>
                      <div className="image-preview-card">
                        <img
                          src={getImageUrl(formData.featured_image)}
                          alt="Featured image preview"
                          className="preview-image"
                        />
                        <button
                          type="button"
                          className="image-action-btn delete"
                          onClick={() => {
                            // Delete from storage
                            if (formData.featured_image) {
                              supabase.storage
                                .from('blog-images')
                                .remove([formData.featured_image])
                                .catch(err => console.error('Error deleting image:', err))
                            }
                            setFormData({ ...formData, featured_image: '' })
                          }}
                          title="Remove image"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="10"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    />
                    <span>Public</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="lte-btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="lte-btn"
                  disabled={isAdmin && !editingBlog && !formData.branch_id}
                >
                  {editingBlog ? 'Update' : 'Create'} Blog Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Blogs

