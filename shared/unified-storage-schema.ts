/**
 * Unified Storage Schema for FitForge
 * 
 * This schema eliminates the dual storage architecture by providing
 * a single, comprehensive format that supports both:
 * 1. Real-time workout logging (set-by-set tracking)
 * 2. Progress display and analytics
 * 
 * Design Goals:
 * - Single source of truth for workout data
 * - Real-time set logging with immediate persistence
 * - Complete session context for progress analysis
 * - Eliminate need for data conversion layers
 * - Support progressive overload calculations
 * - Enable muscle activation heat maps
 */

import { z } from "zod";

/**
 * Core Set Data Structure
 * Used for both real-time logging and historical analysis
 */
export const SetDataSchema = z.object({
  setNumber: z.number().min(1),
  weight: z.number().min(0),
  reps: z.number().min(0),
  volume: z.number().min(0), // weight * reps, calculated on save
  timestamp: z.string().datetime(),
  formScore: z.number().min(1).max(10).optional(),
  rpe: z.number().min(1).max(10).optional(), // Rate of Perceived Exertion
  restTime: z.number().min(0).optional(), // seconds
  equipment: z.string().optional(),
  notes: z.string().optional(),
  isWarmup: z.boolean().default(false),
  isDropSet: z.boolean().default(false),
  isFailure: z.boolean().default(false)
});

/**
 * Exercise Data within a Workout Session
 * Supports both planned and executed exercises
 */
export const WorkoutExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  muscleGroups: z.array(z.string()).optional(), // For heat map integration
  category: z.enum(['strength', 'hypertrophy', 'endurance', 'mobility']).optional(),
  equipment: z.string().optional(),
  
  // Set data - both planned and executed
  sets: z.array(SetDataSchema),
  targetSets: z.number().min(1).optional(),
  targetReps: z.number().min(1).optional(),
  targetWeight: z.number().min(0).optional(),
  
  // Exercise-level metadata
  exerciseOrder: z.number().min(1), // Order within workout
  restTimeSeconds: z.number().min(0).default(60),
  formScore: z.number().min(1).max(10).optional(), // Average across sets
  personalRecord: z.boolean().default(false), // Did this exercise achieve a PR?
  
  // Progressive overload data
  progressiveOverload: z.object({
    previousBestWeight: z.number().optional(),
    previousBestVolume: z.number().optional(),
    recommendedWeight: z.number().optional(),
    recommendedReps: z.number().optional(),
    progressPercentage: z.number().optional() // % improvement from last session
  }).optional(),
  
  notes: z.string().optional()
});

/**
 * Complete Workout Session Schema
 * Single format that supports both active logging and historical analysis
 */
export const UnifiedWorkoutSessionSchema = z.object({
  // Session identity
  id: z.string().uuid(),
  userId: z.string(),
  sessionType: z.enum(['active', 'completed', 'abandoned']),
  
  // Temporal data
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  lastModified: z.string().datetime(),
  
  // Workout metadata
  workoutType: z.string(), // "ChestTriceps", "Legs", "Back", etc.
  workoutTemplateId: z.string().optional(),
  workoutName: z.string().optional(),
  
  // Exercise data
  exercises: z.array(WorkoutExerciseSchema),
  plannedExercises: z.array(z.string()).optional(), // Exercise names planned but not started
  
  // Session-level metrics
  totalVolume: z.number().min(0).default(0),
  totalDuration: z.number().min(0).default(0), // minutes
  caloriesBurned: z.number().min(0).default(0),
  averageFormScore: z.number().min(1).max(10).optional(),
  averageRPE: z.number().min(1).max(10).optional(),
  
  // User feedback
  rating: z.number().min(1).max(5).optional(),
  energyLevelBefore: z.number().min(1).max(10).optional(),
  energyLevelAfter: z.number().min(1).max(10).optional(),
  difficultyRating: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  
  // Achievement tracking
  personalRecords: z.array(z.object({
    exerciseName: z.string(),
    recordType: z.enum(['weight', 'reps', 'volume', 'one_rep_max']),
    previousValue: z.number(),
    newValue: z.number(),
    improvementPercentage: z.number()
  })).default([]),
  
  // Progress analytics
  progressMetrics: z.object({
    totalSets: z.number().min(0).default(0),
    totalExercises: z.number().min(0).default(0),
    volumeImprovement: z.number().optional(), // % vs previous similar workout
    consistencyScore: z.number().min(0).max(100).optional(),
    muscleGroupsTargeted: z.array(z.string()).default([])
  }).optional(),
  
  // Environmental data
  environment: z.object({
    location: z.string().optional(), // "Home Gym", "Commercial Gym", etc.
    temperature: z.number().optional(),
    humidity: z.number().optional(),
    equipmentAvailable: z.array(z.string()).default([])
  }).optional()
});

/**
 * Storage Container Schema
 * How unified sessions are stored per user
 */
export const UserWorkoutDataSchema = z.object({
  userId: z.string(),
  lastUpdated: z.string().datetime(),
  sessions: z.array(UnifiedWorkoutSessionSchema),
  
  // User-level aggregations for performance
  aggregations: z.object({
    totalWorkouts: z.number().min(0).default(0),
    totalVolume: z.number().min(0).default(0),
    totalCalories: z.number().min(0).default(0),
    totalDuration: z.number().min(0).default(0), // minutes
    currentStreak: z.number().min(0).default(0),
    longestStreak: z.number().min(0).default(0),
    averageWorkoutsPerWeek: z.number().min(0).default(0),
    lastWorkoutDate: z.string().datetime().optional(),
    favoriteWorkoutType: z.string().optional(),
    strongestMuscleGroups: z.array(z.string()).default([]),
    personalRecordCount: z.number().min(0).default(0)
  }).optional()
});

/**
 * Real-time Set Logging Event
 * Used for immediate persistence during workouts
 */
export const SetLogEventSchema = z.object({
  sessionId: z.string().uuid(),
  exerciseId: z.string(),
  exerciseName: z.string(),
  setData: SetDataSchema,
  timestamp: z.string().datetime(),
  userId: z.string()
});

/**
 * Session State Change Event
 * Used for tracking session lifecycle
 */
export const SessionEventSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string(),
  eventType: z.enum(['created', 'exercise_added', 'set_logged', 'completed', 'abandoned']),
  timestamp: z.string().datetime(),
  data: z.any().optional() // Additional event-specific data
});

// TypeScript types
export type SetData = z.infer<typeof SetDataSchema>;
export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>;
export type UnifiedWorkoutSession = z.infer<typeof UnifiedWorkoutSessionSchema>;
export type UserWorkoutData = z.infer<typeof UserWorkoutDataSchema>;
export type SetLogEvent = z.infer<typeof SetLogEventSchema>;
export type SessionEvent = z.infer<typeof SessionEventSchema>;

/**
 * Migration Helpers
 * Functions to convert from old formats to unified schema
 */

/**
 * Convert simple workout log to unified session
 */
export function convertWorkoutLogToSession(
  logs: Array<{timestamp: string, sessionId: string, workoutType: string, exerciseName: string, set: any}>,
  sessionId: string,
  userId: string
): Partial<UnifiedWorkoutSession> {
  const sessionLogs = logs.filter(log => log.sessionId === sessionId);
  if (sessionLogs.length === 0) return {};

  // Group by exercise
  const exerciseGroups = new Map<string, typeof sessionLogs>();
  sessionLogs.forEach(log => {
    if (log.exerciseName === 'WORKOUT_COMPLETED') return;
    
    if (!exerciseGroups.has(log.exerciseName)) {
      exerciseGroups.set(log.exerciseName, []);
    }
    exerciseGroups.get(log.exerciseName)!.push(log);
  });

  // Convert to unified format
  const exercises: WorkoutExercise[] = Array.from(exerciseGroups.entries()).map(([exerciseName, logs], index) => ({
    exerciseId: (index + 1).toString(),
    exerciseName,
    exerciseOrder: index + 1,
    sets: logs.map((log, setIndex) => ({
      setNumber: setIndex + 1,
      weight: log.set?.weight || 0,
      reps: log.set?.reps || 0,
      volume: (log.set?.weight || 0) * (log.set?.reps || 0),
      timestamp: log.timestamp,
      isWarmup: false,
      isDropSet: false,
      isFailure: false,
      formScore: log.set?.formScore || 8
    })),
    targetSets: logs.length,
    targetReps: logs[0]?.set?.reps || 8,
    restTimeSeconds: 60,
    personalRecord: false
  }));

  const totalVolume = exercises.reduce((sum, ex) => 
    sum + ex.sets.reduce((setSum, set) => setSum + set.volume, 0), 0);

  return {
    id: sessionId,
    userId,
    sessionType: 'completed',
    startTime: sessionLogs[0]?.timestamp || new Date().toISOString(),
    endTime: sessionLogs[sessionLogs.length - 1]?.timestamp || new Date().toISOString(),
    lastModified: new Date().toISOString(),
    workoutType: sessionLogs[0]?.workoutType || 'Mixed',
    exercises,
    totalVolume,
    caloriesBurned: Math.round(totalVolume * 0.1),
    progressMetrics: {
      totalSets: exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
      totalExercises: exercises.length,
      muscleGroupsTargeted: [] // TODO: Add muscle mapping
    }
  };
}

/**
 * Convert legacy session format to unified schema
 */
export function convertLegacySessionToUnified(legacySession: any): Partial<UnifiedWorkoutSession> {
  return {
    id: legacySession.id,
    userId: legacySession.userId?.toString() || "1",
    sessionType: legacySession.status === 'completed' ? 'completed' : 'active',
    startTime: legacySession.startTime,
    endTime: legacySession.endTime,
    lastModified: legacySession.endTime || legacySession.startTime,
    workoutType: legacySession.workoutType || 'Mixed',
    exercises: (legacySession.exercises || []).map((ex: any, index: number) => ({
      exerciseId: ex.exerciseId || index + 1,
      exerciseName: ex.exerciseName,
      exerciseOrder: index + 1,
      sets: (ex.sets || []).map((set: any, setIndex: number) => ({
        setNumber: set.setNumber || setIndex + 1,
        weight: set.weight || 0,
        reps: set.reps || 0,
        volume: (set.weight || 0) * (set.reps || 0),
        timestamp: set.timestamp || legacySession.startTime,
        formScore: set.formScore,
        equipment: set.equipment
      })),
      targetSets: ex.sets?.length || 3,
      targetReps: 8,
      restTimeSeconds: 60,
      formScore: ex.formScore
    })),
    totalVolume: legacySession.totalVolume || 0,
    totalDuration: legacySession.totalDuration || 0,
    caloriesBurned: legacySession.caloriesBurned || 0,
    rating: legacySession.rating,
    notes: legacySession.notes
  };
}

/**
 * Storage Strategy
 * 
 * Single File per User: `/data/users/{userId}/unified-workouts.json`
 * 
 * Benefits:
 * - Eliminates dual storage systems
 * - No data conversion required
 * - Real-time updates persist immediately
 * - Progress calculations use same data structure
 * - Simplified API endpoints
 * - Better TypeScript integration
 * 
 * File Structure:
 * {
 *   "userId": "1",
 *   "lastUpdated": "2025-06-04T...",
 *   "sessions": [...], // All workout sessions
 *   "aggregations": {...} // Pre-calculated stats for performance
 * }
 */