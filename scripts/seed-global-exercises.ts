// Seed script to populate global exercise library with Ender's exercise database
import { enderExerciseDatabase } from './ender-real-exercises.js';

// Transform Ender's exercise data to match enhanced schema
export const globalExerciseLibrary = enderExerciseDatabase.map(exercise => ({
  exerciseName: exercise.exerciseName,
  equipmentType: exercise.equipmentType,
  category: exercise.category,
  movementType: exercise.movementType,
  
  // Transform muscle data to match schema format
  primaryMuscles: exercise.primaryMuscles,
  secondaryMuscles: exercise.secondaryMuscles || [],
  stabilizingMuscles: [], // Can be added later
  
  equipment: exercise.equipment,
  variations: [exercise.variation], // Convert single variation to array
  difficulty: exercise.difficulty,
  
  // Will be added later as content is created
  instructions: null,
  videoUrl: null,
  imageUrl: null
}));

// Ender's personal exercise selections (all exercises initially)
export const enderPersonalExercises = enderExerciseDatabase.map((exercise, index) => ({
  // userId will be resolved at runtime (Ender's user ID)
  exerciseId: index + 1, // Matches the global exercise library index
  
  // Personal customizations based on Ender's data
  personalNotes: `Workout Type: ${exercise.workoutType}, Variation: ${exercise.variation}`,
  customWeight: exercise.weight === "Bodyweight" ? null : parseFloat(exercise.weight.toString()),
  customReps: exercise.reps,
  customSets: 3, // Default assumption
  
  // Usage tracking (will be updated as workouts are performed)
  lastPerformed: null,
  timesPerformed: 0,
  isFavorite: ["Bench Press", "Dead Lifts", "Squats", "Pull-ups"].includes(exercise.exerciseName)
}));

// Workout templates based on Ender's workout groupings
export const enderWorkoutTemplates = [
  {
    name: "Ender's Core Workout",
    description: "Comprehensive core strengthening with progressive hold times",
    workoutType: "Abs",
    targetMuscles: ["Rectus Abdominis", "Transverse Abdominis", "Obliques"],
    exercises: enderExerciseDatabase
      .filter(ex => ex.workoutType === "Abs")
      .map((ex, i) => ({
        exerciseId: enderExerciseDatabase.indexOf(ex) + 1,
        sets: 3,
        reps: ex.reps,
        weight: ex.weight === "Bodyweight" ? null : ex.weight,
        restTime: ex.restTime,
        order: i + 1
      })),
    estimatedDuration: 30,
    difficultyLevel: "Intermediate",
    isPublic: true
  },
  {
    name: "Ender's Pull Day",
    description: "Back and bicep development with compound movements", 
    workoutType: "BackBiceps",
    targetMuscles: ["Latissimus Dorsi", "Rhomboids", "Biceps Brachii"],
    exercises: enderExerciseDatabase
      .filter(ex => ex.workoutType === "BackBiceps")
      .map((ex, i) => ({
        exerciseId: enderExerciseDatabase.indexOf(ex) + 1,
        sets: 3,
        reps: ex.reps,
        weight: ex.weight === "Bodyweight" ? null : ex.weight,
        restTime: ex.restTime,
        order: i + 1
      })),
    estimatedDuration: 60,
    difficultyLevel: "Intermediate",
    isPublic: true
  },
  {
    name: "Ender's Push Day",
    description: "Chest and tricep focus with pressing movements",
    workoutType: "ChestTriceps", 
    targetMuscles: ["Pectoralis Major", "Triceps Brachii", "Deltoids"],
    exercises: enderExerciseDatabase
      .filter(ex => ex.workoutType === "ChestTriceps")
      .map((ex, i) => ({
        exerciseId: enderExerciseDatabase.indexOf(ex) + 1,
        sets: 3,
        reps: ex.reps,
        weight: ex.weight === "Bodyweight" ? null : ex.weight,
        restTime: ex.restTime,
        order: i + 1
      })),
    estimatedDuration: 75,
    difficultyLevel: "Intermediate", 
    isPublic: true
  },
  {
    name: "Ender's Leg Day",
    description: "Lower body compound movements and glute activation",
    workoutType: "Legs",
    targetMuscles: ["Quadriceps", "Gluteus Maximus", "Hamstrings"],
    exercises: enderExerciseDatabase
      .filter(ex => ex.workoutType === "Legs")
      .map((ex, i) => ({
        exerciseId: enderExerciseDatabase.indexOf(ex) + 1,
        sets: 3,
        reps: ex.reps,
        weight: ex.weight === "Bodyweight" ? null : ex.weight,
        restTime: ex.restTime,
        order: i + 1
      })),
    estimatedDuration: 50,
    difficultyLevel: "Advanced",
    isPublic: true
  }
];

console.log(`Global Exercise Library: ${globalExerciseLibrary.length} exercises`);
console.log(`Ender's Personal Collection: ${enderPersonalExercises.length} exercises`);
console.log(`Ender's Workout Templates: ${enderWorkoutTemplates.length} templates`);