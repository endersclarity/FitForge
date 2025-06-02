import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "./use-supabase-auth";
import { workoutService } from "@/services/supabase-workout-service";
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
      throw new Error('User must be authenticated to start a workout');
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🏋️ Starting Supabase workout session...");
      console.log("🏋️ Workout type:", workoutType);
      console.log("🏋️ Exercises:", exercises.length);

      // Check for existing active session
      const activeSession = await checkForActiveSession();
      if (activeSession) {
        throw new SessionConflictError(activeSession);
      }

      // Start workout using Supabase service
      const result = await workoutService.startWorkout({
        workoutType,
        exerciseIds: exercises.map(ex => ex.id),
        sessionName: `${workoutType} Workout`
      });

      setCurrentSupabaseSession(result.session);

      // Create frontend session state for compatibility
      const newSession: WorkoutSessionState = {
        sessionId: result.session.id,
        startTime: new Date(result.session.start_time),
        currentExerciseIndex: 0,
        exercises: result.exercises.map(ex => ({
          exerciseId: ex.exercise.id,
          exerciseName: ex.exercise.exercise_name,
          sets: [],
          completed: false,
          restTimeRemaining: ex.exercise.rest_time_seconds || 60
        })),
        status: "in_progress",
        totalVolume: 0,
        estimatedCalories: 0,
        workoutType
      };

      setSession(newSession);
      console.log("✅ Supabase workout session started successfully");

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
      // TODO: Could implement pause functionality in Supabase if needed
    }
  }, [session]);

  const resumeWorkout = useCallback(() => {
    if (session) {
      const updatedSession = { ...session, status: "in_progress" as const };
      setSession(updatedSession);
      // TODO: Could implement resume functionality in Supabase if needed
    }
  }, [session]);

  const endWorkout = useCallback(async (rating?: number, notes?: string) => {
    if (!session || !currentSupabaseSession) {
      throw new Error('No active workout session to complete');
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🏁 Completing Supabase workout session...");

      // Complete workout using Supabase service
      const completedSession = await workoutService.completeWorkout({
        sessionId: currentSupabaseSession.id,
        rating: rating || 5,
        notes: notes || `Workout completed: ${session.exercises.length} exercises, ${session.totalVolume} lbs total volume, ${session.estimatedCalories} calories burned.`
      });

      // Update local session state
      const updatedSession = { 
        ...session, 
        status: "completed" as const,
        endTime: new Date(completedSession.end_time!)
      };
      setSession(updatedSession);
      setCurrentSupabaseSession(completedSession);
      
      console.log("✅ Workout completed successfully in Supabase");

    } catch (error) {
      console.error("Error completing workout:", error);
      setError(error instanceof Error ? error.message : 'Failed to complete workout');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session, currentSupabaseSession]);

  const logSet = useCallback(async (weight: number, reps: number, equipment: string) => {
    if (!session || !currentSupabaseSession) {
      throw new Error('No active workout session to log set');
    }

    const currentExercise = session.exercises[session.currentExerciseIndex];
    const volume = weight * reps;
    
    try {
      console.log("📝 Logging set to Supabase...");

      // Log set using Supabase service
      const loggedSet = await workoutService.logSet({
        sessionId: currentSupabaseSession.id,
        exerciseId: currentExercise.exerciseId,
        setNumber: currentExercise.sets.length + 1,
        reps,
        weight,
        equipment
      });

      // Create legacy set for frontend compatibility
      const newSet: LegacyWorkoutSet = {
        weight,
        reps,
        equipment,
        timestamp: new Date(loggedSet.completed_at!),
        setNumber: loggedSet.set_number,
        volume
      };

      // Update frontend session state immediately (optimistic update)
      const updatedSession = { ...session };
      updatedSession.exercises[session.currentExerciseIndex].sets.push(newSet);
      updatedSession.totalVolume += volume;
      
      // Simple calorie calculation: approximately 0.1 calories per pound moved
      updatedSession.estimatedCalories += Math.round(volume * 0.1);

      setSession(updatedSession);
      console.log("✅ Set logged to Supabase successfully");

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
    if (!currentSupabaseSession) {
      throw new Error('No active session to abandon');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ Abandoning Supabase workout session...');

      // Cancel workout using Supabase service
      await workoutService.cancelWorkout(currentSupabaseSession.id);
      
      // Clear local session state
      setSession(null);
      setCurrentSupabaseSession(null);
      
      console.log('✅ Active session abandoned successfully');
    } catch (error) {
      console.error('Error abandoning active session:', error);
      setError(error instanceof Error ? error.message : 'Failed to abandon session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentSupabaseSession]);

  const resumeActiveSession = useCallback(async () => {
    if (!user) {
      throw new Error('User must be authenticated to resume a workout');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Resuming Supabase workout session...');
      
      // Get user's workout history to find most recent in-progress session
      const workoutHistory = await workoutService.getWorkoutHistory(user.id, 5);
      const activeSession = workoutHistory.find(session => session.completion_status === 'in_progress');
      
      if (!activeSession) {
        throw new Error('No active session to resume');
      }

      // Get full session details with exercises and sets
      const sessionData = await workoutService.getWorkoutSession(activeSession.id);
      if (!sessionData) {
        throw new Error('Failed to load session details');
      }

      setCurrentSupabaseSession(sessionData.session);

      // Convert to frontend session state
      const resumedSession: WorkoutSessionState = {
        sessionId: sessionData.session.id,
        startTime: new Date(sessionData.session.start_time),
        endTime: sessionData.session.end_time ? new Date(sessionData.session.end_time) : undefined,
        currentExerciseIndex: 0, // Start from beginning
        exercises: sessionData.exercises.map(ex => ({
          exerciseId: ex.exercise.id,
          exerciseName: ex.exercise.exercise_name,
          sets: ex.sets.map(set => ({
            weight: set.weight_lbs,
            reps: set.reps,
            equipment: set.equipment_used || '',
            timestamp: new Date(set.completed_at!),
            setNumber: set.set_number,
            volume: set.weight_lbs * set.reps
          })),
          completed: ex.sets.length > 0,
          restTimeRemaining: ex.exercise.rest_time_seconds || 60
        })),
        status: "in_progress",
        totalVolume: sessionData.session.total_volume_lbs,
        estimatedCalories: sessionData.session.calories_burned || 0,
        workoutType: sessionData.session.workout_type || 'General'
      };
      
      setSession(resumedSession);
      console.log('✅ Active session resumed successfully');
    } catch (error) {
      console.error('Error resuming active session:', error);
      setError(error instanceof Error ? error.message : 'Failed to resume session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkForActiveSession = useCallback(async (): Promise<SessionConflictData | null> => {
    if (!user) return null;

    try {
      // Get user's recent workout history to check for active sessions
      const workoutHistory = await workoutService.getWorkoutHistory(user.id, 5);
      const activeSession = workoutHistory.find(session => session.completion_status === 'in_progress');
      
      if (activeSession) {
        return {
          sessionId: activeSession.id,
          sessionStartTime: activeSession.start_time,
          sessionExerciseCount: 0, // We'd need to fetch details for accurate count
          canAbandon: true,
          message: `You have an unfinished workout from ${new Date(activeSession.start_time).toLocaleString()}`
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for active session:', error);
      return null;
    }
  }, [user]);

  // Initialize session recovery on mount - check for active Supabase sessions
  React.useEffect(() => {
    if (user) {
      // Check for any active sessions and optionally resume
      checkForActiveSession().then(activeSession => {
        if (activeSession) {
          console.log('Found active Supabase session on mount:', activeSession.sessionId);
          // Could auto-resume here or let user decide
        }
      }).catch(error => {
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