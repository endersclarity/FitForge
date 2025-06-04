import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced exercise library with your detailed categorization
export const exerciseLibrary = pgTable("exercise_library", {
  id: serial("id").primaryKey(),
  exerciseName: text("exercise_name").notNull().unique(),
  equipmentType: text("equipment_type").notNull(), // Barbell, Dumbbell, Bodyweight, Cable, etc.
  category: text("category").notNull(), // Compound, Isolation
  movementType: text("movement_type").notNull(), // Push, Pull, Legs, Core
  primaryMuscles: jsonb("primary_muscles").notNull(), // [{muscle: "Chest", percentage: 60}]
  secondaryMuscles: jsonb("secondary_muscles"), // [{muscle: "Triceps", percentage: 30}]
  stabilizingMuscles: jsonb("stabilizing_muscles"), // [{muscle: "Core", percentage: 10}]
  equipment: text("equipment").array(), // Specific equipment needed
  variations: text("variations").array(), // Wide grip, close grip, etc.
  difficulty: text("difficulty").notNull(), // Beginner, Intermediate, Advanced
  instructions: text("instructions"),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enhanced workouts with structured exercise data
export const workoutTemplates = pgTable("workout_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  workoutType: text("workout_type").notNull(), // Push, Pull, Legs, Upper, Lower, Full Body
  targetMuscles: text("target_muscles").array(),
  exercises: jsonb("exercises").notNull(), // Structured exercise plan
  estimatedDuration: integer("estimated_duration"), // minutes
  difficultyLevel: text("difficulty_level"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enhanced workout sessions with detailed tracking
export const enhancedWorkoutSessions = pgTable("enhanced_workout_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  workoutTemplateId: integer("workout_template_id").references(() => workoutTemplates.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  
  // Session metrics
  totalVolume: decimal("total_volume"), // Total weight × reps
  totalSets: integer("total_sets"),
  totalReps: integer("total_reps"),
  
  // Performance tracking
  averageRestTime: integer("average_rest_time"), // seconds
  averageFormScore: real("average_form_score"), // 0-100
  
  // Detailed exercise performance
  exercisePerformance: jsonb("exercise_performance").notNull(),
  /* Structure:
  {
    exerciseId: number,
    sets: [{
      setNumber: number,
      weight: number,
      reps: number,
      restTime: number,
      formScore: number,
      tempo: string, // "2-0-2-0"
      notes: string,
      isWarmup: boolean,
      rpe: number // Rate of Perceived Exertion 1-10
    }]
  }
  */
  
  // Session notes and status
  notes: text("notes"),
  completionStatus: text("completion_status").default("in_progress"),
  muscleGroupsWorked: text("muscle_groups_worked").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Personal records tracking
export const personalRecords = pgTable("personal_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  exerciseId: integer("exercise_id").references(() => exerciseLibrary.id).notNull(),
  recordType: text("record_type").notNull(), // 1RM, 3RM, 5RM, Max Reps, Max Volume
  value: decimal("value").notNull(),
  unit: text("unit").notNull(), // lbs, kg, reps
  sessionId: integer("session_id").references(() => enhancedWorkoutSessions.id),
  previousRecord: decimal("previous_record"),
  improvement: decimal("improvement"), // percentage
  achievedAt: timestamp("achieved_at").defaultNow().notNull(),
});

// Advanced analytics tracking
export const workoutAnalytics = pgTable("workout_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  
  // Volume metrics
  weeklyVolume: decimal("weekly_volume"),
  monthlyVolume: decimal("monthly_volume"),
  volumeByMuscleGroup: jsonb("volume_by_muscle_group"),
  
  // Balance metrics
  pushPullRatio: decimal("push_pull_ratio"),
  upperLowerRatio: decimal("upper_lower_ratio"),
  compoundIsolationRatio: decimal("compound_isolation_ratio"),
  
  // Progress metrics
  strengthGains: jsonb("strength_gains"), // By exercise
  muscleGroupFrequency: jsonb("muscle_group_frequency"),
  workoutConsistency: real("workout_consistency"), // percentage
  
  // Recovery metrics
  averageRestDays: decimal("average_rest_days"),
  muscleGroupRecovery: jsonb("muscle_group_recovery"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exercise performance history for progression tracking
export const exerciseHistory = pgTable("exercise_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  exerciseId: integer("exercise_id").references(() => exerciseLibrary.id).notNull(),
  sessionId: integer("session_id").references(() => enhancedWorkoutSessions.id).notNull(),
  
  // Performance data
  bestSet: jsonb("best_set"), // {weight, reps, formScore}
  totalVolume: decimal("total_volume"),
  averageWeight: decimal("average_weight"),
  averageReps: decimal("average_reps"),
  
  // Calculated metrics
  estimatedOneRM: decimal("estimated_one_rm"), // Using Epley formula
  volumeProgress: decimal("volume_progress"), // vs last session
  strengthProgress: decimal("strength_progress"), // vs last session
  
  performedAt: timestamp("performed_at").notNull(),
});

// Enhanced users table with workout formulas
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profileImage: text("profile_image"),
  
  // Training preferences
  experienceLevel: text("experience_level"), // Beginner, Intermediate, Advanced
  primaryGoals: text("primary_goals").array(), // Strength, Hypertrophy, Endurance
  preferredEquipment: text("preferred_equipment").array(),
  
  // Workout formulas - arrays of exercise IDs organized by workout type
  workoutFormulas: jsonb("workout_formulas"),
  /* Structure:
  {
    "Abs": [1, 2, 3, 4], // Exercise IDs for core workout
    "BackBiceps": [5, 6, 7, 8, 9], // Exercise IDs for pull day
    "ChestTriceps": [10, 11, 12, 13, 14, 15, 16], // Exercise IDs for push day
    "Legs": [17, 18, 19, 20, 21] // Exercise IDs for leg day
  }
  */
  
  // Personal exercise preferences by exercise ID
  exercisePreferences: jsonb("exercise_preferences"),
  /* Structure:
  {
    "1": { weight: 25, reps: 12, sets: 3, notes: "Hold for 60 seconds" },
    "2": { weight: "bodyweight", reps: 8, sets: 3, notes: "Focus on form" }
  }
  */
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create Zod schemas for validation
export const insertExerciseLibrarySchema = createInsertSchema(exerciseLibrary).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutTemplateSchema = createInsertSchema(workoutTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertEnhancedWorkoutSessionSchema = createInsertSchema(enhancedWorkoutSessions).omit({
  id: true,
  createdAt: true,
});

export const insertPersonalRecordSchema = createInsertSchema(personalRecords).omit({
  id: true,
  achievedAt: true,
});

// Type exports
export type ExerciseLibrary = typeof exerciseLibrary.$inferSelect;
export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type EnhancedWorkoutSession = typeof enhancedWorkoutSessions.$inferSelect;
export type PersonalRecord = typeof personalRecords.$inferSelect;
export type WorkoutAnalytics = typeof workoutAnalytics.$inferSelect;