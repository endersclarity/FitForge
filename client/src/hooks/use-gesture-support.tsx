import { useEffect, useRef, useState } from 'react'

interface GestureConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinch?: (scale: number) => void
  onLongPress?: () => void
  swipeThreshold?: number
  longPressDelay?: number
}

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

export function useGestureSupport(config: GestureConfig) {
  const ref = useRef<HTMLElement>(null)
  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null)
  const [touchCurrent, setTouchCurrent] = useState<TouchPoint | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout>()
  
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onLongPress,
    swipeThreshold = 50,
    longPressDelay = 500
  } = config

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const getTouchPoint = (touch: Touch): TouchPoint => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    })

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return

      const point = getTouchPoint(touch)
      setTouchStart(point)
      setTouchCurrent(point)
      setIsLongPressing(false)

      // Start long press timer
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          setIsLongPressing(true)
          onLongPress()
        }, longPressDelay)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch || !touchStart) return

      const point = getTouchPoint(touch)
      setTouchCurrent(point)

      // Cancel long press if finger moves too much
      const deltaX = Math.abs(point.x - touchStart.x)
      const deltaY = Math.abs(point.y - touchStart.y)
      
      if ((deltaX > 10 || deltaY > 10) && longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = undefined
      }

      // Handle pinch gesture for multi-touch
      if (e.touches.length === 2 && onPinch) {
        e.preventDefault()
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        
        // Calculate scale relative to initial distance (you'd need to store initial distance)
        // For now, just use a simple calculation
        onPinch(distance / 100) // Normalize scale
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart || !touchCurrent) return

      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = undefined
      }

      // Don't handle swipes if it was a long press
      if (isLongPressing) {
        setTouchStart(null)
        setTouchCurrent(null)
        return
      }

      const deltaX = touchCurrent.x - touchStart.x
      const deltaY = touchCurrent.y - touchStart.y
      const deltaTime = touchCurrent.timestamp - touchStart.timestamp
      
      // Only process quick swipes (not slow drags)
      if (deltaTime > 300) {
        setTouchStart(null)
        setTouchCurrent(null)
        return
      }

      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      // Determine swipe direction
      if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight()
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft()
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown()
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp()
          }
        }
      }

      setTouchStart(null)
      setTouchCurrent(null)
    }

    // Add passive event listeners for better performance
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [
    touchStart,
    touchCurrent,
    isLongPressing,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onLongPress,
    swipeThreshold,
    longPressDelay
  ])

  return ref
}

// Hook for simple swipe navigation
export function useSwipeNavigation(
  onNext?: () => void,
  onPrevious?: () => void,
  options?: { threshold?: number }
) {
  return useGestureSupport({
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious,
    swipeThreshold: options?.threshold || 50
  })
}

// Hook for pull-to-refresh gesture
export function usePullToRefresh(
  onRefresh: () => void,
  options?: { threshold?: number }
) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  
  const gestureRef = useGestureSupport({
    onSwipeDown: () => {
      if (pullDistance > (options?.threshold || 100)) {
        onRefresh()
      }
      setIsPulling(false)
      setPullDistance(0)
    },
    swipeThreshold: 30
  })

  return {
    ref: gestureRef,
    isPulling,
    pullDistance
  }
}