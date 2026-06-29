import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { motion, useReducedMotion } from 'framer-motion'
import ProductCard from '../common/ProductCard'
import SectionHeading from '../common/SectionHeading'
import { toPublicStorageUrl } from '../../lib/storageUrl'
import { homeProducts } from '../../content/home'
import './HomeProducts.css'

const FEATURED_COUNT = 8

const buildFeaturedProducts = (branchData, imageMap) => {
  const branchProducts = branchData?.products || []

  return branchProducts
    .map((bp) => {
      const product = bp.products
      if (!product?.product_id) return null

      const image =
        imageMap[product.product_id] ||
        toPublicStorageUrl('product-images', product.primary_image_url)

      return {
        id: product.product_id,
        name: product.product_name,
        category: product.product_categories?.category_name || '',
        partner: product.partners?.partner_name || '',
        image
      }
    })
    .filter(Boolean)
    .slice(0, FEATURED_COUNT)
}

const HomeProducts = ({ branchData }) => {
  const [imageMap, setImageMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [sectionRef, inView] = useInView({ rootMargin: '200px', triggerOnce: true })
  const prefersReducedMotion = useReducedMotion()

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
        console.error('Failed to load product images:', err)
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

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: inView ? { opacity: 1, y: 0 } : {},
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
      }

  if (!loading && featuredProducts.length === 0) {
    return null
  }

  return (
    <section
      className="home-products ds-section"
      id="home-products"
      ref={sectionRef}
      aria-labelledby="home-products-heading"
    >
      <div className="container">
        <SectionHeading
          eyebrow={homeProducts.eyebrow}
          title={homeProducts.title}
          subtitle={homeProducts.subtitle}
          titleId="home-products-heading"
        />

        {loading ? (
          <div className="home-products-loading" aria-busy="true">
            <div className="home-products-spinner" aria-hidden="true" />
            <p>{homeProducts.loading}</p>
          </div>
        ) : (
          <motion.div className="home-products-rail-wrap" {...motionProps}>
            <div className="home-products-rail" role="list">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </motion.div>
        )}

        <div className="home-products-footer">
          <Link to="/products" className="btn btn-main">
            {homeProducts.viewAll}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HomeProducts
