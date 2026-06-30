import { useEffect, useState } from 'react'
import { fetchSectionImages } from '../lib/unsplash'
import { runWhenIdle } from '../lib/idle'

const resolveSpecImage = ({ localImage, imageFallback, imageAlt }) => {
  if (localImage) {
    return {
      ...localImage,
      alt: localImage.alt || imageAlt || 'Orthopaedic healthcare imagery'
    }
  }
  return {
    src: imageFallback,
    alt: imageAlt || 'Orthopaedic healthcare imagery'
  }
}

const buildInitialState = (specs) =>
  Object.fromEntries(specs.map((spec) => [spec.id, resolveSpecImage(spec)]))

/**
 * Loads Unsplash section images for editorial blocks; starts with static fallbacks.
 * Pass `enabled: false` until the section is near the viewport to defer API calls.
 */
export function useSectionImages(specs, { enabled = true } = {}) {
  const [images, setImages] = useState(() => buildInitialState(specs))

  useEffect(() => {
    if (!enabled) return undefined

    const remoteSpecs = specs.filter((spec) => !spec.useLocalOnly && !spec.localImage)
    if (remoteSpecs.length === 0) return undefined

    let cancelled = false

    const cancelIdle = runWhenIdle(() => {
      fetchSectionImages(remoteSpecs).then((result) => {
        if (!cancelled) {
          setImages((prev) => ({ ...prev, ...result }))
        }
      })
    }, { timeout: 3000 })

    return () => {
      cancelled = true
      cancelIdle()
    }
    // Specs are module-level constants from content files.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return images
}

export default useSectionImages
