import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { getBranchDataSnapshot, requestBranchData } from '../lib/branchDataCache'
import { toPublicStorageUrl, toOriginalStorageUrl } from '../lib/storageUrl'
import ProductCard from '../components/common/ProductCard'
import FeaturedCategoryProduct from '../components/common/FeaturedCategoryProduct'
import EmptyState from '../components/common/EmptyState'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import { productsPage } from '../content/products'
import './Products.css'

const PRODUCT_REVEAL_EASE = [0.22, 1, 0.36, 1]

// Light per-column stagger so each row of cards settles in sequence as it
// scrolls into view, without long waits for cards further down the grid.
const GRID_STAGGER_STEP = 0.07
const GRID_STAGGER_COLUMNS = 3

const getGridItemRevealProps = (index) => ({
  initial: { opacity: 0, y: -32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: {
    duration: 0.55,
    ease: PRODUCT_REVEAL_EASE,
    delay: (index % GRID_STAGGER_COLUMNS) * GRID_STAGGER_STEP
  }
})

const featuredRevealProps = {
  initial: { opacity: 0, y: -40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: PRODUCT_REVEAL_EASE }
}

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
  if (!category) return ''
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
    return categories.find((category) => category.category_id === categoryId) ?? null
  }

  const aliasKey =
    CATEGORY_PARAM_ALIASES[trimmed.toLowerCase()] ?? normalizeCategoryKey(trimmed)

  return (
    categories.find((category) => {
      const codeKey = normalizeCategoryKey(category.category_code)
      const nameKey = normalizeCategoryKey(category.category_name)
      return codeKey === aliasKey || nameKey === aliasKey
    }) ?? null
  )
}

// Card-sized renditions keep grid payloads small; ProductDetail loads full-res.
const CARD_IMAGE_WIDTH = 640
const CARD_IMAGE_QUALITY = 75

const buildProductImageMap = (rows) => {
  const map = {}
  rows?.forEach((img) => {
    if (!map[img.product_id]) {
      map[img.product_id] = toPublicStorageUrl('product-images', img.image_url, {
        width: CARD_IMAGE_WIDTH,
        quality: CARD_IMAGE_QUALITY,
        cacheKey: img.image_id ?? img.created_at ?? img.image_url
      })
    }
  })
  return map
}

const buildCategoryImageMap = (rows) => {
  const map = {}

  const assignImage = (img) => {
    if (map[img.category_id]) return
    const url = toPublicStorageUrl('category-images', img.image_url, {
      width: CARD_IMAGE_WIDTH,
      quality: CARD_IMAGE_QUALITY,
      cacheKey: img.image_id ?? img.created_at ?? img.image_url
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

      // No stock-photo fallback: a null image shows the local CSS placeholder.
      const productImage = productImagesMap[product.product_id] || null

      return {
        id: product.product_id,
        name: product.product_name,
        code: product.product_code,
        description: product.description || bp.local_description || '',
        category: product.product_categories?.category_name || '',
        categoryId: product.category_id,
        partner: product.partners?.partner_name || '',
        image: productImage,
        isCategoryFeatured: Boolean(bp.is_category_featured)
      }
    })
    .filter(Boolean)

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const subcategoryParam = searchParams.get('subcategory')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryImages, setCategoryImages] = useState({})
  const [failedCategoryImages, setFailedCategoryImages] = useState(() => new Set())
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ukBranch, setUkBranch] = useState(null)
  const productsSectionRef = useRef(null)
  const urlSyncedRef = useRef(false)
  const prefersReducedMotion = useReducedMotion()

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

  const rootCategories = useMemo(
    () => categories.filter((c) => c.parent_id == null),
    [categories]
  )

  const getChildren = useCallback(
    (parentId) => categories.filter((c) => c.parent_id === parentId),
    [categories]
  )

  const selectedRoot = useMemo(
    () => categories.find((c) => c.category_id === selectedCategory) ?? null,
    [categories, selectedCategory]
  )

  const selectedLeaf = useMemo(
    () => categories.find((c) => c.category_id === selectedSubcategory) ?? null,
    [categories, selectedSubcategory]
  )

  const childCategories = useMemo(
    () => (selectedCategory ? getChildren(selectedCategory) : []),
    [selectedCategory, getChildren]
  )

  const hasChildren = childCategories.length > 0

  const syncUrlParams = useCallback(
    (rootId, leafId) => {
      const next = {}
      if (rootId) next.category = String(rootId)
      if (leafId) next.subcategory = String(leafId)
      setSearchParams(next, { replace: true })
    },
    [setSearchParams]
  )

  useEffect(() => {
    if (!categoryParam && !subcategoryParam) {
      window.scrollTo(0, 0)
    }
    fetchData()
  }, [])

  useEffect(() => {
    let lastFocusRefresh = 0
    const refreshIfVisible = () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastFocusRefresh < 1000) return
      lastFocusRefresh = now
      requestBranchData('UK', { force: true })
        .catch(() => {})
        .finally(() => fetchData({ soft: true }))
    }
    document.addEventListener('visibilitychange', refreshIfVisible)
    window.addEventListener('focus', refreshIfVisible)
    return () => {
      document.removeEventListener('visibilitychange', refreshIfVisible)
      window.removeEventListener('focus', refreshIfVisible)
    }
  }, [])

  useEffect(() => {
    if (loading || categories.length === 0 || urlSyncedRef.current) return

    let rootId = null
    let leafId = null

    if (subcategoryParam) {
      const leaf = resolveCategoryFromParam(subcategoryParam, categories)
      if (leaf) {
        leafId = leaf.category_id
        rootId = leaf.parent_id ?? leaf.category_id
      }
    }

    if (categoryParam) {
      const cat = resolveCategoryFromParam(categoryParam, categories)
      if (cat) {
        if (cat.parent_id != null) {
          // Legacy / deep link to a leaf via ?category=
          leafId = leafId ?? cat.category_id
          rootId = cat.parent_id
        } else {
          rootId = cat.category_id
        }
      }
    }

    if (rootId) {
      setSelectedCategory(rootId)
      setSelectedSubcategory(leafId)
      urlSyncedRef.current = true
      scrollToProductsSection()
    } else if (!categoryParam && !subcategoryParam) {
      urlSyncedRef.current = true
    }
  }, [
    loading,
    categoryParam,
    subcategoryParam,
    categories,
    scrollToProductsSection
  ])

  const fetchData = async ({ soft = false } = {}) => {
    try {
      if (!soft) setLoading(true)

      const snapshot = getBranchDataSnapshot('UK')
      const cached = snapshot.data

      let branch = cached?.branch
      if (!branch) {
        const { data, error: branchError } = await supabase
          .from('branches')
          .select('branch_id, branch_code, is_active')
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
            .select(
              'category_id, category_name, category_code, parent_id, description, is_active'
            )
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
                  local_description,
                  is_category_featured,
                  products (
                    product_id,
                    product_name,
                    product_code,
                    description,
                    category_id,
                    product_categories (category_id, category_name, category_code, parent_id),
                    partners (partner_id, partner_name)
                  )
                `)
                .eq('branch_id', branch.branch_id)
                .eq('is_available', true)
                .eq('is_public', true),

          useCachedImages
            ? Promise.resolve({ data: null, error: null })
            : supabase
                .from('product_images')
                .select('image_id, product_id, image_url, is_primary, image_order')
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
      if (!soft) setLoading(false)
    }
  }

  const handleCategoryClick = (categoryId) => {
    const children = getChildren(categoryId)

    if (selectedCategory === categoryId && !selectedSubcategory) {
      setSelectedCategory(null)
      setSelectedSubcategory(null)
      syncUrlParams(null, null)
      return
    }

    setSelectedCategory(categoryId)
    setSelectedSubcategory(null)
    syncUrlParams(categoryId, null)

    if (children.length === 0) {
      scrollToProductsSection()
    }
  }

  const handleSubcategoryClick = (subcategoryId) => {
    if (selectedSubcategory === subcategoryId) {
      setSelectedSubcategory(null)
      syncUrlParams(selectedCategory, null)
      return
    }

    setSelectedSubcategory(subcategoryId)
    syncUrlParams(selectedCategory, subcategoryId)
    scrollToProductsSection()
  }

  const handleClearFilter = () => {
    setSelectedCategory(null)
    setSelectedSubcategory(null)
    syncUrlParams(null, null)
  }

  const handleBackToParent = () => {
    setSelectedSubcategory(null)
    syncUrlParams(selectedCategory, null)
  }

  const handleCategoryImageError = (categoryId) => {
    setFailedCategoryImages((prev) => {
      if (prev.has(categoryId)) return prev
      const next = new Set(prev)
      next.add(categoryId)
      return next
    })
  }

  // Products show when: leaf selected, OR root without children selected
  const activeProductCategoryId =
    selectedSubcategory ??
    (selectedCategory && !hasChildren ? selectedCategory : null)

  const hasSelectedFilter = activeProductCategoryId !== null
  const showingSubcategoryCards = Boolean(selectedCategory && hasChildren)

  const filteredProducts = hasSelectedFilter
    ? products.filter((product) => product.categoryId === activeProductCategoryId)
    : []

  const featuredProduct = hasSelectedFilter
    ? filteredProducts.find((product) => product.isCategoryFeatured)
    : null

  const gridProducts = hasSelectedFilter
    ? filteredProducts.filter((product) => !product.isCategoryFeatured)
    : []

  const filterLabelCategory =
    selectedLeaf ||
    (selectedRoot && !hasChildren ? selectedRoot : null) ||
    {}

  const cardsToShow = showingSubcategoryCards ? childCategories : rootCategories
  const cardsAreSubcategories = showingSubcategoryCards

  const renderCategoryCard = (category, { isSubcard = false } = {}) => {
    const isActive = isSubcard
      ? selectedSubcategory === category.category_id
      : selectedCategory === category.category_id && !selectedSubcategory
    const variant = getCategoryVariant(
      isSubcard && selectedRoot ? selectedRoot : category
    )
    const supabaseImage = failedCategoryImages.has(category.category_id)
      ? null
      : categoryImages[category.category_id] ||
        (isSubcard && selectedRoot
          ? categoryImages[selectedRoot.category_id]
          : null)
    const svgSrc = supabaseImage
      ? null
      : getCategorySvg(isSubcard && selectedRoot ? getCategoryVariant(selectedRoot) : variant)
    const hasPhoto = Boolean(supabaseImage)
    const displayName = isSubcard
      ? category.category_name
      : getCategoryDisplayName(category)

    return (
      <button
        key={category.category_id}
        type="button"
        className={`category-filter-card${isActive ? ' active' : ''}${
          isSubcard ? ' category-filter-card--sub' : ''
        }`}
        onClick={() =>
          isSubcard
            ? handleSubcategoryClick(category.category_id)
            : handleCategoryClick(category.category_id)
        }
        aria-pressed={isActive}
        aria-label={`Filter by ${displayName}`}
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
              onError={(e) => {
                // Retry the full-resolution original once before the SVG fallback.
                const original = toOriginalStorageUrl(e.currentTarget.src)
                if (original) {
                  e.currentTarget.src = original
                  return
                }
                handleCategoryImageError(category.category_id)
              }}
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
        <span className="category-filter-name">{displayName}</span>
      </button>
    )
  }

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
              {(selectedCategory || selectedSubcategory) && (
                <div className="category-nav-trail" aria-label="Category navigation">
                  <button
                    type="button"
                    className="category-nav-link"
                    onClick={handleClearFilter}
                  >
                    All categories
                  </button>
                  {selectedRoot && (
                    <>
                      <span className="category-nav-sep" aria-hidden="true">›</span>
                      {selectedSubcategory ? (
                        <button
                          type="button"
                          className="category-nav-link"
                          onClick={handleBackToParent}
                        >
                          {getCategoryDisplayName(selectedRoot)}
                        </button>
                      ) : (
                        <span className="category-nav-current">
                          {getCategoryDisplayName(selectedRoot)}
                        </span>
                      )}
                    </>
                  )}
                  {selectedLeaf && (
                    <>
                      <span className="category-nav-sep" aria-hidden="true">›</span>
                      <span className="category-nav-current">
                        {selectedLeaf.category_name}
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="categories-grid">
                {cardsToShow.map((category) =>
                  renderCategoryCard(category, { isSubcard: cardsAreSubcategories })
                )}
              </div>

              {(selectedCategory || selectedSubcategory) && (
                <div className="category-filter-actions">
                  {selectedSubcategory && (
                    <button
                      type="button"
                      className="ds-btn ds-btn--ghost clear-category-filter"
                      onClick={handleBackToParent}
                    >
                      <i className="fas fa-arrow-left" aria-hidden="true" />{' '}
                      {productsPage.backToParent(getCategoryDisplayName(selectedRoot))}
                    </button>
                  )}
                  <button
                    type="button"
                    className="ds-btn ds-btn--ghost clear-category-filter"
                    onClick={handleClearFilter}
                  >
                    <i className="fas fa-times" aria-hidden="true" /> {productsPage.clearFilter}
                  </button>
                </div>
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
            ) : showingSubcategoryCards && !selectedSubcategory ? (
              <EmptyState
                icon="fa-layer-group"
                title={productsPage.selectSubcategoryTitle}
                message={productsPage.selectSubcategoryPrompt(
                  getCategoryDisplayName(selectedRoot)
                )}
              />
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
              <div className="products-section" key={activeProductCategoryId}>
                {featuredProduct && (
                  <motion.div
                    className="featured-product-reveal"
                    {...(prefersReducedMotion ? {} : featuredRevealProps)}
                  >
                    <FeaturedCategoryProduct
                      id={featuredProduct.id}
                      name={featuredProduct.name}
                      category={featuredProduct.category}
                      partner={featuredProduct.partner}
                      image={featuredProduct.image}
                    />
                  </motion.div>
                )}
                <div className="filter-info">
                  {productsPage.filterInfo(
                    filteredProducts.length,
                    selectedLeaf
                      ? selectedLeaf.category_name
                      : getCategoryDisplayName(filterLabelCategory) ||
                          filterLabelCategory.category_name ||
                          ''
                  )}
                </div>
                {gridProducts.length > 0 && (
                  <div className="products-grid" role="list">
                    {gridProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        className="product-card-reveal"
                        {...(prefersReducedMotion ? {} : getGridItemRevealProps(index))}
                      >
                        <ProductCard
                          id={product.id}
                          name={product.name}
                          category={product.category}
                          partner={product.partner}
                          image={product.image}
                          className="home-product-card--grid"
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products
