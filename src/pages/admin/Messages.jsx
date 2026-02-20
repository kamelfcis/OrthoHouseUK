import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import './Messages.css'

const Messages = () => {
  const { appUser, isBranchManager, isAdmin } = useAuth()
  const [messages, setMessages] = useState([])
  const [filteredMessages, setFilteredMessages] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Track if data has been loaded to prevent refetching on tab switch
  const hasLoadedRef = useRef(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [branches, setBranches] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    branch_id: '',
    status: 'all',
    message_type: 'all',
  })

  useEffect(() => {
    if (appUser) {
      // Only fetch if we haven't loaded data yet (avoid refetching on tab switch)
      if (!hasLoadedRef.current && messages.length === 0) {
        fetchMessages()
      } else if (hasLoadedRef.current || messages.length > 0) {
        // We already have messages, just ensure loading is false
        setLoading(false)
      }
      
      // Fetch branches - only if empty and admin
      if (isAdmin && branches.length === 0) {
        fetchBranches()
      }
    } else {
      setLoading(false)
      hasLoadedRef.current = false // Reset when user logs out
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, isAdmin])

  useEffect(() => {
    if (messages.length > 0) {
      applyFilters()
    } else {
      setFilteredMessages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, filters])

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

  const fetchMessages = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('contact_messages')
        .select('*, branches(branch_code, branch_name)')
        .order('created_at', { ascending: false })

      if (isBranchManager && appUser?.branch_id) {
        query = query.eq('branch_id', appUser.branch_id)
      }

      const { data, error } = await query
      if (error) throw error
      setMessages(data || [])
      hasLoadedRef.current = true // Mark as loaded successfully
    } catch (error) {
      toast.error('Error fetching messages: ' + error.message)
      hasLoadedRef.current = false // Reset on error so user can retry
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    if (!messages || messages.length === 0) {
      setFilteredMessages([])
      return
    }

    try {
      let filtered = [...messages]

      if (filters.branch_id) {
        filtered = filtered.filter(m => m.branch_id === parseInt(filters.branch_id))
      }

      if (filters.status !== 'all') {
        filtered = filtered.filter(m => m.status === filters.status)
      }

      if (filters.message_type !== 'all') {
        filtered = filtered.filter(m => m.message_type === filters.message_type)
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(m =>
          m.visitor_name?.toLowerCase().includes(searchLower) ||
          m.visitor_email?.toLowerCase().includes(searchLower) ||
          m.subject?.toLowerCase().includes(searchLower) ||
          m.message?.toLowerCase().includes(searchLower)
        )
      }

      setFilteredMessages(filtered)
    } catch (error) {
      console.error('Error applying filters:', error)
      setFilteredMessages(messages)
    }
  }

  const updateStatus = async (messageId, status) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('message_id', messageId)

      if (error) throw error
      toast.success('Status updated successfully')
      
      // Update local state
      const updatedMessages = messages.map(m =>
        m.message_id === messageId ? { ...m, status } : m
      )
      setMessages(updatedMessages)
      
      // Update selected message if it's the one being updated
      if (selectedMessage?.message_id === messageId) {
        setSelectedMessage({ ...selectedMessage, status })
      }
    } catch (error) {
      toast.error('Error updating status: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="admin-messages">
        <div className="admin-loading">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h2>Loading messages...</h2>
          <p>Please wait while we fetch your messages.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-messages">
      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group search-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search messages..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          {isAdmin && (
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
          )}
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Message Type</label>
            <select
              value={filters.message_type}
              onChange={(e) => setFilters({ ...filters, message_type: e.target.value })}
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="product_inquiry">Product Inquiry</option>
              <option value="partnership">Partnership</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div className="filter-group filter-group-button">
            <button
              className="lte-btn btn-outline"
              onClick={() => setFilters({
                search: '',
                branch_id: '',
                status: 'all',
                message_type: 'all',
              })}
            >
              <i className="fas fa-times-circle"></i> Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="messages-container">
        <div className="messages-list">
          {filteredMessages.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-envelope-open"></i>
              <h3>No messages found</h3>
              <p>
                {messages.length === 0
                  ? 'No messages have been received yet'
                  : 'No messages match your current filters. Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.message_id}
                className={`message-card ${message.status === 'new' ? 'new' : ''} ${selectedMessage?.message_id === message.message_id ? 'active' : ''}`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="message-header">
                  <div className="message-header-left">
                    <div className="message-icon">
                      <i className={`fas ${
                        message.message_type === 'product_inquiry' ? 'fa-box' :
                        message.message_type === 'partnership' ? 'fa-handshake' :
                        message.message_type === 'support' ? 'fa-life-ring' :
                        'fa-envelope'
                      }`}></i>
                    </div>
                    <div>
                      <h3>{message.visitor_name}</h3>
                      <p>{message.visitor_email}</p>
                    </div>
                  </div>
                  <span className={`status-badge ${message.status}`}>
                    {message.status}
                  </span>
                </div>
                <div className="message-meta">
                  <span><i className="fas fa-building"></i> {message.branches?.branch_code || 'N/A'}</span>
                  <span><i className="fas fa-clock"></i> {new Date(message.created_at).toLocaleString()}</span>
                  {message.message_type && (
                    <span><i className="fas fa-tag"></i> {message.message_type.replace('_', ' ')}</span>
                  )}
                </div>
                {message.subject && (
                  <div className="message-subject-preview">
                    <strong>Subject:</strong> {message.subject}
                  </div>
                )}
                <p className="message-preview">{message.message.substring(0, 150)}{message.message.length > 150 ? '...' : ''}</p>
              </div>
            ))
          )}
        </div>

        {selectedMessage ? (
          <div className="message-detail">
            <div className="message-detail-header">
              <div>
                <h2>Message Details</h2>
                <p className="message-date">
                  <i className="fas fa-clock"></i> {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>
              <div className="status-actions">
                <label>Status:</label>
                <select
                  value={selectedMessage.status}
                  onChange={(e) => updateStatus(selectedMessage.message_id, e.target.value)}
                  className="status-select"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="message-detail-content">
              <div className="detail-section">
                <h3><i className="fas fa-user"></i> Contact Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name</label>
                    <span>{selectedMessage.visitor_name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <span>
                      <a href={`mailto:${selectedMessage.visitor_email}`}>
                        {selectedMessage.visitor_email}
                      </a>
                    </span>
                  </div>
                  {selectedMessage.visitor_phone && (
                    <div className="detail-item">
                      <label>Phone</label>
                      <span>
                        <a href={`tel:${selectedMessage.visitor_phone}`}>
                          {selectedMessage.visitor_phone}
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3><i className="fas fa-info-circle"></i> Message Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Branch</label>
                    <span>{selectedMessage.branches?.branch_name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type</label>
                    <span className="type-badge">{selectedMessage.message_type}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <span className={`status-badge ${selectedMessage.status}`}>
                      {selectedMessage.status}
                    </span>
                  </div>
                </div>
              </div>

              {selectedMessage.subject && (
                <div className="detail-section">
                  <h3><i className="fas fa-tag"></i> Subject</h3>
                  <div className="subject-text">{selectedMessage.subject}</div>
                </div>
              )}

              <div className="detail-section">
                <h3><i className="fas fa-comment"></i> Message</h3>
                <div className="message-text">{selectedMessage.message}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="message-detail message-detail-placeholder">
            <div className="placeholder-content">
              <i className="fas fa-envelope-open-text"></i>
              <h3>Select a Message</h3>
              <p>Click on a message from the list to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Messages

