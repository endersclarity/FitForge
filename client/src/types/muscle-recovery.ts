// FitForge Muscle Recovery Types
// TypeScript interfaces for muscle activation heat map and recovery tracking
// Created: June 3, 2025

export interface MuscleRecoveryState {
  muscleGroup: string;
  lastWorkoutDate: Date;
  workoutIntensity: number;  // 0-1 scale based on RPE
  currentFatiguePercentage: number;
  recoveryStatus: 'overworked' | 'optimal' | 'undertrained';
  daysUntilOptimal: number;
}

export interface MuscleRecoveryService {
  calculateRecovery(lastWorkout: Date, intensity: number): number;
  getMuscleRecoveryStates(userId: string): Promise<MuscleRecoveryState[]>;
  updateMuscleRecovery(workoutData: WorkoutSession): Promise<void>;
}

export interface MuscleGroup {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  recoveryTimeHours: number; // Base recovery time for this muscle group
}

export interface WorkoutSession {
  id: string;
  userId: string;
  date: Date;
  exercises: ExerciseSet[];
  totalDuration: number;
  rpe: number; // Rate of Perceived Exertion (1-10)
}

export interface ExerciseSet {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
  rpe: number;
  muscleActivation: MuscleActivation[];
}

export interface MuscleActivation {
  muscleGroup: string;
  activationPercentage: number; // Primary: 100%, Secondary: 50-80%
  isTargeted: boolean; // True if this exercise specifically targets this muscle
}

export interface HeatMapVisualizationData {
  muscleGroups: MuscleGroupVisualization[];
  overallFatigueLevel: number;
  recommendedWorkoutType: 'upper' | 'lower' | 'full' | 'recovery';
  nextOptimalWorkout: Date;
}

export interface MuscleGroupVisualization {
  muscleGroup: string;
  fatiguePercentage: number;
  color: string; // CSS color based on fatigue level
  status: 'overworked' | 'optimal' | 'undertrained';
  daysUntilOptimal: number;
  lastWorked: Date;
  recommendedAction: string;
}

export interface RecoveryCalculationParams {
  baseRecoveryHours: number;
  workoutIntensity: number;
  muscleActivationLevel: number;
  userRecoveryFactor: number; // Individual variation (0.8-1.2)
  sleepQuality?: number; // Optional: 1-10 scale
  nutritionQuality?: number; // Optional: 1-10 scale
  stressLevel?: number; // Optional: 1-10 scale
}

export interface MuscleRecoverySettings {
  userId: string;
  personalRecoveryFactor: number;
  preferredWorkoutSplit: 'upper/lower' | 'push/pull/legs' | 'full_body' | 'custom';
  recoveryTimePreference: 'conservative' | 'moderate' | 'aggressive';
  trackSleepQuality: boolean;
  trackNutrition: boolean;
  trackStress: boolean;
}

// Muscle Group Constants
export const MUSCLE_GROUPS = {
  CHEST: 'chest',
  BACK: 'back', 
  SHOULDERS: 'shoulders',
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  FOREARMS: 'forearms',
  CORE: 'core',
  GLUTES: 'glutes',
  QUADRICEPS: 'quadriceps',
  HAMSTRINGS: 'hamstrings',
  CALVES: 'calves'
} as const;

export type MuscleGroupType = typeof MUSCLE_GROUPS[keyof typeof MUSCLE_GROUPS];

// Recovery Status Thresholds
export const RECOVERY_THRESHOLDS = {
  OVERWORKED: 80, // 80-100% fatigue
  OPTIMAL_HIGH: 80,
  OPTIMAL_LOW: 30, // 30-80% fatigue
  UNDERTRAINED: 30 // 0-30% fatigue
} as const;

// Base Recovery Times (in hours)
export const BASE_RECOVERY_TIMES = {
  [MUSCLE_GROUPS.CHEST]: 48,
  [MUSCLE_GROUPS.BACK]: 48,
  [MUSCLE_GROUPS.SHOULDERS]: 36,
  [MUSCLE_GROUPS.BICEPS]: 36,
  [MUSCLE_GROUPS.TRICEPS]: 36,
  [MUSCLE_GROUPS.FOREARMS]: 24,
  [MUSCLE_GROUPS.CORE]: 24,
  [MUSCLE_GROUPS.GLUTES]: 48,
  [MUSCLE_GROUPS.QUADRICEPS]: 48,
  [MUSCLE_GROUPS.HAMSTRINGS]: 48,
  [MUSCLE_GROUPS.CALVES]: 36
} as const;

// Heat Map Color Scheme
export const HEAT_MAP_COLORS = {
  OVERWORKED: '#ef4444', // Red
  HIGH_FATIGUE: '#f97316', // Orange  
  MODERATE_FATIGUE: '#eab308', // Yellow
  LOW_FATIGUE: '#22c55e', // Green
  UNDERTRAINED: '#3b82f6' // Blue
} as const;