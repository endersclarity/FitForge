// FitForge Goal Progress Calculation Engine
// Transparent formula-based progress tracking with data source attribution
// Created: June 1, 2025

import { supabase, db, PersonalRecord, WorkoutSession, WorkoutSet } from '@/lib/supabase';
import { Goal, GoalType } from '@/services/supabase-goal-service';
import { workoutService } from '@/services/supabase-workout-service';

// ============================================================================
// PROGRESS CALCULATION INTERFACES
// ============================================================================

export interface ProgressCalculationResult {
  goal_id: string;
  current_progress_percentage: number;
  data_source_description: string;
  calculation_formula: string;
  is_achieved: boolean;
  last_updated: string;
  milestone_data?: {
    current_value: number;
    target_value: number;
    start_value: number;
    unit: string;
  };
  data_points_count: number;
  calculation_date_range: {
    start: string;
    end: string;
  };
}

export interface WeightProgressData {
  current_weight_lbs: number;
  measurements_count: number;
  latest_measurement_date: string;
  trend_direction: 'losing' | 'gaining' | 'stable';
}

export interface StrengthProgressData {
  current_max_weight_lbs: number;
  current_max_reps: number;
  workouts_count: number;
  latest_workout_date: string;
  total_sets_logged: number;
}

export interface BodyCompositionProgressData {
  current_body_fat_percentage: number;
  measurements_count: number;
  latest_measurement_date: string;
}

// ============================================================================
// PROGRESS CALCULATION ENGINE
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GoalProgressEngine {
  
  /**
   * Get available exercises for strength goal creation
   */
  export async function getAvailableExercisesForStrengthGoals(): Promise<Array<{
    id: string;
    name: string;
    category: string;
    recent_max_weight?: number;
    recent_workout_count?: number;
  }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get all strength training exercises
      const exercises = await workoutService.getAllExercises();
      const strengthExercises = exercises.filter(ex => 
        ex.workout_type === 'strength' || 
        ex.category === 'strength'
      );

      // Get user's recent workout history for each exercise
      const exercisesWithData = await Promise.all(
        strengthExercises.map(async (exercise) => {
          try {
            // Get recent workout sessions (last 90 days)
            const recentSessions = await db.getUserWorkoutSessions(user.id, 50);
            const last90Days = new Date();
            last90Days.setDate(last90Days.getDate() - 90);
            
            const relevantSessions = recentSessions.filter(session => 
              new Date(session.start_time) >= last90Days &&
              session.completion_status === 'completed'
            );

            let workoutCount = 0;
            let maxWeight = 0;

            // Check each session for this exercise
            for (const session of relevantSessions) {
              const workoutExercises = await db.getWorkoutExercises(session.id);
              const targetExercise = workoutExercises.find(ex => ex.exercise_id === exercise.id);
              
              if (targetExercise) {
                workoutCount++;
                const sets = await db.getWorkoutSets(targetExercise.id);
                if (sets.length > 0) {
                  const sessionMax = Math.max(...sets.map(set => set.weight_lbs));
                  maxWeight = Math.max(maxWeight, sessionMax);
                }
              }
            }

            return {
              id: exercise.id,
              name: exercise.exercise_name,
              category: exercise.category,
              recent_max_weight: maxWeight > 0 ? maxWeight : undefined,
              recent_workout_count: workoutCount
            };
          } catch (error) {
            // If we can't get data for this exercise, return basic info
            return {
              id: exercise.id,
              name: exercise.exercise_name,
              category: exercise.category,
              recent_max_weight: undefined,
              recent_workout_count: 0
            };
          }
        })
      );

      // Sort by recent activity (exercises with recent workouts first)
      return exercisesWithData.sort((a, b) => {
        if (a.recent_workout_count !== b.recent_workout_count) {
          return (b.recent_workout_count || 0) - (a.recent_workout_count || 0);
        }
        return a.name.localeCompare(b.name);
      });

    } catch (error) {
      console.error('Error getting exercises for strength goals:', error);
      return [];
    }
  }

  /**
   * Get user's current weight for weight loss goals
   */
  export async function getCurrentWeightForGoals(): Promise<number | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get most recent weight measurement
      const bodyStats = await db.getUserBodyStats(user.id, 10);
      const recentWeights = bodyStats.filter(stat => stat.weight_lbs !== null);
      
      if (recentWeights.length === 0) return null;

      const latestWeight = recentWeights.sort((a, b) => 
        new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
      )[0];

      return latestWeight.weight_lbs;
    } catch (error) {
      console.error('Error getting current weight:', error);
      return null;
    }
  }

  /**
   * Get user's current body fat percentage for body composition goals
   */
  export async function getCurrentBodyFatForGoals(): Promise<number | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get most recent body fat measurement
      const bodyStats = await db.getUserBodyStats(user.id, 10);
      const recentMeasurements = bodyStats.filter(stat => stat.body_fat_percentage !== null);
      
      if (recentMeasurements.length === 0) return null;

      const latestMeasurement = recentMeasurements.sort((a, b) => 
        new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
      )[0];

      return latestMeasurement.body_fat_percentage;
    } catch (error) {
      console.error('Error getting current body fat:', error);
      return null;
    }
  }

  
  /**
   * Calculate progress for a specific goal with transparent formulas
   */
  export async function calculateGoalProgress(goal: Goal): Promise<ProgressCalculationResult> {
    try {
      switch (goal.goal_type) {
        case 'weight_loss':
          return await calculateWeightLossProgress(goal);
        case 'strength_gain':
          return await calculateStrengthGainProgress(goal);
        case 'body_composition':
          return await calculateBodyCompositionProgress(goal);
        default:
          throw new Error(`Unsupported goal type: ${goal.goal_type}`);
      }
    } catch (error) {
      console.error('Progress calculation error:', error);
      
      // Return default progress result with error indication
      return {
        goal_id: goal.id,
        current_progress_percentage: goal.current_progress_percentage || 0,
        data_source_description: 'Error calculating progress - insufficient data or calculation failure',
        calculation_formula: 'N/A (Error)',
        is_achieved: false,
        last_updated: new Date().toISOString(),
        data_points_count: 0,
        calculation_date_range: {
          start: goal.created_date,
          end: new Date().toISOString().split('T')[0]
        }
      };
    }
  }

  /**
   * Calculate weight loss progress based on body measurements
   */
  async function calculateWeightLossProgress(goal: Goal): Promise<ProgressCalculationResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get user's weight measurements since goal creation
    const bodyStats = await db.getUserBodyStats(user.id, 50);
    const relevantMeasurements = bodyStats.filter(stat => 
      stat.weight_lbs !== null && 
      stat.measured_at >= goal.created_date
    );

    // Handle case with no measurements
    if (relevantMeasurements.length === 0 || !goal.start_weight_lbs || !goal.target_weight_lbs) {
      return {
        goal_id: goal.id,
        current_progress_percentage: 0,
        data_source_description: 'No weight measurements found since goal creation. Enter your current weight to track progress.',
        calculation_formula: 'Progress = (start_weight - current_weight) / (start_weight - target_weight) × 100%',
        is_achieved: false,
        last_updated: new Date().toISOString(),
        data_points_count: 0,
        calculation_date_range: {
          start: goal.created_date,
          end: new Date().toISOString().split('T')[0]
        }
      };
    }

    // Get most recent weight measurement
    const latestMeasurement = relevantMeasurements.sort((a, b) => 
      new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
    )[0];

    const currentWeight = latestMeasurement.weight_lbs!;
    const startWeight = goal.start_weight_lbs;
    const targetWeight = goal.target_weight_lbs;

    // Calculate progress percentage
    const weightLost = startWeight - currentWeight;
    const totalWeightToLose = startWeight - targetWeight;
    const progressPercentage = Math.max(0, Math.min(100, (weightLost / totalWeightToLose) * 100));

    // Check if goal is achieved
    const isAchieved = currentWeight <= targetWeight;

    // Build data source description
    const measurementDays = Math.ceil(
      (new Date(latestMeasurement.measured_at).getTime() - new Date(goal.created_date).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    const dataSourceDescription = `Based on ${relevantMeasurements.length} weight measurement${relevantMeasurements.length > 1 ? 's' : ''} over ${measurementDays} days since goal creation. Latest: ${currentWeight}lbs on ${new Date(latestMeasurement.measured_at).toLocaleDateString()}.`;

    return {
      goal_id: goal.id,
      current_progress_percentage: Math.round(progressPercentage * 100) / 100,
      data_source_description: dataSourceDescription,
      calculation_formula: `Progress = (${startWeight} - ${currentWeight}) / (${startWeight} - ${targetWeight}) × 100% = ${Math.round(progressPercentage)}%`,
      is_achieved: isAchieved,
      last_updated: new Date().toISOString(),
      milestone_data: {
        current_value: currentWeight,
        target_value: targetWeight,
        start_value: startWeight,
        unit: 'lbs'
      },
      data_points_count: relevantMeasurements.length,
      calculation_date_range: {
        start: goal.created_date,
        end: latestMeasurement.measured_at.split('T')[0]
      }
    };
  }

  /**
   * Calculate strength gain progress based on workout data
   */
  async function calculateStrengthGainProgress(goal: Goal): Promise<ProgressCalculationResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    if (!goal.target_exercise_id || !goal.target_weight_for_exercise_lbs) {
      return {
        goal_id: goal.id,
        current_progress_percentage: 0,
        data_source_description: 'Goal missing exercise or target weight information.',
        calculation_formula: 'N/A - Invalid goal configuration',
        is_achieved: false,
        last_updated: new Date().toISOString(),
        data_points_count: 0,
        calculation_date_range: {
          start: goal.created_date,
          end: new Date().toISOString().split('T')[0]
        }
      };
    }

    // Get workout sessions since goal creation
    const workoutSessions = await db.getUserWorkoutSessions(user.id, 100);
    const relevantSessions = workoutSessions.filter(session => 
      session.start_time >= goal.created_date &&
      session.completion_status === 'completed'
    );

    if (relevantSessions.length === 0) {
      return {
        goal_id: goal.id,
        current_progress_percentage: 0,
        data_source_description: 'No completed workouts found since goal creation. Log workouts with the target exercise to track progress.',
        calculation_formula: 'Progress = (current_max - start_max) / (target_max - start_max) × 100%',
        is_achieved: false,
        last_updated: new Date().toISOString(),
        data_points_count: 0,
        calculation_date_range: {
          start: goal.created_date,
          end: new Date().toISOString().split('T')[0]
        }
      };
    }

    // Get personal records for the target exercise
    const personalRecords = await db.getPersonalRecords(user.id, goal.target_exercise_id);
    const relevantPRs = personalRecords.filter(pr => 
      pr.achieved_at >= goal.created_date &&
      pr.record_type === 'max_weight'
    );

    // Find current max weight
    let currentMaxWeight = goal.start_exercise_max_weight_lbs || 0;
    let totalSetsLogged = 0;
    let latestWorkoutDate = goal.created_date;

    // Count sets and find max weight from workout data
    for (const session of relevantSessions) {
      const exercises = await db.getWorkoutExercises(session.id);
      const targetExercise = exercises.find(ex => ex.exercise_id === goal.target_exercise_id);
      
      if (targetExercise) {
        const sets = await db.getWorkoutSets(targetExercise.id);
        totalSetsLogged += sets.length;
        
        // Find max weight in this session
        const sessionMaxWeight = Math.max(...sets.map(set => set.weight_lbs));
        if (sessionMaxWeight > currentMaxWeight) {
          currentMaxWeight = sessionMaxWeight;
          latestWorkoutDate = session.start_time;
        }
      }
    }

    // Use PR data if available and higher
    if (relevantPRs.length > 0) {
      const latestPR = relevantPRs.sort((a, b) => 
        new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime()
      )[0];
      
      if (latestPR.weight_lbs && latestPR.weight_lbs > currentMaxWeight) {
        currentMaxWeight = latestPR.weight_lbs;
        latestWorkoutDate = latestPR.achieved_at;
      }
    }

    // Calculate progress
    const startWeight = goal.start_exercise_max_weight_lbs || 0;
    const targetWeight = goal.target_weight_for_exercise_lbs;
    const weightGained = currentMaxWeight - startWeight;
    const totalWeightToGain = targetWeight - startWeight;
    
    const progressPercentage = totalWeightToGain > 0 ? 
      Math.max(0, Math.min(100, (weightGained / totalWeightToGain) * 100)) : 0;

    const isAchieved = currentMaxWeight >= targetWeight;

    // Build data source description
    const workoutDays = Math.ceil(
      (new Date(latestWorkoutDate).getTime() - new Date(goal.created_date).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    const dataSourceDescription = `Based on ${relevantSessions.length} completed workout${relevantSessions.length > 1 ? 's' : ''} and ${totalSetsLogged} sets over ${workoutDays} days. Current max: ${currentMaxWeight}lbs (${new Date(latestWorkoutDate).toLocaleDateString()}).`;

    return {
      goal_id: goal.id,
      current_progress_percentage: Math.round(progressPercentage * 100) / 100,
      data_source_description: dataSourceDescription,
      calculation_formula: `Progress = (${currentMaxWeight} - ${startWeight}) / (${targetWeight} - ${startWeight}) × 100% = ${Math.round(progressPercentage)}%`,
      is_achieved: isAchieved,
      last_updated: new Date().toISOString(),
      milestone_data: {
        current_value: currentMaxWeight,
        target_value: targetWeight,
        start_value: startWeight,
        unit: 'lbs'
      },
      data_points_count: totalSetsLogged,
      calculation_date_range: {
        start: goal.created_date,
        end: latestWorkoutDate.split('T')[0]
      }
    };
  }

  /**
   * Calculate body composition progress based on body fat measurements
   */
  async function calculateBodyCompositionProgress(goal: Goal): Promise<ProgressCalculationResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get body composition measurements since goal creation
    const bodyStats = await db.getUserBodyStats(user.id, 50);
    const relevantMeasurements = bodyStats.filter(stat => 
      stat.body_fat_percentage !== null && 
      stat.measured_at >= goal.created_date
    );

    if (relevantMeasurements.length === 0 || !goal.start_body_fat_percentage || !goal.target_body_fat_percentage) {
      return {
        goal_id: goal.id,
        current_progress_percentage: 0,
        data_source_description: 'No body fat measurements found since goal creation. Enter body composition data to track progress.',
        calculation_formula: 'Progress = (start_bf% - current_bf%) / (start_bf% - target_bf%) × 100%',
        is_achieved: false,
        last_updated: new Date().toISOString(),
        data_points_count: 0,
        calculation_date_range: {
          start: goal.created_date,
          end: new Date().toISOString().split('T')[0]
        }
      };
    }

    // Get most recent body fat measurement
    const latestMeasurement = relevantMeasurements.sort((a, b) => 
      new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
    )[0];

    const currentBodyFat = latestMeasurement.body_fat_percentage!;
    const startBodyFat = goal.start_body_fat_percentage;
    const targetBodyFat = goal.target_body_fat_percentage;

    // Calculate progress percentage
    const bodyFatReduced = startBodyFat - currentBodyFat;
    const totalBodyFatToReduce = startBodyFat - targetBodyFat;
    const progressPercentage = totalBodyFatToReduce > 0 ? 
      Math.max(0, Math.min(100, (bodyFatReduced / totalBodyFatToReduce) * 100)) : 0;

    const isAchieved = currentBodyFat <= targetBodyFat;

    // Build data source description
    const measurementDays = Math.ceil(
      (new Date(latestMeasurement.measured_at).getTime() - new Date(goal.created_date).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    const dataSourceDescription = `Based on ${relevantMeasurements.length} body composition measurement${relevantMeasurements.length > 1 ? 's' : ''} over ${measurementDays} days since goal creation. Current: ${currentBodyFat}% body fat (${new Date(latestMeasurement.measured_at).toLocaleDateString()}).`;

    return {
      goal_id: goal.id,
      current_progress_percentage: Math.round(progressPercentage * 100) / 100,
      data_source_description: dataSourceDescription,
      calculation_formula: `Progress = (${startBodyFat}% - ${currentBodyFat}%) / (${startBodyFat}% - ${targetBodyFat}%) × 100% = ${Math.round(progressPercentage)}%`,
      is_achieved: isAchieved,
      last_updated: new Date().toISOString(),
      milestone_data: {
        current_value: currentBodyFat,
        target_value: targetBodyFat,
        start_value: startBodyFat,
        unit: '%'
      },
      data_points_count: relevantMeasurements.length,
      calculation_date_range: {
        start: goal.created_date,
        end: latestMeasurement.measured_at.split('T')[0]
      }
    };
  }

  /**
   * Update goal progress in database
   */
  export async function updateGoalProgress(goal: Goal): Promise<ProgressCalculationResult> {
    const progressResult = await calculateGoalProgress(goal);
    
    try {
      // Update goal in database with new progress
      await supabase
        .from('user_goals')
        .update({
          current_progress_percentage: progressResult.current_progress_percentage,
          is_achieved: progressResult.is_achieved,
          achieved_date: progressResult.is_achieved ? 
            new Date().toISOString().split('T')[0] : null
        })
        .eq('id', goal.id);
        
    } catch (error) {
      console.error('Failed to update goal progress in database:', error);
      // Return progress result even if database update fails
    }
    
    return progressResult;
  }

  /**
   * Calculate progress for multiple goals
   */
  export async function calculateMultipleGoalsProgress(goals: Goal[]): Promise<ProgressCalculationResult[]> {
    const results: ProgressCalculationResult[] = [];
    
    for (const goal of goals) {
      try {
        const progress = await calculateGoalProgress(goal);
        results.push(progress);
      } catch (error) {
        console.error(`Failed to calculate progress for goal ${goal.id}:`, error);
        // Add error result
        results.push({
          goal_id: goal.id,
          current_progress_percentage: 0,
          data_source_description: 'Error calculating progress',
          calculation_formula: 'Error',
          is_achieved: false,
          last_updated: new Date().toISOString(),
          data_points_count: 0,
          calculation_date_range: {
            start: goal.created_date,
            end: new Date().toISOString().split('T')[0]
          }
        });
      }
    }
    
    return results;
  }
}