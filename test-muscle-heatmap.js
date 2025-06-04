// Test Script for Muscle Heat Map
// Generates sample workout data to test the heat map visualization

const testWorkouts = [
  {
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    workoutType: 'ChestTriceps',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, weight: 185, rpe: 8 },
      { name: 'Incline Bench Press', sets: 3, reps: 10, weight: 155, rpe: 7 },
      { name: 'Tricep Dips', sets: 3, reps: 12, weight: 0, rpe: 6 },
      { name: 'Push-ups', sets: 2, reps: 15, weight: 0, rpe: 5 }
    ]
  },
  {
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    workoutType: 'BackBiceps', 
    exercises: [
      { name: 'Pull-ups', sets: 4, reps: 6, weight: 25, rpe: 9 },
      { name: 'Barbell Rows', sets: 4, reps: 8, weight: 165, rpe: 8 },
      { name: 'Bicep Curls', sets: 3, reps: 12, weight: 35, rpe: 6 },
      { name: 'Chin-ups', sets: 2, reps: 5, weight: 15, rpe: 7 }
    ]
  },
  {
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    workoutType: 'Legs',
    exercises: [
      { name: 'Squats', sets: 5, reps: 5, weight: 225, rpe: 9 },
      { name: 'Deadlifts', sets: 3, reps: 5, weight: 275, rpe: 9 },
      { name: 'Lunges', sets: 3, reps: 10, weight: 40, rpe: 7 },
      { name: 'Calf Raises', sets: 4, reps: 15, weight: 50, rpe: 6 }
    ]
  }
];

console.log('Sample workout data for testing muscle heat map:');
console.log(JSON.stringify(testWorkouts, null, 2));

// Function to test muscle recovery calculations
function testMuscleRecovery() {
  console.log('\n=== Testing Muscle Recovery Calculations ===');
  
  testWorkouts.forEach((workout, index) => {
    console.log(`\nWorkout ${index + 1} (${workout.workoutType}):`);
    console.log(`Date: ${workout.date.toLocaleDateString()}`);
    console.log(`Days ago: ${Math.floor((Date.now() - workout.date.getTime()) / (24 * 60 * 60 * 1000))}`);
    
    workout.exercises.forEach(exercise => {
      const intensity = exercise.rpe / 10;
      const hoursAgo = (Date.now() - workout.date.getTime()) / (1000 * 60 * 60);
      const baseRecovery = 48; // Hours for major muscle groups
      const recoveryWithIntensity = baseRecovery * (0.5 + (intensity * 0.5));
      const recoveryPercentage = Math.min(100, (hoursAgo / recoveryWithIntensity) * 100);
      
      console.log(`  ${exercise.name}: ${recoveryPercentage.toFixed(1)}% recovered (RPE: ${exercise.rpe})`);
    });
  });
}

testMuscleRecovery();