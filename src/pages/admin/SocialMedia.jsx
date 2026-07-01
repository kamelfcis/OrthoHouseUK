import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  SOCIAL_PLATFORM_META,
  fetchSocialLinksForAdmin,
  mergeSocialRowsWithDefaults,
} from '../../lib/socialLinks'
import toast from 'react-hot-toast'
import './SocialMedia.css'

const SocialMedia = () => {
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
      const rows = await fetchSocialLinksForAdmin(branchId)
      setLinks(rows)
      hasLoadedRef.current = true
    } catch (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        toast.error('Social links table not found. Run the Supabase migration first.')
      } else {
        toast.error('Error loading social links: ' + error.message)
      }
      setLinks(mergeSocialRowsWithDefaults([], branchId))
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

  const updateLink = (platform, field, value) => {
    setLinks((current) =>
      current.map((link) =>
        link.platform === platform ? { ...link, [field]: value } : link
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
        platform: link.platform,
        url: link.url.trim(),
        is_visible: Boolean(link.is_visible),
        display_order: link.display_order,
      }))

      const { error } = await supabase
        .from('social_links')
        .upsert(payload, { onConflict: 'branch_id,platform' })

      if (error) throw error

      toast.success('Social media links saved.')
      hasLoadedRef.current = false
      await loadLinks(branchId)
    } catch (error) {
      toast.error('Error saving social links: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="admin-loading">Loading social media settings...</div>
  }

  return (
    <div className="admin-social-media">
      <div className="social-media-header">
        <div>
          <h1>Social Media</h1>
          <p>Control which footer icons appear on the public site and edit their URLs.</p>
        </div>
      </div>

      {isAdmin && (
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="social-branch">Branch</label>
              <select
                id="social-branch"
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

      <form className="social-links-panel" onSubmit={handleSave}>
        <div className="social-links-list">
          {links.map((link) => {
            const meta = SOCIAL_PLATFORM_META[link.platform]
            return (
              <div key={link.platform} className="social-link-row">
                <div className="social-link-icon" aria-hidden="true">
                  <i className={meta.icon}></i>
                </div>

                <div className="social-link-fields">
                  <div className="social-link-title-row">
                    <h3>{meta.name}</h3>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(link.is_visible)}
                        onChange={(e) =>
                          updateLink(link.platform, 'is_visible', e.target.checked)
                        }
                      />
                      Show in footer
                    </label>
                  </div>

                  <div className="form-group">
                    <label htmlFor={`url-${link.platform}`}>URL</label>
                    <input
                      id={`url-${link.platform}`}
                      type={link.platform === 'email' ? 'text' : 'url'}
                      value={link.url}
                      onChange={(e) => updateLink(link.platform, 'url', e.target.value)}
                      placeholder={
                        link.platform === 'email'
                          ? 'mailto:info@ortho-house.com'
                          : 'https://'
                      }
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="social-links-actions">
          <button type="submit" className="lte-btn" disabled={saving || !activeBranchId}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SocialMedia
