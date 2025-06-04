import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all workouts for a user
export const getUserWorkouts = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Create a new workout
export const createWorkout = mutation({
  args: {
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
  },
  handler: async (ctx, { userId, name, exercises }) => {
    const workoutId = crypto.randomUUID();
    
    return await ctx.db.insert("workouts", {
      id: workoutId,
      userId,
      name,
      exercises,
      status: "planned",
      startTime: Date.now(),
    });
  },
});

// Update workout status
export const updateWorkoutStatus = mutation({
  args: {
    workoutId: v.id("workouts"),
    status: v.string(),
  },
  handler: async (ctx, { workoutId, status }) => {
    return await ctx.db.patch(workoutId, {
      status,
      ...(status === "completed" ? { endTime: Date.now() } : {}),
    });
  },
});

// Update a set in a workout
export const updateWorkoutSet = mutation({
  args: {
    workoutId: v.id("workouts"),
    exerciseIndex: v.number(),
    setIndex: v.number(),
    setData: v.object({
      reps: v.number(),
      weight: v.optional(v.number()),
      duration: v.optional(v.number()),
      completed: v.boolean(),
    }),
  },
  handler: async (ctx, { workoutId, exerciseIndex, setIndex, setData }) => {
    const workout = await ctx.db.get(workoutId);
    if (!workout) throw new Error("Workout not found");

    const updatedExercises = [...workout.exercises];
    updatedExercises[exerciseIndex].sets[setIndex] = setData;

    return await ctx.db.patch(workoutId, {
      exercises: updatedExercises,
    });
  },
});