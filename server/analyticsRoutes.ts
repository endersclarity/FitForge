import { Router } from "express";
import { authenticateToken } from "./auth-middleware";
import { UnifiedFileStorage } from "./unifiedFileStorage";
import { UnifiedWorkoutSession, WorkoutExercise, SetData } from "../shared/unified-storage-schema";
import { z } from "zod";

const router = Router();

// Initialize unified file storage
const unifiedStorage = new UnifiedFileStorage();
unifiedStorage.initialize().catch(console.error);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AnalyticsQuerySchema = z.object({
  timeRange: z.enum(['1W', '1M', '3M', '6M', '1Y', 'ALL']).default('3M'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  workoutType: z.string().optional(),
  exerciseName: z.string().optional(),
  muscleGroup: z.string().optional()
});

const MetricsRequestSchema = z.object({
  metrics: z.array(z.enum([
    'volume', 'frequency', 'intensity', 'progression', 
    'muscleDistribution', 'personalRecords', 'consistency'
  ])).optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('week')
});

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

// GET /api/analytics/overview - High-level workout analytics dashboard
router.get("/overview", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { timeRange } = AnalyticsQuerySchema.parse(req.query);
    
    const timeFilter = getTimeFilter(timeRange);
    const userWorkoutData = await unifiedStorage.getUserWorkoutData(userId);
    const sessions = filterSessionsByTime(userWorkoutData.sessions, timeFilter);
    const completedSessions = sessions.filter(s => s.sessionType === 'completed');
    
    if (completedSessions.length === 0) {
      return res.json({
        message: "No workout data found for the specified time range",
        data: getEmptyOverviewData(),
        timeRange,
        totalSessions: 0
      });
    }

    // Calculate comprehensive overview metrics
    const overview = {
      summary: calculateWorkoutSummary(completedSessions),
      frequency: calculateWorkoutFrequency(completedSessions, timeFilter),
      volume: calculateVolumeMetrics(completedSessions),
      progression: calculateProgressionMetrics(completedSessions),
      muscleDistribution: calculateMuscleGroupDistribution(completedSessions),
      personalRecords: calculatePersonalRecords(completedSessions),
      consistency: calculateConsistencyMetrics(completedSessions, timeFilter),
      recentTrends: calculateRecentTrends(completedSessions),
      timeRange,
      lastUpdated: new Date().toISOString()
    };

    res.json(overview);
  } catch (error: any) {
    console.error("Error fetching analytics overview:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to fetch analytics overview" });
  }
});

// GET /api/analytics/volume - Detailed volume analysis and trends
router.get("/volume", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { timeRange, exerciseName, muscleGroup, groupBy } = {
      ...AnalyticsQuerySchema.parse(req.query),
      ...MetricsRequestSchema.parse(req.query)
    };
    
    const timeFilter = getTimeFilter(timeRange);
    const userWorkoutData = await unifiedStorage.getUserWorkoutData(userId);
    let sessions = filterSessionsByTime(userWorkoutData.sessions, timeFilter);
    sessions = sessions.filter(s => s.sessionType === 'completed');
    
    // Apply additional filters
    if (exerciseName) {
      sessions = sessions.filter(s => 
        s.exercises.some(ex => ex.exerciseName.toLowerCase().includes(exerciseName.toLowerCase()))
      );
    }
    
    if (muscleGroup) {
      sessions = sessions.filter(s =>
        s.exercises.some(ex => 
          ex.muscleGroups?.some(mg => mg.toLowerCase().includes(muscleGroup.toLowerCase()))
        )
      );
    }

    const volumeAnalysis = {
      totalVolume: sessions.reduce((sum, s) => sum + s.totalVolume, 0),
      averageVolumePerSession: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.totalVolume, 0) / sessions.length : 0,
      volumeTrends: calculateVolumeTrends(sessions, groupBy),
      exerciseVolumeBreakdown: calculateExerciseVolumeBreakdown(sessions),
      muscleGroupVolume: calculateMuscleGroupVolume(sessions),
      volumeProgression: calculateVolumeProgression(sessions),
      personalBests: findVolumePersonalBests(sessions),
      timeRange,
      filters: { exerciseName, muscleGroup, groupBy },
      totalSessions: sessions.length
    };

    res.json(volumeAnalysis);
  } catch (error: any) {
    console.error("Error fetching volume analytics:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to fetch volume analytics" });
  }
});

// GET /api/analytics/frequency - Workout frequency and scheduling patterns
router.get("/frequency", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { timeRange, workoutType } = AnalyticsQuerySchema.parse(req.query);
    
    const timeFilter = getTimeFilter(timeRange);
    const userWorkoutData = await unifiedStorage.getUserWorkoutData(userId);
    let sessions = filterSessionsByTime(userWorkoutData.sessions, timeFilter);
    sessions = sessions.filter(s => s.sessionType === 'completed');
    
    if (workoutType) {
      sessions = sessions.filter(s => s.workoutType.toLowerCase().includes(workoutType.toLowerCase()));
    }

    const frequencyAnalysis = {
      totalWorkouts: sessions.length,
      averageWorkoutsPerWeek: calculateAverageWorkoutsPerWeek(sessions, timeFilter),
      workoutsByDay: calculateWorkoutsByDayOfWeek(sessions),
      workoutsByHour: calculateWorkoutsByHour(sessions),
      workoutTypes: calculateWorkoutTypeFrequency(sessions),
      streak: calculateWorkoutStreak(sessions),
      consistency: calculateFrequencyConsistency(sessions, timeFilter),
      restDays: calculateRestDayPatterns(sessions),
      timeRange,
      filters: { workoutType }
    };

    res.json(frequencyAnalysis);
  } catch (error: any) {
    console.error("Error fetching frequency analytics:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to fetch frequency analytics" });
  }
});

// GET /api/analytics/progression - Exercise progression and strength gains
router.get("/progression", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { timeRange, exerciseName } = AnalyticsQuerySchema.parse(req.query);
    
    const timeFilter = getTimeFilter(timeRange);
    const userWorkoutData = await unifiedStorage.getUserWorkoutData(userId);
    let sessions = filterSessionsByTime(userWorkoutData.sessions, timeFilter);
    sessions = sessions.filter(s => s.sessionType === 'completed');

    const progressionAnalysis = {
      overallProgression: calculateOverallProgression(sessions),
      exerciseProgression: calculateExerciseProgression(sessions, exerciseName),
      strengthGains: calculateStrengthGains(sessions),
      personalRecords: extractPersonalRecords(sessions),
      plateauDetection: detectProgressionPlateaus(sessions),
      recommendedProgressions: generateProgressionRecommendations(sessions),
      oneRepMaxEstimates: calculateOneRepMaxEstimates(sessions),
      timeRange,
      filters: { exerciseName }
    };

    res.json(progressionAnalysis);
  } catch (error: any) {
    console.error("Error fetching progression analytics:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to fetch progression analytics" });
  }
});

// GET /api/analytics/muscle-groups - Muscle group distribution and balance
router.get("/muscle-groups", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { timeRange } = AnalyticsQuerySchema.parse(req.query);
    
    const timeFilter = getTimeFilter(timeRange);
    const userWorkoutData = await unifiedStorage.getUserWorkoutData(userId);
    const sessions = filterSessionsByTime(userWorkoutData.sessions, timeFilter);
    const completedSessions = sessions.filter(s => s.sessionType === 'completed');

    const muscleGroupAnalysis = {
      distribution: calculateMuscleGroupDistribution(completedSessions),
      volumeByMuscleGroup: calculateMuscleGroupVolume(completedSessions),
      balanceScore: calculateMuscleBalance(completedSessions),
      recoveryStatus: calculateMuscleRecoveryStatus(completedSessions),
      recommendations: generateMuscleGroupRecommendations(completedSessions),
      heatMapData: generateMuscleHeatMapData(completedSessions),
      timeRange,
      totalSessions: completedSessions.length
    };

    res.json(muscleGroupAnalysis);
  } catch (error: any) {
    console.error("Error fetching muscle group analytics:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to fetch muscle group analytics" });
  }
});

// GET /api/analytics/performance - Performance metrics and efficiency
router.get("/performance", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { timeRange } = AnalyticsQuerySchema.parse(req.query);
    
    const timeFilter = getTimeFilter(timeRange);
    const userWorkoutData = await unifiedStorage.getUserWorkoutData(userId);
    const sessions = filterSessionsByTime(userWorkoutData.sessions, timeFilter);
    const completedSessions = sessions.filter(s => s.sessionType === 'completed');

    const performanceAnalysis = {
      efficiency: calculateWorkoutEfficiency(completedSessions),
      intensity: calculateIntensityMetrics(completedSessions),
      formQuality: calculateFormQualityMetrics(completedSessions),
      endurance: calculateEnduranceMetrics(completedSessions),
      recovery: calculateRecoveryMetrics(completedSessions),
      motivation: calculateMotivationMetrics(completedSessions),
      timeRange,
      totalSessions: completedSessions.length
    };

    res.json(performanceAnalysis);
  } catch (error: any) {
    console.error("Error fetching performance analytics:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to fetch performance analytics" });
  }
});

// GET /api/analytics/comparisons - Period-over-period comparisons
router.get("/comparisons", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { timeRange } = AnalyticsQuerySchema.parse(req.query);
    
    const userWorkoutData = await unifiedStorage.getUserWorkoutData(userId);
    const allSessions = userWorkoutData.sessions.filter(s => s.sessionType === 'completed');
    
    const currentPeriod = getTimeFilter(timeRange);
    const previousPeriod = getPreviousPeriodFilter(timeRange);
    
    const currentSessions = filterSessionsByTime(allSessions, currentPeriod);
    const previousSessions = filterSessionsByTime(allSessions, previousPeriod);

    const comparisons = {
      summary: {
        current: calculateWorkoutSummary(currentSessions),
        previous: calculateWorkoutSummary(previousSessions),
        changes: calculatePeriodChanges(currentSessions, previousSessions)
      },
      volume: {
        current: calculateVolumeMetrics(currentSessions),
        previous: calculateVolumeMetrics(previousSessions),
        change: calculateVolumeChange(currentSessions, previousSessions)
      },
      frequency: {
        current: calculateWorkoutFrequency(currentSessions, currentPeriod),
        previous: calculateWorkoutFrequency(previousSessions, previousPeriod),
        change: calculateFrequencyChange(currentSessions, previousSessions)
      },
      progression: {
        current: calculateProgressionMetrics(currentSessions),
        previous: calculateProgressionMetrics(previousSessions),
        improvement: calculateProgressionImprovement(currentSessions, previousSessions)
      },
      timeRange,
      periods: {
        current: currentPeriod,
        previous: previousPeriod
      }
    };

    res.json(comparisons);
  } catch (error: any) {
    console.error("Error fetching comparison analytics:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    res.status(500).json({ message: error.message || "Failed to fetch comparison analytics" });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTimeFilter(timeRange: string) {
  const now = new Date();
  const filters = {
    startDate: new Date(),
    endDate: now
  };

  switch (timeRange) {
    case '1W':
      filters.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '1M':
      filters.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3M':
      filters.startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '6M':
      filters.startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case '1Y':
      filters.startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'ALL':
      filters.startDate = new Date(2020, 0, 1); // Far past date
      break;
  }

  return filters;
}

function getPreviousPeriodFilter(timeRange: string) {
  const current = getTimeFilter(timeRange);
  const duration = current.endDate.getTime() - current.startDate.getTime();
  
  return {
    startDate: new Date(current.startDate.getTime() - duration),
    endDate: current.startDate
  };
}

function filterSessionsByTime(sessions: UnifiedWorkoutSession[], timeFilter: { startDate: Date; endDate: Date }) {
  return sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return sessionDate >= timeFilter.startDate && sessionDate <= timeFilter.endDate;
  });
}

function calculateWorkoutSummary(sessions: UnifiedWorkoutSession[]) {
  if (sessions.length === 0) {
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      totalDuration: 0,
      averageVolume: 0,
      averageDuration: 0,
      totalCalories: 0
    };
  }

  const totalVolume = sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
  const totalDuration = sessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0);
  const totalCalories = sessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0);

  return {
    totalWorkouts: sessions.length,
    totalVolume: Math.round(totalVolume),
    totalDuration: Math.round(totalDuration),
    averageVolume: Math.round(totalVolume / sessions.length),
    averageDuration: Math.round(totalDuration / sessions.length),
    totalCalories: Math.round(totalCalories)
  };
}

function calculateWorkoutFrequency(sessions: UnifiedWorkoutSession[], timeFilter: { startDate: Date; endDate: Date }) {
  const daysInPeriod = Math.ceil((timeFilter.endDate.getTime() - timeFilter.startDate.getTime()) / (24 * 60 * 60 * 1000));
  const weeksInPeriod = daysInPeriod / 7;
  
  return {
    workoutsPerWeek: sessions.length / weeksInPeriod,
    workoutsPerDay: sessions.length / daysInPeriod,
    totalDays: daysInPeriod,
    activeDays: new Set(sessions.map(s => new Date(s.startTime).toDateString())).size
  };
}

function calculateVolumeMetrics(sessions: UnifiedWorkoutSession[]) {
  if (sessions.length === 0) return { total: 0, average: 0, trend: 'stable', growth: 0 };

  const volumes = sessions.map(s => s.totalVolume || 0);
  const total = volumes.reduce((sum, v) => sum + v, 0);
  const average = total / volumes.length;
  
  // Calculate trend (simple linear regression)
  const trend = calculateTrend(volumes);
  const growth = sessions.length > 1 ? ((volumes[volumes.length - 1] - volumes[0]) / volumes[0]) * 100 : 0;

  return {
    total: Math.round(total),
    average: Math.round(average),
    trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
    growth: Math.round(growth * 10) / 10
  };
}

function calculateProgressionMetrics(sessions: UnifiedWorkoutSession[]) {
  const allPRs = sessions.flatMap(s => s.personalRecords || []);
  const strengthGains = calculateAverageStrengthGain(sessions);
  
  return {
    personalRecords: allPRs.length,
    averageStrengthGain: strengthGains,
    progressingExercises: calculateProgressingExercises(sessions),
    plateauedExercises: calculatePlateauedExercises(sessions)
  };
}

function calculateMuscleGroupDistribution(sessions: UnifiedWorkoutSession[]) {
  const muscleGroupCounts = new Map<string, number>();
  const muscleGroupVolume = new Map<string, number>();

  sessions.forEach(session => {
    session.exercises.forEach(exercise => {
      const exerciseVolume = exercise.sets.reduce((sum, set) => sum + set.volume, 0);
      
      if (exercise.muscleGroups && exercise.muscleGroups.length > 0) {
        exercise.muscleGroups.forEach(muscle => {
          const normalizedMuscle = muscle.toLowerCase();
          muscleGroupCounts.set(normalizedMuscle, (muscleGroupCounts.get(normalizedMuscle) || 0) + 1);
          muscleGroupVolume.set(normalizedMuscle, (muscleGroupVolume.get(normalizedMuscle) || 0) + exerciseVolume);
        });
      } else {
        // Fallback to exercise name mapping
        const mappedMuscles = mapExerciseToMuscleGroups(exercise.exerciseName);
        mappedMuscles.forEach(muscle => {
          muscleGroupCounts.set(muscle, (muscleGroupCounts.get(muscle) || 0) + 1);
          muscleGroupVolume.set(muscle, (muscleGroupVolume.get(muscle) || 0) + exerciseVolume);
        });
      }
    });
  });

  const distribution = Array.from(muscleGroupCounts.entries()).map(([muscle, count]) => ({
    muscleGroup: muscle,
    frequency: count,
    volume: muscleGroupVolume.get(muscle) || 0,
    percentage: Math.round((count / sessions.length) * 100)
  })).sort((a, b) => b.frequency - a.frequency);

  return distribution;
}

function calculatePersonalRecords(sessions: UnifiedWorkoutSession[]) {
  const prs = sessions.flatMap(s => s.personalRecords || []);
  const prsByType = prs.reduce((acc, pr) => {
    acc[pr.recordType] = (acc[pr.recordType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: prs.length,
    byType: prsByType,
    recent: prs.slice(-5).reverse()
  };
}

function calculateConsistencyMetrics(sessions: UnifiedWorkoutSession[], timeFilter: { startDate: Date; endDate: Date }) {
  const daysInPeriod = Math.ceil((timeFilter.endDate.getTime() - timeFilter.startDate.getTime()) / (24 * 60 * 60 * 1000));
  const workoutDates = sessions.map(s => new Date(s.startTime).toDateString());
  const uniqueWorkoutDays = new Set(workoutDates).size;
  
  const consistencyScore = Math.round((uniqueWorkoutDays / daysInPeriod) * 100);
  const averageGapDays = calculateAverageGapBetweenWorkouts(sessions);
  
  return {
    score: Math.min(consistencyScore, 100),
    activeDays: uniqueWorkoutDays,
    totalDays: daysInPeriod,
    averageGapDays: Math.round(averageGapDays * 10) / 10,
    streak: calculateCurrentStreak(sessions)
  };
}

function calculateRecentTrends(sessions: UnifiedWorkoutSession[]) {
  const recent = sessions.slice(-10); // Last 10 workouts
  if (recent.length < 2) return null;

  const volumeTrend = calculateTrend(recent.map(s => s.totalVolume || 0));
  const durationTrend = calculateTrend(recent.map(s => s.totalDuration || 0));
  const frequencyTrend = calculateFrequencyTrend(recent);

  return {
    volume: volumeTrend > 0.1 ? 'increasing' : volumeTrend < -0.1 ? 'decreasing' : 'stable',
    duration: durationTrend > 0.1 ? 'increasing' : durationTrend < -0.1 ? 'decreasing' : 'stable',
    frequency: frequencyTrend
  };
}

function getEmptyOverviewData() {
  return {
    summary: { totalWorkouts: 0, totalVolume: 0, totalDuration: 0, averageVolume: 0, averageDuration: 0, totalCalories: 0 },
    frequency: { workoutsPerWeek: 0, workoutsPerDay: 0, totalDays: 0, activeDays: 0 },
    volume: { total: 0, average: 0, trend: 'stable', growth: 0 },
    progression: { personalRecords: 0, averageStrengthGain: 0, progressingExercises: 0, plateauedExercises: 0 },
    muscleDistribution: [],
    personalRecords: { total: 0, byType: {}, recent: [] },
    consistency: { score: 0, activeDays: 0, totalDays: 0, averageGapDays: 0, streak: 0 },
    recentTrends: null
  };
}

// Additional helper functions for specific calculations...
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
}

function mapExerciseToMuscleGroups(exerciseName: string): string[] {
  const name = exerciseName.toLowerCase();
  
  // Exercise to muscle group mapping
  const mappings: Record<string, string[]> = {
    'bench': ['chest', 'triceps', 'shoulders'],
    'squat': ['quadriceps', 'glutes'],
    'deadlift': ['back', 'hamstrings', 'glutes'],
    'pull': ['back', 'biceps'],
    'row': ['back', 'biceps'],
    'press': ['shoulders', 'triceps'],
    'curl': ['biceps'],
    'extension': ['triceps'],
    'lunge': ['quadriceps', 'glutes'],
    'fly': ['chest'],
    'raise': ['shoulders'],
    'crunch': ['abs'],
    'plank': ['abs']
  };

  for (const [key, muscles] of Object.entries(mappings)) {
    if (name.includes(key)) {
      return muscles;
    }
  }

  return ['other'];
}

// Detailed implementations for volume analysis
function calculateVolumeTrends(sessions: UnifiedWorkoutSession[], groupBy: string) {
  if (sessions.length === 0) return [];

  const timeGroups = new Map<string, UnifiedWorkoutSession[]>();
  
  sessions.forEach(session => {
    const date = new Date(session.startTime);
    let groupKey: string;
    
    switch (groupBy) {
      case 'day':
        groupKey = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        groupKey = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        groupKey = date.toISOString().split('T')[0];
    }
    
    if (!timeGroups.has(groupKey)) {
      timeGroups.set(groupKey, []);
    }
    timeGroups.get(groupKey)!.push(session);
  });

  return Array.from(timeGroups.entries()).map(([period, sessions]) => ({
    period,
    totalVolume: sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0),
    averageVolume: sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0) / sessions.length,
    sessionCount: sessions.length,
    date: period
  })).sort((a, b) => a.date.localeCompare(b.date));
}

function calculateExerciseVolumeBreakdown(sessions: UnifiedWorkoutSession[]) {
  const exerciseVolumes = new Map<string, { totalVolume: number; sessionCount: number; sets: number }>();
  
  sessions.forEach(session => {
    session.exercises.forEach(exercise => {
      const volume = exercise.sets.reduce((sum, set) => sum + set.volume, 0);
      const currentData = exerciseVolumes.get(exercise.exerciseName) || { totalVolume: 0, sessionCount: 0, sets: 0 };
      
      exerciseVolumes.set(exercise.exerciseName, {
        totalVolume: currentData.totalVolume + volume,
        sessionCount: currentData.sessionCount + 1,
        sets: currentData.sets + exercise.sets.length
      });
    });
  });

  return Array.from(exerciseVolumes.entries()).map(([exerciseName, data]) => ({
    exerciseName,
    totalVolume: Math.round(data.totalVolume),
    averageVolume: Math.round(data.totalVolume / data.sessionCount),
    totalSets: data.sets,
    frequency: data.sessionCount,
    volumePercentage: 0 // Will be calculated after total is known
  })).sort((a, b) => b.totalVolume - a.totalVolume);
}

function calculateMuscleGroupVolume(sessions: UnifiedWorkoutSession[]) {
  const muscleVolumes = new Map<string, number>();
  
  sessions.forEach(session => {
    session.exercises.forEach(exercise => {
      const exerciseVolume = exercise.sets.reduce((sum, set) => sum + set.volume, 0);
      
      const muscleGroups = exercise.muscleGroups?.length 
        ? exercise.muscleGroups 
        : mapExerciseToMuscleGroups(exercise.exerciseName);
      
      muscleGroups.forEach(muscle => {
        const normalizedMuscle = muscle.toLowerCase();
        // Distribute volume evenly among muscle groups for the exercise
        const distributedVolume = exerciseVolume / muscleGroups.length;
        muscleVolumes.set(normalizedMuscle, (muscleVolumes.get(normalizedMuscle) || 0) + distributedVolume);
      });
    });
  });

  const totalVolume = Array.from(muscleVolumes.values()).reduce((sum, vol) => sum + vol, 0);
  
  return Array.from(muscleVolumes.entries()).map(([muscleGroup, volume]) => ({
    muscleGroup,
    totalVolume: Math.round(volume),
    percentage: totalVolume > 0 ? Math.round((volume / totalVolume) * 100) : 0
  })).sort((a, b) => b.totalVolume - a.totalVolume);
}

function calculateVolumeProgression(sessions: UnifiedWorkoutSession[]) {
  if (sessions.length < 2) return [];

  const sortedSessions = sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  return sortedSessions.map((session, index) => {
    const previousSession = index > 0 ? sortedSessions[index - 1] : null;
    const volumeChange = previousSession 
      ? ((session.totalVolume || 0) - (previousSession.totalVolume || 0)) / (previousSession.totalVolume || 1) * 100
      : 0;

    return {
      date: session.startTime,
      volume: session.totalVolume || 0,
      change: Math.round(volumeChange * 10) / 10,
      movingAverage: index >= 2 
        ? Math.round(sortedSessions.slice(Math.max(0, index - 2), index + 1)
            .reduce((sum, s) => sum + (s.totalVolume || 0), 0) / 3)
        : session.totalVolume || 0
    };
  });
}

function findVolumePersonalBests(sessions: UnifiedWorkoutSession[]) {
  const exerciseBests = new Map<string, { volume: number; date: string; weight: number; reps: number }>();
  
  sessions.forEach(session => {
    session.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        const currentBest = exerciseBests.get(exercise.exerciseName);
        
        if (!currentBest || set.volume > currentBest.volume) {
          exerciseBests.set(exercise.exerciseName, {
            volume: set.volume,
            date: session.startTime,
            weight: set.weight,
            reps: set.reps
          });
        }
      });
    });
  });

  return Array.from(exerciseBests.entries()).map(([exerciseName, best]) => ({
    exerciseName,
    bestVolume: best.volume,
    bestWeight: best.weight,
    bestReps: best.reps,
    achievedDate: best.date
  })).sort((a, b) => b.bestVolume - a.bestVolume);
}

function calculateAverageWorkoutsPerWeek(sessions: UnifiedWorkoutSession[], timeFilter: any) {
  if (sessions.length === 0) return 0;
  
  const daysInPeriod = Math.ceil((timeFilter.endDate.getTime() - timeFilter.startDate.getTime()) / (24 * 60 * 60 * 1000));
  const weeksInPeriod = daysInPeriod / 7;
  
  return Math.round((sessions.length / weeksInPeriod) * 10) / 10;
}

function calculateWorkoutsByDayOfWeek(sessions: UnifiedWorkoutSession[]) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = new Array(7).fill(0);
  
  sessions.forEach(session => {
    const dayOfWeek = new Date(session.startTime).getDay();
    dayCounts[dayOfWeek]++;
  });

  return dayNames.reduce((acc, day, index) => {
    acc[day] = {
      count: dayCounts[index],
      percentage: sessions.length > 0 ? Math.round((dayCounts[index] / sessions.length) * 100) : 0
    };
    return acc;
  }, {} as Record<string, { count: number; percentage: number }>);
}

function calculateWorkoutsByHour(sessions: UnifiedWorkoutSession[]) {
  const hourCounts = new Array(24).fill(0);
  
  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    hourCounts[hour]++;
  });

  const result: Record<string, number> = {};
  hourCounts.forEach((count, hour) => {
    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
    result[timeSlot] = count;
  });

  return result;
}

function calculateWorkoutTypeFrequency(sessions: UnifiedWorkoutSession[]) {
  const typeCounts = new Map<string, number>();
  
  sessions.forEach(session => {
    const workoutType = session.workoutType || 'Unknown';
    typeCounts.set(workoutType, (typeCounts.get(workoutType) || 0) + 1);
  });

  const total = sessions.length;
  
  return Array.from(typeCounts.entries()).map(([type, count]) => ({
    workoutType: type,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0
  })).sort((a, b) => b.count - a.count);
}

function calculateWorkoutStreak(sessions: UnifiedWorkoutSession[]) {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  const sortedDates = sessions
    .map(s => new Date(s.startTime).toDateString())
    .sort()
    .filter((date, index, array) => array.indexOf(date) === index); // Remove duplicates

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Calculate longest streak
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const previousDate = new Date(sortedDates[i - 1]);
    const daysDiff = Math.round((currentDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000));

    if (daysDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  const lastWorkoutDate = sortedDates[sortedDates.length - 1];

  if (lastWorkoutDate === today || lastWorkoutDate === yesterday) {
    currentStreak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const currentDate = new Date(sortedDates[i + 1]);
      const previousDate = new Date(sortedDates[i]);
      const daysDiff = Math.round((currentDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000));

      if (daysDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

function calculateFrequencyConsistency(sessions: UnifiedWorkoutSession[], timeFilter: any) {
  if (sessions.length === 0) return { score: 0, variance: 0 };

  const daysInPeriod = Math.ceil((timeFilter.endDate.getTime() - timeFilter.startDate.getTime()) / (24 * 60 * 60 * 1000));
  const weeksInPeriod = Math.floor(daysInPeriod / 7);
  
  if (weeksInPeriod === 0) return { score: 0, variance: 0 };

  // Group workouts by week
  const weeklyWorkouts = new Array(weeksInPeriod).fill(0);
  
  sessions.forEach(session => {
    const sessionDate = new Date(session.startTime);
    const daysSinceStart = Math.floor((sessionDate.getTime() - timeFilter.startDate.getTime()) / (24 * 60 * 60 * 1000));
    const weekIndex = Math.floor(daysSinceStart / 7);
    
    if (weekIndex >= 0 && weekIndex < weeksInPeriod) {
      weeklyWorkouts[weekIndex]++;
    }
  });

  // Calculate variance
  const mean = weeklyWorkouts.reduce((sum, count) => sum + count, 0) / weeksInPeriod;
  const variance = weeklyWorkouts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / weeksInPeriod;
  
  // Consistency score (lower variance = higher consistency)
  const consistencyScore = Math.max(0, 100 - (variance * 10));

  return {
    score: Math.round(consistencyScore),
    variance: Math.round(variance * 100) / 100,
    weeklyWorkouts
  };
}

function calculateRestDayPatterns(sessions: UnifiedWorkoutSession[]) {
  if (sessions.length < 2) return { averageRestDays: 0, patterns: [] };

  const sortedSessions = sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const restDays: number[] = [];

  for (let i = 1; i < sortedSessions.length; i++) {
    const currentDate = new Date(sortedSessions[i].startTime);
    const previousDate = new Date(sortedSessions[i - 1].startTime);
    const daysBetween = Math.round((currentDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000)) - 1;
    
    if (daysBetween >= 0) {
      restDays.push(daysBetween);
    }
  }

  const averageRestDays = restDays.length > 0 ? restDays.reduce((sum, days) => sum + days, 0) / restDays.length : 0;
  
  // Analyze patterns
  const restDayFrequency = new Map<number, number>();
  restDays.forEach(days => {
    restDayFrequency.set(days, (restDayFrequency.get(days) || 0) + 1);
  });

  const patterns = Array.from(restDayFrequency.entries()).map(([days, frequency]) => ({
    restDays: days,
    frequency,
    percentage: Math.round((frequency / restDays.length) * 100)
  })).sort((a, b) => b.frequency - a.frequency);

  return {
    averageRestDays: Math.round(averageRestDays * 10) / 10,
    patterns: patterns.slice(0, 5), // Top 5 most common patterns
    totalGaps: restDays.length
  };
}

function calculateOverallProgression(sessions: UnifiedWorkoutSession[]) {
  if (sessions.length < 2) return { trend: 'insufficient_data', growth: 0, confidence: 0 };

  const sortedSessions = sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  // Calculate volume progression
  const volumes = sortedSessions.map(s => s.totalVolume || 0);
  const volumeTrend = calculateTrend(volumes);
  const volumeGrowth = volumes.length > 1 ? ((volumes[volumes.length - 1] - volumes[0]) / volumes[0]) * 100 : 0;
  
  // Calculate strength progression (max weights)
  const maxWeights = sortedSessions.map(session => {
    const allSets = session.exercises.flatMap(ex => ex.sets);
    return allSets.length > 0 ? Math.max(...allSets.map(set => set.weight)) : 0;
  });
  const strengthTrend = calculateTrend(maxWeights);
  const strengthGrowth = maxWeights.length > 1 ? ((maxWeights[maxWeights.length - 1] - maxWeights[0]) / maxWeights[0]) * 100 : 0;

  return {
    volumeProgression: {
      trend: volumeTrend > 0.1 ? 'increasing' : volumeTrend < -0.1 ? 'decreasing' : 'stable',
      growth: Math.round(volumeGrowth * 10) / 10,
      confidence: Math.min(95, sessions.length * 5) // Higher confidence with more sessions
    },
    strengthProgression: {
      trend: strengthTrend > 0.1 ? 'increasing' : strengthTrend < -0.1 ? 'decreasing' : 'stable',
      growth: Math.round(strengthGrowth * 10) / 10,
      confidence: Math.min(95, sessions.length * 5)
    },
    overallScore: calculateProgressionScore(volumeTrend, strengthTrend, sessions.length)
  };
}

function calculateExerciseProgression(sessions: UnifiedWorkoutSession[], exerciseName?: string) {
  const exerciseData = new Map<string, Array<{ date: string; maxWeight: number; maxVolume: number; maxReps: number }>>();
  
  sessions.forEach(session => {
    session.exercises.forEach(exercise => {
      if (exerciseName && !exercise.exerciseName.toLowerCase().includes(exerciseName.toLowerCase())) {
        return;
      }
      
      if (!exerciseData.has(exercise.exerciseName)) {
        exerciseData.set(exercise.exerciseName, []);
      }
      
      const maxWeight = Math.max(...exercise.sets.map(set => set.weight));
      const maxVolume = Math.max(...exercise.sets.map(set => set.volume));
      const maxReps = Math.max(...exercise.sets.map(set => set.reps));
      
      exerciseData.get(exercise.exerciseName)!.push({
        date: session.startTime,
        maxWeight,
        maxVolume,
        maxReps
      });
    });
  });

  return Array.from(exerciseData.entries()).map(([exerciseName, progressionData]) => {
    const sortedData = progressionData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (sortedData.length < 2) {
      return {
        exerciseName,
        progression: 'insufficient_data',
        weightGrowth: 0,
        volumeGrowth: 0,
        sessions: sortedData.length
      };
    }

    const firstSession = sortedData[0];
    const lastSession = sortedData[sortedData.length - 1];
    
    const weightGrowth = firstSession.maxWeight > 0 
      ? ((lastSession.maxWeight - firstSession.maxWeight) / firstSession.maxWeight) * 100 
      : 0;
    
    const volumeGrowth = firstSession.maxVolume > 0 
      ? ((lastSession.maxVolume - firstSession.maxVolume) / firstSession.maxVolume) * 100 
      : 0;

    return {
      exerciseName,
      progression: weightGrowth > 5 ? 'strong' : weightGrowth > 0 ? 'moderate' : 'stagnant',
      weightGrowth: Math.round(weightGrowth * 10) / 10,
      volumeGrowth: Math.round(volumeGrowth * 10) / 10,
      sessions: sortedData.length,
      data: sortedData
    };
  }).sort((a, b) => b.weightGrowth - a.weightGrowth);
}

function calculateStrengthGains(sessions: UnifiedWorkoutSession[]) {
  const exerciseStrengthGains = new Map<string, { initial: number; current: number; peak: number }>();
  
  sessions.forEach(session => {
    session.exercises.forEach(exercise => {
      const maxWeight = Math.max(...exercise.sets.map(set => set.weight));
      const current = exerciseStrengthGains.get(exercise.exerciseName);
      
      if (!current) {
        exerciseStrengthGains.set(exercise.exerciseName, {
          initial: maxWeight,
          current: maxWeight,
          peak: maxWeight
        });
      } else {
        exerciseStrengthGains.set(exercise.exerciseName, {
          ...current,
          current: maxWeight,
          peak: Math.max(current.peak, maxWeight)
        });
      }
    });
  });

  const gains = Array.from(exerciseStrengthGains.entries()).map(([exerciseName, data]) => ({
    exerciseName,
    initialWeight: data.initial,
    currentWeight: data.current,
    peakWeight: data.peak,
    totalGain: data.current - data.initial,
    gainPercentage: data.initial > 0 ? ((data.current - data.initial) / data.initial) * 100 : 0
  })).filter(gain => gain.totalGain > 0).sort((a, b) => b.gainPercentage - a.gainPercentage);

  return {
    exercises: gains,
    averageGainPercentage: gains.length > 0 ? gains.reduce((sum, g) => sum + g.gainPercentage, 0) / gains.length : 0,
    totalExercisesImproved: gains.length
  };
}

function extractPersonalRecords(sessions: UnifiedWorkoutSession[]) {
  const allPRs = sessions.flatMap(session => 
    (session.personalRecords || []).map(pr => ({
      ...pr,
      date: session.startTime,
      sessionId: session.id
    }))
  );

  return allPRs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function detectProgressionPlateaus(sessions: UnifiedWorkoutSession[]) {
  const exerciseProgression = calculateExerciseProgression(sessions);
  const plateauThreshold = 5; // Less than 5% improvement in last 5 sessions
  
  return exerciseProgression.filter(exercise => {
    if (exercise.sessions < 5) return false;
    
    const recentSessions = exercise.data?.slice(-5) || [];
    if (recentSessions.length < 5) return false;
    
    const firstRecent = recentSessions[0];
    const lastRecent = recentSessions[recentSessions.length - 1];
    
    const recentGrowth = firstRecent.maxWeight > 0 
      ? ((lastRecent.maxWeight - firstRecent.maxWeight) / firstRecent.maxWeight) * 100 
      : 0;
    
    return Math.abs(recentGrowth) < plateauThreshold;
  }).map(exercise => ({
    exerciseName: exercise.exerciseName,
    plateauDuration: 5, // Simplified - could be more sophisticated
    lastImprovement: exercise.data?.[exercise.data.length - 1]?.date || '',
    recommendedAction: generatePlateauRecommendation(exercise.exerciseName)
  }));
}

function generateProgressionRecommendations(sessions: UnifiedWorkoutSession[]) {
  const plateaus = detectProgressionPlateaus(sessions);
  const strongProgressors = calculateExerciseProgression(sessions).filter(ex => ex.progression === 'strong');
  
  const recommendations = [];
  
  // Plateau recommendations
  plateaus.forEach(plateau => {
    recommendations.push({
      type: 'plateau_break',
      exercise: plateau.exerciseName,
      priority: 'high',
      recommendation: `Consider deload week or technique modification for ${plateau.exerciseName}`,
      reason: 'Detected strength plateau in recent sessions'
    });
  });
  
  // Volume recommendations
  const avgVolume = sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0) / sessions.length;
  if (avgVolume < 5000) {
    recommendations.push({
      type: 'volume_increase',
      exercise: 'overall',
      priority: 'medium',
      recommendation: 'Consider gradually increasing training volume',
      reason: 'Current volume may be insufficient for optimal progress'
    });
  }
  
  return recommendations.slice(0, 10); // Limit to top 10 recommendations
}

function calculateOneRepMaxEstimates(sessions: UnifiedWorkoutSession[]) {
  const exerciseMaxes = new Map<string, Array<{ weight: number; reps: number; date: string }>>();
  
  sessions.forEach(session => {
    session.exercises.forEach(exercise => {
      if (!exerciseMaxes.has(exercise.exerciseName)) {
        exerciseMaxes.set(exercise.exerciseName, []);
      }
      
      exercise.sets.forEach(set => {
        // Only include sets with significant weight and reasonable rep ranges for 1RM calculation
        if (set.weight > 0 && set.reps >= 1 && set.reps <= 15) {
          exerciseMaxes.get(exercise.exerciseName)!.push({
            weight: set.weight,
            reps: set.reps,
            date: session.startTime
          });
        }
      });
    });
  });

  return Array.from(exerciseMaxes.entries()).map(([exerciseName, sets]) => {
    if (sets.length === 0) return { exerciseName, estimatedMax: 0, confidence: 0 };
    
    // Calculate 1RM estimates using Brzycki formula: Weight / (1.0278 - (0.0278 * Reps))
    const estimatedMaxes = sets.map(set => {
      if (set.reps === 1) return set.weight;
      return set.weight / (1.0278 - (0.0278 * set.reps));
    });
    
    const maxEstimate = Math.max(...estimatedMaxes);
    const confidence = Math.min(95, sets.length * 2); // Higher confidence with more data points
    
    return {
      exerciseName,
      estimatedMax: Math.round(maxEstimate * 10) / 10,
      confidence,
      dataPoints: sets.length,
      lastTested: sets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date
    };
  }).filter(estimate => estimate.estimatedMax > 0).sort((a, b) => b.estimatedMax - a.estimatedMax);
}

function calculateMuscleBalance(sessions: UnifiedWorkoutSession[]) {
  // Implementation for muscle balance scoring
  return 0;
}

function calculateMuscleRecoveryStatus(sessions: UnifiedWorkoutSession[]) {
  // Implementation for muscle recovery status
  return {};
}

function generateMuscleGroupRecommendations(sessions: UnifiedWorkoutSession[]) {
  // Implementation for muscle group recommendations
  return [];
}

function generateMuscleHeatMapData(sessions: UnifiedWorkoutSession[]) {
  // Implementation for muscle heat map data
  return {};
}

function calculateWorkoutEfficiency(sessions: UnifiedWorkoutSession[]) {
  // Implementation for workout efficiency metrics
  return {};
}

function calculateIntensityMetrics(sessions: UnifiedWorkoutSession[]) {
  // Implementation for intensity calculations
  return {};
}

function calculateFormQualityMetrics(sessions: UnifiedWorkoutSession[]) {
  // Implementation for form quality analysis
  return {};
}

function calculateEnduranceMetrics(sessions: UnifiedWorkoutSession[]) {
  // Implementation for endurance metrics
  return {};
}

function calculateRecoveryMetrics(sessions: UnifiedWorkoutSession[]) {
  // Implementation for recovery metrics
  return {};
}

function calculateMotivationMetrics(sessions: UnifiedWorkoutSession[]) {
  // Implementation for motivation analysis
  return {};
}

function calculatePeriodChanges(current: UnifiedWorkoutSession[], previous: UnifiedWorkoutSession[]) {
  // Implementation for period-over-period changes
  return {};
}

function calculateVolumeChange(current: UnifiedWorkoutSession[], previous: UnifiedWorkoutSession[]) {
  // Implementation for volume change calculations
  return {};
}

function calculateFrequencyChange(current: UnifiedWorkoutSession[], previous: UnifiedWorkoutSession[]) {
  // Implementation for frequency change calculations
  return {};
}

function calculateProgressionImprovement(current: UnifiedWorkoutSession[], previous: UnifiedWorkoutSession[]) {
  // Implementation for progression improvement analysis
  return {};
}

function calculateAverageStrengthGain(sessions: UnifiedWorkoutSession[]) {
  // Implementation for average strength gain
  return 0;
}

function calculateProgressingExercises(sessions: UnifiedWorkoutSession[]) {
  // Implementation for progressing exercise count
  return 0;
}

function calculatePlateauedExercises(sessions: UnifiedWorkoutSession[]) {
  // Implementation for plateaued exercise count
  return 0;
}

function calculateAverageGapBetweenWorkouts(sessions: UnifiedWorkoutSession[]) {
  // Implementation for average gap calculation
  return 0;
}

function calculateCurrentStreak(sessions: UnifiedWorkoutSession[]) {
  // Implementation for current streak calculation
  return 0;
}

function calculateFrequencyTrend(sessions: UnifiedWorkoutSession[]) {
  if (sessions.length < 4) return 'stable';
  
  const recent = sessions.slice(-4);
  const earlier = sessions.slice(-8, -4);
  
  if (earlier.length === 0) return 'stable';
  
  const recentFreq = recent.length / 4;
  const earlierFreq = earlier.length / 4;
  
  const change = (recentFreq - earlierFreq) / earlierFreq;
  
  return change > 0.2 ? 'increasing' : change < -0.2 ? 'decreasing' : 'stable';
}

// Additional helper functions for comprehensive analytics
function calculateProgressionScore(volumeTrend: number, strengthTrend: number, sessionCount: number): number {
  let score = 50; // Base score
  
  // Volume contribution (40% of score)
  if (volumeTrend > 0.2) score += 20;
  else if (volumeTrend > 0.1) score += 10;
  else if (volumeTrend < -0.1) score -= 10;
  
  // Strength contribution (40% of score)
  if (strengthTrend > 0.2) score += 20;
  else if (strengthTrend > 0.1) score += 10;
  else if (strengthTrend < -0.1) score -= 10;
  
  // Consistency bonus (20% of score)
  if (sessionCount > 20) score += 10;
  else if (sessionCount > 10) score += 5;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function generatePlateauRecommendation(exerciseName: string): string {
  const recommendations = [
    'Try deload week (reduce weight by 10-20%)',
    'Focus on form and time under tension',
    'Add variation with different rep ranges',
    'Consider changing exercise angle or grip',
    'Increase frequency or reduce volume temporarily'
  ];
  
  // Simple hash to get consistent recommendation for same exercise
  const hash = exerciseName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return recommendations[hash % recommendations.length];
}

export default router;