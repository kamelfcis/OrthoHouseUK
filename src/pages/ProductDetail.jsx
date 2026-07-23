import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getBranchDataSnapshot } from '../lib/branchDataCache'
import { toPublicStorageUrl } from '../lib/storageUrl'
import SEO from '../components/SEO/SEO'
import { productDetail } from '../content/products'
import { generateProductSchema, generateBreadcrumbSchema } from '../utils/seoData'
import ProductImageLightbox from '../components/product/ProductImageLightbox'
import './ProductDetail.css'

const PSI_PRODUCT_ID = 76

const ProductDetail = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [productImages, setProductImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ukBranch, setUkBranch] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [parentCategoryName, setParentCategoryName] = useState(null)
  const [failedImageUrls, setFailedImageUrls] = useState(() => new Set())
  const lightboxFocusReturnRef = useRef(null)

  const markImageFailed = useCallback((url) => {
    if (!url) return
    setFailedImageUrls((prev) => {
      if (prev.has(url)) return prev
      const next = new Set(prev)
      next.add(url)
      return next
    })
  }, [])

  const handleProductImageError = useCallback(
    (event, url) => {
      event.currentTarget.onerror = null
      markImageFailed(url)
    },
    [markImageFailed]
  )

  const openLightboxAt = useCallback((index, event) => {
    lightboxFocusReturnRef.current = event?.currentTarget || document.activeElement
    setSelectedImageIndex(index)
    setLightboxOpen(true)
  }, [])

  const handleLightboxKeyOpen = useCallback((event, index) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openLightboxAt(index, event)
    }
  }, [openLightboxAt])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const resolveParentCategory = async (category) => {
      if (!category?.parent_id) {
        setParentCategoryName(null)
        return
      }
      try {
        const { data, error: parentError } = await supabase
          .from('product_categories')
          .select('category_name')
          .eq('category_id', category.parent_id)
          .maybeSingle()

        if (parentError) throw parentError
        setParentCategoryName(data?.category_name || null)
      } catch (err) {
        console.error('Error fetching parent category:', err)
        setParentCategoryName(null)
      }
    }

    const getProductImageUrl = (img) => {
      if (!img?.image_url) return null
      return toPublicStorageUrl('product-images', img.image_url, {
        cacheKey: img.image_id ?? img.created_at ?? img.image_url
      })
    }

    // Small rendition for the thumbnail strip; main image + lightbox stay full-res.
    const getProductThumbUrl = (img) => {
      if (!img?.image_url) return null
      return toPublicStorageUrl('product-images', img.image_url, {
        width: 240,
        quality: 70,
        cacheKey: img.image_id ?? img.created_at ?? img.image_url
      })
    }

    const fetchProductDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        setParentCategoryName(null)
        setProductImages([])
        setSelectedImageIndex(0)
        setLightboxOpen(false)
        setFailedImageUrls(new Set())
        
        const productId = parseInt(id)
        if (isNaN(productId)) {
          setError('Invalid product ID')
          return
        }

        // Prefer shared branch snapshot; fall back to a trimmed query
        let branch = getBranchDataSnapshot('UK').data?.branch
        if (!branch) {
          const { data, error: branchError } = await supabase
            .from('branches')
            .select('branch_id, branch_code, branch_name, is_active')
            .eq('branch_code', 'UK')
            .eq('is_active', true)
            .maybeSingle()

          if (branchError) throw branchError
          if (!data) throw new Error('UK branch not found')
          branch = data
        }
        
        setUkBranch(branch)

        const productSelect = `
          product_id,
          product_name,
          product_code,
          description,
          specifications,
          category_id,
          product_categories (category_id, category_name, parent_id),
          partners (partner_id, partner_name)
        `

        // Fetch product details with category and partner
        const { data: branchProduct, error: productError } = await supabase
          .from('branch_products')
          .select(`
            local_description,
            special_notes,
            products (${productSelect})
          `)
          .eq('branch_id', branch.branch_id)
          .eq('product_id', productId)
          .eq('is_available', true)
          .eq('is_public', true)
          .maybeSingle()

        if (productError || !branchProduct?.products) {
          if (productError) {
            console.error('Supabase error:', productError)
          }
          // If product not found, try to fetch just the product without branch filter
          const { data: productData, error: directProductError } = await supabase
            .from('products')
            .select(productSelect)
            .eq('product_id', productId)
            .eq('is_active', true)
            .maybeSingle()

          if (directProductError || !productData) {
            const message =
              productError?.message ||
              directProductError?.message ||
              'Product not found for UK branch'
            throw new Error(message)
          }

          // Use product data even if not in branch_products
          setProduct({
            ...productData,
            branchProduct: {
              local_description: null,
              special_notes: null
            }
          })
          await resolveParentCategory(productData.product_categories)
        } else {
          setProduct({
            ...branchProduct.products,
            branchProduct: branchProduct
          })
          await resolveParentCategory(branchProduct.products.product_categories)
        }

        // Fetch all product images for UK branch
        const { data: images, error: imagesError } = await supabase
          .from('product_images')
          .select(
            'image_id, image_url, image_alt_text, image_specifications, is_primary, image_order, created_at'
          )
          .eq('branch_id', branch.branch_id)
          .eq('product_id', productId)
          .order('is_primary', { ascending: false })
          .order('image_order', { ascending: true })

        if (imagesError) {
          console.error('Error fetching product images:', imagesError)
          setProductImages([])
        } else if (images && images.length > 0) {
          const imageObjects = images
            .map(img => ({
              url: getProductImageUrl(img),
              thumbUrl: getProductThumbUrl(img),
              specifications: img.image_specifications,
              alt: img.image_alt_text,
            }))
            .filter(img => img.url !== null)
          setProductImages(imageObjects)
        } else {
          setProductImages([])
        }
      } catch (err) {
        console.error('Error fetching product details:', err)
        setError(err.message || 'Failed to load product information')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProductDetails()
    } else {
      setError('No product ID provided')
      setLoading(false)
    }
  }, [id])

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <h2>{productDetail.loading}</h2>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="error-state">
          <h2>{productDetail.notFound}</h2>
          <p>{error || productDetail.notFoundDefault}</p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
            Product ID: {id} | Branch: UK
          </p>
          <Link to="/products" className="lte-btn">
            <span className="lte-btn-inner">
              <span>{productDetail.backToProducts}</span>
            </span>
          </Link>
        </div>
      </div>
    )
  }

  const leafCategoryName = product.product_categories?.category_name || 'General'
  const categoryName = parentCategoryName
    ? `${parentCategoryName} › ${leafCategoryName}`
    : leafCategoryName
  const partnerName = product.partners?.partner_name
  const summaryText = product.branchProduct?.local_description || product.description
  const activeSpecs = productImages[selectedImageIndex]?.specifications?.trim() || product.specifications
  const showPsiContact = product.product_id === PSI_PRODUCT_ID
  const activeImage = productImages[selectedImageIndex]
  const activeImageFailed = activeImage?.url ? failedImageUrls.has(activeImage.url) : false

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Products', url: `${siteUrl}/products` },
    { name: product.product_name, url: `${siteUrl}/products/${product.product_id}` }
  ])

  const productSchema = generateProductSchema({
    ...product,
    image: productImages[0]?.url || null
  }, ukBranch)
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [productSchema, breadcrumbs]
  }

  return (
    <div className="product-detail-page">
      <SEO
        title={product.product_name}
        description={summaryText || product.description || productDetail.seoFallback(product.product_name, categoryName)}
        keywords={`${product.product_name}, ${categoryName}, orthopaedic implants, trauma systems, ${partnerName || ''}`}
        image={productImages[0]?.url || null}
        url={`${siteUrl}/products/${product.product_id}`}
        structuredData={structuredData}
      />
      <div className="product-detail-hero">
        <span className="product-hero-grid" aria-hidden="true"></span>
        <span className="product-hero-scanline" aria-hidden="true"></span>
        <span className="product-hero-corner product-hero-corner--tl" aria-hidden="true"></span>
        <span className="product-hero-corner product-hero-corner--br" aria-hidden="true"></span>
        <div className="container">
          <Link to="/products" className="product-back-link">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Products</span>
          </Link>

          <div className="product-hero-tags">
            {categoryName && <span className="product-tag">{categoryName}</span>}
            {partnerName && <span className="product-tag tag-partner">{partnerName}</span>}
          </div>

          <h1 className="product-hero-title">{product.product_name}</h1>

          <div className="product-hero-stats">
            {ukBranch?.branch_name && (
              <div className="hero-stat">
                <i className="fas fa-map-marker-alt"></i>
                <span>{productDetail.stats.availableIn(ukBranch.branch_name)}</span>
              </div>
            )}
            {partnerName && (
              <div className="hero-stat">
                <i className="fas fa-handshake"></i>
                <span>{productDetail.stats.partneredWith(partnerName)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="product-detail-section">
        <div className="container">
          <div className="product-detail-content">
            {/* Product Images */}
            <div className="product-images-section">
              {productImages && productImages.length > 0 ? (
                <>
                  <div className="product-main-image-container">
                    <div
                      className={`product-image-zoom-container${activeImageFailed ? ' product-image-zoom-container--placeholder' : ''}`}
                      role={activeImageFailed ? undefined : 'button'}
                      tabIndex={activeImageFailed ? -1 : 0}
                      aria-label={
                        activeImageFailed
                          ? `${product.product_name} image unavailable`
                          : `View ${product.product_name} image ${selectedImageIndex + 1} fullscreen`
                      }
                      onClick={activeImageFailed ? undefined : (event) => openLightboxAt(selectedImageIndex, event)}
                      onKeyDown={
                        activeImageFailed
                          ? undefined
                          : (event) => handleLightboxKeyOpen(event, selectedImageIndex)
                      }
                    >
                      {activeImageFailed ? (
                        <div className="product-image-placeholder product-image-placeholder--inline" aria-hidden="true">
                          <i className="fas fa-image"></i>
                        </div>
                      ) : (
                        <img
                          src={activeImage?.url}
                          alt={`${product.product_name} - Image ${selectedImageIndex + 1}`}
                          className="product-detail-image"
                          fetchpriority="high"
                          decoding="async"
                          draggable={false}
                          onError={(event) => handleProductImageError(event, activeImage?.url)}
                        />
                      )}
                      {!activeImageFailed && (
                        <span className="product-image-expand-hint" aria-hidden="true">
                          <i className="fas fa-expand"></i>
                        </span>
                      )}
                    </div>
                    {productImages.length > 1 && (
                      <div className="image-navigation" onClick={(event) => event.stopPropagation()}>
                        <button
                          className="nav-button prev"
                          onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}
                          aria-label="Previous image"
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <span className="image-counter">
                          {selectedImageIndex + 1} / {productImages.length}
                        </span>
                        <button
                          className="nav-button next"
                          onClick={() => setSelectedImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                          aria-label="Next image"
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  {productImages.length > 1 && (
                    <div className="product-thumbnails-grid">
                      {productImages.map((image, index) => {
                        const thumbFailed = image.url ? failedImageUrls.has(image.url) : false

                        return (
                          <div
                            key={index}
                            role={thumbFailed ? undefined : 'button'}
                            tabIndex={thumbFailed ? -1 : 0}
                            className={`thumbnail-item ${selectedImageIndex === index ? 'active' : ''}${thumbFailed ? ' thumbnail-item--placeholder' : ''}`}
                            aria-label={
                              thumbFailed
                                ? `${product.product_name} thumbnail ${index + 1} unavailable`
                                : `View ${product.product_name} image ${index + 1} fullscreen`
                            }
                            aria-current={selectedImageIndex === index ? 'true' : undefined}
                            onClick={thumbFailed ? () => setSelectedImageIndex(index) : (event) => openLightboxAt(index, event)}
                            onKeyDown={
                              thumbFailed
                                ? undefined
                                : (event) => handleLightboxKeyOpen(event, index)
                            }
                          >
                            {thumbFailed ? (
                              <div
                                className="product-image-placeholder product-image-placeholder--thumb"
                                aria-hidden="true"
                              >
                                <i className="fas fa-image"></i>
                              </div>
                            ) : (
                              <img
                                src={image.thumbUrl || image.url}
                                alt={`${product.product_name} - Thumbnail ${index + 1}`}
                                className="product-thumb-image"
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                                onError={(event) => {
                                  // Retry the full-resolution image once if the
                                  // resized thumbnail rendition fails.
                                  if (
                                    image.thumbUrl &&
                                    event.currentTarget.src !== image.url
                                  ) {
                                    event.currentTarget.src = image.url
                                    return
                                  }
                                  handleProductImageError(event, image.url)
                                }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <ProductImageLightbox
                    open={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                    index={selectedImageIndex}
                    onIndexChange={setSelectedImageIndex}
                    productImages={productImages}
                    productName={product.product_name}
                    focusReturnRef={lightboxFocusReturnRef}
                  />
                </>
              ) : (
                <div className="product-image-placeholder">
                  <i className="fas fa-image"></i>
                  <p>{productDetail.noImage}</p>
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="product-info-section">
              <div className="product-content">
                <div className="product-info-cards">
                  {categoryName && (
                    <div className="info-card">
                      <span className="info-card-label">{productDetail.labels.category}</span>
                      <span className="info-card-value">{categoryName}</span>
                    </div>
                  )}
                  {partnerName && (
                    <div className="info-card">
                      <span className="info-card-label">{productDetail.labels.partner}</span>
                      <span className="info-card-value">{partnerName}</span>
                    </div>
                  )}
                </div>

                {(product.description || product.branchProduct?.local_description) && (
                  <div className="content-block">
                    <h3 className="content-title">
                      <i className="fas fa-align-left"></i>
                      {productDetail.labels.overview}
                    </h3>
                    <p className="product-description-text">
                      {product.branchProduct?.local_description || product.description}
                    </p>
                  </div>
                )}

                {activeSpecs && (
                  <div className="content-block">
                    <h3 className="content-title">
                      <i className="fas fa-list-ul"></i>
                      {productDetail.labels.specifications}
                    </h3>
                    <ul className="specifications-list">
                      {activeSpecs.split('\n').filter(spec => spec.trim()).map((spec, index) => (
                        <li key={index}>{spec.trim()}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.branchProduct?.special_notes && (
                  <div className="content-block highlight-block">
                    <h3 className="content-title">
                      <i className="fas fa-info-circle"></i>
                      {productDetail.labels.specialNotes}
                    </h3>
                    <p className="special-notes-text">{product.branchProduct.special_notes}</p>
                  </div>
                )}
              </div>

              <div className="product-actions">
                <Link to="/products" className="back-button">
                  <i className="fas fa-arrow-left"></i>
                  <span>{productDetail.backToProducts}</span>
                </Link>
                {showPsiContact && (
                  <Link to="/contact" className="psi-contact-button">
                    <i className="fas fa-envelope"></i>
                    <span>Contact Us For PSI</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail

