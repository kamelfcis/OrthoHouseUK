import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SEO from '../components/SEO/SEO'
import { productDetail } from '../content/products'
import { generateProductSchema, generateBreadcrumbSchema } from '../utils/seoData'
import './ProductDetail.css'

const ProductDetail = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [productImages, setProductImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ukBranch, setUkBranch] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const productId = parseInt(id)
        if (isNaN(productId)) {
          setError('Invalid product ID')
          setLoading(false)
          return
        }

        // Fetch UK branch
        const { data: branch, error: branchError } = await supabase
          .from('branches')
          .select('*')
          .eq('branch_code', 'UK')
          .eq('is_active', true)
          .single()

        if (branchError) throw branchError
        if (!branch) throw new Error('UK branch not found')
        
        setUkBranch(branch)

        // Fetch product details with category and partner
        const { data: branchProduct, error: productError } = await supabase
          .from('branch_products')
          .select(`
            *,
            products (
              *,
              product_categories (*),
              partners (*)
            )
          `)
          .eq('branch_id', branch.branch_id)
          .eq('product_id', productId)
          .eq('is_available', true)
          .eq('is_public', true)
          .single()

        console.log('Branch Product Data:', branchProduct)
        console.log('Product Error:', productError)

        if (productError) {
          console.error('Supabase error:', productError)
          // If product not found, try to fetch just the product without branch filter
          const { data: productData, error: directProductError } = await supabase
            .from('products')
            .select(`
              *,
              product_categories (*),
              partners (*)
            `)
            .eq('product_id', productId)
            .eq('is_active', true)
            .single()

          if (directProductError || !productData) {
            throw productError
          }

          // Use product data even if not in branch_products
          setProduct({
            ...productData,
            branchProduct: {
              local_description: null,
              special_notes: null
            }
          })
        } else {
          if (!branchProduct || !branchProduct.products) {
            setError('Product not found for UK branch')
            setLoading(false)
            return
          }

          console.log('Setting product:', {
            ...branchProduct.products,
            branchProduct: branchProduct
          })

          setProduct({
            ...branchProduct.products,
            branchProduct: branchProduct
          })
        }

        // Fetch all product images for UK branch
        const { data: images, error: imagesError } = await supabase
          .from('product_images')
          .select('*')
          .eq('branch_id', branch.branch_id)
          .eq('product_id', productId)
          .order('is_primary', { ascending: false })
          .order('image_order', { ascending: true })

        console.log('Product Images:', images)
        console.log('Images Error:', imagesError)

        if (!imagesError && images && images.length > 0) {
          const imageUrls = images.map(img => {
            const url = getProductImageUrl(img.image_url)
            console.log('Image URL:', url, 'from path:', img.image_url)
            return url
          }).filter(url => url !== null)
          setProductImages(imageUrls.length > 0 ? imageUrls : [`/assets/images/product-${productId % 6 + 1}.jpg`])
        } else {
          // Use fallback image if no images found
          console.log('No images found, using fallback')
          setProductImages([`/assets/images/product-${productId % 6 + 1}.jpg`])
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching product details:', err)
        setError(err.message || 'Failed to load product information')
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

  const getProductImageUrl = (imagePath) => {
    if (!imagePath) return null
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ljfkmtuxqaznnmmxeydf.supabase.co'
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
    return `https://${projectRef}.supabase.co/storage/v1/object/public/product-images/${imagePath}`
  }

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

  console.log('Rendering product:', product)
  console.log('Product images:', productImages)

  const categoryName = product.product_categories?.category_name || 'General'
  const partnerName = product.partners?.partner_name
  const summaryText = product.branchProduct?.local_description || product.description

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Products', url: `${siteUrl}/products` },
    { name: product.product_name, url: `${siteUrl}/products/${product.product_id}` }
  ])

  const productSchema = generateProductSchema({
    ...product,
    image: productImages.length > 0 ? productImages[0] : null
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
        image={productImages.length > 0 ? productImages[0] : null}
        url={`${siteUrl}/products/${product.product_id}`}
        structuredData={structuredData}
      />
      <div className="product-detail-hero">
        <div className="container">
          <Link to="/products" className="product-back-link">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Products</span>
          </Link>

          <div className="product-hero-tags">
            {categoryName && <span className="product-tag">{categoryName}</span>}
            {partnerName && <span className="product-tag tag-partner">{partnerName}</span>}
            {product.product_code && <span className="product-tag tag-code">{productDetail.labels.code}: {product.product_code}</span>}
          </div>

          <h1 className="product-hero-title">{product.product_name}</h1>

          {summaryText && (
            <p className="product-hero-summary">
              {summaryText.length > 280 ? `${summaryText.slice(0, 280)}…` : summaryText}
            </p>
          )}

          <div className="product-hero-stats">
            {ukBranch?.branch_name && (
              <div className="hero-stat">
                <i className="fas fa-map-marker-alt"></i>
                <span>{productDetail.stats.availableIn(ukBranch.branch_name)}</span>
              </div>
            )}
            {productImages.length > 0 && (
              <div className="hero-stat">
                <i className="fas fa-images"></i>
                <span>{productDetail.stats.imageCount(productImages.length)}</span>
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
                    <div className="product-image-zoom-container">
                      <img
                        src={productImages[selectedImageIndex]}
                        alt={`${product.product_name} - Image ${selectedImageIndex + 1}`}
                        className="product-detail-image"
                        loading="lazy"
                        onError={(e) => {
                          console.error('Image failed to load:', productImages[selectedImageIndex])
                          e.target.src = `https://via.placeholder.com/600x600/64d9b9/ffffff?text=${encodeURIComponent(product.product_name || 'Product')}`
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', productImages[selectedImageIndex])
                        }}
                      />
                    </div>
                    {productImages.length > 1 && (
                      <div className="image-navigation">
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
                      {productImages.map((image, index) => (
                        <div
                          key={index}
                          className={`thumbnail-item ${selectedImageIndex === index ? 'active' : ''}`}
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <img
                            src={image}
                            alt={`${product.product_name} - Thumbnail ${index + 1}`}
                            className="product-thumb-image"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = `https://via.placeholder.com/150x150/64d9b9/ffffff?text=${encodeURIComponent(product.product_name || 'Product')}`
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
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
                  {product.product_code && (
                    <div className="info-card">
                      <span className="info-card-label">{productDetail.labels.productCode}</span>
                      <span className="info-card-value">{product.product_code}</span>
                    </div>
                  )}
                  {partnerName && (
                    <div className="info-card">
                      <span className="info-card-label">{productDetail.labels.partner}</span>
                      <span className="info-card-value">{partnerName}</span>
                    </div>
                  )}
                  {categoryName && (
                    <div className="info-card">
                      <span className="info-card-label">{productDetail.labels.category}</span>
                      <span className="info-card-value">{categoryName}</span>
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

                {product.specifications && (
                  <div className="content-block">
                    <h3 className="content-title">
                      <i className="fas fa-list-ul"></i>
                      {productDetail.labels.specifications}
                    </h3>
                    <ul className="specifications-list">
                      {product.specifications.split('\n').filter(spec => spec.trim()).map((spec, index) => (
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail

