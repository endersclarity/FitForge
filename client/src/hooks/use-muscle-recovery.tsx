// FitForge Muscle Recovery Hook
// React hook for managing muscle recovery data and heat map state
// Created: June 3, 2025

import { useState, useEffect, useCallback } from 'react';
import { 
  MuscleRecoveryState, 
  HeatMapVisualizationData,
  MuscleGroupVisualization,
  HEAT_MAP_COLORS,
  RECOVERY_THRESHOLDS,
  MuscleGroupType,
  MUSCLE_GROUPS
} from '@/types/muscle-recovery';
import { 
  MuscleRecoveryCalculator, 
  createMuscleRecoveryCalculator 
} from '@/services/muscle-recovery';
import { useAuth } from '@/hooks/use-auth';

interface UseMuscleRecoveryReturn {
  // Data State
  recoveryStates: MuscleRecoveryState[];
  heatMapData: HeatMapVisualizationData | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshRecoveryData: () => Promise<void>;
  updateMuscleRecovery: (workoutData: any) => Promise<void>;
  getMuscleColor: (muscleGroup: MuscleGroupType) => string;
  getMuscleRecommendation: (muscleGroup: MuscleGroupType) => string;

  // Utilities
  getOverallFatigueLevel: () => number;
  getRecommendedWorkoutType: () => 'upper' | 'lower' | 'full' | 'recovery';
  getMostRecoveredMuscles: () => MuscleGroupType[];
  getMostFatiguedMuscles: () => MuscleGroupType[];
}

export function useMuscleRecovery(): UseMuscleRecoveryReturn {
  const { user } = useAuth();
  const [recoveryStates, setRecoveryStates] = useState<MuscleRecoveryState[]>([]);
  const [heatMapData, setHeatMapData] = useState<HeatMapVisualizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCalculator, setRecoveryCalculator] = useState<MuscleRecoveryCalculator | null>(null);

  // Initialize recovery calculator when user changes
  useEffect(() => {
    if (user) {
      const calculator = createMuscleRecoveryCalculator(user.id.toString());
      setRecoveryCalculator(calculator);
      refreshRecoveryData();
    } else {
      setRecoveryCalculator(null);
      // Provide default fresh muscle states for non-authenticated users
      const defaultStates = generateDefaultFreshMuscleStates();
      setRecoveryStates(defaultStates);
      setHeatMapData(generateHeatMapData(defaultStates));
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Refresh all muscle recovery data
   */
  const refreshRecoveryData = useCallback(async () => {
    if (!user || !recoveryCalculator) {
      // Provide default fresh states for non-authenticated users or no calculator
      const defaultStates = generateDefaultFreshMuscleStates();
      setRecoveryStates(defaultStates);
      setHeatMapData(generateHeatMapData(defaultStates));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get recovery states for all muscle groups
      const states = await recoveryCalculator.getMuscleRecoveryStates(user.id.toString());
      
      // If no workout data exists, provide fresh muscle states
      const finalStates = states.length > 0 ? states : generateDefaultFreshMuscleStates();
      setRecoveryStates(finalStates);

      // Generate heat map visualization data
      const heatMap = generateHeatMapData(finalStates);
      setHeatMapData(heatMap);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load muscle recovery data';
      setError(errorMessage);
      console.error('Error refreshing recovery data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, recoveryCalculator]);

  /**
   * Update muscle recovery after workout completion
   */
  const updateMuscleRecovery = useCallback(async (workoutData: any) => {
    if (!recoveryCalculator) return;

    try {
      await recoveryCalculator.updateMuscleRecovery(workoutData);
      await refreshRecoveryData(); // Refresh to get updated states
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update muscle recovery';
      setError(errorMessage);
      console.error('Error updating muscle recovery:', err);
    }
  }, [recoveryCalculator, refreshRecoveryData]);

  /**
   * Get color for a specific muscle group based on fatigue level
   */
  const getMuscleColor = useCallback((muscleGroup: MuscleGroupType): string => {
    const state = recoveryStates.find(s => s.muscleGroup === muscleGroup);
    if (!state) return HEAT_MAP_COLORS.UNDERTRAINED;

    const fatigue = state.currentFatiguePercentage;
    
    if (fatigue >= RECOVERY_THRESHOLDS.OVERWORKED) {
      return HEAT_MAP_COLORS.OVERWORKED;
    } else if (fatigue >= 60) {
      return HEAT_MAP_COLORS.HIGH_FATIGUE;
    } else if (fatigue >= RECOVERY_THRESHOLDS.OPTIMAL_LOW) {
      return HEAT_MAP_COLORS.MODERATE_FATIGUE;
    } else if (fatigue >= 15) {
      return HEAT_MAP_COLORS.LOW_FATIGUE;
    } else {
      return HEAT_MAP_COLORS.UNDERTRAINED;
    }
  }, [recoveryStates]);

  /**
   * Get recommendation for a specific muscle group
   */
  const getMuscleRecommendation = useCallback((muscleGroup: MuscleGroupType): string => {
    const state = recoveryStates.find(s => s.muscleGroup === muscleGroup);
    if (!state) return 'No data available';

    switch (state.recoveryStatus) {
      case 'overworked':
        return `Rest for ${state.daysUntilOptimal} more day${state.daysUntilOptimal !== 1 ? 's' : ''}`;
      case 'optimal':
        return 'Ready to train';
      case 'undertrained':
        return 'Good to train - needs attention';
      default:
        return 'Unknown status';
    }
  }, [recoveryStates]);

  /**
   * Calculate overall fatigue level across all muscle groups
   */
  const getOverallFatigueLevel = useCallback((): number => {
    if (recoveryStates.length === 0) return 0;

    const totalFatigue = recoveryStates.reduce(
      (sum, state) => sum + state.currentFatiguePercentage, 
      0
    );
    
    return Math.round(totalFatigue / recoveryStates.length);
  }, [recoveryStates]);

  /**
   * Get recommended workout type based on muscle recovery
   */
  const getRecommendedWorkoutType = useCallback((): 'upper' | 'lower' | 'full' | 'recovery' => {
    if (recoveryStates.length === 0) return 'recovery';

    const upperBodyMuscles = [
      MUSCLE_GROUPS.CHEST, 
      MUSCLE_GROUPS.BACK, 
      MUSCLE_GROUPS.SHOULDERS, 
      MUSCLE_GROUPS.BICEPS, 
      MUSCLE_GROUPS.TRICEPS
    ];
    
    const lowerBodyMuscles = [
      MUSCLE_GROUPS.QUADRICEPS, 
      MUSCLE_GROUPS.HAMSTRINGS, 
      MUSCLE_GROUPS.GLUTES, 
      MUSCLE_GROUPS.CALVES
    ];

    const upperFatigue = calculateAverageFatigue(upperBodyMuscles);
    const lowerFatigue = calculateAverageFatigue(lowerBodyMuscles);
    const overallFatigue = getOverallFatigueLevel();

    // If overall fatigue is very high, recommend recovery
    if (overallFatigue > 75) {
      return 'recovery';
    }

    // If upper body is significantly more fatigued, train lower
    if (upperFatigue > lowerFatigue + 20) {
      return 'lower';
    }

    // If lower body is significantly more fatigued, train upper
    if (lowerFatigue > upperFatigue + 20) {
      return 'upper';
    }

    // If both are relatively fresh, full body is okay
    if (overallFatigue < 40) {
      return 'full';
    }

    // Default to the less fatigued half
    return upperFatigue < lowerFatigue ? 'upper' : 'lower';
  }, [recoveryStates, getOverallFatigueLevel]);

  /**
   * Get the most recovered muscle groups (good for training)
   */
  const getMostRecoveredMuscles = useCallback((): MuscleGroupType[] => {
    return recoveryStates
      .filter(state => state.recoveryStatus === 'undertrained' || 
                      (state.recoveryStatus === 'optimal' && state.currentFatiguePercentage < 50))
      .sort((a, b) => a.currentFatiguePercentage - b.currentFatiguePercentage)
      .slice(0, 5)
      .map(state => state.muscleGroup as MuscleGroupType);
  }, [recoveryStates]);

  /**
   * Get the most fatigued muscle groups (need rest)
   */
  const getMostFatiguedMuscles = useCallback((): MuscleGroupType[] => {
    return recoveryStates
      .filter(state => state.recoveryStatus === 'overworked' || state.currentFatiguePercentage > 70)
      .sort((a, b) => b.currentFatiguePercentage - a.currentFatiguePercentage)
      .slice(0, 5)
      .map(state => state.muscleGroup as MuscleGroupType);
  }, [recoveryStates]);

  /**
   * Calculate average fatigue for a group of muscles
   */
  const calculateAverageFatigue = (muscleGroups: MuscleGroupType[]): number => {
    const relevantStates = recoveryStates.filter(
      state => muscleGroups.includes(state.muscleGroup as MuscleGroupType)
    );
    
    if (relevantStates.length === 0) return 0;
    
    const totalFatigue = relevantStates.reduce(
      (sum, state) => sum + state.currentFatiguePercentage, 
      0
    );
    
    return totalFatigue / relevantStates.length;
  };

  /**
   * Generate heat map visualization data from recovery states
   */
  const generateHeatMapData = (states: MuscleRecoveryState[]): HeatMapVisualizationData => {
    const muscleGroups: MuscleGroupVisualization[] = states.map(state => ({
      muscleGroup: state.muscleGroup,
      fatiguePercentage: state.currentFatiguePercentage,
      color: getMuscleColorFromState(state),
      status: state.recoveryStatus,
      daysUntilOptimal: state.daysUntilOptimal,
      lastWorked: state.lastWorkoutDate,
      recommendedAction: getRecommendationFromState(state)
    }));

    const overallFatigueLevel = states.length > 0 
      ? Math.round(states.reduce((sum, s) => sum + s.currentFatiguePercentage, 0) / states.length)
      : 0;

    const recommendedWorkoutType = determineWorkoutType(states);
    const nextOptimalWorkout = calculateNextOptimalWorkout(states);

    return {
      muscleGroups,
      overallFatigueLevel,
      recommendedWorkoutType,
      nextOptimalWorkout
    };
  };

  /**
   * Helper function to get color from state
   */
  const getMuscleColorFromState = (state: MuscleRecoveryState): string => {
    const fatigue = state.currentFatiguePercentage;
    
    if (fatigue >= RECOVERY_THRESHOLDS.OVERWORKED) {
      return HEAT_MAP_COLORS.OVERWORKED;
    } else if (fatigue >= 60) {
      return HEAT_MAP_COLORS.HIGH_FATIGUE;
    } else if (fatigue >= RECOVERY_THRESHOLDS.OPTIMAL_LOW) {
      return HEAT_MAP_COLORS.MODERATE_FATIGUE;
    } else if (fatigue >= 15) {
      return HEAT_MAP_COLORS.LOW_FATIGUE;
    } else {
      return HEAT_MAP_COLORS.UNDERTRAINED;
    }
  };

  /**
   * Helper function to get recommendation from state
   */
  const getRecommendationFromState = (state: MuscleRecoveryState): string => {
    switch (state.recoveryStatus) {
      case 'overworked':
        return `Rest for ${state.daysUntilOptimal} more day${state.daysUntilOptimal !== 1 ? 's' : ''}`;
      case 'optimal':
        return 'Ready to train';
      case 'undertrained':
        return 'Good to train - needs attention';
      default:
        return 'Unknown status';
    }
  };

  /**
   * Helper function to determine workout type
   */
  const determineWorkoutType = (states: MuscleRecoveryState[]): 'upper' | 'lower' | 'full' | 'recovery' => {
    if (states.length === 0) return 'recovery';

    const upperBodyMuscles = [
      MUSCLE_GROUPS.CHEST, 
      MUSCLE_GROUPS.BACK, 
      MUSCLE_GROUPS.SHOULDERS, 
      MUSCLE_GROUPS.BICEPS, 
      MUSCLE_GROUPS.TRICEPS
    ];
    
    const lowerBodyMuscles = [
      MUSCLE_GROUPS.QUADRICEPS, 
      MUSCLE_GROUPS.HAMSTRINGS, 
      MUSCLE_GROUPS.GLUTES, 
      MUSCLE_GROUPS.CALVES
    ];

    const upperFatigue = calculateAverageFatigueForMuscles(states, upperBodyMuscles);
    const lowerFatigue = calculateAverageFatigueForMuscles(states, lowerBodyMuscles);
    const overallFatigue = states.reduce((sum, s) => sum + s.currentFatiguePercentage, 0) / states.length;

    if (overallFatigue > 75) return 'recovery';
    if (upperFatigue > lowerFatigue + 20) return 'lower';
    if (lowerFatigue > upperFatigue + 20) return 'upper';
    if (overallFatigue < 40) return 'full';
    
    return upperFatigue < lowerFatigue ? 'upper' : 'lower';
  };

  /**
   * Helper function to calculate average fatigue for specific muscles
   */
  const calculateAverageFatigueForMuscles = (states: MuscleRecoveryState[], muscles: string[]): number => {
    const relevantStates = states.filter(state => muscles.includes(state.muscleGroup));
    if (relevantStates.length === 0) return 0;
    
    return relevantStates.reduce((sum, state) => sum + state.currentFatiguePercentage, 0) / relevantStates.length;
  };

  /**
   * Helper function to calculate next optimal workout date
   */
  const calculateNextOptimalWorkout = (states: MuscleRecoveryState[]): Date => {
    const now = new Date();
    
    // Find the muscle that will be optimal soonest
    const minDaysUntilOptimal = Math.min(
      ...states
        .filter(s => s.recoveryStatus === 'overworked')
        .map(s => s.daysUntilOptimal)
    );

    if (minDaysUntilOptimal === Infinity || minDaysUntilOptimal <= 0) {
      return now; // Some muscles are already ready
    }

    return new Date(now.getTime() + minDaysUntilOptimal * 24 * 60 * 60 * 1000);
  };

  /**
   * Generate default fresh muscle states for users with no workout data
   */
  const generateDefaultFreshMuscleStates = (): MuscleRecoveryState[] => {
    const allMuscleGroups = Object.values(MUSCLE_GROUPS);
    const defaultDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    return allMuscleGroups.map(muscleGroup => ({
      muscleGroup,
      lastWorkoutDate: defaultDate,
      workoutIntensity: 0, // No recent workouts
      currentFatiguePercentage: 5, // Very low baseline fatigue
      recoveryStatus: 'undertrained' as const,
      daysUntilOptimal: 0 // Ready to train immediately
    }));
  };

  return {
    // Data State
    recoveryStates,
    heatMapData,
    isLoading,
    error,

    // Actions
    refreshRecoveryData,
    updateMuscleRecovery,
    getMuscleColor,
    getMuscleRecommendation,

    // Utilities
    getOverallFatigueLevel,
    getRecommendedWorkoutType,
    getMostRecoveredMuscles,
    getMostFatiguedMuscles
  };
}