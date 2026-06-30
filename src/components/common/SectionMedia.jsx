import { useEffect, useRef, memo } from 'react'
import { useInView } from 'react-intersection-observer'
import {
  useSectionVideoMode,
  useResponsiveVideoSrc
} from '../../hooks/useHeroVideoMode'
import ResponsiveImage from './ResponsiveImage'
import './SectionMedia.css'

/**
 * Editorial media slot — Pexels video when opted in, Unsplash image by default.
 */
const SectionMedia = ({
  image,
  video,
  useVideo = false,
  fallbackSrc,
  alt,
  sizes = '(max-width: 768px) 100vw, 50vw',
  width = 960,
  height = 720,
  loading = 'lazy',
  eager = false,
  showCredit = false,
  creditClassName = 'section-media__credit'
}) => {
  const videoRef = useRef(null)
  const canPlayVideo = useSectionVideoMode()
  const resolvedSrc = useResponsiveVideoSrc(video)
  const showVideo = useVideo && canPlayVideo && Boolean(resolvedSrc)
  const poster = video?.poster || image?.src || fallbackSrc
  const imageAlt = image?.alt || alt || 'Orthopaedic healthcare imagery'
  const shouldLazyLoad = !eager && loading !== 'eager'

  const [containerRef, inView] = useInView({
    triggerOnce: true,
    rootMargin: '200px',
    skip: !showVideo || !shouldLazyLoad
  })

  const shouldLoadVideo = showVideo && (!shouldLazyLoad || inView)

  useEffect(() => {
    const el = videoRef.current
    if (!shouldLoadVideo || !el) return undefined

    const playPromise = el.play()
    if (playPromise?.catch) {
      playPromise.catch(() => {})
    }

    return undefined
  }, [shouldLoadVideo, resolvedSrc])

  if (showVideo) {
    return (
      <div ref={containerRef} className="section-media__frame">
        <video
          ref={videoRef}
          className="section-media__video"
          src={shouldLoadVideo ? resolvedSrc : undefined}
          poster={poster}
          muted
          playsInline
          autoPlay
          loop
          preload={shouldLazyLoad ? 'none' : 'metadata'}
          aria-hidden="true"
          tabIndex={-1}
        />
        {!shouldLoadVideo && poster && (
          <img
            className="section-media__poster"
            src={poster}
            alt=""
            aria-hidden="true"
            loading={loading}
            decoding="async"
          />
        )}
        {showCredit && video.credit && (
          <a
            href={video.credit.url}
            target="_blank"
            rel="noopener noreferrer"
            className={creditClassName}
            aria-label={`Video by ${video.credit.name} on Pexels`}
          >
            Video by {video.credit.name} on Pexels
          </a>
        )}
      </div>
    )
  }

  return (
    <ResponsiveImage
      className="section-media__image"
      image={image}
      fallbackSrc={fallbackSrc}
      alt={imageAlt}
      sizes={sizes}
      width={width}
      height={height}
      loading={loading}
    />
  )
}

export default memo(SectionMedia)
