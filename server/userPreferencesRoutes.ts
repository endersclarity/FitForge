import { Router } from "express";
import { z } from "zod";
import { FileStorage } from "./fileStorage";
import { 
  UserPreferencesSchema, 
  BodyStatsSchema,
  BodyweightExerciseConfigSchema,
  AchievementSchema, 
  WorkoutRecommendationSchema, 
  DEFAULT_USER_PREFERENCES, 
  CORE_ACHIEVEMENTS,
  UserProfileUtils
} from "../shared/user-profile";

const router = Router();
const storage = new FileStorage();

// Body Stats Management Routes

// Get user body stats
router.get("/body-stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await storage.getUserPreferences(userId);
    
    if (!preferences) {
      res.status(404).json({ error: "User preferences not found" });
      return;
    }
    
    res.json({
      bodyStats: preferences.bodyStats || null,
      hasBodyWeight: UserProfileUtils.hasBodyWeight(preferences)
    });
  } catch (error) {
    console.error("Error fetching body stats:", error);
    res.status(500).json({ error: "Failed to fetch body stats" });
  }
});

// Update user body stats
router.put("/body-stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const bodyStatsData = BodyStatsSchema.parse(req.body);
    
    let preferences = await storage.getUserPreferences(userId);
    if (!preferences) {
      preferences = DEFAULT_USER_PREFERENCES;
    }
    
    // Update body stats with timestamp
    const updatedPreferences = {
      ...preferences,
      bodyStats: {
        ...bodyStatsData,
        updatedAt: new Date().toISOString()
      }
    };
    
    await storage.saveUserPreferences(userId, updatedPreferences);
    res.json({ 
      success: true, 
      bodyStats: updatedPreferences.bodyStats,
      hasBodyWeight: UserProfileUtils.hasBodyWeight(updatedPreferences)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid body stats data", details: error.errors });
    } else {
      console.error("Error saving body stats:", error);
      res.status(500).json({ error: "Failed to save body stats" });
    }
  }
});

// Update just body weight (quick endpoint)
router.put("/body-weight/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { bodyWeight } = req.body;
    
    if (typeof bodyWeight !== 'number' || bodyWeight < 50 || bodyWeight > 500) {
      res.status(400).json({ error: "Invalid body weight. Must be between 50 and 500 pounds." });
      return;
    }
    
    let preferences = await storage.getUserPreferences(userId);
    if (!preferences) {
      preferences = DEFAULT_USER_PREFERENCES;
    }
    
    const updatedPreferences = UserProfileUtils.updateBodyWeight(preferences, bodyWeight);
    await storage.saveUserPreferences(userId, updatedPreferences);
    
    res.json({ 
      success: true, 
      bodyWeight,
      bodyStats: updatedPreferences.bodyStats
    });
  } catch (error) {
    console.error("Error updating body weight:", error);
    res.status(500).json({ error: "Failed to update body weight" });
  }
});

// Bodyweight Exercise Configuration Routes

// Get bodyweight exercise configs for user
router.get("/bodyweight-configs/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await storage.getUserPreferences(userId);
    
    if (!preferences) {
      res.status(404).json({ error: "User preferences not found" });
      return;
    }
    
    res.json({
      configs: preferences.bodyweightExerciseConfigs || [],
      hasBodyWeight: UserProfileUtils.hasBodyWeight(preferences)
    });
  } catch (error) {
    console.error("Error fetching bodyweight configs:", error);
    res.status(500).json({ error: "Failed to fetch bodyweight exercise configs" });
  }
});

// Update bodyweight exercise configuration
router.put("/bodyweight-configs/:userId/:exerciseId", async (req, res) => {
  try {
    const { userId, exerciseId } = req.params;
    const configData = BodyweightExerciseConfigSchema.parse({
      ...req.body,
      exerciseId: parseInt(exerciseId, 10)
    });
    
    let preferences = await storage.getUserPreferences(userId);
    if (!preferences) {
      preferences = DEFAULT_USER_PREFERENCES;
    }
    
    const updatedPreferences = UserProfileUtils.updateBodyweightExerciseConfig(
      preferences, 
      parseInt(exerciseId, 10), 
      configData
    );
    
    await storage.saveUserPreferences(userId, updatedPreferences);
    res.json({ 
      success: true, 
      config: UserProfileUtils.getBodyweightExerciseConfig(updatedPreferences, parseInt(exerciseId, 10))
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid bodyweight config data", details: error.errors });
    } else {
      console.error("Error saving bodyweight config:", error);
      res.status(500).json({ error: "Failed to save bodyweight exercise config" });
    }
  }
});

// Profile completion check
router.get("/profile-complete/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await storage.getUserPreferences(userId);
    
    if (!preferences) {
      res.json({ 
        complete: false, 
        missingFields: ["preferences"],
        recommendations: ["Complete onboarding first"]
      });
      return;
    }
    
    const missingFields = [];
    const recommendations = [];
    
    if (!UserProfileUtils.hasBodyWeight(preferences)) {
      missingFields.push("bodyWeight");
      recommendations.push("Add your body weight to enable bodyweight exercise auto-population");
    }
    
    if (!preferences.bodyStats?.height) {
      missingFields.push("height");
      recommendations.push("Add your height for more accurate fitness calculations");
    }
    
    res.json({
      complete: missingFields.length === 0,
      missingFields,
      recommendations,
      hasBodyWeight: UserProfileUtils.hasBodyWeight(preferences),
      profileCompleteForBodyweight: UserProfileUtils.isProfileCompleteForBodyweight(preferences)
    });
  } catch (error) {
    console.error("Error checking profile completion:", error);
    res.status(500).json({ error: "Failed to check profile completion" });
  }
});

// Get user preferences
router.get("/preferences/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let preferences = await storage.getUserPreferences(userId);
    
    // Initialize with defaults if preferences don't exist
    if (!preferences) {
      preferences = DEFAULT_USER_PREFERENCES;
      await storage.saveUserPreferences(userId, preferences);
    }
    
    res.json(preferences);
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({ error: "Failed to fetch user preferences" });
  }
});

// Update user preferences
router.put("/preferences/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const preferencesData = UserPreferencesSchema.parse(req.body);
    
    await storage.saveUserPreferences(userId, preferencesData);
    res.json({ success: true, preferences: preferencesData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid preferences data", details: error.errors });
    } else {
      console.error("Error saving user preferences:", error);
      res.status(500).json({ error: "Failed to save user preferences" });
    }
  }
});

// Complete onboarding
router.post("/onboarding/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const onboardingData = UserPreferencesSchema.parse(req.body);
    
    // Mark onboarding as completed
    onboardingData.onboardingCompleted = true;
    
    await storage.saveUserPreferences(userId, onboardingData);
    
    // Initialize core achievements for new user
    await storage.initializeUserAchievements(userId);
    
    res.json({ 
      success: true, 
      preferences: onboardingData,
      message: "Onboarding completed successfully" 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid onboarding data", details: error.errors });
    } else {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  }
});

// Get user achievements
router.get("/achievements/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const achievements = await storage.getUserAchievements(userId);
    res.json(achievements || []);
  } catch (error) {
    console.error("Error fetching user achievements:", error);
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

// Get workout recommendations
router.get("/recommendations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await storage.getUserPreferences(userId);
    const workoutHistory = await storage.getUserWorkouts(userId);
    
    if (!preferences) {
      res.status(400).json({ error: "User preferences not found. Please complete onboarding." });
      return;
    }
    
    // Generate recommendations based on preferences and history
    const recommendations = await generateWorkoutRecommendations(preferences, workoutHistory);
    res.json(recommendations);
  } catch (error) {
    console.error("Error generating workout recommendations:", error);
    res.status(500).json({ error: "Failed to generate workout recommendations" });
  }
});

// Track recommendation usage
router.post("/recommendations/:userId/track", async (req, res) => {
  try {
    const { userId } = req.params;
    const { recommendationId, used } = req.body;
    
    await storage.trackRecommendationUsage(userId, recommendationId, used);
    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking recommendation usage:", error);
    res.status(500).json({ error: "Failed to track recommendation usage" });
  }
});

// Simple workout recommendation generation
async function generateWorkoutRecommendations(preferences: any, workoutHistory: any[]): Promise<any[]> {
  const recommendations = [];
  
  // Get recent workout to avoid repetition
  const recentWorkouts = workoutHistory.slice(-3).map(w => w.workoutType);
  
  // Basic recommendation logic based on user goals and equipment
  if (preferences.goals.includes("strength") && preferences.availableEquipment.includes("barbell")) {
    if (!recentWorkouts.includes("ChestTriceps")) {
      recommendations.push({
        id: "chest_triceps_strength",
        workoutType: "ChestTriceps",
        title: "Strength-Focused Chest & Triceps",
        description: "Heavy compound movements for building raw strength",
        estimatedDuration: preferences.sessionDuration,
        difficulty: preferences.experienceLevel,
        rationale: "Based on your strength goals and available barbell equipment",
        exercises: [
          {
            exerciseId: 1,
            exerciseName: "Barbell Bench Press",
            suggestedSets: 4,
            suggestedReps: "5-6",
            progressiveOverloadTip: "Focus on adding 2.5-5lbs each week for strength gains"
          }
        ],
        createdAt: new Date().toISOString()
      });
    }
  }
  
  if (preferences.goals.includes("muscle_gain")) {
    if (!recentWorkouts.includes("BackBiceps")) {
      recommendations.push({
        id: "back_biceps_hypertrophy",
        workoutType: "BackBiceps", 
        title: "Muscle-Building Back & Biceps",
        description: "Higher volume training for muscle growth",
        estimatedDuration: preferences.sessionDuration,
        difficulty: preferences.experienceLevel,
        rationale: "Hypertrophy-focused training matches your muscle gain goals",
        exercises: [
          {
            exerciseId: 5,
            exerciseName: "Pull-ups",
            suggestedSets: 3,
            suggestedReps: "8-12",
            progressiveOverloadTip: "Add weight when you can complete 12 reps across all sets"
          }
        ],
        createdAt: new Date().toISOString()
      });
    }
  }
  
  // Fallback general recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      id: "general_full_body",
      workoutType: "FullBody",
      title: "Balanced Full Body Workout",
      description: "A well-rounded workout hitting all major muscle groups",
      estimatedDuration: preferences.sessionDuration,
      difficulty: preferences.experienceLevel,
      rationale: "Full body training is excellent for general fitness goals",
      exercises: [
        {
          exerciseId: 10,
          exerciseName: "Bodyweight Squats",
          suggestedSets: 3,
          suggestedReps: "10-15",
          progressiveOverloadTip: "Increase reps or add weight as you get stronger"
        }
      ],
      createdAt: new Date().toISOString()
    });
  }
  
  return recommendations.slice(0, 2); // Return top 2 recommendations
}

export default router;