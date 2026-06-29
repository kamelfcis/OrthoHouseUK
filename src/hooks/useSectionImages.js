import { useEffect, useState } from 'react'
import { fetchSectionImages } from '../lib/unsplash'
import { runWhenIdle } from '../lib/idle'

const buildInitialState = (specs) =>
  Object.fromEntries(
    specs.map(({ id, imageFallback, imageAlt }) => [
      id,
      { src: imageFallback, alt: imageAlt || 'Orthopaedic healthcare imagery' }
    ])
  )

/**
 * Loads Unsplash section images for editorial blocks; starts with static fallbacks.
 */
export function useSectionImages(specs) {
  const [images, setImages] = useState(() => buildInitialState(specs))

  useEffect(() => {
    let cancelled = false

    const cancelIdle = runWhenIdle(() => {
      fetchSectionImages(specs).then((result) => {
        if (!cancelled) setImages(result)
      })
    }, { timeout: 3000 })

    return () => {
      cancelled = true
      cancelIdle()
    }
    // Specs are module-level constants from content files.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return images
}

export default useSectionImages
