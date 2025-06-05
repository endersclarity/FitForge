/**
 * CONSOLIDATED FITFORGE SCHEMA - Single Source of Truth
 * 
 * This file consolidates all data schemas across FitForge to eliminate
 * inconsistencies between frontend, backend, and database definitions.
 * 
 * Design Principles:
 * - Single canonical definition for each data type
 * - Consistent camelCase naming throughout
 * - Strong TypeScript typing with Zod validation
 * - Compatibility layers for API transformations
 * - Clear separation between client and database representations
 */

import { z } from "zod";

// ============================================================================
// CORE DATA SCHEMAS
// ============================================================================

/**
 * Exercise Definition Schema
 * Canonical exercise format used throughout the application
 */
export const ExerciseSchema = z.object({
  id: z.string(),
  exerciseName: z.string(),
  category: z.string(),
  movementPattern: z.string().optional(),
  workoutType: z.string(),
  equipmentType: z.array(z.string()),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  variation: z.string().optional(),
  defaultReps: z.number().min(1),
  defaultWeightLbs: z.number().min(0),
  restTimeSeconds: z.number().min(0),
  description: z.string().optional(),
  formCues: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  safetyNotes: z.array(z.string()).optional(),
  primaryMuscles: z.array(z.string()).default([]),
  secondaryMuscles: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

/**
 * Set Data Schema
 * Individual set within an exercise
 */
export const SetDataSchema = z.object({
  setNumber: z.number().min(1),
  weight: z.number().min(0),
  reps: z.number().min(0),
  volume: z.number().min(0), // weight * reps
  completed: z.boolean().default(false),
  timestamp: z.string().datetime(),
  formScore: z.number().min(1).max(10).optional(),
  rpe: z.number().min(1).max(10).optional(), // Rate of Perceived Exertion
  restTimeSeconds: z.number().min(0).optional(),
  equipment: z.string().optional(),
  notes: z.string().optional(),
  isWarmup: z.boolean().default(false),
  isDropSet: z.boolean().default(false),
  isFailure: z.boolean().default(false)
});

/**
 * Workout Exercise Schema
 * Exercise within a specific workout session
 */
export const WorkoutExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  exerciseOrder: z.number().min(1),
  
  // Set data
  sets: z.array(SetDataSchema).default([]),
  targetSets: z.number().min(1).default(3),
  targetReps: z.number().min(1).default(8),
  targetWeight: z.number().min(0).default(0),
  
  // Exercise metadata
  restTimeSeconds: z.number().min(0).default(60),
  equipment: z.string().optional(),
  category: z.string().optional(),
  primaryMuscles: z.array(z.string()).default([]),
  secondaryMuscles: z.array(z.string()).default([]),
  
  // Progress tracking
  personalRecord: z.boolean().default(false),
  formScore: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  
  // Progressive overload data
  progressiveOverload: z.object({
    previousBestWeight: z.number().optional(),
    previousBestVolume: z.number().optional(),
    recommendedWeight: z.number().optional(),
    recommendedReps: z.number().optional(),
    progressPercentage: z.number().optional()
  }).optional()
});

/**
 * Workout Session Schema
 * Complete workout session with all exercises and metadata
 */
export const WorkoutSessionSchema = z.object({
  // Identity
  id: z.string(),
  userId: z.string(),
  
  // Status and timing
  status: z.enum(['in_progress', 'completed', 'abandoned', 'cancelled']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  lastModified: z.string().datetime(),
  
  // Workout metadata
  workoutType: z.string(),
  workoutId: z.string().optional(), // Template ID if from preset
  sessionName: z.string().optional(),
  
  // Exercise data
  exercises: z.array(WorkoutExerciseSchema).default([]),
  
  // Session metrics
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
    recordType: z.enum(['weight', 'reps', 'volume', 'oneRepMax']),
    previousValue: z.number(),
    newValue: z.number(),
    improvementPercentage: z.number()
  })).default([])
});

/**
 * User Profile Schema
 * Complete user profile with preferences and body stats
 */
export const UserProfileSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  
  // Body stats
  bodyStats: z.object({
    bodyWeight: z.number().min(0).optional(),
    height: z.number().min(0).optional(), // inches
    age: z.number().min(0).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    updatedAt: z.string().datetime()
  }).optional(),
  
  // Target goals
  targetGoals: z.object({
    targetWeight: z.number().min(0).default(0),
    targetStrengthIncrease: z.number().min(0).default(30), // percentage
    dailyCalorieGoal: z.number().min(0).default(2200),
    dailyProteinGoal: z.number().min(0).default(150)
  }).optional(),
  
  // Preferences
  goals: z.array(z.enum(['weight_loss', 'muscle_gain', 'strength', 'endurance', 'general_fitness'])).default(['general_fitness']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  availableEquipment: z.array(z.string()).default(['bodyweight']),
  workoutFrequency: z.number().min(1).max(7).default(3),
  sessionDuration: z.number().min(15).max(180).default(45), // minutes
  
  // Settings
  preferredUnits: z.enum(['imperial', 'metric']).default('imperial'),
  timezone: z.string().default('America/New_York'),
  coachingEnabled: z.boolean().default(true),
  achievementNotifications: z.boolean().default(true),
  onboardingCompleted: z.boolean().default(false),
  
  // Timestamps
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

/**
 * Personal Record Schema
 */
export const PersonalRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  exerciseId: z.string(),
  exerciseName: z.string(),
  recordType: z.enum(['weight', 'reps', 'volume', 'oneRepMax']),
  value: z.number(),
  weight: z.number(), // For context
  reps: z.number(), // For context
  volume: z.number(), // For context
  date: z.string().datetime(),
  sessionId: z.string(),
  previousRecord: z.number().optional(),
  improvementPercentage: z.number().optional()
});

// ============================================================================
// API COMPATIBILITY SCHEMAS
// ============================================================================

/**
 * Supabase Database Format (snake_case)
 * Used for transforming to/from database representations
 */
export const SupabaseExerciseSchema = z.object({
  id: z.string(),
  exercise_name: z.string(),
  category: z.string(),
  movement_pattern: z.string().nullable().optional(),
  workout_type: z.string(),
  equipment_type: z.array(z.string()),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  variation: z.string().nullable().optional(),
  default_reps: z.number(),
  default_weight_lbs: z.number(),
  rest_time_seconds: z.number(),
  description: z.string().nullable().optional(),
  form_cues: z.array(z.string()).nullable().optional(),
  contraindications: z.array(z.string()).nullable().optional(),
  safety_notes: z.array(z.string()).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

export const SupabaseWorkoutSessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  start_time: z.string(),
  end_time: z.string().nullable().optional(),
  total_duration_seconds: z.number().nullable().optional(),
  workout_type: z.string().nullable().optional(),
  session_name: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  total_volume_lbs: z.number(),
  calories_burned: z.number().nullable().optional(),
  average_heart_rate: z.number().nullable().optional(),
  completion_status: z.enum(['in_progress', 'completed', 'cancelled']),
  user_rating: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

/**
 * Supabase Set Data Schema (database format)
 */
export const SupabaseSetDataSchema = z.object({
  id: z.string(),
  workout_exercise_id: z.string(),
  user_id: z.string(),
  set_number: z.number(),
  reps: z.number(),
  weight_lbs: z.number(),
  form_score: z.number().nullable().optional(),
  perceived_exertion: z.number().nullable().optional(),
  is_completed: z.boolean(),
  is_personal_record: z.boolean(),
  equipment_used: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  rest_time_after_seconds: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Exercise = z.infer<typeof ExerciseSchema>;
export type SetData = z.infer<typeof SetDataSchema>;
export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>;
export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type PersonalRecord = z.infer<typeof PersonalRecordSchema>;

// Database types
export type SupabaseExercise = z.infer<typeof SupabaseExerciseSchema>;
export type SupabaseWorkoutSession = z.infer<typeof SupabaseWorkoutSessionSchema>;
export type SupabaseSetData = z.infer<typeof SupabaseSetDataSchema>;

// ============================================================================
// TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Convert Supabase exercise format to canonical format
 */
export function transformSupabaseExercise(supabaseExercise: SupabaseExercise): Exercise {
  return {
    id: supabaseExercise.id,
    exerciseName: supabaseExercise.exercise_name,
    category: supabaseExercise.category,
    movementPattern: supabaseExercise.movement_pattern || undefined,
    workoutType: supabaseExercise.workout_type,
    equipmentType: supabaseExercise.equipment_type,
    difficultyLevel: supabaseExercise.difficulty_level,
    variation: supabaseExercise.variation || undefined,
    defaultReps: supabaseExercise.default_reps,
    defaultWeightLbs: supabaseExercise.default_weight_lbs,
    restTimeSeconds: supabaseExercise.rest_time_seconds,
    description: supabaseExercise.description || undefined,
    formCues: supabaseExercise.form_cues || undefined,
    contraindications: supabaseExercise.contraindications || undefined,
    safetyNotes: supabaseExercise.safety_notes || undefined,
    primaryMuscles: [], // Derived from category/movement pattern
    secondaryMuscles: [], // Derived from category/movement pattern
    createdAt: supabaseExercise.created_at,
    updatedAt: supabaseExercise.updated_at
  };
}

/**
 * Convert canonical exercise format to Supabase format
 */
export function transformToSupabaseExercise(exercise: Exercise): SupabaseExercise {
  return {
    id: exercise.id,
    exercise_name: exercise.exerciseName,
    category: exercise.category,
    movement_pattern: exercise.movementPattern ?? undefined,
    workout_type: exercise.workoutType,
    equipment_type: exercise.equipmentType,
    difficulty_level: exercise.difficultyLevel,
    variation: exercise.variation ?? undefined,
    default_reps: exercise.defaultReps,
    default_weight_lbs: exercise.defaultWeightLbs,
    rest_time_seconds: exercise.restTimeSeconds,
    description: exercise.description ?? undefined,
    form_cues: exercise.formCues ?? undefined,
    contraindications: exercise.contraindications ?? undefined,
    safety_notes: exercise.safetyNotes ?? undefined,
    created_at: exercise.createdAt,
    updated_at: exercise.updatedAt
  };
}

/**
 * Convert Supabase workout session to canonical format
 */
export function transformSupabaseWorkoutSession(supabaseSession: SupabaseWorkoutSession): Partial<WorkoutSession> {
  return {
    id: supabaseSession.id,
    userId: supabaseSession.user_id,
    status: supabaseSession.completion_status === 'cancelled' ? 'cancelled' : supabaseSession.completion_status,
    startTime: supabaseSession.start_time,
    endTime: supabaseSession.end_time || undefined,
    lastModified: supabaseSession.updated_at,
    workoutType: supabaseSession.workout_type || 'General',
    sessionName: supabaseSession.session_name || undefined,
    totalVolume: supabaseSession.total_volume_lbs,
    totalDuration: supabaseSession.total_duration_seconds ? Math.round(supabaseSession.total_duration_seconds / 60) : 0,
    caloriesBurned: supabaseSession.calories_burned || 0,
    rating: supabaseSession.user_rating || undefined,
    notes: supabaseSession.notes || undefined
  };
}

/**
 * Convert Supabase set data to canonical format
 */
export function transformSupabaseSetData(supabaseSet: SupabaseSetData): SetData {
  return {
    setNumber: supabaseSet.set_number,
    weight: supabaseSet.weight_lbs,
    reps: supabaseSet.reps,
    volume: supabaseSet.weight_lbs * supabaseSet.reps,
    completed: supabaseSet.is_completed,
    timestamp: supabaseSet.completed_at || supabaseSet.created_at,
    formScore: supabaseSet.form_score || undefined,
    rpe: supabaseSet.perceived_exertion || undefined,
    restTimeSeconds: supabaseSet.rest_time_after_seconds || undefined,
    equipment: supabaseSet.equipment_used || undefined,
    notes: undefined, // Not in database schema
    isWarmup: false, // Default
    isDropSet: false, // Default  
    isFailure: false // Default
  };
}

/**
 * Convert canonical set data to Supabase format
 */
export function transformToSupabaseSetData(setData: SetData, workoutExerciseId: string, userId: string): Omit<SupabaseSetData, 'id' | 'created_at' | 'updated_at'> {
  return {
    workout_exercise_id: workoutExerciseId,
    user_id: userId,
    set_number: setData.setNumber,
    reps: setData.reps,
    weight_lbs: setData.weight,
    form_score: setData.formScore || null,
    perceived_exertion: setData.rpe || null,
    is_completed: setData.completed,
    is_personal_record: false, // Calculate separately
    equipment_used: setData.equipment || null,
    started_at: null, // Set when starting
    completed_at: setData.completed ? setData.timestamp : null,
    rest_time_after_seconds: setData.restTimeSeconds || null
  };
}

/**
 * Create workout exercise from canonical exercise data
 */
export function createWorkoutExerciseFromExercise(exercise: Exercise, order: number): WorkoutExercise {
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.exerciseName,
    exerciseOrder: order,
    sets: [],
    targetSets: 3,
    targetReps: exercise.defaultReps,
    targetWeight: exercise.defaultWeightLbs,
    restTimeSeconds: exercise.restTimeSeconds,
    equipment: exercise.equipmentType[0],
    category: exercise.category,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    personalRecord: false
  };
}

/**
 * Calculate total volume for a workout session
 */
export function calculateTotalVolume(session: WorkoutSession): number {
  return session.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((exerciseVolume, set) => {
      return exerciseVolume + set.volume;
    }, 0);
  }, 0);
}

/**
 * Calculate session duration in minutes
 */
export function calculateSessionDuration(session: WorkoutSession): number {
  if (!session.startTime) return 0;
  
  const endTime = session.endTime || new Date().toISOString();
  const start = new Date(session.startTime);
  const end = new Date(endTime);
  
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Validation helpers
 */
export function validateExercise(data: unknown): Exercise {
  return ExerciseSchema.parse(data);
}

export function validateWorkoutSession(data: unknown): WorkoutSession {
  return WorkoutSessionSchema.parse(data);
}

export function validateSetData(data: unknown): SetData {
  return SetDataSchema.parse(data);
}

export function validateUserProfile(data: unknown): UserProfile {
  return UserProfileSchema.parse(data);
}