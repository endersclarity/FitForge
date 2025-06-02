import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-supabase-auth'
import { workoutService } from '@/services/supabase-workout-service'
import type { WorkoutSession, WorkoutExercise, WorkoutSet, Exercise } from '@/lib/supabase'

interface WorkoutExerciseWithDetails extends WorkoutExercise {
  exercise: Exercise
  sets: WorkoutSet[]
}

interface WorkoutSessionData {
  session: WorkoutSession | null
  exercises: WorkoutExerciseWithDetails[]
}

export function useRealWorkoutSession(sessionId: string | null) {
  const { user } = useAuth()
  const [workoutData, setWorkoutData] = useState<WorkoutSessionData>({
    session: null,
    exercises: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [personalRecords, setPersonalRecords] = useState<string[]>([]) // IDs of sets that are PRs
  
  // Real-time subscription
  const [subscription, setSubscription] = useState<any>(null)

  // Load workout data
  const loadWorkoutData = useCallback(async () => {
    if (!sessionId || !user) return

    setLoading(true)
    setError(null)

    try {
      const data = await workoutService.getWorkoutSession(sessionId)
      if (data) {
        setWorkoutData(data)
      }
    } catch (err: any) {
      console.error('Error loading workout data:', err)
      setError(err.message || 'Failed to load workout data')
    } finally {
      setLoading(false)
    }
  }, [sessionId, user])

  // Set up real-time subscription
  useEffect(() => {
    if (!sessionId || !user) return

    // Subscribe to workout updates
    const channel = workoutService.subscribeToWorkoutSession(sessionId, (payload) => {
      console.log('Real-time workout update:', payload)
      
      // Reload data when changes occur
      loadWorkoutData()
    })

    setSubscription(channel)

    // Also subscribe to personal records for notifications
    const prChannel = workoutService.subscribeToPersonalRecords(user.id, (payload) => {
      console.log('New personal record:', payload)
      
      if (payload.eventType === 'INSERT') {
        // Show notification for new PR
        setPersonalRecords(prev => [...prev, payload.new.workout_set_id])
        
        // Could dispatch a toast notification here
        console.log(`🎉 New ${payload.new.record_type} PR!`)
      }
    })

    // Cleanup function
    return () => {
      if (channel) {
        channel.unsubscribe()
      }
      if (prChannel) {
        prChannel.unsubscribe()
      }
    }
  }, [sessionId, user, loadWorkoutData])

  // Load initial data
  useEffect(() => {
    loadWorkoutData()
  }, [loadWorkoutData])

  // Start a new workout
  const startWorkout = useCallback(async (workoutType: string, exerciseIds: string[], sessionName?: string) => {
    if (!user) throw new Error('User not authenticated')

    setLoading(true)
    setError(null)

    try {
      const result = await workoutService.startWorkout({
        workoutType,
        exerciseIds,
        sessionName
      })

      setWorkoutData({
        session: result.session,
        exercises: result.exercises.map(ex => ({
          ...ex,
          sets: []
        }))
      })

      return result.session
    } catch (err: any) {
      console.error('Error starting workout:', err)
      setError(err.message || 'Failed to start workout')
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  // Log a set
  const logSet = useCallback(async (
    exerciseId: string,
    setNumber: number,
    reps: number,
    weight: number,
    formScore?: number,
    perceivedExertion?: number,
    equipment?: string
  ) => {
    if (!workoutData.session || !user) throw new Error('No active workout session')

    try {
      const set = await workoutService.logSet({
        sessionId: workoutData.session.id,
        exerciseId,
        setNumber,
        reps,
        weight,
        formScore,
        perceivedExertion,
        equipment
      })

      // Optimistically update local state
      setWorkoutData(prev => ({
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.exercise_id === exerciseId) {
            return {
              ...ex,
              sets: [...ex.sets, set].sort((a, b) => a.set_number - b.set_number),
              total_sets_completed: ex.total_sets_completed + 1,
              total_volume_lbs: ex.total_volume_lbs + (weight * reps)
            }
          }
          return ex
        })
      }))

      return set
    } catch (err: any) {
      console.error('Error logging set:', err)
      setError(err.message || 'Failed to log set')
      throw err
    }
  }, [workoutData.session, user])

  // Complete workout
  const completeWorkout = useCallback(async (rating?: number, notes?: string) => {
    if (!workoutData.session) throw new Error('No active workout session')

    setLoading(true)
    setError(null)

    try {
      const completedSession = await workoutService.completeWorkout({
        sessionId: workoutData.session.id,
        rating,
        notes
      })

      setWorkoutData(prev => ({
        ...prev,
        session: completedSession
      }))

      return completedSession
    } catch (err: any) {
      console.error('Error completing workout:', err)
      setError(err.message || 'Failed to complete workout')
      throw err
    } finally {
      setLoading(false)
    }
  }, [workoutData.session])

  // Cancel workout
  const cancelWorkout = useCallback(async () => {
    if (!workoutData.session) throw new Error('No active workout session')

    setLoading(true)
    setError(null)

    try {
      const cancelledSession = await workoutService.cancelWorkout(workoutData.session.id)
      
      setWorkoutData(prev => ({
        ...prev,
        session: cancelledSession
      }))

      return cancelledSession
    } catch (err: any) {
      console.error('Error cancelling workout:', err)
      setError(err.message || 'Failed to cancel workout')
      throw err
    } finally {
      setLoading(false)
    }
  }, [workoutData.session])

  // Calculate workout statistics
  const workoutStats = {
    totalSets: workoutData.exercises.reduce((total, ex) => total + ex.sets.length, 0),
    completedSets: workoutData.exercises.reduce((total, ex) => total + ex.sets.filter(set => set.is_completed).length, 0),
    totalVolume: workoutData.exercises.reduce((total, ex) => total + ex.total_volume_lbs, 0),
    duration: workoutData.session?.total_duration_seconds || 0,
    personalRecords: personalRecords.length,
    isComplete: workoutData.session?.completion_status === 'completed',
    isInProgress: workoutData.session?.completion_status === 'in_progress',
    isCancelled: workoutData.session?.completion_status === 'cancelled'
  }

  // Get exercise by ID
  const getExercise = useCallback((exerciseId: string) => {
    return workoutData.exercises.find(ex => ex.exercise_id === exerciseId)
  }, [workoutData.exercises])

  // Get sets for an exercise
  const getExerciseSets = useCallback((exerciseId: string) => {
    const exercise = getExercise(exerciseId)
    return exercise?.sets || []
  }, [getExercise])

  // Check if a set is a personal record
  const isPersonalRecord = useCallback((setId: string) => {
    return personalRecords.includes(setId)
  }, [personalRecords])

  return {
    // Data
    session: workoutData.session,
    exercises: workoutData.exercises,
    
    // State
    loading,
    error,
    
    // Actions
    startWorkout,
    logSet,
    completeWorkout,
    cancelWorkout,
    refreshData: loadWorkoutData,
    
    // Helpers
    workoutStats,
    getExercise,
    getExerciseSets,
    isPersonalRecord,
    
    // Real-time status
    isConnected: !!subscription,
  }
}