import { useInView } from 'react-intersection-observer'

/** Trigger once when section is within rootMargin — used to defer API/media fetches. */
export const NEAR_VIEWPORT_OPTS = {
  triggerOnce: true,
  threshold: 0,
  rootMargin: '400px 0px'
}

export function useNearViewport(options = {}) {
  return useInView({ ...NEAR_VIEWPORT_OPTS, ...options })
}

export default useNearViewport
