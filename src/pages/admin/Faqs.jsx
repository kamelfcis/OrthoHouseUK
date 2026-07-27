import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { invalidatePublicCache } from '../../lib/invalidatePublicCache'
import { FAQ_CATEGORIES, faqCategoryShortTitle } from '../../content/faqs'
import toast from 'react-hot-toast'
import './Faqs.css'

const emptyForm = {
  category: 'mirai_shoulder',
  question: '',
  answer: '',
  answer_image_url: '',
  display_order: 0,
  is_published: true,
  branch_id: ''
}

const AdminFaqs = () => {
  const { appUser, isBranchManager, isAdmin } = useAuth()
  const hasLoadedRef = useRef(false)
  const [faqs, setFaqs] = useState([])
  const [filteredFaqs, setFilteredFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingFaq, setEditingFaq] = useState(null)
  const [branches, setBranches] = useState([])
  const [filters, setFilters] = useState({
    branch_id: '',
    category: 'all',
    published: 'all',
    search: ''
  })
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    if (!appUser) {
      setLoading(false)
      hasLoadedRef.current = false
      return
    }

    if (!hasLoadedRef.current && faqs.length === 0) {
      fetchFaqs()
    } else if (hasLoadedRef.current || faqs.length > 0) {
      setLoading(false)
    }

    if (branches.length === 0) {
      fetchBranches()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faqs, filters])

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('branch_id, branch_name, branch_code')
        .eq('is_active', true)
        .order('branch_name')
      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchFaqs = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('faqs')
        .select('*, branches(branch_code, branch_name)')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true })

      if (isBranchManager && appUser?.branch_id) {
        query = query.eq('branch_id', appUser.branch_id)
      }

      const { data, error } = await query
      if (error) throw error
      setFaqs(data || [])
      hasLoadedRef.current = true
    } catch (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        toast.error('FAQs table not found. Run the Supabase migration first.')
      } else {
        toast.error('Error fetching FAQs: ' + error.message)
      }
      hasLoadedRef.current = false
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...faqs]

    if (filters.branch_id) {
      filtered = filtered.filter((f) => f.branch_id === parseInt(filters.branch_id, 10))
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter((f) => f.category === filters.category)
    }

    if (filters.published === 'published') {
      filtered = filtered.filter((f) => f.is_published)
    } else if (filters.published === 'unpublished') {
      filtered = filtered.filter((f) => !f.is_published)
    }

    if (filters.search) {
      const q = filters.search.toLowerCase()
      filtered = filtered.filter(
        (f) =>
          f.question?.toLowerCase().includes(q) ||
          f.answer?.toLowerCase().includes(q)
      )
    }

    filtered.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category)
      return (a.display_order ?? 0) - (b.display_order ?? 0)
    })

    setFilteredFaqs(filtered)
  }

  const openCreate = () => {
    setEditingFaq(null)
    setFormData({
      ...emptyForm,
      branch_id: isBranchManager ? String(appUser?.branch_id || '') : '',
      display_order: faqs.length
    })
    setShowModal(true)
  }

  const openEdit = (faq) => {
    setEditingFaq(faq)
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      answer_image_url: faq.answer_image_url || '',
      display_order: faq.display_order ?? 0,
      is_published: Boolean(faq.is_published),
      branch_id: String(faq.branch_id)
    })
    if (isAdmin && branches.length === 0) fetchBranches()
    setShowModal(true)
  }

  const handleDelete = async (faqId) => {
    if (!confirm('Delete this FAQ? This cannot be undone.')) return

    try {
      const { error } = await supabase.from('faqs').delete().eq('faq_id', faqId)
      if (error) throw error
      toast.success('FAQ deleted')
      invalidatePublicCache('UK')
      hasLoadedRef.current = false
      await fetchFaqs()
    } catch (error) {
      toast.error('Error deleting FAQ: ' + error.message)
    }
  }

  const handleReorder = async (faq, direction) => {
    const sameCategory = faqs
      .filter((f) => f.category === faq.category && f.branch_id === faq.branch_id)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

    const index = sameCategory.findIndex((f) => f.faq_id === faq.faq_id)
    const swapWith = sameCategory[index + direction]
    if (!swapWith) return

    try {
      const updates = [
        { faq_id: faq.faq_id, display_order: swapWith.display_order },
        { faq_id: swapWith.faq_id, display_order: faq.display_order }
      ]

      for (const row of updates) {
        const { error } = await supabase
          .from('faqs')
          .update({ display_order: row.display_order })
          .eq('faq_id', row.faq_id)
        if (error) throw error
      }

      toast.success('Order updated')
      invalidatePublicCache('UK')
      hasLoadedRef.current = false
      await fetchFaqs()
    } catch (error) {
      toast.error('Error reordering: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Question and answer are required.')
      return
    }

    const branchId = isBranchManager
      ? appUser.branch_id
      : parseInt(formData.branch_id, 10)

    if (!branchId) {
      toast.error('Select a branch.')
      return
    }

    const payload = {
      branch_id: branchId,
      category: formData.category,
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      answer_image_url: formData.answer_image_url.trim() || null,
      display_order: parseInt(formData.display_order, 10) || 0,
      is_published: Boolean(formData.is_published)
    }

    try {
      setSaving(true)
      if (editingFaq) {
        const { error } = await supabase
          .from('faqs')
          .update(payload)
          .eq('faq_id', editingFaq.faq_id)
        if (error) throw error
        toast.success('FAQ updated')
      } else {
        const { error } = await supabase.from('faqs').insert(payload)
        if (error) throw error
        toast.success('FAQ created')
      }

      invalidatePublicCache('UK')
      setShowModal(false)
      setEditingFaq(null)
      setFormData(emptyForm)
      hasLoadedRef.current = false
      await fetchFaqs()
    } catch (error) {
      toast.error('Error saving FAQ: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading">Loading FAQs...</div>

  return (
    <div className="admin-faqs">
      <div className="faqs-admin-header">
        <div>
          <h1>FAQs</h1>
          <p>Manage public frequently asked questions by category and display order.</p>
        </div>
        <button type="button" className="lte-btn" onClick={openCreate}>
          <i className="fas fa-plus"></i> Add FAQ
        </button>
      </div>

      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group search-group">
            <label htmlFor="faq-search">Search</label>
            <input
              id="faq-search"
              type="text"
              placeholder="Search questions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {isAdmin && (
            <div className="filter-group">
              <label htmlFor="faq-filter-branch">Branch</label>
              <select
                id="faq-filter-branch"
                value={filters.branch_id}
                onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label htmlFor="faq-filter-category">Category</label>
            <select
              id="faq-filter-category"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="all">All</option>
              {FAQ_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="faq-filter-published">Visibility</label>
            <select
              id="faq-filter-published"
              value={filters.published}
              onChange={(e) => setFilters({ ...filters, published: e.target.value })}
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>

          <div className="filter-group filter-group-button">
            <button
              type="button"
              className="lte-btn btn-outline"
              onClick={() =>
                setFilters({ branch_id: '', category: 'all', published: 'all', search: '' })
              }
            >
              <i className="fas fa-times-circle"></i> Clear
            </button>
          </div>
        </div>
      </div>

      <div className="faqs-table-container">
        {filteredFaqs.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-circle-question"></i>
            <h3>No FAQs found</h3>
            <p>
              {faqs.length === 0
                ? 'Add your first FAQ, or run the Supabase migration to seed UK defaults.'
                : 'No FAQs match your current filters.'}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Category</th>
                <th>Question</th>
                {isAdmin && <th>Branch</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaqs.map((faq) => (
                <tr key={faq.faq_id}>
                  <td>
                    <div className="order-controls">
                      <button
                        type="button"
                        className="action-btn"
                        title="Move up"
                        onClick={() => handleReorder(faq, -1)}
                      >
                        <i className="fas fa-arrow-up"></i>
                      </button>
                      <span className="order-value">{faq.display_order}</span>
                      <button
                        type="button"
                        className="action-btn"
                        title="Move down"
                        onClick={() => handleReorder(faq, 1)}
                      >
                        <i className="fas fa-arrow-down"></i>
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={`category-badge category-badge--${faq.category}`}>
                      {faqCategoryShortTitle(faq.category)}
                    </span>
                  </td>
                  <td className="faq-question-cell">
                    <strong>{faq.question}</strong>
                    <span className="faq-answer-preview">{faq.answer}</span>
                  </td>
                  {isAdmin && <td>{faq.branches?.branch_code || 'N/A'}</td>}
                  <td>
                    <span className={`status-badge ${faq.is_published ? 'published' : 'draft'}`}>
                      {faq.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="action-btn edit"
                        onClick={() => openEdit(faq)}
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        type="button"
                        className="action-btn delete"
                        onClick={() => handleDelete(faq.faq_id)}
                        title="Delete"
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
              <h2>{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h2>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {isAdmin && (
                <div className="form-group">
                  <label htmlFor="faq-branch">Branch *</label>
                  <select
                    id="faq-branch"
                    value={formData.branch_id}
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

              {isBranchManager && (
                <div className="form-group">
                  <label>Branch</label>
                  <input
                    type="text"
                    value={
                      branches.find((b) => b.branch_id === appUser?.branch_id)?.branch_name ||
                      'N/A'
                    }
                    disabled
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="faq-category">Category *</label>
                  <select
                    id="faq-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    {FAQ_CATEGORIES.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="faq-order">Display order</label>
                  <input
                    id="faq-order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="faq-question">Question *</label>
                <input
                  id="faq-question"
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="faq-answer">Answer *</label>
                <textarea
                  id="faq-answer"
                  rows="6"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="faq-answer-image">Answer image URL</label>
                <input
                  id="faq-answer-image"
                  type="text"
                  placeholder="/assets/faqs/... or https://..."
                  value={formData.answer_image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, answer_image_url: e.target.value })
                  }
                />
                <span className="form-hint">
                  Optional. Shown under the answer on the public FAQs page.
                </span>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) =>
                      setFormData({ ...formData, is_published: e.target.checked })
                    }
                  />
                  <span>Published</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="lte-btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lte-btn"
                  disabled={saving || (isAdmin && !editingFaq && !formData.branch_id)}
                >
                  {saving ? 'Saving...' : editingFaq ? 'Update FAQ' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminFaqs
