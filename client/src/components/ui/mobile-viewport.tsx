import { useEffect } from 'react'

// Mobile viewport optimization utilities
export const MOBILE_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

export interface ViewportSize {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  breakpoint: keyof typeof MOBILE_BREAKPOINTS | 'xs'
}

// Hook to get current viewport information
export function useViewport(): ViewportSize {
  const getViewportSize = (): ViewportSize => {
    const width = window.innerWidth
    const height = window.innerHeight
    
    let breakpoint: ViewportSize['breakpoint'] = 'xs'
    if (width >= MOBILE_BREAKPOINTS['2xl']) breakpoint = '2xl'
    else if (width >= MOBILE_BREAKPOINTS.xl) breakpoint = 'xl'
    else if (width >= MOBILE_BREAKPOINTS.lg) breakpoint = 'lg'
    else if (width >= MOBILE_BREAKPOINTS.md) breakpoint = 'md'
    else if (width >= MOBILE_BREAKPOINTS.sm) breakpoint = 'sm'

    return {
      width,
      height,
      isMobile: width < MOBILE_BREAKPOINTS.md,
      isTablet: width >= MOBILE_BREAKPOINTS.md && width < MOBILE_BREAKPOINTS.lg,
      isDesktop: width >= MOBILE_BREAKPOINTS.lg,
      breakpoint
    }
  }

  return getViewportSize()
}

// Component to set proper mobile viewport meta tags
export function MobileViewportProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set viewport meta tag for proper mobile rendering
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    if (!viewportMeta) {
      const meta = document.createElement('meta')
      meta.name = 'viewport'
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
      document.head.appendChild(meta)
    }

    // Prevent zoom on input focus for better UX
    const inputs = document.querySelectorAll('input, select, textarea')
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        if (window.innerWidth < MOBILE_BREAKPOINTS.md) {
          // Temporarily disable zoom on focus
          const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
          if (viewport) {
            const originalContent = viewport.content
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
            
            // Restore original viewport after blur
            input.addEventListener('blur', () => {
              viewport.content = originalContent
            }, { once: true })
          }
        }
      })
    })

    // Add iOS Safari specific fixes
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // Fix for iOS Safari viewport height issues
      const setIOSHeight = () => {
        document.documentElement.style.setProperty('--ios-vh', `${window.innerHeight * 0.01}px`)
      }
      
      setIOSHeight()
      window.addEventListener('resize', setIOSHeight)
      window.addEventListener('orientationchange', setIOSHeight)
      
      return () => {
        window.removeEventListener('resize', setIOSHeight)
        window.removeEventListener('orientationchange', setIOSHeight)
      }
    }
  }, [])

  return <>{children}</>
}

// Responsive container component with mobile-first approach
export function ResponsiveContainer({ 
  children, 
  className = '',
  maxWidth = '7xl',
  padding = 'responsive' 
}: {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
  padding?: 'none' | 'responsive' | 'mobile' | 'desktop'
}) {
  const paddingClasses = {
    none: '',
    responsive: 'px-4 sm:px-6 lg:px-8',
    mobile: 'px-4',
    desktop: 'px-8'
  }

  return (
    <div className={`max-w-${maxWidth} mx-auto ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  )
}

// Responsive grid component with mobile-first breakpoints
export function ResponsiveGrid({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'responsive',
  className = ''
}: {
  children: React.ReactNode
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'responsive'
  className?: string
}) {
  const gapClasses = {
    none: '',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    responsive: 'gap-4 sm:gap-6'
  }

  const gridClasses = [
    'grid',
    `grid-cols-${cols.xs || 1}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    gapClasses[gap],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}

// Hook for responsive visibility
export function useResponsiveVisibility() {
  const viewport = useViewport()
  
  return {
    showOnMobile: viewport.isMobile,
    showOnTablet: viewport.isTablet,
    showOnDesktop: viewport.isDesktop,
    hideOnMobile: !viewport.isMobile,
    hideOnTablet: !viewport.isTablet,
    hideOnDesktop: !viewport.isDesktop
  }
}

// Responsive text scaling utility
export function getResponsiveTextSize(size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl') {
  const sizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl',
    '2xl': 'text-xl sm:text-2xl',
    '3xl': 'text-2xl sm:text-3xl'
  }
  
  return sizeMap[size]
}