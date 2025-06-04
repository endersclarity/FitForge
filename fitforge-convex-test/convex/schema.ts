import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    id: v.string(),
    name: v.string(),
    email: v.string(),
    preferences: v.optional(v.object({
      units: v.string(),
      theme: v.string(),
    })),
  }).index("by_id", ["id"]),

  exercises: defineTable({
    id: v.string(),
    name: v.string(),
    category: v.string(),
    primaryMuscles: v.array(v.string()),
    secondaryMuscles: v.array(v.string()),
    equipment: v.string(),
    difficulty: v.number(),
    instructions: v.array(v.string()),
  }).index("by_category", ["category"]),

  workouts: defineTable({
    id: v.string(),
    userId: v.string(),
    name: v.string(),
    exercises: v.array(v.object({
      exerciseId: v.string(),
      sets: v.array(v.object({
        reps: v.number(),
        weight: v.optional(v.number()),
        duration: v.optional(v.number()),
        completed: v.boolean(),
      })),
    })),
    status: v.string(), // "planned" | "in_progress" | "completed"
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  }).index("by_user", ["userId"]).index("by_status", ["status"]),

  bodyStats: defineTable({
    userId: v.string(),
    date: v.string(),
    weight: v.optional(v.number()),
    bodyFat: v.optional(v.number()),
    muscleMass: v.optional(v.number()),
    measurements: v.optional(v.object({
      chest: v.optional(v.number()),
      waist: v.optional(v.number()),
      arms: v.optional(v.number()),
      thighs: v.optional(v.number()),
    })),
  }).index("by_user_date", ["userId", "date"]),

  goals: defineTable({
    userId: v.string(),
    type: v.string(), // "weight_loss" | "muscle_gain" | "strength" | "endurance"
    target: v.number(),
    current: v.number(),
    unit: v.string(),
    deadline: v.optional(v.string()),
    status: v.string(), // "active" | "completed" | "paused"
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_status", ["status"]),
});