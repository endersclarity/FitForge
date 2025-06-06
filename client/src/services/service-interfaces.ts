/**
 * FITFORGE SERVICE INTERFACES - Cross-Agent Integration Contracts
 * 
 * Standardized interfaces for Agent B (Goal Pages) and Agent D (API) consumption
 * Created for INTEGRATION_TASK_C - Service Interface Standardization
 */

import type { 
  WorkoutSession, 
  WorkoutExercise, 
  SetData, 
  Exercise,
  PersonalRecord 
} from '@/lib/supabase'

// ============================================================================
// STANDARD RESPONSE WRAPPER
// ============================================================================

export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
  performance?: {
    duration: number
    source: string
    cacheHit?: boolean
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    code: string
  }>
}

// ============================================================================
// GOAL PROGRESS INTERFACES FOR AGENT B
// ============================================================================

export interface ProgressCalculationResult {
  goalId: string
  currentProgressPercentage: number
  dataSourceDescription: string
  calculationFormula: string
  isAchieved: boolean
  lastUpdated: string
  milestoneData?: {
    currentValue: number
    targetValue: number
    startValue: number
    unit: string
  }
  dataPointsCount: number
  calculationDateRange: {
    start: string
    end: string
  }
}

export interface TrendData {
  period: '30d' | '90d' | '6m' | '1y'
  dataPoints: Array<{
    date: string
    value: number
    progressPercentage: number
  }>
  trendDirection: 'improving' | 'declining' | 'stable'
  changeRate: number // percentage change per week
  confidence: number // 0-100, how reliable the trend is
}

export interface GoalRecommendation {
  id: string
  type: 'exercise_selection' | 'target_adjustment' | 'timeline_modification'
  title: string
  description: string
  rationale: string
  priority: 'high' | 'medium' | 'low'
  actionRequired: boolean
  estimatedImpact: string
}

export interface GoalPageIntegration {
  // Core progress methods for goal pages
  getGoalProgress(goalId: string): Promise<ServiceResponse<ProgressCalculationResult>>
  calculateGoalTrends(goalId: string, period: '30d' | '90d'): Promise<ServiceResponse<TrendData>>
  getGoalRecommendations(userId: string): Promise<ServiceResponse<GoalRecommendation[]>>
  
  // Exercise selection for goal wizard
  getAvailableExercisesForGoals(goalType: string): Promise<ServiceResponse<ExerciseOption[]>>
  validateGoalInputs(goalData: CreateGoalRequest): Promise<ServiceResponse<ValidationResult>>
  
  // Progress analytics for goal pages
  getGoalAnalytics(userId: string): Promise<ServiceResponse<GoalAnalytics>>
}

export interface ExerciseOption {
  id: string
  name: string
  category: string
  recentMaxWeight?: number
  recentWorkoutCount?: number
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  estimatedProgression: string
}

export interface CreateGoalRequest {
  goalType: 'weight_loss' | 'weight_gain' | 'strength' | 'endurance'
  targetValue: number
  timeframe: number // days
  exerciseId?: string // for strength goals
  currentValue?: number
  notes?: string
}

export interface GoalAnalytics {
  totalGoals: number
  activeGoals: number
  completedGoals: number
  averageCompletionTime: number // days
  successRate: number // percentage
  mostSuccessfulGoalType: string
  currentStreak: number // days
}

// ============================================================================
// ANALYTICS INTERFACES FOR AGENT B & D
// ============================================================================

export interface ProgressMetrics {
  strengthGain: number // percentage
  volumeIncrease: number // percentage
  consistencyStreak: number // days
  totalWorkouts: number
  avgWorkoutDuration: number // minutes
  strongestMuscleGroup: string
  mostImprovedExercise: string
  personalRecordsThisMonth: number
}

export interface WeeklyTrends {
  weekStart: string
  weekEnd: string
  totalVolume: number
  volumeChange: number // percentage from previous week
  workoutCount: number
  countChange: number // change from previous week
  avgDuration: number
  durationChange: number // percentage change
  personalRecords: number
  consistency: number // percentage of planned workouts completed
}

export interface DailyAnalytics {
  date: string
  totalWorkouts: number
  totalVolume: number
  totalDuration: number
  caloriesBurned: number
  muscleGroupBreakdown: {
    chest: number
    back: number
    legs: number
    shoulders: number
    arms: number
    core: number
  }
  newPersonalRecords: number
  consistency: boolean // did they meet their daily goal
}

// ============================================================================
// USER PREFERENCES CONTRACTS FOR AGENT D
// ============================================================================

export interface NotificationPreferencesContract {
  workoutReminders: boolean
  goalMilestones: boolean
  personalRecords: boolean
  weeklyProgress: boolean
  plateauWarnings: boolean
  achievementCelebrations: boolean
  preferredNotificationTime: string // HH:MM format
  timezone: string
  frequency: 'immediate' | 'daily' | 'weekly'
  channels: Array<'push' | 'email' | 'in_app'>
}

export interface UserPreferencesContract {
  userId: string
  notifications: NotificationPreferencesContract
  workout: {
    defaultRestTime: number // seconds
    preferredUnits: 'imperial' | 'metric'
    autoProgressiveOverload: boolean
    formTrackingEnabled: boolean
  }
  goals: {
    reminderFrequency: 'daily' | 'weekly' | 'monthly'
    autoGoalSuggestions: boolean
    publicProgress: boolean
  }
  privacy: {
    shareWorkouts: boolean
    shareProgress: boolean
    allowCoaching: boolean
  }
  lastUpdated: string
}

export interface AnalyticsDataContract {
  userId: string
  progressMetrics: ProgressMetrics
  weeklyTrends: WeeklyTrends[]
  goalAchievements: GoalAchievement[]
  workoutFrequency: {
    last30Days: number
    averagePerWeek: number
    longestStreak: number
    currentStreak: number
  }
  lastUpdated: string
  dataQuality: {
    completeness: number // percentage 0-100
    accuracy: number // confidence score 0-100
    recency: number // how fresh the data is 0-100
  }
}

export interface GoalAchievement {
  goalId: string
  goalType: string
  achievedDate: string
  targetValue: number
  actualValue: number
  timeToComplete: number // days
  difficulty: 'easy' | 'moderate' | 'challenging'
  celebrationShown: boolean
}

// ============================================================================
// WORKOUT SERVICE INTERFACES
// ============================================================================

export interface WorkoutServiceContract {
  // Session management
  startWorkout(request: StartWorkoutRequest): Promise<ServiceResponse<WorkoutSessionData>>
  getWorkoutSession(sessionId: string): Promise<ServiceResponse<WorkoutSessionData>>
  completeWorkout(sessionId: string, rating?: number, notes?: string): Promise<ServiceResponse<WorkoutSessionData>>
  cancelWorkout(sessionId: string): Promise<ServiceResponse<boolean>>
  
  // Set logging
  logSet(sessionId: string, exerciseId: string, setData: LogSetRequest): Promise<ServiceResponse<SetData>>
  
  // History and analytics
  getWorkoutHistory(userId: string, limit?: number): Promise<ServiceResponse<WorkoutSession[]>>
  getWorkoutAnalytics(userId: string): Promise<ServiceResponse<ProgressMetrics>>
}

export interface WorkoutSessionData {
  session: WorkoutSession | null
  exercises: (WorkoutExercise & { exercise: Exercise; sets: SetData[] })[]
}

export interface StartWorkoutRequest {
  workoutType: string
  exerciseIds: string[]
  sessionName?: string
  plannedDuration?: number
}

export interface LogSetRequest {
  setNumber: number
  reps: number
  weight: number
  formScore?: number
  perceivedExertion?: number
  equipment?: string
  notes?: string
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export interface PerformanceContract {
  trackServiceCall(serviceName: string, methodName: string, duration: number, success: boolean): void
  getServiceMetrics(serviceName: string): Promise<ServiceMetrics>
  getSystemHealth(): Promise<SystemHealth>
}

export interface ServiceMetrics {
  serviceName: string
  averageResponseTime: number
  successRate: number
  callCount: number
  errorRate: number
  cacheHitRate: number
  lastUpdated: string
}

export interface SystemHealth {
  overallStatus: 'healthy' | 'warning' | 'critical'
  services: Array<{
    name: string
    status: 'up' | 'down' | 'degraded'
    responseTime: number
    lastCheck: string
  }>
  memory: {
    used: number
    total: number
    percentage: number
  }
  cache: {
    hitRate: number
    size: number
    evictions: number
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface ServiceError {
  code: string
  message: string
  details?: any
  timestamp: string
  serviceName: string
  methodName: string
  userId?: string
}

export type ServiceErrorCode = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'CALCULATION_ERROR'
  | 'DATA_INCONSISTENCY'
  | 'PERFORMANCE_TIMEOUT'

// ============================================================================
// EXPORT NOTE: Interfaces are available via direct import
// ============================================================================

// All interfaces defined above are automatically exported
// Import specific interfaces as needed:
// import { GoalPageIntegration, ServiceResponse } from './service-interfaces'