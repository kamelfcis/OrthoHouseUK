import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import './Users.css'

const Users = () => {
  const { appUser } = useAuth()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Track if data has been loaded to prevent refetching on tab switch
  const hasLoadedRef = useRef(false)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [branches, setBranches] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    user_type: 'all',
    branch_id: '',
    status: 'all',
  })

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    user_type: 'branch_content_manager',
    branch_id: '',
    is_active: true,
  })

  useEffect(() => {
    if (appUser) {
      // Only fetch if we haven't loaded data yet (avoid refetching on tab switch)
      if (!hasLoadedRef.current && users.length === 0) {
        fetchUsers()
      } else if (hasLoadedRef.current || users.length > 0) {
        // We already have users, just ensure loading is false
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

  useEffect(() => {
    if (users.length > 0) {
      applyFilters()
    } else {
      setFilteredUsers([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('app_users')
        .select('*, branches(branch_id, branch_name, branch_code)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
      hasLoadedRef.current = true // Mark as loaded successfully
    } catch (error) {
      toast.error('Error fetching users: ' + error.message)
      hasLoadedRef.current = false // Reset on error so user can retry
    } finally {
      setLoading(false)
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

  const applyFilters = () => {
    if (!users || users.length === 0) {
      setFilteredUsers([])
      return
    }

    try {
      let filtered = [...users]

      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(u =>
          u.first_name?.toLowerCase().includes(searchLower) ||
          u.last_name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u.username?.toLowerCase().includes(searchLower)
        )
      }

      if (filters.user_type !== 'all') {
        filtered = filtered.filter(u => u.user_type === filters.user_type)
      }

      if (filters.branch_id) {
        filtered = filtered.filter(u => u.branch_id === parseInt(filters.branch_id))
      }

      if (filters.status !== 'all') {
        filtered = filtered.filter(u =>
          filters.status === 'active' ? u.is_active : !u.is_active
        )
      }

      setFilteredUsers(filtered)
    } catch (error) {
      console.error('Error applying filters:', error)
      setFilteredUsers(users)
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      // Note: auth_user_id will be deleted via CASCADE if exists
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error) {
      toast.error('Error deleting user: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (!editingUser) {
        // For new users, create in app_users table
        // Note: User will need to sign up via the login page or you'll need to use Supabase Admin API from backend
        // For now, we'll create the app_users record without auth_user_id
        // The auth_user_id can be linked later when the user signs up with matching email
        const { error: userError } = await supabase
          .from('app_users')
          .insert({
            username: formData.username,
            email: formData.email,
            password_hash: formData.password ? 'hashed' : null, // Placeholder - should be hashed on backend
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone || null,
            user_type: formData.user_type,
            branch_id: formData.user_type === 'admin' ? null : (formData.branch_id ? parseInt(formData.branch_id) : null),
            is_active: formData.is_active,
          })

        if (userError) throw userError

        toast.success('User created successfully. Note: User must sign up via login page to create auth account.')
      } else {
        // Update existing user
        const updateData = {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          user_type: formData.user_type,
          branch_id: formData.user_type === 'admin' ? null : (formData.branch_id ? parseInt(formData.branch_id) : null),
          is_active: formData.is_active,
        }

        // Note: Password and email updates in Supabase Auth require Admin API (backend)
        // For now, we only update the app_users table

        const { error } = await supabase
          .from('app_users')
          .update(updateData)
          .eq('user_id', editingUser.user_id)

        if (error) throw error
        toast.success('User updated successfully')
      }

      setShowModal(false)
      setEditingUser(null)
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        user_type: 'branch_content_manager',
        branch_id: '',
        is_active: true,
      })
      fetchUsers()
    } catch (error) {
      toast.error('Error saving user: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="admin-users">
        <div className="admin-loading">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h2>Loading users...</h2>
          <p>Please wait while we fetch your users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-users">
      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group search-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>User Type</label>
            <select
              value={filters.user_type}
              onChange={(e) => setFilters({ ...filters, user_type: e.target.value })}
            >
              <option value="all">All Types</option>
              <option value="admin">Admin</option>
              <option value="branch_content_manager">Branch Manager</option>
            </select>
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="filter-group filter-group-button">
            <button
              className="lte-btn btn-outline"
              onClick={() => setFilters({
                search: '',
                user_type: 'all',
                branch_id: '',
                status: 'all',
              })}
            >
              <i className="fas fa-times-circle"></i> Clear Filters
            </button>
          </div>
          <div className="filter-group">
            <button className="lte-btn" onClick={() => {
              setEditingUser(null)
              setFormData({
                username: '',
                email: '',
                password: '',
                first_name: '',
                last_name: '',
                phone: '',
                user_type: 'branch_content_manager',
                branch_id: '',
                is_active: true,
              })
              setShowModal(true)
            }}>
              <i className="fas fa-plus"></i> Add User
            </button>
          </div>
        </div>
      </div>

      <div className="users-table-container">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-users"></i>
            <h3>No users found</h3>
            <p>
              {users.length === 0
                ? 'Get started by adding your first user'
                : 'No users match your current filters. Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Type</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.email}</td>
                  <td>{user.username}</td>
                  <td>
                    <span className={`type-badge ${user.user_type}`}>
                      {user.user_type === 'admin' ? 'Admin' : 'Branch Manager'}
                    </span>
                  </td>
                  <td>{user.branches ? `${user.branches.branch_name} (${user.branches.branch_code})` : 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-btn edit"
                        onClick={() => {
                          setEditingUser(user)
                          setFormData({
                            username: user.username,
                            email: user.email,
                            password: '',
                            first_name: user.first_name,
                            last_name: user.last_name,
                            phone: user.phone || '',
                            user_type: user.user_type,
                            branch_id: user.branch_id || '',
                            is_active: user.is_active,
                          })
                          setShowModal(true)
                        }}
                        title="Edit User"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(user.user_id)}
                        title="Delete User"
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

      {/* User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password {!editingUser && '*'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    placeholder={editingUser ? 'Leave blank to keep current password' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>User Type *</label>
                  <select
                    value={formData.user_type}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      user_type: e.target.value,
                      branch_id: e.target.value === 'admin' ? '' : formData.branch_id
                    })}
                    required
                  >
                    <option value="admin">Administrator</option>
                    <option value="branch_content_manager">Branch Content Manager</option>
                  </select>
                </div>
                {formData.user_type === 'branch_content_manager' && (
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
                          {branch.branch_name} ({branch.branch_code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                  {editingUser ? 'Update' : 'Create'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users

