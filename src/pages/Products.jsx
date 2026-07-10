import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getBranchDataSnapshot } from '../lib/branchDataCache'
import { toPublicStorageUrl } from '../lib/storageUrl'
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

const CATEGORY_VARIANT_MAP = {
  bonegraft: 'bonegraft',
  footankle: 'footankle',
  handwrist: 'upperlimb',
  upperlimb: 'upperlimb',
  shoulder: 'shoulder',
  knee: 'knee',
  hip: 'hip',
  spine: 'spine',
  trauma: 'trauma',
  sports: 'sports',
  arthroplasty: 'shoulder',
  instruments: 'instruments',
  biologics: 'bonegraft'
}

const CATEGORY_SVG_MAP = {
  bonegraft: '/assets/bone%20graft.svg',
  footankle: '/assets/footandankle.svg',
  shoulder: '/assets/shoulder.svg',
  upperlimb: '/assets/upperlimb.svg'
}

const CATEGORY_SORT_ORDER = ['footankle', 'shoulder', 'bonegraft', 'upperlimb']

const CATEGORY_SORT_INDEX = Object.fromEntries(
  CATEGORY_SORT_ORDER.map((variant, index) => [variant, index])
)

const CATEGORY_DISPLAY_LABELS = {
  footankle: 'Foot & Ankle',
  shoulder: 'Shoulder Arthroplasty',
  bonegraft: 'Bone Graft',
  upperlimb: 'Upper Limb Trauma'
}

const getCategoryVariant = (category) => {
  const codeKey = normalizeCategoryKey(category.category_code || '')
  const nameKey = normalizeCategoryKey(category.category_name || '')

  if (CATEGORY_VARIANT_MAP[codeKey]) return CATEGORY_VARIANT_MAP[codeKey]
  if (CATEGORY_VARIANT_MAP[nameKey]) return CATEGORY_VARIANT_MAP[nameKey]

  const matched = Object.entries(CATEGORY_VARIANT_MAP).find(
    ([key]) => nameKey.includes(key) || codeKey.includes(key)
  )
  return matched?.[1] || 'default'
}

const getCategorySvg = (variant) => CATEGORY_SVG_MAP[variant] ?? null

const getCategoryDisplayName = (category) => {
  const variant = getCategoryVariant(category)
  return CATEGORY_DISPLAY_LABELS[variant] ?? category.category_name
}

const sortProductCategories = (categories) =>
  [...categories].sort((a, b) => {
    const aOrder =
      CATEGORY_SORT_INDEX[getCategoryVariant(a)] ?? Number.MAX_SAFE_INTEGER
    const bOrder =
      CATEGORY_SORT_INDEX[getCategoryVariant(b)] ?? Number.MAX_SAFE_INTEGER

    if (aOrder !== bOrder) return aOrder - bOrder
    return String(a.category_name || '').localeCompare(String(b.category_name || ''))
  })

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

const buildProductImageMap = (rows) => {
  const map = {}
  rows?.forEach((img) => {
    if (!map[img.product_id]) {
      map[img.product_id] = toPublicStorageUrl('product-images', img.image_url)
    }
  })
  return map
}

const buildCategoryImageMap = (rows) => {
  const map = {}

  const assignImage = (img) => {
    if (map[img.category_id]) return
    const url = toPublicStorageUrl('category-images', img.image_url, {
      cacheKey: img.image_id ?? img.updated_at ?? img.image_url
    })
    if (url) map[img.category_id] = url
  }

  rows?.forEach((img) => {
    if (img.is_primary) assignImage(img)
  })
  rows?.forEach((img) => assignImage(img))

  return map
}

const transformBranchProducts = (branchProducts, productImagesMap) =>
  (branchProducts || [])
    .map((bp) => {
      const product = bp.products
      if (!product) return null

      const productImage =
        productImagesMap[product.product_id] ||
        `/assets/images/product-${(product.product_id % 6) + 1}.jpg`

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
    })
    .filter(Boolean)

const Products = () => {
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryImages, setCategoryImages] = useState({})
  const [failedCategoryImages, setFailedCategoryImages] = useState(() => new Set())
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

      const snapshot = getBranchDataSnapshot('UK')
      const cached = snapshot.data

      let branch = cached?.branch
      if (!branch) {
        const { data, error: branchError } = await supabase
          .from('branches')
          .select('*')
          .eq('branch_code', 'UK')
          .eq('is_active', true)
          .single()

        if (branchError) throw branchError
        if (!data) throw new Error('UK branch not found')
        branch = data
      }

      setUkBranch(branch)

      const useCachedProducts = Array.isArray(cached?.products)
      const useCachedImages = cached?.productImages != null

      const [categoriesResult, categoryImagesResult, productsResult, imagesResult] =
        await Promise.all([
          supabase
            .from('product_categories')
            .select('*')
            .eq('is_active', true)
            .order('category_name'),

          supabase
            .from('category_images')
            .select('image_id, category_id, image_url, is_primary, image_order')
            .eq('branch_id', branch.branch_id)
            .order('is_primary', { ascending: false })
            .order('image_order', { ascending: true }),

          useCachedProducts
            ? Promise.resolve({ data: cached.products, error: null })
            : supabase
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
                .eq('is_public', true),

          useCachedImages
            ? Promise.resolve({ data: null, error: null })
            : supabase
                .from('product_images')
                .select('*')
                .eq('branch_id', branch.branch_id)
                .order('is_primary', { ascending: false })
                .order('image_order', { ascending: true })
        ])

      if (categoriesResult.error) throw categoriesResult.error
      if (categoryImagesResult.error) throw categoryImagesResult.error
      if (productsResult.error) throw productsResult.error
      if (imagesResult.error) throw imagesResult.error

      setCategories(sortProductCategories(categoriesResult.data || []))
      setCategoryImages(buildCategoryImageMap(categoryImagesResult.data))
      setFailedCategoryImages(new Set())

      const productImagesMap = useCachedImages
        ? cached.productImages
        : buildProductImageMap(imagesResult.data)

      const productsList = transformBranchProducts(
        productsResult.data,
        productImagesMap
      )

      setProducts(productsList)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null)
      return
    }

    setSelectedCategory(categoryId)
    scrollToProductsSection()
  }

  const handleClearFilter = () => {
    setSelectedCategory(null)
  }

  const handleCategoryImageError = (categoryId) => {
    setFailedCategoryImages((prev) => {
      if (prev.has(categoryId)) return prev
      const next = new Set(prev)
      next.add(categoryId)
      return next
    })
  }

  const hasSelectedFilter = selectedCategory !== null

  const filteredProducts = hasSelectedFilter
    ? products.filter((product) => product.categoryId === selectedCategory)
    : []

  return (
      <div className="products-page">
      <SEO
        title={pageSeo.products.title}
        description={pageSeo.products.description}
        keywords={pageSeo.products.keywords}
      />
      <div className="products-page-main">
        <div className="container">
          {categories.length > 0 && (
            <div className="categories-filter-section" role="group" aria-label={productsPage.filterTitle}>
              <div className="categories-grid">
                {categories.map((category) => {
                  const isActive = selectedCategory === category.category_id
                  const variant = getCategoryVariant(category)
                  const supabaseImage = failedCategoryImages.has(category.category_id)
                    ? null
                    : categoryImages[category.category_id]
                  const svgSrc = supabaseImage ? null : getCategorySvg(variant)
                  const hasPhoto = Boolean(supabaseImage)

                  return (
                    <button
                      key={category.category_id}
                      type="button"
                      className={`category-filter-card${isActive ? ' active' : ''}`}
                      onClick={() => handleCategoryClick(category.category_id)}
                      aria-pressed={isActive}
                      aria-label={`Filter by ${getCategoryDisplayName(category)}`}
                    >
                      {isActive && (
                        <span className="category-active-indicator" aria-hidden="true">
                          <i className="fas fa-check" />
                        </span>
                      )}
                      <div
                        className={`category-watermark category-watermark--${variant}${
                          hasPhoto
                            ? ' category-watermark--has-photo'
                            : svgSrc
                              ? ' category-watermark--has-svg'
                              : ''
                        }`}
                        aria-hidden="true"
                      >
                        {hasPhoto ? (
                          <img
                            src={supabaseImage}
                            alt=""
                            className="category-watermark-photo"
                            loading="lazy"
                            decoding="async"
                            onError={() => handleCategoryImageError(category.category_id)}
                          />
                        ) : (
                          svgSrc && (
                            <img
                              src={svgSrc}
                              alt=""
                              className="category-watermark-svg"
                              loading="lazy"
                              decoding="async"
                            />
                          )
                        )}
                      </div>
                      <span className="category-filter-name">
                        {getCategoryDisplayName(category)}
                      </span>
                    </button>
                  )
                })}
              </div>
              {selectedCategory && (
                <button
                  type="button"
                  className="ds-btn ds-btn--ghost clear-category-filter"
                  onClick={handleClearFilter}
                >
                  <i className="fas fa-times" aria-hidden="true" /> {productsPage.clearFilter}
                </button>
              )}
            </div>
          )}

          <div
            ref={productsSectionRef}
            className="products-results-section"
            aria-live="polite"
            aria-atomic="true"
          >
            {loading ? (
              <div className="products-skeleton-grid" aria-busy="true" aria-label={productsPage.loading}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="products-skeleton-card" />
                ))}
              </div>
            ) : !hasSelectedFilter ? (
              <EmptyState
                icon="fa-hand-pointer"
                title={productsPage.selectCategoryTitle}
                message={productsPage.selectCategoryPrompt}
              />
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon="fa-box-open"
                title="No products found"
                message={productsPage.emptyCategory}
              />
            ) : (
              <div className="products-section">
                <div className="filter-info">
                  {productsPage.filterInfo(
                    filteredProducts.length,
                    getCategoryDisplayName(
                      categories.find((category) => category.category_id === selectedCategory) ?? {}
                    )
                  )}
                </div>
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

