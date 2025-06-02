import { createClient } from '@supabase/supabase-js';
import { enderExerciseDatabase } from './ender-real-exercises.js';

// Initialize Supabase client
const supabaseUrl = 'https://qobrbjpsbwwumzkphlns.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvYnJianBzYnd3dW16a3BobG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzE5MzAsImV4cCI6MjA0ODU0NzkzMH0._4om6Ij0Vvf1VLrtmuiOitfGqG3DJHE5FBx_SiAXNuA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedExercises() {
  console.log('🌱 Starting exercise seeding to Supabase...');
  
  // Map workout types
  const workoutTypeMap: Record<string, string> = {
    'ChestTriceps': 'chesttriceps',
    'BackBiceps': 'backbiceps',
    'Legs': 'legs',
    'Abs': 'abs'
  };
  
  for (const exercise of enderExerciseDatabase) {
    try {
      // Prepare exercise data for Supabase
      const exerciseData = {
        exercise_name: exercise.exerciseName,
        equipment_type: Array.isArray(exercise.equipmentType) ? exercise.equipmentType : [exercise.equipmentType || 'Bodyweight'],
        category: exercise.category,
        movement_type: exercise.movementType,
        workout_type: workoutTypeMap[exercise.workoutType] || exercise.workoutType.toLowerCase(),
        variation: exercise.variation || '',
        difficulty_level: exercise.difficulty || 'intermediate',
        default_weight_lbs: exercise.weight === 'Bodyweight' ? null : parseFloat(exercise.weight.toString()),
        default_reps: exercise.reps,
        rest_time_seconds: exercise.restTime ? parseInt(exercise.restTime.replace('s', '')) : 60,
        instructions: null,
        video_url: null,
        image_url: null
      };
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('exercises')
        .insert(exerciseData)
        .select()
        .single();
        
      if (error) {
        console.error(`❌ Error inserting ${exercise.exerciseName}:`, error);
      } else {
        console.log(`✅ Inserted: ${exercise.exerciseName}`);
      }
    } catch (err) {
      console.error(`❌ Failed to process ${exercise.exerciseName}:`, err);
    }
  }
  
  // Verify the count
  const { count } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });
    
  console.log(`\n✅ Exercise seeding complete! Total exercises in database: ${count}`);
}

// Run the seeder
seedExercises().catch(console.error);