// Import script for converting Excel exercise database to PostgreSQL

export const exerciseDatabase = [
  // CHEST EXERCISES
  {
    exerciseName: "Bench Press",
    equipmentType: "Barbell",
    category: "Compound",
    movementType: "Push",
    primaryMuscles: [
      { muscle: "Pectoralis Major", percentage: 60 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 30 },
      { muscle: "Anterior Deltoids", percentage: 10 }
    ],
    stabilizingMuscles: [
      { muscle: "Core", percentage: 5 },
      { muscle: "Serratus Anterior", percentage: 5 }
    ],
    equipment: ["Barbell", "Bench", "Rack"],
    variations: ["Wide Grip", "Close Grip", "Pause Rep", "Touch and Go"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Incline Bench Press",
    equipmentType: "Barbell",
    category: "Compound",
    movementType: "Push",
    primaryMuscles: [
      { muscle: "Pectoralis Major (Upper)", percentage: 65 }
    ],
    secondaryMuscles: [
      { muscle: "Anterior Deltoids", percentage: 25 },
      { muscle: "Triceps Brachii", percentage: 10 }
    ],
    equipment: ["Barbell", "Incline Bench", "Rack"],
    variations: ["30°", "45°", "60°"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Dumbbell Press",
    equipmentType: "Dumbbell",
    category: "Compound",
    movementType: "Push",
    primaryMuscles: [
      { muscle: "Pectoralis Major", percentage: 65 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 25 },
      { muscle: "Anterior Deltoids", percentage: 10 }
    ],
    stabilizingMuscles: [
      { muscle: "Core", percentage: 10 }
    ],
    equipment: ["Dumbbells", "Bench"],
    variations: ["Flat", "Incline", "Decline", "Neutral Grip"],
    difficulty: "Beginner"
  },

  // BACK EXERCISES
  {
    exerciseName: "Deadlift",
    equipmentType: "Barbell",
    category: "Compound",
    movementType: "Pull",
    primaryMuscles: [
      { muscle: "Erector Spinae", percentage: 25 },
      { muscle: "Glutes", percentage: 25 },
      { muscle: "Hamstrings", percentage: 20 }
    ],
    secondaryMuscles: [
      { muscle: "Trapezius", percentage: 15 },
      { muscle: "Rhomboids", percentage: 10 },
      { muscle: "Quadriceps", percentage: 5 }
    ],
    stabilizingMuscles: [
      { muscle: "Core", percentage: 15 },
      { muscle: "Grip/Forearms", percentage: 10 }
    ],
    equipment: ["Barbell", "Plates"],
    variations: ["Conventional", "Sumo", "Romanian", "Stiff-Legged"],
    difficulty: "Advanced"
  },
  {
    exerciseName: "Pull-ups",
    equipmentType: "Bodyweight",
    category: "Compound",
    movementType: "Pull",
    primaryMuscles: [
      { muscle: "Latissimus Dorsi", percentage: 65 }
    ],
    secondaryMuscles: [
      { muscle: "Biceps Brachii", percentage: 20 },
      { muscle: "Rhomboids", percentage: 10 },
      { muscle: "Middle Trapezius", percentage: 5 }
    ],
    equipment: ["Pull-up Bar"],
    variations: ["Wide Grip", "Close Grip", "Neutral Grip", "Weighted"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Bent Over Row",
    equipmentType: "Barbell",
    category: "Compound",
    movementType: "Pull",
    primaryMuscles: [
      { muscle: "Rhomboids", percentage: 30 },
      { muscle: "Middle Trapezius", percentage: 25 },
      { muscle: "Latissimus Dorsi", percentage: 25 }
    ],
    secondaryMuscles: [
      { muscle: "Biceps Brachii", percentage: 15 },
      { muscle: "Rear Deltoids", percentage: 5 }
    ],
    equipment: ["Barbell"],
    variations: ["Overhand", "Underhand", "Pendlay", "Yates"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "T-Row",
    equipmentType: "Machine",
    category: "Compound",
    movementType: "Pull",
    primaryMuscles: [
      { muscle: "Rhomboids", percentage: 35 },
      { muscle: "Middle Trapezius", percentage: 30 },
      { muscle: "Latissimus Dorsi", percentage: 20 }
    ],
    secondaryMuscles: [
      { muscle: "Biceps Brachii", percentage: 10 },
      { muscle: "Rear Deltoids", percentage: 5 }
    ],
    equipment: ["T-Bar Row Machine", "Barbell", "V-Handle"],
    variations: ["Wide Grip", "Close Grip", "Single Arm"],
    difficulty: "Intermediate"
  },

  // SHOULDER EXERCISES
  {
    exerciseName: "Shoulder Press",
    equipmentType: "Barbell",
    category: "Compound",
    movementType: "Push",
    primaryMuscles: [
      { muscle: "Anterior Deltoids", percentage: 40 },
      { muscle: "Lateral Deltoids", percentage: 30 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 20 },
      { muscle: "Upper Trapezius", percentage: 10 }
    ],
    equipment: ["Barbell", "Rack"],
    variations: ["Military", "Behind Neck", "Push Press"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Lateral Raises",
    equipmentType: "Dumbbell",
    category: "Isolation",
    movementType: "Push",
    primaryMuscles: [
      { muscle: "Lateral Deltoids", percentage: 80 }
    ],
    secondaryMuscles: [
      { muscle: "Anterior Deltoids", percentage: 10 },
      { muscle: "Upper Trapezius", percentage: 10 }
    ],
    equipment: ["Dumbbells"],
    variations: ["Standing", "Seated", "Cable", "Leaning"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Face Pulls",
    equipmentType: "Cable",
    category: "Isolation",
    movementType: "Pull",
    primaryMuscles: [
      { muscle: "Rear Deltoids", percentage: 50 },
      { muscle: "Rhomboids", percentage: 30 }
    ],
    secondaryMuscles: [
      { muscle: "Middle Trapezius", percentage: 15 },
      { muscle: "External Rotators", percentage: 5 }
    ],
    equipment: ["Cable Machine", "Rope Attachment"],
    variations: ["High to Low", "Eye Level", "Low to High"],
    difficulty: "Beginner"
  },

  // LEG EXERCISES
  {
    exerciseName: "Squat",
    equipmentType: "Barbell",
    category: "Compound",
    movementType: "Legs",
    primaryMuscles: [
      { muscle: "Quadriceps", percentage: 40 },
      { muscle: "Glutes", percentage: 30 }
    ],
    secondaryMuscles: [
      { muscle: "Hamstrings", percentage: 20 },
      { muscle: "Core", percentage: 10 }
    ],
    equipment: ["Barbell", "Rack"],
    variations: ["Back Squat", "Front Squat", "Box Squat", "Pause Squat"],
    difficulty: "Advanced"
  },
  {
    exerciseName: "Romanian Deadlift",
    equipmentType: "Barbell",
    category: "Compound",
    movementType: "Legs",
    primaryMuscles: [
      { muscle: "Hamstrings", percentage: 50 },
      { muscle: "Glutes", percentage: 30 }
    ],
    secondaryMuscles: [
      { muscle: "Erector Spinae", percentage: 15 },
      { muscle: "Upper Back", percentage: 5 }
    ],
    equipment: ["Barbell"],
    variations: ["Conventional", "Snatch Grip", "Deficit", "Single Leg"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Goblet Squat",
    equipmentType: "Dumbbell",
    category: "Compound",
    movementType: "Legs",
    primaryMuscles: [
      { muscle: "Quadriceps", percentage: 45 },
      { muscle: "Glutes", percentage: 35 }
    ],
    secondaryMuscles: [
      { muscle: "Core", percentage: 15 },
      { muscle: "Upper Back", percentage: 5 }
    ],
    equipment: ["Dumbbell", "Kettlebell"],
    variations: ["Standard", "Pulse", "1.5 Rep", "Paused"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Calf Raises",
    equipmentType: "Machine",
    category: "Isolation",
    movementType: "Legs",
    primaryMuscles: [
      { muscle: "Gastrocnemius", percentage: 70 },
      { muscle: "Soleus", percentage: 30 }
    ],
    equipment: ["Calf Raise Machine", "Smith Machine", "Dumbbells"],
    variations: ["Standing", "Seated", "Single Leg", "Donkey"],
    difficulty: "Beginner"
  },

  // ARM EXERCISES
  {
    exerciseName: "Barbell Curl",
    equipmentType: "Barbell",
    category: "Isolation",
    movementType: "Pull",
    primaryMuscles: [
      { muscle: "Biceps Brachii", percentage: 85 }
    ],
    secondaryMuscles: [
      { muscle: "Brachialis", percentage: 10 },
      { muscle: "Forearms", percentage: 5 }
    ],
    equipment: ["Barbell", "EZ-Bar"],
    variations: ["Straight Bar", "EZ-Bar", "Wide Grip", "Close Grip"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Tricep Extension",
    equipmentType: "Dumbbell",
    category: "Isolation",
    movementType: "Push",
    primaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 90 }
    ],
    secondaryMuscles: [
      { muscle: "Anconeus", percentage: 10 }
    ],
    equipment: ["Dumbbells", "Barbell", "Cable"],
    variations: ["Overhead", "Lying", "Single Arm", "Cable"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Close Grip Bench Press",
    equipmentType: "Barbell",
    category: "Compound",
    movementType: "Push",
    primaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 60 }
    ],
    secondaryMuscles: [
      { muscle: "Pectoralis Major", percentage: 30 },
      { muscle: "Anterior Deltoids", percentage: 10 }
    ],
    equipment: ["Barbell", "Bench"],
    variations: ["Flat", "Incline", "Decline"],
    difficulty: "Intermediate"
  },

  // CORE EXERCISES
  {
    exerciseName: "Plank",
    equipmentType: "Bodyweight",
    category: "Isolation",
    movementType: "Core",
    primaryMuscles: [
      { muscle: "Rectus Abdominis", percentage: 30 },
      { muscle: "Transverse Abdominis", percentage: 40 }
    ],
    secondaryMuscles: [
      { muscle: "Obliques", percentage: 20 },
      { muscle: "Erector Spinae", percentage: 10 }
    ],
    equipment: ["None"],
    variations: ["Standard", "Side", "RKC", "Long Lever"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Spider Plank",
    equipmentType: "Bodyweight",
    category: "Isolation",
    movementType: "Core",
    primaryMuscles: [
      { muscle: "Obliques", percentage: 40 },
      { muscle: "Rectus Abdominis", percentage: 30 }
    ],
    secondaryMuscles: [
      { muscle: "Hip Flexors", percentage: 20 },
      { muscle: "Transverse Abdominis", percentage: 10 }
    ],
    equipment: ["None"],
    variations: ["Alternating", "Hold", "Cross Body"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Hanging Knee Raises",
    equipmentType: "Bodyweight",
    category: "Isolation",
    movementType: "Core",
    primaryMuscles: [
      { muscle: "Rectus Abdominis", percentage: 50 },
      { muscle: "Hip Flexors", percentage: 30 }
    ],
    secondaryMuscles: [
      { muscle: "Obliques", percentage: 15 },
      { muscle: "Grip/Forearms", percentage: 5 }
    ],
    equipment: ["Pull-up Bar"],
    variations: ["Bent Knee", "Straight Leg", "Windshield Wipers"],
    difficulty: "Intermediate"
  },

  // FUNCTIONAL/TRX EXERCISES
  {
    exerciseName: "TRX Push-up",
    equipmentType: "TRX",
    category: "Compound",
    movementType: "Push",
    primaryMuscles: [
      { muscle: "Pectoralis Major", percentage: 50 },
      { muscle: "Core", percentage: 25 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 15 },
      { muscle: "Anterior Deltoids", percentage: 10 }
    ],
    equipment: ["TRX Straps"],
    variations: ["Standard", "Decline", "Atomic", "Wide Grip"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "TRX Row",
    equipmentType: "TRX",
    category: "Compound",
    movementType: "Pull",
    primaryMuscles: [
      { muscle: "Rhomboids", percentage: 35 },
      { muscle: "Latissimus Dorsi", percentage: 30 }
    ],
    secondaryMuscles: [
      { muscle: "Biceps Brachii", percentage: 20 },
      { muscle: "Core", percentage: 15 }
    ],
    equipment: ["TRX Straps"],
    variations: ["Standard", "Single Arm", "Wide Grip", "Feet Elevated"],
    difficulty: "Beginner"
  },

  // KETTLEBELL EXERCISES
  {
    exerciseName: "Kettlebell Swing",
    equipmentType: "Kettlebell",
    category: "Compound",
    movementType: "Legs",
    primaryMuscles: [
      { muscle: "Glutes", percentage: 40 },
      { muscle: "Hamstrings", percentage: 30 }
    ],
    secondaryMuscles: [
      { muscle: "Core", percentage: 20 },
      { muscle: "Shoulders", percentage: 10 }
    ],
    equipment: ["Kettlebell"],
    variations: ["Russian", "American", "Single Arm", "Double"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Turkish Get-up",
    equipmentType: "Kettlebell",
    category: "Compound",
    movementType: "Full Body",
    primaryMuscles: [
      { muscle: "Core", percentage: 30 },
      { muscle: "Shoulders", percentage: 25 }
    ],
    secondaryMuscles: [
      { muscle: "Glutes", percentage: 20 },
      { muscle: "Quadriceps", percentage: 15 },
      { muscle: "Triceps", percentage: 10 }
    ],
    equipment: ["Kettlebell", "Dumbbell"],
    variations: ["Half", "Full", "Reverse", "Weighted"],
    difficulty: "Advanced"
  }
];

// Function to import exercises to database
export async function importExercises(db: any) {
  console.log(`Importing ${exerciseDatabase.length} exercises...`);
  
  for (const exercise of exerciseDatabase) {
    try {
      await db.insert(exerciseLibrary).values(exercise);
      console.log(`✓ Imported: ${exercise.exerciseName}`);
    } catch (error) {
      console.error(`✗ Failed to import ${exercise.exerciseName}:`, error);
    }
  }
  
  console.log("Exercise import complete!");
}

// Analytics calculations from your Excel formulas
export const analyticsFormulas = {
  // Volume calculations
  calculateTotalVolume: (sets: any[]) => {
    return sets.reduce((total, set) => {
      if (!set.isWarmup) {
        return total + (set.weight * set.reps);
      }
      return total;
    }, 0);
  },
  
  // 1RM estimation (Epley formula)
  calculate1RM: (weight: number, reps: number) => {
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  },
  
  // Push/Pull ratio
  calculatePushPullRatio: (sessions: any[]) => {
    let pushVolume = 0;
    let pullVolume = 0;
    
    sessions.forEach(session => {
      session.exercisePerformance.forEach((exercise: any) => {
        const exerciseInfo = exerciseDatabase.find(e => e.exerciseName === exercise.name);
        if (exerciseInfo?.movementType === 'Push') {
          pushVolume += calculateTotalVolume(exercise.sets);
        } else if (exerciseInfo?.movementType === 'Pull') {
          pullVolume += calculateTotalVolume(exercise.sets);
        }
      });
    });
    
    return pullVolume > 0 ? pushVolume / pullVolume : 0;
  },
  
  // Muscle group volume distribution
  calculateMuscleGroupVolume: (sessions: any[]) => {
    const muscleVolumes: { [key: string]: number } = {};
    
    sessions.forEach(session => {
      session.exercisePerformance.forEach((exercise: any) => {
        const exerciseInfo = exerciseDatabase.find(e => e.exerciseName === exercise.name);
        const volume = calculateTotalVolume(exercise.sets);
        
        exerciseInfo?.primaryMuscles.forEach(muscle => {
          const muscleVolume = volume * (muscle.percentage / 100);
          muscleVolumes[muscle.muscle] = (muscleVolumes[muscle.muscle] || 0) + muscleVolume;
        });
      });
    });
    
    return muscleVolumes;
  }
};