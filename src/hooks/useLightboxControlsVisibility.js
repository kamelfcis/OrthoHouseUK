import { useCallback, useEffect, useRef, useState } from 'react'

const HIDE_DELAY_MS = 2000

export function useLightboxControlsVisibility(isActive) {
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef(null)

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const revealControls = useCallback(() => {
    setControlsVisible(true)
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false)
    }, HIDE_DELAY_MS)
  }, [clearHideTimer])

  useEffect(() => {
    if (!isActive) {
      setControlsVisible(true)
      clearHideTimer()
      return undefined
    }

    revealControls()
    return clearHideTimer
  }, [isActive, revealControls, clearHideTimer])

  return { controlsVisible, revealControls }
}
