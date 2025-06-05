/**
 * Performance Monitoring Service
 * Tracks app performance, user experience metrics, and system health
 */

interface PerformanceMetric {
  id: string;
  timestamp: number;
  type: 'page-load' | 'api-call' | 'user-action' | 'error' | 'render' | 'navigation';
  name: string;
  duration?: number;
  success: boolean;
  metadata?: Record<string, string | number | boolean | undefined>;
  userAgent?: string;
  url?: string;
  sessionId: string;
}

interface UserExperienceMetric {
  id: string;
  timestamp: number;
  type: 'interaction' | 'satisfaction' | 'completion' | 'abandonment';
  event: string;
  value?: number;
  metadata?: Record<string, string | number | boolean | undefined>;
  sessionId: string;
}

interface SystemHealthMetric {
  id: string;
  timestamp: number;
  cpuUsage?: number;
  memoryUsage?: number;
  networkLatency?: number;
  batteryLevel?: number;
  connectionType?: string;
  onlineStatus: boolean;
  sessionId: string;
}

interface PerformanceReport {
  period: { start: number; end: number };
  metrics: {
    averagePageLoad: number;
    averageApiResponse: number;
    errorRate: number;
    userSatisfaction: number;
    completionRate: number;
  };
  topIssues: Array<{
    type: string;
    count: number;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
}

class PerformanceMonitoringService {
  private sessionId: string;
  private metrics: PerformanceMetric[] = [];
  private uxMetrics: UserExperienceMetric[] = [];
  private systemMetrics: SystemHealthMetric[] = [];
  private isMonitoring = false;
  private performanceObserver?: PerformanceObserver;
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics in memory
  
  // Storage keys
  private readonly STORAGE_KEYS = {
    METRICS: 'fitforge_performance_metrics',
    UX_METRICS: 'fitforge_ux_metrics',
    SYSTEM_METRICS: 'fitforge_system_metrics',
    SESSION_ID: 'fitforge_session_id',
    MONITORING_ENABLED: 'fitforge_monitoring_enabled'
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadStoredMetrics();
  }

  /**
   * Initialize performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Save monitoring state
    localStorage.setItem(this.STORAGE_KEYS.MONITORING_ENABLED, 'true');
    
    // Set up performance observers
    this.setupPerformanceObservers();
    
    // Monitor system health
    this.startSystemHealthMonitoring();
    
    // Set up error tracking
    this.setupErrorTracking();
    
    // Set up navigation tracking
    this.setupNavigationTracking();
    
    // Monitor API calls
    this.setupApiCallMonitoring();
    
    // Start periodic health checks
    this.startPeriodicHealthChecks();
    
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    localStorage.setItem(this.STORAGE_KEYS.MONITORING_ENABLED, 'false');
    
    // Clean up observers
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
  }

  /**
   * Track page load performance
   */
  trackPageLoad(pageName: string, startTime: number): void {
    const duration = performance.now() - startTime;
    
    this.recordMetric({
      type: 'page-load',
      name: pageName,
      duration,
      success: true,
      url: window.location.href
    });
    
  }

  /**
   * Track API call performance
   */
  trackApiCall(endpoint: string, method: string, startTime: number, success: boolean, status?: number): void {
    const duration = performance.now() - startTime;
    
    this.recordMetric({
      type: 'api-call',
      name: `${method} ${endpoint}`,
      duration,
      success,
      metadata: { 
        endpoint, 
        method, 
        status,
        responseTime: Math.round(duration)
      }
    });
    
    if (!success || duration > 5000) {
      console.warn(`⚠️ Slow/failed API call: ${method} ${endpoint} (${Math.round(duration)}ms, status: ${status})`);
    }
  }

  /**
   * Track user interactions
   */
  trackUserAction(action: string, component: string, success: boolean = true, metadata?: Record<string, string | number | boolean | undefined>): void {
    this.recordMetric({
      type: 'user-action',
      name: `${component}:${action}`,
      success,
      metadata: {
        component,
        action,
        ...metadata
      }
    });
    
    // Also record as UX metric
    this.recordUxMetric({
      type: 'interaction',
      event: action,
      metadata: { component, ...metadata }
    });
  }

  /**
   * Track render performance
   */
  trackRender(componentName: string, renderTime: number): void {
    this.recordMetric({
      type: 'render',
      name: componentName,
      duration: renderTime,
      success: true,
      metadata: { component: componentName }
    });
    
    if (renderTime > 100) {
      console.warn(`🐌 Slow render: ${componentName} (${Math.round(renderTime)}ms)`);
    }
  }

  /**
   * Track user satisfaction
   */
  trackSatisfaction(feature: string, rating: number, feedback?: string): void {
    this.recordUxMetric({
      type: 'satisfaction',
      event: feature,
      value: rating,
      metadata: { feedback }
    });
    
  }

  /**
   * Track feature completion
   */
  trackCompletion(feature: string, success: boolean, steps?: number): void {
    this.recordUxMetric({
      type: success ? 'completion' : 'abandonment',
      event: feature,
      metadata: { steps }
    });
    
  }

  /**
   * Record custom error
   */
  trackError(error: Error, context?: string): void {
    this.recordMetric({
      type: 'error',
      name: error.name,
      success: false,
      metadata: {
        message: error.message,
        stack: error.stack,
        context,
        url: window.location.href
      }
    });
    
    console.error(`🔥 Error tracked: ${error.message} (${context})`);
  }

  /**
   * Get performance report for a time period
   */
  getPerformanceReport(hours: number = 24): PerformanceReport {
    const endTime = Date.now();
    const startTime = endTime - (hours * 60 * 60 * 1000);
    
    const periodMetrics = this.metrics.filter(m => 
      m.timestamp >= startTime && m.timestamp <= endTime
    );
    
    const periodUxMetrics = this.uxMetrics.filter(m => 
      m.timestamp >= startTime && m.timestamp <= endTime
    );
    
    // Calculate averages
    const pageLoads = periodMetrics.filter(m => m.type === 'page-load' && m.duration);
    const apiCalls = periodMetrics.filter(m => m.type === 'api-call' && m.duration);
    const errors = periodMetrics.filter(m => !m.success);
    const satisfactionRatings = periodUxMetrics.filter(m => m.type === 'satisfaction' && m.value);
    const completions = periodUxMetrics.filter(m => m.type === 'completion');
    const totalActions = periodUxMetrics.filter(m => m.type === 'interaction');
    
    const averagePageLoad = pageLoads.length > 0 ? 
      pageLoads.reduce((sum, m) => sum + (m.duration || 0), 0) / pageLoads.length : 0;
    
    const averageApiResponse = apiCalls.length > 0 ? 
      apiCalls.reduce((sum, m) => sum + (m.duration || 0), 0) / apiCalls.length : 0;
    
    const errorRate = periodMetrics.length > 0 ? 
      (errors.length / periodMetrics.length) * 100 : 0;
    
    const userSatisfaction = satisfactionRatings.length > 0 ? 
      satisfactionRatings.reduce((sum, m) => sum + (m.value || 0), 0) / satisfactionRatings.length : 0;
    
    const completionRate = totalActions.length > 0 ? 
      (completions.length / totalActions.length) * 100 : 0;
    
    // Identify top issues
    const topIssues = this.identifyTopIssues(periodMetrics);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations({
      averagePageLoad,
      averageApiResponse,
      errorRate,
      userSatisfaction,
      completionRate
    });
    
    return {
      period: { start: startTime, end: endTime },
      metrics: {
        averagePageLoad: Math.round(averagePageLoad),
        averageApiResponse: Math.round(averageApiResponse),
        errorRate: Math.round(errorRate * 100) / 100,
        userSatisfaction: Math.round(userSatisfaction * 10) / 10,
        completionRate: Math.round(completionRate * 100) / 100
      },
      topIssues,
      recommendations
    };
  }

  /**
   * Get real-time performance status
   */
  getCurrentPerformanceStatus(): {
    isHealthy: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const recent = this.getPerformanceReport(1); // Last hour
    
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Page load performance
    if (recent.metrics.averagePageLoad > 3000) {
      score -= 20;
      issues.push('Slow page loads');
      recommendations.push('Optimize component rendering and reduce bundle size');
    }
    
    // API performance
    if (recent.metrics.averageApiResponse > 2000) {
      score -= 15;
      issues.push('Slow API responses');
      recommendations.push('Implement API response caching and request optimization');
    }
    
    // Error rate
    if (recent.metrics.errorRate > 5) {
      score -= 25;
      issues.push('High error rate');
      recommendations.push('Review error logs and implement better error handling');
    }
    
    // User satisfaction
    if (recent.metrics.userSatisfaction < 6 && recent.metrics.userSatisfaction > 0) {
      score -= 15;
      issues.push('Low user satisfaction');
      recommendations.push('Investigate user feedback and improve UX');
    }
    
    // Completion rate
    if (recent.metrics.completionRate < 70 && recent.metrics.completionRate > 0) {
      score -= 10;
      issues.push('Low completion rate');
      recommendations.push('Simplify user flows and reduce friction');
    }
    
    return {
      isHealthy: score >= 70,
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  /**
   * Export performance data
   */
  exportData(): string {
    const data = {
      sessionId: this.sessionId,
      metrics: this.metrics,
      uxMetrics: this.uxMetrics,
      systemMetrics: this.systemMetrics,
      exportTimestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all stored metrics
   */
  clearData(): void {
    this.metrics = [];
    this.uxMetrics = [];
    this.systemMetrics = [];
    
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
  }

  /**
   * Private helper methods
   */
  private generateSessionId(): string {
    const stored = localStorage.getItem(this.STORAGE_KEYS.SESSION_ID);
    if (stored) {
      const sessionData = JSON.parse(stored);
      const age = Date.now() - sessionData.timestamp;
      
      // Keep session for 24 hours
      if (age < 24 * 60 * 60 * 1000) {
        return sessionData.id;
      }
    }
    
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, JSON.stringify({
      id: newSessionId,
      timestamp: Date.now()
    }));
    
    return newSessionId;
  }

  private recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp' | 'sessionId' | 'userAgent'>): void {
    const fullMetric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      ...metric
    };
    
    this.metrics.push(fullMetric);
    
    // Keep only recent metrics in memory
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
    
    this.saveMetricsToStorage();
  }

  private recordUxMetric(metric: Omit<UserExperienceMetric, 'id' | 'timestamp' | 'sessionId'>): void {
    const fullMetric: UserExperienceMetric = {
      id: `ux_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...metric
    };
    
    this.uxMetrics.push(fullMetric);
    
    if (this.uxMetrics.length > this.MAX_METRICS) {
      this.uxMetrics = this.uxMetrics.slice(-this.MAX_METRICS);
    }
    
    this.saveUxMetricsToStorage();
  }

  private recordSystemMetric(metric: Omit<SystemHealthMetric, 'id' | 'timestamp' | 'sessionId'>): void {
    const fullMetric: SystemHealthMetric = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...metric
    };
    
    this.systemMetrics.push(fullMetric);
    
    if (this.systemMetrics.length > this.MAX_METRICS) {
      this.systemMetrics = this.systemMetrics.slice(-this.MAX_METRICS);
    }
    
    this.saveSystemMetricsToStorage();
  }

  private setupPerformanceObservers(): void {
    if (typeof PerformanceObserver === 'undefined') return;
    
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.trackPageLoad('navigation', navEntry.loadEventEnd - navEntry.fetchStart);
          }
          
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.name.includes('/api/')) {
              this.recordMetric({
                type: 'api-call',
                name: resourceEntry.name,
                duration: resourceEntry.responseEnd - resourceEntry.requestStart,
                success: true,
                metadata: { resourceType: 'api' }
              });
            }
          }
        }
      });
      
      this.performanceObserver.observe({ entryTypes: ['navigation', 'resource'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.trackError(event.error, 'global-error-handler');
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      const error = new Error(event.reason || 'Unhandled promise rejection');
      this.trackError(error, 'unhandled-promise');
    });
  }

  private setupNavigationTracking(): void {
    // Track navigation timing
    const navigationStart = performance.now();
    
    window.addEventListener('beforeunload', () => {
      const sessionDuration = performance.now() - navigationStart;
      this.recordUxMetric({
        type: 'completion',
        event: 'session-end',
        value: sessionDuration,
        metadata: { duration: sessionDuration }
      });
    });
  }

  private setupApiCallMonitoring(): void {
    // Monkey patch fetch to track API calls
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      const options = args[1] || {};
      
      try {
        const response = await originalFetch(...args);
        
        if (url.includes('/api/')) {
          this.trackApiCall(
            url, 
            options.method || 'GET', 
            startTime, 
            response.ok, 
            response.status
          );
        }
        
        return response;
      } catch (error) {
        if (url.includes('/api/')) {
          this.trackApiCall(url, options.method || 'GET', startTime, false);
        }
        throw error;
      }
    };
  }

  private startSystemHealthMonitoring(): void {
    // Monitor system health every 30 seconds
    setInterval(() => {
      this.recordSystemMetric({
        onlineStatus: navigator.onLine,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown',
        // Note: Battery and memory APIs are limited in modern browsers
      });
    }, 30000);
  }

  private startPeriodicHealthChecks(): void {
    // Run health checks every 5 minutes
    setInterval(() => {
      const status = this.getCurrentPerformanceStatus();
      
      if (!status.isHealthy) {
        console.warn('🚨 Performance health check failed:', status.issues);
      }
    }, 5 * 60 * 1000);
  }

  private identifyTopIssues(metrics: PerformanceMetric[]): Array<{ type: string; count: number; description: string; impact: 'low' | 'medium' | 'high' }> {
    const issues: Record<string, { count: number; description: string; impact: 'low' | 'medium' | 'high' }> = {};
    
    metrics.forEach(metric => {
      if (!metric.success) {
        const key = `${metric.type}-error`;
        if (!issues[key]) {
          issues[key] = {
            count: 0,
            description: `${metric.type} failures`,
            impact: metric.type === 'api-call' ? 'high' : 'medium'
          };
        }
        issues[key].count++;
      }
      
      if (metric.duration && metric.duration > 5000) {
        const key = `${metric.type}-slow`;
        if (!issues[key]) {
          issues[key] = {
            count: 0,
            description: `Slow ${metric.type} performance`,
            impact: 'medium'
          };
        }
        issues[key].count++;
      }
    });
    
    return Object.entries(issues)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private generateRecommendations(metrics: {
    averagePageLoad: number;
    averageApiResponse: number;
    errorRate: number;
    userSatisfaction: number;
    completionRate: number;
  }): string[] {
    const recommendations: string[] = [];
    
    if (metrics.averagePageLoad > 3000) {
      recommendations.push('Consider code splitting and lazy loading to improve page load times');
    }
    
    if (metrics.averageApiResponse > 2000) {
      recommendations.push('Implement API caching and consider pagination for large datasets');
    }
    
    if (metrics.errorRate > 5) {
      recommendations.push('Review error handling and add better user feedback for failures');
    }
    
    if (metrics.userSatisfaction < 7 && metrics.userSatisfaction > 0) {
      recommendations.push('Gather user feedback to identify UX improvement opportunities');
    }
    
    if (metrics.completionRate < 80 && metrics.completionRate > 0) {
      recommendations.push('Analyze user flows to reduce friction and improve task completion');
    }
    
    return recommendations;
  }

  private loadStoredMetrics(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.METRICS);
      if (stored) {
        this.metrics = JSON.parse(stored);
      }
      
      const storedUx = localStorage.getItem(this.STORAGE_KEYS.UX_METRICS);
      if (storedUx) {
        this.uxMetrics = JSON.parse(storedUx);
      }
      
      const storedSystem = localStorage.getItem(this.STORAGE_KEYS.SYSTEM_METRICS);
      if (storedSystem) {
        this.systemMetrics = JSON.parse(storedSystem);
      }
      
      // Check if monitoring was enabled
      const monitoringEnabled = localStorage.getItem(this.STORAGE_KEYS.MONITORING_ENABLED);
      if (monitoringEnabled === 'true') {
        this.startMonitoring();
      }
    } catch (error) {
      console.error('Error loading stored metrics:', error);
    }
  }

  private saveMetricsToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.METRICS, JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Error saving metrics to storage:', error);
    }
  }

  private saveUxMetricsToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.UX_METRICS, JSON.stringify(this.uxMetrics));
    } catch (error) {
      console.error('Error saving UX metrics to storage:', error);
    }
  }

  private saveSystemMetricsToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.SYSTEM_METRICS, JSON.stringify(this.systemMetrics));
    } catch (error) {
      console.error('Error saving system metrics to storage:', error);
    }
  }
}

// Export singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

// Export types
export type { 
  PerformanceMetric, 
  UserExperienceMetric, 
  SystemHealthMetric, 
  PerformanceReport 
};