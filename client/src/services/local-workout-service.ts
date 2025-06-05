import type { WorkoutSession, WorkoutExercise, SetData, Exercise } from '@/lib/supabase'

export interface WorkoutSessionData {
  session: WorkoutSession | null
  exercises: (WorkoutExercise & { exercise: Exercise; sets: SetData[] })[]
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
      
      // Convert to expected format (canonical schema)
      const workoutSession: WorkoutSession = {
        id: session.id,
        userId: session.userId.toString(),
        status: session.completionStatus === 'completed' ? 'completed' : 'in_progress',
        startTime: session.startTime,
        endTime: session.endTime,
        lastModified: new Date().toISOString(),
        workoutType: session.workoutType || 'Custom',
        sessionName: session.sessionName,
        exercises: [], // Will be set separately
        totalVolume: session.totalVolume || 0,
        totalDuration: session.duration || 0,
        caloriesBurned: session.caloriesBurned || 0,
        rating: session.rating,
        notes: session.notes,
        personalRecords: []
      }
      
      // Convert exercises (canonical schema)
      const exercises: (WorkoutExercise & { exercise: Exercise; sets: SetData[] })[] = 
        session.exercises?.map((ex: any, index: number) => ({
          exerciseId: `${index}`,
          exerciseName: ex.exerciseName,
          exerciseOrder: index + 1,
          sets: ex.sets?.map((set: any, setIndex: number) => ({
            setNumber: setIndex + 1,
            weight: set.weight,
            reps: set.reps,
            volume: set.weight * set.reps,
            completed: true,
            timestamp: new Date().toISOString(),
            formScore: set.formScore,
            isWarmup: false,
            isDropSet: false,
            isFailure: false
          })) || [],
          targetSets: ex.sets?.length || 3,
          targetReps: ex.sets?.[0]?.reps || 10,
          targetWeight: ex.sets?.[0]?.weight || 0,
          restTimeSeconds: 60,
          category: 'strength',
          primaryMuscles: [],
          secondaryMuscles: [],
          personalRecord: false,
          exercise: {
            id: `${index}`,
            exerciseName: ex.exerciseName,
            category: 'strength',
            workoutType: 'strength',
            equipmentType: ['bodyweight'],
            difficultyLevel: 'intermediate' as const,
            defaultReps: ex.sets?.[0]?.reps || 10,
            defaultWeightLbs: ex.sets?.[0]?.weight || 0,
            restTimeSeconds: 60,
            primaryMuscles: [],
            secondaryMuscles: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
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
        userId: '1',
        status: 'in_progress',
        startTime: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        workoutType: workoutType,
        sessionName: sessionName,
        exercises: [],
        totalVolume: 0,
        totalDuration: 0,
        caloriesBurned: 0,
        personalRecords: []
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
  }): Promise<SetData> {
    try {
      // In a real implementation, this would update the backend
      
      // Return canonical SetData format
      const set: SetData = {
        setNumber: setData.setNumber,
        weight: setData.weight,
        reps: setData.reps,
        volume: setData.weight * setData.reps,
        completed: true,
        timestamp: new Date().toISOString(),
        formScore: setData.formScore,
        rpe: setData.perceivedExertion,
        equipment: setData.equipment,
        isWarmup: false,
        isDropSet: false,
        isFailure: false
      }
      
      return set
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
    return {
      unsubscribe: () => {}
    }
  }

  /**
   * Subscribe to personal records (mock for local development)
   */
  subscribeToPersonalRecords(userId: string, callback: (payload: any) => void) {
    // Mock subscription
    return {
      unsubscribe: () => {}
    }
  }

  /**
   * Cancel a workout session
   */
  async cancelWorkout(sessionId: string) {
    try {
      // In a real implementation, this would update the session status
      return true
    } catch (error) {
      console.error('Error cancelling workout:', error)
      throw error
    }
  }

  /**
   * Get workout history for a user
   */
  async getWorkoutHistory(userId: string, limit: number = 10) {
    try {
      const response = await fetch('/api/workout-sessions')
      if (!response.ok) {
        throw new Error(`Failed to fetch workout history: ${response.status}`)
      }
      
      const sessions = await response.json()
      
      // Filter by user and convert to expected format
      const userSessions = sessions
        .filter((s: any) => s.userId.toString() === userId.toString())
        .slice(0, limit)
        .map((session: any) => ({
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
        }))
      
      return userSessions
    } catch (error) {
      console.error('Error fetching workout history:', error)
      throw error
    }
  }
}

// Export singleton instance
export const localWorkoutService = new LocalWorkoutService()