import { useEffect, useState, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCoverflow, Navigation } from 'swiper/modules'
import { supabase } from '../../lib/supabase'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import './HeroPartnersCarousel.css'

const HeroPartnersCarousel = ({ branchData }) => {
  const [partnerLogos, setPartnerLogos] = useState([])
  const prevRef = useRef(null)
  const nextRef = useRef(null)
  const swiperRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    const loadPartnerLogos = async () => {
      if (!branchData?.partners || branchData.partners.length === 0) {
        if (isMounted) setPartnerLogos([])
        return
      }

      const seen = new Set()
      const logos = []
      const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://ljfkmtuxqaznnmmxeydf.supabase.co').replace(/\/$/, '')
      const storageBase = `${supabaseUrl}/storage/v1/render/image/public/partner-logos`
      const imgParams = '?width=240&quality=75'

      await Promise.all(
        branchData.partners.map(async (branchPartner, index) => {
          const partner = branchPartner.partners
          if (!partner?.logo_url) return

          const partnerName = partner.partner_name || 'Partner'
          let storagePath = partner.logo_url.trim()
          if (!storagePath) return

          storagePath = storagePath.replace(/^\/+/, '')

          let finalUrl = storagePath

          try {
            if (!/^https?:\/\//i.test(storagePath)) {
              const normalizedPath = storagePath
              const { data: imageData } = await supabase.storage
                .from('partner-logos')
                .getPublicUrl(normalizedPath)

              if (imageData?.publicUrl) {
                finalUrl = imageData.publicUrl
              } else {
                finalUrl = `${storageBase}/${normalizedPath.replace(/^partner-logos\//i, '')}`
              }
            }
          } catch (error) {
            console.warn('Failed to resolve partner logo URL, using fallback path:', error)
            finalUrl = /^https?:\/\//i.test(storagePath)
              ? storagePath
              : `${storageBase}/${storagePath.replace(/^partner-logos\//i, '')}`
          }

          if (!/^https?:\/\//i.test(finalUrl)) {
            finalUrl = `${storageBase}/${finalUrl.replace(/^partner-logos\//i, '')}`
          }

          // Append image transform params for optimized delivery
          if (finalUrl.includes(supabaseUrl) && !finalUrl.includes('?')) {
            finalUrl = finalUrl + imgParams
          }

          if (seen.has(finalUrl)) return
          seen.add(finalUrl)

          logos.push({
            id: partner.partner_id ?? `partner-${index}`,
            name: partnerName,
            url: finalUrl
          })
        })
      )

      if (isMounted) {
        setPartnerLogos(logos)
      }
    }

    loadPartnerLogos()

    return () => {
      isMounted = false
    }
  }, [branchData])

  // Update navigation buttons when swiper is ready
  useEffect(() => {
    if (swiperRef.current && prevRef.current && nextRef.current) {
      const swiper = swiperRef.current
      if (swiper.params && swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
        swiper.params.navigation.prevEl = prevRef.current
        swiper.params.navigation.nextEl = nextRef.current
        if (swiper.navigation) {
          swiper.navigation.init()
          swiper.navigation.update()
        }
      }
    }
  }, [partnerLogos])

  // Add click handlers as fallback for navigation buttons
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

  if (partnerLogos.length === 0) {
    return null
  }

  return (
    <section className="hero-partners-section">
      <div className="hero-partners-ambient" aria-hidden="true">
        <span className="ambient-orb orb-left"></span>
        <span className="ambient-orb orb-right"></span>
        <span className="ambient-line line-top"></span>
        <span className="ambient-line line-bottom"></span>
      </div>

      <div className="hero-partners-heading">
        <span className="hero-partners-tag">Trusted by innovators</span>
        <h3 className="hero-partners-title">Global brands that rely on OrthoHouse</h3>
        <p className="hero-partners-subtitle">Seamless collaborations with world-class manufacturers and medical pioneers.</p>
      </div>

      <Swiper
        modules={[Autoplay, EffectCoverflow, Navigation]}
        className="hero-partners-slider"
        effect="coverflow"
        centeredSlides
        loop={partnerLogos.length > 0}
        loopAdditionalSlides={2}
        loopPreventsSliding={false}
        grabCursor
        speed={600}
        autoplay={{
          delay: 1000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
          waitForTransition: true,
          reverseDirection: false
        }}
        slidesPerView={1.15}
        spaceBetween={26}
        coverflowEffect={{ rotate: 0, stretch: 0, depth: 80, modifier: 1.5, slideShadows: false }}
        watchSlidesProgress={true}
        touchEventsTarget="container"
        allowTouchMove={true}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
          disabledClass: 'swiper-button-disabled'
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper
          // Update navigation after swiper is initialized
          setTimeout(() => {
            if (swiper && swiper.params && swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
              swiper.params.navigation.prevEl = prevRef.current
              swiper.params.navigation.nextEl = nextRef.current
              if (swiper.navigation) {
                swiper.navigation.init()
                swiper.navigation.update()
              }
            }
            // Ensure autoplay continues after manual navigation
            if (swiper && swiper.autoplay) {
              swiper.autoplay.start()
            }
          }, 100)
        }}
        onSlideChange={() => {
          // Ensure autoplay continues after slide change
          if (swiperRef.current?.autoplay) {
            swiperRef.current.autoplay.start()
          }
        }}
        onBeforeInit={(swiper) => {
          if (swiper && swiper.params && swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
            swiper.params.navigation.prevEl = prevRef.current
            swiper.params.navigation.nextEl = nextRef.current
          }
        }}
        breakpoints={{
          480: { slidesPerView: 2, spaceBetween: 22 },
          768: { slidesPerView: 3.15, spaceBetween: 26 },
          1024: { slidesPerView: 4.35, spaceBetween: 30 }
        }}
      >
        {partnerLogos.map((logo) => (
          <SwiperSlide key={logo.id}>
            <div className="hero-partner-slide">
              <span className="hero-partner-border"></span>
              <div className="hero-partner-glow"></div>
              <img
                src={logo.url}
                alt={logo.name}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = `https://via.placeholder.com/240x160/1f2a44/ffffff?text=${encodeURIComponent(logo.name)}`
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="hero-partners-controls">
        <button
          ref={prevRef}
          className="hero-partners-nav hero-partners-nav-prev"
          type="button"
          aria-label="Previous partner"
          onClick={handlePrevClick}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <button
          ref={nextRef}
          className="hero-partners-nav hero-partners-nav-next"
          type="button"
          aria-label="Next partner"
          onClick={handleNextClick}
        >
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </section>
  )
}

export default HeroPartnersCarousel
