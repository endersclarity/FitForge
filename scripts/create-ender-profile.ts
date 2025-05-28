// Ender's profile with workout formulas referencing global exercise library IDs
import { enderExerciseDatabase } from './ender-real-exercises.js';

// Map exercise names to their future database IDs (1-indexed)
const exerciseNameToId: Record<string, number> = {};
enderExerciseDatabase.forEach((exercise, index) => {
  exerciseNameToId[exercise.exerciseName] = index + 1;
});

// Ender's complete user profile
export const enderProfile = {
  // Basic profile info
  username: "ender",
  email: "endersclarity@gmail.com", 
  firstName: "Ender",
  lastName: "Smith",
  
  // Training background
  experienceLevel: "Advanced",
  primaryGoals: ["Strength", "Hypertrophy", "Functional"],
  preferredEquipment: ["Barbell", "Dumbbell", "Kettlebell", "TRX", "Bodyweight"],
  
  // Workout formulas - exercise IDs organized by workout type
  workoutFormulas: {
    "Abs": [
      exerciseNameToId["Planks"],              // 1
      exerciseNameToId["Spider Planks"],        // 2  
      exerciseNameToId["Bench Situps"],         // 3
      exerciseNameToId["Hanging Knee Raises"]   // 4
    ],
    "BackBiceps": [
      exerciseNameToId["Shoulder Shrugs"],      // 5
      exerciseNameToId["T Row"],                // 6
      exerciseNameToId["Incline Hammer Curl"],  // 7
      exerciseNameToId["Neutral Grip Pull-ups"], // 8
      exerciseNameToId["Bent Over Rows"]        // 9
    ],
    "ChestTriceps": [
      exerciseNameToId["Bench Press"],          // 10
      exerciseNameToId["TRX Reverse Flys"],     // 11
      exerciseNameToId["Tricep Extension"],     // 12
      exerciseNameToId["TRX Pushup"],          // 13
      exerciseNameToId["Incline Bench Press"], // 14
      exerciseNameToId["Shoulder Press"],       // 15
      exerciseNameToId["Dips"]                 // 16
    ],
    "Legs": [
      exerciseNameToId["Goblet Squats"],        // 17
      exerciseNameToId["Dead Lifts"],           // 18
      exerciseNameToId["Calf Raises"],          // 19
      exerciseNameToId["Glute Bridges"],        // 20
      exerciseNameToId["Kettlebell Swings"]     // 21
    ]
  },
  
  // Personal exercise preferences by exercise ID
  exercisePreferences: {
    // ABS
    [exerciseNameToId["Planks"]]: { 
      weight: "bodyweight", reps: 1, sets: 3, restTime: "0:30",
      notes: "Hold for 60+ seconds, focus on form" 
    },
    [exerciseNameToId["Spider Planks"]]: { 
      weight: 1, reps: 2, sets: 3, restTime: "1:00",
      notes: "Bench variation, controlled movement" 
    },
    [exerciseNameToId["Bench Situps"]]: { 
      weight: 5, reps: 3, sets: 3, restTime: "1:30",
      notes: "TRX assisted, full range of motion" 
    },
    [exerciseNameToId["Hanging Knee Raises"]]: { 
      weight: 10, reps: 4, sets: 3, restTime: "2:00",
      notes: "Focus on controlled negatives" 
    },
    
    // BACK & BICEPS
    [exerciseNameToId["Shoulder Shrugs"]]: { 
      weight: 15, reps: 5, sets: 3, restTime: "2:30",
      notes: "Dumbbell variation, squeeze at top" 
    },
    [exerciseNameToId["T Row"]]: { 
      weight: 20, reps: 6, sets: 3, restTime: "3:00",
      notes: "OYA setup, focus on lat activation" 
    },
    [exerciseNameToId["Incline Hammer Curl"]]: { 
      weight: 25, reps: 7, sets: 3, restTime: "3:30",
      notes: "Pull-up bar alternative, strict form" 
    },
    [exerciseNameToId["Neutral Grip Pull-ups"]]: { 
      weight: 30, reps: 8, sets: 3, restTime: "4:00",
      notes: "Countertop variation when needed" 
    },
    [exerciseNameToId["Bent Over Rows"]]: { 
      weight: 35, reps: 9, sets: 3, restTime: "4:30",
      notes: "Plybox setup, barbell preferred" 
    },
    
    // CHEST & TRICEPS  
    [exerciseNameToId["Bench Press"]]: { 
      weight: 80, reps: 18, sets: 4, restTime: "9:00",
      notes: "Main compound movement, progressive overload" 
    },
    [exerciseNameToId["TRX Reverse Flys"]]: { 
      weight: 85, reps: 19, sets: 3, restTime: "9:30",
      notes: "Rear delt focus, controlled movement" 
    },
    [exerciseNameToId["Tricep Extension"]]: { 
      weight: 90, reps: 20, sets: 3, restTime: "10:00",
      notes: "Dumbbell variation, full range" 
    },
    [exerciseNameToId["TRX Pushup"]]: { 
      weight: 95, reps: 21, sets: 3, restTime: "10:30",
      notes: "Instability training, core engagement" 
    },
    [exerciseNameToId["Incline Bench Press"]]: { 
      weight: 125, reps: 27, sets: 4, restTime: "11:00",
      notes: "Upper chest focus, 30-45 degree angle" 
    },
    [exerciseNameToId["Shoulder Press"]]: { 
      weight: 130, reps: 28, sets: 3, restTime: "11:30",
      notes: "Barbell preferred, strict press" 
    },
    [exerciseNameToId["Dips"]]: { 
      weight: 135, reps: 29, sets: 3, restTime: "12:00",
      notes: "Bodyweight, focus on tricep activation" 
    },
    
    // LEGS
    [exerciseNameToId["Goblet Squats"]]: { 
      weight: 150, reps: 32, sets: 3, restTime: "12:30",
      notes: "Kettlebell variation, full depth" 
    },
    [exerciseNameToId["Dead Lifts"]]: { 
      weight: 155, reps: 33, sets: 4, restTime: "13:00",
      notes: "Main compound movement, proper form critical" 
    },
    [exerciseNameToId["Calf Raises"]]: { 
      weight: 160, reps: 34, sets: 3, restTime: "13:30",
      notes: "Bodyweight, focus on full range" 
    },
    [exerciseNameToId["Glute Bridges"]]: { 
      weight: 165, reps: 35, sets: 3, restTime: "14:00",
      notes: "Bodyweight variation, glute activation" 
    },
    [exerciseNameToId["Kettlebell Swings"]]: { 
      weight: 180, reps: 38, sets: 3, restTime: "14:30",
      notes: "Full body movement, hip hinge focus" 
    }
  }
};

// Workout routine queries for Ender's profile
export const enderWorkoutQueries = {
  getAbsWorkout: () => enderProfile.workoutFormulas["Abs"],
  getBackBicepsWorkout: () => enderProfile.workoutFormulas["BackBiceps"], 
  getChestTricepsWorkout: () => enderProfile.workoutFormulas["ChestTriceps"],
  getLegsWorkout: () => enderProfile.workoutFormulas["Legs"],
  
  // Get exercise preferences for a specific exercise ID
  getExercisePrefs: (exerciseId: number) => enderProfile.exercisePreferences[exerciseId],
  
  // Get full workout with exercise details by workout type
  getFullWorkout: (workoutType: keyof typeof enderProfile.workoutFormulas) => {
    const exerciseIds = enderProfile.workoutFormulas[workoutType];
    return exerciseIds.map(id => ({
      exerciseId: id,
      preferences: enderProfile.exercisePreferences[id]
    }));
  }
};

console.log("Ender's Profile Summary:");
console.log("Workout Types:", Object.keys(enderProfile.workoutFormulas));
Object.entries(enderProfile.workoutFormulas).forEach(([type, exercises]) => {
  console.log(`${type}: ${exercises.length} exercises`);
});
console.log(`Total exercise preferences: ${Object.keys(enderProfile.exercisePreferences).length}`);