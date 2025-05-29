// Ender's Real Exercise Database - Parsed from Excel data
export const enderExerciseDatabase = [
  // ABS WORKOUT
  {
    exerciseName: "Planks",
    equipmentType: "Bodyweight",
    category: "Isolation",
    movementType: "Core",
    workoutType: "Abs",
    variation: "A",
    weight: "Bodyweight",
    restTime: "0:30",
    reps: 1,
    primaryMuscles: [
      { muscle: "Rectus Abdominis", percentage: 65 },
      { muscle: "Transverse Abdominis", percentage: 40 }
    ],
    secondaryMuscles: [
      { muscle: "Obliques", percentage: 20 },
      { muscle: "Erector Spinae", percentage: 10 }
    ],
    equipment: ["None"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Spider Planks",
    equipmentType: "Bench",
    category: "Isolation", 
    movementType: "Core",
    workoutType: "Abs",
    variation: "A",
    weight: 1,
    restTime: "1:00",
    reps: 2,
    primaryMuscles: [
      { muscle: "Rectus Abdominis", percentage: 60 },
      { muscle: "Transverse Abdominis", percentage: 30 }
    ],
    secondaryMuscles: [
      { muscle: "Obliques", percentage: 30 },
      { muscle: "Erector Spinae", percentage: 10 },
      { muscle: "Shoulders", percentage: 10 }
    ],
    equipment: ["Bench"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Bench Situps",
    equipmentType: "TRX",
    category: "Isolation",
    movementType: "Core", 
    workoutType: "Abs",
    variation: "A",
    weight: 5,
    restTime: "1:30",
    reps: 3,
    primaryMuscles: [
      { muscle: "Rectus Abdominis", percentage: 60 }
    ],
    secondaryMuscles: [
      { muscle: "Hip Flexors", percentage: 25 },
      { muscle: "Obliques", percentage: 15 }
    ],
    equipment: ["TRX", "Bench"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Hanging Knee Raises",
    equipmentType: "Kettlebell",
    category: "Isolation",
    movementType: "Core",
    workoutType: "Abs", 
    variation: "A",
    weight: 10,
    restTime: "2:00",
    reps: 4,
    primaryMuscles: [
      { muscle: "Rectus Abdominis", percentage: 80 }
    ],
    secondaryMuscles: [
      { muscle: "Hip Flexors", percentage: 23 },
      { muscle: "Obliques", percentage: 40 },
      { muscle: "Grip/Forearms", percentage: 10 }
    ],
    equipment: ["Pull-up Bar"],
    difficulty: "Intermediate"
  },

  // BACK & BICEPS WORKOUT
  {
    exerciseName: "Shoulder Shrugs",
    equipmentType: "Dumbbell",
    category: "Isolation",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "A/B",
    weight: 15,
    restTime: "2:30", 
    reps: 5,
    primaryMuscles: [
      { muscle: "Trapezius", percentage: 80 }
    ],
    secondaryMuscles: [
      { muscle: "Levator Scapulae", percentage: 20 }
    ],
    equipment: ["Dumbbells"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "T Row",
    equipmentType: "OYA",
    category: "Compound",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "B", 
    weight: 20,
    restTime: "3:00",
    reps: 6,
    primaryMuscles: [
      { muscle: "Latissimus Dorsi", percentage: 85 }
    ],
    secondaryMuscles: [
      { muscle: "Rhomboids", percentage: 25 },
      { muscle: "Trapezius", percentage: 15 },
      { muscle: "Biceps Brachii", percentage: 12 },
      { muscle: "Grip/Forearms", percentage: 8 }
    ],
    equipment: ["T-Bar", "Barbell"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Incline Hammer Curl",
    equipmentType: "Pull-up Bar",
    category: "Isolation",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "B",
    weight: 25,
    restTime: "3:30",
    reps: 7,
    primaryMuscles: [
      { muscle: "Biceps Brachii", percentage: 70 }
    ],
    secondaryMuscles: [
      { muscle: "Brachialis", percentage: 20 },
      { muscle: "Brachioradialis", percentage: 10 },
      { muscle: "Grip/Forearms", percentage: 10 }
    ],
    equipment: ["Dumbbells", "Incline Bench"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Neutral Grip Pull-ups",
    equipmentType: "Countertop",
    category: "Compound",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "B",
    weight: 30,
    restTime: "4:00",
    reps: 8,
    primaryMuscles: [
      { muscle: "Latissimus Dorsi", percentage: 85 }
    ],
    secondaryMuscles: [
      { muscle: "Biceps Brachii", percentage: 25 },
      { muscle: "Rhomboids", percentage: 15 },
      { muscle: "Trapezius", percentage: 15 },
      { muscle: "Grip/Forearms", percentage: 10 }
    ],
    equipment: ["Pull-up Bar"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Bent Over Rows",
    equipmentType: "Plybox",
    category: "Compound",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "A",
    weight: 35,
    restTime: "4:30",
    reps: 9,
    primaryMuscles: [
      { muscle: "Latissimus Dorsi", percentage: 90 }
    ],
    secondaryMuscles: [
      { muscle: "Rhomboids", percentage: 25 },
      { muscle: "Trapezius", percentage: 20 },
      { muscle: "Biceps Brachii", percentage: 15 },
      { muscle: "Grip/Forearms", percentage: 10 }
    ],
    equipment: ["Barbell", "Dumbbells"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Row",
    equipmentType: "Cable",
    category: "Compound",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "B",
    weight: 40,
    restTime: "5:00",
    reps: 10,
    primaryMuscles: [
      { muscle: "Latissimus Dorsi", percentage: 85 }
    ],
    secondaryMuscles: [
      { muscle: "Rhomboids", percentage: 25 },
      { muscle: "Trapezius", percentage: 20 },
      { muscle: "Biceps Brachii", percentage: 15 },
      { muscle: "Core", percentage: 10 },
      { muscle: "Grip/Forearms", percentage: 10 }
    ],
    equipment: ["Cable Machine", "Resistance Band"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Renegade Rows",
    equipmentType: "Dumbbell",
    category: "Compound",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "A/B",
    weight: 45,
    restTime: "5:30",
    reps: 11,
    primaryMuscles: [
      { muscle: "Latissimus Dorsi", percentage: 70 }
    ],
    secondaryMuscles: [
      { muscle: "Rhomboids", percentage: 25 },
      { muscle: "Trapezius", percentage: 20 },
      { muscle: "Biceps Brachii", percentage: 15 },
      { muscle: "Core", percentage: 30 },
      { muscle: "Grip/Forearms", percentage: 10 }
    ],
    equipment: ["Dumbbells"],
    difficulty: "Advanced"
  },
  {
    exerciseName: "Single Arm Upright Row",
    equipmentType: "Dumbbell",
    category: "Isolation",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "A/B",
    weight: 50,
    restTime: "6:00",
    reps: 12,
    primaryMuscles: [
      { muscle: "Trapezius", percentage: 60 },
      { muscle: "Deltoids", percentage: 40 }
    ],
    secondaryMuscles: [
      { muscle: "Biceps Brachii", percentage: 20 },
      { muscle: "Core", percentage: 15 },
      { muscle: "Grip/Forearms", percentage: 10 }
    ],
    equipment: ["Dumbbells"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "TRX Bicep Curl",
    equipmentType: "TRX",
    category: "Isolation",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "A/B",
    weight: 55,
    restTime: "6:30",
    reps: 13,
    primaryMuscles: [
      { muscle: "Biceps Brachii", percentage: 80 }
    ],
    secondaryMuscles: [
      { muscle: "Brachialis", percentage: 15 },
      { muscle: "Brachioradialis", percentage: 5 },
      { muscle: "Core", percentage: 15 },
      { muscle: "Grip/Forearms", percentage: 10 }
    ],
    equipment: ["TRX"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Chin-Ups",
    equipmentType: "Pull-up Bar",
    category: "Compound",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "B",
    weight: 60,
    restTime: "7:00",
    reps: 14,
    primaryMuscles: [
      { muscle: "Latissimus Dorsi", percentage: 85 },
      { muscle: "Biceps Brachii", percentage: 30 }
    ],
    secondaryMuscles: [
      { muscle: "Rhomboids", percentage: 20 },
      { muscle: "Trapezius", percentage: 15 },
      { muscle: "Grip/Forearms", percentage: 10 }
    ],
    equipment: ["Pull-up Bar"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Face Pull",
    equipmentType: "Cable",
    category: "Isolation",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "A/B",
    weight: 65,
    restTime: "7:30",
    reps: 15,
    primaryMuscles: [
      { muscle: "Trapezius", percentage: 50 },
      { muscle: "Rhomboids", percentage: 40 }
    ],
    secondaryMuscles: [
      { muscle: "Rear Deltoids", percentage: 40 },
      { muscle: "Rotator Cuff", percentage: 15 }
    ],
    equipment: ["Cable Machine", "Resistance Band"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Concentration Curl",
    equipmentType: "Dumbbell",
    category: "Isolation",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "A",
    weight: 70,
    restTime: "8:00",
    reps: 16,
    primaryMuscles: [
      { muscle: "Biceps Brachii", percentage: 90 }
    ],
    secondaryMuscles: [
      { muscle: "Brachialis", percentage: 10 },
      { muscle: "Grip/Forearms", percentage: 10 }
    ],
    equipment: ["Dumbbells"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Wide Grip Pullups",
    equipmentType: "Pull-up Bar",
    category: "Compound",
    movementType: "Pull",
    workoutType: "BackBiceps",
    variation: "A",
    weight: 75,
    restTime: "8:30",
    reps: 17,
    primaryMuscles: [
      { muscle: "Latissimus Dorsi", percentage: 90 }
    ],
    secondaryMuscles: [
      { muscle: "Biceps Brachii", percentage: 20 },
      { muscle: "Rhomboids", percentage: 15 },
      { muscle: "Trapezius", percentage: 15 },
      { muscle: "Grip/Forearms", percentage: 10 }
    ],
    equipment: ["Pull-up Bar"],
    difficulty: "Advanced"
  },

  // CHEST & TRICEPS WORKOUT  
  {
    exerciseName: "Bench Press",
    equipmentType: "Barbell",
    category: "Compound",
    movementType: "Push",
    workoutType: "ChestTriceps",
    variation: "A",
    weight: 80,
    restTime: "9:00",
    reps: 18,
    primaryMuscles: [
      { muscle: "Pectoralis Major", percentage: 85 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 25 },
      { muscle: "Anterior Deltoids", percentage: 30 },
      { muscle: "Serratus Anterior", percentage: 10 }
    ],
    equipment: ["Barbell", "Bench"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "TRX Reverse Flys",
    equipmentType: "TRX",
    category: "Isolation",
    movementType: "Pull",
    workoutType: "ChestTriceps",
    variation: "A/B",
    weight: 85,
    restTime: "9:30",
    reps: 19,
    primaryMuscles: [
      { muscle: "Rhomboids", percentage: 70 }
    ],
    secondaryMuscles: [
      { muscle: "Trapezius", percentage: 40 },
      { muscle: "Rear Deltoids", percentage: 30 },
      { muscle: "Core", percentage: 15 }
    ],
    equipment: ["TRX"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Tricep Extension",
    equipmentType: "Dumbbell",
    category: "Isolation",
    movementType: "Push",
    workoutType: "ChestTriceps",
    variation: "A",
    weight: 90,
    restTime: "10:00",
    reps: 20,
    primaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 85 }
    ],
    secondaryMuscles: [
      { muscle: "Anconeus", percentage: 30 }
    ],
    equipment: ["Dumbbells"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "TRX Pushup",
    equipmentType: "TRX",
    category: "Compound",
    movementType: "Push",
    workoutType: "ChestTriceps",
    variation: "A",
    weight: 95,
    reps: 21,
    primaryMuscles: [
      { muscle: "Pectoralis Major", percentage: 80 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 30 },
      { muscle: "Anterior Deltoids", percentage: 25 },
      { muscle: "Core", percentage: 25 }
    ],
    equipment: ["TRX"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Incline Bench Press",
    equipmentType: "Barbell",
    category: "Compound",
    movementType: "Push",
    workoutType: "ChestTriceps",
    variation: "B",
    weight: 125,
    reps: 27,
    primaryMuscles: [
      { muscle: "Pectoralis Major", percentage: 75 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 25 },
      { muscle: "Anterior Deltoids", percentage: 35 },
      { muscle: "Serratus Anterior", percentage: 10 }
    ],
    equipment: ["Barbell", "Incline Bench"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Shoulder Press",
    equipmentType: "Barbell",
    category: "Compound", 
    movementType: "Push",
    workoutType: "ChestTriceps",
    variation: "A/B",
    weight: 130,
    reps: 28,
    primaryMuscles: [
      { muscle: "Deltoids", percentage: 80 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 30 },
      { muscle: "Trapezius", percentage: 20 },
      { muscle: "Serratus Anterior", percentage: 15 }
    ],
    equipment: ["Barbell", "Dumbbells"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Dips",
    equipmentType: "Bodyweight",
    category: "Compound",
    movementType: "Push", 
    workoutType: "ChestTriceps",
    variation: "B",
    weight: 135,
    reps: 29,
    primaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 70 }
    ],
    secondaryMuscles: [
      { muscle: "Pectoralis Major", percentage: 65 },
      { muscle: "Anterior Deltoids", percentage: 30 },
      { muscle: "Core", percentage: 10 }
    ],
    equipment: ["Dip Station", "Parallel Bars"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Single Arm Bench",
    equipmentType: "Dumbbell",
    category: "Compound",
    movementType: "Push",
    workoutType: "ChestTriceps",
    variation: "A/B",
    weight: 100,
    reps: 22,
    primaryMuscles: [
      { muscle: "Pectoralis Major", percentage: 80 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 25 },
      { muscle: "Anterior Deltoids", percentage: 25 },
      { muscle: "Core", percentage: 20 }
    ],
    equipment: ["Dumbbells", "Bench"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Single Arm Incline",
    equipmentType: "Dumbbell",
    category: "Compound",
    movementType: "Push",
    workoutType: "ChestTriceps",
    variation: "A/B",
    weight: 105,
    reps: 23,
    primaryMuscles: [
      { muscle: "Pectoralis Major", percentage: 75 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 25 },
      { muscle: "Anterior Deltoids", percentage: 30 },
      { muscle: "Core", percentage: 20 }
    ],
    equipment: ["Dumbbells", "Incline Bench"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Pullover",
    equipmentType: "Dumbbell",
    category: "Isolation",
    movementType: "Pull",
    workoutType: "ChestTriceps",
    variation: "A/B",
    weight: 110,
    reps: 24,
    primaryMuscles: [
      { muscle: "Latissimus Dorsi", percentage: 65 },
      { muscle: "Pectoralis Major", percentage: 35 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 25 },
      { muscle: "Serratus Anterior", percentage: 15 }
    ],
    equipment: ["Dumbbells", "Bench"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Claps",
    equipmentType: "Bodyweight",
    category: "Explosive",
    movementType: "Push",
    workoutType: "ChestTriceps",
    variation: "A/B",
    weight: 115,
    reps: 25,
    primaryMuscles: [
      { muscle: "Pectoralis Major", percentage: 80 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 20 },
      { muscle: "Anterior Deltoids", percentage: 20 }
    ],
    equipment: ["None"],
    difficulty: "Advanced"
  },
  {
    exerciseName: "Pushup",
    equipmentType: "Bodyweight",
    category: "Compound",
    movementType: "Push",
    workoutType: "ChestTriceps",
    variation: "A/B",
    weight: 120,
    reps: 26,
    primaryMuscles: [
      { muscle: "Pectoralis Major", percentage: 80 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 30 },
      { muscle: "Anterior Deltoids", percentage: 25 },
      { muscle: "Core", percentage: 15 }
    ],
    equipment: ["None"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Kettlebell Halos",
    equipmentType: "Kettlebell",
    category: "Functional",
    movementType: "Full Body",
    workoutType: "ChestTriceps",
    variation: "A/B",
    weight: 140,
    reps: 30,
    primaryMuscles: [
      { muscle: "Deltoids", percentage: 60 }
    ],
    secondaryMuscles: [
      { muscle: "Trapezius", percentage: 30 },
      { muscle: "Triceps Brachii", percentage: 25 },
      { muscle: "Core", percentage: 30 },
      { muscle: "Grip/Forearms", percentage: 15 }
    ],
    equipment: ["Kettlebell"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Kettlebell Press",
    equipmentType: "Kettlebell",
    category: "Compound",
    movementType: "Push",
    workoutType: "ChestTriceps",
    variation: "A/B",
    weight: 145,
    reps: 31,
    primaryMuscles: [
      { muscle: "Deltoids", percentage: 70 }
    ],
    secondaryMuscles: [
      { muscle: "Triceps Brachii", percentage: 40 },
      { muscle: "Core", percentage: 35 },
      { muscle: "Grip/Forearms", percentage: 15 }
    ],
    equipment: ["Kettlebell"],
    difficulty: "Intermediate"
  },

  // LEGS WORKOUT
  {
    exerciseName: "Goblet Squats",
    equipmentType: "Kettlebell",
    category: "Compound",
    movementType: "Legs",
    workoutType: "Legs",
    variation: "A",
    weight: 150,
    reps: 32,
    primaryMuscles: [
      { muscle: "Quadriceps", percentage: 65 },
      { muscle: "Gluteus Maximus", percentage: 50 }
    ],
    secondaryMuscles: [
      { muscle: "Hamstrings", percentage: 20 },
      { muscle: "Core", percentage: 25 },
      { muscle: "Grip/Forearms", percentage: 5 }
    ],
    equipment: ["Kettlebell", "Dumbbell"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Dead Lifts",
    equipmentType: "Barbell",
    category: "Compound",
    movementType: "Legs",
    workoutType: "Legs",
    variation: "A",
    weight: 155,
    reps: 33,
    primaryMuscles: [
      { muscle: "Gluteus Maximus", percentage: 90 },
      { muscle: "Hamstrings", percentage: 70 }
    ],
    secondaryMuscles: [
      { muscle: "Erector Spinae", percentage: 60 },
      { muscle: "Core", percentage: 30 },
      { muscle: "Grip/Forearms", percentage: 25 }
    ],
    equipment: ["Barbell"],
    difficulty: "Advanced"
  },
  {
    exerciseName: "Calf Raises",
    equipmentType: "Bodyweight",
    category: "Isolation",
    movementType: "Legs",
    workoutType: "Legs",
    variation: "A",
    weight: 160,
    reps: 34,
    primaryMuscles: [
      { muscle: "Gastrocnemius", percentage: 80 },
      { muscle: "Soleus", percentage: 70 }
    ],
    equipment: ["None", "Calf Machine"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Glute Bridges",
    equipmentType: "Bodyweight",
    category: "Isolation",
    movementType: "Legs",
    workoutType: "Legs",
    variation: "B",
    weight: 165,
    reps: 35,
    primaryMuscles: [
      { muscle: "Gluteus Maximus", percentage: 90 }
    ],
    secondaryMuscles: [
      { muscle: "Hamstrings", percentage: 40 },
      { muscle: "Core", percentage: 20 },
      { muscle: "Quadriceps", percentage: 10 }
    ],
    equipment: ["None", "Barbell"],
    difficulty: "Beginner"
  },
  {
    exerciseName: "Kettlebell Swings",
    equipmentType: "Kettlebell",
    category: "Compound",
    movementType: "Full Body",
    workoutType: "Legs",
    variation: "A/B",
    weight: 180,
    reps: 38,
    primaryMuscles: [
      { muscle: "Gluteus Maximus", percentage: 80 },
      { muscle: "Hamstrings", percentage: 70 }
    ],
    secondaryMuscles: [
      { muscle: "Core", percentage: 40 },
      { muscle: "Shoulders", percentage: 15 },
      { muscle: "Grip/Forearms", percentage: 15 }
    ],
    equipment: ["Kettlebell"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Box Step-ups",
    equipmentType: "Plybox",
    category: "Compound",
    movementType: "Legs",
    workoutType: "Legs",
    variation: "B",
    weight: 170,
    reps: 36,
    primaryMuscles: [
      { muscle: "Quadriceps", percentage: 65 },
      { muscle: "Gluteus Maximus", percentage: 85 }
    ],
    secondaryMuscles: [
      { muscle: "Hamstrings", percentage: 30 },
      { muscle: "Erector Spinae", percentage: 15 }
    ],
    equipment: ["Plyometric Box", "Step Platform"],
    difficulty: "Intermediate"
  },
  {
    exerciseName: "Stiff Legged Deadlifts",
    equipmentType: "Barbell",
    category: "Compound",
    movementType: "Legs",
    workoutType: "Legs",
    variation: "B",
    weight: 175,
    reps: 37,
    primaryMuscles: [
      { muscle: "Hamstrings", percentage: 85 },
      { muscle: "Gluteus Maximus", percentage: 75 }
    ],
    secondaryMuscles: [
      { muscle: "Erector Spinae", percentage: 50 },
      { muscle: "Core", percentage: 25 },
      { muscle: "Grip/Forearms", percentage: 15 }
    ],
    equipment: ["Barbell", "Dumbbells"],
    difficulty: "Intermediate"
  }
];

// Workout routines based on workout types
export const enderWorkoutRoutines = {
  "Abs": {
    name: "Ender's Core Workout",
    description: "Comprehensive core strengthening with progressive hold times",
    duration: 30,
    exercises: enderExerciseDatabase.filter(ex => ex.workoutType === "Abs")
  },
  "BackBiceps": {
    name: "Ender's Pull Day", 
    description: "Back and bicep development with compound movements",
    duration: 60,
    exercises: enderExerciseDatabase.filter(ex => ex.workoutType === "BackBiceps")
  },
  "ChestTriceps": {
    name: "Ender's Push Day",
    description: "Chest and tricep focus with pressing movements", 
    duration: 75,
    exercises: enderExerciseDatabase.filter(ex => ex.workoutType === "ChestTriceps")
  },
  "Legs": {
    name: "Ender's Leg Day",
    description: "Lower body compound movements and glute activation",
    duration: 50,
    exercises: enderExerciseDatabase.filter(ex => ex.workoutType === "Legs")
  }
};

console.log("Ender's Exercise Database Summary:");
console.log(`Total exercises: ${enderExerciseDatabase.length}`);
console.log("Workout types:", Object.keys(enderWorkoutRoutines));
Object.keys(enderWorkoutRoutines).forEach(type => {
  const routine = enderWorkoutRoutines[type as keyof typeof enderWorkoutRoutines];
  console.log(`${type}: ${routine.exercises.length} exercises, ${routine.duration}min`);
});