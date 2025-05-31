// Universal Exercise Database Access Layer - Real Data Architecture
// All exercises loaded from validated database - no mock data

import fs from 'fs/promises';
import path from 'path';
import { 
  UniversalExercise, 
  ExerciseQuery, 
  WorkoutType, 
  EquipmentType, 
  MovementPattern,
  ExerciseCategory,
  DifficultyLevel,
  MuscleEngagement,
  validateExerciseData,
  MUSCLE_GROUPS,
  EQUIPMENT_PROFILES,
  EquipmentProfile
} from './exercise-schema.js';

class ExerciseDatabase {
  private exercises: UniversalExercise[] = [];
  private isLoaded = false;
  private readonly databasePath = path.join(process.cwd(), 'data', 'exercises', 'universal-exercise-database.json');

  // Load exercise database from JSON file
  async loadDatabase(): Promise<void> {
    try {
      const data = await fs.readFile(this.databasePath, 'utf-8');
      const rawExercises = JSON.parse(data);
      
      // Validate each exercise against schema
      this.exercises = rawExercises.map((exercise: unknown) => {
        try {
          return validateExerciseData(exercise);
        } catch (error) {
          console.error(`Invalid exercise data:`, error);
          throw new Error(`Failed to validate exercise: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
      
      this.isLoaded = true;
      console.log(`Loaded ${this.exercises.length} validated exercises from database`);
      
    } catch (error) {
      if (error instanceof Error && (error as any).code === 'ENOENT') {
        throw new Error(`Exercise database not found at ${this.databasePath}. Please run database population script first.`);
      }
      throw new Error(`Failed to load exercise database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Ensure database is loaded before operations
  private async ensureLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.loadDatabase();
    }
  }

  // Get all exercises with optional filtering
  async getAllExercises(query?: ExerciseQuery): Promise<UniversalExercise[]> {
    await this.ensureLoaded();
    
    if (!query) {
      return [...this.exercises];
    }
    
    return this.exercises.filter(exercise => {
      // Filter by workout type
      if (query.workoutType && exercise.workoutType !== query.workoutType) {
        return false;
      }
      
      // Filter by category
      if (query.category && exercise.category !== query.category) {
        return false;
      }
      
      // Filter by movement pattern
      if (query.movementPattern && exercise.movementPattern !== query.movementPattern) {
        return false;
      }
      
      // Filter by difficulty level
      if (query.difficultyLevel && exercise.difficultyLevel !== query.difficultyLevel) {
        return false;
      }
      
      // Filter by equipment availability
      if (query.equipmentTypes && query.equipmentTypes.length > 0) {
        const hasRequiredEquipment = exercise.equipmentType.some(equipment => 
          query.equipmentTypes!.includes(equipment)
        );
        if (!hasRequiredEquipment) {
          return false;
        }
      }
      
      // Filter by primary muscle
      if (query.primaryMuscle) {
        const hasPrimaryMuscle = exercise.primaryMuscles.some(muscle => 
          muscle.muscle.toLowerCase().includes(query.primaryMuscle!.toLowerCase())
        );
        if (!hasPrimaryMuscle) {
          return false;
        }
      }
      
      // Filter by secondary muscle
      if (query.secondaryMuscle && exercise.secondaryMuscles) {
        const hasSecondaryMuscle = exercise.secondaryMuscles.some(muscle => 
          muscle.muscle.toLowerCase().includes(query.secondaryMuscle!.toLowerCase())
        );
        if (!hasSecondaryMuscle) {
          return false;
        }
      }
      
      // Filter by search term
      if (query.searchTerm) {
        const searchLower = query.searchTerm.toLowerCase();
        const matchesName = exercise.exerciseName.toLowerCase().includes(searchLower);
        const matchesDescription = exercise.description?.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Get exercise by ID
  async getExerciseById(id: string): Promise<UniversalExercise | null> {
    await this.ensureLoaded();
    return this.exercises.find(exercise => exercise.id === id) || null;
  }

  // Get exercises by workout type
  async getExercisesByWorkoutType(workoutType: WorkoutType): Promise<UniversalExercise[]> {
    return this.getAllExercises({ workoutType });
  }

  // Get exercises by equipment availability
  async getExercisesByEquipment(equipmentTypes: EquipmentType[]): Promise<UniversalExercise[]> {
    return this.getAllExercises({ equipmentTypes });
  }

  // Get exercises by equipment profile (home gym vs commercial)
  async getExercisesByEquipmentProfile(profile: EquipmentProfile): Promise<UniversalExercise[]> {
    const availableEquipment = [...EQUIPMENT_PROFILES[profile]]; // Convert readonly array to mutable
    return this.getAllExercises({ equipmentTypes: availableEquipment });
  }

  // Get exercises targeting specific muscle group
  async getExercisesByMuscleGroup(muscleGroup: keyof typeof MUSCLE_GROUPS): Promise<UniversalExercise[]> {
    await this.ensureLoaded();
    
    const targetMuscles = MUSCLE_GROUPS[muscleGroup];
    
    return this.exercises.filter(exercise => {
      // Check primary muscles
      const hasPrimaryMatch = exercise.primaryMuscles.some(muscle => 
        targetMuscles.includes(muscle.muscle as (typeof targetMuscles)[number])
      );
      
      // Check secondary muscles  
      const hasSecondaryMatch = exercise.secondaryMuscles?.some(muscle => 
        targetMuscles.includes(muscle.muscle as (typeof targetMuscles)[number])
      ) || false;
      
      return hasPrimaryMatch || hasSecondaryMatch;
    });
  }

  // Get muscle engagement analysis for an exercise
  async getMuscleEngagement(exerciseId: string): Promise<{
    primary: MuscleEngagement[],
    secondary: MuscleEngagement[],
    totalEngagement: number
  } | null> {
    const exercise = await this.getExerciseById(exerciseId);
    if (!exercise) return null;
    
    const primaryTotal = exercise.primaryMuscles.reduce((sum, m) => sum + m.percentage, 0);
    const secondaryTotal = exercise.secondaryMuscles?.reduce((sum, m) => sum + m.percentage, 0) || 0;
    
    return {
      primary: exercise.primaryMuscles,
      secondary: exercise.secondaryMuscles || [],
      totalEngagement: primaryTotal + secondaryTotal
    };
  }

  // Search exercises with intelligent matching
  async searchExercises(searchTerm: string, limit: number = 10): Promise<UniversalExercise[]> {
    const results = await this.getAllExercises({ searchTerm });
    
    // Sort by relevance (exact matches first, then partial matches)
    const sortedResults = results.sort((a, b) => {
      const aNameMatch = a.exerciseName.toLowerCase().includes(searchTerm.toLowerCase());
      const bNameMatch = b.exerciseName.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      // Secondary sort by exercise name alphabetically
      return a.exerciseName.localeCompare(b.exerciseName);
    });
    
    return sortedResults.slice(0, limit);
  }

  // Get workout recommendations based on equipment and goals
  async getWorkoutRecommendations(params: {
    workoutType: WorkoutType;
    equipmentProfile: EquipmentProfile;
    difficultyLevel?: DifficultyLevel;
    targetMuscles?: string[];
    exerciseCount?: number;
  }): Promise<UniversalExercise[]> {
    const availableEquipment = [...EQUIPMENT_PROFILES[params.equipmentProfile]]; // Convert readonly to mutable
    
    let query: ExerciseQuery = {
      workoutType: params.workoutType,
      equipmentTypes: availableEquipment
    };
    
    if (params.difficultyLevel) {
      query.difficultyLevel = params.difficultyLevel;
    }
    
    const exercises = await this.getAllExercises(query);
    
    // Filter by target muscles if specified
    let filteredExercises = exercises;
    if (params.targetMuscles && params.targetMuscles.length > 0) {
      filteredExercises = exercises.filter(exercise => {
        return params.targetMuscles!.some(targetMuscle => {
          const hasPrimaryMatch = exercise.primaryMuscles.some(muscle => 
            muscle.muscle.toLowerCase().includes(targetMuscle.toLowerCase())
          );
          const hasSecondaryMatch = exercise.secondaryMuscles?.some(muscle => 
            muscle.muscle.toLowerCase().includes(targetMuscle.toLowerCase())
          ) || false;
          
          return hasPrimaryMatch || hasSecondaryMatch;
        });
      });
    }
    
    // Prioritize compound movements for better workout efficiency
    const sortedExercises = filteredExercises.sort((a, b) => {
      // Compound exercises first
      if (a.category === 'Compound' && b.category !== 'Compound') return -1;
      if (a.category !== 'Compound' && b.category === 'Compound') return 1;
      
      // Then by primary muscle engagement percentage
      const aTotalPrimary = a.primaryMuscles.reduce((sum, m) => sum + m.percentage, 0);
      const bTotalPrimary = b.primaryMuscles.reduce((sum, m) => sum + m.percentage, 0);
      
      return bTotalPrimary - aTotalPrimary;
    });
    
    const exerciseCount = params.exerciseCount || 8;
    return sortedExercises.slice(0, exerciseCount);
  }

  // Get database statistics
  async getDatabaseStats(): Promise<{
    totalExercises: number;
    exercisesByWorkoutType: Record<WorkoutType, number>;
    exercisesByCategory: Record<ExerciseCategory, number>;
    exercisesByDifficulty: Record<DifficultyLevel, number>;
    equipmentTypes: EquipmentType[];
    uniqueMuscles: string[];
  }> {
    await this.ensureLoaded();
    
    const stats = {
      totalExercises: this.exercises.length,
      exercisesByWorkoutType: {} as Record<WorkoutType, number>,
      exercisesByCategory: {} as Record<ExerciseCategory, number>,
      exercisesByDifficulty: {} as Record<DifficultyLevel, number>,
      equipmentTypes: [] as EquipmentType[],
      uniqueMuscles: [] as string[]
    };
    
    // Count exercises by workout type
    this.exercises.forEach(exercise => {
      stats.exercisesByWorkoutType[exercise.workoutType] = 
        (stats.exercisesByWorkoutType[exercise.workoutType] || 0) + 1;
      
      stats.exercisesByCategory[exercise.category] = 
        (stats.exercisesByCategory[exercise.category] || 0) + 1;
      
      stats.exercisesByDifficulty[exercise.difficultyLevel] = 
        (stats.exercisesByDifficulty[exercise.difficultyLevel] || 0) + 1;
    });
    
    // Get unique equipment types
    const equipmentSet = new Set<EquipmentType>();
    this.exercises.forEach(exercise => {
      exercise.equipmentType.forEach(equipment => equipmentSet.add(equipment));
    });
    stats.equipmentTypes = Array.from(equipmentSet);
    
    // Get unique muscles
    const muscleSet = new Set<string>();
    this.exercises.forEach(exercise => {
      exercise.primaryMuscles.forEach(muscle => muscleSet.add(muscle.muscle));
      exercise.secondaryMuscles?.forEach(muscle => muscleSet.add(muscle.muscle));
    });
    stats.uniqueMuscles = Array.from(muscleSet).sort();
    
    return stats;
  }
}

// Singleton instance for global use
export const exerciseDatabase = new ExerciseDatabase();

// Export convenience functions
export async function getAllExercises(query?: ExerciseQuery): Promise<UniversalExercise[]> {
  return exerciseDatabase.getAllExercises(query);
}

export async function getExerciseById(id: string): Promise<UniversalExercise | null> {
  return exerciseDatabase.getExerciseById(id);
}

export async function searchExercises(searchTerm: string, limit?: number): Promise<UniversalExercise[]> {
  return exerciseDatabase.searchExercises(searchTerm, limit);
}

export async function getWorkoutRecommendations(params: {
  workoutType: WorkoutType;
  equipmentProfile: EquipmentProfile;
  difficultyLevel?: DifficultyLevel;
  targetMuscles?: string[];
  exerciseCount?: number;
}): Promise<UniversalExercise[]> {
  return exerciseDatabase.getWorkoutRecommendations(params);
}