/**
 * PERFORMANCE MONITORING SERVICE - Cross-Agent Performance Tracking
 * 
 * Provides consistent performance monitoring for all services
 * Tracks service calls, cache efficiency, and system health
 */

import {
  ServiceResponse,
  PerformanceContract,
  ServiceMetrics,
  SystemHealth,
  ServiceError,
  ServiceErrorCode
} from './service-interfaces'

interface ServiceCall {
  serviceName: string
  methodName: string
  startTime: number
  endTime?: number
  duration?: number
  success: boolean
  error?: string
  cacheHit?: boolean
  userId?: string
  timestamp: string
}

interface CacheMetrics {
  hits: number
  misses: number
  evictions: number
  totalSize: number
  lastEviction?: string
}

class PerformanceMonitoringService implements PerformanceContract {
  private serviceCalls: ServiceCall[] = []
  private serviceMetrics = new Map<string, ServiceMetrics>()
  private cacheMetrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0
  }
  private readonly MAX_CALL_HISTORY = 1000
  private readonly METRICS_RETENTION_MS = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Track a service call for performance monitoring
   */
  trackServiceCall(
    serviceName: string, 
    methodName: string, 
    duration: number, 
    success: boolean,
    options?: {
      error?: string
      cacheHit?: boolean
      userId?: string
    }
  ): void {
    const call: ServiceCall = {
      serviceName,
      methodName,
      startTime: performance.now() - duration,
      endTime: performance.now(),
      duration,
      success,
      error: options?.error,
      cacheHit: options?.cacheHit || false,
      userId: options?.userId,
      timestamp: new Date().toISOString()
    }

    // Add to call history
    this.serviceCalls.push(call)
    
    // Maintain call history size
    if (this.serviceCalls.length > this.MAX_CALL_HISTORY) {
      this.serviceCalls = this.serviceCalls.slice(-this.MAX_CALL_HISTORY)
    }

    // Update cache metrics if applicable
    if (options?.cacheHit !== undefined) {
      if (options.cacheHit) {
        this.cacheMetrics.hits++
      } else {
        this.cacheMetrics.misses++
      }
    }

    // Update service metrics
    this.updateServiceMetrics(serviceName)
  }

  /**
   * Get performance metrics for a specific service
   */
  async getServiceMetrics(serviceName: string): Promise<ServiceMetrics> {
    // Filter calls for this service from last 24 hours
    const cutoff = Date.now() - this.METRICS_RETENTION_MS
    const serviceCalls = this.serviceCalls.filter(call => 
      call.serviceName === serviceName && 
      new Date(call.timestamp).getTime() > cutoff
    )

    if (serviceCalls.length === 0) {
      return {
        serviceName,
        averageResponseTime: 0,
        successRate: 0,
        callCount: 0,
        errorRate: 0,
        cacheHitRate: 0,
        lastUpdated: new Date().toISOString()
      }
    }

    const totalDuration = serviceCalls.reduce((sum, call) => sum + (call.duration || 0), 0)
    const successfulCalls = serviceCalls.filter(call => call.success)
    const cacheHits = serviceCalls.filter(call => call.cacheHit).length
    const cacheRequests = serviceCalls.filter(call => call.cacheHit !== undefined).length

    const metrics: ServiceMetrics = {
      serviceName,
      averageResponseTime: Math.round(totalDuration / serviceCalls.length),
      successRate: Math.round((successfulCalls.length / serviceCalls.length) * 100),
      callCount: serviceCalls.length,
      errorRate: Math.round(((serviceCalls.length - successfulCalls.length) / serviceCalls.length) * 100),
      cacheHitRate: cacheRequests > 0 ? Math.round((cacheHits / cacheRequests) * 100) : 0,
      lastUpdated: new Date().toISOString()
    }

    // Cache the metrics
    this.serviceMetrics.set(serviceName, metrics)

    return metrics
  }

  /**
   * Get overall system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    // Get metrics for all active services
    const activeServices = [...new Set(this.serviceCalls.map(call => call.serviceName))]
    const serviceStatuses = await Promise.all(
      activeServices.map(async serviceName => {
        const metrics = await this.getServiceMetrics(serviceName)
        return {
          name: serviceName,
          status: this.determineServiceStatus(metrics),
          responseTime: metrics.averageResponseTime,
          lastCheck: metrics.lastUpdated
        }
      })
    )

    // Calculate overall system status
    const criticalServices = serviceStatuses.filter(s => s.status === 'down').length
    const degradedServices = serviceStatuses.filter(s => s.status === 'degraded').length
    
    let overallStatus: 'healthy' | 'warning' | 'critical'
    if (criticalServices > 0) {
      overallStatus = 'critical'
    } else if (degradedServices > 0) {
      overallStatus = 'warning'
    } else {
      overallStatus = 'healthy'
    }

    // Get memory and cache information
    const memoryInfo = this.getMemoryInfo()
    const cacheInfo = this.getCacheInfo()

    return {
      overallStatus,
      services: serviceStatuses,
      memory: memoryInfo,
      cache: cacheInfo
    }
  }

  /**
   * Log a service error for monitoring
   */
  logServiceError(
    serviceName: string,
    methodName: string,
    error: string | Error,
    userId?: string
  ): ServiceError {
    const serviceError: ServiceError = {
      code: 'SERVICE_ERROR',
      message: error instanceof Error ? error.message : error,
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      serviceName,
      methodName,
      userId
    }

    // Track as failed service call
    this.trackServiceCall(serviceName, methodName, 0, false, {
      error: serviceError.message,
      userId
    })

    console.error('Service Error Logged:', serviceError)
    return serviceError
  }

  /**
   * Get performance report for all services
   */
  async getPerformanceReport(): Promise<ServiceResponse<{
    summary: {
      totalCalls: number
      averageResponseTime: number
      overallSuccessRate: number
      cacheEfficiency: number
    }
    services: ServiceMetrics[]
    systemHealth: SystemHealth
    recommendations: string[]
  }>> {
    const startTime = performance.now()

    try {
      // Calculate summary metrics
      const recentCalls = this.getRecentCalls()
      const totalDuration = recentCalls.reduce((sum, call) => sum + (call.duration || 0), 0)
      const successfulCalls = recentCalls.filter(call => call.success)
      
      const summary = {
        totalCalls: recentCalls.length,
        averageResponseTime: recentCalls.length > 0 ? Math.round(totalDuration / recentCalls.length) : 0,
        overallSuccessRate: recentCalls.length > 0 ? Math.round((successfulCalls.length / recentCalls.length) * 100) : 0,
        cacheEfficiency: this.calculateCacheEfficiency()
      }

      // Get all service metrics
      const activeServices = [...new Set(recentCalls.map(call => call.serviceName))]
      const serviceMetrics = await Promise.all(
        activeServices.map(serviceName => this.getServiceMetrics(serviceName))
      )

      // Get system health
      const systemHealth = await this.getSystemHealth()

      // Generate recommendations
      const recommendations = this.generateRecommendations(summary, serviceMetrics, systemHealth)

      const duration = performance.now() - startTime

      return {
        success: true,
        data: {
          summary,
          services: serviceMetrics,
          systemHealth,
          recommendations
        },
        timestamp: new Date().toISOString(),
        performance: {
          duration,
          source: 'performance-monitoring-service'
        }
      }

    } catch (error) {
      const duration = performance.now() - startTime
      
      return {
        success: false,
        error: `Failed to generate performance report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        performance: {
          duration,
          source: 'performance-monitoring-service'
        }
      }
    }
  }

  /**
   * Reset performance metrics (for testing or maintenance)
   */
  resetMetrics(): void {
    this.serviceCalls = []
    this.serviceMetrics.clear()
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0
    }
  }

  /**
   * Track cache eviction
   */
  trackCacheEviction(size: number): void {
    this.cacheMetrics.evictions++
    this.cacheMetrics.totalSize = Math.max(0, this.cacheMetrics.totalSize - size)
    this.cacheMetrics.lastEviction = new Date().toISOString()
  }

  // Private helper methods
  private updateServiceMetrics(serviceName: string): void {
    // Trigger async metric calculation but don't wait
    this.getServiceMetrics(serviceName).catch(error => {
      console.warn(`Failed to update metrics for ${serviceName}:`, error)
    })
  }

  private determineServiceStatus(metrics: ServiceMetrics): 'up' | 'down' | 'degraded' {
    if (metrics.callCount === 0) return 'down'
    if (metrics.successRate < 50) return 'down'
    if (metrics.successRate < 90 || metrics.averageResponseTime > 1000) return 'degraded'
    return 'up'
  }

  private getMemoryInfo() {
    // Simplified memory info - in production would use actual memory monitoring
    const used = performance.memory?.usedJSHeapSize || 50000000 // ~50MB default
    const total = performance.memory?.totalJSHeapSize || 100000000 // ~100MB default
    
    return {
      used: Math.round(used / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      percentage: Math.round((used / total) * 100)
    }
  }

  private getCacheInfo() {
    const total = this.cacheMetrics.hits + this.cacheMetrics.misses
    
    return {
      hitRate: total > 0 ? Math.round((this.cacheMetrics.hits / total) * 100) : 0,
      size: this.cacheMetrics.totalSize,
      evictions: this.cacheMetrics.evictions
    }
  }

  private getRecentCalls(hours: number = 1): ServiceCall[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return this.serviceCalls.filter(call => 
      new Date(call.timestamp).getTime() > cutoff
    )
  }

  private calculateCacheEfficiency(): number {
    const total = this.cacheMetrics.hits + this.cacheMetrics.misses
    return total > 0 ? Math.round((this.cacheMetrics.hits / total) * 100) : 0
  }

  private generateRecommendations(
    summary: any,
    services: ServiceMetrics[],
    health: SystemHealth
  ): string[] {
    const recommendations: string[] = []

    // Performance recommendations
    if (summary.averageResponseTime > 500) {
      recommendations.push('Consider implementing caching for slow operations (avg response time > 500ms)')
    }

    if (summary.cacheEfficiency < 70) {
      recommendations.push('Cache hit rate is low - review caching strategy and TTL settings')
    }

    if (summary.overallSuccessRate < 95) {
      recommendations.push('Success rate below 95% - investigate error patterns and improve error handling')
    }

    // Service-specific recommendations
    services.forEach(service => {
      if (service.errorRate > 10) {
        recommendations.push(`${service.serviceName}: High error rate (${service.errorRate}%) - needs attention`)
      }
      
      if (service.averageResponseTime > 1000) {
        recommendations.push(`${service.serviceName}: Slow response time (${service.averageResponseTime}ms) - optimize queries`)
      }
    })

    // System health recommendations
    if (health.memory.percentage > 85) {
      recommendations.push('Memory usage high (>85%) - consider implementing memory cleanup')
    }

    if (health.overallStatus === 'warning') {
      recommendations.push('System health warning - monitor degraded services closely')
    }

    if (health.overallStatus === 'critical') {
      recommendations.push('CRITICAL: System health issues detected - immediate attention required')
    }

    return recommendations.length > 0 ? recommendations : ['All systems operating normally']
  }
}

// Export singleton instance for cross-agent consumption
export const performanceMonitoringService = new PerformanceMonitoringService()

// Export class for testing or advanced usage
export { PerformanceMonitoringService }