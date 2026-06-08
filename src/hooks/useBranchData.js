import { useState, useEffect } from 'react'
import { getBranchDataSnapshot, subscribeBranchData } from '../lib/branchDataCache'

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

    return unsubscribe
  }, [branchCode])

  return { branchData, loading, error }
}

export default useBranchData
