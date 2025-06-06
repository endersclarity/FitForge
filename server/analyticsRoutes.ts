import { Router } from "express";
import { authenticateToken } from "./auth-middleware";
import { storage } from "./storageAdapter";
import { MUSCLE_GROUPS } from "./database/exercise-schema";
import { z } from "zod";

const router = Router();

// ============================================================================
// ANALYTICS DATA TYPES & VALIDATION
// ============================================================================

const WorkoutVolumeQuerySchema = z.object({
  timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
  groupBy: z.enum(["day", "week", "month"]).default("week"),
  muscleGroup: z.enum(["chest", "back", "legs", "shoulders", "arms", "core"]).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default(20)
});

const ExerciseProgressQuerySchema = z.object({
  timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("90d"),
  muscleGroup: z.enum(["chest", "back", "legs", "shoulders", "arms", "core"]).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(10)
});

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Simple in-memory cache with TTL
class AnalyticsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, customTtl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTtl || this.TTL_MS
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  generateKey(userId: string, endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${userId}:${endpoint}:${sortedParams}`;
  }
}

const analyticsCache = new AnalyticsCache();

// ============================================================================
// ANALYTICS CALCULATION FUNCTIONS
// ============================================================================

class AnalyticsService {
  private getTimeRangeDates(timeRange: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    return { startDate, endDate };
  }

  private getMuscleGroupMuscles(muscleGroup: string): string[] {
    const muscleMap: Record<string, string[]> = {
      chest: MUSCLE_GROUPS.CHEST,
      back: MUSCLE_GROUPS.BACK,
      legs: MUSCLE_GROUPS.LEGS,
      shoulders: MUSCLE_GROUPS.SHOULDERS,
      arms: MUSCLE_GROUPS.ARMS,
      core: MUSCLE_GROUPS.CORE
    };
    
    return muscleMap[muscleGroup] || [];
  }

  private exerciseMatchesMuscleGroup(exercise: any, muscleGroup?: string): boolean {
    if (!muscleGroup) return true;
    
    const targetMuscles = this.getMuscleGroupMuscles(muscleGroup);
    if (targetMuscles.length === 0) return true;
    
    // Simple muscle group matching based on exercise name
    // In a real implementation, this would use the exercise database
    const exerciseName = exercise.exerciseName.toLowerCase();
    
    switch (muscleGroup) {
      case "chest":
        return exerciseName.includes("bench") || exerciseName.includes("push") || exerciseName.includes("chest") || exerciseName.includes("fly");
      case "back":
        return exerciseName.includes("row") || exerciseName.includes("pull") || exerciseName.includes("lat") || exerciseName.includes("deadlift");
      case "legs":
        return exerciseName.includes("squat") || exerciseName.includes("leg") || exerciseName.includes("lunge") || exerciseName.includes("calf");
      case "shoulders":
        return exerciseName.includes("shoulder") || exerciseName.includes("press") || exerciseName.includes("raise") || exerciseName.includes("deltoid");
      case "arms":
        return exerciseName.includes("curl") || exerciseName.includes("tricep") || exerciseName.includes("bicep") || exerciseName.includes("arm");
      case "core":
        return exerciseName.includes("abs") || exerciseName.includes("core") || exerciseName.includes("plank") || exerciseName.includes("crunch");
      default:
        return true;
    }
  }

  private groupWorkoutsByPeriod(
    workouts: any[], 
    groupBy: "day" | "week" | "month"
  ): Map<string, any[]> {
    const grouped = new Map<string, any[]>();
    
    workouts.forEach(workout => {
      const date = new Date(workout.startTime);
      let key: string;
      
      switch (groupBy) {
        case "day":
          key = date.toISOString().split('T')[0];
          break;
        case "week":
          // Get the Monday of the week
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay() + 1);
          key = weekStart.toISOString().split('T')[0];
          break;
        case "month":
          // Get the first day of the month
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(workout);
    });
    
    return grouped;
  }

  async getWorkoutVolumeData(
    userId: number, 
    timeRange: string,
    groupBy: "day" | "week" | "month",
    muscleGroup?: string,
    page: number = 1,
    limit: number = 20
  ) {
    const { startDate, endDate } = this.getTimeRangeDates(timeRange);
    
    // Get workout sessions using StorageAdapter
    const workouts = await storage.getUserWorkoutHistory(userId, 1000);
    
    // Filter workouts by date range and muscle group
    let filteredWorkouts = workouts.filter(workout => {
      const workoutDate = new Date(workout.startTime);
      return workoutDate >= startDate && workoutDate <= endDate;
    });

    // Filter by muscle group if specified
    if (muscleGroup) {
      filteredWorkouts = filteredWorkouts.filter(workout => {
        return workout.exercises.some(exercise => 
          this.exerciseMatchesMuscleGroup(exercise, muscleGroup)
        );
      });
    }
    
    // Group workouts by period
    const groupedWorkouts = this.groupWorkoutsByPeriod(filteredWorkouts, groupBy);
    
    // Calculate volume data for each period
    const volumeData = Array.from(groupedWorkouts.entries()).map(([periodKey, periodWorkouts]) => {
      let totalVolume = 0;
      let muscleSpecificVolume = 0;
      
      periodWorkouts.forEach(workout => {
        totalVolume += workout.totalVolume || 0;
        
        if (muscleGroup) {
          // Calculate volume only for exercises in the target muscle group
          const relevantExercises = workout.exercises.filter(ex => 
            this.exerciseMatchesMuscleGroup(ex, muscleGroup)
          );
          muscleSpecificVolume += relevantExercises.reduce((sum, ex) => {
            return sum + (ex.sets || []).reduce((setSum, set) => setSum + (set.volume || set.weight * set.reps), 0);
          }, 0);
        }
      });
      
      const workoutCount = periodWorkouts.length;
      const averageVolume = workoutCount > 0 ? totalVolume / workoutCount : 0;
      
      const totalCalories = periodWorkouts.reduce((sum, workout) => {
        return sum + (workout.caloriesBurned || 0);
      }, 0);
      
      // Format the period label
      const date = new Date(periodKey);
      let periodLabel: string;
      switch (groupBy) {
        case "day":
          periodLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          break;
        case "week":
          periodLabel = `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          break;
        case "month":
          periodLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          break;
      }
      
      return {
        period: periodKey,
        periodLabel,
        totalVolume: Math.round(totalVolume),
        muscleSpecificVolume: muscleGroup ? Math.round(muscleSpecificVolume) : undefined,
        averageVolume: Math.round(averageVolume),
        workoutCount,
        totalCalories: Math.round(totalCalories)
      };
    });
    
    // Sort by period date
    volumeData.sort((a, b) => a.period.localeCompare(b.period));
    
    // Implement pagination
    const totalItems = volumeData.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedData = volumeData.slice(offset, offset + limit);
    
    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary: {
        totalPeriods: volumeData.length,
        totalWorkouts: volumeData.reduce((sum, item) => sum + item.workoutCount, 0),
        totalVolume: volumeData.reduce((sum, item) => sum + item.totalVolume, 0),
        totalCalories: volumeData.reduce((sum, item) => sum + item.totalCalories, 0),
        averageVolumePerPeriod: volumeData.length > 0 
          ? Math.round(volumeData.reduce((sum, item) => sum + item.totalVolume, 0) / volumeData.length)
          : 0,
        muscleGroup: muscleGroup || null
      }
    };
  }

  async getExerciseProgressData(
    userId: number, 
    exerciseId: string, 
    timeRange: string,
    muscleGroup?: string,
    page: number = 1,
    limit: number = 10
  ) {
    const { startDate, endDate } = this.getTimeRangeDates(timeRange);
    
    // Get workout sessions using StorageAdapter
    const workouts = await storage.getUserWorkoutHistory(userId, 1000);
    
    // Filter workouts by date range and find exercises with the specified ID
    const exerciseProgressions: Array<{
      date: string;
      maxWeight: number;
      maxReps: number;
      totalVolume: number;
      setCount: number;
      averageWeight: number;
      averageReps: number;
    }> = [];
    
    let exerciseName = '';
    
    workouts.forEach(workout => {
      const workoutDate = new Date(workout.startTime);
      if (workoutDate < startDate || workoutDate > endDate) return;
      
      const exercise = workout.exercises.find(ex => 
        ex.exerciseId.toString() === exerciseId.toString()
      );
      
      if (exercise) {
        // Check muscle group filter
        if (muscleGroup && !this.exerciseMatchesMuscleGroup(exercise, muscleGroup)) {
          return;
        }
        
        if (!exerciseName) {
          exerciseName = exercise.exerciseName;
        }
        
        const sets = exercise.sets || [];
        if (sets.length > 0) {
          const weights = sets.map(set => set.weight);
          const reps = sets.map(set => set.reps);
          const volumes = sets.map(set => set.volume || (set.weight * set.reps));
          
          exerciseProgressions.push({
            date: workout.startTime.toISOString().split('T')[0],
            maxWeight: Math.max(...weights),
            maxReps: Math.max(...reps),
            totalVolume: volumes.reduce((sum, vol) => sum + vol, 0),
            setCount: sets.length,
            averageWeight: Math.round((weights.reduce((sum, w) => sum + w, 0) / weights.length) * 10) / 10,
            averageReps: Math.round((reps.reduce((sum, r) => sum + r, 0) / reps.length) * 10) / 10
          });
        }
      }
    });
    
    // Sort by date
    exerciseProgressions.sort((a, b) => a.date.localeCompare(b.date));
    
    // Implement pagination
    const totalItems = exerciseProgressions.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedProgressions = exerciseProgressions.slice(offset, offset + limit);
    
    // Calculate progression metrics
    const progression = {
      exerciseId,
      exerciseName,
      totalSessions: exerciseProgressions.length,
      dateRange: {
        start: exerciseProgressions.length > 0 ? exerciseProgressions[0].date : null,
        end: exerciseProgressions.length > 0 ? exerciseProgressions[exerciseProgressions.length - 1].date : null
      },
      progressions: paginatedProgressions,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary: exerciseProgressions.length > 0 ? {
        initialMaxWeight: exerciseProgressions[0].maxWeight,
        currentMaxWeight: exerciseProgressions[exerciseProgressions.length - 1].maxWeight,
        weightImprovement: exerciseProgressions[exerciseProgressions.length - 1].maxWeight - exerciseProgressions[0].maxWeight,
        weightImprovementPercentage: exerciseProgressions[0].maxWeight > 0 
          ? Math.round(((exerciseProgressions[exerciseProgressions.length - 1].maxWeight - exerciseProgressions[0].maxWeight) / exerciseProgressions[0].maxWeight) * 100 * 10) / 10
          : 0,
        totalVolumeProgression: exerciseProgressions.reduce((sum, session) => sum + session.totalVolume, 0),
        averageVolumePerSession: Math.round(exerciseProgressions.reduce((sum, session) => sum + session.totalVolume, 0) / exerciseProgressions.length),
        peakWeight: Math.max(...exerciseProgressions.map(p => p.maxWeight)),
        peakReps: Math.max(...exerciseProgressions.map(p => p.maxReps)),
        muscleGroup: muscleGroup || null
      } : null
    };
    
    return progression;
  }

  async getAllExercisesProgress(
    userId: number,
    timeRange: string,
    muscleGroup?: string,
    page: number = 1,
    limit: number = 10
  ) {
    const { startDate, endDate } = this.getTimeRangeDates(timeRange);
    
    // Get workout sessions using StorageAdapter
    const workouts = await storage.getUserWorkoutHistory(userId, 1000);
    
    // Collect all unique exercises
    const exerciseMap = new Map<string, {
      exerciseId: string;
      exerciseName: string;
      sessions: number;
      lastPerformed: string;
      totalVolume: number;
      maxWeight: number;
    }>();
    
    workouts.forEach(workout => {
      const workoutDate = new Date(workout.startTime);
      if (workoutDate < startDate || workoutDate > endDate) return;
      
      workout.exercises.forEach(exercise => {
        // Check muscle group filter
        if (muscleGroup && !this.exerciseMatchesMuscleGroup(exercise, muscleGroup)) {
          return;
        }
        
        const key = exercise.exerciseId.toString();
        const sets = exercise.sets || [];
        
        if (sets.length > 0) {
          const sessionVolume = sets.reduce((sum, set) => sum + (set.volume || set.weight * set.reps), 0);
          const sessionMaxWeight = Math.max(...sets.map(set => set.weight));
          
          if (exerciseMap.has(key)) {
            const existing = exerciseMap.get(key)!;
            existing.sessions += 1;
            existing.totalVolume += sessionVolume;
            existing.maxWeight = Math.max(existing.maxWeight, sessionMaxWeight);
            if (workout.startTime > existing.lastPerformed) {
              existing.lastPerformed = workout.startTime.toISOString();
            }
          } else {
            exerciseMap.set(key, {
              exerciseId: exercise.exerciseId.toString(),
              exerciseName: exercise.exerciseName,
              sessions: 1,
              lastPerformed: workout.startTime.toISOString(),
              totalVolume: sessionVolume,
              maxWeight: sessionMaxWeight
            });
          }
        }
      });
    });
    
    // Convert to array and sort by total volume
    const exercises = Array.from(exerciseMap.values())
      .sort((a, b) => b.totalVolume - a.totalVolume);
    
    // Implement pagination
    const totalItems = exercises.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedExercises = exercises.slice(offset, offset + limit);
    
    return {
      exercises: paginatedExercises,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary: {
        totalExercises: exercises.length,
        timeRange,
        muscleGroup: muscleGroup || null
      }
    };
  }
}

const analyticsService = new AnalyticsService();

// ============================================================================
// ANALYTICS API ROUTES
// ============================================================================

// GET /api/analytics/workout-volume - Returns volume data grouped by day/week/month
router.get("/workout-volume", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const query = WorkoutVolumeQuerySchema.parse(req.query);
    
    // Generate cache key
    const cacheKey = analyticsCache.generateKey(
      userId.toString(), 
      'workout-volume', 
      query
    );
    
    // Check cache first
    const cachedData = analyticsCache.get(cacheKey);
    if (cachedData) {
      return res.json({
        ...cachedData,
        cached: true,
        cacheTime: new Date().toISOString()
      });
    }
    
    const volumeData = await analyticsService.getWorkoutVolumeData(
      userId,
      query.timeRange,
      query.groupBy,
      query.muscleGroup,
      query.page,
      query.limit
    );
    
    const response = {
      ...volumeData,
      timeRange: query.timeRange,
      groupBy: query.groupBy,
      muscleGroup: query.muscleGroup,
      generatedAt: new Date().toISOString(),
      cached: false
    };
    
    // Cache the response
    analyticsCache.set(cacheKey, response);
    
    res.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid query parameters", 
        errors: error.errors 
      });
    }
    console.error("Error fetching workout volume data:", error);
    res.status(500).json({ 
      message: error.message || "Failed to fetch workout volume data" 
    });
  }
});

// GET /api/analytics/exercise-progress/:exerciseId - Returns progression data for specific exercise
router.get("/exercise-progress/:exerciseId", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const exerciseId = req.params.exerciseId;
    const query = ExerciseProgressQuerySchema.parse(req.query);
    
    if (!exerciseId) {
      return res.status(400).json({ message: "Exercise ID is required" });
    }
    
    // Generate cache key
    const cacheKey = analyticsCache.generateKey(
      userId.toString(), 
      `exercise-progress-${exerciseId}`, 
      query
    );
    
    // Check cache first
    const cachedData = analyticsCache.get(cacheKey);
    if (cachedData) {
      return res.json({
        ...cachedData,
        cached: true,
        cacheTime: new Date().toISOString()
      });
    }
    
    const progressData = await analyticsService.getExerciseProgressData(
      userId,
      exerciseId,
      query.timeRange,
      query.muscleGroup,
      query.page,
      query.limit
    );
    
    const response = {
      ...progressData,
      timeRange: query.timeRange,
      muscleGroup: query.muscleGroup,
      generatedAt: new Date().toISOString(),
      cached: false
    };
    
    // Cache the response
    analyticsCache.set(cacheKey, response);
    
    res.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid query parameters", 
        errors: error.errors 
      });
    }
    console.error("Error fetching exercise progress data:", error);
    res.status(500).json({ 
      message: error.message || "Failed to fetch exercise progress data" 
    });
  }
});

// GET /api/analytics/exercises - Returns all exercises with progress data
router.get("/exercises", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const query = ExerciseProgressQuerySchema.parse(req.query);
    
    // Generate cache key
    const cacheKey = analyticsCache.generateKey(
      userId.toString(), 
      'exercises-progress', 
      query
    );
    
    // Check cache first
    const cachedData = analyticsCache.get(cacheKey);
    if (cachedData) {
      return res.json({
        ...cachedData,
        cached: true,
        cacheTime: new Date().toISOString()
      });
    }
    
    const exercisesData = await analyticsService.getAllExercisesProgress(
      userId,
      query.timeRange,
      query.muscleGroup,
      query.page,
      query.limit
    );
    
    const response = {
      ...exercisesData,
      timeRange: query.timeRange,
      muscleGroup: query.muscleGroup,
      generatedAt: new Date().toISOString(),
      cached: false
    };
    
    // Cache the response
    analyticsCache.set(cacheKey, response);
    
    res.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid query parameters", 
        errors: error.errors 
      });
    }
    console.error("Error fetching exercises progress data:", error);
    res.status(500).json({ 
      message: error.message || "Failed to fetch exercises progress data" 
    });
  }
});

export default router;