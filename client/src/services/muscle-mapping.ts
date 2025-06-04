// FitForge Muscle Mapping Service
// Maps exercises to muscle groups for recovery tracking
// Created: June 3, 2025

import { MuscleActivation, MUSCLE_GROUPS, MuscleGroupType } from '@/types/muscle-recovery';

export interface ExerciseMuscleMapping {
  exerciseId: string;
  exerciseName: string;
  primaryMuscles: MuscleActivation[];
  secondaryMuscles: MuscleActivation[];
  category: string;
}

export class MuscleMappingService {
  private exerciseDatabase: Map<string, ExerciseMuscleMapping> = new Map();

  constructor() {
    this.initializeExerciseDatabase();
  }

  /**
   * Get muscle activation for a specific exercise
   * @param exerciseId Exercise identifier
   * @returns Array of muscle activations
   */
  getMuscleActivation(exerciseId: string): MuscleActivation[] {
    const mapping = this.exerciseDatabase.get(exerciseId);
    if (!mapping) {
      console.warn(`No muscle mapping found for exercise: ${exerciseId}`);
      return [];
    }

    return [...mapping.primaryMuscles, ...mapping.secondaryMuscles];
  }

  /**
   * Get primary muscle groups for an exercise
   * @param exerciseId Exercise identifier
   * @returns Array of primary muscle activations
   */
  getPrimaryMuscles(exerciseId: string): MuscleActivation[] {
    const mapping = this.exerciseDatabase.get(exerciseId);
    return mapping?.primaryMuscles || [];
  }

  /**
   * Get secondary muscle groups for an exercise
   * @param exerciseId Exercise identifier
   * @returns Array of secondary muscle activations
   */
  getSecondaryMuscles(exerciseId: string): MuscleActivation[] {
    const mapping = this.exerciseDatabase.get(exerciseId);
    return mapping?.secondaryMuscles || [];
  }

  /**
   * Find exercises that target a specific muscle group
   * @param muscleGroup Target muscle group
   * @returns Array of exercise IDs that target this muscle
   */
  getExercisesForMuscle(muscleGroup: MuscleGroupType): string[] {
    const exercises: string[] = [];
    
    for (const [exerciseId, mapping] of Array.from(this.exerciseDatabase.entries())) {
      const targetsMuscle = [...mapping.primaryMuscles, ...mapping.secondaryMuscles]
        .some(activation => activation.muscleGroup === muscleGroup);
      
      if (targetsMuscle) {
        exercises.push(exerciseId);
      }
    }
    
    return exercises;
  }

  /**
   * Calculate total muscle activation for a workout
   * @param exercises Array of exercises with sets/reps
   * @returns Map of muscle groups to total activation
   */
  calculateWorkoutMuscleActivation(exercises: Array<{
    exerciseId: string;
    sets: number;
    reps: number;
    weight: number;
    rpe: number;
  }>): Map<MuscleGroupType, number> {
    const muscleActivation = new Map<MuscleGroupType, number>();
    
    for (const exercise of exercises) {
      const activations = this.getMuscleActivation(exercise.exerciseId);
      const exerciseVolume = exercise.sets * exercise.reps;
      const intensityMultiplier = exercise.rpe / 10;
      
      for (const activation of activations) {
        const muscleGroup = activation.muscleGroup as MuscleGroupType;
        const weightedActivation = activation.activationPercentage * exerciseVolume * intensityMultiplier;
        
        const currentActivation = muscleActivation.get(muscleGroup) || 0;
        muscleActivation.set(muscleGroup, currentActivation + weightedActivation);
      }
    }
    
    return muscleActivation;
  }

  /**
   * Initialize exercise database with muscle mappings
   */
  private initializeExerciseDatabase(): void {
    // Upper Body Exercises
    this.addExerciseMapping('bench-press', 'Bench Press', [
      { muscleGroup: MUSCLE_GROUPS.CHEST, activationPercentage: 100, isTargeted: true },
      { muscleGroup: MUSCLE_GROUPS.TRICEPS, activationPercentage: 60, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.SHOULDERS, activationPercentage: 40, isTargeted: false }
    ], [], 'chest');

    this.addExerciseMapping('incline-bench-press', 'Incline Bench Press', [
      { muscleGroup: MUSCLE_GROUPS.CHEST, activationPercentage: 100, isTargeted: true },
      { muscleGroup: MUSCLE_GROUPS.SHOULDERS, activationPercentage: 70, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.TRICEPS, activationPercentage: 50, isTargeted: false }
    ], [], 'chest');

    this.addExerciseMapping('push-ups', 'Push-ups', [
      { muscleGroup: MUSCLE_GROUPS.CHEST, activationPercentage: 90, isTargeted: true },
      { muscleGroup: MUSCLE_GROUPS.TRICEPS, activationPercentage: 70, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.SHOULDERS, activationPercentage: 50, isTargeted: false }
    ], [
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 30, isTargeted: false }
    ], 'chest');

    this.addExerciseMapping('pull-ups', 'Pull-ups', [
      { muscleGroup: MUSCLE_GROUPS.BACK, activationPercentage: 100, isTargeted: true },
      { muscleGroup: MUSCLE_GROUPS.BICEPS, activationPercentage: 80, isTargeted: false }
    ], [
      { muscleGroup: MUSCLE_GROUPS.FOREARMS, activationPercentage: 50, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 40, isTargeted: false }
    ], 'back');

    this.addExerciseMapping('chin-ups', 'Chin-ups', [
      { muscleGroup: MUSCLE_GROUPS.BACK, activationPercentage: 90, isTargeted: true },
      { muscleGroup: MUSCLE_GROUPS.BICEPS, activationPercentage: 100, isTargeted: true }
    ], [
      { muscleGroup: MUSCLE_GROUPS.FOREARMS, activationPercentage: 60, isTargeted: false }
    ], 'back');

    this.addExerciseMapping('rows', 'Barbell Rows', [
      { muscleGroup: MUSCLE_GROUPS.BACK, activationPercentage: 100, isTargeted: true },
      { muscleGroup: MUSCLE_GROUPS.BICEPS, activationPercentage: 60, isTargeted: false }
    ], [
      { muscleGroup: MUSCLE_GROUPS.SHOULDERS, activationPercentage: 40, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 50, isTargeted: false }
    ], 'back');

    this.addExerciseMapping('overhead-press', 'Overhead Press', [
      { muscleGroup: MUSCLE_GROUPS.SHOULDERS, activationPercentage: 100, isTargeted: true },
      { muscleGroup: MUSCLE_GROUPS.TRICEPS, activationPercentage: 70, isTargeted: false }
    ], [
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 60, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.CHEST, activationPercentage: 30, isTargeted: false }
    ], 'shoulders');

    this.addExerciseMapping('lateral-raises', 'Lateral Raises', [
      { muscleGroup: MUSCLE_GROUPS.SHOULDERS, activationPercentage: 100, isTargeted: true }
    ], [], 'shoulders');

    this.addExerciseMapping('bicep-curls', 'Bicep Curls', [
      { muscleGroup: MUSCLE_GROUPS.BICEPS, activationPercentage: 100, isTargeted: true }
    ], [
      { muscleGroup: MUSCLE_GROUPS.FOREARMS, activationPercentage: 40, isTargeted: false }
    ], 'biceps');

    this.addExerciseMapping('tricep-dips', 'Tricep Dips', [
      { muscleGroup: MUSCLE_GROUPS.TRICEPS, activationPercentage: 100, isTargeted: true }
    ], [
      { muscleGroup: MUSCLE_GROUPS.CHEST, activationPercentage: 50, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.SHOULDERS, activationPercentage: 40, isTargeted: false }
    ], 'triceps');

    // Lower Body Exercises
    this.addExerciseMapping('squats', 'Squats', [
      { muscleGroup: MUSCLE_GROUPS.QUADRICEPS, activationPercentage: 100, isTargeted: true },
      { muscleGroup: MUSCLE_GROUPS.GLUTES, activationPercentage: 80, isTargeted: false }
    ], [
      { muscleGroup: MUSCLE_GROUPS.HAMSTRINGS, activationPercentage: 50, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 60, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.CALVES, activationPercentage: 30, isTargeted: false }
    ], 'quadriceps');

    this.addExerciseMapping('deadlifts', 'Deadlifts', [
      { muscleGroup: MUSCLE_GROUPS.HAMSTRINGS, activationPercentage: 100, isTargeted: true },
      { muscleGroup: MUSCLE_GROUPS.GLUTES, activationPercentage: 90, isTargeted: true },
      { muscleGroup: MUSCLE_GROUPS.BACK, activationPercentage: 80, isTargeted: false }
    ], [
      { muscleGroup: MUSCLE_GROUPS.QUADRICEPS, activationPercentage: 50, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.FOREARMS, activationPercentage: 60, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 70, isTargeted: false }
    ], 'hamstrings');

    this.addExerciseMapping('lunges', 'Lunges', [
      { muscleGroup: MUSCLE_GROUPS.QUADRICEPS, activationPercentage: 90, isTargeted: true },
      { muscleGroup: MUSCLE_GROUPS.GLUTES, activationPercentage: 80, isTargeted: false }
    ], [
      { muscleGroup: MUSCLE_GROUPS.HAMSTRINGS, activationPercentage: 60, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.CALVES, activationPercentage: 40, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 50, isTargeted: false }
    ], 'quadriceps');

    this.addExerciseMapping('calf-raises', 'Calf Raises', [
      { muscleGroup: MUSCLE_GROUPS.CALVES, activationPercentage: 100, isTargeted: true }
    ], [], 'calves');

    this.addExerciseMapping('hip-thrusts', 'Hip Thrusts', [
      { muscleGroup: MUSCLE_GROUPS.GLUTES, activationPercentage: 100, isTargeted: true }
    ], [
      { muscleGroup: MUSCLE_GROUPS.HAMSTRINGS, activationPercentage: 50, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 40, isTargeted: false }
    ], 'glutes');

    // Core Exercises
    this.addExerciseMapping('planks', 'Planks', [
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 100, isTargeted: true }
    ], [
      { muscleGroup: MUSCLE_GROUPS.SHOULDERS, activationPercentage: 30, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.GLUTES, activationPercentage: 20, isTargeted: false }
    ], 'core');

    this.addExerciseMapping('crunches', 'Crunches', [
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 100, isTargeted: true }
    ], [], 'core');

    this.addExerciseMapping('russian-twists', 'Russian Twists', [
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 100, isTargeted: true }
    ], [], 'core');

    // Compound Bodyweight Exercises
    this.addExerciseMapping('burpees', 'Burpees', [
      { muscleGroup: MUSCLE_GROUPS.CHEST, activationPercentage: 70, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.QUADRICEPS, activationPercentage: 80, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 90, isTargeted: true }
    ], [
      { muscleGroup: MUSCLE_GROUPS.SHOULDERS, activationPercentage: 60, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.TRICEPS, activationPercentage: 50, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.GLUTES, activationPercentage: 60, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.CALVES, activationPercentage: 40, isTargeted: false }
    ], 'full-body');

    this.addExerciseMapping('mountain-climbers', 'Mountain Climbers', [
      { muscleGroup: MUSCLE_GROUPS.CORE, activationPercentage: 100, isTargeted: true },
      { muscleGroup: MUSCLE_GROUPS.QUADRICEPS, activationPercentage: 70, isTargeted: false }
    ], [
      { muscleGroup: MUSCLE_GROUPS.SHOULDERS, activationPercentage: 50, isTargeted: false },
      { muscleGroup: MUSCLE_GROUPS.GLUTES, activationPercentage: 40, isTargeted: false }
    ], 'core');
  }

  /**
   * Add exercise mapping to database
   */
  private addExerciseMapping(
    exerciseId: string,
    exerciseName: string,
    primaryMuscles: MuscleActivation[],
    secondaryMuscles: MuscleActivation[],
    category: string
  ): void {
    this.exerciseDatabase.set(exerciseId, {
      exerciseId,
      exerciseName,
      primaryMuscles,
      secondaryMuscles,
      category
    });
  }

  /**
   * Get all available exercise mappings
   */
  getAllExerciseMappings(): ExerciseMuscleMapping[] {
    return Array.from(this.exerciseDatabase.values());
  }

  /**
   * Search exercises by muscle group
   */
  searchExercisesByMuscle(muscleGroup: MuscleGroupType): ExerciseMuscleMapping[] {
    const results: ExerciseMuscleMapping[] = [];
    
    for (const mapping of Array.from(this.exerciseDatabase.values())) {
      const targetsMuscle = [...mapping.primaryMuscles, ...mapping.secondaryMuscles]
        .some(activation => activation.muscleGroup === muscleGroup);
      
      if (targetsMuscle) {
        results.push(mapping);
      }
    }
    
    return results;
  }

  /**
   * Get exercise mapping by name (fuzzy search)
   */
  searchExerciseByName(searchName: string): ExerciseMuscleMapping | null {
    const normalizedSearch = searchName.toLowerCase().trim();
    
    for (const mapping of Array.from(this.exerciseDatabase.values())) {
      const normalizedName = mapping.exerciseName.toLowerCase();
      if (normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)) {
        return mapping;
      }
    }
    
    return null;
  }
}

// Export singleton instance
export const muscleMappingService = new MuscleMappingService();