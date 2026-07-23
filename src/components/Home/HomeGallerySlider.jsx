import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCoverflow, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/navigation'

const HomeGallerySlider = ({ gallerySlides }) => {
  const prevRef = useRef(null)
  const nextRef = useRef(null)
  const swiperRef = useRef(null)

  const handlePrevClick = () => {
    swiperRef.current?.slidePrev()
  }

  const handleNextClick = () => {
    swiperRef.current?.slideNext()
  }

  return (
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
            if (swiper?.params?.navigation && typeof swiper.params.navigation !== 'boolean') {
              swiper.params.navigation.prevEl = prevRef.current
              swiper.params.navigation.nextEl = nextRef.current
              swiper.navigation.init()
              swiper.navigation.update()
            }
            swiper.autoplay?.start()
          }, 100)
        }}
        onSlideChange={() => {
          swiperRef.current?.autoplay?.start()
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
                  e.currentTarget.style.visibility = 'hidden'
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
  )
}

export default HomeGallerySlider
