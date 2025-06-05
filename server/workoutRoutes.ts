import { Router } from "express";
import { authenticateToken } from "./auth-middleware";
import { UnifiedFileStorage } from "./unifiedFileStorage";
import { storage } from "./storage";
import { insertWorkoutSchema } from "../shared/schema";
import { UnifiedWorkoutSession } from "../shared/unified-storage-schema";
import { z } from "zod";

const router = Router();

// Initialize unified file storage on startup
const unifiedStorage = new UnifiedFileStorage();
unifiedStorage.initialize().catch(console.error);

// Validation schemas
const startWorkoutSchema = z.object({
  workoutType: z.string(),
  plannedExercises: z.array(z.string()).optional()
});

const logSetSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string().optional(),
  setNumber: z.number().optional(),
  weight: z.number().min(0),
  reps: z.number().min(1),
  equipment: z.string().optional(),
  formScore: z.number().min(1).max(10).optional(),
  notes: z.string().optional()
});

const completeWorkoutSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
});

// Legacy workout routes migrated from routes.ts to prevent route conflicts
// Get all workouts (legacy compatibility)
router.get("/", async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    const workouts = await storage.getWorkouts({
      category: category as string,
      difficulty: difficulty as string
    });
    res.json(workouts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific workout by ID (legacy compatibility)
router.get("/:id(\\d+)", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const workout = await storage.getWorkout(id);
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.json(workout);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create new workout (legacy compatibility)
router.post("/", authenticateToken, async (req: any, res) => {
  try {
    const workoutData = insertWorkoutSchema.parse({
      ...req.body,
      userId: req.userId
    });
    const workout = await storage.createWorkout(workoutData);
    res.json(workout);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Start a new workout session
router.post("/start", authenticateToken, async (req: any, res) => {
  try {
    const { workoutType, plannedExercises } = startWorkoutSchema.parse(req.body);
    const userId = req.userId;
    
    // Check if there's already an active session using working storage
    const existingSessions = await storage.getWorkoutSessions(userId);
    const activeSession = existingSessions.find(s => s.status === 'active' || s.status === 'in_progress');
    
    if (activeSession) {
      return res.status(409).json({ 
        message: "You already have an active workout session. Please complete or abandon it first.",
        sessionId: `local-${activeSession.id}`,
        sessionStartTime: activeSession.startTime,
        sessionExerciseCount: 1,
        canAbandon: true
      });
    }
    
    // Create session using working storage
    const sessionData = {
      userId: userId,
      workoutType: workoutType,
      startTime: new Date(),
      status: 'active' as const,
      exercises: plannedExercises || [],
      exerciseCount: plannedExercises?.length || 1,
      setCount: 0,
      totalVolume: 0,
      notes: ''
    };
    
    const session = await storage.createWorkoutSession(sessionData);
    
    res.json({
      sessionId: `local-${session.id}`,
      startTime: session.startTime,
      message: "Workout session started successfully"
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    console.error("Error starting workout:", error);
    res.status(500).json({ message: error.message || "Failed to start workout session" });
  }
});

// Log a set during workout
router.post("/:sessionId/sets", authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const setData = logSetSchema.parse(req.body);
    const userId = req.userId.toString();
    
    // Get exercise name if not provided
    let exerciseName = setData.exerciseName;
    if (!exerciseName) {
      // Try to find exercise name from exercise database
      const { enderExerciseDatabase } = await import("../scripts/ender-real-exercises");
      const exercise = enderExerciseDatabase.find(e => e.exerciseName === setData.exerciseId);
      exerciseName = exercise?.exerciseName || setData.exerciseId;
    }

    // Get current session to determine set number
    const numericSessionId = parseInt(sessionId.replace('local-', ''));
    const currentSession = await storage.getWorkoutSession(numericSessionId);
    
    if (!currentSession) {
      return res.status(404).json({ message: "Workout session not found" });
    }
    
    const currentSetNumber = setData.setNumber || 1;

    // Log the set using the working storage system
    const result = await storage.updateSetLog(
      numericSessionId,
      setData.exerciseId,
      currentSetNumber,
      {
        weight: setData.weight,
        reps: setData.reps,
        equipment: setData.equipment,
        formScore: setData.formScore,
        notes: setData.notes
      }
    );
    
    // Calculate volume for this set
    const setVolume = setData.weight * setData.reps;
    
    // Update session with new volume
    await storage.updateWorkoutSession(numericSessionId, {
      totalVolume: (currentSession.totalVolume || 0) + setVolume
    });
    
    res.json({
      success: result,
      totalVolume: setVolume,
      setId: `${numericSessionId}-${setData.exerciseId}-${currentSetNumber}`,
      message: `Set ${currentSetNumber} logged successfully`
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid set data", errors: error.errors });
    }
    console.error("Error logging set:", error);
    res.status(500).json({ message: error.message || "Failed to log set" });
  }
});

// Complete a workout session
router.put("/:sessionId/complete", authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, notes } = completeWorkoutSchema.parse(req.body);
    const userId = req.userId;
    
    // Find the session in the working storage system
    const session = await storage.getWorkoutSession(parseInt(sessionId.replace('local-', '')));
    if (!session) {
      return res.status(404).json({ message: "Workout session not found" });
    }
    
    // Update session to mark as completed
    const completedSession = await storage.updateWorkoutSession(session.id, {
      endTime: new Date(),
      status: 'completed',
      notes: notes
    });
    
    // Calculate summary
    const summary = {
      duration: session.endTime ? (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60 : 0,
      totalVolume: session.totalVolume || 0,
      exerciseCount: (session as any).exerciseCount || 1,
      setCount: (session as any).setCount || 1,
      caloriesBurned: Math.round((session.totalVolume || 0) * 0.05), // Rough estimate
      personalRecords: []
    };
    
    res.json({
      message: "Workout completed successfully",
      summary: {
        duration: summary.duration,
        totalVolume: summary.totalVolume,
        exerciseCount: summary.exerciseCount,
        setCount: summary.setCount,
        caloriesBurned: summary.caloriesBurned,
        personalRecords: summary.personalRecords
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid completion data", errors: error.errors });
    }
    console.error("Error completing workout:", error);
    res.status(500).json({ message: error.message || "Failed to complete workout" });
  }
});

// Get workout history
router.get("/history", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { limit, offset, from, to, workoutType } = req.query;
    
    const filters = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      from: from as string,
      to: to as string,
      workoutType: workoutType as string
    };
    
    const workouts = await unifiedStorage.getUnifiedWorkoutSessions(userId, filters);
    
    res.json({
      workouts,
      total: workouts.length,
      hasMore: workouts.length === (filters.limit || 50)
    });
  } catch (error: any) {
    console.error("Error fetching workout history:", error);
    res.status(500).json({ message: error.message || "Failed to fetch workout history" });
  }
});

// Get active workout session
router.get("/active", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const activeSession = await unifiedStorage.getActiveUnifiedSession(userId);
    
    if (!activeSession) {
      return res.status(404).json({ message: "No active workout session found" });
    }
    
    res.json(activeSession);
  } catch (error: any) {
    console.error("Error fetching active session:", error);
    res.status(500).json({ message: error.message || "Failed to fetch active session" });
  }
});

// Get detailed active session info
router.get("/active/details", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const activeSession = await unifiedStorage.getActiveUnifiedSession(userId);
    
    if (!activeSession) {
      return res.status(404).json({ message: "No active workout session found" });
    }
    
    const sessionAge = Date.now() - new Date(activeSession.startTime).getTime();
    const sessionAgeMinutes = Math.round(sessionAge / 1000 / 60);
    
    res.json({
      ...activeSession,
      sessionAgeMinutes,
      canAbandon: true,
      canResume: activeSession.exercises.some(e => e.sets.length > 0)
    });
  } catch (error: any) {
    console.error("Error fetching active session details:", error);
    res.status(500).json({ message: error.message || "Failed to fetch active session details" });
  }
});

// Force cleanup active sessions
router.delete("/active", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const cleanedCount = await unifiedStorage.cleanupOldSessions(userId, 0); // Force cleanup all
    
    res.json({ 
      message: `Cleaned up ${cleanedCount} active sessions`,
      cleanedCount 
    });
  } catch (error: any) {
    console.error("Error cleaning up sessions:", error);
    res.status(500).json({ message: error.message || "Failed to cleanup sessions" });
  }
});

// Force abandon specific session
router.put("/:sessionId/force-abandon", authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId.toString();
    
    await unifiedStorage.forceAbandonSession(userId, sessionId);
    
    res.json({ message: "Session force abandoned successfully" });
  } catch (error: any) {
    console.error("Error force abandoning session:", error);
    res.status(500).json({ message: error.message || "Failed to force abandon session" });
  }
});

// Abandon a workout session
router.put("/:sessionId/abandon", authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId.toString();
    
    // Use the dedicated abandon method instead of completing
    await unifiedStorage.forceAbandonSession(userId, sessionId);
    
    res.json({ message: "Workout session abandoned successfully" });
  } catch (error: any) {
    console.error("Error abandoning workout:", error);
    res.status(500).json({ message: error.message || "Failed to abandon workout" });
  }
});

// Get workout analytics from unified storage
router.get("/analytics", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    
    // Get user aggregations from unified storage
    const aggregations = await unifiedStorage.getUserAggregations(userId);
    
    // Get recent workout sessions for additional insights
    const recentWorkouts = await unifiedStorage.getUnifiedWorkoutSessions(userId, { 
      limit: 10,
      sessionType: 'completed'
    });
    
    // Calculate additional metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentWorkoutsThisWeek = recentWorkouts.filter(w => 
      new Date(w.startTime) >= oneWeekAgo
    );
    
    const analytics = {
      ...aggregations,
      recentWorkouts: recentWorkoutsThisWeek.length,
      lastWorkoutDate: recentWorkouts[0]?.startTime,
      averageWorkoutDuration: aggregations && aggregations.totalWorkouts > 0 
        ? Math.round(aggregations.totalDuration / aggregations.totalWorkouts) 
        : 0,
      averageCaloriesPerWorkout: aggregations && aggregations.totalWorkouts > 0 
        ? Math.round(aggregations.totalCalories / aggregations.totalWorkouts) 
        : 0,
      averageVolumePerWorkout: aggregations && aggregations.totalWorkouts > 0 
        ? Math.round(aggregations.totalVolume / aggregations.totalWorkouts) 
        : 0
    };
    
    res.json(analytics);
  } catch (error: any) {
    console.error("Error fetching workout analytics:", error);
    res.status(500).json({ message: error.message || "Failed to fetch analytics" });
  }
});

// Get muscle recovery data from unified storage
router.get("/muscle-recovery", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    
    // Get recent workout sessions for muscle recovery calculations
    const recentWorkouts = await unifiedStorage.getUnifiedWorkoutSessions(userId, { 
      limit: 50,
      sessionType: 'completed'
    });
    
    // Calculate muscle recovery states based on recent workouts
    const muscleRecoveryStates = calculateMuscleRecoveryFromWorkouts(recentWorkouts);
    
    res.json({
      recoveryStates: muscleRecoveryStates,
      lastUpdated: new Date().toISOString(),
      dataSource: 'unified_storage'
    });
  } catch (error: any) {
    console.error("Error fetching muscle recovery data:", error);
    res.status(500).json({ message: error.message || "Failed to fetch muscle recovery data" });
  }
});

// Get exercise progress data for analytics
router.get("/exercise-progress", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { exerciseName, timeRange = '3M' } = req.query;
    
    // Calculate time range
    const now = new Date();
    const monthsBack = timeRange === '1M' ? 1 : timeRange === '6M' ? 6 : timeRange === '1Y' ? 12 : 3;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
    
    // Get workout sessions in time range
    const workouts = await unifiedStorage.getUnifiedWorkoutSessions(userId, {
      from: cutoffDate.toISOString(),
      sessionType: 'completed'
    });
    
    // Filter by specific exercise if requested
    let filteredWorkouts = workouts;
    if (exerciseName) {
      filteredWorkouts = workouts.filter(workout => 
        workout.exercises.some(ex => ex.exerciseName.toLowerCase().includes((exerciseName as string).toLowerCase()))
      );
    }
    
    // Calculate exercise progress data
    const exerciseProgress = calculateExerciseProgressFromWorkouts(filteredWorkouts, exerciseName as string);
    
    res.json(exerciseProgress);
  } catch (error: any) {
    console.error("Error fetching exercise progress:", error);
    res.status(500).json({ message: error.message || "Failed to fetch exercise progress" });
  }
});

// Migrate legacy data to unified storage
router.post("/migrate-to-unified", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    
    const migrationResult = await unifiedStorage.migrateToUnifiedStorage(userId);
    
    res.json({
      message: "Migration completed",
      ...migrationResult
    });
  } catch (error: any) {
    console.error("Error migrating to unified storage:", error);
    res.status(500).json({ message: error.message || "Failed to migrate data" });
  }
});

// ============================================================================
// HELPER FUNCTIONS FOR UNIFIED STORAGE DATA PROCESSING
// ============================================================================

/**
 * Exercise to muscle group mapping for recovery calculations
 */
const EXERCISE_TO_MUSCLE_MAPPING: Record<string, string[]> = {
  // Chest exercises
  'bench press': ['chest', 'triceps', 'shoulders'],
  'incline bench press': ['chest', 'shoulders', 'triceps'],
  'decline bench press': ['chest', 'triceps'],
  'push ups': ['chest', 'triceps', 'shoulders'],
  'dumbbell press': ['chest', 'triceps', 'shoulders'],
  'chest fly': ['chest'],
  'dips': ['chest', 'triceps'],

  // Back exercises
  'pull ups': ['back', 'biceps'],
  'chin ups': ['back', 'biceps'],
  'rows': ['back', 'biceps'],
  'bent over row': ['back', 'biceps'],
  'lat pulldown': ['back', 'biceps'],
  'deadlift': ['back', 'hamstrings', 'glutes'],
  't-bar row': ['back', 'biceps'],

  // Shoulders
  'overhead press': ['shoulders', 'triceps'],
  'shoulder press': ['shoulders', 'triceps'],
  'lateral raises': ['shoulders'],
  'front raises': ['shoulders'],
  'rear delt fly': ['shoulders', 'back'],
  'upright row': ['shoulders', 'back'],

  // Arms
  'bicep curls': ['biceps'],
  'hammer curls': ['biceps'],
  'tricep extension': ['triceps'],
  'tricep pushdown': ['triceps'],
  'close grip bench': ['triceps', 'chest'],

  // Legs
  'squats': ['quadriceps', 'glutes'],
  'leg press': ['quadriceps', 'glutes'],
  'lunges': ['quadriceps', 'glutes'],
  'leg extension': ['quadriceps'],
  'leg curls': ['hamstrings'],
  'calf raises': ['calves'],
  'hip thrust': ['glutes', 'hamstrings'],

  // Core
  'plank': ['abs'],
  'crunches': ['abs'],
  'sit ups': ['abs'],
  'russian twists': ['abs'],
  'leg raises': ['abs'],
  'hanging knee raises': ['abs'],
  'knee raises': ['abs'],

  // Compound movements
  'burpees': ['chest', 'quadriceps', 'abs', 'shoulders'],
  'mountain climbers': ['abs', 'quadriceps', 'shoulders'],
  'thrusters': ['shoulders', 'quadriceps', 'glutes']
};

/**
 * Map exercise name to muscle groups using fuzzy matching
 */
function mapExerciseToMuscleGroups(exerciseName: string): string[] {
  const searchName = exerciseName.toLowerCase();
  
  // First try exact matches
  for (const [exerciseKey, muscles] of Object.entries(EXERCISE_TO_MUSCLE_MAPPING)) {
    if (searchName.includes(exerciseKey) || exerciseKey.includes(searchName)) {
      return muscles;
    }
  }
  
  // If no match found, try to infer from common exercise patterns
  if (searchName.includes('press') && (searchName.includes('bench') || searchName.includes('chest'))) {
    return ['chest', 'triceps', 'shoulders'];
  }
  if (searchName.includes('pull') || searchName.includes('row')) {
    return ['back', 'biceps'];
  }
  if (searchName.includes('squat') || searchName.includes('leg')) {
    return ['quadriceps', 'glutes'];
  }
  if (searchName.includes('curl') && searchName.includes('bicep')) {
    return ['biceps'];
  }
  if (searchName.includes('press') && searchName.includes('shoulder')) {
    return ['shoulders', 'triceps'];
  }
  
  // Default fallback - return empty array if no mapping found
  console.warn(`No muscle mapping found for exercise: ${exerciseName}`);
  return [];
}

/**
 * Calculate muscle recovery states from workout sessions
 */
function calculateMuscleRecoveryFromWorkouts(workouts: UnifiedWorkoutSession[]) {
  const muscleGroups = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps',
    'quadriceps', 'hamstrings', 'glutes', 'calves', 'abs'
  ];
  
  const recoveryStates = muscleGroups.map(muscleGroup => {
    // Find workouts that targeted this muscle group
    const relevantWorkouts = workouts.filter(workout => 
      workout.exercises.some(exercise => {
        // First check if muscleGroups field exists and has data
        if (exercise.muscleGroups && exercise.muscleGroups.length > 0) {
          return exercise.muscleGroups.some(mg => mg.toLowerCase().includes(muscleGroup));
        }
        
        // Fall back to exercise name mapping
        const mappedMuscles = mapExerciseToMuscleGroups(exercise.exerciseName);
        return mappedMuscles.some(muscle => muscle.toLowerCase().includes(muscleGroup));
      })
    ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    if (relevantWorkouts.length === 0) {
      // No recent workouts = undertrained
      return {
        muscleGroup,
        lastWorkoutDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        workoutIntensity: 0,
        currentFatiguePercentage: 5, // Very low baseline
        recoveryStatus: 'undertrained' as const,
        daysUntilOptimal: 0
      };
    }
    
    const lastWorkout = relevantWorkouts[0];
    const hoursSinceWorkout = (Date.now() - new Date(lastWorkout.startTime).getTime()) / (1000 * 60 * 60);
    
    // Calculate intensity based on total volume for this muscle group
    const muscleVolume = lastWorkout.exercises
      .filter(ex => {
        if (ex.muscleGroups && ex.muscleGroups.length > 0) {
          return ex.muscleGroups.some(mg => mg.toLowerCase().includes(muscleGroup));
        }
        const mappedMuscles = mapExerciseToMuscleGroups(ex.exerciseName);
        return mappedMuscles.some(muscle => muscle.toLowerCase().includes(muscleGroup));
      })
      .reduce((sum, ex) => sum + ex.sets.reduce((setSum, set) => setSum + set.volume, 0), 0);
    
    const intensity = Math.min(1, muscleVolume / 5000); // Normalize to 0-1 scale
    
    // Calculate fatigue using exponential decay (recovery follows a more realistic curve)
    const baseRecoveryHours = 48; // 48 hours base recovery
    const recoveryTimeWithIntensity = baseRecoveryHours * (1 + intensity * 0.5); // Less aggressive intensity scaling
    const recoveryProgress = Math.max(0, 1 - Math.exp(-hoursSinceWorkout / (recoveryTimeWithIntensity * 0.6)));
    const fatiguePercentage = Math.max(0, 100 * (1 - recoveryProgress));
    
    // Determine recovery status with more nuanced thresholds
    let recoveryStatus: 'overworked' | 'optimal' | 'undertrained';
    if (fatiguePercentage >= 75) {
      recoveryStatus = 'overworked';
    } else if (fatiguePercentage >= 20 && fatiguePercentage < 75) {
      recoveryStatus = 'optimal';
    } else {
      recoveryStatus = 'undertrained';
    }
    
    // Calculate days until optimal (more conservative estimate)
    const daysUntilOptimal = fatiguePercentage > 75 
      ? Math.ceil((recoveryTimeWithIntensity * 0.6 * Math.log(1 / (1 - 0.75)) - hoursSinceWorkout) / 24)
      : 0;
    
    return {
      muscleGroup,
      lastWorkoutDate: new Date(lastWorkout.startTime),
      workoutIntensity: Math.round(intensity * 100) / 100,
      currentFatiguePercentage: Math.round(fatiguePercentage),
      recoveryStatus,
      daysUntilOptimal: Math.max(0, Math.round(daysUntilOptimal))
    };
  });
  
  return recoveryStates;
}

/**
 * Calculate exercise progress from workout sessions
 */
function calculateExerciseProgressFromWorkouts(workouts: UnifiedWorkoutSession[], targetExercise?: string) {
  const exerciseData = new Map<string, {
    dates: string[];
    maxWeights: number[];
    totalVolumes: number[];
    progressPercentage: number;
  }>();
  
  // Process each workout
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      const exerciseName = exercise.exerciseName;
      
      // Skip if filtering by specific exercise and this doesn't match
      if (targetExercise && !exerciseName.toLowerCase().includes(targetExercise.toLowerCase())) {
        return;
      }
      
      if (!exerciseData.has(exerciseName)) {
        exerciseData.set(exerciseName, {
          dates: [],
          maxWeights: [],
          totalVolumes: [],
          progressPercentage: 0
        });
      }
      
      const data = exerciseData.get(exerciseName)!;
      data.dates.push(workout.startTime);
      
      // Calculate max weight and total volume for this session
      const maxWeight = Math.max(...exercise.sets.map(set => set.weight));
      const totalVolume = exercise.sets.reduce((sum, set) => sum + set.volume, 0);
      
      data.maxWeights.push(maxWeight);
      data.totalVolumes.push(totalVolume);
    });
  });
  
  // Calculate progress percentages
  exerciseData.forEach((data, exerciseName) => {
    if (data.maxWeights.length >= 2) {
      const firstMax = data.maxWeights[0];
      const lastMax = data.maxWeights[data.maxWeights.length - 1];
      data.progressPercentage = firstMax > 0 ? ((lastMax - firstMax) / firstMax) * 100 : 0;
    }
  });
  
  // Convert to array and sort by progress
  const exerciseProgress = Array.from(exerciseData.entries()).map(([exerciseName, data]) => ({
    exerciseName,
    ...data,
    progressPercentage: Math.round(data.progressPercentage * 10) / 10 // Round to 1 decimal
  })).sort((a, b) => b.progressPercentage - a.progressPercentage);
  
  return {
    exercises: exerciseProgress,
    totalExercises: exerciseProgress.length,
    avgProgressPercentage: exerciseProgress.length > 0 
      ? exerciseProgress.reduce((sum, ex) => sum + ex.progressPercentage, 0) / exerciseProgress.length 
      : 0
  };
}

export default router;