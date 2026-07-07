/** Session + localStorage cache for Pexels / Unsplash API payloads — speeds repeat visits. */
const SESSION_TTL_MS = 30 * 60 * 1000
const LOCAL_TTL_MS = 7 * 24 * 60 * 60 * 1000

const memoryCache = new Map()

export const readMediaCache = (key) => {
  const memory = memoryCache.get(key)
  if (memory && Date.now() - memory.timestamp <= SESSION_TTL_MS) {
    return memory.data
  }

  try {
    const raw = sessionStorage.getItem(key)
    if (raw) {
      const { data, timestamp } = JSON.parse(raw)
      if (data && Date.now() - timestamp <= SESSION_TTL_MS) {
        memoryCache.set(key, { data, timestamp })
        return data
      }
    }
  } catch {
    // sessionStorage may be unavailable
  }

  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (!data || Date.now() - timestamp > LOCAL_TTL_MS) return null
    memoryCache.set(key, { data, timestamp })
    return data
  } catch {
    return null
  }
}

export const writeMediaCache = (key, data) => {
  const entry = { data, timestamp: Date.now() }
  memoryCache.set(key, entry)
  try {
    sessionStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // sessionStorage may be unavailable or full
  }
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage may be unavailable or full
  }
}
