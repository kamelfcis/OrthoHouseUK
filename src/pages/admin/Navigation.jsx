import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  fetchNavLinkSettingsForAdmin,
  mergeNavRowsWithDefaults,
} from '../../lib/navLinkSettings'
import toast from 'react-hot-toast'
import './Navigation.css'

const Navigation = () => {
  const { appUser, isAdmin, isBranchManager } = useAuth()
  const hasLoadedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [links, setLinks] = useState([])

  const activeBranchId = isBranchManager
    ? String(appUser?.branch_id || '')
    : selectedBranchId

  useEffect(() => {
    if (!appUser) {
      setLoading(false)
      return
    }

    if (isAdmin && branches.length === 0) {
      fetchBranches()
    }

    if (isBranchManager && appUser?.branch_id) {
      setSelectedBranchId(String(appUser.branch_id))
    }
  }, [appUser, isAdmin, isBranchManager, branches.length])

  useEffect(() => {
    if (!appUser || !activeBranchId) {
      if (!isAdmin) setLoading(false)
      return
    }

    if (!hasLoadedRef.current) {
      loadLinks(parseInt(activeBranchId, 10))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, activeBranchId])

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('branch_id, branch_name, branch_code')
        .eq('is_active', true)
        .order('branch_name')

      if (error) throw error
      setBranches(data || [])

      const ukBranch = data?.find((branch) => branch.branch_code === 'UK')
      if (ukBranch && !selectedBranchId) {
        setSelectedBranchId(String(ukBranch.branch_id))
      } else if (data?.length && !selectedBranchId) {
        setSelectedBranchId(String(data[0].branch_id))
      }
    } catch (error) {
      toast.error('Error fetching branches: ' + error.message)
    }
  }

  const loadLinks = async (branchId) => {
    try {
      setLoading(true)
      const rows = await fetchNavLinkSettingsForAdmin(branchId)
      setLinks(rows)
      hasLoadedRef.current = true
    } catch (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        toast.error('Navigation settings table not found. Run the Supabase migration first.')
      } else {
        toast.error('Error loading navigation settings: ' + error.message)
      }
      setLinks(mergeNavRowsWithDefaults([], branchId))
    } finally {
      setLoading(false)
    }
  }

  const handleBranchChange = (branchId) => {
    setSelectedBranchId(branchId)
    hasLoadedRef.current = false
    if (branchId) {
      loadLinks(parseInt(branchId, 10))
    }
  }

  const updateLink = (navKey, field, value) => {
    setLinks((current) =>
      current.map((link) =>
        link.nav_key === navKey ? { ...link, [field]: value } : link
      )
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!activeBranchId) {
      toast.error('Select a branch first.')
      return
    }

    try {
      setSaving(true)
      const branchId = parseInt(activeBranchId, 10)
      const payload = links.map((link) => ({
        branch_id: branchId,
        nav_key: link.nav_key,
        is_visible: Boolean(link.is_visible),
        display_order: link.display_order,
      }))

      const { error } = await supabase
        .from('nav_link_settings')
        .upsert(payload, { onConflict: 'branch_id,nav_key' })

      if (error) throw error

      toast.success('Navigation settings saved.')
      hasLoadedRef.current = false
      await loadLinks(branchId)
    } catch (error) {
      toast.error('Error saving navigation settings: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="admin-loading">Loading navigation settings...</div>
  }

  return (
    <div className="admin-navigation">
      <div className="navigation-header">
        <div>
          <h1>Navigation</h1>
          <p>Control which links appear in the site navbar and footer.</p>
        </div>
      </div>

      {isAdmin && (
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="nav-branch">Branch</label>
              <select
                id="nav-branch"
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <form className="nav-links-panel" onSubmit={handleSave}>
        <div className="nav-links-list">
          {links.map((link) => (
            <div key={link.nav_key} className="nav-link-row">
              <div className="nav-link-icon" aria-hidden="true">
                <i
                  className={
                    link.nav_key === 'partners' ? 'fas fa-handshake' : 'fas fa-newspaper'
                  }
                ></i>
              </div>

              <div className="nav-link-fields">
                <div className="nav-link-title-row">
                  <div>
                    <h3>{link.label}</h3>
                    <p className="nav-link-path">{link.path}</p>
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={Boolean(link.is_visible)}
                      onChange={(e) =>
                        updateLink(link.nav_key, 'is_visible', e.target.checked)
                      }
                    />
                    Show in navigation
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="nav-links-actions">
          <button type="submit" className="lte-btn" disabled={saving || !activeBranchId}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Navigation
