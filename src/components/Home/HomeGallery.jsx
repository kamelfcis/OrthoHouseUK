import { useEffect, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { toPublicStorageUrl } from '../../lib/storageUrl'
import './HomeGallery.css'

const HomeGallerySlider = lazy(() => import('./HomeGallerySlider'))

const MAX_SLIDES = 10

const HomeGallery = ({ branchData }) => {
  const [gallerySlides, setGallerySlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sectionRef, inView] = useInView({ rootMargin: '200px', triggerOnce: true })

  useEffect(() => {
    let isMounted = true

    const loadGallery = async () => {
      setLoading(true)
      setError(null)

      const branchId = branchData?.branch?.branch_id

      if (!branchId) {
        if (isMounted) {
          setGallerySlides([])
          setLoading(false)
        }
        return
      }

      try {
        const { supabase } = await import('../../lib/supabase')

        const productImagesRes = await supabase
          .from('product_images')
          .select(`
            image_id,
            image_url,
            image_alt_text,
            image_order,
            is_primary,
            products (product_name)
          `)
          .eq('branch_id', branchId)
          .order('is_primary', { ascending: false })
          .order('image_order', { ascending: true })
          .limit(MAX_SLIDES * 2)

        if (productImagesRes.error) throw productImagesRes.error

        const productSlides =
          productImagesRes.data?.map((item, index) => ({
            id: `product-${item.image_id}`,
            src: toPublicStorageUrl('product-images', item.image_url),
            alt: item.image_alt_text || item.products?.product_name || 'Product image',
            label: item.products?.product_name || 'Product spotlight',
            priority: item.is_primary ? index : index + 50
          })) ?? []

        const combinedSlides = productSlides
          .filter((slide) => slide.src)
          .sort((a, b) => a.priority - b.priority)
          .slice(0, MAX_SLIDES)

        if (isMounted) {
          setGallerySlides(combinedSlides)
        }
      } catch (err) {
        console.error('Failed to load home gallery:', err)
        if (isMounted) {
          setError(err.message || 'Failed to load gallery')
          setGallerySlides([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadGallery()

    return () => {
      isMounted = false
    }
  }, [branchData])

  if (loading) {
    return (
      <section className="home-gallery-section" ref={sectionRef}>
        <div className="home-gallery-heading">
          <span className="home-gallery-tag">Inside OrthoHouse</span>
          <h3 className="home-gallery-title">Our Gallery</h3>
          <p className="home-gallery-subtitle">Discover moments from our labs, clinics, and community outreach.</p>
        </div>
        <div className="home-gallery-loading">
          <div className="home-gallery-spinner" aria-hidden="true"></div>
          <p>Loading gallery...</p>
        </div>
      </section>
    )
  }

  if (error || gallerySlides.length === 0) {
    return null
  }

  return (
    <section className="home-gallery-section" id="home-gallery" ref={sectionRef}>
      <div className="home-gallery-ambient" aria-hidden="true">
        <span className="ambient-orb orb-left"></span>
        <span className="ambient-orb orb-right"></span>
        <span className="ambient-line line-top"></span>
        <span className="ambient-line line-bottom"></span>
      </div>

      <div className="home-gallery-heading">
        <span className="home-gallery-tag">Inside OrthoHouse</span>
        <h3 className="home-gallery-title">Our Gallery</h3>
        <p className="home-gallery-subtitle">Discover moments from our labs, clinics, and community outreach.</p>
      </div>

      {inView ? (
        <Suspense
          fallback={
            <div className="home-gallery-loading">
              <div className="home-gallery-spinner" aria-hidden="true"></div>
            </div>
          }
        >
          <HomeGallerySlider gallerySlides={gallerySlides} />
        </Suspense>
      ) : (
        <div className="home-gallery-loading" style={{ minHeight: 320 }}>
          <div className="home-gallery-spinner" aria-hidden="true"></div>
        </div>
      )}

      <div className="home-gallery-footer">
        <Link to="/gallery" className="home-gallery-button">
          View full gallery
        </Link>
      </div>
    </section>
  )
}

export default HomeGallery
