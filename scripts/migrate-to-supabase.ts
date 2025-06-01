#!/usr/bin/env tsx

/**
 * FitForge Supabase Migration Script
 * 
 * This script migrates data from the current file-based system to Supabase:
 * 1. Exercise database → exercises, exercise_primary_muscles, exercise_secondary_muscles
 * 2. User workout history → workout_sessions, workout_exercises, workout_sets
 * 3. Achievement definitions → achievement_definitions
 * 
 * Usage: tsx scripts/migrate-to-supabase.ts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../client/src/lib/supabase';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for migration

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables.');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ExerciseData {
  id: string;
  exerciseName: string;
  category: string;
  movementPattern?: string;
  workoutType: string;
  equipmentType: string[];
  primaryMuscles: Array<{ muscle: string; percentage: number }>;
  secondaryMuscles: Array<{ muscle: string; percentage: number }>;
  difficultyLevel: string;
  variation?: string;
  restTimeSeconds: number;
  defaultReps: number;
  defaultWeight: number;
  description?: string;
  formCues?: string[];
  contraindications?: string[];
  safetyNotes?: string[];
}

interface WorkoutSession {
  id: string | number;
  userId: string | number;
  startTime: string;
  endTime?: string;
  workoutType?: string;
  exercises: any[];
  totalVolume?: number;
  caloriesBurned?: number;
  status?: string;
  rating?: number;
  notes?: string;
}

async function migrateExerciseDatabase() {
  console.log('🏋️ Migrating exercise database...');
  
  try {
    // Read exercise database
    const exerciseDbPath = path.join(__dirname, '../data/exercises/universal-exercise-database.json');
    const exerciseData: ExerciseData[] = JSON.parse(fs.readFileSync(exerciseDbPath, 'utf8'));
    
    console.log(`📊 Found ${exerciseData.length} exercises to migrate`);
    
    // Prepare exercise records
    const exercises = exerciseData.map(exercise => ({
      id: exercise.id,
      exercise_name: exercise.exerciseName,
      category: exercise.category,
      movement_pattern: exercise.movementPattern || null,
      workout_type: exercise.workoutType,
      equipment_type: exercise.equipmentType,
      difficulty_level: exercise.difficultyLevel || 'beginner',
      variation: exercise.variation || null,
      default_reps: exercise.defaultReps || 10,
      default_weight_lbs: exercise.defaultWeight || 0,
      rest_time_seconds: exercise.restTimeSeconds || 60,
      description: exercise.description || null,
      form_cues: exercise.formCues || null,
      contraindications: exercise.contraindications || null,
      safety_notes: exercise.safetyNotes || null,
    }));
    
    // Insert exercises in batches
    const batchSize = 100;
    for (let i = 0; i < exercises.length; i += batchSize) {
      const batch = exercises.slice(i, i + batchSize);
      const { error } = await supabase.from('exercises').upsert(batch);
      
      if (error) {
        console.error(`❌ Error inserting exercise batch ${i}-${i + batchSize}:`, error);
        throw error;
      }
      
      console.log(`✅ Inserted exercises ${i + 1}-${Math.min(i + batchSize, exercises.length)}`);
    }
    
    // Migrate primary muscles
    console.log('🎯 Migrating primary muscle targets...');
    const primaryMuscles = exerciseData.flatMap(exercise =>
      exercise.primaryMuscles.map(muscle => ({
        exercise_id: exercise.id,
        muscle_name: muscle.muscle,
        percentage: muscle.percentage,
      }))
    );
    
    // Insert primary muscles in batches
    for (let i = 0; i < primaryMuscles.length; i += batchSize) {
      const batch = primaryMuscles.slice(i, i + batchSize);
      const { error } = await supabase.from('exercise_primary_muscles').upsert(batch);
      
      if (error) {
        console.error(`❌ Error inserting primary muscle batch:`, error);
        throw error;
      }
    }
    
    // Migrate secondary muscles
    console.log('🎯 Migrating secondary muscle targets...');
    const secondaryMuscles = exerciseData.flatMap(exercise =>
      exercise.secondaryMuscles?.map(muscle => ({
        exercise_id: exercise.id,
        muscle_name: muscle.muscle,
        percentage: muscle.percentage,
      })) || []
    );
    
    if (secondaryMuscles.length > 0) {
      for (let i = 0; i < secondaryMuscles.length; i += batchSize) {
        const batch = secondaryMuscles.slice(i, i + batchSize);
        const { error } = await supabase.from('exercise_secondary_muscles').upsert(batch);
        
        if (error) {
          console.error(`❌ Error inserting secondary muscle batch:`, error);
          throw error;
        }
      }
    }
    
    console.log(`✅ Exercise database migration complete!`);
    console.log(`   • ${exercises.length} exercises`);
    console.log(`   • ${primaryMuscles.length} primary muscle targets`);
    console.log(`   • ${secondaryMuscles.length} secondary muscle targets`);
    
  } catch (error) {
    console.error('❌ Exercise database migration failed:', error);
    throw error;
  }
}

async function migrateAchievements() {
  console.log('🏆 Migrating achievement definitions...');
  
  // Define achievement structure based on our achievement system
  const achievements = [
    // Consistency Achievements
    {
      id: 'first_workout',
      name: 'Getting Started',
      description: 'Complete your first workout',
      category: 'consistency',
      criteria_type: 'workout_count',
      criteria_value: 1,
      criteria_timeframe_days: null,
      tier_level: 'bronze',
      points: 10,
      icon_name: 'play',
      color_scheme: 'green',
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Complete 7 workouts in 7 days',
      category: 'consistency',
      criteria_type: 'consecutive_days',
      criteria_value: 7,
      criteria_timeframe_days: 7,
      tier_level: 'silver',
      points: 50,
      icon_name: 'calendar',
      color_scheme: 'blue',
    },
    {
      id: 'month_marathon',
      name: 'Month Marathon',
      description: 'Complete 30 workouts in 30 days',
      category: 'consistency',
      criteria_type: 'consecutive_days',
      criteria_value: 30,
      criteria_timeframe_days: 30,
      tier_level: 'gold',
      points: 200,
      icon_name: 'trophy',
      color_scheme: 'yellow',
    },
    
    // Strength Achievements
    {
      id: 'first_pr',
      name: 'Personal Best',
      description: 'Set your first personal record',
      category: 'strength',
      criteria_type: 'pr_count',
      criteria_value: 1,
      criteria_timeframe_days: null,
      tier_level: 'bronze',
      points: 25,
      icon_name: 'star',
      color_scheme: 'purple',
    },
    {
      id: 'strength_surge',
      name: 'Strength Surge',
      description: 'Set 10 personal records',
      category: 'strength',
      criteria_type: 'pr_count',
      criteria_value: 10,
      criteria_timeframe_days: null,
      tier_level: 'silver',
      points: 100,
      icon_name: 'trending-up',
      color_scheme: 'red',
    },
    {
      id: 'powerhouse',
      name: 'Powerhouse',
      description: 'Set 50 personal records',
      category: 'strength',
      criteria_type: 'pr_count',
      criteria_value: 50,
      criteria_timeframe_days: null,
      tier_level: 'gold',
      points: 500,
      icon_name: 'crown',
      color_scheme: 'orange',
    },
    
    // Volume Achievements
    {
      id: 'volume_rookie',
      name: 'Volume Rookie',
      description: 'Lift a total of 10,000 lbs',
      category: 'volume',
      criteria_type: 'total_volume',
      criteria_value: 10000,
      criteria_timeframe_days: null,
      tier_level: 'bronze',
      points: 30,
      icon_name: 'bar-chart',
      color_scheme: 'blue',
    },
    {
      id: 'volume_veteran',
      name: 'Volume Veteran',
      description: 'Lift a total of 100,000 lbs',
      category: 'volume',
      criteria_type: 'total_volume',
      criteria_value: 100000,
      criteria_timeframe_days: null,
      tier_level: 'silver',
      points: 150,
      icon_name: 'bar-chart-3',
      color_scheme: 'indigo',
    },
    {
      id: 'volume_legend',
      name: 'Volume Legend',
      description: 'Lift a total of 1,000,000 lbs',
      category: 'volume',
      criteria_type: 'total_volume',
      criteria_value: 1000000,
      criteria_timeframe_days: null,
      tier_level: 'gold',
      points: 1000,
      icon_name: 'mountain',
      color_scheme: 'emerald',
    },
  ];
  
  try {
    const { error } = await supabase.from('achievement_definitions').upsert(achievements);
    
    if (error) {
      console.error('❌ Error inserting achievements:', error);
      throw error;
    }
    
    console.log(`✅ Achievement definitions migration complete! (${achievements.length} achievements)`);
    
  } catch (error) {
    console.error('❌ Achievement migration failed:', error);
    throw error;
  }
}

async function migrateUserWorkouts() {
  console.log('💪 Migrating user workout history...');
  
  try {
    // Check if user data directory exists
    const userDataDir = path.join(__dirname, '../data/users');
    if (!fs.existsSync(userDataDir)) {
      console.log('ℹ️ No user data directory found, skipping workout migration');
      return;
    }
    
    // Get all user directories
    const userDirs = fs.readdirSync(userDataDir).filter(dir => 
      fs.statSync(path.join(userDataDir, dir)).isDirectory()
    );
    
    for (const userId of userDirs) {
      console.log(`👤 Migrating workouts for user ${userId}...`);
      
      const workoutsFile = path.join(userDataDir, userId, 'workouts.json');
      if (!fs.existsSync(workoutsFile)) {
        console.log(`   ℹ️ No workouts file found for user ${userId}`);
        continue;
      }
      
      const workouts: WorkoutSession[] = JSON.parse(fs.readFileSync(workoutsFile, 'utf8'));
      console.log(`   📊 Found ${workouts.length} workout sessions`);
      
      // Create a profile for this user first (we'll need real auth later)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: `temp-user-${userId}`, // Temporary ID until real auth
        username: `user_${userId}`,
        email: `user${userId}@fitforge.local`,
        full_name: `User ${userId}`,
      });
      
      if (profileError && !profileError.message.includes('already exists')) {
        console.error(`❌ Error creating profile for user ${userId}:`, profileError);
        continue;
      }
      
      // Migrate each workout session
      for (const workout of workouts) {
        try {
          // Create workout session
          const sessionData = {
            id: typeof workout.id === 'string' ? workout.id : workout.id.toString(),
            user_id: `temp-user-${userId}`,
            start_time: workout.startTime,
            end_time: workout.endTime || null,
            workout_type: workout.workoutType || null,
            session_name: null,
            notes: workout.notes || null,
            total_volume_lbs: workout.totalVolume || 0,
            calories_burned: workout.caloriesBurned || null,
            completion_status: workout.status || 'completed',
            user_rating: workout.rating || null,
          };
          
          const { data: sessionResult, error: sessionError } = await supabase
            .from('workout_sessions')
            .upsert(sessionData)
            .select('id')
            .single();
          
          if (sessionError) {
            console.error(`   ❌ Error creating session ${workout.id}:`, sessionError);
            continue;
          }
          
          const sessionId = sessionResult.id;
          
          // Migrate exercises within this session
          if (workout.exercises && workout.exercises.length > 0) {
            for (let i = 0; i < workout.exercises.length; i++) {
              const exercise = workout.exercises[i];
              
              // Create workout exercise
              const exerciseData = {
                workout_session_id: sessionId,
                exercise_id: exercise.id || exercise.exerciseId?.toString() || 'unknown',
                user_id: `temp-user-${userId}`,
                exercise_order: i + 1,
                exercise_notes: exercise.notes || null,
                total_volume_lbs: exercise.totalVolume || 0,
                total_sets_completed: exercise.completedSets || 0,
              };
              
              const { data: exerciseResult, error: exerciseError } = await supabase
                .from('workout_exercises')
                .upsert(exerciseData)
                .select('id')
                .single();
              
              if (exerciseError) {
                console.error(`   ❌ Error creating exercise:`, exerciseError);
                continue;
              }
              
              const workoutExerciseId = exerciseResult.id;
              
              // Migrate sets for this exercise
              if (exercise.sets && exercise.sets.length > 0) {
                for (let j = 0; j < exercise.sets.length; j++) {
                  const set = exercise.sets[j];
                  
                  const setData = {
                    workout_exercise_id: workoutExerciseId,
                    user_id: `temp-user-${userId}`,
                    set_number: set.setNumber || j + 1,
                    reps: set.reps || 0,
                    weight_lbs: set.weight || 0,
                    form_score: set.formScore || null,
                    is_completed: set.completed !== false,
                    equipment_used: set.equipment || null,
                    completed_at: set.timestamp || workout.endTime || workout.startTime,
                  };
                  
                  const { error: setError } = await supabase
                    .from('workout_sets')
                    .upsert(setData);
                  
                  if (setError) {
                    console.error(`   ❌ Error creating set:`, setError);
                  }
                }
              }
            }
          }
          
          console.log(`   ✅ Migrated session ${workout.id}`);
          
        } catch (error) {
          console.error(`   ❌ Error migrating session ${workout.id}:`, error);
        }
      }
      
      console.log(`✅ User ${userId} migration complete`);
    }
    
  } catch (error) {
    console.error('❌ User workout migration failed:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting FitForge Supabase Migration...\n');
  
  try {
    // Test connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('❌ Failed to connect to Supabase:', error);
      return;
    }
    
    console.log('✅ Connected to Supabase successfully\n');
    
    // Run migrations
    await migrateExerciseDatabase();
    console.log('');
    
    await migrateAchievements();
    console.log('');
    
    await migrateUserWorkouts();
    console.log('');
    
    console.log('🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Create your Supabase project at https://supabase.com');
    console.log('2. Run the schema SQL in the Supabase SQL editor');
    console.log('3. Set up your .env file with Supabase credentials');
    console.log('4. Run this migration script to populate data');
    console.log('5. Update FitForge to use Supabase instead of file storage');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}