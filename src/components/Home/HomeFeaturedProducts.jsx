import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, A11y } from 'swiper/modules'
import SectionHeading from '../common/SectionHeading'
import { toPublicStorageUrl } from '../../lib/storageUrl'
import { homeFeaturedProducts } from '../../content/home'
import 'swiper/css'
import 'swiper/css/pagination'
import './HomeFeaturedProducts.css'

const FEATURED_LIMIT = 12

const sortBranchProducts = (branchProducts = []) => {
  return [...branchProducts].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
    if (dateA !== dateB) return dateB - dateA

    const idA = Number(a.products?.product_id ?? 0)
    const idB = Number(b.products?.product_id ?? 0)
    return idB - idA
  })
}

const buildFeaturedProducts = (branchData, imageMap) => {
  const branchProducts = sortBranchProducts(branchData?.products || [])

  return branchProducts
    .map((bp) => {
      const product = bp.products
      if (!product?.product_id) return null

      const image =
        imageMap[product.product_id] ||
        toPublicStorageUrl('product-images', product.primary_image_url)

      const partner = product.partners?.partner_name || ''
      const category = product.product_categories?.category_name || ''

      return {
        id: product.product_id,
        name: product.product_name,
        image,
        label: partner || category,
        labelType: partner ? 'partner' : category ? 'category' : null
      }
    })
    .filter(Boolean)
    .slice(0, FEATURED_LIMIT)
}

const CardArrow = () => (
  <svg
    className="home-featured-products__cta-icon"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 8h10M8.5 4.5 12 8l-3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const FeaturedProductCard = ({ product }) => {
  const handleImageError = (event) => {
    event.currentTarget.onerror = null
    event.currentTarget.style.display = 'none'
    const placeholder = event.currentTarget.parentElement?.querySelector(
      '.home-featured-products__placeholder'
    )
    if (placeholder) placeholder.style.display = 'flex'
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="home-featured-products__card"
    >
      <div className="home-featured-products__card-inner">
        <div className="home-featured-products__card-media">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              width={640}
              height={400}
              onError={handleImageError}
            />
          ) : null}
          <div
            className="home-featured-products__placeholder"
            aria-hidden="true"
            style={{ display: product.image ? 'none' : 'flex' }}
          >
            <i className="fas fa-box-medical" />
          </div>
          {product.label ? (
            <span
              className={`home-featured-products__label home-featured-products__label--overlay${product.labelType ? ` is-${product.labelType}` : ''}`}
            >
              {product.label}
            </span>
          ) : null}
        </div>
        <div className="home-featured-products__card-body">
          <h3 className="home-featured-products__card-name">{product.name}</h3>
          <span className="home-featured-products__cta">
            <span>{homeFeaturedProducts.viewProduct}</span>
            <CardArrow />
          </span>
        </div>
      </div>
    </Link>
  )
}

const FeaturedProductsSkeleton = () => (
  <div className="home-featured-products__skeleton" aria-busy="true" aria-label={homeFeaturedProducts.loading}>
    {Array.from({ length: 3 }, (_, index) => (
      <div key={index} className="home-featured-products__skeleton-card">
        <div className="home-featured-products__skeleton-image" />
        <div className="home-featured-products__skeleton-label" />
        <div className="home-featured-products__skeleton-line" />
      </div>
    ))}
    <span className="sr-only">{homeFeaturedProducts.loading}</span>
  </div>
)

const HomeFeaturedProducts = ({ branchData }) => {
  const [imageMap, setImageMap] = useState({})
  const [loading, setLoading] = useState(true)
  const prevRef = useRef(null)
  const nextRef = useRef(null)
  const paginationRef = useRef(null)
  const swiperRef = useRef(null)

  const branchId = branchData?.branch?.branch_id

  useEffect(() => {
    let isMounted = true

    const loadImages = async () => {
      if (!branchId) {
        if (isMounted) {
          setImageMap({})
          setLoading(false)
        }
        return
      }

      setLoading(true)

      try {
        const { supabase } = await import('../../lib/supabase')
        const productIds = (branchData.products || [])
          .map((bp) => bp.products?.product_id)
          .filter(Boolean)

        if (productIds.length === 0) {
          if (isMounted) setImageMap({})
          return
        }

        const { data, error } = await supabase
          .from('product_images')
          .select('product_id, image_url, is_primary, image_order')
          .eq('branch_id', branchId)
          .in('product_id', productIds)
          .order('is_primary', { ascending: false })
          .order('image_order', { ascending: true })

        if (error) throw error

        const map = {}
        data?.forEach((img) => {
          if (!map[img.product_id]) {
            map[img.product_id] = toPublicStorageUrl('product-images', img.image_url)
          }
        })

        if (isMounted) setImageMap(map)
      } catch (err) {
        console.error('Failed to load featured product images:', err)
        if (isMounted) setImageMap({})
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadImages()
    return () => { isMounted = false }
  }, [branchId, branchData?.products])

  const featuredProducts = useMemo(
    () => buildFeaturedProducts(branchData, imageMap),
    [branchData, imageMap]
  )

  const bindSwiperControls = (swiper) => {
    swiperRef.current = swiper

    if (typeof swiper.params.navigation !== 'boolean') {
      swiper.params.navigation.prevEl = prevRef.current
      swiper.params.navigation.nextEl = nextRef.current
    }

    if (typeof swiper.params.pagination !== 'boolean') {
      swiper.params.pagination.el = paginationRef.current
    }

    swiper.navigation.init()
    swiper.navigation.update()
    swiper.pagination.init()
    swiper.pagination.render()
    swiper.pagination.update()
  }

  if (!loading && featuredProducts.length === 0) {
    return null
  }

  return (
    <section
      className="home-featured-products ds-section"
      id="featured-products"
      aria-labelledby="home-featured-products-heading"
    >
      <div className="home-featured-products__band" aria-hidden="true" />

      <div className="container">
        <SectionHeading
          eyebrow={homeFeaturedProducts.eyebrow}
          title={homeFeaturedProducts.title}
          subtitle={homeFeaturedProducts.subtitle}
          titleId="home-featured-products-heading"
        />

        {loading ? (
          <FeaturedProductsSkeleton />
        ) : (
          <>
            <div className="home-featured-products__slider-wrap">
              <Swiper
                className="home-featured-products__slider"
                modules={[Navigation, Pagination, A11y]}
                slidesPerView={1.08}
                centeredSlides
                spaceBetween={16}
                speed={550}
                grabCursor
                watchOverflow
                watchSlidesProgress
                pagination={{
                  el: paginationRef.current,
                  clickable: true,
                  bulletClass: 'home-featured-products__dot',
                  bulletActiveClass: 'is-active'
                }}
                navigation={{
                  prevEl: prevRef.current,
                  nextEl: nextRef.current,
                  disabledClass: 'is-disabled'
                }}
                breakpoints={{
                  640: {
                    slidesPerView: 1.15,
                    centeredSlides: true,
                    spaceBetween: 20
                  },
                  768: {
                    slidesPerView: 2,
                    centeredSlides: false,
                    spaceBetween: 24
                  },
                  1024: {
                    slidesPerView: 3,
                    centeredSlides: false,
                    spaceBetween: 28
                  }
                }}
                onBeforeInit={bindSwiperControls}
                onSwiper={bindSwiperControls}
                a11y={{
                  prevSlideMessage: homeFeaturedProducts.prevAria,
                  nextSlideMessage: homeFeaturedProducts.nextAria
                }}
              >
                {featuredProducts.map((product, index) => (
                  <SwiperSlide
                    key={product.id}
                    aria-label={homeFeaturedProducts.slideAria(index, featuredProducts.length)}
                  >
                    <FeaturedProductCard product={product} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <div className="home-featured-products__controls">
              <button
                ref={prevRef}
                type="button"
                className="home-featured-products__nav"
                aria-label={homeFeaturedProducts.prevAria}
                onClick={() => swiperRef.current?.slidePrev()}
              >
                <i className="fas fa-chevron-left" aria-hidden="true" />
              </button>

              <div
                ref={paginationRef}
                className="home-featured-products__pagination"
                aria-label="Featured products pagination"
              />

              <button
                ref={nextRef}
                type="button"
                className="home-featured-products__nav"
                aria-label={homeFeaturedProducts.nextAria}
                onClick={() => swiperRef.current?.slideNext()}
              >
                <i className="fas fa-chevron-right" aria-hidden="true" />
              </button>
            </div>

            <div className="home-featured-products__footer">
              <Link to="/products" className="btn btn-main">
                {homeFeaturedProducts.viewAll}
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default HomeFeaturedProducts
