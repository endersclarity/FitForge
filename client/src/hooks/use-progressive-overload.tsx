/**
 * Progressive Overload Hook
 * React integration for the progressive overload intelligence service
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { progressiveOverloadService } from '@/services/enhanced-progressive-overload-v2';
import { 
  ExerciseHistory, 
  ProgressionRecommendation, 
  ProgressionConfig 
} from '@/types/progression';

interface UseProgressiveOverloadOptions {
  exerciseId: number;
  config?: Partial<ProgressionConfig>;
  enabled?: boolean;
}

interface UseProgressiveOverloadReturn {
  recommendation: ProgressionRecommendation | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  
  // Convenience accessors
  suggestedWeight: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  reasoning: string;
  isReadyForProgression: boolean;
  
  // Actions
  acceptSuggestion: () => void;
  rejectSuggestion: () => void;
  customWeight: (weight: number) => void;
}

/**
 * Main hook for progressive overload recommendations
 */
export function useProgressiveOverload({
  exerciseId,
  config,
  enabled = true
}: UseProgressiveOverloadOptions): UseProgressiveOverloadReturn {
  const [userPreference, setUserPreference] = useState<'accept' | 'reject' | 'custom' | null>(null);
  const [customWeightValue, setCustomWeightValue] = useState<number | null>(null);

  // Create service instance with custom config if provided
  const service = useMemo(() => {
    return config ? progressiveOverloadService : progressiveOverloadService;
  }, [config]);

  // Fetch exercise history
  const { 
    data: exerciseHistory, 
    isLoading: historyLoading, 
    error: historyError,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['exerciseHistory', exerciseId],
    queryFn: () => fetchExerciseHistory(exerciseId),
    enabled: enabled && exerciseId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate recommendation
  const recommendation = useMemo(() => {
    if (!exerciseHistory) return null;
    
    try {
      return service.calculateProgression(exerciseHistory);
    } catch (error) {
      console.error('Progressive overload calculation failed:', error);
      return null;
    }
  }, [exerciseHistory, service]);

  // Track user interaction with suggestions
  useEffect(() => {
    if (recommendation && userPreference) {
      trackProgressionInteraction({
        exerciseId,
        suggestion: recommendation.suggestion,
        userAction: userPreference,
        customWeight: customWeightValue
      });
    }
  }, [exerciseId, recommendation, userPreference, customWeightValue]);

  const acceptSuggestion = () => {
    setUserPreference('accept');
    setCustomWeightValue(null);
  };

  const rejectSuggestion = () => {
    setUserPreference('reject');
    setCustomWeightValue(null);
  };

  const customWeight = (weight: number) => {
    setUserPreference('custom');
    setCustomWeightValue(weight);
  };

  return {
    recommendation,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
    
    // Convenience accessors
    suggestedWeight: recommendation?.suggestion.suggestedWeight || 0,
    confidenceLevel: recommendation?.suggestion.confidenceLevel || 'low',
    reasoning: recommendation?.suggestion.reasoning || '',
    isReadyForProgression: recommendation?.metrics.readyForProgression || false,
    
    // Actions
    acceptSuggestion,
    rejectSuggestion,
    customWeight
  };
}

/**
 * Hook for multiple exercises (workout planning)
 */
export function useMultipleProgressiveOverload(exerciseIds: number[]) {
  const recommendations = exerciseIds.map(id => 
    useProgressiveOverload({ exerciseId: id })
  );

  const allRecommendations = recommendations.map(r => r.recommendation).filter((rec): rec is NonNullable<typeof rec> => rec !== null);
  const isLoading = recommendations.some(r => r.isLoading);
  const hasErrors = recommendations.some(r => r.error);

  return {
    recommendations: allRecommendations,
    isLoading,
    hasErrors,
    totalVolumeIncrease: allRecommendations.reduce(
      (sum, rec) => sum + (rec.suggestion.increaseAmount * rec.nextSessionPlan.targetReps), 
      0
    ),
    readyExercisesCount: allRecommendations.filter(rec => rec.metrics.readyForProgression).length
  };
}

/**
 * Hook for progression analytics
 */
export function useProgressionAnalytics(userId: number) {
  return useQuery({
    queryKey: ['progressionAnalytics', userId],
    queryFn: () => fetchProgressionAnalytics(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * API functions (to be implemented with actual backend)
 */
async function fetchExerciseHistory(exerciseId: number): Promise<ExerciseHistory> {
  const response = await fetch(`/api/exercises/${exerciseId}/history`);
  if (!response.ok) {
    throw new Error('Failed to fetch exercise history');
  }
  return response.json();
}

async function fetchProgressionAnalytics(userId: number) {
  const response = await fetch(`/api/users/${userId}/progression-analytics`);
  if (!response.ok) {
    throw new Error('Failed to fetch progression analytics');
  }
  return response.json();
}

async function trackProgressionInteraction(data: {
  exerciseId: number;
  suggestion: any;
  userAction: 'accept' | 'reject' | 'custom';
  customWeight?: number | null;
}) {
  try {
    await fetch('/api/progression-interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('Failed to track progression interaction:', error);
  }
}

/**
 * Utility hook for quick weight suggestions (for immediate UI feedback)
 */
export function useQuickWeightSuggestion(lastWeight: number, exerciseType: 'compound' | 'isolation') {
  return useMemo(() => {
    const increment = exerciseType === 'compound' ? 2.5 : 1.25;
    return {
      conservative: lastWeight,
      recommended: lastWeight + increment,
      aggressive: lastWeight + (increment * 2),
      deload: lastWeight * 0.9
    };
  }, [lastWeight, exerciseType]);
}

/**
 * Feature flag hook for progressive overload
 */
export function useProgressiveOverloadEnabled() {
  const [enabled, setEnabled] = useState(() => {
    // Check feature flag from localStorage or environment
    const stored = localStorage.getItem('feature_progressive_overload');
    return stored !== null ? JSON.parse(stored) : true; // Default enabled
  });

  const toggleFeature = (newState: boolean) => {
    setEnabled(newState);
    localStorage.setItem('feature_progressive_overload', JSON.stringify(newState));
  };

  return { enabled, toggleFeature };
}