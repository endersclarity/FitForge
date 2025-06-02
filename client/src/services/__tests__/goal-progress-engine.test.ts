/**
 * Goal Progress Engine Tests
 * Unit tests for goal progress calculations with transparent formulas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoalProgressEngine } from '../goal-progress-engine';
import { Goal, GoalType, ProgressCalculationResult } from '@/types/goals';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({
              data: [
                { weight: 75, recorded_at: '2024-05-01' },
                { weight: 72, recorded_at: '2024-06-01' }
              ],
              error: null
            })),
          })),
        })),
      })),
    })),
  }
}));

describe('GoalProgressEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create test goals
  const createTestGoal = (
    type: GoalType,
    overrides: Partial<Goal> = {}
  ): Goal => ({
    id: 'test-goal-1',
    user_id: 'test-user-id',
    title: `Test ${type} Goal`,
    goal_type: type,
    target_weight: type === 'weight_loss' ? 70 : 80,
    current_weight: type === 'weight_loss' ? 72 : 75,
    target_body_fat: type === 'body_composition' ? 15 : undefined,
    target_exercise_weight: type === 'strength_gain' ? 100 : undefined,
    target_reps: type === 'strength_gain' ? 8 : undefined,
    exercise_id: type === 'strength_gain' ? 'bench-press' : undefined,
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    updated_at: new Date(),
    is_active: true,
    ...overrides
  });

  describe('calculateGoalProgress', () => {
    describe('Weight Loss Goals', () => {
      it('should calculate weight loss progress correctly', async () => {
        const goal = createTestGoal('weight_loss', {
          target_weight: 70,
          current_weight: 72
        });

        const result = await GoalProgressEngine.calculateGoalProgress(goal);

        expect(result.progress_percentage).toBeCloseTo(60, 1); // (75-72)/(75-70) = 3/5 = 60%
        expect(result.data_points_used).toBeGreaterThan(0);
        expect(result.formula_used).toContain('(start_weight - current_weight) / (start_weight - target_weight)');
        expect(result.data_source_description).toContain('weight measurements');
        expect(result.is_on_track).toBe(true);
      });

      it('should handle insufficient data gracefully', async () => {
        const goal = createTestGoal('weight_loss');

        // Mock no weight data
        const mockSupabase = await import('@/lib/supabase');
        vi.mocked(mockSupabase.supabase.from).mockReturnValue({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              }))
            }))
          }))
        } as any);

        const result = await GoalProgressEngine.calculateGoalProgress(goal);

        expect(result.insufficient_data).toBe(true);
        expect(result.missing_data_suggestions).toContain('weight measurements');
        expect(result.data_points_used).toBe(0);
      });

      it('should handle weight gain (negative progress) gracefully', async () => {
        const goal = createTestGoal('weight_loss', {
          target_weight: 70,
          current_weight: 76 // Gained weight since starting
        });

        // Mock weight data showing weight gain
        const mockSupabase = await import('@/lib/supabase');
        vi.mocked(mockSupabase.supabase.from).mockReturnValue({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    { weight: 75, recorded_at: '2024-05-01' },
                    { weight: 76, recorded_at: '2024-06-01' }
                  ],
                  error: null
                })
              }))
            }))
          }))
        } as any);

        const result = await GoalProgressEngine.calculateGoalProgress(goal);

        expect(result.progress_percentage).toBeLessThan(0);
        expect(result.is_on_track).toBe(false);
        expect(result.suggestions).toContain('weight has increased');
      });

      it('should handle goal achievement (over 100% progress)', async () => {
        const goal = createTestGoal('weight_loss', {
          target_weight: 70,
          current_weight: 68 // Exceeded target
        });

        // Mock weight data showing goal achievement
        const mockSupabase = await import('@/lib/supabase');
        vi.mocked(mockSupabase.supabase.from).mockReturnValue({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    { weight: 75, recorded_at: '2024-05-01' },
                    { weight: 68, recorded_at: '2024-06-01' }
                  ],
                  error: null
                })
              }))
            }))
          }))
        } as any);

        const result = await GoalProgressEngine.calculateGoalProgress(goal);

        expect(result.progress_percentage).toBeGreaterThan(100);
        expect(result.is_achieved).toBe(true);
        expect(result.suggestions).toContain('Congratulations');
      });
    });

    describe('Strength Gain Goals', () => {
      it('should calculate strength progress from workout data', async () => {
        const goal = createTestGoal('strength_gain', {
          target_exercise_weight: 100,
          target_reps: 8,
          exercise_id: 'bench-press'
        });

        // Mock workout data
        const mockSupabase = await import('@/lib/supabase');
        vi.mocked(mockSupabase.supabase.from).mockReturnValue({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    { 
                      workout_sets: [
                        { weight: 80, reps: 8, completed: true },
                        { weight: 90, reps: 8, completed: true }
                      ],
                      date: '2024-06-01'
                    }
                  ],
                  error: null
                })
              }))
            }))
          }))
        } as any);

        const result = await GoalProgressEngine.calculateGoalProgress(goal);

        expect(result.progress_percentage).toBeCloseTo(50, 1); // (90-80)/(100-80) = 10/20 = 50%
        expect(result.formula_used).toContain('(current_max - start_max) / (target_weight - start_max)');
        expect(result.data_source_description).toContain('workout sessions');
        expect(result.current_value).toBe(90);
      });

      it('should handle no workout history for exercise', async () => {
        const goal = createTestGoal('strength_gain', {
          exercise_id: 'new-exercise'
        });

        // Mock no workout data
        const mockSupabase = await import('@/lib/supabase');
        vi.mocked(mockSupabase.supabase.from).mockReturnValue({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              }))
            }))
          }))
        } as any);

        const result = await GoalProgressEngine.calculateGoalProgress(goal);

        expect(result.insufficient_data).toBe(true);
        expect(result.missing_data_suggestions).toContain('workout sessions');
        expect(result.data_points_used).toBe(0);
      });
    });

    describe('Body Composition Goals', () => {
      it('should calculate body fat percentage progress', async () => {
        const goal = createTestGoal('body_composition', {
          target_body_fat: 15
        });

        // Mock body composition data
        const mockSupabase = await import('@/lib/supabase');
        vi.mocked(mockSupabase.supabase.from).mockReturnValue({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    { body_fat_percentage: 20, recorded_at: '2024-05-01' },
                    { body_fat_percentage: 17, recorded_at: '2024-06-01' }
                  ],
                  error: null
                })
              }))
            }))
          }))
        } as any);

        const result = await GoalProgressEngine.calculateGoalProgress(goal);

        expect(result.progress_percentage).toBeCloseTo(60, 1); // (20-17)/(20-15) = 3/5 = 60%
        expect(result.formula_used).toContain('body fat percentage');
        expect(result.data_source_description).toContain('body composition');
      });

      it('should handle missing body composition data', async () => {
        const goal = createTestGoal('body_composition');

        // Mock no body composition data
        const mockSupabase = await import('@/lib/supabase');
        vi.mocked(mockSupabase.supabase.from).mockReturnValue({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              }))
            }))
          }))
        } as any);

        const result = await GoalProgressEngine.calculateGoalProgress(goal);

        expect(result.insufficient_data).toBe(true);
        expect(result.missing_data_suggestions).toContain('body composition measurements');
      });
    });
  });

  describe('Timeline Calculations', () => {
    it('should calculate days remaining correctly', async () => {
      const deadline = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now
      const goal = createTestGoal('weight_loss', { deadline });

      const result = await GoalProgressEngine.calculateGoalProgress(goal);

      expect(result.days_remaining).toBeCloseTo(60, 1);
      expect(result.total_days).toBeGreaterThan(60);
    });

    it('should handle overdue goals', async () => {
      const deadline = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const goal = createTestGoal('weight_loss', { deadline });

      const result = await GoalProgressEngine.calculateGoalProgress(goal);

      expect(result.days_remaining).toBeLessThan(0);
      expect(result.is_overdue).toBe(true);
    });
  });

  describe('Formula Transparency', () => {
    it('should always include formula used in results', async () => {
      const goal = createTestGoal('weight_loss');

      const result = await GoalProgressEngine.calculateGoalProgress(goal);

      expect(result.formula_used).toBeDefined();
      expect(typeof result.formula_used).toBe('string');
      expect(result.formula_used.length).toBeGreaterThan(0);
    });

    it('should include data source description', async () => {
      const goal = createTestGoal('strength_gain');

      const result = await GoalProgressEngine.calculateGoalProgress(goal);

      expect(result.data_source_description).toBeDefined();
      expect(typeof result.data_source_description).toBe('string');
    });

    it('should count data points used accurately', async () => {
      const goal = createTestGoal('weight_loss');

      const result = await GoalProgressEngine.calculateGoalProgress(goal);

      expect(result.data_points_used).toBeDefined();
      expect(typeof result.data_points_used).toBe('number');
      expect(result.data_points_used).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid goal types gracefully', async () => {
      const goal = createTestGoal('weight_loss');
      // @ts-ignore - Testing invalid goal type
      goal.goal_type = 'invalid_type';

      await expect(GoalProgressEngine.calculateGoalProgress(goal))
        .rejects.toThrow('Unsupported goal type');
    });

    it('should handle goals with missing required fields', async () => {
      const goal = createTestGoal('weight_loss', {
        target_weight: undefined
      });

      await expect(GoalProgressEngine.calculateGoalProgress(goal))
        .rejects.toThrow('Missing required goal data');
    });

    it('should round progress percentages to reasonable precision', async () => {
      const goal = createTestGoal('weight_loss', {
        target_weight: 70.123,
        current_weight: 72.456
      });

      const result = await GoalProgressEngine.calculateGoalProgress(goal);

      if (!result.insufficient_data && result.progress_percentage !== undefined) {
        expect(result.progress_percentage).toEqual(
          Math.round(result.progress_percentage * 10) / 10
        );
      }
    });
  });
});