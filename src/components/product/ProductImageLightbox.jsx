import { useCallback, useEffect, useMemo, useRef } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import { useLightboxControlsVisibility } from '../../hooks/useLightboxControlsVisibility'
import './ProductImageLightbox.css'

const MAX_ZOOM = 5

function ResetZoomIcon() {
  return (
    <svg className="yarl__icon pil-reset-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5V2L7 7l5 5V8c2.76 0 5 2.24 5 5a5 5 0 0 1-5 5 5.006 5.006 0 0 1-4.9-4H6.07A6.006 6.006 0 0 0 12 19c3.31 0 6-2.69 6-6s-2.69-6-6-6z"
      />
    </svg>
  )
}

const ProductImageLightbox = ({
  open,
  onClose,
  index,
  onIndexChange,
  productImages = [],
  productName = 'Product',
  focusReturnRef,
}) => {
  const zoomRef = useRef(null)
  const { controlsVisible, revealControls } = useLightboxControlsVisibility(open)

  const slides = useMemo(
    () =>
      productImages.map((image, imageIndex) => ({
        src: image.url,
        alt: image.alt || `${productName} - Image ${imageIndex + 1}`,
        thumbnail: image.url,
      })),
    [productImages, productName]
  )

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleExited = useCallback(() => {
    const target = focusReturnRef?.current
    if (target && typeof target.focus === 'function') {
      requestAnimationFrame(() => target.focus())
    }
    if (focusReturnRef) {
      focusReturnRef.current = null
    }
  }, [focusReturnRef])

  const handleEntered = useCallback(() => {
    revealControls()
  }, [revealControls])

  const handleView = useCallback(
    ({ index: nextIndex }) => {
      onIndexChange(nextIndex)
      zoomRef.current?.changeZoom(1, true)
    },
    [onIndexChange]
  )

  const handleResetZoom = useCallback(() => {
    zoomRef.current?.changeZoom(1)
    revealControls()
  }, [revealControls])

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === '0' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        zoomRef.current?.changeZoom(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [open])

  if (slides.length === 0) {
    return null
  }

  const plugins = slides.length > 1 ? [Zoom, Thumbnails, Counter] : [Zoom, Counter]

  return (
    <Lightbox
      open={open}
      close={handleClose}
      index={index}
      slides={slides}
      plugins={plugins}
      className={`product-image-lightbox${controlsVisible ? ' pil-controls-visible' : ''}`}
      carousel={{
        finite: false,
        preload: 2,
        padding: '24px',
        spacing: '12%',
        imageFit: 'contain',
      }}
      animation={{
        fade: 320,
        swipe: 420,
        navigation: 360,
        easing: {
          fade: 'cubic-bezier(0.4, 0, 0.2, 1)',
          swipe: 'cubic-bezier(0.4, 0, 0.2, 1)',
          navigation: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }}
      controller={{
        closeOnBackdropClick: true,
        closeOnEscape: true,
      }}
      noScroll={{ disabled: false }}
      zoom={{
        ref: zoomRef,
        maxZoom: MAX_ZOOM,
        scrollToZoom: true,
        zoomInMultiplier: 1.35,
        doubleClickMaxStops: 3,
        keyboardMoveDistance: 48,
      }}
      thumbnails={{
        position: 'bottom',
        width: 88,
        height: 64,
        border: 2,
        borderRadius: 10,
        padding: 2,
        gap: 10,
        vignette: true,
        hidden: false,
        showToggle: false,
      }}
      toolbar={{
        buttons: ['zoom', 'close'],
      }}
      labels={{
        Lightbox: `${productName} image gallery`,
        Close: 'Close gallery',
        Previous: 'Previous image',
        Next: 'Next image',
        'Zoom in': 'Zoom in',
        'Zoom out': 'Zoom out',
        Thumbnails: 'Product image thumbnails',
        '{index} of {total}': '{index} of {total}',
      }}
      render={{
        controls: () => (
          <button
            type="button"
            className="yarl__button pil-reset-zoom-button"
            aria-label="Reset zoom"
            title="Reset zoom (0)"
            onClick={handleResetZoom}
          >
            <ResetZoomIcon />
          </button>
        ),
        iconPrev: () => <i className="fas fa-chevron-left pil-nav-icon" aria-hidden="true" />,
        iconNext: () => <i className="fas fa-chevron-right pil-nav-icon" aria-hidden="true" />,
        iconClose: () => <i className="fas fa-times pil-nav-icon" aria-hidden="true" />,
      }}
      portal={{
        container: {
          onMouseMove: revealControls,
          onTouchStart: revealControls,
          onPointerDown: revealControls,
          onKeyDown: revealControls,
          onWheel: revealControls,
        },
      }}
      on={{
        view: handleView,
        entered: handleEntered,
        exited: handleExited,
      }}
    />
  )
}

export default ProductImageLightbox
