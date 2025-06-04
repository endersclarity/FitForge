import { UserPreferences } from '@shared/user-profile';

// Extended preferences for backward compatibility  
export interface ExtendedUserPreferences extends UserPreferences {
  targetGoals?: {
    targetWeight: number
    targetStrengthIncrease: number
    dailyCalorieGoal: number
    dailyProteinGoal: number
  }
}

export interface UserCalorieData {
  caloriesConsumed: number
  caloriesRemaining: number
  proteinConsumed: number
  proteinRemaining: number
  lastUpdated: string
}

export class UserPreferencesService {
  /**
   * Get user preferences from local API
   */
  async getUserPreferences(userId: string): Promise<ExtendedUserPreferences | null> {
    try {
      const response = await fetch(`/api/users/preferences/${userId}`)
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`User preferences not found for user ${userId}`)
          return null
        }
        throw new Error(`Failed to fetch user preferences: ${response.status}`)
      }
      
      const preferences = await response.json()
      return preferences
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      throw error
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<ExtendedUserPreferences>): Promise<ExtendedUserPreferences> {
    try {
      const response = await fetch(`/api/users/preferences/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update user preferences: ${response.status}`)
      }
      
      const updatedPreferences = await response.json()
      return updatedPreferences.preferences || updatedPreferences
    } catch (error) {
      console.error('Error updating user preferences:', error)
      throw error
    }
  }

  /**
   * Get today's calorie/nutrition data (mock for now)
   */
  async getTodayNutrition(userId: string): Promise<UserCalorieData> {
    try {
      // For now, return mock data - in future this would come from nutrition tracking
      const preferences = await this.getUserPreferences(userId)
      
      if (!preferences) {
        return {
          caloriesConsumed: 0,
          caloriesRemaining: 2200, // default goal
          proteinConsumed: 0,
          proteinRemaining: 150, // default goal
          lastUpdated: new Date().toISOString()
        }
      }

      // Mock some calorie consumption for demo
      const dailyCalorieGoal = preferences.targetGoals?.dailyCalorieGoal || 2200;
      const dailyProteinGoal = preferences.targetGoals?.dailyProteinGoal || 150;
      const mockCaloriesConsumed = Math.floor(Math.random() * dailyCalorieGoal * 0.8)
      const mockProteinConsumed = Math.floor(Math.random() * dailyProteinGoal * 0.7)

      return {
        caloriesConsumed: mockCaloriesConsumed,
        caloriesRemaining: dailyCalorieGoal - mockCaloriesConsumed,
        proteinConsumed: mockProteinConsumed,
        proteinRemaining: dailyProteinGoal - mockProteinConsumed,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error)
      // Return defaults on error
      return {
        caloriesConsumed: 0,
        caloriesRemaining: 2200,
        proteinConsumed: 0,
        proteinRemaining: 150,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId)
      return preferences?.onboardingCompleted || false
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      return false
    }
  }

  /**
   * Mark onboarding as completed
   */
  async completeOnboarding(userId: string): Promise<void> {
    try {
      await this.updateUserPreferences(userId, {
        onboardingCompleted: true
      })
    } catch (error) {
      console.error('Error completing onboarding:', error)
      throw error
    }
  }

  /**
   * Update body stats
   */
  async updateBodyStats(userId: string, bodyStats: Partial<UserPreferences['bodyStats']>): Promise<UserPreferences> {
    try {
      const currentPreferences = await this.getUserPreferences(userId)
      if (!currentPreferences) {
        throw new Error('User preferences not found')
      }

      const updatedBodyStats = {
        ...currentPreferences.bodyStats,
        ...bodyStats,
        updatedAt: new Date().toISOString()
      }

      return this.updateUserPreferences(userId, {
        bodyStats: updatedBodyStats
      })
    } catch (error) {
      console.error('Error updating body stats:', error)
      throw error
    }
  }

  /**
   * Update target goals
   */
  async updateTargetGoals(userId: string, targetGoals: Partial<NonNullable<ExtendedUserPreferences['targetGoals']>>): Promise<ExtendedUserPreferences> {
    try {
      const currentPreferences = await this.getUserPreferences(userId)
      if (!currentPreferences) {
        throw new Error('User preferences not found')
      }

      const defaultTargetGoals = {
        targetWeight: 0,
        targetStrengthIncrease: 30,
        dailyCalorieGoal: 2200,
        dailyProteinGoal: 150
      };

      const updatedTargetGoals = {
        ...defaultTargetGoals,
        ...currentPreferences.targetGoals,
        ...targetGoals
      }

      return this.updateUserPreferences(userId, {
        targetGoals: updatedTargetGoals
      })
    } catch (error) {
      console.error('Error updating target goals:', error)
      throw error
    }
  }
}

// Export singleton instance
export const userPreferencesService = new UserPreferencesService()