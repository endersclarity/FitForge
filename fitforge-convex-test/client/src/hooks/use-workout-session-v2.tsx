import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Types for the enhanced workout session
export interface Exercise {
  exerciseName: string;
  equipmentType: string;
  category: string;
  movementType: string;
  workoutType: string;
  primaryMuscles: Array<{ muscle: string; percentage: number }>;
  secondaryMuscles: Array<{ muscle: string; percentage: number }>;
  equipment: string[];
  difficulty: string;
}

export interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  restTime?: number;
  completed: boolean;
  timestamp: Date;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  exercise: Exercise;
  sets: SetLog[];
  restTime: number;
  personalRecord?: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

export interface WorkoutSession {
  id?: string;
  userId?: number;
  startedAt: Date;
  completedAt?: Date;
  exercises: ExerciseLog[];
  totalDuration?: number;
  notes?: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed';
  currentExerciseIndex: number;
  currentSetIndex: number;
}

// Action types for the reducer
type WorkoutAction =
  | { type: 'START_WORKOUT' }
  | { type: 'ADD_EXERCISE'; exercise: Exercise }
  | { type: 'REMOVE_EXERCISE'; exerciseId: string }
  | { type: 'START_EXERCISE'; exerciseIndex: number }
  | { type: 'COMPLETE_SET'; exerciseIndex: number; setData: Omit<SetLog, 'setNumber' | 'timestamp'> }
  | { type: 'UPDATE_SET'; exerciseIndex: number; setIndex: number; setData: Partial<SetLog> }
  | { type: 'PAUSE_WORKOUT' }
  | { type: 'RESUME_WORKOUT' }
  | { type: 'COMPLETE_WORKOUT' }
  | { type: 'RESET_WORKOUT' }
  | { type: 'LOAD_SESSION'; session: WorkoutSession }
  | { type: 'SET_NOTES'; notes: string };

// Initial state
const initialState: WorkoutSession = {
  startedAt: new Date(),
  exercises: [],
  status: 'not_started',
  currentExerciseIndex: -1,
  currentSetIndex: 0,
  notes: '',
};

// Workout session reducer
function workoutSessionReducer(state: WorkoutSession, action: WorkoutAction): WorkoutSession {
  switch (action.type) {
    case 'START_WORKOUT':
      return {
        ...state,
        status: 'in_progress',
        startedAt: new Date(),
        currentExerciseIndex: state.exercises.length > 0 ? 0 : -1,
        currentSetIndex: 0,
      };

    case 'ADD_EXERCISE':
      const newExerciseLog: ExerciseLog = {
        exerciseId: action.exercise.exerciseName, // Using name as ID for now
        exerciseName: action.exercise.exerciseName,
        exercise: action.exercise,
        sets: [],
        restTime: 60, // Default 60 seconds rest
      };
      return {
        ...state,
        exercises: [...state.exercises, newExerciseLog],
        currentExerciseIndex: state.currentExerciseIndex === -1 ? 0 : state.currentExerciseIndex,
      };

    case 'REMOVE_EXERCISE':
      const filteredExercises = state.exercises.filter(ex => ex.exerciseId !== action.exerciseId);
      return {
        ...state,
        exercises: filteredExercises,
        currentExerciseIndex: filteredExercises.length > 0 ? Math.min(state.currentExerciseIndex, filteredExercises.length - 1) : -1,
      };

    case 'START_EXERCISE':
      return {
        ...state,
        currentExerciseIndex: action.exerciseIndex,
        currentSetIndex: 0,
        exercises: state.exercises.map((ex, index) => 
          index === action.exerciseIndex 
            ? { ...ex, startedAt: new Date() }
            : ex
        ),
      };

    case 'COMPLETE_SET':
      const currentExercise = state.exercises[action.exerciseIndex];
      if (!currentExercise) return state;

      const newSet: SetLog = {
        setNumber: currentExercise.sets.length + 1,
        weight: action.setData.weight,
        reps: action.setData.reps,
        restTime: action.setData.restTime,
        completed: true,
        timestamp: new Date(),
      };

      return {
        ...state,
        exercises: state.exercises.map((ex, index) =>
          index === action.exerciseIndex
            ? { ...ex, sets: [...ex.sets, newSet] }
            : ex
        ),
        currentSetIndex: state.currentSetIndex + 1,
      };

    case 'UPDATE_SET':
      return {
        ...state,
        exercises: state.exercises.map((ex, index) =>
          index === action.exerciseIndex
            ? {
                ...ex,
                sets: ex.sets.map((set, setIndex) =>
                  setIndex === action.setIndex
                    ? { ...set, ...action.setData }
                    : set
                ),
              }
            : ex
        ),
      };

    case 'PAUSE_WORKOUT':
      return {
        ...state,
        status: 'paused',
      };

    case 'RESUME_WORKOUT':
      return {
        ...state,
        status: 'in_progress',
      };

    case 'COMPLETE_WORKOUT':
      return {
        ...state,
        status: 'completed',
        completedAt: new Date(),
        totalDuration: state.startedAt ? Date.now() - state.startedAt.getTime() : 0,
      };

    case 'RESET_WORKOUT':
      return {
        ...initialState,
        startedAt: new Date(),
      };

    case 'LOAD_SESSION':
      return action.session;

    case 'SET_NOTES':
      return {
        ...state,
        notes: action.notes,
      };

    default:
      return state;
  }
}

// Context definition
interface WorkoutSessionContextType {
  session: WorkoutSession;
  dispatch: React.Dispatch<WorkoutAction>;
  startWorkout: () => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  startExercise: (exerciseIndex: number) => void;
  completeSet: (exerciseIndex: number, setData: Omit<SetLog, 'setNumber' | 'timestamp'>) => void;
  updateSet: (exerciseIndex: number, setIndex: number, setData: Partial<SetLog>) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  completeWorkout: () => void;
  resetWorkout: () => void;
  setNotes: (notes: string) => void;
  isWorkoutActive: boolean;
  currentExercise?: ExerciseLog;
  saveSession: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
}

const WorkoutSessionContext = createContext<WorkoutSessionContextType | undefined>(undefined);

// Provider component
export function WorkoutSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, dispatch] = useReducer(workoutSessionReducer, initialState);
  const queryClient = useQueryClient();

  // Auto-save to localStorage
  useEffect(() => {
    if (session.status !== 'not_started') {
      localStorage.setItem('fitforge-active-workout', JSON.stringify(session));
    }
  }, [session]);

  // Load saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem('fitforge-active-workout');
    if (saved) {
      try {
        const savedSession = JSON.parse(saved);
        if (savedSession.status === 'in_progress') {
          dispatch({ type: 'LOAD_SESSION', session: savedSession });
        }
      } catch (error) {
        console.error('Failed to load saved workout session:', error);
      }
    }
  }, []);

  // Mutation to save workout session to backend
  const saveSessionMutation = useMutation({
    mutationFn: async (sessionData: WorkoutSession) => {
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      if (!response.ok) {
        throw new Error('Failed to save workout session');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-sessions'] });
      localStorage.removeItem('fitforge-active-workout');
    },
  });

  // Action helpers
  const startWorkout = () => dispatch({ type: 'START_WORKOUT' });
  const addExercise = (exercise: Exercise) => dispatch({ type: 'ADD_EXERCISE', exercise });
  const removeExercise = (exerciseId: string) => dispatch({ type: 'REMOVE_EXERCISE', exerciseId });
  const startExercise = (exerciseIndex: number) => dispatch({ type: 'START_EXERCISE', exerciseIndex });
  const completeSet = (exerciseIndex: number, setData: Omit<SetLog, 'setNumber' | 'timestamp'>) => 
    dispatch({ type: 'COMPLETE_SET', exerciseIndex, setData });
  const updateSet = (exerciseIndex: number, setIndex: number, setData: Partial<SetLog>) =>
    dispatch({ type: 'UPDATE_SET', exerciseIndex, setIndex, setData });
  const pauseWorkout = () => dispatch({ type: 'PAUSE_WORKOUT' });
  const resumeWorkout = () => dispatch({ type: 'RESUME_WORKOUT' });
  const completeWorkout = () => dispatch({ type: 'COMPLETE_WORKOUT' });
  const resetWorkout = () => {
    dispatch({ type: 'RESET_WORKOUT' });
    localStorage.removeItem('fitforge-active-workout');
  };
  const setNotes = (notes: string) => dispatch({ type: 'SET_NOTES', notes });

  // Save session to backend
  const saveSession = async () => {
    if (session.status === 'completed') {
      await saveSessionMutation.mutateAsync(session);
    }
  };

  // Load session from backend (for resuming)
  const loadSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/workout-sessions/${sessionId}`);
      if (response.ok) {
        const sessionData = await response.json();
        dispatch({ type: 'LOAD_SESSION', session: sessionData });
      }
    } catch (error) {
      console.error('Failed to load workout session:', error);
    }
  };

  const isWorkoutActive = session.status === 'in_progress' || session.status === 'paused';
  const currentExercise = session.currentExerciseIndex >= 0 ? session.exercises[session.currentExerciseIndex] : undefined;

  const value: WorkoutSessionContextType = {
    session,
    dispatch,
    startWorkout,
    addExercise,
    removeExercise,
    startExercise,
    completeSet,
    updateSet,
    pauseWorkout,
    resumeWorkout,
    completeWorkout,
    resetWorkout,
    setNotes,
    isWorkoutActive,
    currentExercise,
    saveSession,
    loadSession,
  };

  return (
    <WorkoutSessionContext.Provider value={value}>
      {children}
    </WorkoutSessionContext.Provider>
  );
}

// Hook to use the workout session context
export function useWorkoutSessionV2() {
  const context = useContext(WorkoutSessionContext);
  if (context === undefined) {
    throw new Error('useWorkoutSessionV2 must be used within a WorkoutSessionProvider');
  }
  return context;
}

// Helper hooks for common patterns
export function useCurrentExercise() {
  const { currentExercise } = useWorkoutSessionV2();
  return currentExercise;
}

export function useWorkoutProgress() {
  const { session } = useWorkoutSessionV2();
  
  const totalExercises = session.exercises.length;
  const completedExercises = session.exercises.filter(ex => ex.completedAt).length;
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = session.exercises.reduce((sum, ex) => sum + ex.sets.filter(set => set.completed).length, 0);
  
  const duration = session.startedAt ? Date.now() - session.startedAt.getTime() : 0;
  
  return {
    totalExercises,
    completedExercises,
    totalSets,
    completedSets,
    duration,
    progressPercentage: totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0,
  };
}