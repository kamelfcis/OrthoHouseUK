import {
  invalidateBranchData,
  broadcastBranchInvalidation
} from './branchDataCache'

/**
 * Clear public branchDataCache (memory + sessionStorage), force a refetch,
 * and notify other open tabs via BroadcastChannel.
 */
export function invalidatePublicCache(branchCode = 'UK') {
  const refetch = invalidateBranchData(branchCode)
  broadcastBranchInvalidation(branchCode)
  return refetch
}
