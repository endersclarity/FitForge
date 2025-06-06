import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileTouchProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  minTouchTarget?: boolean
  preventTextSelection?: boolean
  smoothScrolling?: boolean
}

// Component that applies mobile touch optimizations
const MobileTouch = React.forwardRef<HTMLDivElement, MobileTouchProps>(
  ({ 
    className, 
    children, 
    minTouchTarget = false,
    preventTextSelection = false,
    smoothScrolling = false,
    ...props 
  }, ref) => {
    const touchClasses = cn(
      // Base touch optimization
      "touch-action-manipulation",
      
      // Minimum touch target (44px)
      minTouchTarget && "min-h-[44px] min-w-[44px]",
      
      // Prevent text selection on touch
      preventTextSelection && "select-none",
      
      // Smooth scrolling
      smoothScrolling && "overflow-scroll scroll-smooth",
      
      className
    )

    return (
      <div
        ref={ref}
        className={touchClasses}
        style={{
          WebkitOverflowScrolling: smoothScrolling ? 'touch' : undefined,
          ...props.style
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
MobileTouch.displayName = "MobileTouch"

// Higher-order component for adding touch optimizations to any component
function withMobileTouch<T extends object>(
  Component: React.ComponentType<T>,
  options: {
    minTouchTarget?: boolean
    preventTextSelection?: boolean
    smoothScrolling?: boolean
  } = {}
) {
  const MobileTouchWrapper = React.forwardRef<any, T>((props, ref) => (
    <MobileTouch {...options}>
      <Component ref={ref} {...props} />
    </MobileTouch>
  ))
  
  MobileTouchWrapper.displayName = `withMobileTouch(${Component.displayName || Component.name})`
  
  return MobileTouchWrapper
}

// Touch-optimized interactive area component
const TouchTarget = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    interactive?: boolean
    size?: 'sm' | 'md' | 'lg'
  }
>(({ className, interactive = true, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: "min-h-[44px] min-w-[44px] p-2",
    md: "min-h-[48px] min-w-[48px] p-3", 
    lg: "min-h-[56px] min-w-[56px] p-4"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center",
        "touch-action-manipulation",
        interactive && [
          "cursor-pointer",
          "transition-colors duration-200",
          "hover:bg-accent/50",
          "active:bg-accent",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        ],
        sizeClasses[size],
        className
      )}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    />
  )
})
TouchTarget.displayName = "TouchTarget"

export { MobileTouch, withMobileTouch, TouchTarget }