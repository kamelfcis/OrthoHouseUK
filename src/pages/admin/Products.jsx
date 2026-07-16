import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { invalidatePublicCache } from '../../lib/invalidatePublicCache'
import toast from 'react-hot-toast'
import './Products.css'

const Products = () => {
  const { appUser, isAdmin, isBranchManager } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [productImagesMap, setProductImagesMap] = useState({}) // Store images by product_id_branch_id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Track if data has been loaded to prevent refetching on tab switch
  const hasLoadedRef = useRef(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productImages, setProductImages] = useState([])
  const [uploading, setUploading] = useState(false)
  
  // Filters (for admin)
  const [filters, setFilters] = useState({
    branch_id: '',
    category_id: '',
    partner_id: '',
    search: '',
    status: 'all', // all, active, inactive
  })

  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    category_id: '',
    partner_id: '',
    description: '',
    specifications: '',
    is_active: true,
    branch_id: '',
    local_description: '',
    special_notes: '',
    is_public: true,
    is_available: true,
    is_category_featured: false,
  })

  const getEmptyFormData = () => ({
    product_name: '',
    product_code: '',
    category_id: '',
    partner_id: '',
    description: '',
    specifications: '',
    is_active: true,
    branch_id: isBranchManager ? appUser?.branch_id : '',
    local_description: '',
    special_notes: '',
    is_public: true,
    is_available: true,
    is_category_featured: false,
  })

  const clearSiblingCategoryFeatured = async (branchId, categoryId, excludeBranchProductId) => {
    const { data: siblings, error } = await supabase
      .from('branch_products')
      .select('branch_product_id, products!inner(category_id)')
      .eq('branch_id', branchId)
      .eq('products.category_id', categoryId)
      .eq('is_category_featured', true)

    if (error) throw error

    const idsToClear = (siblings || [])
      .map((row) => row.branch_product_id)
      .filter((id) => id !== excludeBranchProductId)

    if (idsToClear.length === 0) return

    const { error: clearError } = await supabase
      .from('branch_products')
      .update({ is_category_featured: false })
      .in('branch_product_id', idsToClear)

    if (clearError) throw clearError
  }

  const [categories, setCategories] = useState([])
  const [partners, setPartners] = useState([])
  const [branches, setBranches] = useState([])

  /** Build optgroup structure: parents with children, then orphan roots alone */
  const renderCategoryOptions = () => {
    const roots = categories.filter((c) => c.parent_id == null)
    const childrenByParent = {}
    categories.forEach((c) => {
      if (c.parent_id == null) return
      if (!childrenByParent[c.parent_id]) childrenByParent[c.parent_id] = []
      childrenByParent[c.parent_id].push(c)
    })

    const nodes = []
    roots.forEach((root) => {
      const children = childrenByParent[root.category_id] || []
      if (children.length === 0) {
        nodes.push(
          <option key={root.category_id} value={root.category_id}>
            {root.category_name}
          </option>
        )
        return
      }
      nodes.push(
        <optgroup key={`og-${root.category_id}`} label={root.category_name}>
          <option value={root.category_id}>{root.category_name}</option>
          {children.map((child) => (
            <option key={child.category_id} value={child.category_id}>
              {`↳ ${child.category_name}`}
            </option>
          ))}
        </optgroup>
      )
    })

    // Orphan subcategories whose parent is missing from the list
    const rootIds = new Set(roots.map((r) => r.category_id))
    categories
      .filter((c) => c.parent_id != null && !rootIds.has(c.parent_id))
      .forEach((orphan) => {
        nodes.push(
          <option key={orphan.category_id} value={orphan.category_id}>
            {orphan.category_name}
          </option>
        )
      })

    return nodes
  }

  useEffect(() => {
    if (appUser) {
      // Only fetch if we haven't loaded data yet (avoid refetching on tab switch)
      if (!hasLoadedRef.current && products.length === 0) {
        // Fetch products first (this sets loading state)
        // hasLoadedRef will be set in fetchProducts on success
        fetchProducts().catch(err => {
          console.error('Failed to fetch products:', err)
          setLoading(false)
          setError(err.message || 'Failed to fetch products')
          hasLoadedRef.current = false // Reset on error so user can retry
        })
      } else if (hasLoadedRef.current || products.length > 0) {
        // We already have products, just ensure loading is false
        setLoading(false)
      }
      
      // Fetch other data in parallel (don't block on these) - only if empty
      if (categories.length === 0 || partners.length === 0 || (isAdmin && branches.length === 0)) {
        Promise.all([
          categories.length === 0 ? fetchCategories() : Promise.resolve(),
          partners.length === 0 ? fetchPartners() : Promise.resolve(),
          isAdmin && branches.length === 0 ? fetchBranches() : Promise.resolve()
        ]).catch(err => {
          console.error('Error fetching dropdown data:', err)
          // Don't show error to user, just log it
        })
      }
    } else {
      setLoading(false)
      hasLoadedRef.current = false // Reset when user logs out
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, appUser])

  useEffect(() => {
    // Initialize filteredProducts with products when products change
    if (products.length > 0) {
      applyFilters()
    } else {
      setFilteredProducts([])
    }
    // Reset to page 1 when filters change
    setCurrentPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, filters])

  // Fetch images only for products on the current page (lazy loading)
  useEffect(() => {
    if (filteredProducts.length > 0 && !loading) {
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const currentPageProducts = filteredProducts.slice(startIndex, endIndex)

      // Only fetch images for products that don't already have images loaded
      const productsToFetch = currentPageProducts.filter(item => {
        if (!item || !item.products) return false
        const key = `${item.products.product_id}_${item.branch_id}`
        return !productImagesMap[key] || productImagesMap[key].length === 0
      })

      if (productsToFetch.length === 0) return

      // Fetch images in parallel for better performance
      const imagePromises = productsToFetch.map(async (item) => {
        if (item.products && item.products.product_id) {
          const key = `${item.products.product_id}_${item.branch_id}`
          const images = await fetchProductImages(item.products.product_id, item.branch_id)
          return { key, images }
        }
        return null
      })

      Promise.all(imagePromises).then(imageResults => {
        // Update images map with new images
        setProductImagesMap(prev => {
          const updated = { ...prev }
          imageResults.forEach(result => {
            if (result && result.key) {
              updated[result.key] = result.images
            }
          })
          return updated
        })
      }).catch(error => {
        console.error('Error fetching images for current page:', error)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProducts, currentPage, loading, itemsPerPage])

  const fetchProducts = async () => {
    let timeoutId = null
    try {
      setLoading(true)
      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        console.warn('Products fetch taking too long, setting loading to false')
        setLoading(false)
      }, 5000) // 5 second timeout (reduced since we're not loading images upfront)
      let query = supabase
        .from('branch_products')
        .select(`
          *,
          products (
            product_id,
            product_name,
            product_code,
            description,
            specifications,
            is_active,
            category_id,
            partner_id
          ),
          branches (
            branch_id,
            branch_code,
            branch_name
          )
        `)

      if (isBranchManager && appUser?.branch_id) {
        query = query.eq('branch_id', appUser.branch_id)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      const productsData = data || []
      setProducts(productsData)
      
      // Mark as loaded successfully
      hasLoadedRef.current = true
      
      // Don't fetch images here - we'll fetch them lazily for the current page only
    } catch (error) {
      console.error('Error fetching products:', error)
      const errorMessage = error.message || 'Unknown error occurred'
      setError(errorMessage)
      toast.error('Error fetching products: ' + errorMessage)
      setProducts([])
      setFilteredProducts([])
      hasLoadedRef.current = false // Reset on error so user can retry
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  const fetchProductImages = async (productId, branchId) => {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .order('image_order', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching images:', error)
      return []
    }
  }


  const applyFilters = () => {
    if (!products || products.length === 0) {
      setFilteredProducts([])
      return
    }

    try {
      let filtered = [...products]

    if (filters.branch_id) {
      filtered = filtered.filter(p => p.branch_id === parseInt(filters.branch_id))
    }

    if (filters.category_id) {
      filtered = filtered.filter(p => p.products?.category_id === parseInt(filters.category_id))
    }

    if (filters.partner_id) {
      filtered = filtered.filter(p => p.products?.partner_id === parseInt(filters.partner_id))
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(p => 
        filters.status === 'active' ? p.products?.is_active : !p.products?.is_active
      )
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.products?.product_name?.toLowerCase().includes(searchLower) ||
        p.products?.product_code?.toLowerCase().includes(searchLower) ||
        p.products?.description?.toLowerCase().includes(searchLower)
      )
    }

      setFilteredProducts(filtered)
    } catch (error) {
      console.error('Error applying filters:', error)
      // If filtering fails, show all products
      setFilteredProducts(products)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('category_name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('is_active', true)
        .order('partner_name')

      if (error) throw error
      setPartners(data || [])
    } catch (error) {
      console.error('Error fetching partners:', error)
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

  const handleDelete = async (branchProductId, productId) => {
    if (!confirm('Are you sure you want to delete this product? This will also delete all associated images.')) return

    try {
      const branchId = products.find(p => p.branch_product_id === branchProductId)?.branch_id

      // Delete product images first
      const { error: imagesError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId)
        .eq('branch_id', branchId)

      if (imagesError) throw imagesError

      // Delete branch product relationship
      const { error: branchError } = await supabase
        .from('branch_products')
        .delete()
        .eq('branch_product_id', branchProductId)

      if (branchError) throw branchError

      // If admin, check if product exists in other branches
      if (isAdmin) {
        const { data: otherBranches } = await supabase
          .from('branch_products')
          .select('branch_product_id')
          .eq('product_id', productId)
          .limit(1)

        // If no other branches, delete the product
        if (!otherBranches || otherBranches.length === 0) {
          const { error: productError } = await supabase
            .from('products')
            .delete()
            .eq('product_id', productId)

          if (productError) throw productError
        }
      }

      toast.success('Product deleted successfully')
      invalidatePublicCache('UK')
      fetchProducts()
    } catch (error) {
      toast.error('Error deleting product: ' + error.message)
    }
  }

  const handleEdit = async (item) => {
    setEditingProduct(item)
    setFormData({
      product_name: item.products.product_name || '',
      product_code: item.products.product_code || '',
      category_id: item.products.category_id || '',
      partner_id: item.products.partner_id || '',
      description: item.products.description || '',
      specifications: item.products.specifications || '',
      is_active: item.products.is_active ?? true,
      branch_id: item.branch_id,
      local_description: item.local_description || '',
      special_notes: item.special_notes || '',
      is_public: item.is_public ?? true,
      is_available: item.is_available ?? true,
      is_category_featured: item.is_category_featured ?? false,
    })

    // Fetch existing images
    const images = await fetchProductImages(item.products.product_id, item.branch_id)
    setProductImages(images)
    setShowModal(true)
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
      const branchId = isBranchManager ? appUser.branch_id : formData.branch_id || branches[0]?.branch_id
      const branchCode = branches.find(b => b.branch_id === branchId)?.branch_code || 'default'
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${branchCode}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

        // Add to product images state (will be saved when product is saved)
        const newImage = {
          image_url: filePath,
          image_alt_text: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for alt text
          image_type: 'gallery',
          image_order: productImages.filter(img => !img.toDelete).length + 1,
          is_primary: productImages.filter(img => !img.toDelete).length === 0,
          image_specifications: '',
          file: file, // Store file reference for preview
          isNew: true, // Flag to indicate this is a new upload
        }

      setProductImages([...productImages, newImage])
      toast.success('Image uploaded successfully')
      invalidatePublicCache('UK')
    } catch (error) {
      toast.error('Error uploading image: ' + error.message)
    } finally {
      setUploading(false)
      e.target.value = '' // Reset input
    }
  }

  const handleRemoveImage = (index) => {
    const image = productImages[index]
    
    // If it's an existing image, mark for deletion but keep in array
    if (image.image_id && !image.isNew) {
      const updatedImages = productImages.map((img, i) => {
        if (i === index) {
          return { ...img, toDelete: true }
        }
        // If removing primary, set first non-deleted image as primary
        if (image.is_primary && !img.toDelete && !img.isNew && i > index) {
          return { ...img, is_primary: true }
        }
        // Remove primary from others
        if (i !== index && img.is_primary) {
          return { ...img, is_primary: false }
        }
        return img
      })
      
      // Set first non-deleted image as primary if we removed the primary
      if (image.is_primary) {
        const firstNonDeleted = updatedImages.findIndex(img => !img.toDelete && (img.isNew || img.image_id))
        if (firstNonDeleted >= 0) {
          updatedImages[firstNonDeleted].is_primary = true
        }
      }
      
      setProductImages(updatedImages)
    } else {
      // New image - remove it completely
      const newImages = productImages.filter((_, i) => i !== index)
      
      // If removing primary, set first remaining as primary
      if (image.is_primary && newImages.length > 0) {
        newImages[0].is_primary = true
      }
      
      setProductImages(newImages)
      
      // Clean up object URL if it was a new upload
      if (image.file) {
        URL.revokeObjectURL(URL.createObjectURL(image.file))
      }
    }
  }

  const handleSetPrimary = (index) => {
    const newImages = productImages.map((img, i) => ({
      ...img,
      is_primary: i === index && !img.toDelete
    }))
    setProductImages(newImages)
  }

  const handleImageSpecChange = (index, value) => {
    setProductImages(prev => prev.map((img, i) => (
      i === index ? { ...img, image_specifications: value } : img
    )))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      let productId
      let branchId = isBranchManager ? appUser.branch_id : parseInt(formData.branch_id)

      if (editingProduct) {
        // Update existing product
        productId = editingProduct.products.product_id

        const { error } = await supabase
          .from('products')
          .update({
            product_name: formData.product_name,
            product_code: formData.product_code,
            category_id: parseInt(formData.category_id),
            partner_id: formData.partner_id ? parseInt(formData.partner_id) : null,
            description: formData.description,
            specifications: formData.specifications,
            is_active: formData.is_active,
          })
          .eq('product_id', productId)

        if (error) throw error

        // Update branch product
        const { error: branchError } = await supabase
          .from('branch_products')
          .update({
            local_description: formData.local_description,
            special_notes: formData.special_notes,
            is_public: formData.is_public,
            is_available: formData.is_available,
            is_category_featured: formData.is_category_featured,
          })
          .eq('branch_product_id', editingProduct.branch_product_id)

        if (branchError) throw branchError

        if (formData.is_category_featured) {
          await clearSiblingCategoryFeatured(
            branchId,
            parseInt(formData.category_id),
            editingProduct.branch_product_id
          )
        }

        // Handle images
        // Delete images marked for deletion
        const imagesToDelete = productImages.filter(img => img.toDelete && img.image_id)
        for (const img of imagesToDelete) {
          try {
            // Delete from storage
            await supabase.storage
              .from('product-images')
              .remove([img.image_url])

            // Delete from database
            await supabase
              .from('product_images')
              .delete()
              .eq('image_id', img.image_id)
          } catch (imgError) {
            console.error('Error deleting image:', imgError)
            // Continue with other images even if one fails
          }
        }

        // Add new images
        const newImages = productImages.filter(img => img.isNew && !img.toDelete)
        if (newImages.length > 0) {
          await supabase
            .from('product_images')
            .insert(newImages.map(img => ({
              product_id: productId,
              branch_id: branchId,
              image_url: img.image_url,
              image_alt_text: img.image_alt_text,
              image_type: img.image_type,
              image_order: img.image_order,
              is_primary: img.is_primary,
              image_specifications: img.image_specifications,
            })))
        }

        // Update existing images (order, primary status)
        const existingImages = productImages.filter(img => img.image_id && !img.isNew && !img.toDelete)
        for (const img of existingImages) {
          try {
            await supabase
              .from('product_images')
              .update({
                image_order: img.image_order,
                is_primary: img.is_primary,
                image_alt_text: img.image_alt_text,
                image_specifications: img.image_specifications,
              })
              .eq('image_id', img.image_id)
          } catch (imgError) {
            console.error('Error updating image:', imgError)
          }
        }

        toast.success('Product updated successfully')
      } else {
        // Create new product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            product_name: formData.product_name,
            product_code: formData.product_code,
            category_id: parseInt(formData.category_id),
            partner_id: formData.partner_id ? parseInt(formData.partner_id) : null,
            description: formData.description,
            specifications: formData.specifications,
            is_active: formData.is_active,
          })
          .select()
          .single()

        if (productError) throw productError

        productId = newProduct.product_id

        // Link to branch
        const { data: newBranchProduct, error: branchError } = await supabase
          .from('branch_products')
          .insert({
            product_id: productId,
            branch_id: branchId,
            is_available: formData.is_available,
            is_public: formData.is_public,
            special_notes: formData.special_notes,
            local_description: formData.local_description,
            is_category_featured: formData.is_category_featured,
          })
          .select('branch_product_id')
          .single()

        if (branchError) throw branchError

        if (formData.is_category_featured && newBranchProduct?.branch_product_id) {
          await clearSiblingCategoryFeatured(
            branchId,
            parseInt(formData.category_id),
            newBranchProduct.branch_product_id
          )
        }

        // Add images
        if (productImages.length > 0) {
          await supabase
            .from('product_images')
            .insert(productImages.map(img => ({
              product_id: productId,
              branch_id: branchId,
              image_url: img.image_url,
              image_alt_text: img.image_alt_text,
              image_type: img.image_type,
              image_order: img.image_order,
              is_primary: img.is_primary,
              image_specifications: img.image_specifications,
            })))
        }

        toast.success('Product created successfully')
      }

      invalidatePublicCache('UK')
      setShowModal(false)
      setEditingProduct(null)
      setProductImages([])
      setFormData(getEmptyFormData())
      // Refresh products and images
      await fetchProducts()
    } catch (error) {
      toast.error('Error saving product: ' + error.message)
    }
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    // Get project ref from Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ljfkmtuxqaznnmmxeydf.supabase.co'
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
    return `https://${projectRef}.supabase.co/storage/v1/object/public/product-images/${imagePath}`
  }


  // Always render something - never return null
  if (!appUser) {
    return (
      <div className="admin-products">
        <div className="admin-loading">
          <h2>Loading user information...</h2>
          <p>Please wait while we verify your access.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-products">
      {/* Loading State */}
      {loading && (
        <div className="admin-loading">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h2>Loading products...</h2>
          <p>Please wait while we fetch your products.</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-message">
          <h3>Error Loading Products</h3>
          <p>{error}</p>
          <button 
            className="lte-btn" 
            onClick={() => {
              setError(null)
              fetchProducts()
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>

      {/* Filters (Admin only) */}
      {isAdmin && (
        <div className="filters-section">
          <div className="filters-grid">
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
              <label>Category</label>
              <select
                value={filters.category_id}
                onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
              >
                <option value="">All Categories</option>
                {renderCategoryOptions()}
              </select>
            </div>

            <div className="filter-group">
              <label>Partner</label>
              <select
                value={filters.partner_id}
                onChange={(e) => setFilters({ ...filters, partner_id: e.target.value })}
              >
                <option value="">All Partners</option>
                {partners.map(partner => (
                  <option key={partner.partner_id} value={partner.partner_id}>
                    {partner.partner_name}
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

            <div className="filter-group search-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="filter-group filter-group-button">
              <button
                className="lte-btn btn-outline"
                onClick={() => setFilters({
                  branch_id: '',
                  category_id: '',
                  partner_id: '',
                  search: '',
                  status: 'all',
                })}
              >
                <i className="fas fa-times-circle"></i> Clear Filters
              </button>
            </div>
            <div className="filter-group">
              <button
                className="lte-btn"
                onClick={() => {
                  setEditingProduct(null)
                  setProductImages([])
                  setFormData(getEmptyFormData())
                  setShowModal(true)
                }}
              >
                <i className="fas fa-plus"></i> Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Button for Branch Managers (when filters are hidden) */}
      {!isAdmin && (
        <div className="filters-section">
          <div className="filters-grid filters-grid-single">
            <div className="filter-group">
              <button
                className="lte-btn"
                onClick={() => {
                  setEditingProduct(null)
                  setProductImages([])
                  setFormData(getEmptyFormData())
                  setShowModal(true)
                }}
              >
                <i className="fas fa-plus"></i> Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="products-table-container">
        {/* Products Count and Pagination Info */}
        {filteredProducts.length > 0 && (
          <div className="table-header-info">
            <div className="products-count">
              <strong>Total:</strong> {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </div>
            <div className="pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
            </div>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-box"></i>
            <h3>No products found</h3>
            <p>
              {products.length === 0 
                ? 'Get started by adding your first product to your catalog'
                : 'No products match your current filters. Try adjusting your search criteria.'}
            </p>
            <button
              className="lte-btn"
              onClick={() => {
                setEditingProduct(null)
                setProductImages([])
                setFormData(getEmptyFormData())
                setShowModal(true)
              }}
            >
              <i className="fas fa-plus"></i> {products.length === 0 ? 'Add Your First Product' : 'Add New Product'}
            </button>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>Code</th>
                  <th>Category</th>
                  {isAdmin && <th>Branch</th>}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((item) => {
                if (!item || !item.products) return null
                
                const key = `${item.products.product_id}_${item.branch_id}`
                const images = productImagesMap[key] || []
                const primaryImage = images.find(img => img.is_primary) || images[0]
                
                // Images will be loaded lazily, so show placeholder if not loaded yet
                
                return (
                  <tr key={item.branch_product_id}>
                    <td>
                      <div className="product-image-cell">
                        {primaryImage ? (
                          <img
                            src={getImageUrl(primaryImage.image_url)}
                            alt={primaryImage.image_alt_text || item.products.product_name}
                            className="product-thumbnail"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div className="no-image-placeholder" style={{ display: primaryImage ? 'none' : 'flex' }}>
                          <i className="fas fa-image"></i>
                        </div>
                      </div>
                    </td>
                    <td>{item.products.product_name || 'N/A'}</td>
                    <td>{item.products.product_code || 'N/A'}</td>
                    <td>
                      {categories.find(c => c.category_id === item.products.category_id)?.category_name || 'N/A'}
                    </td>
                    {isAdmin && <td>{item.branches?.branch_code || 'N/A'}</td>}
                    <td>
                      <span className={`status-badge ${item.products.is_active ? 'active' : 'inactive'}`}>
                        {item.products.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn edit"
                          onClick={() => handleEdit(item)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(item.branch_product_id, item.products.product_id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
                }).filter(Boolean)}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredProducts.length > itemsPerPage && (
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                
                <div className="pagination-numbers">
                  {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }, (_, i) => i + 1).map((pageNum) => {
                    // Show first page, last page, current page, and pages around current
                    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
                    const showPage = 
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    
                    if (!showPage) {
                      // Show ellipsis
                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className="pagination-ellipsis">...</span>
                      }
                      return null
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>
        </>
      )}

      {/* Modal - always available */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Product Code *</label>
                  <input
                    type="text"
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {renderCategoryOptions()}
                  </select>
                </div>
                <div className="form-group">
                  <label>Partner</label>
                  <select
                    value={formData.partner_id}
                    onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                  >
                    <option value="">None</option>
                    {partners.map((partner) => (
                      <option key={partner.partner_id} value={partner.partner_id}>
                        {partner.partner_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isAdmin && !editingProduct && (
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
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
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

              <div className="form-group">
                <label>Specifications</label>
                <textarea
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Local Description (Branch-specific)</label>
                <textarea
                  value={formData.local_description}
                  onChange={(e) => setFormData({ ...formData, local_description: e.target.value })}
                  rows="3"
                  placeholder="Branch-specific description..."
                />
              </div>

              <div className="form-group">
                <label>Special Notes</label>
                <textarea
                  value={formData.special_notes}
                  onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                  rows="2"
                  placeholder="Special notes for this product..."
                />
              </div>

              {/* Image Upload Section */}
              <div className="form-group">
                <label>Product Images</label>
                <div className="image-upload-section">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                  <label htmlFor="image-upload" className="upload-button">
                    {uploading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                    ) : (
                      <><i className="fas fa-upload"></i> Upload Image</>
                    )}
                  </label>

                  <div className="images-grid">
                    {productImages.map((img, index) => {
                      // Skip images marked for deletion
                      if (img.toDelete) return null
                      
                      return (
                        <div key={img.image_id || `new-${index}`} className="image-preview-card">
                          <div className="image-preview-media">
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
                          <label className="image-spec-label">Image specifications</label>
                          <textarea
                            className="image-spec-input"
                            value={img.image_specifications || ''}
                            onChange={(e) => handleImageSpecChange(index, e.target.value)}
                            placeholder="One spec per line (optional)"
                            rows={2}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="form-row">
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
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    />
                    <span>Available</span>
                  </label>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_category_featured}
                      onChange={(e) => setFormData({ ...formData, is_category_featured: e.target.checked })}
                    />
                    <span>Featured in category</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="lte-btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="lte-btn" disabled={uploading}>
                  {editingProduct ? 'Update' : 'Create'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
