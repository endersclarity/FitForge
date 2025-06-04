import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BodyStats, 
  BodyweightExerciseConfig, 
  UserPreferences,
  UserProfileUtils
} from '../../../shared/user-profile';

// Types for API responses
interface BodyStatsResponse {
  bodyStats: BodyStats | null;
  hasBodyWeight: boolean;
}

interface BodyweightConfigsResponse {
  configs: BodyweightExerciseConfig[];
  hasBodyWeight: boolean;
}

interface ProfileCompleteResponse {
  complete: boolean;
  missingFields: string[];
  recommendations: string[];
  hasBodyWeight: boolean;
  profileCompleteForBodyweight: boolean;
}

// Context types
interface UserProfileContextType {
  bodyStats: BodyStats | null;
  bodyweightConfigs: BodyweightExerciseConfig[];
  profileCompletion: ProfileCompleteResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Profile utilities
  hasBodyWeight: boolean;
  isProfileCompleteForBodyweight: boolean;
  
  // Actions
  updateBodyStats: (bodyStats: BodyStats) => Promise<void>;
  updateBodyWeight: (bodyWeight: number) => Promise<void>;
  updateBodyweightConfig: (exerciseId: number, config: Partial<BodyweightExerciseConfig>) => Promise<void>;
  getBodyweightConfig: (exerciseId: number) => BodyweightExerciseConfig | undefined;
  calculateTotalWeight: (exerciseId: number, additionalWeight?: number) => number | undefined;
  saveAdditionalWeightPreference: (exerciseId: string, additionalWeight: number, equipment: string) => Promise<void>;
  getAdditionalWeightPreference: (exerciseId: string) => { additionalWeight: number; equipment: string } | undefined;
  
  // UI state management
  showProfileSetup: boolean;
  setShowProfileSetup: (show: boolean) => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

// Hook for using the user profile context
export function useUserProfile(): UserProfileContextType {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}

// Provider component
interface UserProfileProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function UserProfileProvider({ children, userId = "1" }: UserProfileProviderProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Fetch body stats
  const { data: bodyStatsData, isLoading: bodyStatsLoading } = useQuery<BodyStatsResponse>({
    queryKey: ['bodyStats', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/body-stats/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return { bodyStats: null, hasBodyWeight: false };
        }
        throw new Error('Failed to fetch body stats');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch bodyweight exercise configs
  const { data: bodyweightConfigsData, isLoading: configsLoading } = useQuery<BodyweightConfigsResponse>({
    queryKey: ['bodyweightConfigs', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/bodyweight-configs/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return { configs: [], hasBodyWeight: false };
        }
        throw new Error('Failed to fetch bodyweight configs');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch profile completion status
  const { data: profileCompletion, isLoading: completionLoading } = useQuery<ProfileCompleteResponse>({
    queryKey: ['profileComplete', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/profile-complete/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to check profile completion');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update body stats mutation
  const updateBodyStatsMutation = useMutation({
    mutationFn: async (bodyStats: BodyStats) => {
      const response = await fetch(`/api/users/body-stats/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyStats),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update body stats');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyStats', userId] });
      queryClient.invalidateQueries({ queryKey: ['profileComplete', userId] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Update body weight only mutation (quick update)
  const updateBodyWeightMutation = useMutation({
    mutationFn: async (bodyWeight: number) => {
      const response = await fetch(`/api/users/body-weight/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyWeight }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update body weight');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyStats', userId] });
      queryClient.invalidateQueries({ queryKey: ['profileComplete', userId] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Update bodyweight exercise config mutation
  const updateBodyweightConfigMutation = useMutation({
    mutationFn: async ({ exerciseId, config }: { exerciseId: number; config: Partial<BodyweightExerciseConfig> }) => {
      const response = await fetch(`/api/users/bodyweight-configs/${userId}/${exerciseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update bodyweight config');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyweightConfigs', userId] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Derived values
  const bodyStats = bodyStatsData?.bodyStats || null;
  const bodyweightConfigs = bodyweightConfigsData?.configs || [];
  const hasBodyWeight = bodyStatsData?.hasBodyWeight || false;
  const isProfileCompleteForBodyweight = profileCompletion?.profileCompleteForBodyweight || false;
  const isLoading = bodyStatsLoading || configsLoading || completionLoading;

  // Helper functions using UserProfileUtils
  const getBodyweightConfig = (exerciseId: number): BodyweightExerciseConfig | undefined => {
    return bodyweightConfigs.find(config => config.exerciseId === exerciseId);
  };

  const calculateTotalWeight = (exerciseId: number, additionalWeight: number = 0): number | undefined => {
    if (!bodyStats?.bodyWeight) return undefined;
    return bodyStats.bodyWeight + additionalWeight;
  };

  // Additional weight preference functions using localStorage for fast access
  const saveAdditionalWeightPreference = async (exerciseId: string, additionalWeight: number, equipment: string): Promise<void> => {
    const key = `fitforge-additional-weight-${exerciseId}`;
    const preference = {
      additionalWeight,
      equipment,
      updatedAt: new Date().toISOString()
    };
    
    // Save to localStorage for immediate access
    localStorage.setItem(key, JSON.stringify(preference));
    
    // Also save to backend if we have a numeric exercise ID (for future backend integration)
    try {
      const numericExerciseId = parseInt(exerciseId);
      if (!isNaN(numericExerciseId)) {
        await updateBodyweightConfigMutation.mutateAsync({ 
          exerciseId: numericExerciseId, 
          config: {
            defaultAdditionalWeight: additionalWeight,
            preferredEquipment: equipment as any,
            lastUsedAdditionalWeight: additionalWeight,
            lastUsedAt: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.warn('Failed to save additional weight preference to backend:', error);
      // localStorage save still succeeded, so this is non-blocking
    }
  };

  const getAdditionalWeightPreference = (exerciseId: string): { additionalWeight: number; equipment: string } | undefined => {
    // First try to get from bodyweight configs (backend data)
    const numericExerciseId = parseInt(exerciseId);
    if (!isNaN(numericExerciseId)) {
      const config = getBodyweightConfig(numericExerciseId);
      if (config?.lastUsedAdditionalWeight !== undefined) {
        return {
          additionalWeight: config.lastUsedAdditionalWeight,
          equipment: config.preferredEquipment || 'dumbbells'
        };
      }
    }
    
    // Fallback to localStorage
    const key = `fitforge-additional-weight-${exerciseId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const preference = JSON.parse(stored);
        return {
          additionalWeight: preference.additionalWeight || 0,
          equipment: preference.equipment || 'dumbbells'
        };
      } catch (error) {
        console.warn('Failed to parse stored additional weight preference:', error);
      }
    }
    
    return undefined;
  };

  // Context value
  const contextValue: UserProfileContextType = {
    bodyStats,
    bodyweightConfigs,
    profileCompletion: profileCompletion || null,
    isLoading,
    error,
    
    // Profile utilities
    hasBodyWeight,
    isProfileCompleteForBodyweight,
    
    // Actions
    updateBodyStats: async (bodyStats: BodyStats) => {
      return updateBodyStatsMutation.mutateAsync(bodyStats);
    },
    updateBodyWeight: async (bodyWeight: number) => {
      return updateBodyWeightMutation.mutateAsync(bodyWeight);
    },
    updateBodyweightConfig: async (exerciseId: number, config: Partial<BodyweightExerciseConfig>) => {
      return updateBodyweightConfigMutation.mutateAsync({ exerciseId, config });
    },
    getBodyweightConfig,
    calculateTotalWeight,
    saveAdditionalWeightPreference,
    getAdditionalWeightPreference,
    
    // UI state management
    showProfileSetup,
    setShowProfileSetup,
  };

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
}

// Hook for quick body weight check (can be used outside provider for basic checks)
export function useBodyWeightCheck(userId: string = "1") {
  const { data: bodyStatsData, isLoading } = useQuery<BodyStatsResponse>({
    queryKey: ['bodyStats', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/body-stats/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return { bodyStats: null, hasBodyWeight: false };
        }
        throw new Error('Failed to fetch body stats');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    hasBodyWeight: bodyStatsData?.hasBodyWeight || false,
    bodyWeight: bodyStatsData?.bodyStats?.bodyWeight,
    isLoading,
  };
}

// Hook for checking if profile setup should be shown
export function useProfileSetupPrompt(userId: string = "1") {
  const { data: profileCompletion } = useQuery<ProfileCompleteResponse>({
    queryKey: ['profileComplete', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/profile-complete/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to check profile completion');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  return {
    shouldShowSetup: !profileCompletion?.profileCompleteForBodyweight,
    missingFields: profileCompletion?.missingFields || [],
    recommendations: profileCompletion?.recommendations || [],
  };
}

export default useUserProfile;