#!/usr/bin/env tsx

import { exerciseDatabase } from './import-exercise-database';
import { storage } from '../server/storage';

// Enhanced workout templates based on your exercise preferences
const workoutTemplates = [
  {
    name: "Push Day - Chest Focus",
    description: "Comprehensive push day targeting chest, shoulders, and triceps",
    workoutType: "Push",
    targetMuscles: ["Chest", "Shoulders", "Triceps"],
    exercises: [
      {
        exerciseName: "Bench Press",
        targetSets: 4,
        targetReps: "8-10",
        restTime: 180,
        notes: "Focus on controlled eccentric, pause at chest"
      },
      {
        exerciseName: "Incline Bench Press", 
        targetSets: 3,
        targetReps: "10-12",
        restTime: 120,
        notes: "30° incline, full range of motion"
      },
      {
        exerciseName: "Dumbbell Press",
        targetSets: 3,
        targetReps: "12-15",
        restTime: 90,
        notes: "Squeeze at top, slow negative"
      },
      {
        exerciseName: "Shoulder Press",
        targetSets: 3,
        targetReps: "10-12", 
        restTime: 120,
        notes: "Military style, strict form"
      },
      {
        exerciseName: "Lateral Raises",
        targetSets: 3,
        targetReps: "15-20",
        restTime: 60,
        notes: "Light weight, focus on mind-muscle connection"
      },
      {
        exerciseName: "Close Grip Bench Press",
        targetSets: 3,
        targetReps: "10-12",
        restTime: 120,
        notes: "Tricep focused, hands shoulder-width apart"
      }
    ],
    estimatedDuration: 75,
    difficultyLevel: "Intermediate"
  },
  {
    name: "Pull Day - Back Focus", 
    description: "Complete pull day for back, biceps, and rear delts",
    workoutType: "Pull",
    targetMuscles: ["Back", "Biceps", "Rear Delts"],
    exercises: [
      {
        exerciseName: "Deadlift",
        targetSets: 4,
        targetReps: "5-6",
        restTime: 240,
        notes: "Conventional stance, maintain neutral spine"
      },
      {
        exerciseName: "Pull-ups",
        targetSets: 4,
        targetReps: "8-12",
        restTime: 180,
        notes: "Full dead hang, chin over bar"
      },
      {
        exerciseName: "Bent Over Row",
        targetSets: 4,
        targetReps: "8-10",
        restTime: 150,
        notes: "45° torso angle, squeeze shoulder blades"
      },
      {
        exerciseName: "T-Row",
        targetSets: 3,
        targetReps: "12-15",
        restTime: 120,
        notes: "Wide grip, focus on rhomboids"
      },
      {
        exerciseName: "Face Pulls",
        targetSets: 3,
        targetReps: "15-20",
        restTime: 90,
        notes: "High rep, external rotation focus"
      },
      {
        exerciseName: "Barbell Curl",
        targetSets: 3,
        targetReps: "10-12",
        restTime: 90,
        notes: "Strict form, no swinging"
      }
    ],
    estimatedDuration: 80,
    difficultyLevel: "Advanced"
  },
  {
    name: "Leg Day - Compound Focus",
    description: "Heavy compound movements for maximum leg development", 
    workoutType: "Legs",
    targetMuscles: ["Quadriceps", "Hamstrings", "Glutes", "Calves"],
    exercises: [
      {
        exerciseName: "Squat",
        targetSets: 5,
        targetReps: "6-8",
        restTime: 240,
        notes: "Below parallel, drive through heels"
      },
      {
        exerciseName: "Romanian Deadlift",
        targetSets: 4,
        targetReps: "8-10",
        restTime: 180,
        notes: "Hinge at hips, feel hamstring stretch"
      },
      {
        exerciseName: "Goblet Squat",
        targetSets: 3,
        targetReps: "15-20",
        restTime: 120,
        notes: "Goblet hold, ass to grass depth"
      },
      {
        exerciseName: "Calf Raises",
        targetSets: 4,
        targetReps: "15-20",
        restTime: 90,
        notes: "Full range, pause at top"
      }
    ],
    estimatedDuration: 60,
    difficultyLevel: "Advanced"
  }
];

async function setupDatabase() {
  console.log("🚀 Setting up FitForge database with exercise library...");
  
  try {
    // Import exercise database
    console.log(`📚 Importing ${exerciseDatabase.length} exercises...`);
    for (const exercise of exerciseDatabase) {
      try {
        // Check if exercise already exists
        const existing = await storage.db
          .select()
          .from(storage.exerciseLibrary)
          .where(storage.eq(storage.exerciseLibrary.exerciseName, exercise.exerciseName))
          .limit(1);
          
        if (existing.length === 0) {
          await storage.db.insert(storage.exerciseLibrary).values(exercise);
          console.log(`✓ Imported: ${exercise.exerciseName}`);
        } else {
          console.log(`⏭️  Skipped: ${exercise.exerciseName} (already exists)`);
        }
      } catch (error) {
        console.error(`✗ Failed to import ${exercise.exerciseName}:`, error);
      }
    }
    
    // Import workout templates  
    console.log(`💪 Creating ${workoutTemplates.length} workout templates...`);
    for (const template of workoutTemplates) {
      try {
        const existing = await storage.db
          .select()
          .from(storage.workoutTemplates)
          .where(storage.eq(storage.workoutTemplates.name, template.name))
          .limit(1);
          
        if (existing.length === 0) {
          await storage.db.insert(storage.workoutTemplates).values({
            ...template,
            userId: null, // Public templates
            isPublic: true,
            exercises: template.exercises
          });
          console.log(`✓ Created: ${template.name}`);
        } else {
          console.log(`⏭️  Skipped: ${template.name} (already exists)`);
        }
      } catch (error) {
        console.error(`✗ Failed to create ${template.name}:`, error);
      }
    }
    
    console.log("🎉 Database setup complete!");
    console.log("📊 Summary:");
    console.log(`   - ${exerciseDatabase.length} exercises available`);
    console.log(`   - ${workoutTemplates.length} workout templates created`);
    console.log(`   - Ready for workout tracking!`);
    
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

// Auto-run setup if called directly
setupDatabase();

export { setupDatabase };