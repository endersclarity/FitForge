import { Router } from "express";
import { z } from "zod";
import { FileStorage } from "./fileStorage";
import { UserPreferencesSchema, AchievementSchema, WorkoutRecommendationSchema, DEFAULT_USER_PREFERENCES, CORE_ACHIEVEMENTS } from "../shared/user-profile";

const router = Router();
const storage = new FileStorage();

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