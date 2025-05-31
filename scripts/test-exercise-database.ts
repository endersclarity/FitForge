// Test Universal Exercise Database - Real Data Architecture
// Validate that database access layer works with real exercise data

import { exerciseDatabase, getAllExercises, searchExercises, getWorkoutRecommendations } from '../server/database/exercise-database.js';

async function testExerciseDatabase(): Promise<void> {
  console.log('🧪 Testing Universal Exercise Database...\n');

  try {
    // Test 1: Load database and get stats
    console.log('📊 Test 1: Database Statistics');
    const stats = await exerciseDatabase.getDatabaseStats();
    console.log(`✅ Total exercises loaded: ${stats.totalExercises}`);
    console.log(`✅ Workout types: ${Object.keys(stats.exercisesByWorkoutType).join(', ')}`);
    console.log(`✅ Equipment types: ${stats.equipmentTypes.length} types available`);
    console.log(`✅ Unique muscles tracked: ${stats.uniqueMuscles.length} muscles\n`);

    // Test 2: Get all exercises for specific workout
    console.log('🏋️  Test 2: Get BackBiceps Workout Exercises');
    const backBicepsExercises = await getAllExercises({ workoutType: 'BackBiceps' });
    console.log(`✅ Found ${backBicepsExercises.length} back & biceps exercises`);
    backBicepsExercises.slice(0, 3).forEach(exercise => {
      console.log(`  • ${exercise.exerciseName} (${exercise.category}, ${exercise.difficultyLevel})`);
    });
    console.log('');

    // Test 3: Search functionality
    console.log('🔍 Test 3: Search for "curl" exercises');
    const curlExercises = await searchExercises('curl', 5);
    console.log(`✅ Found ${curlExercises.length} exercises containing "curl"`);
    curlExercises.forEach(exercise => {
      console.log(`  • ${exercise.exerciseName} - targets ${exercise.primaryMuscles.map(m => m.muscle).join(', ')}`);
    });
    console.log('');

    // Test 4: Equipment-based filtering
    console.log('🏠 Test 4: Home Gym Recommendations (Bodyweight + Dumbbells)');
    const homeGymExercises = await getAllExercises({ 
      equipmentTypes: ['Bodyweight', 'Dumbbell'] 
    });
    console.log(`✅ Found ${homeGymExercises.length} exercises for home gym setup`);
    homeGymExercises.slice(0, 5).forEach(exercise => {
      console.log(`  • ${exercise.exerciseName} (${exercise.equipmentType.join(', ')})`);
    });
    console.log('');

    // Test 5: Workout recommendations
    console.log('💪 Test 5: Chest & Triceps Workout for Intermediate Level');
    const workoutRecommendations = await getWorkoutRecommendations({
      workoutType: 'ChestTriceps',
      equipmentProfile: 'HOME_ADVANCED',
      difficultyLevel: 'Intermediate',
      exerciseCount: 6
    });
    console.log(`✅ Generated ${workoutRecommendations.length} exercise recommendations`);
    workoutRecommendations.forEach((exercise, index) => {
      const primaryMuscles = exercise.primaryMuscles.map(m => `${m.muscle} (${m.percentage}%)`).join(', ');
      console.log(`  ${index + 1}. ${exercise.exerciseName} - ${primaryMuscles}`);
    });
    console.log('');

    // Test 6: Muscle engagement analysis
    console.log('🔬 Test 6: Muscle Engagement Analysis');
    const deadliftExercise = await exerciseDatabase.getExerciseById('dead-lifts');
    if (deadliftExercise) {
      const engagement = await exerciseDatabase.getMuscleEngagement('dead-lifts');
      if (engagement) {
        console.log(`✅ ${deadliftExercise.exerciseName} analysis:`);
        console.log(`  Primary: ${engagement.primary.map(m => `${m.muscle} (${m.percentage}%)`).join(', ')}`);
        console.log(`  Secondary: ${engagement.secondary.map(m => `${m.muscle} (${m.percentage}%)`).join(', ')}`);
        console.log(`  Total engagement: ${engagement.totalEngagement}%`);
      }
    }
    console.log('');

    // Test 7: Muscle group targeting
    console.log('🎯 Test 7: Find Exercises Targeting Chest');
    const chestExercises = await exerciseDatabase.getExercisesByMuscleGroup('CHEST');
    console.log(`✅ Found ${chestExercises.length} exercises targeting chest muscles`);
    chestExercises.slice(0, 4).forEach(exercise => {
      const chestMuscles = exercise.primaryMuscles
        .filter(m => m.muscle.includes('Pectoralis'))
        .map(m => `${m.muscle} (${m.percentage}%)`)
        .join(', ');
      if (chestMuscles) {
        console.log(`  • ${exercise.exerciseName} - ${chestMuscles}`);
      }
    });

    console.log('\n🎉 All database tests completed successfully!');
    console.log('✨ Universal Exercise Database is ready for real data-driven workouts!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testExerciseDatabase()
    .then(() => {
      console.log('\n✅ Database validation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Database validation failed:', error);
      process.exit(1);
    });
}

export { testExerciseDatabase };