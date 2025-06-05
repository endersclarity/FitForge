import { Router } from "express";
import { authenticateToken } from "./auth-middleware";
import { UnifiedFileStorage } from "./unifiedFileStorage";
import { z } from "zod";

const router = Router();

// Initialize unified file storage for analytics
const unifiedStorage = new UnifiedFileStorage();
unifiedStorage.initialize().catch(console.error);

// ============================================================================
// PROGRESS ANALYTICS DATA TYPES & VALIDATION
// ============================================================================

interface WorkoutTrendData {
  date: string;
  totalVolume: number;
  averageFormScore: number;
  workoutCount: number;
  duration: number;
  caloriesBurned: number;
}

interface ExerciseProgressData {
  exerciseName: string;
  exerciseId: string;
  progressPercentage: number;
  maxWeight: number;
  maxReps: number;
  totalSessions: number;
  lastPerformed: string;
  volumeProgression: Array<{
    date: string;
    weight: number;
    reps: number;
    volume: number;
  }>;
}

interface BodyCompositionData {
  date: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    arms?: number;
    thighs?: number;
  };
}

interface ProgressSummary {
  timeframe: string;
  totalWorkouts: number;
  totalVolume: number;
  totalCalories: number;
  averageFormScore: number;
  personalRecords: number;
  consistencyScore: number;
  improvementPercentage: number;
}

const AnalyticsQuerySchema = z.object({
  timeframe: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  metric: z.enum(['volume', 'strength', 'endurance', 'consistency', 'form']).optional(),
  exerciseIds: z.string().optional(), // Comma-separated exercise IDs
  groupBy: z.enum(['day', 'week', 'month']).default('week'),
  includeBodyComposition: z.boolean().default(false)
});

// ============================================================================
// ANALYTICS CALCULATION FUNCTIONS
// ============================================================================

class ProgressAnalyticsService {
  private getTimeframeDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0); // All time
    }
  }

  private groupDataByPeriod(data: any[], groupBy: string, dateField: string): Map<string, any[]> {
    const grouped = new Map<string, any[]>();
    
    data.forEach(item => {
      const date = new Date(item[dateField]);
      let key: string;
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    });
    
    return grouped;
  }

  async getWorkoutTrends(userId: string, timeframe: string, groupBy: string): Promise<WorkoutTrendData[]> {
    const cutoffDate = this.getTimeframeDate(timeframe);
    
    const sessions = await unifiedStorage.getUnifiedWorkoutSessions(userId, {
      from: cutoffDate.toISOString(),
      sessionType: 'completed'
    });
    
    const groupedSessions = this.groupDataByPeriod(sessions, groupBy, 'startTime');
    const trendData: WorkoutTrendData[] = [];
    
    for (const [period, periodSessions] of groupedSessions.entries()) {
      const totalVolume = periodSessions.reduce((sum: number, session: any) => sum + (session.totalVolume || 0), 0);
      const totalDuration = periodSessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0);
      const totalCalories = periodSessions.reduce((sum: number, session: any) => sum + (session.caloriesBurned || 0), 0);
      
      const formScores = periodSessions
        .map((session: any) => session.formScore)
        .filter((score: any) => score && score > 0);
      const avgFormScore = formScores.length > 0 
        ? formScores.reduce((sum: number, score: any) => sum + score, 0) / formScores.length 
        : 0;
      
      trendData.push({
        date: period,
        totalVolume: Math.round(totalVolume),
        averageFormScore: Math.round(avgFormScore * 10) / 10,
        workoutCount: periodSessions.length,
        duration: Math.round(totalDuration),
        caloriesBurned: Math.round(totalCalories)
      });
    }
    
    return trendData.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getExerciseProgress(userId: string, timeframe: string, exerciseIds?: string[]): Promise<ExerciseProgressData[]> {
    const cutoffDate = this.getTimeframeDate(timeframe);
    
    const sessions = await unifiedStorage.getUnifiedWorkoutSessions(userId, {
      from: cutoffDate.toISOString(),
      sessionType: 'completed'
    });
    
    const exerciseData = new Map<string, {
      exerciseName: string;
      sessions: Array<{
        date: string;
        maxWeight: number;
        maxReps: number;
        volume: number;
      }>;
    }>();
    
    // Process sessions to extract exercise data
    sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        const exerciseKey = `${exercise.exerciseId}-${exercise.exerciseName}`;
        
        // Filter by specific exercise IDs if provided
        if (exerciseIds && !exerciseIds.includes(exercise.exerciseId.toString())) {
          return;
        }
        
        if (!exerciseData.has(exerciseKey)) {
          exerciseData.set(exerciseKey, {
            exerciseName: exercise.exerciseName,
            sessions: []
          });
        }
        
        const sets = exercise.sets || [];
        if (sets.length > 0) {
          const maxWeight = Math.max(...sets.map(set => set.weight));
          const maxReps = Math.max(...sets.map(set => set.reps));
          const totalVolume = sets.reduce((sum, set) => sum + set.volume, 0);
          
          exerciseData.get(exerciseKey)!.sessions.push({
            date: session.startTime,
            maxWeight,
            maxReps,
            volume: totalVolume
          });
        }
      });
    });
    
    // Calculate progress for each exercise
    const progressData: ExerciseProgressData[] = [];
    
    for (const [exerciseKey, data] of exerciseData.entries()) {
      const [exerciseIdStr, exerciseName] = exerciseKey.split('-', 2);
      const exerciseId = exerciseIdStr;
      
      if (data.sessions.length === 0) continue;
      
      // Sort sessions by date
      data.sessions.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const firstSession = data.sessions[0];
      const lastSession = data.sessions[data.sessions.length - 1];
      
      // Calculate progress percentage based on max weight improvement
      const weightProgress = firstSession.maxWeight > 0 
        ? ((lastSession.maxWeight - firstSession.maxWeight) / firstSession.maxWeight) * 100 
        : 0;
      
      progressData.push({
        exerciseName: data.exerciseName,
        exerciseId,
        progressPercentage: Math.round(weightProgress * 10) / 10,
        maxWeight: lastSession.maxWeight,
        maxReps: lastSession.maxReps,
        totalSessions: data.sessions.length,
        lastPerformed: lastSession.date,
        volumeProgression: data.sessions.map(session => ({
          date: session.date,
          weight: session.maxWeight,
          reps: session.maxReps,
          volume: session.volume
        }))
      });
    }
    
    return progressData.sort((a, b) => b.progressPercentage - a.progressPercentage);
  }

  async getBodyCompositionData(userId: string, timeframe: string): Promise<BodyCompositionData[]> {
    // For now, simulate body composition data
    // In a real implementation, this would pull from body stats storage
    const cutoffDate = this.getTimeframeDate(timeframe);
    const now = new Date();
    const bodyCompositionData: BodyCompositionData[] = [];
    
    // Generate sample data points over the timeframe
    const daysDiff = Math.ceil((now.getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24));
    const dataPoints = Math.min(10, Math.max(3, Math.floor(daysDiff / 7))); // One data point per week
    
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date(cutoffDate.getTime() + (i * (daysDiff / dataPoints) * 24 * 60 * 60 * 1000));
      
      bodyCompositionData.push({
        date: date.toISOString().split('T')[0],
        weight: 180 - (i * 0.5), // Simulate gradual weight loss
        bodyFat: 15 - (i * 0.2), // Simulate body fat reduction
        muscleMass: 145 + (i * 0.3), // Simulate muscle gain
        measurements: {
          chest: 40 + (i * 0.1),
          waist: 32 - (i * 0.1),
          arms: 15 + (i * 0.05),
          thighs: 24 + (i * 0.05)
        }
      });
    }
    
    return bodyCompositionData;
  }

  async getProgressSummary(userId: string, timeframe: string): Promise<ProgressSummary> {
    const cutoffDate = this.getTimeframeDate(timeframe);
    
    const sessions = await unifiedStorage.getUnifiedWorkoutSessions(userId, {
      from: cutoffDate.toISOString(),
      sessionType: 'completed'
    });
    
    const totalWorkouts = sessions.length;
    const totalVolume = sessions.reduce((sum, session) => sum + (session.totalVolume || 0), 0);
    const totalCalories = sessions.reduce((sum, session) => sum + (session.caloriesBurned || 0), 0);
    
    const formScores = sessions
      .map((session: any) => session.formScore)
      .filter((score: any) => score && score > 0);
    const averageFormScore = formScores.length > 0 
      ? formScores.reduce((sum, score) => sum + score, 0) / formScores.length 
      : 0;
    
    // Calculate personal records (simplified)
    const exerciseMaxes = new Map<string, number>();
    sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          const currentMax = exerciseMaxes.get(exercise.exerciseName) || 0;
          if (set.weight > currentMax) {
            exerciseMaxes.set(exercise.exerciseName, set.weight);
          }
        });
      });
    });
    
    // Calculate consistency score (percentage of days with workouts)
    const timeframeDays = Math.ceil((Date.now() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24));
    const workoutDays = new Set(sessions.map(s => s.startTime.split('T')[0])).size;
    const consistencyScore = timeframeDays > 0 ? (workoutDays / timeframeDays) * 100 : 0;
    
    // Calculate improvement percentage (simplified - based on total volume trend)
    const halfPoint = Math.floor(sessions.length / 2);
    const firstHalfVolume = sessions.slice(0, halfPoint).reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    const secondHalfVolume = sessions.slice(halfPoint).reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    
    const improvementPercentage = firstHalfVolume > 0 
      ? ((secondHalfVolume - firstHalfVolume) / firstHalfVolume) * 100 
      : 0;
    
    return {
      timeframe,
      totalWorkouts,
      totalVolume: Math.round(totalVolume),
      totalCalories: Math.round(totalCalories),
      averageFormScore: Math.round(averageFormScore * 10) / 10,
      personalRecords: exerciseMaxes.size,
      consistencyScore: Math.round(consistencyScore * 10) / 10,
      improvementPercentage: Math.round(improvementPercentage * 10) / 10
    };
  }
}

const analyticsService = new ProgressAnalyticsService();

// ============================================================================
// PROGRESS ANALYTICS API ROUTES
// ============================================================================

// GET /api/progress/analytics - Comprehensive progress analytics
router.get("/analytics", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const query = AnalyticsQuerySchema.parse(req.query);
    
    const [
      workoutTrends,
      exerciseProgress,
      progressSummary,
      bodyComposition
    ] = await Promise.all([
      analyticsService.getWorkoutTrends(userId, query.timeframe, query.groupBy),
      analyticsService.getExerciseProgress(userId, query.timeframe, query.exerciseIds?.split(',')),
      analyticsService.getProgressSummary(userId, query.timeframe),
      query.includeBodyComposition 
        ? analyticsService.getBodyCompositionData(userId, query.timeframe)
        : []
    ]);
    
    res.json({
      timeframe: query.timeframe,
      groupBy: query.groupBy,
      workoutTrends,
      exerciseProgress: exerciseProgress.slice(0, 10), // Top 10 exercises
      progressSummary,
      bodyComposition,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid analytics query", errors: error.errors });
    }
    console.error("Error fetching progress analytics:", error);
    res.status(500).json({ message: error.message || "Failed to fetch progress analytics" });
  }
});

// GET /api/progress/analytics/summary - Quick summary for dashboard
router.get("/analytics/summary", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const timeframe = (req.query.timeframe as string) || '30d';
    
    const summary = await analyticsService.getProgressSummary(userId, timeframe);
    res.json(summary);
  } catch (error: any) {
    console.error("Error fetching analytics summary:", error);
    res.status(500).json({ message: error.message || "Failed to fetch analytics summary" });
  }
});

// GET /api/progress/analytics/trends - Workout trends data
router.get("/analytics/trends", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const timeframe = (req.query.timeframe as string) || '30d';
    const groupBy = (req.query.groupBy as string) || 'week';
    
    const trends = await analyticsService.getWorkoutTrends(userId, timeframe, groupBy);
    res.json({ trends, timeframe, groupBy });
  } catch (error: any) {
    console.error("Error fetching workout trends:", error);
    res.status(500).json({ message: error.message || "Failed to fetch workout trends" });
  }
});

// GET /api/progress/analytics/exercises - Exercise progress data
router.get("/analytics/exercises", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const timeframe = (req.query.timeframe as string) || '90d';
    const exerciseIds = req.query.exerciseIds as string;
    
    const exerciseProgress = await analyticsService.getExerciseProgress(
      userId, 
      timeframe, 
      exerciseIds?.split(',')
    );
    
    res.json({ 
      exerciseProgress, 
      timeframe,
      totalExercises: exerciseProgress.length 
    });
  } catch (error: any) {
    console.error("Error fetching exercise progress:", error);
    res.status(500).json({ message: error.message || "Failed to fetch exercise progress" });
  }
});

// GET /api/progress/analytics/body-composition - Body composition trends
router.get("/analytics/body-composition", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const timeframe = (req.query.timeframe as string) || '90d';
    
    const bodyComposition = await analyticsService.getBodyCompositionData(userId, timeframe);
    res.json({ bodyComposition, timeframe });
  } catch (error: any) {
    console.error("Error fetching body composition data:", error);
    res.status(500).json({ message: error.message || "Failed to fetch body composition data" });
  }
});

// GET /api/progress/analytics/personal-records - Personal records tracking
router.get("/analytics/personal-records", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    
    const sessions = await unifiedStorage.getUnifiedWorkoutSessions(userId, { 
      sessionType: 'completed',
      limit: 100 
    });
    
    const personalRecords = new Map<string, {
      exerciseName: string;
      maxWeight: number;
      maxReps: number;
      achievedDate: string;
      session: string;
    }>();
    
    sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          const key = exercise.exerciseName;
          const currentRecord = personalRecords.get(key);
          
          if (!currentRecord || set.weight > currentRecord.maxWeight) {
            personalRecords.set(key, {
              exerciseName: exercise.exerciseName,
              maxWeight: set.weight,
              maxReps: set.reps,
              achievedDate: session.startTime,
              session: session.id
            });
          }
        });
      });
    });
    
    const records = Array.from(personalRecords.values())
      .sort((a, b) => new Date(b.achievedDate).getTime() - new Date(a.achievedDate).getTime());
    
    res.json({
      personalRecords: records,
      totalRecords: records.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error fetching personal records:", error);
    res.status(500).json({ message: error.message || "Failed to fetch personal records" });
  }
});

export default router;