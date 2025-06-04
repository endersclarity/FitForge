// FitForge Muscle Recovery Service
// Recovery calculation algorithms and muscle fatigue tracking
// Created: June 3, 2025

import { 
  MuscleRecoveryState, 
  MuscleRecoveryService, 
  WorkoutSession,
  MuscleGroup,
  RecoveryCalculationParams,
  MuscleRecoverySettings,
  MUSCLE_GROUPS,
  BASE_RECOVERY_TIMES,
  RECOVERY_THRESHOLDS,
  MuscleGroupType
} from '@/types/muscle-recovery';

export class MuscleRecoveryCalculator implements MuscleRecoveryService {
  private settings: MuscleRecoverySettings;

  constructor(settings: MuscleRecoverySettings) {
    this.settings = settings;
  }

  /**
   * Calculate current recovery percentage for a muscle group
   * @param lastWorkout Date of last workout targeting this muscle
   * @param intensity Workout intensity (0-1 scale)
   * @returns Recovery percentage (0-100)
   */
  calculateRecovery(lastWorkout: Date, intensity: number): number {
    const now = new Date();
    const hoursSinceWorkout = (now.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60);
    
    // Base recovery time varies by muscle group and intensity
    const baseRecoveryHours = this.getBaseRecoveryTime(intensity);
    
    // Calculate recovery percentage
    const recoveryPercentage = Math.min(100, (hoursSinceWorkout / baseRecoveryHours) * 100);
    
    // Apply personal recovery factor
    return Math.min(100, recoveryPercentage * this.settings.personalRecoveryFactor);
  }

  /**
   * Get recovery states for all muscle groups
   * @param userId User identifier
   * @returns Array of muscle recovery states
   */
  async getMuscleRecoveryStates(userId: string): Promise<MuscleRecoveryState[]> {
    // Get recent workout history
    const recentWorkouts = await this.getRecentWorkouts(userId, 7); // Last 7 days
    
    const recoveryStates: MuscleRecoveryState[] = [];
    
    // Process each muscle group
    for (const muscleGroup of Object.values(MUSCLE_GROUPS)) {
      const state = await this.calculateMuscleRecoveryState(muscleGroup, recentWorkouts);
      recoveryStates.push(state);
    }
    
    return recoveryStates;
  }

  /**
   * Update muscle recovery after completing a workout
   * @param workoutData Completed workout session
   */
  async updateMuscleRecovery(workoutData: WorkoutSession): Promise<void> {
    // Store workout data for recovery calculations
    await this.storeWorkoutData(workoutData);
    
    // Update muscle activation records
    for (const exercise of workoutData.exercises) {
      for (const activation of exercise.muscleActivation) {
        await this.updateMuscleActivationHistory(
          workoutData.userId,
          activation.muscleGroup,
          workoutData.date,
          activation.activationPercentage,
          exercise.rpe
        );
      }
    }
  }

  /**
   * Calculate comprehensive recovery state for a specific muscle group
   */
  private async calculateMuscleRecoveryState(
    muscleGroup: MuscleGroupType, 
    recentWorkouts: WorkoutSession[]
  ): Promise<MuscleRecoveryState> {
    // Find most recent workout targeting this muscle group
    const lastWorkout = this.findLastWorkoutForMuscle(muscleGroup, recentWorkouts);
    
    if (!lastWorkout) {
      // No recent workouts = undertrained
      return {
        muscleGroup,
        lastWorkoutDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago default
        workoutIntensity: 0,
        currentFatiguePercentage: 0,
        recoveryStatus: 'undertrained',
        daysUntilOptimal: 0
      };
    }

    // Calculate current fatigue level
    const hoursSinceWorkout = (Date.now() - lastWorkout.date.getTime()) / (1000 * 60 * 60);
    const intensity = this.calculateWorkoutIntensity(lastWorkout, muscleGroup);
    
    // Advanced recovery calculation with 5-day cycle
    const fatiguePercentage = this.calculateAdvancedFatigue(
      hoursSinceWorkout,
      intensity,
      muscleGroup
    );

    const recoveryStatus = this.determineRecoveryStatus(fatiguePercentage);
    const daysUntilOptimal = this.calculateDaysUntilOptimal(fatiguePercentage, intensity, muscleGroup);

    return {
      muscleGroup,
      lastWorkoutDate: lastWorkout.date,
      workoutIntensity: intensity,
      currentFatiguePercentage: fatiguePercentage,
      recoveryStatus,
      daysUntilOptimal
    };
  }

  /**
   * Advanced fatigue calculation using 5-day recovery cycle
   */
  private calculateAdvancedFatigue(
    hoursSinceWorkout: number,
    intensity: number,
    muscleGroup: MuscleGroupType
  ): number {
    const baseRecoveryHours = BASE_RECOVERY_TIMES[muscleGroup];
    
    // 5-day recovery curve: exponential decay
    const recoveryTimeWithIntensity = baseRecoveryHours * (1 + intensity);
    
    // Recovery follows exponential decay curve
    const recoveryProgress = 1 - Math.exp(-hoursSinceWorkout / (recoveryTimeWithIntensity * 0.4));
    
    // Fatigue is inverse of recovery (100% fatigue immediately after workout)
    const fatiguePercentage = Math.max(0, 100 * (1 - recoveryProgress));
    
    // Apply personal recovery factor
    return Math.max(0, fatiguePercentage / this.settings.personalRecoveryFactor);
  }

  /**
   * Calculate workout intensity for specific muscle group
   */
  private calculateWorkoutIntensity(workout: WorkoutSession, muscleGroup: MuscleGroupType): number {
    let totalActivation = 0;
    let totalVolume = 0;
    
    for (const exercise of workout.exercises) {
      const muscleActivation = exercise.muscleActivation.find(
        activation => activation.muscleGroup === muscleGroup
      );
      
      if (muscleActivation) {
        const exerciseVolume = exercise.sets * exercise.reps;
        totalActivation += muscleActivation.activationPercentage * exerciseVolume;
        totalVolume += exerciseVolume;
      }
    }
    
    if (totalVolume === 0) return 0;
    
    // Normalize to 0-1 scale considering RPE
    const averageActivation = totalActivation / totalVolume / 100;
    const rpeMultiplier = workout.rpe / 10;
    
    return Math.min(1, averageActivation * rpeMultiplier);
  }

  /**
   * Determine recovery status based on fatigue percentage
   */
  private determineRecoveryStatus(fatiguePercentage: number): 'overworked' | 'optimal' | 'undertrained' {
    if (fatiguePercentage >= RECOVERY_THRESHOLDS.OVERWORKED) {
      return 'overworked';
    } else if (fatiguePercentage >= RECOVERY_THRESHOLDS.OPTIMAL_LOW) {
      return 'optimal';
    } else {
      return 'undertrained';
    }
  }

  /**
   * Calculate days until muscle reaches optimal training status
   */
  private calculateDaysUntilOptimal(
    currentFatigue: number, 
    intensity: number, 
    muscleGroup: MuscleGroupType
  ): number {
    if (currentFatigue <= RECOVERY_THRESHOLDS.OPTIMAL_HIGH) {
      return 0; // Already optimal or undertrained
    }
    
    const baseRecoveryHours = BASE_RECOVERY_TIMES[muscleGroup];
    const recoveryTimeWithIntensity = baseRecoveryHours * (1 + intensity);
    
    // Calculate when fatigue will drop to optimal level (80%)
    const targetFatigue = RECOVERY_THRESHOLDS.OPTIMAL_HIGH;
    const requiredRecoveryProgress = 1 - (targetFatigue / 100);
    
    // Solve exponential decay equation for time
    const requiredHours = -recoveryTimeWithIntensity * 0.4 * Math.log(1 - requiredRecoveryProgress);
    
    return Math.max(0, Math.ceil(requiredHours / 24));
  }

  /**
   * Find the most recent workout that targeted a specific muscle group
   */
  private findLastWorkoutForMuscle(
    muscleGroup: MuscleGroupType, 
    workouts: WorkoutSession[]
  ): WorkoutSession | null {
    // Sort workouts by date (most recent first)
    const sortedWorkouts = workouts.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    for (const workout of sortedWorkouts) {
      for (const exercise of workout.exercises) {
        const hasTargetMuscle = exercise.muscleActivation.some(
          activation => activation.muscleGroup === muscleGroup && activation.activationPercentage > 30
        );
        
        if (hasTargetMuscle) {
          return workout;
        }
      }
    }
    
    return null;
  }

  /**
   * Get base recovery time adjusted for intensity
   */
  private getBaseRecoveryTime(intensity: number): number {
    // Base recovery is 48 hours, adjusted by intensity
    const baseHours = 48;
    return baseHours * (1 + intensity * 0.5); // 50% increase at max intensity
  }

  /**
   * Get recent workout history from unified storage API
   */
  private async getRecentWorkouts(userId: string, days: number): Promise<WorkoutSession[]> {
    try {
      // Fetch from unified storage endpoint
      const response = await fetch('/api/workouts/muscle-recovery', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // The API returns muscle recovery states, but we need workout sessions for compatibility
      // Convert the recovery states back to a simplified workout format
      return this.convertRecoveryStatesToWorkouts(data.recoveryStates);
      
    } catch (error) {
      console.error('Error fetching recent workouts from unified storage:', error);
      return [];
    }
  }

  /**
   * Store workout data for recovery calculations
   */
  private async storeWorkoutData(workout: WorkoutSession): Promise<void> {
    try {
      // In real implementation, this would save to database
      // For MVP, we'll store in local file system
      console.log('Storing workout data for recovery calculations:', workout.id);
    } catch (error) {
      console.error('Error storing workout data:', error);
    }
  }

  /**
   * Update muscle activation history
   */
  private async updateMuscleActivationHistory(
    userId: string,
    muscleGroup: string,
    date: Date,
    activationPercentage: number,
    rpe: number
  ): Promise<void> {
    try {
      // In real implementation, this would update database records
      console.log(`Updating ${muscleGroup} activation: ${activationPercentage}% at RPE ${rpe}`);
    } catch (error) {
      console.error('Error updating muscle activation history:', error);
    }
  }

  /**
   * Convert recovery states back to workout sessions for compatibility
   */
  private convertRecoveryStatesToWorkouts(recoveryStates: any[]): WorkoutSession[] {
    // This is a compatibility layer - the new API returns calculated recovery states
    // For now, return empty array since the recovery calculation is done server-side
    return [];
  }
}

/**
 * Factory function to create muscle recovery calculator with default settings
 */
export function createMuscleRecoveryCalculator(userId: string): MuscleRecoveryCalculator {
  const defaultSettings: MuscleRecoverySettings = {
    userId,
    personalRecoveryFactor: 1.0, // Average recovery rate
    preferredWorkoutSplit: 'upper/lower',
    recoveryTimePreference: 'moderate',
    trackSleepQuality: false,
    trackNutrition: false,
    trackStress: false
  };

  return new MuscleRecoveryCalculator(defaultSettings);
}

/**
 * Quick utility function for single muscle recovery calculation
 */
export function calculateSingleMuscleRecovery(
  lastWorkoutDate: Date,
  workoutIntensity: number,
  muscleGroup: MuscleGroupType
): number {
  const hoursSinceWorkout = (Date.now() - lastWorkoutDate.getTime()) / (1000 * 60 * 60);
  const baseRecoveryHours = BASE_RECOVERY_TIMES[muscleGroup];
  const adjustedRecoveryTime = baseRecoveryHours * (1 + workoutIntensity);
  
  // Exponential recovery curve
  const recoveryProgress = 1 - Math.exp(-hoursSinceWorkout / (adjustedRecoveryTime * 0.4));
  const fatiguePercentage = Math.max(0, 100 * (1 - recoveryProgress));
  
  return fatiguePercentage;
}