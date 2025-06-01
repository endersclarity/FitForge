import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  restTimeSeconds?: number;
  rpe?: number;
  notes?: string;
  timestamp: Date;
}

interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  formScore?: number;
  notes?: string;
}

interface WorkoutSession {
  id: string | number;
  userId: number;
  workoutType: string;
  startTime: string;
  endTime?: string;
  status: 'in_progress' | 'completed' | 'paused';
  exercises: ExerciseLog[];
  totalVolume: number;
  totalDuration?: number;
  notes?: string;
}

interface SessionProgress {
  duration: number;
  completedSets: number;
  totalSets: number;
  progressPercentage: number;
}

export function useRealWorkoutSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sessionProgress, setSessionProgress] = useState<SessionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update session progress calculation
  useEffect(() => {
    if (session) {
      const totalSets = session.exercises.reduce((sum, ex) => sum + ex.targetSets, 0);
      const completedSets = session.exercises.reduce((sum, ex) => 
        sum + ex.sets.filter(set => set.completed).length, 0);
      
      const startTime = new Date(session.startTime);
      const now = new Date();
      const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60); // minutes
      
      setSessionProgress({
        duration,
        completedSets,
        totalSets,
        progressPercentage: totalSets > 0 ? (completedSets / totalSets) * 100 : 0
      });
    }
  }, [session]);

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async ({ workoutType, exerciseIds }: { workoutType: string; exerciseIds?: string[] }) => {
      const response = await fetch('/api/workout-sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutType, exerciseIds }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start workout session');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Workout Started! 💪",
        description: `Let's crush this ${variables.workoutType} session!`,
      });
    },
    onError: (error: Error) => {
      setError(error.message);
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
      setNumber,
      setData 
    }: { 
      sessionId: string | number; 
      exerciseId: string; 
      setNumber: number;
      setData: Partial<SetLog>;
    }) => {
      const response = await fetch(`/api/workout-sessions/${sessionId}/exercises/${exerciseId}/sets/${setNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to log set');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Set logged! 🎯",
        description: `Total volume: ${Math.round(data.progressUpdate?.totalVolume || 0)} lbs`,
      });
      
      // Refetch session data to get updated state
      if (session) {
        fetchSessionProgress(session.id);
      }
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: "Failed to log set",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async ({ 
      sessionId, 
      rating, 
      notes 
    }: { 
      sessionId: string | number; 
      rating?: number; 
      notes?: string;
    }) => {
      const response = await fetch(`/api/workout-sessions/${sessionId}/complete`, {
        method: 'POST',
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
        description: `${summary.duration}min • ${Math.round(summary.totalVolume)} lbs • ${summary.caloriesBurned}cal burned`,
      });
      
      // Reset session
      setSession(null);
      setSessionProgress(null);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['workoutHistory'] });
      queryClient.invalidateQueries({ queryKey: ['progressMetrics'] });
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: "Failed to complete workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch session progress
  const fetchSessionProgress = useCallback(async (sessionId: string | number) => {
    try {
      const response = await fetch(`/api/workout-sessions/${sessionId}/progress`);
      if (response.ok) {
        const progressData = await response.json();
        setSessionProgress({
          duration: progressData.duration,
          completedSets: progressData.completedSets,
          totalSets: progressData.totalSets,
          progressPercentage: progressData.totalSets > 0 ? 
            (progressData.completedSets / progressData.totalSets) * 100 : 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch session progress:', err);
    }
  }, []);

  // API functions
  const startSession = useCallback(async (workoutType: string, exerciseIds?: string[]) => {
    try {
      const result = await startSessionMutation.mutateAsync({ workoutType, exerciseIds });
      
      // Create session object with basic structure
      const newSession: WorkoutSession = {
        id: result.sessionId,
        userId: 1, // Auto-assigned for testing
        workoutType,
        startTime: result.startTime,
        status: 'in_progress',
        exercises: result.exercises || [],
        totalVolume: 0,
      };
      
      setSession(newSession);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [startSessionMutation]);

  const logSet = useCallback(async (exerciseId: string, setData: Partial<SetLog>) => {
    if (!session) {
      setError('No active session');
      return;
    }

    try {
      const exercise = session.exercises.find(ex => ex.exerciseId === exerciseId);
      const setNumber = (exercise?.sets.length || 0) + 1;
      
      await logSetMutation.mutateAsync({
        sessionId: session.id,
        exerciseId,
        setNumber,
        setData
      });

      // Update local session state
      setSession(prev => {
        if (!prev) return prev;
        
        const updatedExercises = prev.exercises.map(ex => {
          if (ex.exerciseId === exerciseId) {
            const newSet: SetLog = {
              setNumber,
              weight: setData.weight || 0,
              reps: setData.reps || 0,
              completed: setData.completed || true,
              timestamp: new Date(),
              ...setData
            };
            return {
              ...ex,
              sets: [...ex.sets, newSet]
            };
          }
          return ex;
        });

        return {
          ...prev,
          exercises: updatedExercises
        };
      });

      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [session, logSetMutation]);

  const completeSession = useCallback(async (rating?: number, notes?: string) => {
    if (!session) {
      setError('No active session');
      return;
    }

    try {
      await completeSessionMutation.mutateAsync({
        sessionId: session.id,
        rating,
        notes
      });
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [session, completeSessionMutation]);

  const isLoading = 
    startSessionMutation.isPending || 
    logSetMutation.isPending || 
    completeSessionMutation.isPending;

  return {
    session,
    sessionProgress,
    isLoading,
    error,
    startSession,
    logSet,
    completeSession,
  };
}