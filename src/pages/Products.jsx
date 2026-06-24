import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/common/ProductCard'
import SEO from '../components/SEO/SEO'
import './Products.css'

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryImages, setCategoryImages] = useState({})
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ukBranch, setUkBranch] = useState(null)
  const productsSectionRef = useRef(null)
  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.25
  })

  const heroContainerVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.85,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  }

  const heroChildVariants = {
    hidden: { opacity: 0, y: 24, skewY: 4 },
    visible: {
      opacity: 1,
      y: 0,
      skewY: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const heroLineVariants = {
    hidden: { opacity: 0, x: -36 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const heroBreadcrumbVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
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

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('category_name')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Fetch category images for UK branch
      const categoryImagesMap = {}
      if (categoriesData && categoriesData.length > 0) {
        const imagePromises = categoriesData.map(async (category) => {
          const { data: images, error: imgError } = await supabase
            .from('category_images')
            .select('*')
            .eq('category_id', category.category_id)
            .eq('branch_id', branch.branch_id)
            .order('image_order', { ascending: true })

          if (!imgError && images && images.length > 0) {
            const primaryImage = images.find(img => img.is_primary) || images[0]
            if (primaryImage) {
              const imageUrl = getImageUrl(primaryImage.image_url)
              categoryImagesMap[category.category_id] = imageUrl
            }
          }
          return null
        })

        await Promise.all(imagePromises)
      }
      setCategoryImages(categoryImagesMap)

      // Fetch products for UK branch
      const { data: branchProducts, error: productsError } = await supabase
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
        .eq('is_available', true)
        .eq('is_public', true)

      if (productsError) throw productsError

      // Fetch product images for UK branch
      const productIds = (branchProducts || [])
        .map(bp => bp.products?.product_id)
        .filter(id => id !== undefined)

      const productImagesMap = {}
      if (productIds.length > 0) {
        const { data: productImages, error: imgError } = await supabase
          .from('product_images')
          .select('*')
          .eq('branch_id', branch.branch_id)
          .in('product_id', productIds)
          .order('is_primary', { ascending: false })
          .order('image_order', { ascending: true })

        if (!imgError && productImages) {
          productImages.forEach(img => {
            if (!productImagesMap[img.product_id]) {
              const imageUrl = getProductImageUrl(img.image_url)
              productImagesMap[img.product_id] = imageUrl
            }
          })
        }
      }

      // Transform products data
      const productsList = (branchProducts || []).map(bp => {
        const product = bp.products
        if (!product) return null

        // Get product image
        let productImage = productImagesMap[product.product_id] || 
          `/assets/images/product-${product.product_id % 6 + 1}.jpg`

        return {
          id: product.product_id,
          name: product.product_name,
          code: product.product_code,
          description: product.description || product.local_description || '',
          category: product.product_categories?.category_name || '',
          categoryId: product.category_id,
          partner: product.partners?.partner_name || '',
          image: productImage
        }
      }).filter(p => p !== null)

      setProducts(productsList)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ljfkmtuxqaznnmmxeydf.supabase.co'
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
    return `https://${projectRef}.supabase.co/storage/v1/object/public/category-images/${imagePath}`
  }

  const getProductImageUrl = (imagePath) => {
    if (!imagePath) return null
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ljfkmtuxqaznnmmxeydf.supabase.co'
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
    return `https://${projectRef}.supabase.co/storage/v1/object/public/product-images/${imagePath}`
  }

  const handleCategoryClick = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null) // Deselect if same category clicked
    } else {
      setSelectedCategory(categoryId)
    }
    
    // Smooth scroll to products section
    setTimeout(() => {
      if (productsSectionRef.current) {
        const headerOffset = 100 // Account for fixed navbar if any
        const elementPosition = productsSectionRef.current.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100) // Small delay to ensure state update is processed
  }

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : products

  return (
      <div className="products-page">
      <SEO
        title="Products - Prosthetics & Orthotic Solutions"
        description="Browse our comprehensive catalog of prosthetic limbs, orthotic devices, biomedical equipment, and rehabilitation solutions. Quality products from trusted manufacturers."
        keywords="prosthetic products, orthotic devices, biomedical equipment, prosthetic limbs catalog, orthotic solutions, medical devices, rehabilitation products"
      />
      <div className="products-hero">
        <div className="products-hero__media" role="presentation" />
        <div className="products-hero__overlay" aria-hidden="true" />
        <div className="products-hero__container container">
          <motion.div
            className="products-hero__content"
            ref={heroRef}
            variants={heroContainerVariants}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
          >
            <motion.div
              className="products-hero__eyebrow"
              variants={heroChildVariants}
            >
              Product Portfolio
            </motion.div>
            <motion.h1 className="products-hero__title" variants={heroChildVariants}>
              <motion.span variants={heroLineVariants}>Precision Engineered</motion.span>
              <motion.span variants={heroLineVariants}>Prosthetic Solutions</motion.span>
            </motion.h1>
            <motion.p className="products-hero__subtitle" variants={heroChildVariants}>
              Explore our curated range of advanced prosthetics and biomedical devices designed to
              restore movement, confidence, and quality of life.
            </motion.p>
            <motion.ul className="products-hero__breadcrumbs" variants={heroBreadcrumbVariants}>
              <li><a href="/">Home</a></li>
              <li>Products</li>
            </motion.ul>
          </motion.div>
        </div>
      </div>

      <div className="lte-wc-wrapper margin-default">
        <div className="container">
          {/* Categories Filter Section */}
          {categories.length > 0 && (
            <div className="categories-filter-section">
              <h3 className="categories-filter-title">Filter by Category</h3>
              <div className="categories-grid">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.category_id}
                    className={`category-filter-card ${selectedCategory === category.category_id ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(category.category_id)}
                    initial={{ opacity: 0, y: 24, rotateX: -6 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.65, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="category-image-wrapper">
                      {categoryImages[category.category_id] ? (
                        <img
                          src={categoryImages[category.category_id]}
                          alt={category.category_name}
                          className="category-filter-image"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex'
                            }
                          }}
                        />
                      ) : null}
                      <div className="category-icon-fallback" style={{ display: categoryImages[category.category_id] ? 'none' : 'flex' }}>
                        <i className="fas fa-box"></i>
                      </div>
                    </div>
                    <h4 className="category-filter-name">{category.category_name}</h4>
                    {selectedCategory === category.category_id && (
                      <div className="category-active-indicator">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              {selectedCategory && (
                <button
                  className="clear-category-filter"
                  onClick={() => setSelectedCategory(null)}
                >
                  <i className="fas fa-times"></i> Clear Filter
                </button>
              )}
            </div>
          )}

          {/* Products Grid */}
          <div ref={productsSectionRef}>
            {loading ? (
              <div className="admin-loading">
                <div className="loading-spinner"></div>
                <h2>Loading Products...</h2>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <p>{selectedCategory ? 'No products found in this category.' : 'No products available at this time.'}</p>
              </div>
            ) : (
              <div className="products-section">
                {selectedCategory && (
                  <div className="filter-info">
                    Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} in{' '}
                    <strong>{categories.find(c => c.category_id === selectedCategory)?.category_name}</strong>
                  </div>
                )}
                <div className="products-grid" role="list">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      category={product.category}
                      partner={product.partner}
                      image={product.image}
                      className="home-product-card--grid"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products

