import { z } from "zod";

// User profile and preferences schema for guided fitness experience
export const UserGoalSchema = z.enum([
  "strength",
  "muscle_gain", 
  "weight_loss",
  "general_fitness",
  "endurance",
  "flexibility"
]);

export const ExperienceLevelSchema = z.enum([
  "beginner",
  "intermediate", 
  "advanced"
]);

export const EquipmentSchema = z.enum([
  "barbell",
  "dumbbell",
  "bodyweight",
  "cable",
  "machine",
  "resistance_band",
  "kettlebell",
  "medicine_ball",
  "pull_up_bar",
  "bench",
  "squat_rack"
]);

// Body weight and physical stats schema
export const BodyStatsSchema = z.object({
  bodyWeight: z.number().min(50).max(500).optional(), // in pounds
  height: z.number().min(36).max(96).optional(), // in inches
  age: z.number().min(13).max(120).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  updatedAt: z.string().optional()
});

// Configuration for bodyweight exercise preferences
export const BodyweightExerciseConfigSchema = z.object({
  exerciseId: z.number(),
  exerciseName: z.string(),
  defaultAdditionalWeight: z.number().default(0), // additional weight on top of body weight
  preferredEquipment: z.enum(["none", "dumbbells", "weighted_vest", "plate", "kettlebell"]).default("none"),
  lastUsedAdditionalWeight: z.number().optional(),
  lastUsedAt: z.string().optional()
});

export const UserPreferencesSchema = z.object({
  goals: z.array(UserGoalSchema),
  experienceLevel: ExperienceLevelSchema,
  availableEquipment: z.array(EquipmentSchema),
  workoutFrequency: z.number().min(1).max(7), // workouts per week
  sessionDuration: z.number().min(15).max(180), // minutes
  onboardingCompleted: z.boolean().default(false),
  coachingEnabled: z.boolean().default(true),
  achievementNotifications: z.boolean().default(true),
  bodyStats: BodyStatsSchema.optional(),
  bodyweightExerciseConfigs: z.array(BodyweightExerciseConfigSchema).default([])
});

export const AchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(["consistency", "strength", "volume", "milestone"]),
  unlockedAt: z.string().optional(),
  progress: z.number().min(0).max(100),
  target: z.number()
});

export const WorkoutRecommendationSchema = z.object({
  id: z.string(),
  workoutType: z.string(),
  title: z.string(),
  description: z.string(),
  estimatedDuration: z.number(),
  difficulty: ExperienceLevelSchema,
  rationale: z.string(),
  exercises: z.array(z.object({
    exerciseId: z.number(),
    exerciseName: z.string(),
    suggestedSets: z.number(),
    suggestedReps: z.string(), // e.g., "8-12", "6-8" 
    suggestedWeight: z.number().optional(),
    progressiveOverloadTip: z.string().optional()
  })),
  createdAt: z.string()
});

export type UserGoal = z.infer<typeof UserGoalSchema>;
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;
export type Equipment = z.infer<typeof EquipmentSchema>;
export type BodyStats = z.infer<typeof BodyStatsSchema>;
export type BodyweightExerciseConfig = z.infer<typeof BodyweightExerciseConfigSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type WorkoutRecommendation = z.infer<typeof WorkoutRecommendationSchema>;

// Default user preferences for new users
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  goals: ["general_fitness"],
  experienceLevel: "beginner",
  availableEquipment: ["bodyweight"],
  workoutFrequency: 3,
  sessionDuration: 45,
  onboardingCompleted: false,
  coachingEnabled: true,
  achievementNotifications: true,
  bodyStats: undefined,
  bodyweightExerciseConfigs: []
};

// Core achievements that all users can unlock
export const CORE_ACHIEVEMENTS: Omit<Achievement, "unlockedAt" | "progress">[] = [
  {
    id: "first_workout",
    name: "First Steps",
    description: "Complete your first workout session",
    category: "milestone",
    target: 1
  },
  {
    id: "workout_streak_3",
    name: "Building Momentum", 
    description: "Complete 3 workouts in a row",
    category: "consistency",
    target: 3
  },
  {
    id: "workout_streak_7", 
    name: "Week Warrior",
    description: "Complete 7 workouts in a row",
    category: "consistency", 
    target: 7
  },
  {
    id: "first_pr",
    name: "Personal Best",
    description: "Set your first personal record",
    category: "strength",
    target: 1
  },
  {
    id: "volume_1000",
    name: "Volume Crusher",
    description: "Complete 1000 total pounds of volume in a single workout",
    category: "volume",
    target: 1000
  },
  {
    id: "month_consistent",
    name: "Monthly Dedication",
    description: "Work out at least 3 times per week for a month",
    category: "consistency",
    target: 12
  }
];

// Utility functions for bodyweight exercise management
export const UserProfileUtils = {
  /**
   * Check if user has body weight data
   */
  hasBodyWeight(preferences: UserPreferences): boolean {
    return preferences.bodyStats?.bodyWeight !== undefined;
  },

  /**
   * Get user's current body weight in pounds
   */
  getBodyWeight(preferences: UserPreferences): number | undefined {
    return preferences.bodyStats?.bodyWeight;
  },

  /**
   * Update user's body weight
   */
  updateBodyWeight(preferences: UserPreferences, bodyWeight: number): UserPreferences {
    return {
      ...preferences,
      bodyStats: {
        ...preferences.bodyStats,
        bodyWeight,
        updatedAt: new Date().toISOString()
      }
    };
  },

  /**
   * Get bodyweight exercise configuration for a specific exercise
   */
  getBodyweightExerciseConfig(preferences: UserPreferences, exerciseId: number): BodyweightExerciseConfig | undefined {
    return preferences.bodyweightExerciseConfigs.find(config => config.exerciseId === exerciseId);
  },

  /**
   * Update or add bodyweight exercise configuration
   */
  updateBodyweightExerciseConfig(
    preferences: UserPreferences, 
    exerciseId: number, 
    config: Partial<BodyweightExerciseConfig>
  ): UserPreferences {
    const existingConfigIndex = preferences.bodyweightExerciseConfigs.findIndex(
      c => c.exerciseId === exerciseId
    );

    const updatedConfig: BodyweightExerciseConfig = {
      exerciseId,
      exerciseName: config.exerciseName || '',
      defaultAdditionalWeight: config.defaultAdditionalWeight || 0,
      preferredEquipment: config.preferredEquipment || 'none',
      lastUsedAdditionalWeight: config.lastUsedAdditionalWeight,
      lastUsedAt: new Date().toISOString()
    };

    const newConfigs = [...preferences.bodyweightExerciseConfigs];
    if (existingConfigIndex >= 0) {
      newConfigs[existingConfigIndex] = updatedConfig;
    } else {
      newConfigs.push(updatedConfig);
    }

    return {
      ...preferences,
      bodyweightExerciseConfigs: newConfigs
    };
  },

  /**
   * Calculate total weight for a bodyweight exercise (body weight + additional weight)
   */
  calculateTotalWeight(preferences: UserPreferences, exerciseId: number, additionalWeight: number = 0): number | undefined {
    const bodyWeight = this.getBodyWeight(preferences);
    if (bodyWeight === undefined) return undefined;
    
    return bodyWeight + additionalWeight;
  },

  /**
   * Check if user profile is complete enough for bodyweight exercises
   */
  isProfileCompleteForBodyweight(preferences: UserPreferences): boolean {
    return this.hasBodyWeight(preferences);
  }
};