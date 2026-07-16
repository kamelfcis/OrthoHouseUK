import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { invalidatePublicCache } from '../../lib/invalidatePublicCache'
import toast from 'react-hot-toast'
import './Partners.css'

const Partners = () => {
  const { isAdmin, isBranchManager, appUser } = useAuth()
  const [partners, setPartners] = useState([])
  const [filteredPartners, setFilteredPartners] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Track if data has been loaded to prevent refetching on tab switch
  const hasLoadedRef = useRef(false)
  const [showModal, setShowModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [editingPartner, setEditingPartner] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [branches, setBranches] = useState([])
  const [allPartners, setAllPartners] = useState([]) // For branch managers to link
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    partnership_type: 'all',
    status: 'all',
    branch_id: '',
  })
  const [formData, setFormData] = useState({
    partner_name: '',
    partner_code: '',
    partnership_type: 'manufacturer',
    description: '',
    website_url: '',
    contact_email: '',
    contact_phone: '',
    logo_url: '',
    is_active: true,
  })
  const [selectedBranches, setSelectedBranches] = useState([]) // For admin to select branches when creating partner

  useEffect(() => {
    if (appUser) {
      // Only fetch if we haven't loaded data yet (avoid refetching on tab switch)
      if (!hasLoadedRef.current && partners.length === 0) {
        fetchPartners()
      } else if (hasLoadedRef.current || partners.length > 0) {
        // We already have partners, just ensure loading is false
        setLoading(false)
      }
      
      // Fetch other data in parallel - only if empty
      if (isAdmin && branches.length === 0) {
        fetchBranches()
      } else if (isBranchManager && allPartners.length === 0) {
        fetchAllPartnersForLinking()
      }
    } else {
      setLoading(false)
      hasLoadedRef.current = false // Reset when user logs out
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, isAdmin, isBranchManager])

  useEffect(() => {
    if (partners.length > 0) {
      applyFilters()
    } else {
      setFilteredPartners([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partners, filters])

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

  const fetchAllPartnersForLinking = async () => {
    try {
      // Fetch all active partners that can be linked to the branch
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('is_active', true)
        .order('partner_name')

      if (error) throw error
      setAllPartners(data || [])
    } catch (error) {
      console.error('Error fetching all partners:', error)
    }
  }

  const handleLinkPartner = async () => {
    if (!selectedPartnerId) {
      toast.error('Please select a partner to link')
      return
    }

    try {
      // Check if partner is already linked to this branch
      const { data: existing, error: checkError } = await supabase
        .from('branch_partners')
        .select('branch_partner_id')
        .eq('branch_id', appUser.branch_id)
        .eq('partner_id', parseInt(selectedPartnerId))
        .single()

      if (existing) {
        toast.error('This partner is already linked to your branch')
        return
      }

      // Link partner to branch
      const { error: linkError } = await supabase
        .from('branch_partners')
        .insert({
          branch_id: appUser.branch_id,
          partner_id: parseInt(selectedPartnerId),
          is_active: true,
        })

      if (linkError) throw linkError

      toast.success('Partner linked to branch successfully')
      invalidatePublicCache('UK')
      setShowLinkModal(false)
      setSelectedPartnerId('')
      fetchPartners()
    } catch (error) {
      toast.error('Error linking partner: ' + error.message)
    }
  }

  const fetchPartners = async () => {
    try {
      setLoading(true)
      
      if (isBranchManager && appUser?.branch_id) {
        // Branch Manager: Fetch partners from branch_partners for their branch
        const { data, error } = await supabase
          .from('branch_partners')
          .select(`
            *,
            partners (
              partner_id,
              partner_name,
              partner_code,
              logo_url,
              website_url,
              contact_email,
              contact_phone,
              description,
              partnership_type,
              is_active
            ),
            branches (
              branch_id,
              branch_code,
              branch_name
            )
          `)
          .eq('branch_id', appUser.branch_id)
          .eq('is_active', true)
          .order('partners(partner_name)')

        if (error) throw error
        
        // Transform data to match expected format
        const transformedData = (data || []).map(item => ({
          branch_partner_id: item.branch_partner_id,
          branch_id: item.branch_id,
          partner_id: item.partners.partner_id,
          partner_name: item.partners.partner_name,
          partner_code: item.partners.partner_code,
          logo_url: item.partners.logo_url,
          website_url: item.partners.website_url,
          contact_email: item.partners.contact_email,
          contact_phone: item.partners.contact_phone,
          description: item.partners.description,
          partnership_type: item.partners.partnership_type,
          is_active: item.partners.is_active,
          branch_partner_active: item.is_active,
          branches: item.branches,
        }))
        
        setPartners(transformedData)
      } else if (isAdmin) {
        // Admin: Fetch all partners with their branch relationships
        const { data: partnersData, error: partnersError } = await supabase
          .from('partners')
          .select('*')
          .order('partner_name')

        if (partnersError) throw partnersError

        // Fetch branch relationships for each partner
        const partnersWithBranches = await Promise.all(
          (partnersData || []).map(async (partner) => {
            const { data: branchPartners, error: bpError } = await supabase
              .from('branch_partners')
              .select(`
                *,
                branches (
                  branch_id,
                  branch_code,
                  branch_name
                )
              `)
              .eq('partner_id', partner.partner_id)
              .eq('is_active', true)

            if (bpError) console.error('Error fetching branch partners:', bpError)

            return {
              ...partner,
              branch_partners: branchPartners || [],
              branches: branchPartners?.map(bp => bp.branches).filter(Boolean) || [],
            }
          })
        )

        setPartners(partnersWithBranches)
        hasLoadedRef.current = true // Mark as loaded successfully
      }
    } catch (error) {
      toast.error('Error fetching partners: ' + error.message)
      hasLoadedRef.current = false // Reset on error so user can retry
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    if (!partners || partners.length === 0) {
      setFilteredPartners([])
      return
    }

    try {
      let filtered = [...partners]

      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(p =>
          p.partner_name?.toLowerCase().includes(searchLower) ||
          p.partner_code?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.contact_email?.toLowerCase().includes(searchLower)
        )
      }

      if (filters.partnership_type !== 'all') {
        filtered = filtered.filter(p => p.partnership_type === filters.partnership_type)
      }

      if (filters.status !== 'all') {
        filtered = filtered.filter(p =>
          filters.status === 'active' ? p.is_active : !p.is_active
        )
      }

      // Branch filter for admin
      if (isAdmin && filters.branch_id) {
        filtered = filtered.filter(p => {
          if (p.branches && Array.isArray(p.branches)) {
            return p.branches.some(b => b.branch_id === parseInt(filters.branch_id))
          }
          return false
        })
      }

      setFilteredPartners(filtered)
    } catch (error) {
      console.error('Error applying filters:', error)
      setFilteredPartners(partners)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, WebP, GIF, or SVG images.')
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
      const filePath = `partner-logos/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('partner-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Update form data with the logo URL
      setFormData({ ...formData, logo_url: filePath })
      toast.success('Logo uploaded successfully')
      invalidatePublicCache('UK')
    } catch (error) {
      toast.error('Error uploading logo: ' + error.message)
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
    return `https://${projectRef}.supabase.co/storage/v1/object/public/partner-logos/${imagePath}`
  }

  const handleDelete = async (partnerId, branchPartnerId = null) => {
    if (isBranchManager && branchPartnerId) {
      // Branch Manager: Remove partner from their branch only
      if (!confirm('Are you sure you want to remove this partner from your branch?')) return

      try {
        const { error } = await supabase
          .from('branch_partners')
          .delete()
          .eq('branch_partner_id', branchPartnerId)

        if (error) throw error
        toast.success('Partner removed from branch successfully')
        invalidatePublicCache('UK')
        fetchPartners()
      } catch (error) {
        toast.error('Error removing partner: ' + error.message)
      }
    } else if (isAdmin) {
      // Admin: Delete partner globally (and all branch relationships)
      if (!confirm('Are you sure you want to delete this partner? This will remove it from all branches and delete the logo.')) return

      try {
        // Get partner to delete logo
        const partner = partners.find(p => p.partner_id === partnerId)
        
        // Delete logo from storage if exists
        if (partner?.logo_url) {
          try {
            await supabase.storage
              .from('partner-logos')
              .remove([partner.logo_url])
          } catch (logoError) {
            console.error('Error deleting logo:', logoError)
          }
        }

        // Delete branch relationships first
        await supabase
          .from('branch_partners')
          .delete()
          .eq('partner_id', partnerId)

        // Delete partner
        const { error } = await supabase
          .from('partners')
          .delete()
          .eq('partner_id', partnerId)

        if (error) throw error
        toast.success('Partner deleted successfully')
        invalidatePublicCache('UK')
        fetchPartners()
      } catch (error) {
        toast.error('Error deleting partner: ' + error.message)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (isBranchManager && editingPartner) {
        // Branch Manager: Can only toggle active status of branch_partner relationship
        // They cannot edit partner details (admin only)
        toast.error('Branch managers can only add/remove partners. Partner details can only be edited by administrators.')
        return
      }

      if (editingPartner) {
        // Admin: Update partner
        // If logo changed, delete old logo from storage
        if (editingPartner.logo_url && editingPartner.logo_url !== formData.logo_url) {
          try {
            await supabase.storage
              .from('partner-logos')
              .remove([editingPartner.logo_url])
          } catch (logoError) {
            console.error('Error deleting old logo:', logoError)
          }
        }

        // Only update fields that exist in the partners table
        const updateData = {
          partner_name: formData.partner_name,
          partner_code: formData.partner_code,
          partnership_type: formData.partnership_type,
          description: formData.description || null,
          website_url: formData.website_url || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          logo_url: formData.logo_url || null,
          is_active: formData.is_active,
        }

        const { error } = await supabase
          .from('partners')
          .update(updateData)
          .eq('partner_id', editingPartner.partner_id)

        if (error) throw error
        toast.success('Partner updated successfully')
      } else {
        // Admin: Create new partner
        // Only insert fields that exist in the partners table
        const insertData = {
          partner_name: formData.partner_name,
          partner_code: formData.partner_code,
          partnership_type: formData.partnership_type,
          description: formData.description || null,
          website_url: formData.website_url || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          logo_url: formData.logo_url || null,
          is_active: formData.is_active,
        }

        const { data: newPartner, error: partnerError } = await supabase
          .from('partners')
          .insert(insertData)
          .select()
          .single()

        if (partnerError) throw partnerError

        // Link partner to selected branches
        if (selectedBranches.length > 0) {
          const branchPartnersData = selectedBranches.map(branchId => ({
            branch_id: parseInt(branchId),
            partner_id: newPartner.partner_id,
            is_active: true,
          }))

          const { error: bpError } = await supabase
            .from('branch_partners')
            .insert(branchPartnersData)

          if (bpError) throw bpError
        }

        toast.success('Partner created successfully')
      }

      invalidatePublicCache('UK')
      setShowModal(false)
      setEditingPartner(null)
      setSelectedBranches([])
      setFormData({
        partner_name: '',
        partner_code: '',
        partnership_type: 'manufacturer',
        description: '',
        website_url: '',
        contact_email: '',
        contact_phone: '',
        logo_url: '',
        is_active: true,
      })
      fetchPartners()
    } catch (error) {
      toast.error('Error saving partner: ' + error.message)
    }
  }

  const handleEdit = (partner) => {
    setEditingPartner(partner)
    // Only set formData with fields that exist in the partners table
    // Remove any fields from joined tables (like branch_partners)
    setFormData({
      partner_name: partner.partner_name || '',
      partner_code: partner.partner_code || '',
      partnership_type: partner.partnership_type || 'manufacturer',
      description: partner.description || '',
      website_url: partner.website_url || '',
      contact_email: partner.contact_email || '',
      contact_phone: partner.contact_phone || '',
      logo_url: partner.logo_url || '',
      is_active: partner.is_active ?? true,
    })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="admin-partners">
        <div className="admin-loading">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h2>Loading partners...</h2>
          <p>Please wait while we fetch your partners.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-partners">
      {/* Filters and Add Button */}
      <div className="filters-section" style={{ marginBottom: '24px' }}>
        <div className="filters-grid">
          <div className="filter-group search-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search partners..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>Partnership Type</label>
            <select
              value={filters.partnership_type}
              onChange={(e) => setFilters({ ...filters, partnership_type: e.target.value })}
            >
              <option value="all">All Types</option>
              <option value="manufacturer">Manufacturer</option>
              <option value="supplier">Supplier</option>
              <option value="distributor">Distributor</option>
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
          <div className="filter-group filter-group-button">
            <button
              className="lte-btn btn-outline"
              onClick={() => setFilters({
                search: '',
                partnership_type: 'all',
                status: 'all',
                branch_id: '',
              })}
            >
              <i className="fas fa-times-circle"></i> Clear Filters
            </button>
          </div>
          {isAdmin && (
            <div className="filter-group">
              <button className="lte-btn" onClick={() => {
                setEditingPartner(null)
                setSelectedBranches([])
                setFormData({
                  partner_name: '',
                  partner_code: '',
                  partnership_type: 'manufacturer',
                  description: '',
                  website_url: '',
                  contact_email: '',
                  contact_phone: '',
                  logo_url: '',
                  is_active: true,
                })
                setShowModal(true)
              }}>
                <i className="fas fa-plus"></i> Add Partner
              </button>
            </div>
          )}
          {!isAdmin && isBranchManager && (
            <div className="filter-group">
              <button className="lte-btn" onClick={() => setShowLinkModal(true)}>
                <i className="fas fa-link"></i> Link Partner to Branch
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="partners-table-container">
        {filteredPartners.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-handshake"></i>
            <h3>No partners found</h3>
            <p>
              {partners.length === 0
                ? 'Get started by adding your first partner'
                : 'No partners match your current filters. Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Partner Name</th>
                <th>Code</th>
                <th>Type</th>
                {isAdmin && <th>Branches</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner) => (
                <tr key={partner.partner_id || partner.branch_partner_id}>
                  <td>
                    <div className="partner-logo-cell">
                      {partner.logo_url ? (
                        <img
                          src={getImageUrl(partner.logo_url)}
                          alt={partner.partner_name}
                          className="partner-logo"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex'
                            }
                          }}
                        />
                      ) : null}
                      <div className="no-logo-placeholder" style={{ display: partner.logo_url ? 'none' : 'flex' }}>
                        <i className="fas fa-image"></i>
                      </div>
                    </div>
                  </td>
                  <td>{partner.partner_name}</td>
                  <td>{partner.partner_code}</td>
                  <td>{partner.partnership_type}</td>
                  {isAdmin && (
                    <td>
                      {partner.branches && partner.branches.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {partner.branches.map((branch, idx) => (
                            <span key={idx} className="status-badge active" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                              {branch.branch_code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#999', fontStyle: 'italic' }}>No branches</span>
                      )}
                    </td>
                  )}
                  <td>
                    <span className={`status-badge ${partner.is_active ? 'active' : 'inactive'}`}>
                      {partner.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {isAdmin && (
                        <button
                          className="action-btn edit"
                          onClick={() => handleEdit(partner)}
                          title="Edit Partner"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      )}
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(partner.partner_id, partner.branch_partner_id)}
                        title={isBranchManager ? 'Remove from Branch' : 'Delete Partner'}
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

      {/* Link Partner Modal for Branch Managers */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Link Partner to Branch</h2>
              <button className="modal-close" onClick={() => setShowLinkModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-form">
              <div className="form-group">
                <label>Select Partner *</label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  required
                >
                  <option value="">Choose a partner...</option>
                  {allPartners
                    .filter(p => !partners.some(bp => bp.partner_id === p.partner_id))
                    .map(partner => (
                      <option key={partner.partner_id} value={partner.partner_id}>
                        {partner.partner_name} ({partner.partner_code})
                      </option>
                    ))}
                </select>
                {allPartners.filter(p => !partners.some(bp => bp.partner_id === p.partner_id)).length === 0 && (
                  <p style={{ color: '#999', marginTop: '8px', fontStyle: 'italic' }}>
                    All available partners are already linked to your branch.
                  </p>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="lte-btn btn-outline" onClick={() => {
                  setShowLinkModal(false)
                  setSelectedPartnerId('')
                }}>
                  Cancel
                </button>
                <button type="button" className="lte-btn" onClick={handleLinkPartner} disabled={!selectedPartnerId}>
                  Link Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPartner ? 'Edit Partner' : 'Add New Partner'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Partner Name *</label>
                  <input
                    type="text"
                    value={formData.partner_name}
                    onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Partner Code *</label>
                  <input
                    type="text"
                    value={formData.partner_code}
                    onChange={(e) => setFormData({ ...formData, partner_code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Partnership Type *</label>
                <select
                  value={formData.partnership_type}
                  onChange={(e) => setFormData({ ...formData, partnership_type: e.target.value })}
                  required
                >
                  <option value="manufacturer">Manufacturer</option>
                  <option value="supplier">Supplier</option>
                  <option value="distributor">Distributor</option>
                </select>
              </div>

              {/* Branch Selection for Admin - Only when creating new partner */}
              {isAdmin && !editingPartner && (
                <div className="form-group">
                  <label>Link to Branches *</label>
                  <div className="branches-checkbox-group">
                    {branches.map(branch => (
                      <label key={branch.branch_id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedBranches.includes(branch.branch_id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBranches([...selectedBranches, branch.branch_id.toString()])
                            } else {
                              setSelectedBranches(selectedBranches.filter(id => id !== branch.branch_id.toString()))
                            }
                          }}
                        />
                        <span>{branch.branch_name} ({branch.branch_code})</span>
                      </label>
                    ))}
                    {selectedBranches.length === 0 && (
                      <p style={{ color: '#d32f2f', fontSize: '0.875rem', marginTop: '8px' }}>
                        Please select at least one branch
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Website URL</label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>

              {/* Logo Upload Section */}
              <div className="form-group">
                <label>Partner Logo</label>
                <div className="image-upload-section">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                  <label htmlFor="logo-upload" className="upload-button">
                    {uploading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                    ) : (
                      <><i className="fas fa-upload"></i> Upload Logo</>
                    )}
                  </label>

                  {formData.logo_url && (
                    <div className="logo-preview" style={{ marginTop: '16px' }}>
                      <div className="logo-preview-card">
                        <img
                          src={getImageUrl(formData.logo_url)}
                          alt="Partner logo preview"
                          className="preview-logo"
                        />
                        <button
                          type="button"
                          className="logo-remove-btn"
                          onClick={() => {
                            // Delete from storage
                            if (formData.logo_url) {
                              supabase.storage
                                .from('partner-logos')
                                .remove([formData.logo_url])
                                .catch(err => console.error('Error deleting logo:', err))
                            }
                            setFormData({ ...formData, logo_url: '' })
                          }}
                          title="Remove logo"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                <button type="button" className="lte-btn btn-outline" onClick={() => {
                  setShowModal(false)
                  setSelectedBranches([])
                }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="lte-btn"
                  disabled={!editingPartner && isAdmin && selectedBranches.length === 0}
                >
                  {editingPartner ? 'Update' : 'Create'} Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Partners

