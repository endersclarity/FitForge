import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "./use-auth";
import { localWorkoutService } from "@/services/local-workout-service";
import type { WorkoutSession, WorkoutExercise, WorkoutSet, Exercise } from "@/lib/supabase";

// Legacy WorkoutSet interface for backward compatibility
export interface LegacyWorkoutSet {
  weight: number;
  reps: number;
  equipment: string;
  timestamp: Date;
  setNumber: number;
  volume: number; // calculated: weight * reps
}

export interface ExerciseSession {
  exerciseId: string;
  exerciseName: string;
  sets: LegacyWorkoutSet[];
  completed: boolean;
  restTimeRemaining: number;
}

export interface WorkoutSessionState {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  currentExerciseIndex: number;
  exercises: ExerciseSession[];
  status: "in_progress" | "paused" | "completed" | "cancelled";
  totalVolume: number;
  estimatedCalories: number;
  workoutType: string; // "Abs", "BackBiceps", "ChestTriceps", "Legs"
}

// Legacy WorkoutExercise interface for backward compatibility
export interface LegacyWorkoutExercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  restTime: number; // seconds
  difficulty: string;
  workoutType: string;
}

export interface SessionConflictData {
  sessionId: string;
  sessionStartTime: string;
  sessionExerciseCount: number;
  canAbandon: boolean;
  message: string;
  idleTime?: number; // Smart session management data
  warningLevel?: 'none' | 'warning' | 'critical';
}

export class SessionConflictError extends Error {
  public conflictData: SessionConflictData;
  
  constructor(conflictData: SessionConflictData) {
    super(conflictData.message);
    this.name = 'SessionConflictError';
    this.conflictData = conflictData;
  }
}

interface WorkoutSessionContextType {
  session: WorkoutSessionState | null;
  loading: boolean;
  error: string | null;
  startWorkout: (workoutType: string, exercises: LegacyWorkoutExercise[]) => Promise<void>;
  abandonActiveSession: () => Promise<void>;
  resumeActiveSession: () => Promise<void>;
  checkForActiveSession: () => Promise<SessionConflictData | null>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  endWorkout: (rating?: number, notes?: string) => Promise<void>;
  logSet: (weight: number, reps: number, equipment: string) => Promise<void>;
  completeExercise: () => void;
  nextExercise: () => void;
  previousExercise: () => void;
  updateRestTimer: (timeRemaining: number) => void;
  calculateSessionStats: () => {
    totalSets: number;
    totalVolume: number;
    estimatedCalories: number;
    duration: number;
    averageRestTime: number;
  };
}

const WorkoutSessionContext = createContext<WorkoutSessionContextType | undefined>(undefined);

export function WorkoutSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WorkoutSessionState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Current Supabase workout session (for real-time updates)
  const [currentSupabaseSession, setCurrentSupabaseSession] = useState<WorkoutSession | null>(null);

  const startWorkout = useCallback(async (workoutType: string, exercises: LegacyWorkoutExercise[]) => {
    if (!user) {
      // In development mode, create a mock user session instead of failing
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('User must be authenticated to start a workout');
      }
    }

    setLoading(true);
    setError(null);

    try {
      // In development mode or when Supabase is unavailable, create a unified storage session
      if (process.env.NODE_ENV === 'development' || !user) {
        // Register session with unified storage system first
        try {
          const sessionId = `local-${Date.now()}`;
          await fetch('/api/workouts/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workoutType,
              plannedExercises: exercises.map(ex => ex.name)
            })
          });
        } catch (error) {
          console.warn("Could not register with unified storage, continuing with local session:", error);
        }
        
        // Create a local session that matches unified storage format
        const sessionId = `local-${Date.now()}`;
        const newSession: WorkoutSessionState = {
          sessionId,
          startTime: new Date(),
          currentExerciseIndex: 0,
          exercises: exercises.map(ex => ({
            exerciseId: ex.id,
            exerciseName: ex.name,
            sets: [],
            completed: false,
            restTimeRemaining: ex.restTime || 60
          })),
          status: "in_progress",
          totalVolume: 0,
          estimatedCalories: 0,
          workoutType
        };

        setSession(newSession);
        return;
      }

      // Production mode with Supabase

      // Check for existing active session
      const activeSession = await checkForActiveSession();
      if (activeSession) {
        throw new SessionConflictError(activeSession);
      }

      // Start workout using Supabase service
      const result = await localWorkoutService.startWorkout(
        workoutType,
        exercises.map(ex => ex.id),
        `${workoutType} Workout`
      );

      setCurrentSupabaseSession(result.session);

      // Create frontend session state for compatibility
      const newSession: WorkoutSessionState = {
        sessionId: result.session.id,
        startTime: new Date(result.session.startTime),
        currentExerciseIndex: 0,
        exercises: [], // New workouts start with no exercises
        status: "in_progress",
        totalVolume: 0,
        estimatedCalories: 0,
        workoutType
      };

      setSession(newSession);

    } catch (error) {
      console.error("Error starting Supabase workout:", error);
      setError(error instanceof Error ? error.message : 'Failed to start workout');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const pauseWorkout = useCallback(() => {
    if (session) {
      const updatedSession = { ...session, status: "paused" as const };
      setSession(updatedSession);
      // Pause functionality can be implemented in Supabase if needed
    }
  }, [session]);

  const resumeWorkout = useCallback(() => {
    if (session) {
      const updatedSession = { ...session, status: "in_progress" as const };
      setSession(updatedSession);
      // Resume functionality can be implemented in Supabase if needed
    }
  }, [session]);

  const endWorkout = useCallback(async (rating?: number, notes?: string) => {
    if (!session) {
      throw new Error('No active workout session to complete');
    }

    setLoading(true);
    setError(null);

    try {
      // Development mode: Complete local session without Supabase
      if (process.env.NODE_ENV === 'development' || !currentSupabaseSession) {
        // Update local session to completed
        const updatedSession = { 
          ...session, 
          status: "completed" as const,
          endTime: new Date()
        };
        setSession(updatedSession);
        
        // UNIFIED STORAGE: Save workout session using the proper storage service
        try {
          // Create a structured workout session for unified storage
          const sessionData = {
            userId: 1, // Default user for local development
            sessionId: session.sessionId,
            workoutType: session.workoutType,
            startTime: session.startTime.toISOString(),
            endTime: new Date().toISOString(),
            totalDuration: Math.floor((Date.now() - session.startTime.getTime()) / 1000),
            totalVolume: session.totalVolume,
            caloriesBurned: session.estimatedCalories || Math.floor(session.totalVolume * 0.1),
            status: "completed",
            exercises: session.exercises.map(ex => ({
              exerciseId: ex.exerciseId,
              exerciseName: ex.exerciseName,
              sets: ex.sets.map((set, index) => ({
                setNumber: index + 1,
                weight: set.weight,
                reps: set.reps,
                completed: true,
                timestamp: set.timestamp.toISOString(),
                volume: set.weight * set.reps
              })),
              restTimes: [],
              totalVolume: ex.sets.reduce((vol, set) => vol + (set.weight * set.reps), 0)
            })),
            notes: notes || `Workout completed: ${session.exercises.length} exercises, ${session.totalVolume} lbs total volume`
          };

          // Save to unified storage using the proper completion endpoint
          await fetch(`/api/workouts/${session.sessionId}/complete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rating: rating || 5,
              notes: notes || `Workout completed: ${session.exercises.length} exercises, ${session.totalVolume} lbs total volume`
            })
          });
        } catch (error) {
          console.warn("Could not save to unified storage, session still marked complete:", error);
        }
        
        return;
      }

      // Production mode: Complete workout using Supabase service

      const result = await localWorkoutService.completeWorkout(
        currentSupabaseSession.id, 
        rating || 5, 
        notes || `Workout completed: ${session.exercises.length} exercises, ${session.totalVolume} lbs total volume, ${session.estimatedCalories} calories burned.`
      );
      const completedSession = result?.session || currentSupabaseSession;

      // Update local session state
      const updatedSession = { 
        ...session, 
        status: "completed" as const,
        endTime: new Date(completedSession.endTime!)
      };
      setSession(updatedSession);
      setCurrentSupabaseSession(completedSession);

    } catch (error) {
      console.error("Error completing workout:", error);
      setError(error instanceof Error ? error.message : 'Failed to complete workout');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session, currentSupabaseSession]);

  const logSet = useCallback(async (weight: number, reps: number, equipment: string) => {
    if (!session) {
      throw new Error('No active workout session to log set');
    }

    const currentExercise = session.exercises[session.currentExerciseIndex];
    const volume = weight * reps;
    
    try {
      // Development mode: log to local file and state
      if (process.env.NODE_ENV === 'development' || !currentSupabaseSession) {
        // Create local set
        const newSet: LegacyWorkoutSet = {
          weight,
          reps,
          equipment,
          timestamp: new Date(),
          setNumber: currentExercise.sets.length + 1,
          volume
        };

        // Log to unified storage (via proper API endpoint)
        try {
          // Send to unified storage system
          await fetch(`/api/workouts/${session.sessionId}/sets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              exerciseId: parseInt(currentExercise.exerciseId), // Convert to number for fileStorage
              exerciseName: currentExercise.exerciseName,
              setNumber: newSet.setNumber,
              weight: newSet.weight,
              reps: newSet.reps,
              equipment: newSet.equipment
            })
          });
        } catch (error) {
          console.warn("Could not log to unified storage, continuing with local state only:", error);
        }

        // Update local session state
        setSession(prev => {
          if (!prev) return prev;
          const newExercises = [...prev.exercises];
          newExercises[prev.currentExerciseIndex] = {
            ...currentExercise,
            sets: [...currentExercise.sets, newSet]
          };
          return {
            ...prev,
            exercises: newExercises,
            totalVolume: prev.totalVolume + volume,
            estimatedCalories: prev.estimatedCalories + Math.round(volume * 0.1)
          };
        });

        return;
      }

      // Production mode: use Supabase
      // Log set using Supabase service
      const loggedSet = await localWorkoutService.logSet(
        currentSupabaseSession.id,
        currentExercise.exerciseId,
        {
          setNumber: currentExercise.sets.length + 1,
          reps,
          weight,
          equipment
        }
      );

      // Create legacy set for frontend compatibility
      const newSet: LegacyWorkoutSet = {
        weight,
        reps,
        equipment,
        timestamp: new Date(loggedSet.timestamp),
        setNumber: loggedSet.setNumber,
        volume
      };

      // Update frontend session state immediately (optimistic update)
      const updatedSession = { ...session };
      updatedSession.exercises[session.currentExerciseIndex].sets.push(newSet);
      updatedSession.totalVolume += volume;
      
      // Simple calorie calculation: approximately 0.1 calories per pound moved
      updatedSession.estimatedCalories += Math.round(volume * 0.1);

      setSession(updatedSession);

    } catch (error) {
      console.error("Error logging set to Supabase:", error);
      setError(error instanceof Error ? error.message : 'Failed to log set');
      throw error;
    }
  }, [session, currentSupabaseSession]);

  const completeExercise = useCallback(() => {
    if (!session) return;

    const updatedSession = { ...session };
    updatedSession.exercises[session.currentExerciseIndex].completed = true;
    setSession(updatedSession);
  }, [session]);

  const nextExercise = useCallback(() => {
    if (!session || session.currentExerciseIndex >= session.exercises.length - 1) return;

    const updatedSession = { 
      ...session, 
      currentExerciseIndex: session.currentExerciseIndex + 1 
    };
    setSession(updatedSession);
  }, [session]);

  const previousExercise = useCallback(() => {
    if (!session || session.currentExerciseIndex <= 0) return;

    const updatedSession = { 
      ...session, 
      currentExerciseIndex: session.currentExerciseIndex - 1 
    };
    setSession(updatedSession);
  }, [session]);

  const updateRestTimer = useCallback((timeRemaining: number) => {
    if (!session) return;

    const updatedSession = { ...session };
    updatedSession.exercises[session.currentExerciseIndex].restTimeRemaining = timeRemaining;
    
    setSession(updatedSession);
  }, [session]);

  const calculateSessionStats = useCallback(() => {
    if (!session) {
      return {
        totalSets: 0,
        totalVolume: 0,
        estimatedCalories: 0,
        duration: 0,
        averageRestTime: 0
      };
    }

    const totalSets = session.exercises.reduce((total, ex) => total + ex.sets.length, 0);
    const duration = session.endTime 
      ? session.endTime.getTime() - session.startTime.getTime()
      : Date.now() - session.startTime.getTime();

    // Calculate average rest time based on completed exercises
    const completedExercises = session.exercises.filter(ex => ex.completed);
    const averageRestTime = completedExercises.length > 0
      ? completedExercises.reduce((total, ex) => total + ex.restTimeRemaining, 0) / completedExercises.length
      : 0;

    return {
      totalSets,
      totalVolume: session.totalVolume,
      estimatedCalories: session.estimatedCalories,
      duration,
      averageRestTime
    };
  }, [session]);


  const abandonActiveSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First check for active sessions to get session ID
      const conflictData = await checkForActiveSession();
      if (!conflictData) {
        setSession(null);
        setCurrentSupabaseSession(null);
        return;
      }

      // Use new smart session management abandon API
      const response = await fetch('/api/workout-sessions/abandon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': '1' // Development user ID
        },
        body: JSON.stringify({
          sessionId: conflictData.sessionId,
          savePartialData: true // Save partial data by default
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to abandon session');
      }

      const result = await response.json();
      
      // Clear local session state
      setSession(null);
      setCurrentSupabaseSession(null);
      
    } catch (error) {
      console.error('Error abandoning active session:', error);
      setError(error instanceof Error ? error.message : 'Failed to abandon session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const resumeActiveSession = useCallback(async () => {
    if (!user && process.env.NODE_ENV !== 'development') {
      throw new Error('User must be authenticated to resume a workout');
    }

    setLoading(true);
    setError(null);

    try {
      // Get user's workout history to find most recent in-progress session
      if (!user) {
        return;
      }
      const workoutHistory = await localWorkoutService.getWorkoutHistory(user.id.toString(), 5);
      const activeSession = workoutHistory.find((session: any) => session.completion_status === 'in_progress');
      
      if (!activeSession) {
        throw new Error('No active session to resume');
      }

      // Get full session details with exercises and sets
      const sessionData = await localWorkoutService.getWorkoutSession(activeSession.id);
      if (!sessionData || !sessionData.session) {
        throw new Error('Failed to load session details');
      }

      setCurrentSupabaseSession(sessionData.session);

      // Convert to frontend session state
      const resumedSession: WorkoutSessionState = {
        sessionId: sessionData.session.id,
        startTime: new Date(sessionData.session.startTime),
        endTime: sessionData.session.endTime ? new Date(sessionData.session.endTime) : undefined,
        currentExerciseIndex: 0, // Start from beginning
        exercises: sessionData.exercises.map(ex => ({
          exerciseId: ex.exercise.id,
          exerciseName: ex.exercise.exerciseName,
          sets: ex.sets.map(set => ({
            weight: set.weight,
            reps: set.reps,
            equipment: set.equipment || '',
            timestamp: new Date(set.timestamp),
            setNumber: set.setNumber,
            volume: set.volume
          })),
          completed: ex.sets.length > 0,
          restTimeRemaining: ex.exercise.restTimeSeconds || 60
        })),
        status: "in_progress",
        totalVolume: sessionData.session.totalVolume,
        estimatedCalories: sessionData.session.caloriesBurned || 0,
        workoutType: sessionData.session.workoutType || 'General'
      };
      
      setSession(resumedSession);
    } catch (error) {
      console.error('Error resuming active session:', error);
      setError(error instanceof Error ? error.message : 'Failed to resume session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkForActiveSession = useCallback(async (): Promise<SessionConflictData | null> => {
    try {
      // Use new smart session management API
      const response = await fetch('/api/workout-sessions/check-conflicts?workoutType=General', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': '1' // Development user ID
        }
      });
      
      if (!response.ok) {
        console.error('Failed to check session conflicts:', response.statusText);
        return null;
      }
      
      const result = await response.json();
      
      if (result.hasConflict && result.conflictData) {
        return {
          sessionId: result.conflictData.sessionId,
          sessionStartTime: result.conflictData.sessionStartTime,
          sessionExerciseCount: result.conflictData.sessionExerciseCount,
          canAbandon: result.conflictData.canAbandon,
          message: result.conflictData.message
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for active session:', error);
      return null;
    }
  }, []);

  // Initialize session recovery on mount - check for active Supabase sessions
  React.useEffect(() => {
    if (user) {
      // Check for any active sessions and optionally resume
      checkForActiveSession().catch(error => {
        console.error('Error checking for active session on mount:', error);
      });
    }
  }, [user, checkForActiveSession]);

  return (
    <WorkoutSessionContext.Provider
      value={{
        session,
        loading,
        error,
        startWorkout,
        abandonActiveSession,
        resumeActiveSession,
        checkForActiveSession,
        pauseWorkout,
        resumeWorkout,
        endWorkout,
        logSet,
        completeExercise,
        nextExercise,
        previousExercise,
        updateRestTimer,
        calculateSessionStats
      }}
    >
      {children}
    </WorkoutSessionContext.Provider>
  );
}

export function useWorkoutSession() {
  const context = useContext(WorkoutSessionContext);
  if (context === undefined) {
    throw new Error('useWorkoutSession must be used within a WorkoutSessionProvider');
  }
  return context;
}