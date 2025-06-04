// FitForge Goal Progress Hook
// React hook for real-time goal progress calculations with transparent formulas

import { useState, useEffect, useCallback } from 'react';
import { 
  GoalProgressEngine, 
  ProgressCalculationResult 
} from '@/services/goal-progress-engine';
import { Goal } from '@/services/supabase-goal-service';
import { useToast } from '@/hooks/use-toast';

interface UseGoalProgressOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseGoalProgressReturn {
  progressResults: Map<string, ProgressCalculationResult>;
  isCalculating: boolean;
  error: string | null;
  calculateProgress: (goal: Goal) => Promise<ProgressCalculationResult>;
  calculateMultipleProgress: (goals: Goal[]) => Promise<ProgressCalculationResult[]>;
  refreshProgress: (goals: Goal[]) => Promise<void>;
  getProgressForGoal: (goalId: string) => ProgressCalculationResult | null;
}

export function useGoalProgress(options: UseGoalProgressOptions = {}): UseGoalProgressReturn {
  const { autoRefresh = false, refreshInterval = 300000 } = options; // 5 minutes default
  const { toast } = useToast();
  
  const [progressResults, setProgressResults] = useState<Map<string, ProgressCalculationResult>>(new Map());
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate progress for a single goal
   */
  const calculateProgress = useCallback(async (goal: Goal): Promise<ProgressCalculationResult> => {
    try {
      setIsCalculating(true);
      setError(null);
      
      const result = await GoalProgressEngine.calculateGoalProgress(goal);
      
      // Update local state
      setProgressResults(prev => new Map(prev).set(goal.id, result));
      
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate progress';
      setError(errorMessage);
      console.error('Progress calculation error:', err);
      
      // Return default result
      const defaultResult: ProgressCalculationResult = {
        goal_id: goal.id,
        current_progress_percentage: 0,
        data_source_description: 'Error calculating progress',
        calculation_formula: 'N/A (Error)',
        is_achieved: false,
        last_updated: new Date().toISOString(),
        data_points_count: 0,
        calculation_date_range: {
          start: goal.created_date,
          end: new Date().toISOString().split('T')[0]
        }
      };
      
      setProgressResults(prev => new Map(prev).set(goal.id, defaultResult));
      return defaultResult;
      
    } finally {
      setIsCalculating(false);
    }
  }, []);

  /**
   * Calculate progress for multiple goals
   */
  const calculateMultipleProgress = useCallback(async (goals: Goal[]): Promise<ProgressCalculationResult[]> => {
    try {
      setIsCalculating(true);
      setError(null);
      
      const results = await GoalProgressEngine.calculateMultipleGoalsProgress(goals);
      
      // Update local state
      setProgressResults(prev => {
        const newMap = new Map(prev);
        results.forEach(result => {
          newMap.set(result.goal_id, result);
        });
        return newMap;
      });
      
      return results;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate progress for multiple goals';
      setError(errorMessage);
      console.error('Multiple progress calculation error:', err);
      
      toast({
        title: 'Progress Calculation Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return [];
      
    } finally {
      setIsCalculating(false);
    }
  }, [toast]);

  /**
   * Refresh progress for existing goals
   */
  const refreshProgress = useCallback(async (goals: Goal[]): Promise<void> => {
    if (goals.length === 0) return;
    
    try {
      await calculateMultipleProgress(goals);
    } catch (err) {
      console.error('Failed to refresh progress:', err);
    }
  }, [calculateMultipleProgress]);

  /**
   * Get progress result for a specific goal
   */
  const getProgressForGoal = useCallback((goalId: string): ProgressCalculationResult | null => {
    return progressResults.get(goalId) || null;
  }, [progressResults]);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Note: This would require access to current goals
      // In practice, components using this hook should manage the refresh
      console.log('Auto-refresh triggered - components should handle goal refresh');
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return {
    progressResults,
    isCalculating,
    error,
    calculateProgress,
    calculateMultipleProgress,
    refreshProgress,
    getProgressForGoal,
  };
}

/**
 * Simplified hook for single goal progress
 */
export function useSingleGoalProgress(goal: Goal | null) {
  const [progressResult, setProgressResult] = useState<ProgressCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateProgress = useCallback(async () => {
    if (!goal) return;

    try {
      setIsCalculating(true);
      setError(null);
      
      const result = await GoalProgressEngine.calculateGoalProgress(goal);
      setProgressResult(result);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate progress';
      setError(errorMessage);
      console.error('Single goal progress calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [goal]);

  // Auto-calculate on goal change
  useEffect(() => {
    if (goal) {
      calculateProgress();
    }
  }, [goal, calculateProgress]);

  return {
    progressResult,
    isCalculating,
    error,
    refreshProgress: calculateProgress,
  };
}

/**
 * Hook for updating goal progress in database
 */
export function useGoalProgressUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateGoalProgress = useCallback(async (goal: Goal): Promise<ProgressCalculationResult> => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const result = await GoalProgressEngine.updateGoalProgress(goal);
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update goal progress';
      setError(errorMessage);
      console.error('Goal progress update error:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    updateGoalProgress,
    isUpdating,
    error,
  };
}