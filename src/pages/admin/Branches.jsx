import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import './Branches.css'

const Branches = () => {
  const { appUser } = useAuth()
  const [branches, setBranches] = useState([])
  const [filteredBranches, setFilteredBranches] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Track if data has been loaded to prevent refetching on tab switch
  const hasLoadedRef = useRef(false)
  const [showModal, setShowModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  })

  const [formData, setFormData] = useState({
    branch_code: '',
    branch_name: '',
    country_code: '',
    currency: '',
    timezone: '',
    is_active: true,
  })

  useEffect(() => {
    if (appUser) {
      // Only fetch if we haven't loaded data yet (avoid refetching on tab switch)
      if (!hasLoadedRef.current && branches.length === 0) {
        fetchBranches()
      } else if (hasLoadedRef.current || branches.length > 0) {
        // We already have branches, just ensure loading is false
        setLoading(false)
      }
    } else {
      setLoading(false)
      hasLoadedRef.current = false // Reset when user logs out
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser])

  useEffect(() => {
    if (branches.length > 0) {
      applyFilters()
    } else {
      setFilteredBranches([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, filters])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('branch_name')

      if (error) throw error
      setBranches(data || [])
      hasLoadedRef.current = true // Mark as loaded successfully
    } catch (error) {
      toast.error('Error fetching branches: ' + error.message)
      hasLoadedRef.current = false // Reset on error so user can retry
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    if (!branches || branches.length === 0) {
      setFilteredBranches([])
      return
    }

    try {
      let filtered = [...branches]

      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(b =>
          b.branch_name?.toLowerCase().includes(searchLower) ||
          b.branch_code?.toLowerCase().includes(searchLower) ||
          b.country_code?.toLowerCase().includes(searchLower)
        )
      }

      if (filters.status !== 'all') {
        filtered = filtered.filter(b =>
          filters.status === 'active' ? b.is_active : !b.is_active
        )
      }

      setFilteredBranches(filtered)
    } catch (error) {
      console.error('Error applying filters:', error)
      setFilteredBranches(branches)
    }
  }

  const handleDelete = async (branchId) => {
    if (!confirm('Are you sure you want to delete this branch? This will also delete all associated data.')) return

    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('branch_id', branchId)

      if (error) throw error
      toast.success('Branch deleted successfully')
      fetchBranches()
    } catch (error) {
      toast.error('Error deleting branch: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingBranch) {
        const { error } = await supabase
          .from('branches')
          .update(formData)
          .eq('branch_id', editingBranch.branch_id)

        if (error) throw error
        toast.success('Branch updated successfully')
      } else {
        const { error } = await supabase
          .from('branches')
          .insert(formData)

        if (error) throw error
        toast.success('Branch created successfully')
      }

      setShowModal(false)
      setEditingBranch(null)
      setFormData({
        branch_code: '',
        branch_name: '',
        country_code: '',
        currency: '',
        timezone: '',
        is_active: true,
      })
      fetchBranches()
    } catch (error) {
      toast.error('Error saving branch: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="admin-branches">
        <div className="admin-loading">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h2>Loading branches...</h2>
          <p>Please wait while we fetch your branches.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-branches">
      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group search-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search branches..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="filter-group filter-group-button">
            <button
              className="lte-btn btn-outline"
              onClick={() => setFilters({
                search: '',
                status: 'all',
              })}
            >
              <i className="fas fa-times-circle"></i> Clear Filters
            </button>
          </div>
          <div className="filter-group">
            <button className="lte-btn" onClick={() => {
              setEditingBranch(null)
              setFormData({
                branch_code: '',
                branch_name: '',
                country_code: '',
                currency: '',
                timezone: '',
                is_active: true,
              })
              setShowModal(true)
            }}>
              <i className="fas fa-plus"></i> Add Branch
            </button>
          </div>
        </div>
      </div>

      <div className="branches-table-container">
        {filteredBranches.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-building"></i>
            <h3>No branches found</h3>
            <p>
              {branches.length === 0
                ? 'Get started by adding your first branch'
                : 'No branches match your current filters. Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Branch Code</th>
                <th>Branch Name</th>
                <th>Country Code</th>
                <th>Currency</th>
                <th>Timezone</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((branch) => (
                <tr key={branch.branch_id}>
                  <td><strong>{branch.branch_code}</strong></td>
                  <td>{branch.branch_name}</td>
                  <td>{branch.country_code}</td>
                  <td>{branch.currency}</td>
                  <td>{branch.timezone}</td>
                  <td>
                    <span className={`status-badge ${branch.is_active ? 'active' : 'inactive'}`}>
                      {branch.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(branch.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-btn edit"
                        onClick={() => {
                          setEditingBranch(branch)
                          setFormData({
                            branch_code: branch.branch_code,
                            branch_name: branch.branch_name,
                            country_code: branch.country_code,
                            currency: branch.currency,
                            timezone: branch.timezone,
                            is_active: branch.is_active,
                          })
                          setShowModal(true)
                        }}
                        title="Edit Branch"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(branch.branch_id)}
                        title="Delete Branch"
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

      {/* Branch Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Branch Code *</label>
                  <input
                    type="text"
                    value={formData.branch_code}
                    onChange={(e) => setFormData({ ...formData, branch_code: e.target.value.toUpperCase() })}
                    required
                    maxLength={10}
                    placeholder="e.g., EG, UK, UAE"
                  />
                </div>
                <div className="form-group">
                  <label>Branch Name *</label>
                  <input
                    type="text"
                    value={formData.branch_name}
                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                    required
                    placeholder="e.g., Egypt, United Kingdom"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Country Code *</label>
                  <input
                    type="text"
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                    required
                    maxLength={3}
                    placeholder="e.g., EGY, GBR, ARE"
                  />
                </div>
                <div className="form-group">
                  <label>Currency *</label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                    required
                    maxLength={3}
                    placeholder="e.g., EGP, GBP, AED"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Timezone *</label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  required
                  placeholder="e.g., Africa/Cairo, Europe/London"
                />
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

              <div className="modal-actions">
                <button type="button" className="lte-btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="lte-btn">
                  {editingBranch ? 'Update' : 'Create'} Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Branches

