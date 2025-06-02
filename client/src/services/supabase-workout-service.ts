import { supabase, db } from '@/lib/supabase'
import type { 
  WorkoutSession, 
  WorkoutExercise, 
  WorkoutSet, 
  Exercise,
  PersonalRecord 
} from '@/lib/supabase'

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
        user_id: user.id,
        start_time: new Date().toISOString(),
        end_time: null,
        total_duration_seconds: null,
        workout_type: request.workoutType,
        session_name: request.sessionName || `${request.workoutType} Workout`,
        notes: null,
        total_volume_lbs: 0,
        calories_burned: null,
        average_heart_rate: null,
        completion_status: 'in_progress',
        user_rating: null
      })

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
            workout_session_id: session.id,
            exercise_id: exerciseId,
            user_id: user.id,
            exercise_order: index + 1,
            exercise_notes: null,
            total_volume_lbs: 0,
            total_sets_completed: 0,
            average_form_score: null,
            rest_time_seconds: null,
            started_at: new Date().toISOString(),
            completed_at: null
          })

          return {
            ...workoutExercise,
            exercise: exercise.data
          }
        })
      )

      return { session, exercises }
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

      await db.updateWorkoutSession(workoutExercise.workout_session_id, {
        total_volume_lbs: (await this.getSessionVolume(request.sessionId)) + (request.weight * request.reps)
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
      const startTime = new Date(session.start_time)
      const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000)

      // Update session
      const completedSession = await db.updateWorkoutSession(request.sessionId, {
        end_time: endTime,
        total_duration_seconds: duration,
        completion_status: 'completed',
        user_rating: request.rating || null,
        notes: request.notes || null
      })

      // Mark all exercises as completed
      await supabase
        .from('workout_exercises')
        .update({ completed_at: endTime })
        .eq('workout_session_id', request.sessionId)
        .is('completed_at', null)

      return completedSession
    } catch (error) {
      console.error('Error completing workout:', error)
      throw error
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
            .eq('id', workoutExercise.exercise_id)
            .single()

          if (exerciseError) throw exerciseError

          // Get sets for this exercise
          const sets = await db.getWorkoutSets(workoutExercise.id)

          return {
            ...workoutExercise,
            exercise,
            sets
          }
        })
      )

      return { session, exercises }
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
        completion_status: 'cancelled',
        end_time: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error cancelling workout:', error)
      throw error
    }
  }
}

// Export singleton instance
export const workoutService = new SupabaseWorkoutService()