/**
 * Progressive Overload Intelligence Types
 * Based on LiftLog's proven progression algorithms
 */

export interface ExerciseHistory {
  exerciseId: number;
  exerciseName: string;
  exerciseType: 'compound' | 'isolation';
  category: 'strength' | 'hypertrophy' | 'endurance';
  lastPerformed: Date;
  sessions: WorkoutSession[];
}

export interface WorkoutSession {
  sessionId: string;
  date: Date;
  sets: WorkoutSet[];
  targetReps: number;
  targetSets: number;
  averageRPE?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
}

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  restTime?: number; // seconds
  completed: boolean;
  formScore?: number; // 1-10
}

export interface ProgressionSuggestion {
  suggestedWeight: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  reasoning: string;
  increaseAmount: number;
  alternativeWeights: number[];
  lastSessionSummary: {
    weight: number;
    totalReps: number;
    averageRPE: number;
    allSetsCompleted: boolean;
  };
}

export interface ProgressionConfig {
  // Progression increments by exercise type (kg)
  compoundIncrement: number;      // Default: 2.5kg
  isolationIncrement: number;     // Default: 1.25kg
  bodyweightIncrement: number;    // Default: add reps
  
  // RPE thresholds for progression
  progressionRPEThreshold: number; // Default: 7.5 (progress if RPE < 7.5)
  deloadRPEThreshold: number;      // Default: 9.5 (deload if RPE > 9.5)
  
  // Rep completion requirements
  minCompletionRate: number;       // Default: 0.85 (85% of target reps)
  consecutiveSessionsRequired: number; // Default: 1 (sessions before progression)
  
  // Safety parameters
  maxWeeklyIncrease: number;       // Default: 10kg (safety cap)
  minWeightIncrease: number;       // Default: 0.5kg (minimum meaningful increase)
}

export interface ExercisePerformanceMetrics {
  // Trend analysis
  weightTrend: 'increasing' | 'stable' | 'decreasing';
  volumeTrend: 'increasing' | 'stable' | 'decreasing';
  consistencyScore: number; // 0-1 (how consistent the performance)
  
  // Progressive overload indicators
  readyForProgression: boolean;
  weeksSinceLastProgression: number;
  totalVolumeProgress: number; // % change from baseline
  
  // Performance indicators
  averageRPE: number;
  completionRate: number; // % of target reps achieved
  strengthEndurance: number; // reps maintained across sets
}

export type ProgressionStrategy = 
  | 'linear_progression'    // Add weight every session
  | 'double_progression'    // Add reps, then weight
  | 'wave_loading'         // Cycling intensity
  | 'auto_regulation'      // RPE-based progression
  | 'deload_protocol';     // Reduce load temporarily

export interface ProgressionRecommendation {
  strategy: ProgressionStrategy;
  suggestion: ProgressionSuggestion;
  metrics: ExercisePerformanceMetrics;
  nextSessionPlan: {
    targetWeight: number;
    targetReps: number;
    targetSets: number;
    expectedRPE: number;
    restTime: number;
  };
}