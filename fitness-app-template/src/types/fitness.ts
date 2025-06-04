// Domain-specific fitness types - opinionated and comprehensive

export type MuscleGroup = 
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' 
  | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves' 
  | 'abs' | 'obliques' | 'forearms';

export type WorkoutType = 
  | 'strength' | 'cardio' | 'flexibility' | 'sports' | 'rehabilitation';

export type IntensityLevel = 'low' | 'medium' | 'high';

export type Equipment = 
  | 'bodyweight' | 'barbell' | 'dumbbell' | 'cable' | 'machine' 
  | 'resistance_band' | 'kettlebell' | 'other';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  type: WorkoutType;
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = beginner, 5 = expert
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
}

export interface WorkoutSet {
  id: string;
  weight?: number;
  reps?: number;
  duration?: number; // for time-based exercises
  distance?: number; // for cardio
  restTime?: number; // seconds
  intensity: IntensityLevel;
  notes?: string;
  completed: boolean;
  completedAt?: Date;
}

export interface WorkoutExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  targetSets: number;
  targetReps?: number;
  targetWeight?: number;
  actualVolume: number; // calculated: sets * reps * weight
}

export interface WorkoutSession {
  id: string;
  name: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  exercises: WorkoutExercise[];
  totalVolume: number;
  focusAreas: MuscleGroup[];
  intensity: IntensityLevel;
  notes?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'skipped';
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  targetMuscleGroups: MuscleGroup[];
  estimatedDuration: number; // minutes
  difficulty: 1 | 2 | 3 | 4 | 5;
  exercises: Array<{
    exerciseId: string;
    sets: number;
    reps: number;
    weight?: number;
    restTime: number;
  }>;
}

export interface ProgressMetrics {
  totalWorkouts: number;
  totalVolume: number;
  avgIntensity: IntensityLevel;
  muscleGroupBalance: Record<MuscleGroup, number>;
  weeklyProgress: number[];
  personalRecords: Record<string, { weight: number; reps: number; date: Date }>;
}