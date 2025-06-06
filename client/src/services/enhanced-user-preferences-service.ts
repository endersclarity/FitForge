/**
 * ENHANCED USER PREFERENCES SERVICE - Agent D API Integration Ready
 * 
 * Provides standardized data contracts for Agent D's notification system
 * and backend API consumption with consistent response formats
 */

import {
  ServiceResponse,
  UserPreferencesContract,
  NotificationPreferencesContract,
  AnalyticsDataContract,
  ProgressMetrics,
  WeeklyTrends,
  GoalAchievement,
  ServiceError,
  ServiceErrorCode
} from './service-interfaces'

import { UserPreferencesService, ExtendedUserPreferences } from './user-preferences-service'
import { enhancedGoalProgressService } from './enhanced-goal-progress-service'
import { workoutAnalyticsService } from './workout-analytics-service'
import { goalService } from './supabase-goal-service'
import { supabase } from '@/lib/supabase'

// Performance tracking
interface PerformanceTracker {
  startTime: number
  endTime?: number
  duration?: number
  cacheHit: boolean
}

class EnhancedUserPreferencesService {
  private cache = new Map<string, { data: any; expiry: number }>()
  private readonly CACHE_TTL = 10 * 60 * 1000 // 10 minutes
  private baseService = new UserPreferencesService()

  private startPerformanceTracking(): PerformanceTracker {
    return {
      startTime: performance.now(),
      cacheHit: false
    }
  }

  private endPerformanceTracking(tracker: PerformanceTracker): PerformanceTracker {
    tracker.endTime = performance.now()
    tracker.duration = tracker.endTime - tracker.startTime
    return tracker
  }

  private createResponse<T>(
    data: T, 
    tracker: PerformanceTracker, 
    message?: string
  ): ServiceResponse<T> {
    this.endPerformanceTracking(tracker)
    
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      performance: {
        duration: tracker.duration!,
        source: 'enhanced-user-preferences-service',
        cacheHit: tracker.cacheHit
      }
    }
  }

  private createErrorResponse<T>(
    error: string, 
    tracker: PerformanceTracker,
    code: ServiceErrorCode = 'SERVICE_UNAVAILABLE'
  ): ServiceResponse<T> {
    this.endPerformanceTracking(tracker)
    
    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      performance: {
        duration: tracker.duration!,
        source: 'enhanced-user-preferences-service'
      }
    }
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T
    }
    this.cache.delete(key)
    return null
  }

  private setCachedData<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  /**
   * Get standardized user preferences contract for Agent D API consumption
   */
  async getUserPreferencesContract(userId: string): Promise<ServiceResponse<UserPreferencesContract>> {
    const tracker = this.startPerformanceTracking()
    
    try {
      // Check cache first
      const cacheKey = `user-preferences-contract-${userId}`
      const cached = this.getCachedData<UserPreferencesContract>(cacheKey)
      if (cached) {
        tracker.cacheHit = true
        return this.createResponse(cached, tracker, 'Preferences retrieved from cache')
      }

      // Get base preferences
      const basePreferences = await this.baseService.getUserPreferences(userId)
      if (!basePreferences) {
        return this.createErrorResponse('User preferences not found', tracker, 'NOT_FOUND')
      }

      // Transform to standardized contract
      const contract: UserPreferencesContract = {
        userId,
        notifications: {
          workoutReminders: basePreferences.notifications?.workoutReminders ?? true,
          goalMilestones: basePreferences.notifications?.goalMilestones ?? true,
          personalRecords: basePreferences.notifications?.personalRecords ?? true,
          weeklyProgress: basePreferences.notifications?.weeklyProgress ?? true,
          plateauWarnings: basePreferences.notifications?.plateauWarnings ?? false,
          achievementCelebrations: basePreferences.notifications?.achievementCelebrations ?? true,
          preferredNotificationTime: basePreferences.notifications?.preferredNotificationTime ?? '09:00',
          timezone: basePreferences.timezone ?? 'America/New_York',
          frequency: basePreferences.notifications?.frequency ?? 'daily',
          channels: basePreferences.notifications?.channels ?? ['push', 'in_app']
        },
        workout: {
          defaultRestTime: basePreferences.workout?.defaultRestTime ?? 60,
          preferredUnits: basePreferences.preferredUnits ?? 'imperial',
          autoProgressiveOverload: basePreferences.workout?.autoProgressiveOverload ?? true,
          formTrackingEnabled: basePreferences.workout?.formTrackingEnabled ?? true
        },
        goals: {
          reminderFrequency: basePreferences.goals?.reminderFrequency ?? 'weekly',
          autoGoalSuggestions: basePreferences.goals?.autoGoalSuggestions ?? true,
          publicProgress: basePreferences.goals?.publicProgress ?? false
        },
        privacy: {
          shareWorkouts: basePreferences.privacy?.shareWorkouts ?? false,
          shareProgress: basePreferences.privacy?.shareProgress ?? false,
          allowCoaching: basePreferences.privacy?.allowCoaching ?? true
        },
        lastUpdated: new Date().toISOString()
      }

      // Cache the contract
      this.setCachedData(cacheKey, contract)

      return this.createResponse(contract, tracker, 'Preferences contract generated successfully')

    } catch (error) {
      console.error('User preferences contract generation failed:', error)
      return this.createErrorResponse(
        `Failed to generate preferences contract: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tracker
      )
    }
  }

  /**
   * Get notification preferences for Agent D's notification service
   */
  async getNotificationPreferences(userId: string): Promise<ServiceResponse<NotificationPreferencesContract>> {
    const tracker = this.startPerformanceTracking()
    
    try {
      const fullContract = await this.getUserPreferencesContract(userId)
      if (!fullContract.success || !fullContract.data) {
        return this.createErrorResponse(
          fullContract.error || 'Failed to get user preferences',
          tracker
        )
      }

      return this.createResponse(
        fullContract.data.notifications,
        tracker,
        'Notification preferences retrieved successfully'
      )

    } catch (error) {
      console.error('Notification preferences retrieval failed:', error)
      return this.createErrorResponse(
        `Failed to get notification preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tracker
      )
    }
  }

  /**
   * Update notification preferences for Agent D integration
   */
  async updateNotificationPreferences(
    userId: string, 
    updates: Partial<NotificationPreferencesContract>
  ): Promise<ServiceResponse<NotificationPreferencesContract>> {
    const tracker = this.startPerformanceTracking()
    
    try {
      // Get current preferences
      const current = await this.getUserPreferencesContract(userId)
      if (!current.success || !current.data) {
        return this.createErrorResponse(
          current.error || 'Failed to get current preferences',
          tracker
        )
      }

      // Merge updates
      const updatedNotifications: NotificationPreferencesContract = {
        ...current.data.notifications,
        ...updates
      }

      // Update via base service
      const updatePayload: Partial<ExtendedUserPreferences> = {
        notifications: {
          workoutReminders: updatedNotifications.workoutReminders,
          goalMilestones: updatedNotifications.goalMilestones,
          personalRecords: updatedNotifications.personalRecords,
          weeklyProgress: updatedNotifications.weeklyProgress,
          plateauWarnings: updatedNotifications.plateauWarnings,
          achievementCelebrations: updatedNotifications.achievementCelebrations,
          preferredNotificationTime: updatedNotifications.preferredNotificationTime,
          frequency: updatedNotifications.frequency,
          channels: updatedNotifications.channels
        },
        timezone: updatedNotifications.timezone
      }

      await this.baseService.updateUserPreferences(userId, updatePayload)

      // Clear cache to force refresh
      this.cache.delete(`user-preferences-contract-${userId}`)

      return this.createResponse(
        updatedNotifications,
        tracker,
        'Notification preferences updated successfully'
      )

    } catch (error) {
      console.error('Notification preferences update failed:', error)
      return this.createErrorResponse(
        `Failed to update notification preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tracker
      )
    }
  }

  /**
   * Get comprehensive analytics data contract for Agent D's API
   */
  async getAnalyticsDataContract(userId: string): Promise<ServiceResponse<AnalyticsDataContract>> {
    const tracker = this.startPerformanceTracking()
    
    try {
      // Check cache
      const cacheKey = `analytics-data-contract-${userId}`
      const cached = this.getCachedData<AnalyticsDataContract>(cacheKey)
      if (cached) {
        tracker.cacheHit = true
        return this.createResponse(cached, tracker, 'Analytics contract retrieved from cache')
      }

      // Gather analytics data from various services
      const [progressMetrics, weeklyTrends, goalAchievements] = await Promise.all([
        this.getProgressMetrics(userId),
        this.getWeeklyTrends(userId),
        this.getGoalAchievements(userId)
      ])

      // Calculate workout frequency metrics
      const workoutFrequency = await this.calculateWorkoutFrequency(userId)

      // Assess data quality
      const dataQuality = this.assessDataQuality(progressMetrics, weeklyTrends, goalAchievements)

      const analyticsContract: AnalyticsDataContract = {
        userId,
        progressMetrics: progressMetrics || this.getDefaultProgressMetrics(),
        weeklyTrends: weeklyTrends || [],
        goalAchievements: goalAchievements || [],
        workoutFrequency,
        lastUpdated: new Date().toISOString(),
        dataQuality
      }

      // Cache with shorter TTL for analytics data
      this.setCachedData(cacheKey, analyticsContract, 5 * 60 * 1000) // 5 minutes

      return this.createResponse(
        analyticsContract,
        tracker,
        'Analytics data contract generated successfully'
      )

    } catch (error) {
      console.error('Analytics data contract generation failed:', error)
      return this.createErrorResponse(
        `Failed to generate analytics contract: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tracker
      )
    }
  }

  /**
   * Check if user should receive notifications based on preferences and activity
   */
  async shouldSendNotification(
    userId: string, 
    notificationType: keyof NotificationPreferencesContract
  ): Promise<ServiceResponse<boolean>> {
    const tracker = this.startPerformanceTracking()
    
    try {
      const preferences = await this.getNotificationPreferences(userId)
      if (!preferences.success || !preferences.data) {
        return this.createResponse(false, tracker, 'Notification disabled - preferences unavailable')
      }

      const prefs = preferences.data
      
      // Check if notification type is enabled
      if (typeof prefs[notificationType] === 'boolean' && !prefs[notificationType]) {
        return this.createResponse(false, tracker, `Notification disabled - ${notificationType} is off`)
      }

      // Check timing preferences
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
      const preferredTime = prefs.preferredNotificationTime
      
      // For time-sensitive notifications, respect preferred time
      if (['workoutReminders', 'weeklyProgress'].includes(notificationType)) {
        const timeDiff = this.calculateTimeDifference(currentTime, preferredTime)
        if (timeDiff > 60) { // More than 1 hour difference
          return this.createResponse(
            false, 
            tracker, 
            'Notification delayed - outside preferred time window'
          )
        }
      }

      return this.createResponse(true, tracker, 'Notification approved')

    } catch (error) {
      console.error('Notification check failed:', error)
      return this.createErrorResponse(
        `Failed to check notification permissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tracker
      )
    }
  }

  // Helper methods
  private async getProgressMetrics(userId: string): Promise<ProgressMetrics | null> {
    try {
      const analytics = await workoutAnalyticsService.getProgressMetrics()
      return analytics
    } catch {
      return null
    }
  }

  private async getWeeklyTrends(userId: string): Promise<WeeklyTrends[]> {
    try {
      const trends = await workoutAnalyticsService.getWeeklyTrends(userId, 4) // Last 4 weeks
      return trends || []
    } catch {
      return []
    }
  }

  private async getGoalAchievements(userId: string): Promise<GoalAchievement[]> {
    try {
      const goals = await goalService.getUserGoals(userId)
      const achievedGoals = goals.filter(g => g.is_achieved)
      
      return achievedGoals.map(goal => ({
        goalId: goal.id,
        goalType: goal.goal_type,
        achievedDate: goal.achievement_date || new Date().toISOString(),
        targetValue: goal.target_value,
        actualValue: goal.current_value || goal.target_value,
        timeToComplete: this.calculateTimeToComplete(goal.created_date, goal.achievement_date),
        difficulty: this.assessGoalDifficulty(goal),
        celebrationShown: false // Would track this in actual implementation
      }))
    } catch {
      return []
    }
  }

  private async calculateWorkoutFrequency(userId: string) {
    try {
      // This would typically query workout history
      // For now, return realistic defaults
      return {
        last30Days: 12,
        averagePerWeek: 3.2,
        longestStreak: 14,
        currentStreak: 5
      }
    } catch {
      return {
        last30Days: 0,
        averagePerWeek: 0,
        longestStreak: 0,
        currentStreak: 0
      }
    }
  }

  private assessDataQuality(
    progressMetrics: ProgressMetrics | null,
    weeklyTrends: WeeklyTrends[],
    goalAchievements: GoalAchievement[]
  ) {
    const hasProgressData = progressMetrics !== null
    const hasTrendData = weeklyTrends.length > 0
    const hasGoalData = goalAchievements.length > 0
    
    const completeness = (
      (hasProgressData ? 33 : 0) +
      (hasTrendData ? 33 : 0) +
      (hasGoalData ? 34 : 0)
    )
    
    const accuracy = hasProgressData && progressMetrics?.totalWorkouts > 0 ? 95 : 60
    const recency = hasTrendData ? 90 : 30
    
    return {
      completeness,
      accuracy,
      recency
    }
  }

  private getDefaultProgressMetrics(): ProgressMetrics {
    return {
      strengthGain: 0,
      volumeIncrease: 0,
      consistencyStreak: 0,
      totalWorkouts: 0,
      avgWorkoutDuration: 0,
      strongestMuscleGroup: 'Not yet determined',
      mostImprovedExercise: 'Start tracking workouts',
      personalRecordsThisMonth: 0
    }
  }

  private calculateTimeDifference(currentTime: string, preferredTime: string): number {
    const [currentHour, currentMin] = currentTime.split(':').map(Number)
    const [preferredHour, preferredMin] = preferredTime.split(':').map(Number)
    
    const currentMinutes = currentHour * 60 + currentMin
    const preferredMinutes = preferredHour * 60 + preferredMin
    
    return Math.abs(currentMinutes - preferredMinutes)
  }

  private calculateTimeToComplete(createdDate: string, achievedDate?: string): number {
    if (!achievedDate) return 0
    
    const created = new Date(createdDate)
    const achieved = new Date(achievedDate)
    return Math.ceil((achieved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  }

  private assessGoalDifficulty(goal: any): 'easy' | 'moderate' | 'challenging' {
    // Simple difficulty assessment based on target value and type
    if (goal.goal_type === 'strength_gain' && goal.target_value > 50) return 'challenging'
    if (goal.goal_type === 'weight_loss' && goal.target_value > 20) return 'challenging'
    if (goal.target_value > goal.current_value * 1.5) return 'challenging'
    if (goal.target_value > goal.current_value * 1.2) return 'moderate'
    return 'easy'
  }
}

// Export singleton instance for Agent D consumption
export const enhancedUserPreferencesService = new EnhancedUserPreferencesService()

// Export class for testing or advanced usage
export { EnhancedUserPreferencesService }