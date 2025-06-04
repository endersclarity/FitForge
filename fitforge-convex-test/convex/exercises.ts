import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all exercises
export const getAllExercises = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("exercises").collect();
  },
});

// Get exercises by category
export const getExercisesByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    return await ctx.db
      .query("exercises")
      .withIndex("by_category", (q) => q.eq("category", category))
      .collect();
  },
});

// Search exercises by name
export const searchExercises = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const allExercises = await ctx.db.query("exercises").collect();
    return allExercises.filter(exercise => 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },
});

// Seed exercise database (for initial setup)
export const seedExercises = mutation({
  args: {},
  handler: async (ctx) => {
    const exercises = [
      {
        id: "push-up",
        name: "Push-up",
        category: "chest",
        primaryMuscles: ["chest", "triceps", "shoulders"],
        secondaryMuscles: ["core"],
        equipment: "bodyweight",
        difficulty: 2,
        instructions: [
          "Start in a plank position with hands slightly wider than shoulders",
          "Lower your body until chest nearly touches the floor",
          "Push back up to starting position",
          "Keep core engaged throughout movement"
        ],
      },
      {
        id: "squat",
        name: "Bodyweight Squat",
        category: "legs",
        primaryMuscles: ["quadriceps", "glutes"],
        secondaryMuscles: ["hamstrings", "calves", "core"],
        equipment: "bodyweight",
        difficulty: 2,
        instructions: [
          "Stand with feet shoulder-width apart",
          "Lower your body as if sitting back into a chair",
          "Keep chest up and weight on your heels",
          "Return to standing position"
        ],
      },
      {
        id: "pull-up",
        name: "Pull-up",
        category: "back",
        primaryMuscles: ["back", "biceps"],
        secondaryMuscles: ["forearms", "core"],
        equipment: "pull-up bar",
        difficulty: 4,
        instructions: [
          "Hang from bar with overhand grip",
          "Pull your body up until chin clears the bar",
          "Lower yourself with control",
          "Keep core engaged"
        ],
      },
    ];

    // Insert exercises
    for (const exercise of exercises) {
      await ctx.db.insert("exercises", exercise);
    }

    return `Seeded ${exercises.length} exercises`;
  },
});