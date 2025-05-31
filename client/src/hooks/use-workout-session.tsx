import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useOfflineWorkout } from "./use-offline-workout";

export interface WorkoutSet {
  weight: number;
  reps: number;
  equipment: string;
  timestamp: Date;
  setNumber: number;
  volume: number; // calculated: weight * reps
}

export interface ExerciseSession {
  exerciseId: number;
  exerciseName: string;
  sets: WorkoutSet[];
  completed: boolean;
  restTimeRemaining: number;
}

export interface WorkoutSessionState {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  currentExerciseIndex: number;
  exercises: ExerciseSession[];
  status: "in_progress" | "paused" | "completed";
  totalVolume: number;
  estimatedCalories: number;
  workoutType: string; // "Abs", "BackBiceps", "ChestTriceps", "Legs"
}

export interface WorkoutExercise {
  id: number;
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
  startWorkout: (workoutType: string, exercises: WorkoutExercise[]) => Promise<void>;
  abandonActiveSession: () => Promise<void>;
  resumeActiveSession: () => Promise<void>;
  checkForActiveSession: () => Promise<SessionConflictData | null>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  endWorkout: () => void;
  logSet: (weight: number, reps: number, equipment: string) => void;
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
  const offline = useOfflineWorkout();

  const startWorkout = useCallback(async (workoutType: string, exercises: WorkoutExercise[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log("💪💪💪 OFFLINE-FIRST startWorkout CALLED!");
      console.log("💪 workoutType:", workoutType);
      console.log("💪 exercises:", exercises);
      console.log("💪 exercises length:", exercises.length);
    }
    
    try {
      // Check for existing offline session first (offline-first approach)
      if (offline.activeSession && !offline.activeSession.isCompleted) {
        const conflictData: SessionConflictData = {
          sessionId: offline.activeSession.id,
          sessionStartTime: offline.activeSession.startTime,
          sessionExerciseCount: offline.activeSession.exercises.length,
          canAbandon: true,
          message: `You have an offline workout session in progress. Started: ${new Date(offline.activeSession.startTime).toLocaleString()}`
        };
        throw new SessionConflictError(conflictData);
      }

      // Start workout offline-first (immediate response)
      const offlineSession = await offline.startWorkout(workoutType, exercises.map(ex => ex.name));
      
      if (!offlineSession) {
        throw new Error('Failed to start offline workout session');
      }

      // Create frontend session state from offline session
      const newSession: WorkoutSessionState = {
        sessionId: offlineSession.id,
        startTime: new Date(offlineSession.startTime),
        currentExerciseIndex: 0,
        exercises: exercises.map(ex => ({
          exerciseId: ex.id,
          exerciseName: ex.name,
          sets: [],
          completed: false,
          restTimeRemaining: ex.restTime
        })),
        status: "in_progress",
        totalVolume: 0,
        estimatedCalories: 0,
        workoutType
      };
      
      if (process.env.NODE_ENV !== 'production') {
        console.log("💪 OFFLINE-FIRST SESSION CREATED:", newSession);
      }
      setSession(newSession);
      
      // Still persist to localStorage for compatibility
      localStorage.setItem('activeWorkoutSession', JSON.stringify(newSession));
      
      if (process.env.NODE_ENV !== 'production') {
        console.log("💪 OFFLINE-FIRST startWorkout COMPLETED SUCCESSFULLY");
        console.log("💪 Sync status:", offline.syncStatus);
      }
      
    } catch (error) {
      console.error("Error starting offline-first workout:", error);
      throw error; // Re-throw for UI to handle
    }
  }, [offline]);

  const pauseWorkout = useCallback(() => {
    if (session) {
      const updatedSession = { ...session, status: "paused" as const };
      setSession(updatedSession);
      localStorage.setItem('activeWorkoutSession', JSON.stringify(updatedSession));
    }
  }, [session]);

  const resumeWorkout = useCallback(() => {
    if (session) {
      const updatedSession = { ...session, status: "in_progress" as const };
      setSession(updatedSession);
      localStorage.setItem('activeWorkoutSession', JSON.stringify(updatedSession));
    }
  }, [session]);

  const endWorkout = useCallback(async () => {
    if (session) {
      const updatedSession = { 
        ...session, 
        status: "completed" as const,
        endTime: new Date()
      };
      setSession(updatedSession);
      
      try {
        // Complete workout offline-first (immediate local storage + background sync)
        const success = await offline.completeWorkout(
          5, // Default good rating
          `Workout completed via FitForge app. ${session.exercises.length} exercises, ${session.totalVolume} lbs total volume, ${session.estimatedCalories} calories burned.`
        );
        
        if (success) {
          console.log("✅ Workout completed offline-first");
        } else {
          console.error("❌ Failed to complete workout offline");
        }
      } catch (error) {
        console.error("Error completing workout offline:", error);
        // Continue anyway - we don't want to block the UI
      }
      
      // Clear localStorage
      localStorage.removeItem('activeWorkoutSession');
    }
  }, [session, offline]);

  const logSet = useCallback(async (weight: number, reps: number, equipment: string) => {
    if (!session) return;

    const currentExercise = session.exercises[session.currentExerciseIndex];
    const volume = weight * reps;
    
    const newSet: WorkoutSet = {
      weight,
      reps,
      equipment,
      timestamp: new Date(),
      setNumber: currentExercise.sets.length + 1,
      volume
    };

    // Update frontend session state immediately
    const updatedSession = { ...session };
    updatedSession.exercises[session.currentExerciseIndex].sets.push(newSet);
    updatedSession.totalVolume += volume;
    
    // Simple calorie calculation: approximately 0.1 calories per pound moved
    updatedSession.estimatedCalories += Math.round(volume * 0.1);

    setSession(updatedSession);
    localStorage.setItem('activeWorkoutSession', JSON.stringify(updatedSession));

    // Log set offline-first (immediate local storage + background sync)
    try {
      const success = await offline.logSet(
        currentExercise.exerciseId,
        currentExercise.exerciseName,
        {
          setNumber: newSet.setNumber,
          weight: weight,
          reps: reps,
          equipment: equipment,
          formScore: 8, // Default good form score
          notes: ""
        }
      );
      
      if (success) {
        console.log("✅ Set logged offline-first");
      } else {
        console.error("❌ Failed to log set offline");
      }
    } catch (error) {
      console.error("Error logging set offline:", error);
      // Continue anyway - we don't want to block the UI
    }
  }, [session, offline]);

  const completeExercise = useCallback(() => {
    if (!session) return;

    const updatedSession = { ...session };
    updatedSession.exercises[session.currentExerciseIndex].completed = true;

    setSession(updatedSession);
    localStorage.setItem('activeWorkoutSession', JSON.stringify(updatedSession));
  }, [session]);

  const nextExercise = useCallback(() => {
    if (!session || session.currentExerciseIndex >= session.exercises.length - 1) return;

    const updatedSession = { 
      ...session, 
      currentExerciseIndex: session.currentExerciseIndex + 1 
    };
    
    setSession(updatedSession);
    localStorage.setItem('activeWorkoutSession', JSON.stringify(updatedSession));
  }, [session]);

  const previousExercise = useCallback(() => {
    if (!session || session.currentExerciseIndex <= 0) return;

    const updatedSession = { 
      ...session, 
      currentExerciseIndex: session.currentExerciseIndex - 1 
    };
    
    setSession(updatedSession);
    localStorage.setItem('activeWorkoutSession', JSON.stringify(updatedSession));
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

  // Recovery function to restore session from localStorage
  const recoverSession = useCallback(() => {
    const savedSession = localStorage.getItem('activeWorkoutSession');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        // Convert date strings back to Date objects
        parsedSession.startTime = new Date(parsedSession.startTime);
        if (parsedSession.endTime) {
          parsedSession.endTime = new Date(parsedSession.endTime);
        }
        parsedSession.exercises.forEach((ex: ExerciseSession) => {
          ex.sets.forEach((set: WorkoutSet) => {
            set.timestamp = new Date(set.timestamp);
          });
        });
        
        setSession(parsedSession);
      } catch (error) {
        console.error("Failed to recover workout session:", error);
        localStorage.removeItem('activeWorkoutSession');
      }
    }
  }, []);

  const abandonActiveSession = useCallback(async () => {
    try {
      // Abandon session offline-first
      const success = await offline.abandonWorkout();
      
      if (success) {
        console.log('✅ Active session abandoned offline-first');
        // Clear any local session
        setSession(null);
        localStorage.removeItem('activeWorkoutSession');
      } else {
        throw new Error('Failed to abandon active session offline');
      }
    } catch (error) {
      console.error('Error abandoning active session offline:', error);
      throw error;
    }
  }, [offline]);

  const resumeActiveSession = useCallback(async () => {
    try {
      const response = await fetch('/api/workouts/active/details');
      if (response.ok) {
        const activeSession = await response.json();
        
        // Convert backend session to frontend session state
        const resumedSession: WorkoutSessionState = {
          sessionId: activeSession.id,
          startTime: new Date(activeSession.startTime),
          endTime: activeSession.endTime ? new Date(activeSession.endTime) : undefined,
          currentExerciseIndex: 0, // Start from beginning
          exercises: activeSession.exercises.map((ex: any) => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            sets: ex.sets.map((set: any) => ({
              weight: set.weight,
              reps: set.reps,
              equipment: set.equipment || '',
              timestamp: new Date(set.timestamp),
              setNumber: set.setNumber,
              volume: set.weight * set.reps
            })),
            completed: ex.sets.length > 0,
            restTimeRemaining: 60 // Default rest time
          })),
          status: "in_progress",
          totalVolume: activeSession.totalVolume,
          estimatedCalories: activeSession.caloriesBurned || 0,
          workoutType: activeSession.workoutType
        };
        
        setSession(resumedSession);
        localStorage.setItem('activeWorkoutSession', JSON.stringify(resumedSession));
        console.log('Active session resumed successfully');
      } else {
        throw new Error('No active session to resume');
      }
    } catch (error) {
      console.error('Error resuming active session:', error);
      throw error;
    }
  }, []);

  const checkForActiveSession = useCallback(async (): Promise<SessionConflictData | null> => {
    try {
      const response = await fetch('/api/workouts/active/details');
      if (response.ok) {
        const activeSession = await response.json();
        return {
          sessionId: activeSession.id,
          sessionStartTime: activeSession.startTime,
          sessionExerciseCount: activeSession.exercises.length,
          canAbandon: activeSession.canAbandon,
          message: `You have an unfinished workout from ${new Date(activeSession.startTime).toLocaleString()}`
        };
      }
      return null;
    } catch (error) {
      console.error('Error checking for active session:', error);
      return null;
    }
  }, []);

  // Initialize session recovery on mount
  React.useEffect(() => {
    recoverSession();
  }, [recoverSession]);

  return (
    <WorkoutSessionContext.Provider
      value={{
        session,
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