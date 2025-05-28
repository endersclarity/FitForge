import { enderExerciseDatabase } from "./ender-real-exercises";

// Define workout progression patterns for realistic 6-month history
export interface WorkoutHistorySet {
  reps: number;
  weight?: number;
  restTime: number;
  formScore: number;
  notes?: string;
}

export interface WorkoutHistoryExercise {
  exerciseName: string;
  sets: WorkoutHistorySet[];
}

export interface WorkoutHistorySession {
  userId: number;
  workoutTemplateId?: number | null;
  startTime: Date;
  endTime: Date;
  duration: number;
  exercises: WorkoutHistoryExercise[];
  caloriesBurned: number;
  notes?: string;
  rating: number;
  completionStatus: string;
}

// Training phases for realistic periodization
const trainingPhases = [
  { name: "Foundation", weeks: 4, focusRep: 12, focusIntensity: 0.70 },
  { name: "Strength", weeks: 4, focusRep: 6, focusIntensity: 0.85 },
  { name: "Power", weeks: 3, focusRep: 4, focusIntensity: 0.90 },
  { name: "Deload", weeks: 1, focusRep: 10, focusIntensity: 0.60 },
  { name: "Hypertrophy", weeks: 6, focusRep: 10, focusIntensity: 0.75 },
  { name: "Strength II", weeks: 4, focusRep: 5, focusIntensity: 0.87 },
  { name: "Peak", weeks: 2, focusRep: 3, focusIntensity: 0.92 },
  { name: "Deload II", weeks: 1, focusRep: 12, focusIntensity: 0.65 }
];

// Base weights for exercises (realistic starting point for intermediate lifter)
const baseWeights: Record<string, number> = {
  "Bench Press": 175,
  "Incline Bench Press": 145,
  "Shoulder Press": 85,
  "Dips": 0, // bodyweight
  "TRX Pushup": 0,
  "Tricep Extension": 50,
  "Dead Lifts": 215,
  "Bent Over Rows": 145,
  "T Row": 135,
  "Neutral Grip Pull-ups": 0,
  "Incline Hammer Curl": 35,
  "Shoulder Shrugs": 165,
  "Goblet Squats": 45,
  "Glute Bridges": 0,
  "Calf Raises": 0,
  "Kettlebell Swings": 35,
  "Planks": 0,
  "Spider Planks": 0,
  "Bench Situps": 0,
  "Hanging Knee Raises": 0
};

// Workout frequency patterns (Push/Pull/Legs split)
const workoutPatterns = [
  { type: "Push", exercises: ["Bench Press", "Incline Bench Press", "Shoulder Press", "Dips", "Tricep Extension"] },
  { type: "Pull", exercises: ["Dead Lifts", "Bent Over Rows", "Neutral Grip Pull-ups", "Incline Hammer Curl", "Shoulder Shrugs"] },
  { type: "Legs", exercises: ["Goblet Squats", "Dead Lifts", "Glute Bridges", "Calf Raises", "Kettlebell Swings"] },
  { type: "Core", exercises: ["Planks", "Spider Planks", "Bench Situps", "Hanging Knee Raises"] }
];

function calculateProgressiveWeight(baseWeight: number, weeksPassed: number, phase: any): number {
  if (baseWeight === 0) return 0; // bodyweight exercises
  
  // Linear progression with phase-specific adjustments
  const baseProgression = weeksPassed * 2.5; // 2.5lbs per week base
  const phaseMultiplier = phase.focusIntensity;
  const progressedWeight = baseWeight + (baseProgression * phaseMultiplier);
  
  // Add some randomness for realism (-5 to +10 lbs)
  const variance = Math.random() * 15 - 5;
  return Math.round((progressedWeight + variance) / 5) * 5; // Round to nearest 5
}

function calculateRepsAndSets(phase: any, exerciseName: string, weekInPhase: number): { reps: number[], sets: number } {
  const baseReps = phase.focusRep;
  const repsVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
  const targetReps = Math.max(3, baseReps + repsVariation);
  
  // Simulate fatigue across sets
  const sets = exerciseName.includes("Calf") ? 4 : 3;
  const repsPerSet = [];
  
  for (let i = 0; i < sets; i++) {
    const fatigueReduction = i * (Math.random() * 2); // 0-2 rep reduction per set
    const setReps = Math.max(Math.floor(targetReps * 0.6), targetReps - Math.floor(fatigueReduction));
    repsPerSet.push(setReps);
  }
  
  return { reps: repsPerSet, sets };
}

function calculateFormScore(weekInPhase: number, setNumber: number, phase: any): number {
  // Form generally decreases with fatigue and increases with practice
  const baseScore = 8.5;
  const fatigueEffect = setNumber * 0.3; // Form drops slightly each set
  const practiceBonus = Math.min(weekInPhase * 0.1, 0.5); // Improve over the phase
  const phaseEffect = phase.name === "Deload" ? 0.5 : 0; // Better form during deload
  
  const score = baseScore - fatigueEffect + practiceBonus + phaseEffect;
  return Math.max(6.0, Math.min(10.0, Math.round(score * 2) / 2)); // Round to nearest 0.5
}

function generateRestTime(exerciseName: string, setNumber: number): number {
  const baseRestTimes: Record<string, number> = {
    "Bench Press": 180,
    "Dead Lifts": 240,
    "Goblet Squats": 120,
    "Shoulder Press": 150,
    "Bent Over Rows": 150,
    "Incline Bench Press": 150,
    "Neutral Grip Pull-ups": 180,
    "Incline Hammer Curl": 90,
    "Tricep Extension": 90,
    "Dips": 120,
    "Shoulder Shrugs": 120,
    "Glute Bridges": 90,
    "Calf Raises": 60,
    "Kettlebell Swings": 120,
    "Planks": 30,
    "Spider Planks": 60,
    "Bench Situps": 90,
    "Hanging Knee Raises": 120
  };
  
  const baseRest = baseRestTimes[exerciseName] || 120;
  const fatigueIncrease = setNumber * 15; // Need more rest as fatigue builds
  return baseRest + fatigueIncrease + Math.floor(Math.random() * 30); // Add 0-30s variance
}

export function generateSixMonthWorkoutHistory(userId: number): WorkoutHistorySession[] {
  const sessions: WorkoutHistorySession[] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6); // 6 months ago
  
  let currentDate = new Date(startDate);
  let weeksPassed = 0;
  let currentPhaseIndex = 0;
  let weekInPhase = 0;
  
  // Generate workouts for 26 weeks (6 months)
  while (weeksPassed < 26) {
    const currentPhase = trainingPhases[currentPhaseIndex];
    
    // 3-4 workouts per week (Mon, Wed, Fri, optional Saturday)
    const workoutsThisWeek = Math.random() > 0.3 ? 4 : 3;
    const workoutDays = workoutsThisWeek === 4 ? [1, 3, 5, 6] : [1, 3, 5]; // Mon, Wed, Fri, Sat
    
    for (let dayIndex = 0; dayIndex < workoutDays.length; dayIndex++) {
      const workoutDay = workoutDays[dayIndex];
      const workoutDate = new Date(currentDate);
      workoutDate.setDate(currentDate.getDate() + workoutDay);
      
      // Skip if workout would be in the future
      if (workoutDate > new Date()) continue;
      
      // Cycle through workout types
      const workoutPattern = workoutPatterns[dayIndex % workoutPatterns.length];
      
      // Generate workout session
      const exercises: WorkoutHistoryExercise[] = [];
      let totalCalories = 0;
      
      for (const exerciseName of workoutPattern.exercises) {
        const baseWeight = baseWeights[exerciseName] || 0;
        const currentWeight = calculateProgressiveWeight(baseWeight, weeksPassed, currentPhase);
        const { reps: repsPerSet, sets } = calculateRepsAndSets(currentPhase, exerciseName, weekInPhase);
        
        const exerciseSets: WorkoutHistorySet[] = [];
        for (let setNum = 0; setNum < sets; setNum++) {
          const reps = repsPerSet[setNum];
          const formScore = calculateFormScore(weekInPhase, setNum, currentPhase);
          const restTime = generateRestTime(exerciseName, setNum);
          
          // Calculate volume for calories
          const volume = currentWeight * reps;
          totalCalories += volume * 0.08; // Rough calorie estimate
          
          const set: WorkoutHistorySet = {
            reps,
            weight: currentWeight || undefined,
            restTime,
            formScore,
            notes: setNum === 0 && Math.random() > 0.7 ? getRandomNote(exerciseName, currentPhase) : undefined
          };
          
          exerciseSets.push(set);
        }
        
        exercises.push({
          exerciseName,
          sets: exerciseSets
        });
      }
      
      // Calculate workout duration based on sets and rest
      const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
      const avgRestTime = exercises.reduce((sum, ex) => 
        sum + ex.sets.reduce((setSum, set) => setSum + set.restTime, 0), 0) / totalSets;
      const duration = Math.round((totalSets * 2.5) + (avgRestTime * totalSets / 60)); // ~2.5 min per set + rest
      
      const endTime = new Date(workoutDate);
      endTime.setMinutes(endTime.getMinutes() + duration);
      
      const session: WorkoutHistorySession = {
        userId,
        workoutTemplateId: null,
        startTime: workoutDate,
        endTime,
        duration,
        exercises,
        caloriesBurned: Math.round(totalCalories),
        notes: Math.random() > 0.6 ? getRandomWorkoutNote(currentPhase, workoutPattern.type) : undefined,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 star rating
        completionStatus: "completed"
      };
      
      sessions.push(session);
    }
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
    weeksPassed++;
    weekInPhase++;
    
    // Check if phase is complete
    if (weekInPhase >= currentPhase.weeks) {
      currentPhaseIndex = (currentPhaseIndex + 1) % trainingPhases.length;
      weekInPhase = 0;
    }
  }
  
  return sessions;
}

function getRandomNote(exerciseName: string, phase: any): string {
  const exerciseNotes: Record<string, string[]> = {
    "Bench Press": ["Felt strong today", "Chest pumped", "Good lockout", "Slight shoulder twinge"],
    "Dead Lifts": ["Heavy but smooth", "Great hip drive", "Back felt tight", "New PR territory"],
    "Goblet Squats": ["Deep range of motion", "Glutes fired well", "Knee tracking good", "Felt balanced"],
    "Shoulder Press": ["Strict form", "Core engaged", "Shoulders pre-fatigued", "Good stability"],
    "Neutral Grip Pull-ups": ["Full range", "Lat focused", "Upper back pumped", "Grip gave out first"]
  };
  
  const phaseNotes: Record<string, string[]> = {
    "Deload": ["Taking it easy", "Focus on form", "Recovery week"],
    "Strength": ["Heavy singles", "Max effort", "Testing limits"],
    "Power": ["Explosive reps", "Speed focus", "Athletic movement"]
  };
  
  const notes = [...(exerciseNotes[exerciseName] || []), ...(phaseNotes[phase.name] || [])];
  return notes[Math.floor(Math.random() * notes.length)] || "Good set";
}

function getRandomWorkoutNote(phase: any, workoutType: string): string {
  const notes = [
    `Great ${workoutType.toLowerCase()} session`,
    `${phase.name} phase going well`,
    `Energy levels good today`,
    `Focused on mind-muscle connection`,
    `Progressive overload working`,
    `Form improvements noticed`,
    `Strength gains evident`,
    `Recovery feeling optimal`
  ];
  
  return notes[Math.floor(Math.random() * notes.length)];
}