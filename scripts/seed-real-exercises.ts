import { db } from '../server/storage';
import { exerciseLibrary } from '../shared/enhanced-schema';
import { enderExerciseDatabase, enderWorkoutRoutines } from './ender-real-exercises';

async function seedRealExercises() {
  console.log('🌱 Seeding real exercise database...');
  
  try {
    // Clear existing exercises
    await db.delete(exerciseLibrary);
    console.log('✅ Cleared existing exercise data');
    
    // Insert Ender's real exercise database
    for (const exercise of enderExerciseDatabase) {
      await db.insert(exerciseLibrary).values({
        exerciseName: exercise.exerciseName,
        equipmentType: exercise.equipmentType,
        category: exercise.category,
        movementType: exercise.movementType,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        instructions: `${exercise.exerciseName} - ${exercise.category} ${exercise.movementType} exercise using ${exercise.equipmentType}. Targets ${exercise.primaryMuscles.map(m => m.muscle).join(', ')}.`,
        // Add variation and workout type as metadata
        variations: [exercise.variation],
      });
    }
    
    console.log(`✅ Inserted ${enderExerciseDatabase.length} real exercises`);
    console.log('📊 Exercise breakdown:');
    
    // Show breakdown by workout type
    Object.entries(enderWorkoutRoutines).forEach(([type, routine]) => {
      console.log(`   ${type}: ${routine.exercises.length} exercises (${routine.duration}min)`);
    });
    
    console.log('🎯 Workout type mapping:');
    console.log('   • Abs → Core workouts');
    console.log('   • BackBiceps → Pull workouts');  
    console.log('   • ChestTriceps → Push workouts');
    console.log('   • Legs → Leg workouts');
    
    console.log('🚀 Real exercise database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding exercises:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedRealExercises()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedRealExercises };