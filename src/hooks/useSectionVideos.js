import { useEffect, useState } from 'react'
import { fetchSectionVideos } from '../lib/pexels'
import { runWhenIdle } from '../lib/idle'

/**
 * Loads Pexels section videos for editorial blocks; starts empty until fetched.
 * Each spec: { id, videoQuery, videoFallback?, imageAlt? }
 */
export function useSectionVideos(specs, { enabled = true } = {}) {
  const [videos, setVideos] = useState({})

  useEffect(() => {
    if (!enabled || !specs?.length) return undefined

    let cancelled = false

    const cancelIdle = runWhenIdle(() => {
      fetchSectionVideos(specs).then((result) => {
        if (!cancelled) setVideos(result)
      })
    }, { timeout: 5000 })

    return () => {
      cancelled = true
      cancelIdle()
    }
    // Specs are module-level constants from content files.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return videos
}

export default useSectionVideos
