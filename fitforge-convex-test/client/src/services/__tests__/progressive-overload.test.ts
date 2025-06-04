/**
 * Progressive Overload Service Tests
 * Unit tests for the progressive overload intelligence algorithms
 */

import { ProgressiveOverloadService } from '../progressive-overload';
import { ExerciseHistory, WorkoutSession, WorkoutSet } from '@/types/progression';

describe('ProgressiveOverloadService', () => {
  let service: ProgressiveOverloadService;

  beforeEach(() => {
    service = new ProgressiveOverloadService();
  });

  // Helper function to create test data
  const createExerciseHistory = (
    exerciseType: 'compound' | 'isolation' = 'compound',
    sessions: Partial<WorkoutSession>[] = []
  ): ExerciseHistory => ({
    exerciseId: 1,
    exerciseName: 'Bench Press',
    exerciseType,
    category: 'strength',
    lastPerformed: new Date(),
    sessions: sessions.map((s, index) => ({
      sessionId: `session-${index}`,
      date: new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000), // Week intervals
      sets: [
        { setNumber: 1, weight: 80, reps: 8, completed: true, rpe: 7 },
        { setNumber: 2, weight: 80, reps: 8, completed: true, rpe: 7 },
        { setNumber: 3, weight: 80, reps: 8, completed: true, rpe: 8 }
      ],
      targetReps: 8,
      targetSets: 3,
      averageRPE: 7.3,
      ...s
    }))
  });

  describe('calculateProgression', () => {
    it('should suggest weight increase for successful sessions', () => {
      const history = createExerciseHistory('compound', [
        {
          sets: [
            { setNumber: 1, weight: 80, reps: 8, completed: true, rpe: 7 },
            { setNumber: 2, weight: 80, reps: 8, completed: true, rpe: 7 },
            { setNumber: 3, weight: 80, reps: 8, completed: true, rpe: 7 }
          ],
          averageRPE: 7
        }
      ]);

      const result = service.calculateProgression(history);

      expect(result.suggestion.suggestedWeight).toBe(82.5); // 80 + 2.5kg for compound
      expect(result.suggestion.confidenceLevel).toBe('high');
      expect(result.metrics.readyForProgression).toBe(true);
      expect(result.strategy).toBe('linear_progression');
    });

    it('should suggest maintaining weight for incomplete sessions', () => {
      const history = createExerciseHistory('compound', [
        {
          sets: [
            { setNumber: 1, weight: 80, reps: 8, completed: true, rpe: 7 },
            { setNumber: 2, weight: 80, reps: 6, completed: true, rpe: 9 }, // Failed reps
            { setNumber: 3, weight: 80, reps: 5, completed: true, rpe: 9 }
          ],
          averageRPE: 8.3
        }
      ]);

      const result = service.calculateProgression(history);

      expect(result.suggestion.suggestedWeight).toBe(80);
      expect(result.metrics.readyForProgression).toBe(false);
    });

    it('should suggest deload for high RPE sessions', () => {
      const history = createExerciseHistory('compound', [
        {
          sets: [
            { setNumber: 1, weight: 80, reps: 8, completed: true, rpe: 10 },
            { setNumber: 2, weight: 80, reps: 7, completed: true, rpe: 10 },
            { setNumber: 3, weight: 80, reps: 6, completed: true, rpe: 10 }
          ],
          averageRPE: 10
        }
      ]);

      const result = service.calculateProgression(history);

      expect(result.strategy).toBe('deload_protocol');
      expect(result.suggestion.suggestedWeight).toBe(72); // 80 * 0.9 = 10% deload
      expect(result.suggestion.increaseAmount).toBeLessThan(0);
    });

    it('should use smaller increments for isolation exercises', () => {
      const history = createExerciseHistory('isolation', [
        {
          sets: [
            { setNumber: 1, weight: 20, reps: 12, completed: true, rpe: 7 },
            { setNumber: 2, weight: 20, reps: 12, completed: true, rpe: 7 },
            { setNumber: 3, weight: 20, reps: 12, completed: true, rpe: 7 }
          ],
          averageRPE: 7
        }
      ]);

      const result = service.calculateProgression(history);

      expect(result.suggestion.suggestedWeight).toBe(21.25); // 20 + 1.25kg for isolation
      expect(result.strategy).toBe('double_progression');
    });

    it('should handle initial workout with no history', () => {
      const history = createExerciseHistory('compound', []);

      const result = service.calculateProgression(history);

      expect(result.suggestion.suggestedWeight).toBeGreaterThan(0);
      expect(result.suggestion.confidenceLevel).toBe('medium');
      expect(result.suggestion.reasoning).toContain('No previous data');
    });

    it('should provide alternative weight suggestions', () => {
      const history = createExerciseHistory('compound', [
        {
          sets: [
            { setNumber: 1, weight: 80, reps: 8, completed: true, rpe: 7 },
            { setNumber: 2, weight: 80, reps: 8, completed: true, rpe: 7 },
            { setNumber: 3, weight: 80, reps: 8, completed: true, rpe: 7 }
          ],
          averageRPE: 7
        }
      ]);

      const result = service.calculateProgression(history);

      expect(result.suggestion.alternativeWeights).toHaveLength(4);
      expect(result.suggestion.alternativeWeights).toContain(80); // Current weight
      expect(result.suggestion.alternativeWeights).toContain(85); // Higher option
    });
  });

  describe('performance metrics analysis', () => {
    it('should calculate consistency score correctly', () => {
      const history = createExerciseHistory('compound', [
        { sets: [{ setNumber: 1, weight: 80, reps: 8, completed: true }] },
        { sets: [{ setNumber: 1, weight: 80, reps: 8, completed: true }] },
        { sets: [{ setNumber: 1, weight: 80, reps: 8, completed: true }] }
      ]);

      const result = service.calculateProgression(history);

      expect(result.metrics.consistencyScore).toBeCloseTo(1, 2); // Perfect consistency
    });

    it('should detect weight trends correctly', () => {
      const history = createExerciseHistory('compound', [
        { sets: [{ setNumber: 1, weight: 85, reps: 8, completed: true }] },
        { sets: [{ setNumber: 1, weight: 82.5, reps: 8, completed: true }] },
        { sets: [{ setNumber: 1, weight: 80, reps: 8, completed: true }] }
      ]);

      const result = service.calculateProgression(history);

      expect(result.metrics.weightTrend).toBe('increasing');
    });

    it('should calculate volume progress correctly', () => {
      const history = createExerciseHistory('compound', [
        { 
          sets: [
            { setNumber: 1, weight: 80, reps: 8, completed: true },
            { setNumber: 2, weight: 80, reps: 8, completed: true }
          ] 
        },
        { 
          sets: [
            { setNumber: 1, weight: 70, reps: 8, completed: true },
            { setNumber: 2, weight: 70, reps: 8, completed: true }
          ] 
        }
      ]);

      const result = service.calculateProgression(history);

      // Volume went from 1120kg (70*8*2) to 1280kg (80*8*2) = ~14.3% increase
      expect(result.metrics.totalVolumeProgress).toBeCloseTo(14.3, 1);
    });
  });

  describe('safety checks', () => {
    it('should limit weekly weight increases', () => {
      const service = new ProgressiveOverloadService({
        maxWeeklyIncrease: 5 // 5kg max per week
      });

      const history = createExerciseHistory('compound', [
        { sets: [{ setNumber: 1, weight: 100, reps: 8, completed: true, rpe: 5 }] },
        { sets: [{ setNumber: 1, weight: 90, reps: 8, completed: true, rpe: 5 }] }
      ]);

      const result = service.calculateProgression(history);

      // Should not suggest more than 5kg increase even if algorithm wants more
      expect(result.suggestion.suggestedWeight).toBeLessThanOrEqual(105);
    });

    it('should enforce minimum weight increases', () => {
      const service = new ProgressiveOverloadService({
        minWeightIncrease: 1 // At least 1kg increase
      });

      const history = createExerciseHistory('compound', [
        {
          sets: [{ setNumber: 1, weight: 80, reps: 8, completed: true, rpe: 7.8 }],
          averageRPE: 7.8 // Just under threshold but close
        }
      ]);

      const result = service.calculateProgression(history);

      if (result.suggestion.increaseAmount > 0) {
        expect(result.suggestion.increaseAmount).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('progression strategies', () => {
    it('should use auto-regulation for experienced users with RPE data', () => {
      const history = createExerciseHistory('compound', [
        {
          sets: [
            { setNumber: 1, weight: 80, reps: 8, completed: true, rpe: 6 },
            { setNumber: 2, weight: 80, reps: 8, completed: true, rpe: 6 },
            { setNumber: 3, weight: 80, reps: 8, completed: true, rpe: 7 }
          ],
          averageRPE: 6.3
        },
        {
          sets: [
            { setNumber: 1, weight: 77.5, reps: 8, completed: true, rpe: 6 },
            { setNumber: 2, weight: 77.5, reps: 8, completed: true, rpe: 7 }
          ],
          averageRPE: 6.5
        },
        {
          sets: [
            { setNumber: 1, weight: 75, reps: 8, completed: true, rpe: 6 }
          ],
          averageRPE: 6
        }
      ]);

      const result = service.calculateProgression(history);

      expect(result.strategy).toBe('auto_regulation');
    });

    it('should use double progression for isolation exercises', () => {
      const history = createExerciseHistory('isolation', [
        {
          sets: [
            { setNumber: 1, weight: 20, reps: 10, completed: true, rpe: 7 }
          ],
          targetReps: 8
        }
      ]);

      const result = service.calculateProgression(history);

      expect(result.strategy).toBe('double_progression');
    });
  });

  describe('edge cases', () => {
    it('should handle missing RPE data gracefully', () => {
      const history = createExerciseHistory('compound', [
        {
          sets: [
            { setNumber: 1, weight: 80, reps: 8, completed: true }, // No RPE
            { setNumber: 2, weight: 80, reps: 8, completed: true }
          ]
        }
      ]);

      const result = service.calculateProgression(history);

      expect(result).toBeDefined();
      expect(result.metrics.averageRPE).toBe(7); // Default assumption
    });

    it('should handle zero weight gracefully', () => {
      const history = createExerciseHistory('compound', [
        {
          sets: [
            { setNumber: 1, weight: 0, reps: 8, completed: true }
          ]
        }
      ]);

      const result = service.calculateProgression(history);

      expect(result.suggestion.suggestedWeight).toBeGreaterThan(0);
    });

    it('should round weights to nearest 0.25kg', () => {
      const history = createExerciseHistory('compound', [
        {
          sets: [
            { setNumber: 1, weight: 80.123, reps: 8, completed: true, rpe: 7 }
          ],
          averageRPE: 7
        }
      ]);

      const result = service.calculateProgression(history);

      // Should round to nearest 0.25kg increment
      expect(result.suggestion.suggestedWeight % 0.25).toBe(0);
    });
  });
});