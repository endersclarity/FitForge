// FitForge Mobile Optimizations for Muscle Heat Map
// Performance and mobile-specific optimizations
// Created: June 3, 2025

import { useEffect, useState } from 'react';

export interface MobileOptimizationHook {
  isMobile: boolean;
  isTablet: boolean;
  reducedMotion: boolean;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
  optimizedForDevice: boolean;
}

export function useMobileOptimization(): MobileOptimizationHook {
  const [deviceInfo, setDeviceInfo] = useState<MobileOptimizationHook>({
    isMobile: false,
    isTablet: false,
    reducedMotion: false,
    connectionSpeed: 'unknown',
    optimizedForDevice: false
  });

  useEffect(() => {
    // Detect device type
    const checkDevice = () => {
      const isMobile = window.innerWidth <= 768;
      const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
      
      // Check for reduced motion preference
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Estimate connection speed
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      let connectionSpeed: 'slow' | 'fast' | 'unknown' = 'unknown';
      
      if (connection) {
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          connectionSpeed = 'slow';
        } else if (connection.effectiveType === '3g' || connection.effectiveType === '4g') {
          connectionSpeed = 'fast';
        }
      }

      setDeviceInfo({
        isMobile,
        isTablet,
        reducedMotion,
        connectionSpeed,
        optimizedForDevice: isMobile || isTablet
      });
    };

    // Initial check
    checkDevice();

    // Listen for resize events
    window.addEventListener('resize', checkDevice);
    
    // Listen for reduced motion changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      mediaQuery.removeEventListener('change', checkDevice);
    };
  }, []);

  return deviceInfo;
}

export interface PerformanceOptimizationHook {
  shouldUseReducedAnimations: boolean;
  shouldLazyLoad: boolean;
  shouldUseVirtualization: boolean;
  maxRenderItems: number;
  debounceMs: number;
}

export function usePerformanceOptimization(): PerformanceOptimizationHook {
  const { isMobile, reducedMotion, connectionSpeed } = useMobileOptimization();

  return {
    shouldUseReducedAnimations: reducedMotion || connectionSpeed === 'slow',
    shouldLazyLoad: isMobile || connectionSpeed === 'slow',
    shouldUseVirtualization: false, // Not needed for muscle groups (small dataset)
    maxRenderItems: isMobile ? 50 : 100,
    debounceMs: isMobile ? 300 : 150
  };
}

// Touch optimization utilities
export const touchOptimizations = {
  // Minimum touch target size (44px recommended by Apple, 48dp by Android)
  minTouchTarget: {
    width: '44px',
    height: '44px',
    minWidth: '44px',
    minHeight: '44px'
  },

  // Touch-friendly spacing
  touchSpacing: {
    padding: '12px',
    margin: '8px'
  },

  // Prevent text selection on touch
  preventTextSelection: {
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    touchAction: 'manipulation' as const
  },

  // Optimize for touch scrolling
  smoothScrolling: {
    WebkitOverflowScrolling: 'touch' as const,
    overflowScrolling: 'touch' as const
  }
};

// Performance monitoring utilities
export function measureRenderTime(componentName: string) {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔥 ${componentName} render time: ${renderTime.toFixed(2)}ms`);
      
      // Warn if render time is too slow
      if (renderTime > 16) { // 60fps = 16.67ms per frame
        console.warn(`⚠️ ${componentName} render time (${renderTime.toFixed(2)}ms) exceeds 16ms target`);
      }
    }
    
    return renderTime;
  };
}

// Debounced state update for better performance
export function useDebouncedState<T>(initialValue: T, delay: number): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const [debouncedState, setDebouncedState] = useState<T>(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedState(state);
    }, delay);

    return () => clearTimeout(timer);
  }, [state, delay]);

  return [debouncedState, setState];
}