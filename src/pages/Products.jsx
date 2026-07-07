import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/common/ProductCard'
import EmptyState from '../components/common/EmptyState'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import { productsPage } from '../content/products'
import './Products.css'

const normalizeCategoryKey = (value) =>
  String(value).toLowerCase().replace(/[^a-z0-9]/g, '')

const CATEGORY_PARAM_ALIASES = {
  foot_ankle: 'footankle',
  hand_wrist: 'handwrist',
  trauma: 'handwrist',
  elbow_shoulder: 'shoulder',
  shoulder: 'shoulder',
  arthroplasty: 'shoulder',
  bone_graft: 'bonegraft'
}

const resolveCategoryFromParam = (param, categories) => {
  if (!param || categories.length === 0) return null

  const trimmed = String(param).trim()
  if (/^\d+$/.test(trimmed)) {
    const categoryId = Number(trimmed)
    return categories.find((category) => category.category_id === categoryId)?.category_id ?? null
  }

  const aliasKey =
    CATEGORY_PARAM_ALIASES[trimmed.toLowerCase()] ?? normalizeCategoryKey(trimmed)

  const match = categories.find((category) => {
    const codeKey = normalizeCategoryKey(category.category_code)
    const nameKey = normalizeCategoryKey(category.category_name)
    return codeKey === aliasKey || nameKey === aliasKey
  })

  return match?.category_id ?? null
}

const Products = () => {
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryImages, setCategoryImages] = useState({})
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ukBranch, setUkBranch] = useState(null)
  const productsSectionRef = useRef(null)

  const scrollToProductsSection = useCallback(() => {
    setTimeout(() => {
      if (productsSectionRef.current) {
        const headerOffset = 100
        const elementPosition = productsSectionRef.current.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100)
  }, [])

  useEffect(() => {
    if (!categoryParam) {
      window.scrollTo(0, 0)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (loading || !categoryParam || categories.length === 0) return

    const categoryId = resolveCategoryFromParam(categoryParam, categories)
    if (categoryId) {
      setSelectedCategory(categoryId)
      scrollToProductsSection()
    }
  }, [loading, categoryParam, categories, scrollToProductsSection])

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
      setSelectedCategory(null)
    } else {
      setSelectedCategory(categoryId)
    }

    scrollToProductsSection()
  }

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : products

  return (
      <div className="products-page">
      <SEO
        title={pageSeo.products.title}
        description={pageSeo.products.description}
        keywords={pageSeo.products.keywords}
      />
      <div className="products-hero">
        <div className="products-hero__media" role="presentation">
          <div className="products-hero__media-inner" aria-hidden="true" />
        </div>
        <div className="products-hero__spotlights" aria-hidden="true" />
        <div className="products-hero__shine" aria-hidden="true" />
        <div className="products-hero__vignette" aria-hidden="true" />
        <div className="products-hero__overlay" aria-hidden="true" />
      </div>

      <div className="products-page-main">
        <div className="container">
          {categories.length > 0 && (
            <div className="categories-filter-section" role="group" aria-label={productsPage.filterTitle}>
              <h3 className="categories-filter-title">{productsPage.filterTitle}</h3>
              <div className="category-chips">
                {categories.map((category) => (
                  <button
                    key={category.category_id}
                    type="button"
                    className={`category-chip${selectedCategory === category.category_id ? ' is-active' : ''}`}
                    onClick={() => handleCategoryClick(category.category_id)}
                    aria-pressed={selectedCategory === category.category_id}
                  >
                    {category.category_name}
                  </button>
                ))}
              </div>
              {selectedCategory && (
                <button
                  type="button"
                  className="ds-btn ds-btn--ghost clear-category-filter"
                  onClick={() => setSelectedCategory(null)}
                >
                  <i className="fas fa-times" aria-hidden="true" /> {productsPage.clearFilter}
                </button>
              )}
            </div>
          )}

          <div ref={productsSectionRef}>
            {loading ? (
              <div className="products-skeleton-grid" aria-busy="true" aria-label={productsPage.loading}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="products-skeleton-card" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon="fa-box-open"
                title="No products found"
                message={selectedCategory ? productsPage.emptyCategory : productsPage.emptyAll}
              />
            ) : (
              <div className="products-section">
                {selectedCategory && (
                  <div className="filter-info">
                    {productsPage.filterInfo(
                      filteredProducts.length,
                      categories.find(c => c.category_id === selectedCategory)?.category_name
                    )}
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

