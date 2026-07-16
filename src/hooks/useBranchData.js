import { useState, useEffect } from 'react'
import {
  getBranchDataSnapshot,
  subscribeBranchData,
  requestBranchData
} from '../lib/branchDataCache'

const useBranchData = (branchCode = 'UK') => {
  const initialSnapshot = getBranchDataSnapshot(branchCode)
  const [branchData, setBranchData] = useState(initialSnapshot.data)
  const [loading, setLoading] = useState(!initialSnapshot.data)
  const [error, setError] = useState(null)

  useEffect(() => {
    setError(null)

    const snapshot = getBranchDataSnapshot(branchCode)
    if (snapshot.data) {
      setBranchData(snapshot.data)
      setLoading(false)
    } else {
      setLoading(true)
    }

    const unsubscribe = subscribeBranchData(
      branchCode,
      (data) => {
        setBranchData(data)
        setLoading(false)
        setError(null)
      },
      (message) => {
        setError(message)
        setLoading(false)
      }
    )

    let lastFocusRefresh = 0
    const refreshIfVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return
      }
      const now = Date.now()
      if (now - lastFocusRefresh < 1000) return
      lastFocusRefresh = now
      requestBranchData(branchCode, { force: true }).catch((err) => {
        setError(err?.message || 'Failed to refresh branch data')
      })
    }

    document.addEventListener('visibilitychange', refreshIfVisible)
    window.addEventListener('focus', refreshIfVisible)

    return () => {
      unsubscribe()
      document.removeEventListener('visibilitychange', refreshIfVisible)
      window.removeEventListener('focus', refreshIfVisible)
    }
  }, [branchCode])

  return { branchData, loading, error }
}

export default useBranchData
