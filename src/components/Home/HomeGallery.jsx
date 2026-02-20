import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCoverflow, Navigation } from 'swiper/modules'
import { supabase } from '../../lib/supabase'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/navigation'
import './HomeGallery.css'

const MAX_SLIDES = 10

const toStorageUrl = (bucket, path, { width = 800, quality = 75 } = {}) => {
  if (!path) return null

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://ljfkmtuxqaznnmmxeydf.supabase.co').replace(/\/$/, '')
  let cleanPath = path.trim().replace(/^\/+/, '')

  if (cleanPath.toLowerCase().startsWith(`${bucket.toLowerCase()}/`)) {
    cleanPath = cleanPath.substring(bucket.length + 1)
  }

  if (/^https?:\/\//i.test(cleanPath)) {
    return cleanPath
  }

  // Use Supabase image transformations for optimized delivery
  return `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${cleanPath}?width=${width}&quality=${quality}`
}

const HomeGallery = ({ branchData }) => {
  const [gallerySlides, setGallerySlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const prevRef = useRef(null)
  const nextRef = useRef(null)
  const swiperRef = useRef(null)

  const handlePrevClick = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev()
    }
  }

  const handleNextClick = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext()
    }
  }

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
        // Only fetch product images, skip category images
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
            src: toStorageUrl('product-images', item.image_url),
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
      <section className="home-gallery-section">
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
    <section className="home-gallery-section" id="home-gallery">
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

      <div className="home-gallery-slider-wrapper">
        <Swiper
          modules={[Autoplay, EffectCoverflow, Navigation]}
          className="home-gallery-slider"
          effect="coverflow"
          centeredSlides
          loop={gallerySlides.length > 0}
          grabCursor
          speed={900}
          autoplay={{ delay: 2800, disableOnInteraction: false }}
          slidesPerView={1.05}
          spaceBetween={20}
          coverflowEffect={{ rotate: 0, stretch: 0, depth: 140, modifier: 2.6, slideShadows: false }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
            disabledClass: 'swiper-button-disabled'
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper
            setTimeout(() => {
              if (swiper && swiper.params && swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
                swiper.params.navigation.prevEl = prevRef.current
                swiper.params.navigation.nextEl = nextRef.current
                swiper.navigation.init()
                swiper.navigation.update()
              }
              if (swiper.autoplay) {
                swiper.autoplay.start()
              }
            }, 100)
          }}
          onSlideChange={() => {
            if (swiperRef.current?.autoplay) {
              swiperRef.current.autoplay.start()
            }
          }}
          onBeforeInit={(swiper) => {
            if (typeof swiper.params.navigation !== 'boolean') {
              swiper.params.navigation.prevEl = prevRef.current
              swiper.params.navigation.nextEl = nextRef.current
            }
          }}
          breakpoints={{
            480: { slidesPerView: 1.6, spaceBetween: 22 },
            768: { slidesPerView: 2.3, spaceBetween: 26 },
            1024: { slidesPerView: 3.2, spaceBetween: 30 }
          }}
        >
          {gallerySlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className="home-gallery-slide">
                <span className="home-gallery-border"></span>
                <div className="home-gallery-glow"></div>
                <img
                  src={slide.src}
                  alt={slide.alt}
                  loading="lazy"
                  decoding="async"
                  width="800"
                  height="600"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = 'https://via.placeholder.com/800x600/13293d/eff8ff?text=Gallery+image'
                  }}
                />
                <p className="home-gallery-caption">{slide.label}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="home-gallery-controls">
          <button
            ref={prevRef}
            className="home-gallery-nav home-gallery-nav-prev"
            type="button"
            aria-label="Previous gallery image"
            onClick={handlePrevClick}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <button
            ref={nextRef}
            className="home-gallery-nav home-gallery-nav-next"
            type="button"
            aria-label="Next gallery image"
            onClick={handleNextClick}
          >
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <div className="home-gallery-footer">
        <Link to="/gallery" className="home-gallery-button">
          View full gallery
        </Link>
      </div>
    </section>
  )
}

export default HomeGallery


