import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { getPublicBranch, getPublicBranchId } from '../../lib/branchDefaults'
import { invalidatePublicCache } from '../../lib/invalidatePublicCache'
import toast from 'react-hot-toast'
import './Categories.css'

const Categories = () => {
  const { appUser, isBranchManager, isAdmin } = useAuth()
  const [categories, setCategories] = useState([])
  const [filteredCategories, setFilteredCategories] = useState([])
  const [categoryImagesMap, setCategoryImagesMap] = useState({}) // Store images by category_id_branch_id
  const [loading, setLoading] = useState(true)
  
  // Track if data has been loaded to prevent refetching on tab switch
  const hasLoadedRef = useRef(false)
  
  const [showModal, setShowModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [selectedCategoryForImage, setSelectedCategoryForImage] = useState(null)
  const [categoryImages, setCategoryImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [branches, setBranches] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  })

  const [formData, setFormData] = useState({
    category_name: '',
    category_code: '',
    description: '',
    parent_id: '',
    is_active: true,
  })

  const emptyFormData = () => ({
    category_name: '',
    category_code: '',
    description: '',
    parent_id: '',
    is_active: true,
  })

  const rootCategories = categories.filter((c) => c.parent_id == null)

  const getParentName = (parentId) => {
    if (!parentId) return null
    return categories.find((c) => c.category_id === parentId)?.category_name || null
  }

  const hasChildCategories = (categoryId) =>
    categories.some((c) => c.parent_id === categoryId)

  useEffect(() => {
    if (appUser) {
      // Only fetch if we haven't loaded data yet (avoid refetching on tab switch)
      if (!hasLoadedRef.current && categories.length === 0) {
        // Always fetch branches first (needed for image fetching)
        if (branches.length === 0) {
          fetchBranches().then(() => {
            fetchCategories()
          })
        } else {
          fetchCategories()
        }
      } else if (hasLoadedRef.current || categories.length > 0) {
        // We already have categories, just ensure loading is false
        setLoading(false)
      }
    } else {
      setLoading(false)
      hasLoadedRef.current = false // Reset when user logs out
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser])

  // Refetch images when branches are loaded (for admin) or when categories change
  useEffect(() => {
    if (categories.length > 0 && !loading) {
      // Wait a bit to ensure branches are loaded
      const timer = setTimeout(() => {
        if (isAdmin && branches.length > 0) {
          // Admin: fetch images for all branches if not already fetched
          const hasImages = Object.keys(categoryImagesMap).length > 0
          if (!hasImages) {
            fetchCategoryImagesForAll()
          }
        } else if (isBranchManager && appUser?.branch_id) {
          // Branch manager: fetch images if not already fetched
          const hasImages = categories.some(cat => {
            const key = `${cat.category_id}_${appUser.branch_id}`
            return categoryImagesMap[key] && categoryImagesMap[key].length > 0
          })
          if (!hasImages) {
            fetchCategoryImagesForAll()
          }
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, categories, isAdmin, isBranchManager, appUser, loading])

  useEffect(() => {
    if (categories.length > 0) {
      applyFilters()
    } else {
      setFilteredCategories([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, filters])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('category_name')

      if (error) throw error
      setCategories(data || [])

      // Fetch images for all categories in parallel for faster loading
      const imagesMap = {}
      try {
        const imagePromises = []
        const imageKeys = []
        
        for (const category of data || []) {
          const branchId = isBranchManager ? appUser?.branch_id : null
          
          if (branchId) {
            // Branch manager: fetch images for their branch only
            const key = `${category.category_id}_${branchId}`
            imagePromises.push(fetchCategoryImages(category.category_id, branchId))
            imageKeys.push(key)
          } else if (isAdmin && branches.length > 0) {
            // Admin: fetch images for all branches
            for (const branch of branches) {
              const key = `${category.category_id}_${branch.branch_id}`
              imagePromises.push(fetchCategoryImages(category.category_id, branch.branch_id))
              imageKeys.push(key)
            }
          }
        }
        
        // Fetch all images in parallel
        const imageResults = await Promise.all(imagePromises)
        imageResults.forEach((images, index) => {
          imagesMap[imageKeys[index]] = images
        })
        
        setCategoryImagesMap(imagesMap)
      } catch (imgError) {
        console.error('Error fetching category images:', imgError)
      }
      hasLoadedRef.current = true // Mark as loaded successfully
    } catch (error) {
      toast.error('Error fetching categories: ' + error.message)
      hasLoadedRef.current = false // Reset on error so user can retry
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryImages = async (categoryId, branchId) => {
    try {
      const { data, error } = await supabase
        .from('category_images')
        .select('*')
        .eq('category_id', categoryId)
        .eq('branch_id', branchId)
        .order('is_primary', { ascending: false })
        .order('image_order', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching category images:', error)
      return []
    }
  }

  // Fetch images for all categories (used when branches load after categories) - optimized for parallel fetching
  const fetchCategoryImagesForAll = async () => {
    try {
      const imagesMap = {}
      const imagePromises = []
      const imageKeys = []
      
      for (const category of categories) {
        const branchId = isBranchManager ? appUser?.branch_id : null
        
        if (branchId) {
          // Branch manager: fetch images for their branch only
          const key = `${category.category_id}_${branchId}`
          imagePromises.push(fetchCategoryImages(category.category_id, branchId))
          imageKeys.push(key)
        } else if (isAdmin && branches.length > 0) {
          // Admin: fetch images for all branches
          for (const branch of branches) {
            const key = `${category.category_id}_${branch.branch_id}`
            imagePromises.push(fetchCategoryImages(category.category_id, branch.branch_id))
            imageKeys.push(key)
          }
        }
      }
      
      // Fetch all images in parallel
      const imageResults = await Promise.all(imagePromises)
      imageResults.forEach((images, index) => {
        imagesMap[imageKeys[index]] = images
      })
      
      setCategoryImagesMap(prev => ({ ...prev, ...imagesMap }))
    } catch (imgError) {
      console.error('Error fetching category images for all:', imgError)
    }
  }

  const applyFilters = () => {
    if (!categories || categories.length === 0) {
      setFilteredCategories([])
      return
    }

    try {
      let filtered = [...categories]

      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(c =>
          c.category_name?.toLowerCase().includes(searchLower) ||
          c.category_code?.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower)
        )
      }

      if (filters.status !== 'all') {
        filtered = filtered.filter(c =>
          filters.status === 'active' ? c.is_active : !c.is_active
        )
      }

      setFilteredCategories(filtered)
    } catch (error) {
      console.error('Error applying filters:', error)
      setFilteredCategories(categories)
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
      const branchId = isBranchManager
        ? appUser.branch_id
        : (selectedCategoryForImage?.selectedBranchId || getPublicBranchId(branches))
      const branchCode = branches.find(b => b.branch_id === branchId)?.branch_code || 'default'
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${branchCode}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Add to category images state — new uploads become primary by default
      const newImage = {
        image_url: filePath,
        image_alt_text: file.name.replace(/\.[^/.]+$/, ''),
        image_order: categoryImages.filter(img => !img.toDelete).length + 1,
        is_primary: true,
        file: file,
        isNew: true,
      }

      setCategoryImages((prev) => {
        const active = prev.filter((img) => !img.toDelete)
        const demoted = active.map((img) => ({ ...img, is_primary: false }))
        return [...demoted, newImage]
      })
      toast.success('Image uploaded successfully')
      invalidatePublicCache('UK')
    } catch (error) {
      toast.error('Error uploading image: ' + error.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveImage = (index) => {
    const image = categoryImages[index]
    
    if (image.image_id && !image.isNew) {
      const updatedImages = categoryImages.map((img, i) => {
        if (i === index) {
          return { ...img, toDelete: true }
        }
        if (image.is_primary && !img.toDelete && !img.isNew && i > index) {
          return { ...img, is_primary: true }
        }
        if (i !== index && img.is_primary) {
          return { ...img, is_primary: false }
        }
        return img
      })
      
      if (image.is_primary) {
        const firstNonDeleted = updatedImages.findIndex(img => !img.toDelete && (img.isNew || img.image_id))
        if (firstNonDeleted >= 0) {
          updatedImages[firstNonDeleted].is_primary = true
        }
      }
      
      setCategoryImages(updatedImages)
    } else {
      const newImages = categoryImages.filter((_, i) => i !== index)
      
      if (image.is_primary && newImages.length > 0) {
        newImages[0].is_primary = true
      }
      
      setCategoryImages(newImages)
      
      if (image.file) {
        URL.revokeObjectURL(URL.createObjectURL(image.file))
      }
    }
  }

  const handleSetPrimary = (index) => {
    const newImages = categoryImages.map((img, i) => ({
      ...img,
      is_primary: i === index && !img.toDelete
    }))
    setCategoryImages(newImages)
  }

  const handleDelete = async (categoryId) => {
    if (hasChildCategories(categoryId)) {
      toast.error('Cannot delete a category that has subcategories. Remove or reassign its children first.')
      return
    }

    if (!confirm('Are you sure you want to delete this category? This will also delete all associated images.')) return

    try {
      // Delete all category images first
      const { error: imagesError } = await supabase
        .from('category_images')
        .delete()
        .eq('category_id', categoryId)

      if (imagesError) throw imagesError

      // Delete category
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('category_id', categoryId)

      if (error) throw error
      toast.success('Category deleted successfully')
      invalidatePublicCache('UK')
      fetchCategories()
    } catch (error) {
      toast.error('Error deleting category: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const payload = {
        category_name: formData.category_name,
        category_code: formData.category_code,
        description: formData.description || null,
        is_active: formData.is_active,
        parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : null,
      }

      if (
        editingCategory &&
        payload.parent_id &&
        payload.parent_id === editingCategory.category_id
      ) {
        toast.error('A category cannot be its own parent.')
        return
      }

      if (editingCategory && payload.parent_id && hasChildCategories(editingCategory.category_id)) {
        toast.error('A category with subcategories cannot become a subcategory (one level only).')
        return
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('product_categories')
          .update(payload)
          .eq('category_id', editingCategory.category_id)

        if (error) throw error
        toast.success('Category updated successfully')
      } else {
        const { error: categoryError } = await supabase
          .from('product_categories')
          .insert(payload)
          .select()
          .single()

        if (categoryError) throw categoryError
        toast.success('Category created successfully')
      }

      invalidatePublicCache('UK')
      setShowModal(false)
      setEditingCategory(null)
      setFormData(emptyFormData())
      fetchCategories()
    } catch (error) {
      toast.error('Error saving category: ' + error.message)
    }
  }

  const handleOpenImageModal = async (category) => {
    setSelectedCategoryForImage(category)
    const branchId = isBranchManager ? appUser.branch_id : null
    
    if (isAdmin) {
      // Default to the public site branch (UK), not the first row in the table
      setSelectedCategoryForImage({
        ...category,
        selectedBranchId: getPublicBranchId(branches)
      })
    }
    
    // Fetch existing images for this category and branch
    const images = await fetchCategoryImages(
      category.category_id,
      branchId || getPublicBranchId(branches)
    )
    setCategoryImages(images)
    setShowImageModal(true)
  }

  const handleSaveImages = async () => {
    try {
      if (!selectedCategoryForImage) {
        toast.error('No category selected')
        return
      }

      const categoryId = selectedCategoryForImage.category_id
      const branchId = isBranchManager 
        ? appUser?.branch_id 
        : (selectedCategoryForImage.selectedBranchId || getPublicBranchId(branches))

      if (!categoryId || !branchId) {
        toast.error('Category or branch information is missing')
        return
      }

      // Delete images marked for deletion
      const imagesToDelete = categoryImages.filter(img => img.toDelete && img.image_id)
      for (const img of imagesToDelete) {
        try {
          await supabase.storage
            .from('category-images')
            .remove([img.image_url])

          await supabase
            .from('category_images')
            .delete()
            .eq('image_id', img.image_id)
        } catch (imgError) {
          console.error('Error deleting image:', imgError)
        }
      }

      // Add new images
      const newImages = categoryImages.filter(img => img.isNew && !img.toDelete)
      if (newImages.length > 0) {
        await supabase
          .from('category_images')
          .insert(newImages.map(img => ({
            category_id: categoryId,
            branch_id: branchId,
            image_url: img.image_url,
            image_alt_text: img.image_alt_text,
            image_order: img.image_order,
            is_primary: img.is_primary,
          })))
      }

      // Update existing images (order, primary status)
      const existingImages = categoryImages.filter(img => img.image_id && !img.isNew && !img.toDelete)
      for (const img of existingImages) {
        try {
          await supabase
            .from('category_images')
            .update({
              image_order: img.image_order,
              is_primary: img.is_primary,
              image_alt_text: img.image_alt_text,
            })
            .eq('image_id', img.image_id)
        } catch (imgError) {
          console.error('Error updating image:', imgError)
        }
      }

      toast.success('Category images saved successfully')
      invalidatePublicCache('UK')
      
      // Refresh images for the specific category and branch before clearing state
      const images = await fetchCategoryImages(categoryId, branchId)
      const key = `${categoryId}_${branchId}`
      setCategoryImagesMap(prev => ({
        ...prev,
        [key]: images
      }))
      
      setShowImageModal(false)
      setSelectedCategoryForImage(null)
      setCategoryImages([])
    } catch (error) {
      toast.error('Error saving images: ' + error.message)
    }
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ljfkmtuxqaznnmmxeydf.supabase.co'
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
    return `https://${projectRef}.supabase.co/storage/v1/object/public/category-images/${imagePath}`
  }

  const getPrimaryImage = (categoryId) => {
    const branchIds = []

    if (isBranchManager && appUser?.branch_id) {
      branchIds.push(appUser.branch_id)
    } else if (isAdmin && branches.length > 0) {
      const publicBranchId = getPublicBranchId(branches)
      if (publicBranchId) branchIds.push(publicBranchId)
      branches.forEach((branch) => {
        if (!branchIds.includes(branch.branch_id)) {
          branchIds.push(branch.branch_id)
        }
      })
    }

    for (const branchId of branchIds) {
      const key = `${categoryId}_${branchId}`
      const images = categoryImagesMap[key] || []
      if (images.length > 0) {
        return images.find((img) => img.is_primary) || images[0]
      }
    }

    return null
  }

  // Component for category image row - simplified without loading spinner
  const CategoryImageRow = ({ category, primaryImage, getImageUrl, parentName, setEditingCategory, setFormData, setShowModal, handleOpenImageModal, handleDelete }) => {
    const handleImageError = (e) => {
      e.target.style.display = 'none'
      // Show placeholder on error
      const placeholder = e.target.parentElement?.querySelector('.no-image-placeholder')
      if (placeholder) {
        placeholder.style.display = 'flex'
      }
    }

    return (
      <tr key={category.category_id}>
        <td>
          <div className="category-image-cell">
            {primaryImage ? (
              <img
                src={getImageUrl(primaryImage.image_url)}
                alt={primaryImage.image_alt_text || category.category_name}
                className="category-thumbnail"
                onError={handleImageError}
                loading="lazy"
              />
            ) : (
              <div className="no-image-placeholder">
                <i className="fas fa-image"></i>
              </div>
            )}
          </div>
        </td>
        <td>
          <div className="category-name-cell">
            <span>{category.category_name}</span>
            {parentName && (
              <span className="status-badge parent-badge" title={`Subcategory of ${parentName}`}>
                {parentName}
              </span>
            )}
          </div>
        </td>
        <td>{category.category_code}</td>
        <td>
          <span className={`status-badge ${category.is_active ? 'active' : 'inactive'}`}>
            {category.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div className="table-actions">
            <button
              className="action-btn edit"
              onClick={() => {
                setEditingCategory(category)
                setFormData({
                  category_name: category.category_name || '',
                  category_code: category.category_code || '',
                  description: category.description || '',
                  parent_id: category.parent_id != null ? String(category.parent_id) : '',
                  is_active: category.is_active !== false,
                })
                setShowModal(true)
              }}
              title="Edit Category"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              className="action-btn image"
              onClick={() => handleOpenImageModal(category)}
              title="Manage Images"
            >
              <i className="fas fa-images"></i>
            </button>
            <button
              className="action-btn delete"
              onClick={() => handleDelete(category.category_id)}
              title="Delete Category"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    )
  }

  if (loading) {
    return (
      <div className="admin-categories">
        <div className="admin-loading">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h2>Loading categories...</h2>
          <p>Please wait while we fetch your categories.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-categories">
      {/* Filters Section */}
      {isAdmin && (
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group search-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search categories..."
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
                setEditingCategory(null)
                setFormData(emptyFormData())
                setShowModal(true)
              }}>
                <i className="fas fa-plus"></i> Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Button for Branch Managers */}
      {!isAdmin && (
        <div className="filters-section" style={{ marginBottom: '24px' }}>
          <div className="filters-grid" style={{ justifyContent: 'flex-end' }}>
            <div className="filter-group">
              <button className="lte-btn" onClick={() => {
                setEditingCategory(null)
                setFormData(emptyFormData())
                setShowModal(true)
              }}>
                <i className="fas fa-plus"></i> Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="categories-table-container">
        {filteredCategories.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-tags"></i>
            <h3>No categories found</h3>
            <p>
              {categories.length === 0
                ? 'Get started by adding your first category'
                : 'No categories match your current filters. Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Category Name</th>
                <th>Code</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => {
                const primaryImage = getPrimaryImage(category.category_id)
                const parentName = getParentName(category.parent_id)

                return (
                  <CategoryImageRow
                    key={category.category_id}
                    category={category}
                    primaryImage={primaryImage}
                    parentName={parentName}
                    getImageUrl={getImageUrl}
                    setEditingCategory={setEditingCategory}
                    setFormData={setFormData}
                    setShowModal={setShowModal}
                    handleOpenImageModal={handleOpenImageModal}
                    handleDelete={handleDelete}
                  />
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Category Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    value={formData.category_name}
                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category Code *</label>
                  <input
                    type="text"
                    value={formData.category_code}
                    onChange={(e) => setFormData({ ...formData, category_code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Parent category</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  disabled={
                    Boolean(
                      editingCategory && hasChildCategories(editingCategory.category_id)
                    )
                  }
                >
                  <option value="">None (top-level)</option>
                  {rootCategories
                    .filter(
                      (cat) =>
                        !editingCategory || cat.category_id !== editingCategory.category_id
                    )
                    .map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </option>
                    ))}
                </select>
                {editingCategory && hasChildCategories(editingCategory.category_id) && (
                  <small className="form-hint">
                    This category has subcategories, so it must remain top-level.
                  </small>
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
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Management Modal */}
      {showImageModal && selectedCategoryForImage && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2>Manage Images - {selectedCategoryForImage.category_name}</h2>
              <button className="modal-close" onClick={() => setShowImageModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-form">
              {isAdmin && (
                <div className="form-group">
                  <label>Branch *</label>
                  <select
                    value={selectedCategoryForImage.selectedBranchId || ''}
                    onChange={(e) => {
                      setSelectedCategoryForImage({
                        ...selectedCategoryForImage,
                        selectedBranchId: parseInt(e.target.value)
                      })
                      // Reload images for selected branch
                      fetchCategoryImages(
                        selectedCategoryForImage.category_id,
                        parseInt(e.target.value)
                      ).then(images => setCategoryImages(images))
                    }}
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

              <div className="form-group">
                <label>Category Images</label>
                <div className="image-upload-section">
                  <input
                    type="file"
                    id="category-image-upload"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploading || (isAdmin && !selectedCategoryForImage.selectedBranchId)}
                  />
                  <label 
                    htmlFor="category-image-upload" 
                    className="upload-button"
                    style={{ 
                      opacity: (isAdmin && !selectedCategoryForImage.selectedBranchId) ? 0.5 : 1,
                      cursor: (isAdmin && !selectedCategoryForImage.selectedBranchId) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {uploading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                    ) : (
                      <><i className="fas fa-upload"></i> Upload Image</>
                    )}
                  </label>

                  <div className="images-grid">
                    {categoryImages.map((img, index) => {
                      if (img.toDelete) return null
                      
                      return (
                        <div key={img.image_id || `new-${index}`} className="image-preview-card">
                          <img
                            src={img.isNew ? URL.createObjectURL(img.file) : getImageUrl(img.image_url)}
                            alt={img.image_alt_text}
                            className="preview-image"
                          />
                          {img.is_primary && (
                            <div className="primary-badge">
                              <i className="fas fa-star"></i> Primary
                            </div>
                          )}
                          <div className="image-actions">
                            {!img.is_primary && (
                              <button
                                type="button"
                                className="image-action-btn"
                                onClick={() => handleSetPrimary(index)}
                                title="Set as primary"
                              >
                                <i className="fas fa-star"></i>
                              </button>
                            )}
                            <button
                              type="button"
                              className="image-action-btn delete"
                              onClick={() => handleRemoveImage(index)}
                              title="Remove"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="lte-btn btn-outline" onClick={() => {
                  setShowImageModal(false)
                  setSelectedCategoryForImage(null)
                  setCategoryImages([])
                }}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="lte-btn"
                  onClick={handleSaveImages}
                  disabled={uploading || (isAdmin && !selectedCategoryForImage.selectedBranchId)}
                >
                  Save Images
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories

