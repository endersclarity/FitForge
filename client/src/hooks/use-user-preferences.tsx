import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPreferences, WorkoutRecommendation, Achievement, DEFAULT_USER_PREFERENCES } from '../../../shared/user-profile';

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  achievements: Achievement[];
  recommendations: WorkoutRecommendation[];
  isLoading: boolean;
  error: string | null;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
  completeOnboarding: (preferences: UserPreferences) => Promise<void>;
  trackRecommendationUsage: (recommendationId: string, used: boolean) => Promise<void>;
}

export function useUserPreferences(userId: string = "1"): UseUserPreferencesReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch user preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['userPreferences', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/preferences/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user preferences');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ['userAchievements', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/achievements/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch workout recommendations (only if onboarding is complete)
  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery({
    queryKey: ['workoutRecommendations', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/recommendations/${userId}`);
      if (!response.ok) {
        if (response.status === 400) {
          // User hasn't completed onboarding yet
          return [];
        }
        throw new Error('Failed to fetch workout recommendations');
      }
      return response.json();
    },
    enabled: preferences?.onboardingCompleted === true,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: UserPreferences) => {
      const response = await fetch(`/api/users/preferences/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update preferences');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', userId] });
      queryClient.invalidateQueries({ queryKey: ['workoutRecommendations', userId] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async (onboardingData: UserPreferences) => {
      const response = await fetch(`/api/users/onboarding/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete onboarding');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', userId] });
      queryClient.invalidateQueries({ queryKey: ['userAchievements', userId] });
      queryClient.invalidateQueries({ queryKey: ['workoutRecommendations', userId] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Track recommendation usage mutation
  const trackRecommendationMutation = useMutation({
    mutationFn: async ({ recommendationId, used }: { recommendationId: string; used: boolean }) => {
      const response = await fetch(`/api/users/recommendations/${userId}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recommendationId, used }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to track recommendation usage');
      }
      
      return response.json();
    },
  });

  const isLoading = preferencesLoading || achievementsLoading || recommendationsLoading;

  return {
    preferences: preferences || null,
    achievements,
    recommendations,
    isLoading,
    error,
    updatePreferences: async (newPreferences: UserPreferences) => {
      return updatePreferencesMutation.mutateAsync(newPreferences);
    },
    completeOnboarding: async (onboardingData: UserPreferences) => {
      return completeOnboardingMutation.mutateAsync(onboardingData);
    },
    trackRecommendationUsage: async (recommendationId: string, used: boolean) => {
      return trackRecommendationMutation.mutateAsync({ recommendationId, used });
    },
  };
}