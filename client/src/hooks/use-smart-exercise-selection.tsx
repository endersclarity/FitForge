/**
 * Smart Exercise Selection Hook
 * React hook for intelligent exercise recommendations and workout planning
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  smartExerciseSelection, 
  type ExerciseRecommendation, 
  type WorkoutPlan, 
  type SmartSelectionOptions 
} from '../services/smart-exercise-selection';

interface UseSmartSelectionState {
  isInitialized: boolean;
  isLoading: boolean;
  currentPlan: WorkoutPlan | null;
  recommendations: ExerciseRecommendation[];
  error: string | null;
}

interface UseSmartSelectionOptions {
  autoInitialize?: boolean;
  cacheTime?: number;
}

export function useSmartExerciseSelection(options: UseSmartSelectionOptions = {}) {
  const { autoInitialize = true, cacheTime = 10 * 60 * 1000 } = options; // 10 minutes cache
  
  const [selectionState, setSelectionState] = useState<UseSmartSelectionState>({
    isInitialized: false,
    isLoading: false,
    currentPlan: null,
    recommendations: [],
    error: null
  });

  // Initialize the smart selection service
  const initializeService = useCallback(async () => {
    try {
      setSelectionState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await smartExerciseSelection.initialize();
      
      setSelectionState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false
      }));
      
      console.log('🧠 Smart exercise selection service initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize service';
      setSelectionState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      console.error('Error initializing smart exercise selection:', error);
    }
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize && !selectionState.isInitialized && !selectionState.isLoading) {
      initializeService();
    }
  }, [autoInitialize, selectionState.isInitialized, selectionState.isLoading, initializeService]);

  // Generate workout plan
  const generateWorkoutPlan = useCallback(async (planOptions: SmartSelectionOptions): Promise<WorkoutPlan | null> => {
    if (!selectionState.isInitialized) {
      console.warn('Smart selection service not initialized');
      return null;
    }

    try {
      setSelectionState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const plan = smartExerciseSelection.generateWorkoutPlan(planOptions);
      
      setSelectionState(prev => ({
        ...prev,
        currentPlan: plan,
        isLoading: false
      }));
      
      console.log(`✅ Generated workout plan: ${plan.primaryExercises.length} primary + ${plan.accessoryExercises.length} accessory exercises`);
      return plan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate workout plan';
      setSelectionState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      console.error('Error generating workout plan:', error);
      return null;
    }
  }, [selectionState.isInitialized]);

  // Get exercise recommendations for current session
  const getSessionRecommendations = useCallback((
    currentExercises: string[], 
    workoutType: string, 
    remainingTime: number
  ): ExerciseRecommendation[] => {
    if (!selectionState.isInitialized) {
      console.warn('Smart selection service not initialized');
      return [];
    }

    try {
      const recommendations = smartExerciseSelection.getExerciseRecommendations(
        currentExercises, 
        workoutType, 
        remainingTime
      );
      
      setSelectionState(prev => ({
        ...prev,
        recommendations
      }));
      
      return recommendations;
    } catch (error) {
      console.error('Error getting session recommendations:', error);
      return [];
    }
  }, [selectionState.isInitialized]);

  // Detect supersets in exercise list
  const detectSupersets = useCallback((exercises: any[]) => {
    if (!selectionState.isInitialized) {
      console.warn('Smart selection service not initialized');
      return [];
    }

    try {
      return smartExerciseSelection.detectSupersets(exercises);
    } catch (error) {
      console.error('Error detecting supersets:', error);
      return [];
    }
  }, [selectionState.isInitialized]);

  // Get muscle group balance analysis
  const analyzeMuscleGroupBalance = useCallback((workoutHistory: any[], days: number = 7) => {
    if (!selectionState.isInitialized) {
      console.warn('Smart selection service not initialized');
      return {};
    }

    try {
      return smartExerciseSelection.getMuscleGroupBalance(workoutHistory, days);
    } catch (error) {
      console.error('Error analyzing muscle group balance:', error);
      return {};
    }
  }, [selectionState.isInitialized]);

  return {
    // State
    isInitialized: selectionState.isInitialized,
    isLoading: selectionState.isLoading,
    currentPlan: selectionState.currentPlan,
    recommendations: selectionState.recommendations,
    error: selectionState.error,
    
    // Actions
    initializeService,
    generateWorkoutPlan,
    getSessionRecommendations,
    detectSupersets,
    analyzeMuscleGroupBalance,
    
    // Helper methods
    isReady: selectionState.isInitialized && !selectionState.isLoading,
    hasError: !!selectionState.error,
    hasCurrentPlan: !!selectionState.currentPlan,
    recommendationCount: selectionState.recommendations.length
  };
}

// Workout plan generator hook with caching
export function useWorkoutPlanGenerator(planOptions: SmartSelectionOptions | null) {
  const { isInitialized } = useSmartExerciseSelection();
  
  return useQuery({
    queryKey: ['workout-plan', planOptions],
    queryFn: async () => {
      if (!planOptions) return null;
      return smartExerciseSelection.generateWorkoutPlan(planOptions);
    },
    enabled: isInitialized && !!planOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime)
  });
}

// Exercise recommendations hook for current session
export function useSessionRecommendations(
  currentExercises: string[], 
  workoutType: string, 
  remainingTime: number
) {
  const { isInitialized } = useSmartExerciseSelection();
  
  return useQuery({
    queryKey: ['session-recommendations', currentExercises, workoutType, remainingTime],
    queryFn: () => {
      return smartExerciseSelection.getExerciseRecommendations(
        currentExercises, 
        workoutType, 
        remainingTime
      );
    },
    enabled: isInitialized && currentExercises.length >= 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });
}

// Muscle group balance analysis hook
export function useMuscleGroupBalance(workoutHistory: any[], days: number = 7) {
  const { isInitialized } = useSmartExerciseSelection();
  
  return useQuery({
    queryKey: ['muscle-group-balance', workoutHistory.length, days],
    queryFn: () => {
      return smartExerciseSelection.getMuscleGroupBalance(workoutHistory, days);
    },
    enabled: isInitialized && workoutHistory.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (renamed from cacheTime)
  });
}

// Smart workout planner component
export function SmartWorkoutPlanner({ 
  onPlanGenerated, 
  defaultOptions 
}: { 
  onPlanGenerated?: (plan: WorkoutPlan) => void;
  defaultOptions?: Partial<SmartSelectionOptions>;
}) {
  const { generateWorkoutPlan, isLoading, error, currentPlan } = useSmartExerciseSelection();
  const [planOptions, setPlanOptions] = useState<SmartSelectionOptions>({
    workoutType: 'ChestTriceps',
    targetDuration: 60,
    experienceLevel: 'Intermediate',
    availableEquipment: ['Barbell', 'Dumbbell', 'Cable'],
    preferCompoundMovements: true,
    maxExercises: 6,
    ...defaultOptions
  });

  const handleGeneratePlan = async () => {
    const plan = await generateWorkoutPlan(planOptions);
    if (plan) {
      onPlanGenerated?.(plan);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">🧠 Smart Workout Planner</h3>
      
      {/* Plan Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Workout Type</label>
          <select 
            value={planOptions.workoutType}
            onChange={(e) => setPlanOptions(prev => ({ ...prev, workoutType: e.target.value }))}
            className="w-full p-2 border rounded"
          >
            <option value="ChestTriceps">Chest & Triceps</option>
            <option value="BackBiceps">Back & Biceps</option>
            <option value="Legs">Legs</option>
            <option value="Abs">Abs</option>
            <option value="Mixed">Mixed</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Target Duration (minutes)</label>
          <input 
            type="number"
            value={planOptions.targetDuration}
            onChange={(e) => setPlanOptions(prev => ({ ...prev, targetDuration: parseInt(e.target.value) }))}
            className="w-full p-2 border rounded"
            min="30"
            max="120"
            step="15"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Experience Level</label>
          <select 
            value={planOptions.experienceLevel}
            onChange={(e) => setPlanOptions(prev => ({ ...prev, experienceLevel: e.target.value as any }))}
            className="w-full p-2 border rounded"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Max Exercises</label>
          <input 
            type="number"
            value={planOptions.maxExercises}
            onChange={(e) => setPlanOptions(prev => ({ ...prev, maxExercises: parseInt(e.target.value) }))}
            className="w-full p-2 border rounded"
            min="3"
            max="12"
          />
        </div>
      </div>
      
      {/* Generate Button */}
      <button
        onClick={handleGeneratePlan}
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground py-2 px-4 rounded disabled:opacity-50"
      >
        {isLoading ? 'Generating...' : 'Generate Smart Workout Plan'}
      </button>
      
      {/* Error Display */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      {/* Plan Preview */}
      {currentPlan && (
        <div className="bg-muted/50 p-4 rounded">
          <h4 className="font-medium mb-2">Generated Plan</h4>
          <div className="text-sm space-y-1">
            <p>Primary Exercises: {currentPlan.primaryExercises.length}</p>
            <p>Accessory Exercises: {currentPlan.accessoryExercises.length}</p>
            <p>Estimated Time: {currentPlan.totalEstimatedTime} minutes</p>
            <p>Intensity: {currentPlan.workoutIntensity}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Types for external use
export type { UseSmartSelectionState, UseSmartSelectionOptions };