import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { localWorkoutService } from '@/services/local-workout-service'
import { useMuscleRecovery } from '@/hooks/use-muscle-recovery'
import type { WorkoutSession, WorkoutExercise, SetData, Exercise } from '@/lib/supabase'

interface WorkoutExerciseWithDetails extends WorkoutExercise {
  exercise: Exercise
  sets: SetData[]
}

interface WorkoutSessionData {
  session: WorkoutSession | null
  exercises: WorkoutExerciseWithDetails[]
}

export function useRealWorkoutSession(sessionId: string | null) {
  const { user } = useAuth()
  const { updateMuscleRecovery } = useMuscleRecovery()
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
      const data = await localWorkoutService.getWorkoutSession(sessionId)
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
    const channel = localWorkoutService.subscribeToWorkoutSession(sessionId, (payload) => {
      console.log('Real-time workout update:', payload)
      
      // Reload data when changes occur
      loadWorkoutData()
    })

    setSubscription(channel)

    // Also subscribe to personal records for notifications
    const prChannel = localWorkoutService.subscribeToPersonalRecords(user.id.toString(), (payload) => {
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
      const result = await localWorkoutService.startWorkout(workoutType, exerciseIds, sessionName)

      setWorkoutData({
        session: result.session,
        exercises: [] // New workouts start with no exercises
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
      const set = await localWorkoutService.logSet(workoutData.session.id, exerciseId, {
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
          if (ex.exerciseId === exerciseId) {
            return {
              ...ex,
              sets: [...ex.sets, set].sort((a, b) => a.setNumber - b.setNumber)
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
      const result = await localWorkoutService.completeWorkout(workoutData.session.id, rating, notes)
      const completedSession = result?.session || workoutData.session

      setWorkoutData(prev => ({
        ...prev,
        session: completedSession
      }))

      // Update muscle recovery after workout completion
      try {
        // Convert workout data to format expected by muscle recovery service
        const workoutSessionData = {
          id: completedSession.id,
          userId: user?.id?.toString() || '',
          date: new Date(completedSession.endTime || completedSession.lastModified),
          exercises: workoutData.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exercise.exerciseName,
            sets: ex.sets.length,
            reps: ex.sets.length > 0 ? ex.sets.reduce((total, set) => total + set.reps, 0) / ex.sets.length : 0,
            weight: ex.sets.length > 0 ? ex.sets.reduce((total, set) => total + set.weight, 0) / ex.sets.length : 0,
            rpe: ex.sets.length > 0 ? ex.sets.reduce((total, set) => total + (set.rpe || 7), 0) / ex.sets.length : 7,
            muscleActivation: [] // Will be populated by muscle mapping service
          })),
          totalDuration: completedSession.totalDuration || 0,
          rpe: rating || 7
        }

        await updateMuscleRecovery(workoutSessionData)
        console.log('✅ Muscle recovery updated after workout completion')
      } catch (recoveryError) {
        console.warn('Failed to update muscle recovery:', recoveryError)
        // Don't fail the workout completion if recovery update fails
      }

      return completedSession
    } catch (err: any) {
      console.error('Error completing workout:', err)
      setError(err.message || 'Failed to complete workout')
      throw err
    } finally {
      setLoading(false)
    }
  }, [workoutData.session, workoutData.exercises, user, updateMuscleRecovery])

  // Cancel workout
  const cancelWorkout = useCallback(async () => {
    if (!workoutData.session) throw new Error('No active workout session')

    setLoading(true)
    setError(null)

    try {
      // For now, just set session to cancelled status locally
      const cancelledSession = { ...workoutData.session, status: 'cancelled' as const }
      
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
    completedSets: workoutData.exercises.reduce((total, ex) => total + ex.sets.filter(set => set.completed).length, 0),
    totalVolume: workoutData.exercises.reduce((total, ex) => total + ex.sets.reduce((vol, set) => vol + set.volume, 0), 0),
    duration: workoutData.session?.totalDuration || 0,
    personalRecords: personalRecords.length,
    isComplete: workoutData.session?.status === 'completed',
    isInProgress: workoutData.session?.status === 'in_progress',
    isCancelled: workoutData.session?.status === 'cancelled'
  }

  // Get exercise by ID
  const getExercise = useCallback((exerciseId: string) => {
    return workoutData.exercises.find(ex => ex.exerciseId === exerciseId)
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