import { supabase, db } from '@/lib/supabase'
import type { 
  WorkoutSession, 
  WorkoutExercise, 
  WorkoutSet, 
  Exercise,
  PersonalRecord 
} from '@/lib/supabase'
import { 
  transformSupabaseExercise,
  transformSupabaseWorkoutSession,
  transformSupabaseSetData
} from '../../../shared/consolidated-schema'

export interface StartWorkoutRequest {
  workoutType: string
  exerciseIds: string[]
  sessionName?: string
}

export interface LogSetRequest {
  sessionId: string
  exerciseId: string
  setNumber: number
  reps: number
  weight: number
  formScore?: number
  perceivedExertion?: number
  equipment?: string
}

export interface CompleteWorkoutRequest {
  sessionId: string
  rating?: number
  notes?: string
}

export class SupabaseWorkoutService {
  
  /**
   * Start a new workout session
   */
  async startWorkout(request: StartWorkoutRequest): Promise<{
    session: WorkoutSession
    exercises: (WorkoutExercise & { exercise: Exercise })[]
  }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create workout session
      const session = await db.createWorkoutSession({
        userId: user.id,
        startTime: new Date().toISOString(),
        endTime: undefined,
        totalDuration: 0,
        workoutType: request.workoutType,
        sessionName: request.sessionName || `${request.workoutType} Workout`,
        notes: undefined,
        totalVolume: 0,
        caloriesBurned: 0,
        status: 'in_progress',
        rating: undefined,
        lastModified: new Date().toISOString(),
        exercises: [],
        personalRecords: []
      } as any)

      // Get exercise details
      const exercises = await Promise.all(
        request.exerciseIds.map(async (exerciseId, index) => {
          const exercise = await supabase
            .from('exercises')
            .select('*')
            .eq('id', exerciseId)
            .single()

          if (exercise.error) throw exercise.error

          const workoutExercise = await db.createWorkoutExercise({
            exerciseId: exerciseId,
            exerciseOrder: index + 1,
            notes: undefined,
            restTimeSeconds: 60,
            startedAt: new Date().toISOString(),
            completedAt: undefined
          } as any)

          return {
            ...workoutExercise,
            exercise: exercise.data
          }
        })
      )

      return { session, exercises: exercises as any }
    } catch (error) {
      console.error('Error starting workout:', error)
      throw error
    }
  }

  /**
   * Log a set for an exercise in the current workout
   */
  async logSet(request: LogSetRequest): Promise<WorkoutSet> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Find the workout exercise
      const { data: workoutExercises, error: exerciseError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_session_id', request.sessionId)
        .eq('exercise_id', request.exerciseId)

      if (exerciseError) throw exerciseError
      if (!workoutExercises.length) throw new Error('Exercise not found in workout')

      const workoutExercise = workoutExercises[0]

      // Create the set
      const set = await db.createWorkoutSet({
        workout_exercise_id: workoutExercise.id,
        user_id: user.id,
        set_number: request.setNumber,
        reps: request.reps,
        weight_lbs: request.weight,
        form_score: request.formScore || null,
        perceived_exertion: request.perceivedExertion || null,
        is_completed: true,
        is_personal_record: false, // Will be updated by database trigger
        equipment_used: request.equipment || null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        rest_time_after_seconds: null
      })

      // Update workout exercise totals
      const newVolume = workoutExercise.total_volume_lbs + (request.weight * request.reps)
      const newSetsCompleted = workoutExercise.total_sets_completed + 1

      await db.updateWorkoutSession(workoutExercise.workoutSessionId, {
        totalVolume: (await this.getSessionVolume(request.sessionId)) + (request.weight * request.reps)
      })

      await supabase
        .from('workout_exercises')
        .update({
          total_volume_lbs: newVolume,
          total_sets_completed: newSetsCompleted
        })
        .eq('id', workoutExercise.id)

      return set
    } catch (error) {
      console.error('Error logging set:', error)
      throw error
    }
  }

  /**
   * Complete a workout session
   */
  async completeWorkout(request: CompleteWorkoutRequest): Promise<WorkoutSession> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get session to calculate duration
      const session = await db.getWorkoutSession(request.sessionId)
      if (!session) throw new Error('Workout session not found')

      const endTime = new Date().toISOString()
      const startTime = new Date(session.startTime)
      const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000)

      // Update session
      const completedSession = await db.updateWorkoutSession(request.sessionId, {
        endTime: endTime,
        totalDuration: Math.round(duration / 60),
        status: 'completed',
        rating: request.rating || undefined,
        notes: request.notes || undefined
      })

      // Mark all exercises as completed
      await supabase
        .from('workout_exercises')
        .update({ completed_at: endTime })
        .eq('workout_session_id', request.sessionId)
        .is('completed_at', null)

      // Trigger analytics aggregation in background
      this.triggerAnalyticsAggregation(request.sessionId).catch(error => {
        console.warn('Analytics aggregation failed (non-blocking):', error)
      })

      return completedSession
    } catch (error) {
      console.error('Error completing workout:', error)
      throw error
    }
  }

  /**
   * Trigger analytics aggregation after workout completion (non-blocking)
   */
  private async triggerAnalyticsAggregation(sessionId: string): Promise<void> {
    try {
      // Dynamic import to avoid circular dependencies
      const { analyticsService } = await import('./workout-analytics-service')
      
      // Aggregate daily analytics
      await analyticsService.aggregateDailyAnalytics(sessionId)
      
      // Update any related goal progress
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: activeGoals } = await supabase
          .from('user_goals')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (activeGoals) {
          for (const goal of activeGoals) {
            await analyticsService.updateGoalProgress(goal.id)
          }
        }
      }

      console.log('✅ Analytics aggregation completed for session:', sessionId)
    } catch (error) {
      console.error('Analytics aggregation error:', error)
      // Don't throw - this is a background operation
    }
  }

  /**
   * Get workout session with exercises and sets
   */
  async getWorkoutSession(sessionId: string): Promise<{
    session: WorkoutSession
    exercises: (WorkoutExercise & { 
      exercise: Exercise
      sets: WorkoutSet[]
    })[]
  } | null> {
    try {
      const session = await db.getWorkoutSession(sessionId)
      if (!session) return null

      const workoutExercises = await db.getWorkoutExercises(sessionId)
      
      const exercises = await Promise.all(
        workoutExercises.map(async (workoutExercise) => {
          // Get exercise details
          const { data: exercise, error: exerciseError } = await supabase
            .from('exercises')
            .select('*')
            .eq('id', workoutExercise.exerciseId)
            .single()

          if (exerciseError) throw exerciseError

          // Get sets for this exercise
          const sets = await db.getWorkoutSets(workoutExercise.exerciseId)

          return {
            exerciseId: workoutExercise.exerciseId,
            exerciseName: exercise.exercise_name,
            exerciseOrder: workoutExercise.exerciseOrder,
            restTimeSeconds: workoutExercise.restTimeSeconds || 60,
            sets: sets.map(transformSupabaseSetData),
            primaryMuscles: [],
            secondaryMuscles: [],
            targetSets: 3,
            targetReps: 8,
            progressiveOverload: undefined,
            notes: undefined,
            targetWeight: 0,
            personalRecord: false,
            exercise: transformSupabaseExercise(exercise)
          }
        })
      )

      return { session, exercises: exercises as any }
    } catch (error) {
      console.error('Error getting workout session:', error)
      throw error
    }
  }

  /**
   * Get user's workout history
   */
  async getWorkoutHistory(userId: string, limit = 20): Promise<WorkoutSession[]> {
    try {
      return await db.getUserWorkoutSessions(userId, limit)
    } catch (error) {
      console.error('Error getting workout history:', error)
      throw error
    }
  }

  /**
   * Get user's personal records for an exercise
   */
  async getPersonalRecords(userId: string, exerciseId?: string): Promise<PersonalRecord[]> {
    try {
      return await db.getPersonalRecords(userId, exerciseId)
    } catch (error) {
      console.error('Error getting personal records:', error)
      throw error
    }
  }

  /**
   * Get exercises by workout type
   */
  async getExercisesByType(workoutType: string): Promise<Exercise[]> {
    try {
      return await db.getExercisesByWorkoutType(workoutType)
    } catch (error) {
      console.error('Error getting exercises by type:', error)
      throw error
    }
  }

  /**
   * Get all exercises
   */
  async getAllExercises(): Promise<Exercise[]> {
    try {
      return await db.getExercises()
    } catch (error) {
      console.error('Error getting all exercises:', error)
      throw error
    }
  }

  /**
   * Subscribe to real-time workout session updates
   */
  subscribeToWorkoutSession(sessionId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`workout-${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'workout_sessions',
          filter: `id=eq.${sessionId}`
        }, 
        callback
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'workout_exercises',
          filter: `workout_session_id=eq.${sessionId}`
        }, 
        callback
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'workout_sets'
        }, 
        callback
      )
      .subscribe()
  }

  /**
   * Subscribe to personal records updates
   */
  subscribeToPersonalRecords(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`prs-${userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'personal_records',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  }

  /**
   * Helper to calculate total session volume
   */
  private async getSessionVolume(sessionId: string): Promise<number> {
    // First get workout exercise IDs for this session
    const { data: exerciseIds, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select('id')
      .eq('workout_session_id', sessionId)

    if (exerciseError) throw exerciseError

    if (!exerciseIds || exerciseIds.length === 0) return 0

    // Then get sets for those exercises
    const { data, error } = await supabase
      .from('workout_sets')
      .select('weight_lbs, reps')
      .in('workout_exercise_id', exerciseIds.map(ex => ex.id))
      .eq('is_completed', true)

    if (error) throw error

    return data.reduce((total, set) => total + (set.weight_lbs * set.reps), 0)
  }

  /**
   * Cancel an in-progress workout
   */
  async cancelWorkout(sessionId: string): Promise<WorkoutSession> {
    try {
      return await db.updateWorkoutSession(sessionId, {
        status: 'cancelled',
        endTime: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error cancelling workout:', error)
      throw error
    }
  }
}

// Export singleton instance
export const workoutService = new SupabaseWorkoutService()