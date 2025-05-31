// Universal Exercise Database Schema - Real Data Architecture
// No mock data - all exercise data must come from validated real exercise database

import { z } from 'zod';

// Muscle engagement with specific percentage contribution
export const MuscleEngagementSchema = z.object({
  muscle: z.string().min(1, "Muscle name required"),
  percentage: z.number().min(0).max(100, "Percentage must be 0-100")
});

// Equipment type enumeration for consistency
export const EquipmentTypeSchema = z.enum([
  "Barbell", "Dumbbell", "Kettlebell", "TRX", "Cable", "Bodyweight", 
  "Pull-up Bar", "Bench", "Incline Bench", "Plybox", "Resistance Band",
  "Dip Station", "Parallel Bars", "T-Bar", "Calf Machine", "Step Platform"
]);

// Exercise categories for workout planning
export const ExerciseCategorySchema = z.enum([
  "Compound", "Isolation", "Explosive", "Functional"
]);

// Movement patterns for biomechanical analysis
export const MovementPatternSchema = z.enum([
  "Push", "Pull", "Legs", "Core", "Full Body"
]);

// Workout types for routine organization
export const WorkoutTypeSchema = z.enum([
  "Abs", "BackBiceps", "ChestTriceps", "Legs", "Cardio", "Flexibility"
]);

// Difficulty levels for progressive programming
export const DifficultyLevelSchema = z.enum([
  "Beginner", "Intermediate", "Advanced"
]);

// Core Universal Exercise schema with comprehensive data
export const UniversalExerciseSchema = z.object({
  id: z.string().min(1, "Exercise ID required"),
  exerciseName: z.string().min(1, "Exercise name required"),
  category: ExerciseCategorySchema,
  movementPattern: MovementPatternSchema,
  workoutType: WorkoutTypeSchema,
  equipmentType: z.array(EquipmentTypeSchema).min(1, "At least one equipment type required"),
  
  // Muscle engagement with validation
  primaryMuscles: z.array(MuscleEngagementSchema)
    .min(1, "At least one primary muscle required")
    .refine(muscles => {
      const totalPercentage = muscles.reduce((sum, m) => sum + m.percentage, 0);
      return totalPercentage <= 100;
    }, "Primary muscle percentages cannot exceed 100%"),
  
  secondaryMuscles: z.array(MuscleEngagementSchema)
    .optional()
    .refine(muscles => {
      if (!muscles) return true;
      const totalPercentage = muscles.reduce((sum, m) => sum + m.percentage, 0);
      return totalPercentage <= 100;
    }, "Secondary muscle percentages cannot exceed 100%"),
  
  difficultyLevel: DifficultyLevelSchema,
  
  // Optional metadata for advanced features
  variation: z.string().optional(),
  restTimeSeconds: z.number().min(0).optional(),
  defaultReps: z.number().min(1).optional(),
  defaultWeight: z.number().min(0).optional(),
  
  // Exercise description and form cues
  description: z.string().optional(),
  formCues: z.array(z.string()).optional(),
  
  // Safety and contraindications
  contraindications: z.array(z.string()).optional(),
  safetyNotes: z.array(z.string()).optional()
});

// TypeScript types derived from Zod schemas
export type MuscleEngagement = z.infer<typeof MuscleEngagementSchema>;
export type EquipmentType = z.infer<typeof EquipmentTypeSchema>;
export type ExerciseCategory = z.infer<typeof ExerciseCategorySchema>;
export type MovementPattern = z.infer<typeof MovementPatternSchema>;
export type WorkoutType = z.infer<typeof WorkoutTypeSchema>;
export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>;
export type UniversalExercise = z.infer<typeof UniversalExerciseSchema>;

// Validation function for exercise data integrity
export function validateExerciseData(exercise: unknown): UniversalExercise {
  try {
    return UniversalExerciseSchema.parse(exercise);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Invalid exercise data: ${errorMessages}`);
    }
    throw error;
  }
}

// Exercise query filters for database access
export const ExerciseQuerySchema = z.object({
  workoutType: WorkoutTypeSchema.optional(),
  category: ExerciseCategorySchema.optional(),
  movementPattern: MovementPatternSchema.optional(),
  difficultyLevel: DifficultyLevelSchema.optional(),
  equipmentTypes: z.array(EquipmentTypeSchema).optional(),
  primaryMuscle: z.string().optional(),
  secondaryMuscle: z.string().optional(),
  searchTerm: z.string().optional()
});

export type ExerciseQuery = z.infer<typeof ExerciseQuerySchema>;

// Muscle group mappings for exercise selection
export const MUSCLE_GROUPS = {
  CHEST: ["Pectoralis Major", "Serratus Anterior"],
  BACK: ["Latissimus Dorsi", "Rhomboids", "Trapezius", "Erector Spinae"],
  SHOULDERS: ["Deltoids", "Anterior Deltoids", "Rear Deltoids", "Rotator Cuff"],
  ARMS: ["Biceps Brachii", "Triceps Brachii", "Brachialis", "Brachioradialis", "Grip/Forearms", "Anconeus"],
  LEGS: ["Quadriceps", "Hamstrings", "Gluteus Maximus", "Gastrocnemius", "Soleus"],
  CORE: ["Rectus Abdominis", "Transverse Abdominis", "Obliques", "Hip Flexors"]
} as const;

// Equipment availability profiles for personalized recommendations
export const EQUIPMENT_PROFILES = {
  HOME_BASIC: ["Bodyweight", "Resistance Band"],
  HOME_INTERMEDIATE: ["Bodyweight", "Dumbbell", "Resistance Band", "Pull-up Bar"],
  HOME_ADVANCED: ["Bodyweight", "Dumbbell", "Kettlebell", "Barbell", "Pull-up Bar", "Bench"],
  COMMERCIAL_GYM: Object.values(EquipmentTypeSchema.enum)
} as const;

export type EquipmentProfile = keyof typeof EQUIPMENT_PROFILES;