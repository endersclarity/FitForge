// Database Population Script - Convert Ender's exercises to Universal Schema
// Real Data Architecture - No mock data, validate all exercise data

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  UniversalExercise, 
  validateExerciseData,
  EquipmentType,
  ExerciseCategory,
  MovementPattern,
  WorkoutType,
  DifficultyLevel 
} from '../server/database/exercise-schema.js';
import { enderExerciseDatabase } from './ender-real-exercises.js';

// Equipment mapping from existing data to schema types
const EQUIPMENT_MAPPING: Record<string, EquipmentType[]> = {
  "Bodyweight": ["Bodyweight"],
  "Bench": ["Bench"],
  "TRX": ["TRX"],
  "Kettlebell": ["Kettlebell"],
  "Pull-up Bar": ["Pull-up Bar"],
  "Dumbbell": ["Dumbbell"],
  "OYA": ["T-Bar"], // OYA maps to T-Bar
  "Countertop": ["Bodyweight"], // Countertop exercises are bodyweight
  "Plybox": ["Plybox"],
  "Cable": ["Cable"],
  "Barbell": ["Barbell"],
  "None": ["Bodyweight"]
};

// Convert existing exercise data to universal schema
function convertExerciseToUniversalSchema(exercise: any, index: number): UniversalExercise {
  // Generate consistent ID based on exercise name
  const id = exercise.exerciseName.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Map equipment types
  const equipmentType: EquipmentType[] = [];
  
  // Handle equipmentType field
  if (exercise.equipmentType && EQUIPMENT_MAPPING[exercise.equipmentType]) {
    equipmentType.push(...EQUIPMENT_MAPPING[exercise.equipmentType]);
  }
  
  // Handle equipment array field
  if (exercise.equipment && Array.isArray(exercise.equipment)) {
    exercise.equipment.forEach((eq: string) => {
      if (EQUIPMENT_MAPPING[eq]) {
        equipmentType.push(...EQUIPMENT_MAPPING[eq]);
      }
    });
  }
  
  // Remove duplicates
  const uniqueEquipment = [...new Set(equipmentType)];
  
  // Ensure at least one equipment type
  if (uniqueEquipment.length === 0) {
    uniqueEquipment.push("Bodyweight");
  }

  // Map category
  let category: ExerciseCategory;
  switch (exercise.category) {
    case "Compound":
      category = "Compound";
      break;
    case "Isolation":
      category = "Isolation";
      break;
    case "Explosive":
      category = "Explosive";
      break;
    case "Functional":
      category = "Functional";
      break;
    default:
      // Default based on movement pattern
      category = exercise.movementType === "Core" ? "Isolation" : "Compound";
  }

  // Map movement pattern
  let movementPattern: MovementPattern;
  switch (exercise.movementType) {
    case "Push":
      movementPattern = "Push";
      break;
    case "Pull":
      movementPattern = "Pull";
      break;
    case "Legs":
      movementPattern = "Legs";
      break;
    case "Core":
      movementPattern = "Core";
      break;
    case "Full Body":
      movementPattern = "Full Body";
      break;
    default:
      // Infer from workout type
      if (exercise.workoutType === "Abs") {
        movementPattern = "Core";
      } else if (exercise.workoutType === "Legs") {
        movementPattern = "Legs";
      } else if (exercise.workoutType === "ChestTriceps") {
        movementPattern = "Push";
      } else if (exercise.workoutType === "BackBiceps") {
        movementPattern = "Pull";
      } else {
        movementPattern = "Full Body";
      }
  }

  // Map workout type
  let workoutType: WorkoutType;
  switch (exercise.workoutType) {
    case "Abs":
      workoutType = "Abs";
      break;
    case "BackBiceps":
      workoutType = "BackBiceps";
      break;
    case "ChestTriceps":
      workoutType = "ChestTriceps";
      break;
    case "Legs":
      workoutType = "Legs";
      break;
    default:
      workoutType = "Legs"; // Default fallback
  }

  // Map difficulty
  let difficultyLevel: DifficultyLevel;
  switch (exercise.difficulty) {
    case "Beginner":
      difficultyLevel = "Beginner";
      break;
    case "Intermediate":
      difficultyLevel = "Intermediate";
      break;
    case "Advanced":
      difficultyLevel = "Advanced";
      break;
    default:
      difficultyLevel = "Intermediate"; // Default
  }

  // Convert rest time to seconds
  let restTimeSeconds: number | undefined;
  if (exercise.restTime && typeof exercise.restTime === 'string') {
    const match = exercise.restTime.match(/(\d+):(\d+)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      restTimeSeconds = minutes * 60 + seconds;
    }
  }

  // Create universal exercise object
  const universalExercise: UniversalExercise = {
    id,
    exerciseName: exercise.exerciseName,
    category,
    movementPattern,
    workoutType,
    equipmentType: uniqueEquipment,
    primaryMuscles: exercise.primaryMuscles || [],
    secondaryMuscles: exercise.secondaryMuscles,
    difficultyLevel,
    variation: exercise.variation,
    restTimeSeconds,
    defaultReps: exercise.reps,
    defaultWeight: exercise.weight === "Bodyweight" ? 0 : exercise.weight,
    description: `${exercise.exerciseName} is a ${category.toLowerCase()} ${movementPattern.toLowerCase()} exercise targeting ${exercise.primaryMuscles?.map((m: any) => m.muscle).join(', ') || 'multiple muscle groups'}.`,
    formCues: [], // Can be added later
    contraindications: [], // Can be added later
    safetyNotes: [] // Can be added later
  };

  return universalExercise;
}

// Fix muscle percentage issues by normalizing percentages
function normalizeMusclePercentages(exercise: any): void {
  // Fix primary muscles if they exceed 100%
  if (exercise.primaryMuscles && exercise.primaryMuscles.length > 0) {
    const primaryTotal = exercise.primaryMuscles.reduce((sum: number, m: any) => sum + m.percentage, 0);
    if (primaryTotal > 100) {
      // Normalize to 100%
      exercise.primaryMuscles.forEach((muscle: any) => {
        muscle.percentage = Math.round((muscle.percentage / primaryTotal) * 100);
      });
    }
  }
  
  // Fix secondary muscles if they exceed 100%
  if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
    const secondaryTotal = exercise.secondaryMuscles.reduce((sum: number, m: any) => sum + m.percentage, 0);
    if (secondaryTotal > 100) {
      // Normalize to maximum 80% for secondary muscles
      exercise.secondaryMuscles.forEach((muscle: any) => {
        muscle.percentage = Math.round((muscle.percentage / secondaryTotal) * 80);
      });
    }
  }
}

// Validate muscle percentages don't exceed limits
function validateMusclePercentages(exercise: UniversalExercise): void {
  const primaryTotal = exercise.primaryMuscles.reduce((sum, m) => sum + m.percentage, 0);
  const secondaryTotal = exercise.secondaryMuscles?.reduce((sum, m) => sum + m.percentage, 0) || 0;
  
  if (primaryTotal > 100) {
    console.warn(`${exercise.exerciseName}: Primary muscle percentages exceed 100% (${primaryTotal}%)`);
  }
  
  if (secondaryTotal > 100) {
    console.warn(`${exercise.exerciseName}: Secondary muscle percentages exceed 100% (${secondaryTotal}%)`);
  }
  
  if (primaryTotal + secondaryTotal > 150) {
    console.warn(`${exercise.exerciseName}: Total muscle engagement unusually high (${primaryTotal + secondaryTotal}%)`);
  }
}

// Main population function
async function populateExerciseDatabase(): Promise<void> {
  console.log('🏗️  Starting exercise database population...');
  console.log(`📊 Converting ${enderExerciseDatabase.length} exercises from Ender's database`);
  
  // Convert all exercises
  const universalExercises: UniversalExercise[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < enderExerciseDatabase.length; i++) {
    const exercise = enderExerciseDatabase[i];
    
    try {
      // Fix muscle percentage issues first
      normalizeMusclePercentages(exercise);
      
      // Convert to universal schema
      const universalExercise = convertExerciseToUniversalSchema(exercise, i);
      
      // Validate with Zod schema
      const validatedExercise = validateExerciseData(universalExercise);
      
      // Additional muscle percentage validation
      validateMusclePercentages(validatedExercise);
      
      universalExercises.push(validatedExercise);
      
      console.log(`✅ Converted: ${exercise.exerciseName}`);
      
    } catch (error) {
      const errorMessage = `❌ Failed to convert ${exercise.exerciseName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      errors.push(errorMessage);
    }
  }
  
  // Create data directory structure
  const dataDir = path.join(process.cwd(), 'data');
  const exercisesDir = path.join(dataDir, 'exercises');
  
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(exercisesDir, { recursive: true });
  
  // Write universal exercise database
  const databasePath = path.join(exercisesDir, 'universal-exercise-database.json');
  await fs.writeFile(databasePath, JSON.stringify(universalExercises, null, 2));
  
  // Write conversion report
  const reportPath = path.join(exercisesDir, 'conversion-report.json');
  const report = {
    conversionDate: new Date().toISOString(),
    sourceExerciseCount: enderExerciseDatabase.length,
    convertedExerciseCount: universalExercises.length,
    errors: errors,
    statistics: {
      exercisesByWorkoutType: {} as Record<string, number>,
      exercisesByCategory: {} as Record<string, number>,
      exercisesByDifficulty: {} as Record<string, number>,
      equipmentTypes: [] as string[],
      uniqueMuscles: [] as string[]
    }
  };
  
  // Calculate statistics
  universalExercises.forEach(exercise => {
    // Count by workout type
    report.statistics.exercisesByWorkoutType[exercise.workoutType] = 
      (report.statistics.exercisesByWorkoutType[exercise.workoutType] || 0) + 1;
    
    // Count by category
    report.statistics.exercisesByCategory[exercise.category] = 
      (report.statistics.exercisesByCategory[exercise.category] || 0) + 1;
    
    // Count by difficulty
    report.statistics.exercisesByDifficulty[exercise.difficultyLevel] = 
      (report.statistics.exercisesByDifficulty[exercise.difficultyLevel] || 0) + 1;
  });
  
  // Get unique equipment and muscles
  const equipmentSet = new Set<string>();
  const muscleSet = new Set<string>();
  
  universalExercises.forEach(exercise => {
    exercise.equipmentType.forEach(eq => equipmentSet.add(eq));
    exercise.primaryMuscles.forEach(muscle => muscleSet.add(muscle.muscle));
    exercise.secondaryMuscles?.forEach(muscle => muscleSet.add(muscle.muscle));
  });
  
  report.statistics.equipmentTypes = Array.from(equipmentSet).sort();
  report.statistics.uniqueMuscles = Array.from(muscleSet).sort();
  
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n🎉 Exercise database population completed!');
  console.log(`📁 Database saved to: ${databasePath}`);
  console.log(`📊 Report saved to: ${reportPath}`);
  console.log(`✅ Successfully converted: ${universalExercises.length}/${enderExerciseDatabase.length} exercises`);
  
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} errors occurred during conversion`);
  }
  
  console.log('\n📈 Database Statistics:');
  console.log(`  • Total exercises: ${universalExercises.length}`);
  console.log(`  • Workout types: ${Object.keys(report.statistics.exercisesByWorkoutType).length}`);
  console.log(`  • Equipment types: ${report.statistics.equipmentTypes.length}`);
  console.log(`  • Unique muscles: ${report.statistics.uniqueMuscles.length}`);
  
  console.log('\n🏋️  Exercises by workout type:');
  Object.entries(report.statistics.exercisesByWorkoutType).forEach(([type, count]) => {
    console.log(`  • ${type}: ${count} exercises`);
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateExerciseDatabase()
    .then(() => {
      console.log('✨ Database population completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database population failed:', error);
      process.exit(1);
    });
}

export { populateExerciseDatabase };