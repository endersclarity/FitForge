import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  equipment?: string;
  formScore?: number;
  notes?: string;
}

interface ExerciseSession {
  exerciseId: number;
  exerciseName: string;
  sets: WorkoutSet[];
  currentSet: number;
  targetSets: number;
  restTimeRemaining: number;
}

interface WorkoutSessionState {
  sessionId: string | null;
  startTime: Date | null;
  workoutType: string;
  exercises: ExerciseSession[];
  currentExerciseIndex: number;
  status: 'idle' | 'in_progress' | 'completed';
  totalVolume: number;
}

interface WorkoutSessionContextType {
  session: WorkoutSessionState;
  startWorkout: (workoutType: string, exercises: any[]) => Promise<void>;
  logSet: (weight: number, reps: number, equipment?: string, formScore?: number, notes?: string) => Promise<void>;
  completeExercise: () => void;
  completeWorkout: (rating?: number, notes?: string) => Promise<void>;
  abandonWorkout: () => Promise<void>;
  goToNextExercise: () => void;
  goToPreviousExercise: () => void;
  updateRestTime: (seconds: number) => void;
  isLoading: boolean;
}

const WorkoutSessionContext = createContext<WorkoutSessionContextType | null>(null);

export function WorkoutSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [session, setSession] = useState<WorkoutSessionState>({
    sessionId: null,
    startTime: null,
    workoutType: '',
    exercises: [],
    currentExerciseIndex: 0,
    status: 'idle',
    totalVolume: 0,
  });

  // Check for active workout on mount
  const { data: activeWorkout } = useQuery({
    queryKey: ['activeWorkout'],
    queryFn: async () => {
      const response = await fetch('/api/workouts/active');
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch active workout');
      return response.json();
    },
  });

  // Handle active workout restoration
  useEffect(() => {
    if (activeWorkout) {
      // Restore active workout session
      setSession({
        sessionId: activeWorkout.id,
        startTime: new Date(activeWorkout.startTime),
        workoutType: activeWorkout.workoutType,
        exercises: activeWorkout.exercises.map((ex: any) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          sets: ex.sets,
          currentSet: ex.sets.length + 1,
          targetSets: 3, // Default
          restTimeRemaining: 0,
        })),
        currentExerciseIndex: 0,
        status: 'in_progress',
        totalVolume: activeWorkout.totalVolume,
      });
    }
  }, [activeWorkout]);

  // Start workout mutation
  const startWorkoutMutation = useMutation({
    mutationFn: async ({ workoutType, plannedExercises }: { workoutType: string; plannedExercises?: string[] }) => {
      const response = await fetch('/api/workouts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutType, plannedExercises }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start workout');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Workout Started! 💪",
        description: `Let's crush this ${variables.workoutType} workout!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Log set mutation
  const logSetMutation = useMutation({
    mutationFn: async ({ 
      sessionId, 
      exerciseId, 
      exerciseName, 
      setData 
    }: { 
      sessionId: string; 
      exerciseId: number; 
      exerciseName: string; 
      setData: WorkoutSet;
    }) => {
      const response = await fetch(`/api/workouts/${sessionId}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          exerciseName,
          ...setData,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to log set');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSession(prev => ({
        ...prev,
        totalVolume: data.totalVolume,
      }));
      toast({
        title: "Set logged! 🎯",
        description: `Total volume: ${data.totalVolume.toFixed(0)}kg`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to log set",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete workout mutation
  const completeWorkoutMutation = useMutation({
    mutationFn: async ({ 
      sessionId, 
      rating, 
      notes 
    }: { 
      sessionId: string; 
      rating?: number; 
      notes?: string;
    }) => {
      const response = await fetch(`/api/workouts/${sessionId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, notes }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete workout');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const { summary } = data;
      toast({
        title: "Workout Complete! 🏆",
        description: `${summary.duration}min • ${summary.totalVolume}kg • ${summary.caloriesBurned}cal burned`,
      });
      
      if (summary.personalRecords.length > 0) {
        setTimeout(() => {
          toast({
            title: "New Personal Records! 🎊",
            description: summary.personalRecords.join(', '),
          });
        }, 1000);
      }
      
      // Reset session
      setSession({
        sessionId: null,
        startTime: null,
        workoutType: '',
        exercises: [],
        currentExerciseIndex: 0,
        status: 'idle',
        totalVolume: 0,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['workoutHistory'] });
      queryClient.invalidateQueries({ queryKey: ['progressMetrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Abandon workout mutation
  const abandonWorkoutMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/workouts/${sessionId}/abandon`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to abandon workout');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Workout abandoned",
        description: "Better luck next time! 💪",
      });
      
      // Reset session
      setSession({
        sessionId: null,
        startTime: null,
        workoutType: '',
        exercises: [],
        currentExerciseIndex: 0,
        status: 'idle',
        totalVolume: 0,
      });
    },
  });

  const startWorkout = useCallback(async (workoutType: string, exercises: any[]) => {
    const result = await startWorkoutMutation.mutateAsync({ workoutType });
    
    setSession({
      sessionId: result.sessionId,
      startTime: new Date(result.startTime),
      workoutType,
      exercises: exercises.map((ex, index) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: [],
        currentSet: 1,
        targetSets: 3,
        restTimeRemaining: 0,
      })),
      currentExerciseIndex: 0,
      status: 'in_progress',
      totalVolume: 0,
    });
  }, [startWorkoutMutation]);

  const logSet = useCallback(async (
    weight: number, 
    reps: number, 
    equipment?: string, 
    formScore?: number, 
    notes?: string
  ) => {
    if (!session.sessionId || session.currentExerciseIndex < 0) return;
    
    const currentExercise = session.exercises[session.currentExerciseIndex];
    const setData: WorkoutSet = {
      setNumber: currentExercise.currentSet,
      weight,
      reps,
      equipment,
      formScore,
      notes,
    };
    
    await logSetMutation.mutateAsync({
      sessionId: session.sessionId,
      exerciseId: currentExercise.exerciseId,
      exerciseName: currentExercise.exerciseName,
      setData,
    });
    
    // Update local state
    setSession(prev => {
      const newExercises = [...prev.exercises];
      newExercises[prev.currentExerciseIndex].sets.push(setData);
      newExercises[prev.currentExerciseIndex].currentSet++;
      return {
        ...prev,
        exercises: newExercises,
      };
    });
  }, [session, logSetMutation]);

  const completeExercise = useCallback(() => {
    if (session.currentExerciseIndex < session.exercises.length - 1) {
      goToNextExercise();
    }
  }, [session]);

  const completeWorkout = useCallback(async (rating?: number, notes?: string) => {
    if (!session.sessionId) return;
    
    await completeWorkoutMutation.mutateAsync({
      sessionId: session.sessionId,
      rating,
      notes,
    });
  }, [session.sessionId, completeWorkoutMutation]);

  const abandonWorkout = useCallback(async () => {
    if (!session.sessionId) return;
    
    await abandonWorkoutMutation.mutateAsync(session.sessionId);
  }, [session.sessionId, abandonWorkoutMutation]);

  const goToNextExercise = useCallback(() => {
    setSession(prev => ({
      ...prev,
      currentExerciseIndex: Math.min(prev.currentExerciseIndex + 1, prev.exercises.length - 1),
    }));
  }, []);

  const goToPreviousExercise = useCallback(() => {
    setSession(prev => ({
      ...prev,
      currentExerciseIndex: Math.max(prev.currentExerciseIndex - 1, 0),
    }));
  }, []);

  const updateRestTime = useCallback((seconds: number) => {
    setSession(prev => {
      const newExercises = [...prev.exercises];
      if (prev.currentExerciseIndex >= 0 && prev.currentExerciseIndex < newExercises.length) {
        newExercises[prev.currentExerciseIndex].restTimeRemaining = seconds;
      }
      return {
        ...prev,
        exercises: newExercises,
      };
    });
  }, []);

  const isLoading = 
    startWorkoutMutation.isPending || 
    logSetMutation.isPending || 
    completeWorkoutMutation.isPending ||
    abandonWorkoutMutation.isPending;

  return (
    <WorkoutSessionContext.Provider
      value={{
        session,
        startWorkout,
        logSet,
        completeExercise,
        completeWorkout,
        abandonWorkout,
        goToNextExercise,
        goToPreviousExercise,
        updateRestTime,
        isLoading,
      }}
    >
      {children}
    </WorkoutSessionContext.Provider>
  );
}

export function useRealWorkoutSession() {
  const context = useContext(WorkoutSessionContext);
  if (!context) {
    throw new Error('useRealWorkoutSession must be used within WorkoutSessionProvider');
  }
  return context;
}