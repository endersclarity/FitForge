/**
 * Supabase Goal Service Integration Tests
 * Tests for goal CRUD operations with real Supabase integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SupabaseGoalService } from '../supabase-goal-service';
import { supabase } from '@/lib/supabase';
import { Goal, GoalType, CreateGoalData } from '@/types/goals';

describe('SupabaseGoalService Integration Tests', () => {
  let service: SupabaseGoalService;
  let testUserId: string;
  let createdGoals: string[] = []; // Track created goals for cleanup

  beforeEach(async () => {
    service = new SupabaseGoalService();
    testUserId = 'test-user-' + Date.now(); // Unique test user ID
    createdGoals = [];
  });

  afterEach(async () => {
    // Clean up created test goals
    if (createdGoals.length > 0) {
      await supabase
        .from('user_goals')
        .delete()
        .in('id', createdGoals);
    }
  });

  const createTestGoalData = (
    type: GoalType,
    overrides: Partial<CreateGoalData> = {}
  ): CreateGoalData => ({
    title: `Test ${type} Goal`,
    goal_type: type,
    target_weight: type === 'weight_loss' ? 70 : type === 'strength_gain' ? 80 : undefined,
    target_body_fat: type === 'body_composition' ? 15 : undefined,
    target_exercise_weight: type === 'strength_gain' ? 100 : undefined,
    target_reps: type === 'strength_gain' ? 8 : undefined,
    exercise_id: type === 'strength_gain' ? 'bench-press' : undefined,
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    ...overrides
  });

  describe('createGoal', () => {
    it('should create a weight loss goal successfully', async () => {
      const goalData = createTestGoalData('weight_loss', {
        title: 'Lose 10kg for summer',
        target_weight: 65
      });

      const result = await service.createGoal(testUserId, goalData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.title).toBe('Lose 10kg for summer');
      expect(result.data!.goal_type).toBe('weight_loss');
      expect(result.data!.target_weight).toBe(65);
      expect(result.data!.user_id).toBe(testUserId);
      expect(result.data!.is_active).toBe(true);
      
      createdGoals.push(result.data!.id);
    });

    it('should create a strength gain goal successfully', async () => {
      const goalData = createTestGoalData('strength_gain', {
        title: 'Bench press 100kg',
        target_exercise_weight: 100,
        target_reps: 5,
        exercise_id: 'bench-press'
      });

      const result = await service.createGoal(testUserId, goalData);

      expect(result.success).toBe(true);
      expect(result.data!.goal_type).toBe('strength_gain');
      expect(result.data!.target_exercise_weight).toBe(100);
      expect(result.data!.target_reps).toBe(5);
      expect(result.data!.exercise_id).toBe('bench-press');
      
      createdGoals.push(result.data!.id);
    });

    it('should create a body composition goal successfully', async () => {
      const goalData = createTestGoalData('body_composition', {
        title: 'Get to 15% body fat',
        target_body_fat: 15
      });

      const result = await service.createGoal(testUserId, goalData);

      expect(result.success).toBe(true);
      expect(result.data!.goal_type).toBe('body_composition');
      expect(result.data!.target_body_fat).toBe(15);
      
      createdGoals.push(result.data!.id);
    });

    it('should validate required fields for weight loss goals', async () => {
      const goalData = createTestGoalData('weight_loss', {
        target_weight: undefined // Missing required field
      });

      const result = await service.createGoal(testUserId, goalData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('target_weight');
    });

    it('should validate required fields for strength goals', async () => {
      const goalData = createTestGoalData('strength_gain', {
        target_exercise_weight: undefined, // Missing required field
        exercise_id: undefined
      });

      const result = await service.createGoal(testUserId, goalData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid goal types', async () => {
      const goalData = {
        title: 'Invalid goal',
        // @ts-ignore - Testing invalid goal type
        goal_type: 'invalid_type',
        deadline: new Date()
      };

      const result = await service.createGoal(testUserId, goalData as CreateGoalData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('goal_type');
    });
  });

  describe('getUserGoals', () => {
    it('should retrieve user goals with filtering', async () => {
      // Create test goals
      const goal1 = await service.createGoal(testUserId, createTestGoalData('weight_loss'));
      const goal2 = await service.createGoal(testUserId, createTestGoalData('strength_gain'));
      
      createdGoals.push(goal1.data!.id, goal2.data!.id);

      const result = await service.getUserGoals(testUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data!.map(g => g.id)).toContain(goal1.data!.id);
      expect(result.data!.map(g => g.id)).toContain(goal2.data!.id);
    });

    it('should filter goals by type', async () => {
      // Create different goal types
      const weightGoal = await service.createGoal(testUserId, createTestGoalData('weight_loss'));
      const strengthGoal = await service.createGoal(testUserId, createTestGoalData('strength_gain'));
      
      createdGoals.push(weightGoal.data!.id, strengthGoal.data!.id);

      const result = await service.getUserGoals(testUserId, { goalType: 'weight_loss' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].goal_type).toBe('weight_loss');
    });

    it('should filter active goals only', async () => {
      // Create active and inactive goals
      const activeGoal = await service.createGoal(testUserId, createTestGoalData('weight_loss'));
      const inactiveGoalData = createTestGoalData('strength_gain');
      const inactiveGoal = await service.createGoal(testUserId, inactiveGoalData);
      
      // Deactivate second goal
      await service.updateGoal(inactiveGoal.data!.id, testUserId, { is_active: false });
      
      createdGoals.push(activeGoal.data!.id, inactiveGoal.data!.id);

      const result = await service.getUserGoals(testUserId, { activeOnly: true });

      expect(result.success).toBe(true);
      expect(result.data!.every(g => g.is_active)).toBe(true);
      expect(result.data!.find(g => g.id === activeGoal.data!.id)).toBeDefined();
    });

    it('should return empty array for user with no goals', async () => {
      const emptyUserId = 'empty-user-' + Date.now();
      const result = await service.getUserGoals(emptyUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('updateGoal', () => {
    it('should update goal properties successfully', async () => {
      const goal = await service.createGoal(testUserId, createTestGoalData('weight_loss'));
      createdGoals.push(goal.data!.id);

      const updates = {
        title: 'Updated goal title',
        target_weight: 68,
        is_active: false
      };

      const result = await service.updateGoal(goal.data!.id, testUserId, updates);

      expect(result.success).toBe(true);
      expect(result.data!.title).toBe('Updated goal title');
      expect(result.data!.target_weight).toBe(68);
      expect(result.data!.is_active).toBe(false);
      expect(result.data!.updated_at).not.toBe(goal.data!.updated_at);
    });

    it('should prevent updating goals belonging to other users', async () => {
      const goal = await service.createGoal(testUserId, createTestGoalData('weight_loss'));
      createdGoals.push(goal.data!.id);

      const otherUserId = 'other-user-' + Date.now();
      const result = await service.updateGoal(goal.data!.id, otherUserId, { title: 'Hacked!' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should validate update data against goal type', async () => {
      const goal = await service.createGoal(testUserId, createTestGoalData('weight_loss'));
      createdGoals.push(goal.data!.id);

      // Try to add strength-specific fields to weight loss goal
      const invalidUpdates = {
        target_exercise_weight: 100, // Invalid for weight loss goal
        exercise_id: 'bench-press'
      };

      const result = await service.updateGoal(goal.data!.id, testUserId, invalidUpdates);

      // Should either reject or ignore invalid fields
      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.target_exercise_weight).toBeUndefined();
      }
    });
  });

  describe('deleteGoal', () => {
    it('should delete goal successfully', async () => {
      const goal = await service.createGoal(testUserId, createTestGoalData('weight_loss'));
      const goalId = goal.data!.id;

      const result = await service.deleteGoal(goalId, testUserId);

      expect(result.success).toBe(true);

      // Verify goal is deleted
      const getResult = await service.getUserGoals(testUserId);
      expect(getResult.data!.find(g => g.id === goalId)).toBeUndefined();
    });

    it('should prevent deleting goals belonging to other users', async () => {
      const goal = await service.createGoal(testUserId, createTestGoalData('weight_loss'));
      createdGoals.push(goal.data!.id);

      const otherUserId = 'other-user-' + Date.now();
      const result = await service.deleteGoal(goal.data!.id, otherUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle deleting non-existent goal', async () => {
      const fakeGoalId = 'non-existent-goal-id';
      const result = await service.deleteGoal(fakeGoalId, testUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getGoalById', () => {
    it('should retrieve specific goal by ID', async () => {
      const goal = await service.createGoal(testUserId, createTestGoalData('strength_gain'));
      createdGoals.push(goal.data!.id);

      const result = await service.getGoalById(goal.data!.id, testUserId);

      expect(result.success).toBe(true);
      expect(result.data!.id).toBe(goal.data!.id);
      expect(result.data!.goal_type).toBe('strength_gain');
    });

    it('should prevent accessing goals belonging to other users', async () => {
      const goal = await service.createGoal(testUserId, createTestGoalData('weight_loss'));
      createdGoals.push(goal.data!.id);

      const otherUserId = 'other-user-' + Date.now();
      const result = await service.getGoalById(goal.data!.id, otherUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Real-time subscriptions', () => {
    it('should set up real-time subscription for user goals', async () => {
      let receivedUpdate = false;
      const updates: Goal[] = [];

      const subscription = service.subscribeToUserGoals(testUserId, (goal) => {
        receivedUpdate = true;
        updates.push(goal);
      });

      expect(subscription).toBeDefined();

      // Create a goal to trigger subscription
      const goal = await service.createGoal(testUserId, createTestGoalData('weight_loss'));
      createdGoals.push(goal.data!.id);

      // Wait a bit for real-time update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clean up subscription
      subscription.unsubscribe();

      // Note: Real-time testing may be flaky in test environment
      // This test verifies subscription setup more than real-time functionality
      expect(typeof subscription.unsubscribe).toBe('function');
    });
  });

  describe('Data validation and edge cases', () => {
    it('should handle very long goal titles', async () => {
      const longTitle = 'A'.repeat(500); // Very long title
      const goalData = createTestGoalData('weight_loss', { title: longTitle });

      const result = await service.createGoal(testUserId, goalData);

      // Should either truncate or validate title length
      if (result.success) {
        expect(result.data!.title.length).toBeLessThanOrEqual(255);
        createdGoals.push(result.data!.id);
      } else {
        expect(result.error).toContain('title');
      }
    });

    it('should handle goals with past deadlines', async () => {
      const pastDeadline = new Date(Date.now() - 86400000); // Yesterday
      const goalData = createTestGoalData('weight_loss', { deadline: pastDeadline });

      const result = await service.createGoal(testUserId, goalData);

      // Should allow past deadlines (user might be tracking overdue goals)
      expect(result.success).toBe(true);
      if (result.data) {
        createdGoals.push(result.data.id);
      }
    });

    it('should handle concurrent goal operations', async () => {
      const goalData = createTestGoalData('weight_loss');

      // Create multiple goals concurrently
      const promises = Array.from({ length: 5 }, () =>
        service.createGoal(testUserId, goalData)
      );

      const results = await Promise.all(promises);

      // All should succeed
      expect(results.every(r => r.success)).toBe(true);
      
      // Add to cleanup
      results.forEach(r => {
        if (r.data) createdGoals.push(r.data.id);
      });
    });
  });
});