import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // strength, cardio, yoga, hiit, etc.
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  duration: integer("duration").notNull(), // in minutes
  calories: integer("calories").notNull(),
  equipment: text("equipment").array(),
  exercises: jsonb("exercises").notNull(), // array of exercise objects
  imageUrl: text("image_url"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  workoutId: integer("workout_id").references(() => workouts.id),
  workoutType: text("workout_type").notNull(), // Custom workout type
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  totalDuration: integer("total_duration"), // in minutes
  totalVolume: real("total_volume").notNull().default(0), // weight × reps total
  caloriesBurned: integer("calories_burned"),
  formScore: real("form_score"), // 0-100
  notes: text("notes"),
  exercises: jsonb("exercises").notNull(), // ExerciseLog[] - detailed exercise performance data
  status: text("status").notNull().default("in_progress"), // in_progress, completed, paused
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  weight: real("weight"),
  bodyFat: real("body_fat"),
  muscleMass: real("muscle_mass"),
  caloriesConsumed: integer("calories_consumed"),
  proteinConsumed: real("protein_consumed"),
  carbsConsumed: real("carbs_consumed"),
  fatsConsumed: real("fats_consumed"),
  sleepHours: real("sleep_hours"),
  stressLevel: integer("stress_level"), // 1-10
  energyLevel: integer("energy_level"), // 1-10
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // personal_record, streak, form_expert, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconType: text("icon_type").notNull(), // trophy, fire, medal, etc.
  value: text("value"), // e.g., "225 lbs", "30 days", etc.
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // cardio, strength, mindfulness, etc.
  target: integer("target").notNull(), // target number (reps, sessions, etc.)
  unit: text("unit").notNull(), // sessions, minutes, reps, etc.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  participants: integer("participants").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challengeParticipations = pgTable("challenge_participations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  challengeId: integer("challenge_id").references(() => challenges.id).notNull(),
  progress: integer("progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  workoutSessionId: integer("workout_session_id").references(() => workoutSessions.id),
  achievementId: integer("achievement_id").references(() => achievements.id),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutSessionSchema = createInsertSchema(workoutSessions).omit({
  id: true,
  createdAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeParticipationSchema = createInsertSchema(challengeParticipations).omit({
  id: true,
  joinedAt: true,
});

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  createdAt: true,
  likes: true,
  comments: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;

// Enhanced workout logging interfaces for real data architecture
export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  formScore?: number;
  notes?: string;
}

export interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  restTimeSeconds?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
  timestamp: Date;
}

// Workout session schema with enhanced structure
export const WorkoutSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workoutType: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  status: z.enum(['in_progress', 'completed', 'paused']),
  exercises: z.array(z.object({
    exerciseId: z.string(),
    exerciseName: z.string(),
    sets: z.array(z.object({
      setNumber: z.number(),
      weight: z.number(),
      reps: z.number(),
      completed: z.boolean(),
      restTimeSeconds: z.number().optional(),
      rpe: z.number().min(1).max(10).optional(),
      notes: z.string().optional(),
      timestamp: z.date()
    })),
    targetSets: z.number(),
    targetReps: z.number(),
    targetWeight: z.number(),
    formScore: z.number().min(0).max(100).optional(),
    notes: z.string().optional()
  })),
  totalVolume: z.number(),
  totalDuration: z.number().optional(),
  notes: z.string().optional()
});

export type WorkoutSessionWithLogs = z.infer<typeof WorkoutSessionSchema>;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallengeParticipation = z.infer<typeof insertChallengeParticipationSchema>;
export type ChallengeParticipation = typeof challengeParticipations.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
