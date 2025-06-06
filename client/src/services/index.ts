/**
 * FITFORGE SERVICES - UNIFIED EXPORT FOR CROSS-AGENT INTEGRATION
 * 
 * Standardized service interfaces for Agent B (Goal Pages) and Agent D (API) consumption
 * Provides clean, typed, and performant service APIs with consistent error handling
 */

// ============================================================================
// STANDARDIZED INTERFACES
// ============================================================================

export * from './service-interfaces'

// ============================================================================
// ENHANCED SERVICES FOR AGENT INTEGRATION
// ============================================================================

// Goal Progress Services for Agent B
export { 
  enhancedGoalProgressService,
  EnhancedGoalProgressService 
} from './enhanced-goal-progress-service'

// User Preferences & Analytics for Agent D
export { 
  enhancedUserPreferencesService,
  EnhancedUserPreferencesService 
} from './enhanced-user-preferences-service'

// Performance Monitoring for All Agents
export { 
  performanceMonitoringService,
  PerformanceMonitoringService 
} from './performance-monitoring-service'

// ============================================================================
// EXISTING SERVICES (with backward compatibility)
// ============================================================================

export { GoalProgressEngine } from './goal-progress-engine'
export { localWorkoutService } from './local-workout-service'
export { analyticsService as workoutAnalyticsService } from './workout-analytics-service'
export * as goalService from './supabase-goal-service'
export { workoutService } from './supabase-workout-service'

// ============================================================================
// IMPORT ALL SERVICES FOR REGISTRY (Internal use)
// ============================================================================

import { enhancedGoalProgressService } from './enhanced-goal-progress-service'
import { enhancedUserPreferencesService } from './enhanced-user-preferences-service'
import { performanceMonitoringService } from './performance-monitoring-service'
import { localWorkoutService } from './local-workout-service'
import { analyticsService as workoutAnalyticsService } from './workout-analytics-service'

// ============================================================================
// QUICK ACCESS PATTERNS FOR AGENT CONSUMPTION
// ============================================================================

/**
 * AGENT B (Goal Pages) - Quick Access Pattern
 * Import these services for goal-related functionality
 */
export const AgentBServices = {
  goalProgress: enhancedGoalProgressService,
  performance: performanceMonitoringService
} as const

/**
 * AGENT D (API/Backend) - Quick Access Pattern  
 * Import these services for backend integration
 */
export const AgentDServices = {
  userPreferences: enhancedUserPreferencesService,
  analytics: enhancedUserPreferencesService, // Provides analytics contracts
  performance: performanceMonitoringService
} as const

/**
 * ALL AGENTS - Complete Service Registry
 * Central registry of all available services with their purposes
 */
export const ServiceRegistry = {
  // Enhanced Services (Agent Integration Ready)
  goalProgress: {
    service: enhancedGoalProgressService,
    purpose: 'Goal progress calculation with transparent formulas',
    agentConsumers: ['Agent B - Goal Pages'],
    performanceTarget: '<100ms average response'
  },
  
  userPreferences: {
    service: enhancedUserPreferencesService,
    purpose: 'User preferences and notification contracts',
    agentConsumers: ['Agent D - Notification API'],
    performanceTarget: '<50ms for cached data'
  },
  
  performance: {
    service: performanceMonitoringService,
    purpose: 'Cross-service performance monitoring and health checks',
    agentConsumers: ['All Agents'],
    performanceTarget: '<10ms for metric collection'
  },
  
  // Core Services (Legacy with enhancements)
  workout: {
    service: localWorkoutService,
    purpose: 'Workout session management and logging',
    agentConsumers: ['Agent B - Workout Pages', 'Agent D - Workout API'],
    performanceTarget: '<200ms for session operations'
  },
  
  analytics: {
    service: workoutAnalyticsService,
    purpose: 'Workout analytics and progress calculations',
    agentConsumers: ['Agent B - Progress Pages'],
    performanceTarget: '<300ms for complex analytics'
  }
} as const

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Initialize performance monitoring for a service
 * Call this when starting any service operation
 */
export function initializeServiceMonitoring(serviceName: string, methodName: string) {
  const startTime = performance.now()
  
  return {
    complete: (success: boolean, error?: string, cacheHit?: boolean) => {
      const duration = performance.now() - startTime
      performanceMonitoringService.trackServiceCall(
        serviceName,
        methodName,
        duration,
        success,
        { error, cacheHit }
      )
    }
  }
}

/**
 * Standardized error handling wrapper for service methods
 * Ensures consistent error format across all services
 */
export function withErrorHandling<T>(
  serviceName: string,
  methodName: string,
  operation: () => Promise<T>
): Promise<T> {
  return operation().catch(error => {
    performanceMonitoringService.logServiceError(
      serviceName,
      methodName,
      error
    )
    throw error
  })
}

/**
 * Cache-aware service wrapper
 * Provides consistent caching behavior across services
 */
export class ServiceCache {
  private cache = new Map<string, { data: any; expiry: number }>()
  
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300000 // 5 minutes default
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key)
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T
    }
    
    // Fetch fresh data
    const data = await fetcher()
    
    // Cache the result
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
    
    return data
  }
  
  invalidate(keyPattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key)
      }
    }
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Global service cache instance
export const serviceCache = new ServiceCache()

// ============================================================================
// INTEGRATION VALIDATION
// ============================================================================

/**
 * Validate that all required services are available and functional
 * Call this during application startup to ensure integration readiness
 */
export async function validateServiceIntegration(): Promise<{
  success: boolean
  errors: string[]
  serviceStatus: Record<string, 'available' | 'unavailable' | 'degraded'>
}> {
  const errors: string[] = []
  const serviceStatus: Record<string, 'available' | 'unavailable' | 'degraded'> = {}
  
  // Test each service
  try {
    // Test goal progress service
    const testGoal = await enhancedGoalProgressService.getGoalProgress('test-id')
    serviceStatus.goalProgress = testGoal.success ? 'available' : 'degraded'
    if (!testGoal.success) {
      errors.push(`Goal Progress Service: ${testGoal.error}`)
    }
  } catch (error) {
    serviceStatus.goalProgress = 'unavailable'
    errors.push(`Goal Progress Service: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  try {
    // Test user preferences service
    const testPrefs = await enhancedUserPreferencesService.getUserPreferencesContract('test-user')
    serviceStatus.userPreferences = testPrefs.success ? 'available' : 'degraded'
    if (!testPrefs.success) {
      errors.push(`User Preferences Service: ${testPrefs.error}`)
    }
  } catch (error) {
    serviceStatus.userPreferences = 'unavailable'
    errors.push(`User Preferences Service: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  try {
    // Test performance monitoring
    const healthCheck = await performanceMonitoringService.getSystemHealth()
    serviceStatus.performance = 'available'
  } catch (error) {
    serviceStatus.performance = 'unavailable'
    errors.push(`Performance Monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return {
    success: errors.length === 0,
    errors,
    serviceStatus
  }
}

// ============================================================================
// TYPESCRIPT UTILITY TYPES FOR AGENT INTEGRATION
// ============================================================================

// Helper type for Agent B goal page props
export type GoalPageProps = {
  goalProgress: typeof enhancedGoalProgressService
  performanceMonitor: typeof performanceMonitoringService
}

// Helper type for Agent D API endpoints
export type ApiServiceContracts = {
  userPreferences: typeof enhancedUserPreferencesService
  analytics: typeof enhancedUserPreferencesService
  performance: typeof performanceMonitoringService
}

// Service response union type for consistent typing
export type AnyServiceResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  performance?: {
    duration: number
    source: string
    cacheHit?: boolean
  }
}

// ============================================================================
// EXPORT SUMMARY FOR DOCUMENTATION
// ============================================================================

/**
 * INTEGRATION SUMMARY:
 * 
 * FOR AGENT B (Goal Pages):
 * - Import: enhancedGoalProgressService for goal progress, trends, recommendations
 * - Import: performanceMonitoringService for performance tracking
 * - All methods return ServiceResponse<T> with consistent error handling
 * 
 * FOR AGENT D (API/Backend):
 * - Import: enhancedUserPreferencesService for notification preferences
 * - Import: Analytics data contracts for API responses
 * - Import: performanceMonitoringService for system health endpoints
 * 
 * PERFORMANCE TARGETS:
 * - Goal progress calculations: <100ms
 * - User preferences: <50ms (cached)
 * - Analytics data: <200ms
 * - Performance monitoring: <10ms
 * 
 * CACHE STRATEGY:
 * - Goal progress: 5 minutes TTL
 * - User preferences: 10 minutes TTL
 * - Analytics: 5 minutes TTL
 * - Exercise data: 1 hour TTL
 */