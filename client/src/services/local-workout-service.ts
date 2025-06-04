import type { WorkoutSession, WorkoutExercise, WorkoutSet, Exercise } from '@/lib/supabase'

export interface WorkoutSessionData {
  session: WorkoutSession | null
  exercises: (WorkoutExercise & { exercise: Exercise; sets: WorkoutSet[] })[]
}

export class LocalWorkoutService {
  
  /**
   * Get workout session by ID from local API
   */
  async getWorkoutSession(sessionId: string): Promise<WorkoutSessionData | null> {
    try {
      // Fetch from local REST API
      const response = await fetch('/api/workout-sessions')
      if (!response.ok) {
        throw new Error(`Failed to fetch workout sessions: ${response.status}`)
      }
      
      const sessions = await response.json()
      const session = sessions.find((s: any) => s.id === sessionId)
      
      if (!session) {
        console.warn(`Workout session ${sessionId} not found`)
        return null
      }
      
      // Convert to expected format
      const workoutSession: WorkoutSession = {
        id: session.id,
        user_id: session.userId.toString(),
        start_time: session.startTime,
        end_time: session.endTime || null,
        total_duration_seconds: session.duration ? session.duration * 60 : null,
        workout_type: session.workoutType || 'Custom',
        session_name: session.sessionName || null,
        notes: session.notes || null,
        total_volume_lbs: session.totalVolume || 0,
        calories_burned: session.caloriesBurned || 0,
        average_heart_rate: null,
        completion_status: session.completionStatus === 'completed' ? 'completed' : 'in_progress',
        user_rating: session.rating || null,
        created_at: session.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Convert exercises
      const exercises: (WorkoutExercise & { exercise: Exercise; sets: WorkoutSet[] })[] = 
        session.exercises?.map((ex: any, index: number) => ({
          id: `${sessionId}-${index}`,
          workout_session_id: sessionId,
          exercise_id: `${index}`,
          user_id: '1',
          exercise_order: index + 1,
          exercise_notes: null,
          total_volume_lbs: ex.sets?.reduce((total: number, set: any) => total + (set.weight * set.reps), 0) || 0,
          total_sets_completed: ex.sets?.length || 0,
          average_form_score: ex.formScore || null,
          rest_time_seconds: ex.sets?.map((set: any) => set.restTime || 60) || [],
          started_at: new Date().toISOString(),
          completed_at: session.completionStatus === 'completed' ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          exercise: {
            id: `${index}`,
            exercise_name: ex.exerciseName,
            category: 'strength',
            movement_pattern: null,
            workout_type: 'strength',
            equipment_type: ['bodyweight'],
            difficulty_level: 'intermediate' as const,
            variation: null,
            default_reps: ex.sets?.[0]?.reps || 10,
            default_weight_lbs: ex.sets?.[0]?.weight || 0,
            rest_time_seconds: ex.sets?.[0]?.restTime || 60,
            description: null,
            form_cues: null,
            contraindications: null,
            safety_notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          sets: ex.sets?.map((set: any, setIndex: number) => ({
            id: `${sessionId}-${index}-${setIndex}`,
            workout_exercise_id: `${sessionId}-${index}`,
            user_id: '1',
            set_number: setIndex + 1,
            reps: set.reps,
            weight_lbs: set.weight,
            form_score: set.formScore || null,
            perceived_exertion: null,
            is_completed: true,
            is_personal_record: false,
            equipment_used: 'bodyweight',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            rest_time_after_seconds: set.restTime || 60,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })) || []
        })) || []
      
      return {
        session: workoutSession,
        exercises
      }
    } catch (error) {
      console.error('Error fetching workout session:', error)
      throw error
    }
  }

  /**
   * Start a new workout - creates in-progress session
   */
  async startWorkout(workoutType: string, exerciseIds: string[], sessionName?: string) {
    try {
      // Create a new session via API (if endpoint exists)
      // For now, return a mock session that would be created
      const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      
      const session: WorkoutSession = {
        id: sessionId,
        user_id: '1',
        start_time: new Date().toISOString(),
        end_time: null,
        total_duration_seconds: null,
        workout_type: workoutType,
        session_name: sessionName || null,
        notes: null,
        total_volume_lbs: 0,
        calories_burned: 0,
        average_heart_rate: null,
        completion_status: 'in_progress',
        user_rating: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      return {
        session,
        exercises: []
      }
    } catch (error) {
      console.error('Error starting workout:', error)
      throw error
    }
  }

  /**
   * Log a set for an exercise
   */
  async logSet(sessionId: string, exerciseId: string, setData: {
    setNumber: number
    reps: number
    weight: number
    formScore?: number
    perceivedExertion?: number
    equipment?: string
  }) {
    try {
      // In a real implementation, this would update the backend
      console.log('Logging set:', { sessionId, exerciseId, setData })
      
      // Return a mock WorkoutSet object
      const workoutSet: WorkoutSet = {
        id: `${sessionId}-${exerciseId}-${setData.setNumber}`,
        workout_exercise_id: exerciseId,
        user_id: '1',
        set_number: setData.setNumber,
        reps: setData.reps,
        weight_lbs: setData.weight,
        form_score: setData.formScore || null,
        perceived_exertion: setData.perceivedExertion || null,
        is_completed: true,
        is_personal_record: false,
        equipment_used: setData.equipment || null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        rest_time_after_seconds: 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      return workoutSet
    } catch (error) {
      console.error('Error logging set:', error)
      throw error
    }
  }

  /**
   * Complete a workout session
   */
  async completeWorkout(sessionId: string, rating?: number, notes?: string) {
    try {
      // In a real implementation, this would update the session status
      console.log('Completing workout:', { sessionId, rating, notes })
      
      // Return the updated session
      return this.getWorkoutSession(sessionId)
    } catch (error) {
      console.error('Error completing workout:', error)
      throw error
    }
  }

  /**
   * Subscribe to workout updates (mock for local development)
   */
  subscribeToWorkoutSession(sessionId: string, callback: (payload: any) => void) {
    // Mock subscription - in real implementation would use WebSocket or polling
    console.log('Mock subscription for session:', sessionId)
    return {
      unsubscribe: () => console.log('Unsubscribed from session:', sessionId)
    }
  }

  /**
   * Subscribe to personal records (mock for local development)
   */
  subscribeToPersonalRecords(userId: string, callback: (payload: any) => void) {
    // Mock subscription
    console.log('Mock subscription for PRs:', userId)
    return {
      unsubscribe: () => console.log('Unsubscribed from PRs:', userId)
    }
  }
}

// Export singleton instance
export const localWorkoutService = new LocalWorkoutService()