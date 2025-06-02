import { createClient } from '@supabase/supabase-js';
import { enderExerciseDatabase } from './ender-real-exercises.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qobrbjpsbwwumzkphlns.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvYnJianBzYnd3dW16a3BobG5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjk3MTkzMCwiZXhwIjoyMDQ4NTQ3OTMwfQ.k0q_dGS2RWzPRo8q0BsPeA1fwVLGc6qSBjBdDKdyL-M';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedExercises() {
  console.log('🌱 Starting exercise seeding to Supabase...');
  
  // First check if exercises already exist
  try {
    const { count, error: countError } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('❌ Error checking existing exercises:', countError);
      return;
    }
    
    if (count && count > 0) {
      console.log(`ℹ️  Found ${count} existing exercises. Clearing table first...`);
      const { error: deleteError } = await supabase
        .from('exercises')
        .delete()
        .neq('id', ''); // Delete all rows
        
      if (deleteError) {
        console.error('❌ Error clearing exercises table:', deleteError);
        return;
      }
      console.log('✅ Cleared existing exercises');
    }
  } catch (error) {
    console.error('❌ Error checking/clearing exercises:', error);
    return;
  }
  
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