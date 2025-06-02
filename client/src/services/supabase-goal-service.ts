// FitForge Goal Management Service
// Real Data-Driven Goal CRUD Operations with TypeScript and Zod Validation
// Created: June 1, 2025

import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// ============================================================================
// TYPESCRIPT TYPES & INTERFACES
// ============================================================================

export type GoalType = 'weight_loss' | 'strength_gain' | 'body_composition';

export interface Goal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  goal_title: string;
  goal_description?: string;
  
  // Target values (flexible based on goal type)
  target_weight_lbs?: number;
  target_body_fat_percentage?: number;
  target_exercise_id?: string;
  target_weight_for_exercise_lbs?: number;
  target_reps_for_exercise?: number;
  
  // Starting baseline (recorded when goal is created)
  start_weight_lbs?: number;
  start_body_fat_percentage?: number;
  start_exercise_max_weight_lbs?: number;
  start_exercise_max_reps?: number;
  
  // Timeline
  target_date: string; // ISO date string
  created_date: string; // ISO date string
  
  // Progress tracking
  current_progress_percentage: number;
  is_achieved: boolean;
  achieved_date?: string; // ISO date string
  
  // Motivation and tracking
  motivation_notes?: string;
  reward_description?: string;
  
  // Goal status
  is_active: boolean;
  priority_level: 'high' | 'medium' | 'low';
  
  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface GoalFormData {
  goal_type: GoalType;
  goal_title: string;
  goal_description?: string;
  target_date: string;
  
  // Weight loss specific
  target_weight_lbs?: number;
  start_weight_lbs?: number;
  
  // Body composition specific
  target_body_fat_percentage?: number;
  start_body_fat_percentage?: number;
  
  // Strength gain specific
  target_exercise_id?: string;
  target_weight_for_exercise_lbs?: number;
  target_reps_for_exercise?: number;
  start_exercise_max_weight_lbs?: number;
  start_exercise_max_reps?: number;
  
  // Motivation
  motivation_notes?: string;
  reward_description?: string;
  priority_level: 'high' | 'medium' | 'low';
}

export interface ProgressCalculation {
  goal_id: string;
  current_progress_percentage: number;
  data_source_description: string;
  calculation_formula: string;
  is_achieved: boolean;
  last_updated: string;
}

export interface GoalFilters {
  goal_type?: GoalType;
  is_active?: boolean;
  is_achieved?: boolean;
  priority_level?: 'high' | 'medium' | 'low';
}

export interface GoalSortOptions {
  field: 'created_at' | 'target_date' | 'priority_level' | 'current_progress_percentage';
  direction: 'asc' | 'desc';
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

const GoalTypeEnum = z.enum(['weight_loss', 'strength_gain', 'body_composition']);
const PriorityLevelEnum = z.enum(['high', 'medium', 'low']);

export const CreateGoalSchema = z.object({
  goal_type: GoalTypeEnum,
  goal_title: z.string().min(1, 'Goal title is required').max(100, 'Goal title too long'),
  goal_description: z.string().max(500, 'Description too long').optional(),
  target_date: z.string().refine((date) => {
    const targetDate = new Date(date);
    const today = new Date();
    return targetDate > today;
  }, 'Target date must be in the future'),
  
  // Weight loss fields
  target_weight_lbs: z.number().positive('Weight must be positive').max(1000, 'Weight too high').optional(),
  start_weight_lbs: z.number().positive('Weight must be positive').max(1000, 'Weight too high').optional(),
  
  // Body composition fields
  target_body_fat_percentage: z.number().min(5, 'Body fat too low').max(50, 'Body fat too high').optional(),
  start_body_fat_percentage: z.number().min(5, 'Body fat too low').max(50, 'Body fat too high').optional(),
  
  // Strength gain fields
  target_exercise_id: z.string().optional(),
  target_weight_for_exercise_lbs: z.number().positive('Weight must be positive').max(2000, 'Weight too high').optional(),
  target_reps_for_exercise: z.number().int().min(1, 'Reps must be at least 1').max(100, 'Reps too high').optional(),
  start_exercise_max_weight_lbs: z.number().positive('Weight must be positive').max(2000, 'Weight too high').optional(),
  start_exercise_max_reps: z.number().int().min(1, 'Reps must be at least 1').max(100, 'Reps too high').optional(),
  
  // Motivation fields
  motivation_notes: z.string().max(1000, 'Notes too long').optional(),
  reward_description: z.string().max(500, 'Reward description too long').optional(),
  priority_level: PriorityLevelEnum.default('medium'),
}).refine((data) => {
  // Goal type specific validation
  if (data.goal_type === 'weight_loss') {
    return data.target_weight_lbs !== undefined && data.start_weight_lbs !== undefined;
  }
  if (data.goal_type === 'body_composition') {
    return data.target_body_fat_percentage !== undefined;
  }
  if (data.goal_type === 'strength_gain') {
    return data.target_exercise_id !== undefined && 
           (data.target_weight_for_exercise_lbs !== undefined || data.target_reps_for_exercise !== undefined);
  }
  return true;
}, {
  message: 'Required fields missing for selected goal type',
});

export const UpdateGoalSchema = z.object({
  id: z.string().uuid('Invalid goal ID'),
  goal_type: GoalTypeEnum.optional(),
  goal_title: z.string().min(1, 'Goal title is required').max(255, 'Goal title must be less than 255 characters').optional(),
  goal_description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  target_date: z.date().optional(),
  target_weight_lbs: z.number().positive('Target weight must be positive').optional(),
  target_body_fat_percentage: z.number().min(1, 'Body fat must be at least 1%').max(50, 'Body fat must be at most 50%').optional(),
  target_exercise_id: z.string().optional(),
  target_weight_for_exercise_lbs: z.number().positive('Exercise weight must be positive').optional(),
  target_reps_for_exercise: z.number().int().positive('Reps must be a positive integer').optional(),
  start_weight_lbs: z.number().positive('Start weight must be positive').optional(),
  start_body_fat_percentage: z.number().min(1).max(50).optional(),
  start_exercise_max_weight_lbs: z.number().positive().optional(),
  start_exercise_max_reps: z.number().int().positive().optional(),
  motivation_notes: z.string().max(500).optional(),
  reward_description: z.string().max(255).optional(),
  is_active: z.boolean().optional(),
  priority_level: PriorityLevelEnum.optional(),
});

export const GoalFiltersSchema = z.object({
  goal_type: GoalTypeEnum.optional(),
  is_active: z.boolean().optional(),
  is_achieved: z.boolean().optional(),
  priority_level: PriorityLevelEnum.optional(),
});

// ============================================================================
// SUPABASE GOAL SERVICE FUNCTIONS
// ============================================================================

export class GoalServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'GoalServiceError';
  }
}

/**
 * Create a new goal with comprehensive validation
 */
export async function createGoal(goalData: GoalFormData): Promise<Goal> {
  try {
    // Validate input data
    const validatedData = CreateGoalSchema.parse(goalData);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new GoalServiceError('User not authenticated', 'AUTH_ERROR');
    }
    
    // Prepare goal data for database
    const goalRecord = {
      user_id: user.id,
      goal_type: validatedData.goal_type,
      goal_title: validatedData.goal_title,
      goal_description: validatedData.goal_description,
      target_date: validatedData.target_date,
      created_date: new Date().toISOString().split('T')[0], // Current date
      
      // Target values
      target_weight_lbs: validatedData.target_weight_lbs,
      target_body_fat_percentage: validatedData.target_body_fat_percentage,
      target_exercise_id: validatedData.target_exercise_id,
      target_weight_for_exercise_lbs: validatedData.target_weight_for_exercise_lbs,
      target_reps_for_exercise: validatedData.target_reps_for_exercise,
      
      // Starting baseline
      start_weight_lbs: validatedData.start_weight_lbs,
      start_body_fat_percentage: validatedData.start_body_fat_percentage,
      start_exercise_max_weight_lbs: validatedData.start_exercise_max_weight_lbs,
      start_exercise_max_reps: validatedData.start_exercise_max_reps,
      
      // Progress tracking (defaults)
      current_progress_percentage: 0.0,
      is_achieved: false,
      
      // Motivation
      motivation_notes: validatedData.motivation_notes,
      reward_description: validatedData.reward_description,
      
      // Status
      is_active: true,
      priority_level: validatedData.priority_level,
    };
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('user_goals')
      .insert(goalRecord)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating goal:', error);
      throw new GoalServiceError(
        `Failed to create goal: ${error.message}`,
        error.code
      );
    }
    
    return data as Goal;
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new GoalServiceError(`Validation error: ${messages}`, 'VALIDATION_ERROR');
    }
    
    if (error instanceof GoalServiceError) {
      throw error;
    }
    
    console.error('Unexpected error creating goal:', error);
    throw new GoalServiceError('Unexpected error creating goal', 'UNKNOWN_ERROR');
  }
}

/**
 * Get user goals with filtering and sorting
 */
export async function getUserGoals(
  filters: GoalFilters = {},
  sort: GoalSortOptions = { field: 'created_at', direction: 'desc' }
): Promise<Goal[]> {
  try {
    // Validate filters
    const validatedFilters = GoalFiltersSchema.parse(filters);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new GoalServiceError('User not authenticated', 'AUTH_ERROR');
    }
    
    // Build query
    let query = supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id);
    
    // Apply filters
    if (validatedFilters.goal_type) {
      query = query.eq('goal_type', validatedFilters.goal_type);
    }
    
    if (validatedFilters.is_active !== undefined) {
      query = query.eq('is_active', validatedFilters.is_active);
    }
    
    if (validatedFilters.is_achieved !== undefined) {
      query = query.eq('is_achieved', validatedFilters.is_achieved);
    }
    
    if (validatedFilters.priority_level) {
      query = query.eq('priority_level', validatedFilters.priority_level);
    }
    
    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error fetching goals:', error);
      throw new GoalServiceError(
        `Failed to fetch goals: ${error.message}`,
        error.code
      );
    }
    
    return data as Goal[];
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new GoalServiceError(`Filter validation error: ${messages}`, 'VALIDATION_ERROR');
    }
    
    if (error instanceof GoalServiceError) {
      throw error;
    }
    
    console.error('Unexpected error fetching goals:', error);
    throw new GoalServiceError('Unexpected error fetching goals', 'UNKNOWN_ERROR');
  }
}

/**
 * Update a goal with partial data
 */
export async function updateGoal(goalId: string, updates: Partial<GoalFormData> & { is_achieved?: boolean; achieved_date?: string; current_progress_percentage?: number }): Promise<Goal> {
  try {
    // Validate input data
    const validatedData = UpdateGoalSchema.parse({ id: goalId, ...updates });
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new GoalServiceError('User not authenticated', 'AUTH_ERROR');
    }
    
    // Remove ID from update data
    const { id, ...updateData } = validatedData;
    
    // Update in Supabase
    const { data, error } = await supabase
      .from('user_goals')
      .update(updateData)
      .eq('id', goalId)
      .eq('user_id', user.id) // Security: only update user's own goals
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating goal:', error);
      throw new GoalServiceError(
        `Failed to update goal: ${error.message}`,
        error.code
      );
    }
    
    if (!data) {
      throw new GoalServiceError('Goal not found or access denied', 'NOT_FOUND');
    }
    
    return data as Goal;
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new GoalServiceError(`Validation error: ${messages}`, 'VALIDATION_ERROR');
    }
    
    if (error instanceof GoalServiceError) {
      throw error;
    }
    
    console.error('Unexpected error updating goal:', error);
    throw new GoalServiceError('Unexpected error updating goal', 'UNKNOWN_ERROR');
  }
}

/**
 * Delete a goal with cascade handling
 */
export async function deleteGoal(goalId: string): Promise<void> {
  try {
    // Validate goal ID
    const goalIdValidation = z.string().uuid('Invalid goal ID').parse(goalId);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new GoalServiceError('User not authenticated', 'AUTH_ERROR');
    }
    
    // Delete from Supabase (cascade will handle related records)
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalIdValidation)
      .eq('user_id', user.id); // Security: only delete user's own goals
    
    if (error) {
      console.error('Supabase error deleting goal:', error);
      throw new GoalServiceError(
        `Failed to delete goal: ${error.message}`,
        error.code
      );
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new GoalServiceError('Invalid goal ID format', 'VALIDATION_ERROR');
    }
    
    if (error instanceof GoalServiceError) {
      throw error;
    }
    
    console.error('Unexpected error deleting goal:', error);
    throw new GoalServiceError('Unexpected error deleting goal', 'UNKNOWN_ERROR');
  }
}

/**
 * Get a specific goal by ID
 */
export async function getGoalById(goalId: string): Promise<Goal | null> {
  try {
    // Validate goal ID
    const goalIdValidation = z.string().uuid('Invalid goal ID').parse(goalId);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new GoalServiceError('User not authenticated', 'AUTH_ERROR');
    }
    
    // Fetch from Supabase
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('id', goalIdValidation)
      .eq('user_id', user.id) // Security: only access user's own goals
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      console.error('Supabase error fetching goal:', error);
      throw new GoalServiceError(
        `Failed to fetch goal: ${error.message}`,
        error.code
      );
    }
    
    return data as Goal;
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new GoalServiceError('Invalid goal ID format', 'VALIDATION_ERROR');
    }
    
    if (error instanceof GoalServiceError) {
      throw error;
    }
    
    console.error('Unexpected error fetching goal:', error);
    throw new GoalServiceError('Unexpected error fetching goal', 'UNKNOWN_ERROR');
  }
}

/**
 * Mark a goal as achieved
 */
export async function markGoalAsAchieved(goalId: string): Promise<Goal> {
  try {
    const updatedGoal = await updateGoal(goalId, {
      is_achieved: true,
      achieved_date: new Date().toISOString().split('T')[0],
      current_progress_percentage: 100.0,
    });
    
    return updatedGoal;
    
  } catch (error) {
    console.error('Error marking goal as achieved:', error);
    throw error;
  }
}

/**
 * Get active goals count for dashboard
 */
export async function getActiveGoalsCount(): Promise<number> {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new GoalServiceError('User not authenticated', 'AUTH_ERROR');
    }
    
    const { count, error } = await supabase
      .from('user_goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_achieved', false);
    
    if (error) {
      console.error('Supabase error counting goals:', error);
      throw new GoalServiceError(
        `Failed to count goals: ${error.message}`,
        error.code
      );
    }
    
    return count || 0;
    
  } catch (error) {
    if (error instanceof GoalServiceError) {
      throw error;
    }
    
    console.error('Unexpected error counting goals:', error);
    throw new GoalServiceError('Unexpected error counting goals', 'UNKNOWN_ERROR');
  }
}