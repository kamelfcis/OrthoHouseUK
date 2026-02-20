import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import './PageContent.css'

const PageContent = () => {
  const { appUser, isBranchManager } = useAuth()
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Track if data has been loaded to prevent refetching on tab switch
  const hasLoadedRef = useRef(false)
  const [showModal, setShowModal] = useState(false)
  const [editingContent, setEditingContent] = useState(null)
  const [sections, setSections] = useState([])
  const [branches, setBranches] = useState([])
  const [formData, setFormData] = useState({
    branch_id: '',
    section_id: '',
    content_title: '',
    content_text: '',
    content_image: '',
    is_public: true,
    is_active: true,
  })

  useEffect(() => {
    if (appUser) {
      // Only fetch if we haven't loaded data yet (avoid refetching on tab switch)
      if (!hasLoadedRef.current && contents.length === 0) {
        fetchContents()
      } else if (hasLoadedRef.current || contents.length > 0) {
        // We already have contents, just ensure loading is false
        setLoading(false)
      }
      
      // Fetch other data - only if empty
      if (sections.length === 0) {
        fetchSections()
      }
      if (branches.length === 0) {
        fetchBranches()
      }
    } else {
      setLoading(false)
      hasLoadedRef.current = false // Reset when user logs out
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser])

  const fetchContents = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('branch_page_content')
        .select('*, branches(branch_code, branch_name), page_sections(section_name, section_title)')
        .order('branch_id')

      if (isBranchManager && appUser?.branch_id) {
        query = query.eq('branch_id', appUser.branch_id)
      }

      const { data, error } = await query
      if (error) throw error
      setContents(data || [])
      hasLoadedRef.current = true // Mark as loaded successfully
    } catch (error) {
      toast.error('Error fetching page content: ' + error.message)
      hasLoadedRef.current = false // Reset on error so user can retry
    } finally {
      setLoading(false)
    }
  }

  const fetchSections = async () => {
    try {
      const { data } = await supabase
        .from('page_sections')
        .select('*')
        .eq('is_active', true)
        .order('section_order')
      setSections(data || [])
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  const fetchBranches = async () => {
    try {
      const { data } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
      setBranches(data || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const contentData = {
        ...formData,
        branch_id: isBranchManager ? appUser.branch_id : parseInt(formData.branch_id),
        section_id: parseInt(formData.section_id),
      }

      if (editingContent) {
        const { error } = await supabase
          .from('branch_page_content')
          .update(contentData)
          .eq('content_id', editingContent.content_id)

        if (error) throw error
        toast.success('Page content updated successfully')
      } else {
        const { error } = await supabase
          .from('branch_page_content')
          .insert(contentData)

        if (error) throw error
        toast.success('Page content created successfully')
      }

      setShowModal(false)
      setEditingContent(null)
      setFormData({
        branch_id: '',
        section_id: '',
        content_title: '',
        content_text: '',
        content_image: '',
        is_public: true,
        is_active: true,
      })
      fetchContents()
    } catch (error) {
      toast.error('Error saving page content: ' + error.message)
    }
  }

  if (loading) return <div className="admin-loading">Loading page content...</div>

  return (
    <div className="admin-page-content">
      {/* Add Content Button */}
      <div className="filters-section" style={{ marginBottom: '24px' }}>
        <div className="filters-grid" style={{ justifyContent: 'flex-end' }}>
          <div className="filter-group">
            <button className="lte-btn" onClick={() => {
              setEditingContent(null)
              setFormData({
                branch_id: appUser?.branch_id || '',
                section_id: '',
                content_title: '',
                content_text: '',
                content_image: '',
                is_public: true,
                is_active: true,
              })
              setShowModal(true)
            }}>
              <i className="fas fa-plus"></i> Add Content
            </button>
          </div>
        </div>
      </div>

      <div className="page-content-grid">
        {contents.map((content) => (
          <div key={content.content_id} className="content-card">
            <div className="content-card-header">
              <div>
                <h3>{content.page_sections?.section_name || 'N/A'}</h3>
                <p>{content.branches?.branch_name || 'N/A'}</p>
              </div>
              <span className={`status-badge ${content.is_active ? 'active' : 'inactive'}`}>
                {content.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="content-card-body">
              <h4>{content.content_title || 'No Title'}</h4>
              <p className="content-preview">{content.content_text?.substring(0, 150) || 'No content'}...</p>
            </div>
            <div className="content-card-actions">
              <button
                className="action-btn edit"
                onClick={() => {
                  setEditingContent(content)
                  setFormData({
                    branch_id: content.branch_id,
                    section_id: content.section_id,
                    content_title: content.content_title || '',
                    content_text: content.content_text || '',
                    content_image: content.content_image || '',
                    is_public: content.is_public,
                    is_active: content.is_active,
                  })
                  setShowModal(true)
                }}
              >
                <i className="fas fa-edit"></i> Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingContent ? 'Edit Page Content' : 'Add New Page Content'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {!isBranchManager && (
                <div className="form-group">
                  <label>Branch *</label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Page Section *</label>
                <select
                  value={formData.section_id}
                  onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                  required
                >
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section.section_id} value={section.section_id}>
                      {section.section_name} - {section.section_title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Content Title</label>
                <input
                  type="text"
                  value={formData.content_title}
                  onChange={(e) => setFormData({ ...formData, content_title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Content Text</label>
                <textarea
                  value={formData.content_text}
                  onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                  rows="6"
                />
              </div>

              <div className="form-group">
                <label>Content Image URL (Storage path)</label>
                <input
                  type="text"
                  value={formData.content_image}
                  onChange={(e) => setFormData({ ...formData, content_image: e.target.value })}
                  placeholder="page-content-images/hero-image.jpg"
                />
              </div>

              <div className="form-row">
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
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="lte-btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="lte-btn">
                  {editingContent ? 'Update' : 'Create'} Content
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PageContent

