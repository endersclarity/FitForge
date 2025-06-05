// FitForge Goal Management Service
// Real Data-Driven Goal CRUD Operations with TypeScript and Zod Validation
// Updated: June 4, 2025 - Connected to Backend API

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
// BACKEND API GOAL SERVICE FUNCTIONS
// ============================================================================

export class GoalServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'GoalServiceError';
  }
}

/**
 * Get the base API URL for goals
 */
function getApiBaseUrl(): string {
  // Use current origin for the API calls
  return `${window.location.origin}/api/goals`;
}

/**
 * Create a new goal with comprehensive validation
 */
export async function createGoal(goalData: GoalFormData): Promise<Goal> {
  try {
    // Validate input data
    const validatedData = CreateGoalSchema.parse(goalData);
    
    // Prepare goal data for API
    const goalRecord = {
      goal_type: validatedData.goal_type,
      goal_title: validatedData.goal_title,
      goal_description: validatedData.goal_description,
      target_date: validatedData.target_date,
      
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
      
      // Motivation
      motivation_notes: validatedData.motivation_notes,
      reward_description: validatedData.reward_description,
      
      // Status
      priority_level: validatedData.priority_level,
    };
    
    // Call backend API
    const response = await fetch(getApiBaseUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-id': '1' // Use default user ID for now
      },
      body: JSON.stringify(goalRecord)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create goal' }));
      throw new GoalServiceError(
        `Failed to create goal: ${errorData.message || 'Unknown error'}`,
        'API_ERROR'
      );
    }
    
    const responseData = await response.json();
    return responseData.goal as Goal;
    
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
    
    // Build query parameters
    const params = new URLSearchParams();
    
    // Apply filters
    if (validatedFilters.goal_type) {
      params.append('goal_type', validatedFilters.goal_type);
    }
    
    if (validatedFilters.is_active !== undefined) {
      params.append('is_active', validatedFilters.is_active.toString());
    }
    
    if (validatedFilters.is_achieved !== undefined) {
      params.append('is_achieved', validatedFilters.is_achieved.toString());
    }
    
    if (validatedFilters.priority_level) {
      params.append('priority_level', validatedFilters.priority_level);
    }
    
    // Apply sorting
    params.append('sort_field', sort.field);
    params.append('sort_direction', sort.direction);
    
    // Call backend API
    const url = `${getApiBaseUrl()}?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'user-id': '1' // Use default user ID for now
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch goals' }));
      throw new GoalServiceError(
        `Failed to fetch goals: ${errorData.message || 'Unknown error'}`,
        'API_ERROR'
      );
    }
    
    const responseData = await response.json();
    return responseData.goals as Goal[];
    
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
    
    // Remove ID from update data
    const { id, ...updateData } = validatedData;
    
    // Call backend API
    const response = await fetch(`${getApiBaseUrl()}/${goalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'user-id': '1' // Use default user ID for now
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update goal' }));
      throw new GoalServiceError(
        `Failed to update goal: ${errorData.message || 'Unknown error'}`,
        'API_ERROR'
      );
    }
    
    const responseData = await response.json();
    return responseData.goal as Goal;
    
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
    
    // Call backend API
    const response = await fetch(`${getApiBaseUrl()}/${goalIdValidation}`, {
      method: 'DELETE',
      headers: {
        'user-id': '1' // Use default user ID for now
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete goal' }));
      throw new GoalServiceError(
        `Failed to delete goal: ${errorData.message || 'Unknown error'}`,
        'API_ERROR'
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
    
    // Call backend API
    const response = await fetch(`${getApiBaseUrl()}/${goalIdValidation}`, {
      method: 'GET',
      headers: {
        'user-id': '1' // Use default user ID for now
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Goal not found
      }
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch goal' }));
      throw new GoalServiceError(
        `Failed to fetch goal: ${errorData.message || 'Unknown error'}`,
        'API_ERROR'
      );
    }
    
    const responseData = await response.json();
    return responseData.goal as Goal;
    
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
    // Use getUserGoals with filters to get active, non-achieved goals
    const activeGoals = await getUserGoals({
      is_active: true,
      is_achieved: false
    });
    
    return activeGoals.length;
    
  } catch (error) {
    if (error instanceof GoalServiceError) {
      throw error;
    }
    
    console.error('Unexpected error counting goals:', error);
    throw new GoalServiceError('Unexpected error counting goals', 'UNKNOWN_ERROR');
  }
}