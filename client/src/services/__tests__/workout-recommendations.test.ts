/**
 * Workout Recommendation System Tests
 * Comprehensive test suite for AI-driven workout recommendations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  WorkoutRecommendationEngine,
  createWorkoutRecommendationEngine,
  workoutRecommendationService,
  UserGoals,
  WorkoutRecommendation,
  ExerciseVariation,
  PlateauIntervention,
  RecommendationConfig
} from '../workout-recommendations';
import { ExerciseHistory, WorkoutSession, WorkoutSet } from '@/types/progression';
import { UserAdaptationProfile } from '../enhanced-progressive-overload-v2';

describe('WorkoutRecommendationEngine', () => {
  let engine: WorkoutRecommendationEngine;
  let mockExerciseHistories: ExerciseHistory[];
  let mockUserGoals: UserGoals;

  beforeEach(() => {
    engine = new WorkoutRecommendationEngine();
    mockExerciseHistories = createMockExerciseHistories();
    mockUserGoals = createMockUserGoals();
  });

  describe('Core Recommendation Generation', () => {
    it('should generate comprehensive workout recommendations', async () => {
      const recommendation = await engine.generateWorkoutRecommendation(
        mockExerciseHistories,
        mockUserGoals
      );

      expect(recommendation).toBeDefined();
      expect(recommendation.workoutId).toBeTruthy();
      expect(recommendation.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidenceScore).toBeLessThanOrEqual(100);
      expect(recommendation.exercises).toBeDefined();
      expect(recommendation.exercises.length).toBeGreaterThan(0);
      expect(recommendation.reasoning).toBeInstanceOf(Array);
      expect(recommendation.expectedOutcomes).toBeInstanceOf(Array);
    });

    it('should integrate with enhanced progressive overload V2 service', async () => {
      const recommendation = await engine.generateWorkoutRecommendation(
        mockExerciseHistories,
        mockUserGoals
      );

      expect(recommendation.progressionInsights).toBeDefined();
      expect(recommendation.progressionInsights.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(recommendation.progressionInsights.reasoningChain).toBeInstanceOf(Array);
      expect(recommendation.progressionInsights.riskAssessment).toBeDefined();
    });

    it('should provide appropriate recommendation types based on performance', async () => {
      // Test progression recommendation for healthy performance
      const healthyHistories = createProgressiveExerciseHistories();
      const progressionRec = await engine.generateWorkoutRecommendation(
        healthyHistories,
        mockUserGoals
      );
      expect(['progression', 'goal_optimization']).toContain(progressionRec.recommendationType);

      // Test plateau break recommendation for stagnated performance
      const plateauHistories = createPlateauExerciseHistories();
      const plateauRec = await engine.generateWorkoutRecommendation(
        plateauHistories,
        mockUserGoals
      );
      expect(['plateau_break', 'variation']).toContain(plateauRec.recommendationType);
    });

    it('should calculate realistic workout duration and volume', async () => {
      const recommendation = await engine.generateWorkoutRecommendation(
        mockExerciseHistories,
        mockUserGoals
      );

      expect(recommendation.totalDuration).toBeGreaterThan(30); // At least 30 minutes
      expect(recommendation.totalDuration).toBeLessThan(150); // Less than 2.5 hours
      expect(recommendation.volumeLoad).toBeGreaterThan(0);
      expect(['low', 'moderate', 'high', 'mixed']).toContain(recommendation.intensityProfile);
    });
  });

  describe('Plateau Detection Integration', () => {
    it('should detect plateaus and recommend appropriate interventions', async () => {
      const plateauHistories = createPlateauExerciseHistories();
      const recommendation = await engine.generateWorkoutRecommendation(
        plateauHistories,
        mockUserGoals
      );

      expect(recommendation.plateauInterventions).toBeInstanceOf(Array);
      if (recommendation.plateauInterventions.length > 0) {
        const intervention = recommendation.plateauInterventions[0];
        expect(intervention.exerciseName).toBeTruthy();
        expect(['strength', 'volume', 'technique', 'motivation']).toContain(intervention.plateauType);
        expect(['deload', 'variation', 'technique_focus', 'periodization_change']).toContain(intervention.intervention);
        expect(intervention.duration).toBeGreaterThan(0);
        expect(intervention.specificActions).toBeInstanceOf(Array);
      }
    });

    it('should not recommend interventions for healthy progression', async () => {
      const healthyHistories = createProgressiveExerciseHistories();
      const recommendation = await engine.generateWorkoutRecommendation(
        healthyHistories,
        mockUserGoals
      );

      // Should have minimal or no plateau interventions for healthy progression
      expect(recommendation.plateauInterventions.length).toBeLessThanOrEqual(1);
    });

    it('should provide specific intervention actions for different plateau types', async () => {
      const plateauHistories = createSpecificPlateauHistories();
      const recommendation = await engine.generateWorkoutRecommendation(
        plateauHistories,
        mockUserGoals
      );

      const interventions = recommendation.plateauInterventions;
      
      interventions.forEach(intervention => {
        expect(intervention.specificActions.length).toBeGreaterThan(0);
        expect(intervention.expectedOutcome).toBeTruthy();
        expect(intervention.successMetrics).toBeInstanceOf(Array);
        expect(intervention.successMetrics.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Exercise Variation System', () => {
    it('should generate appropriate exercise variations', () => {
      const currentExercises = ['Squat', 'Bench Press', 'Deadlift'];
      const mockPerformanceAnalysis = {
        analyses: currentExercises.map(ex => ({
          exerciseName: ex,
          progression: {
            plateauAnalysis: { plateauConfidence: 70 }
          }
        }))
      };

      const variations = engine.generateExerciseVariations(
        currentExercises,
        mockPerformanceAnalysis,
        mockUserGoals
      );

      expect(variations).toBeInstanceOf(Array);
      variations.forEach(variation => {
        expect(variation.originalExercise).toBeTruthy();
        expect(variation.variation).toBeTruthy();
        expect(variation.muscleGroups).toBeInstanceOf(Array);
        expect(['beginner', 'intermediate', 'advanced']).toContain(variation.difficulty);
        expect(variation.swapConfidence).toBeGreaterThanOrEqual(0);
        expect(variation.swapConfidence).toBeLessThanOrEqual(100);
        expect(variation.biomechanicalBenefit).toBeTruthy();
        expect(variation.progressionReason).toBeTruthy();
      });
    });

    it('should prioritize variations based on plateau severity', () => {
      const currentExercises = ['Squat'];
      const highPlateauAnalysis = {
        analyses: [{
          exerciseName: 'Squat',
          progression: {
            plateauAnalysis: { plateauConfidence: 85 }
          }
        }]
      };

      const lowPlateauAnalysis = {
        analyses: [{
          exerciseName: 'Squat',
          progression: {
            plateauAnalysis: { plateauConfidence: 20 }
          }
        }]
      };

      const highPlateauVariations = engine.generateExerciseVariations(
        currentExercises,
        highPlateauAnalysis,
        mockUserGoals
      );

      const lowPlateauVariations = engine.generateExerciseVariations(
        currentExercises,
        lowPlateauAnalysis,
        mockUserGoals
      );

      // High plateau should generate more or higher confidence variations
      expect(highPlateauVariations.length).toBeGreaterThanOrEqual(lowPlateauVariations.length);
    });

    it('should consider user equipment and preferences', () => {
      const currentExercises = ['Bench Press'];
      const limitedEquipmentGoals: UserGoals = {
        ...mockUserGoals,
        preferences: {
          ...mockUserGoals.preferences,
          equipmentAvailable: ['dumbbell'],
          dislikedExercises: ['Incline Bench Press']
        }
      };

      const mockPerformanceAnalysis = {
        analyses: [{
          exerciseName: 'Bench Press',
          progression: {
            plateauAnalysis: { plateauConfidence: 60 }
          }
        }]
      };

      const variations = engine.generateExerciseVariations(
        currentExercises,
        mockPerformanceAnalysis,
        limitedEquipmentGoals
      );

      // Should not suggest disliked exercises
      const dislikedVariations = variations.filter(v => 
        limitedEquipmentGoals.preferences.dislikedExercises?.includes(v.variation)
      );
      expect(dislikedVariations.length).toBe(0);
    });
  });

  describe('Goal-Based Optimization', () => {
    it('should optimize for strength goals', async () => {
      const strengthGoals: UserGoals = {
        ...mockUserGoals,
        primary: 'strength'
      };

      const recommendation = await engine.generateWorkoutRecommendation(
        mockExerciseHistories,
        strengthGoals
      );

      // Should prioritize compound movements and higher intensity
      const compoundExercises = recommendation.exercises.filter(ex => ex.exerciseType === 'compound');
      expect(compoundExercises.length).toBeGreaterThan(0);

      // Should have appropriate rep ranges for strength
      recommendation.exercises.forEach(exercise => {
        const reps = typeof exercise.reps === 'number' ? exercise.reps : exercise.reps[0];
        expect(reps).toBeLessThanOrEqual(6); // Strength rep range
      });

      expect(recommendation.adaptationTargets.strength).toBeGreaterThan(
        recommendation.adaptationTargets.hypertrophy
      );
    });

    it('should optimize for hypertrophy goals', async () => {
      const hypertrophyGoals: UserGoals = {
        ...mockUserGoals,
        primary: 'hypertrophy'
      };

      const recommendation = await engine.generateWorkoutRecommendation(
        mockExerciseHistories,
        hypertrophyGoals
      );

      // Should have moderate rep ranges for hypertrophy
      recommendation.exercises.forEach(exercise => {
        const reps = typeof exercise.reps === 'number' ? exercise.reps : exercise.reps[0];
        expect(reps).toBeGreaterThanOrEqual(6);
        expect(reps).toBeLessThanOrEqual(15); // Hypertrophy rep range
      });

      expect(recommendation.adaptationTargets.hypertrophy).toBeGreaterThan(
        recommendation.adaptationTargets.strength
      );
    });

    it('should optimize for endurance goals', async () => {
      const enduranceGoals: UserGoals = {
        ...mockUserGoals,
        primary: 'endurance'
      };

      const recommendation = await engine.generateWorkoutRecommendation(
        mockExerciseHistories,
        enduranceGoals
      );

      // Should have higher rep ranges and lower intensity
      recommendation.exercises.forEach(exercise => {
        const reps = typeof exercise.reps === 'number' ? exercise.reps : exercise.reps[0];
        expect(reps).toBeGreaterThanOrEqual(12); // Endurance rep range

        const rpe = typeof exercise.rpe === 'number' ? exercise.rpe : exercise.rpe[0];
        expect(rpe).toBeLessThanOrEqual(8); // Lower intensity for endurance
      });

      expect(recommendation.adaptationTargets.endurance).toBeGreaterThan(
        recommendation.adaptationTargets.strength
      );
    });

    it('should respect time constraints', async () => {
      const timeConstrainedGoals: UserGoals = {
        ...mockUserGoals,
        preferences: {
          ...mockUserGoals.preferences,
          workoutDuration: 45 // 45 minutes max
        }
      };

      const recommendation = await engine.generateWorkoutRecommendation(
        mockExerciseHistories,
        timeConstrainedGoals
      );

      expect(recommendation.totalDuration).toBeLessThanOrEqual(60); // Allow 15 minute buffer for complex calculations
      expect(recommendation.exercises.length).toBeLessThanOrEqual(6); // Reasonable exercise count
    });
  });

  describe('Risk Assessment', () => {
    it('should assess overtraining risk appropriately', async () => {
      const highVolumeHistories = createHighVolumeExerciseHistories();
      const recommendation = await engine.generateWorkoutRecommendation(
        highVolumeHistories,
        mockUserGoals
      );

      expect(['low', 'medium', 'high']).toContain(recommendation.riskAssessment.overtrainingRisk);
      expect(['low', 'medium', 'high']).toContain(recommendation.riskAssessment.injuryRisk);
      expect(['low', 'medium', 'high']).toContain(recommendation.riskAssessment.plateauRisk);
    });

    it('should recommend lower intensity for high injury risk scenarios', async () => {
      const highRiskHistories = createHighRiskExerciseHistories();
      const recommendation = await engine.generateWorkoutRecommendation(
        highRiskHistories,
        mockUserGoals
      );

      if (recommendation.riskAssessment.injuryRisk === 'high') {
        const avgRPE = recommendation.exercises.reduce((sum, ex) => {
          const rpe = typeof ex.rpe === 'number' ? ex.rpe : ex.rpe[0];
          return sum + rpe;
        }, 0) / recommendation.exercises.length;

        expect(avgRPE).toBeLessThan(8); // Should recommend lower intensity
        expect(['low', 'moderate']).toContain(recommendation.intensityProfile);
      }
    });
  });

  describe('Configuration and Personalization', () => {
    it('should respect user adaptation profile preferences', () => {
      const conservativeProfile: Partial<UserAdaptationProfile> = {
        preferredProgressionStyle: 'conservative',
        recoveryCapacity: 'low',
        adaptationRate: 'slow'
      };

      const aggressiveProfile: Partial<UserAdaptationProfile> = {
        preferredProgressionStyle: 'aggressive',
        recoveryCapacity: 'high',
        adaptationRate: 'fast'
      };

      const conservativeEngine = createWorkoutRecommendationEngine(conservativeProfile);
      const aggressiveEngine = createWorkoutRecommendationEngine(aggressiveProfile);

      expect(conservativeEngine).toBeInstanceOf(WorkoutRecommendationEngine);
      expect(aggressiveEngine).toBeInstanceOf(WorkoutRecommendationEngine);
    });

    it('should apply custom recommendation configuration', () => {
      const config: Partial<RecommendationConfig> = {
        plateauDetectionSensitivity: 'aggressive',
        variationFrequency: 'high',
        riskTolerance: 'conservative',
        goalPrioritization: { strength: 70, hypertrophy: 20, endurance: 10 }
      };

      const customEngine = createWorkoutRecommendationEngine(undefined, config);
      expect(customEngine).toBeInstanceOf(WorkoutRecommendationEngine);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle insufficient exercise history gracefully', async () => {
      const minimalHistories = [createMinimalExerciseHistory()];
      
      const recommendation = await engine.generateWorkoutRecommendation(
        minimalHistories,
        mockUserGoals
      );

      expect(recommendation).toBeDefined();
      expect(recommendation.confidenceScore).toBeLessThan(70); // Lower confidence expected
      expect(recommendation.exercises.length).toBeGreaterThan(0);
    });

    it('should handle empty exercise history', async () => {
      const emptyHistories: ExerciseHistory[] = [];
      
      const recommendation = await engine.generateWorkoutRecommendation(
        emptyHistories,
        mockUserGoals
      );

      expect(recommendation).toBeDefined();
      expect(recommendation.exercises.length).toBeGreaterThan(0); // Should still provide base recommendations
      expect(recommendation.recommendationType).toBe('goal_optimization');
    });

    it('should generate unique workout IDs', async () => {
      const rec1 = await engine.generateWorkoutRecommendation(mockExerciseHistories, mockUserGoals);
      const rec2 = await engine.generateWorkoutRecommendation(mockExerciseHistories, mockUserGoals);

      expect(rec1.workoutId).not.toBe(rec2.workoutId);
      expect(rec1.workoutId).toContain('workout_');
      expect(rec2.workoutId).toContain('workout_');
    });

    it('should complete recommendations within reasonable time', async () => {
      const startTime = Date.now();
      
      await engine.generateWorkoutRecommendation(
        mockExerciseHistories,
        mockUserGoals
      );
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

// Test Helper Functions
function createMockExerciseHistories(): ExerciseHistory[] {
  return [
    createMockExerciseHistory('Squat', 'compound', 'strength'),
    createMockExerciseHistory('Bench Press', 'compound', 'strength'),
    createMockExerciseHistory('Deadlift', 'compound', 'strength'),
    createMockExerciseHistory('Lateral Raises', 'isolation', 'hypertrophy')
  ];
}

function createMockExerciseHistory(
  name: string, 
  type: 'compound' | 'isolation', 
  category: 'strength' | 'hypertrophy' | 'endurance'
): ExerciseHistory {
  const sessions: WorkoutSession[] = [];
  
  for (let i = 0; i < 8; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 3));
    
    const baseWeight = type === 'compound' ? 100 : 20;
    const weight = baseWeight + (i * 2.5); // Progressive weight
    
    sessions.push({
      sessionId: `session-${name}-${i}`,
      date,
      targetReps: category === 'strength' ? 5 : category === 'hypertrophy' ? 10 : 15,
      targetSets: 3,
      averageRPE: 7.5 + (Math.random() * 1.5),
      sets: [
        createMockSet(1, weight, category === 'strength' ? 5 : category === 'hypertrophy' ? 10 : 15, 7.5),
        createMockSet(2, weight, category === 'strength' ? 5 : category === 'hypertrophy' ? 9 : 14, 8.0),
        createMockSet(3, weight, category === 'strength' ? 4 : category === 'hypertrophy' ? 8 : 13, 8.5)
      ]
    });
  }
  
  return {
    exerciseId: Math.floor(Math.random() * 1000),
    exerciseName: name,
    exerciseType: type,
    category,
    lastPerformed: new Date(),
    sessions: sessions.reverse()
  };
}

function createMockSet(setNumber: number, weight: number, reps: number, rpe: number): WorkoutSet {
  return {
    setNumber,
    weight,
    reps,
    rpe,
    restTime: 180,
    completed: true,
    formScore: 8 + (Math.random() * 1.5)
  };
}

function createMockUserGoals(): UserGoals {
  return {
    primary: 'strength',
    secondary: ['hypertrophy'],
    targetTimeframe: 12,
    specificTargets: {
      liftingGoals: [
        { exerciseName: 'Squat', targetWeight: 150, targetReps: 5 },
        { exerciseName: 'Bench Press', targetWeight: 120, targetReps: 5 },
        { exerciseName: 'Deadlift', targetWeight: 180, targetReps: 5 }
      ]
    },
    preferences: {
      workoutDuration: 90,
      exercisePreferences: ['Squat', 'Deadlift', 'Bench Press'],
      equipmentAvailable: ['barbell', 'dumbbell', 'bench', 'squat_rack'],
      injuryHistory: [],
      dislikedExercises: []
    }
  };
}

function createProgressiveExerciseHistories(): ExerciseHistory[] {
  return [
    createProgressiveExerciseHistory('Squat'),
    createProgressiveExerciseHistory('Bench Press'),
    createProgressiveExerciseHistory('Deadlift')
  ];
}

function createProgressiveExerciseHistory(name: string): ExerciseHistory {
  const sessions: WorkoutSession[] = [];
  
  for (let i = 0; i < 8; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 3));
    
    const weight = 80 + (i * 5); // Consistent progression
    
    sessions.push({
      sessionId: `progressive-${name}-${i}`,
      date,
      targetReps: 8,
      targetSets: 3,
      averageRPE: 7.5, // Consistent moderate RPE
      sets: [
        createMockSet(1, weight, 8, 7.5),
        createMockSet(2, weight, 8, 8.0),
        createMockSet(3, weight, 7, 8.5)
      ]
    });
  }
  
  return {
    exerciseId: Math.floor(Math.random() * 1000),
    exerciseName: name,
    exerciseType: 'compound',
    category: 'strength',
    lastPerformed: new Date(),
    sessions: sessions.reverse()
  };
}

function createPlateauExerciseHistories(): ExerciseHistory[] {
  return [
    createPlateauExerciseHistory('Squat'),
    createPlateauExerciseHistory('Bench Press')
  ];
}

function createPlateauExerciseHistory(name: string): ExerciseHistory {
  const sessions: WorkoutSession[] = [];
  
  for (let i = 0; i < 8; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 3));
    
    const weight = 100; // No progression - plateau
    const reps = Math.max(5, 8 - Math.floor(i / 2)); // Declining reps
    const rpe = 8.5 + (i * 0.2); // Increasing RPE
    
    sessions.push({
      sessionId: `plateau-${name}-${i}`,
      date,
      targetReps: 8,
      targetSets: 3,
      averageRPE: rpe,
      sets: [
        createMockSet(1, weight, reps, rpe),
        createMockSet(2, weight, reps - 1, rpe + 0.5),
        createMockSet(3, weight, reps - 2, 9.5)
      ]
    });
  }
  
  return {
    exerciseId: Math.floor(Math.random() * 1000),
    exerciseName: name,
    exerciseType: 'compound',
    category: 'strength',
    lastPerformed: new Date(),
    sessions: sessions.reverse()
  };
}

function createSpecificPlateauHistories(): ExerciseHistory[] {
  // Create histories with different types of plateaus
  return [
    createStrengthPlateauHistory('Bench Press'),
    createTechniquePlateauHistory('Squat'),
    createVolumePlateauHistory('Deadlift')
  ];
}

function createStrengthPlateauHistory(name: string): ExerciseHistory {
  const sessions: WorkoutSession[] = [];
  
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 3));
    
    sessions.push({
      sessionId: `strength-plateau-${name}-${i}`,
      date,
      targetReps: 5,
      targetSets: 3,
      averageRPE: 9.0, // High RPE
      sets: [
        createMockSet(1, 120, 5, 9.0), // Same weight, high RPE
        createMockSet(2, 120, 4, 9.5),
        createMockSet(3, 120, 3, 10.0)
      ]
    });
  }
  
  return {
    exerciseId: Math.floor(Math.random() * 1000),
    exerciseName: name,
    exerciseType: 'compound',
    category: 'strength',
    lastPerformed: new Date(),
    sessions: sessions.reverse()
  };
}

function createTechniquePlateauHistory(name: string): ExerciseHistory {
  const sessions: WorkoutSession[] = [];
  
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 3));
    
    sessions.push({
      sessionId: `technique-plateau-${name}-${i}`,
      date,
      targetReps: 8,
      targetSets: 3,
      averageRPE: 8.0,
      sets: [
        { ...createMockSet(1, 100, 8, 8.0), formScore: 6 }, // Declining form
        { ...createMockSet(2, 100, 7, 8.5), formScore: 5.5 },
        { ...createMockSet(3, 100, 6, 9.0), formScore: 5 }
      ]
    });
  }
  
  return {
    exerciseId: Math.floor(Math.random() * 1000),
    exerciseName: name,
    exerciseType: 'compound',
    category: 'strength',
    lastPerformed: new Date(),
    sessions: sessions.reverse()
  };
}

function createVolumePlateauHistory(name: string): ExerciseHistory {
  const sessions: WorkoutSession[] = [];
  
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 3));
    
    const completedSets = Math.max(1, 3 - Math.floor(i / 2)); // Declining sets completed
    
    sessions.push({
      sessionId: `volume-plateau-${name}-${i}`,
      date,
      targetReps: 10,
      targetSets: 3,
      averageRPE: 8.5,
      sets: Array.from({ length: completedSets }, (_, j) => 
        createMockSet(j + 1, 80, Math.max(6, 10 - j), 8.5 + j)
      )
    });
  }
  
  return {
    exerciseId: Math.floor(Math.random() * 1000),
    exerciseName: name,
    exerciseType: 'compound',
    category: 'strength',
    lastPerformed: new Date(),
    sessions: sessions.reverse()
  };
}

function createHighVolumeExerciseHistories(): ExerciseHistory[] {
  const histories = createMockExerciseHistories();
  
  // Modify to have very high volume
  histories.forEach(history => {
    history.sessions.forEach(session => {
      session.targetSets = 6; // Double the sets
      session.sets = Array.from({ length: 6 }, (_, i) => 
        createMockSet(i + 1, session.sets[0].weight, session.sets[0].reps, 8.5 + i * 0.2)
      );
    });
  });
  
  return histories;
}

function createHighRiskExerciseHistories(): ExerciseHistory[] {
  const histories = createMockExerciseHistories();
  
  // Modify to indicate high injury risk (high RPE, declining form)
  histories.forEach(history => {
    history.sessions.forEach(session => {
      session.averageRPE = 9.5; // Very high RPE
      session.sets.forEach(set => {
        set.rpe = 9.5;
        set.formScore = 5; // Poor form
      });
    });
  });
  
  return histories;
}

function createMinimalExerciseHistory(): ExerciseHistory {
  return {
    exerciseId: 1,
    exerciseName: 'Squat',
    exerciseType: 'compound',
    category: 'strength',
    lastPerformed: new Date(),
    sessions: [
      {
        sessionId: 'minimal-session-1',
        date: new Date(),
        targetReps: 8,
        targetSets: 3,
        averageRPE: 7.5,
        sets: [createMockSet(1, 100, 8, 7.5)]
      }
    ]
  };
}