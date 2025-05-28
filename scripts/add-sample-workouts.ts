import { storage } from '../server/storage';

// Sample workouts based on your exercise preferences
const sampleWorkouts = [
  {
    userId: 1, // Will assign to test user or admin
    name: "Push Day - Chest Focus",
    description: "Comprehensive push day targeting chest, shoulders, and triceps with compound movements",
    category: "strength",
    difficulty: "intermediate", 
    duration: 75,
    calories: 420,
    equipment: ["barbell", "dumbbells", "bench", "rack"],
    exercises: [
      {
        name: "Bench Press",
        sets: 4,
        reps: 8,
        weight: 185,
        notes: "Focus on controlled eccentric, pause at chest"
      },
      {
        name: "Incline Bench Press",
        sets: 3, 
        reps: 10,
        weight: 155,
        notes: "30° incline, full range of motion"
      },
      {
        name: "Dumbbell Press",
        sets: 3,
        reps: 12,
        weight: 65,
        notes: "Squeeze at top, slow negative"
      },
      {
        name: "Shoulder Press", 
        sets: 3,
        reps: 10,
        weight: 115,
        notes: "Military style, strict form"
      },
      {
        name: "Lateral Raises",
        sets: 3,
        reps: 15,
        weight: 20,
        notes: "Light weight, focus on mind-muscle connection"
      },
      {
        name: "Close Grip Bench Press",
        sets: 3,
        reps: 10,
        weight: 135,
        notes: "Tricep focused, hands shoulder-width apart"
      }
    ]
  },
  {
    userId: 1,
    name: "Pull Day - Back Focus",
    description: "Complete pull day for back, biceps, and rear delts with heavy compounds",
    category: "strength",
    difficulty: "advanced",
    duration: 80,
    calories: 450,
    equipment: ["barbell", "pull-up bar", "cable machine"],
    exercises: [
      {
        name: "Deadlift",
        sets: 4,
        reps: 5,
        weight: 315,
        notes: "Conventional stance, maintain neutral spine"
      },
      {
        name: "Pull-ups",
        sets: 4,
        reps: 10,
        weight: 0,
        notes: "Full dead hang, chin over bar"
      },
      {
        name: "Bent Over Row",
        sets: 4,
        reps: 8,
        weight: 185,
        notes: "45° torso angle, squeeze shoulder blades"
      },
      {
        name: "T-Bar Row",
        sets: 3,
        reps: 12,
        weight: 90,
        notes: "Wide grip, focus on rhomboids"
      },
      {
        name: "Face Pulls",
        sets: 3,
        reps: 20,
        weight: 40,
        notes: "High rep, external rotation focus"
      },
      {
        name: "Barbell Curl",
        sets: 3,
        reps: 10,
        weight: 85,
        notes: "Strict form, no swinging"
      }
    ]
  },
  {
    userId: 1,
    name: "Leg Day - Compound Focus", 
    description: "Heavy compound movements for maximum leg development",
    category: "strength",
    difficulty: "advanced",
    duration: 60,
    calories: 380,
    equipment: ["barbell", "rack", "dumbbells"],
    exercises: [
      {
        name: "Squat",
        sets: 5,
        reps: 6,
        weight: 275,
        notes: "Below parallel, drive through heels"
      },
      {
        name: "Romanian Deadlift",
        sets: 4,
        reps: 8,
        weight: 225,
        notes: "Hinge at hips, feel hamstring stretch"
      },
      {
        name: "Goblet Squat",
        sets: 3,
        reps: 15,
        weight: 50,
        notes: "Goblet hold, ass to grass depth"
      },
      {
        name: "Calf Raises",
        sets: 4,
        reps: 20,
        weight: 45,
        notes: "Full range, pause at top"
      }
    ]
  }
];

async function addSampleWorkouts() {
  console.log("💪 Adding sample workout templates...");
  
  try {
    for (const workout of sampleWorkouts) {
      const created = await storage.createWorkout(workout as any);
      console.log(`✓ Created: ${created.name}`);
    }
    
    console.log("🎉 Sample workouts added successfully!");
    console.log("📋 Available workouts:");
    
    const allWorkouts = await storage.getWorkouts();
    allWorkouts.forEach(w => {
      console.log(`   - ${w.name} (${w.difficulty}, ${w.duration}min)`);
    });
    
  } catch (error) {
    console.error("❌ Failed to add sample workouts:", error);
  }
}

addSampleWorkouts();