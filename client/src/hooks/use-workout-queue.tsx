import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Exercise {
  id: string;
  exerciseName: string;
  name?: string;
  category: string;
  workoutType: string;
  equipmentType: string[];
  primaryMuscles: Array<{ muscle: string; percentage: number }>;
  secondaryMuscles: Array<{ muscle: string; percentage: number }>;
  defaultSets?: number;
  defaultReps?: number;
}

interface WorkoutQueueContextType {
  queuedExercises: Exercise[];
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  clearQueue: () => void;
  isExerciseQueued: (exerciseId: string) => boolean;
}

const WorkoutQueueContext = createContext<WorkoutQueueContextType | undefined>(undefined);

export function WorkoutQueueProvider({ children }: { children: ReactNode }) {
  const [queuedExercises, setQueuedExercises] = useState<Exercise[]>([]);

  const addExercise = (exercise: Exercise) => {
    setQueuedExercises(prev => {
      // Don't add duplicates
      if (prev.some(ex => ex.id === exercise.id)) {
        return prev;
      }
      return [...prev, exercise];
    });
  };

  const removeExercise = (exerciseId: string) => {
    setQueuedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const clearQueue = () => {
    setQueuedExercises([]);
  };

  const isExerciseQueued = (exerciseId: string) => {
    return queuedExercises.some(ex => ex.id === exerciseId);
  };

  return (
    <WorkoutQueueContext.Provider value={{
      queuedExercises,
      addExercise,
      removeExercise,
      clearQueue,
      isExerciseQueued
    }}>
      {children}
    </WorkoutQueueContext.Provider>
  );
}

export function useWorkoutQueue() {
  const context = useContext(WorkoutQueueContext);
  if (context === undefined) {
    throw new Error('useWorkoutQueue must be used within a WorkoutQueueProvider');
  }
  return context;
}