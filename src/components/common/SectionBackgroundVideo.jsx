import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import {
  useSectionVideoMode,
  useResponsiveVideoSrc
} from '../../hooks/useHeroVideoMode'
import './SectionBackgroundVideo.css'

/**
 * Subtle full-bleed background video for CTA panels — all viewports, lazy-loaded below fold.
 */
const SectionBackgroundVideo = ({ video, posterSrc, className = '', eager = false }) => {
  const videoRef = useRef(null)
  const canPlayVideo = useSectionVideoMode()
  const resolvedSrc = useResponsiveVideoSrc(video)
  const showVideo = canPlayVideo && Boolean(resolvedSrc)

  const [containerRef, inView] = useInView({
    triggerOnce: true,
    rootMargin: '150px',
    skip: !showVideo || eager
  })

  const shouldLoadVideo = showVideo && (eager || inView)

  useEffect(() => {
    const el = videoRef.current
    if (!shouldLoadVideo || !el) return undefined

    const playPromise = el.play()
    if (playPromise?.catch) {
      playPromise.catch(() => {})
    }

    return undefined
  }, [shouldLoadVideo, resolvedSrc])

  if (!showVideo) return null

  const poster = video?.poster || posterSrc

  return (
    <div
      ref={containerRef}
      className={`section-bg-video ${className}`.trim()}
      aria-hidden="true"
      style={poster && !shouldLoadVideo ? { backgroundImage: `url(${poster})` } : undefined}
    >
      <video
        ref={videoRef}
        className="section-bg-video__el"
        src={shouldLoadVideo ? resolvedSrc : undefined}
        poster={poster}
        muted
        playsInline
        autoPlay
        loop
        preload={eager ? 'metadata' : 'none'}
        tabIndex={-1}
      />
      <div className="section-bg-video__overlay" />
    </div>
  )
}

export default SectionBackgroundVideo
