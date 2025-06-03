// Quick test to see if exercise fetching works
const fetch = require('node-fetch');

async function testExerciseFetch() {
  try {
    console.log('🔍 Testing exercise data fetch...');
    
    // Test the server endpoint directly (if it exists)
    const response = await fetch('http://172.22.206.209:5000/api/exercises');
    
    if (response.ok) {
      const exercises = await response.json();
      console.log(`✅ Found ${exercises.length} total exercises`);
      
      // Check workout types
      const workoutTypes = [...new Set(exercises.map(e => e.workout_type))];
      console.log('📋 Available workout types:', workoutTypes);
      
      // Check BackBiceps specifically
      const backBicepsExercises = exercises.filter(e => e.workout_type === 'backbiceps');
      console.log(`💪 BackBiceps exercises: ${backBicepsExercises.length}`);
      
      if (backBicepsExercises.length > 0) {
        console.log('🎯 BackBiceps exercises found:');
        backBicepsExercises.forEach(e => console.log(`  - ${e.exercise_name}`));
      }
    } else {
      console.log('❌ API endpoint not accessible:', response.status);
    }
  } catch (error) {
    console.log('❌ Error testing exercise fetch:', error.message);
  }
}

testExerciseFetch();