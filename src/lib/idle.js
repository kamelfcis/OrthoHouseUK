/** Run work after first paint — avoids blocking LCP-critical path. */
export const runWhenIdle = (fn, { timeout = 2000 } = {}) => {
  if (typeof window === 'undefined') {
    fn()
    return () => {}
  }

  if (window.requestIdleCallback) {
    const id = window.requestIdleCallback(fn, { timeout })
    return () => window.cancelIdleCallback(id)
  }

  const id = window.setTimeout(fn, Math.min(timeout, 500))
  return () => window.clearTimeout(id)
}
