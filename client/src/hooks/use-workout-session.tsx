import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

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

interface WorkoutSessionContextType {
  session: WorkoutSessionState | null;
  startWorkout: (workoutType: string, exercises: WorkoutExercise[]) => void;
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

  const startWorkout = useCallback((workoutType: string, exercises: WorkoutExercise[]) => {
    console.log("💪💪💪 startWorkout CALLED!");
    console.log("💪 workoutType:", workoutType);
    console.log("💪 exercises:", exercises);
    console.log("💪 exercises length:", exercises.length);
    
    const newSession: WorkoutSessionState = {
      sessionId: `session_${Date.now()}`,
      startTime: new Date(),
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
    
    console.log("💪 NEW SESSION CREATED:", newSession);
    setSession(newSession);
    console.log("💪 SESSION STATE UPDATED");
    
    // Persist to localStorage for recovery
    localStorage.setItem('activeWorkoutSession', JSON.stringify(newSession));
    console.log("💪 SESSION SAVED TO LOCALSTORAGE");
    console.log("💪 startWorkout COMPLETED SUCCESSFULLY");
  }, []);

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

  const endWorkout = useCallback(() => {
    if (session) {
      const updatedSession = { 
        ...session, 
        status: "completed" as const,
        endTime: new Date()
      };
      setSession(updatedSession);
      
      // TODO: Save to database via API call
      console.log("Saving workout session:", updatedSession);
      
      // Clear localStorage
      localStorage.removeItem('activeWorkoutSession');
    }
  }, [session]);

  const logSet = useCallback((weight: number, reps: number, equipment: string) => {
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

    const updatedSession = { ...session };
    updatedSession.exercises[session.currentExerciseIndex].sets.push(newSet);
    updatedSession.totalVolume += volume;
    
    // Simple calorie calculation: approximately 0.1 calories per pound moved
    updatedSession.estimatedCalories += Math.round(volume * 0.1);

    setSession(updatedSession);
    localStorage.setItem('activeWorkoutSession', JSON.stringify(updatedSession));
  }, [session]);

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

  // Initialize session recovery on mount
  React.useEffect(() => {
    recoverSession();
  }, [recoverSession]);

  return (
    <WorkoutSessionContext.Provider
      value={{
        session,
        startWorkout,
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