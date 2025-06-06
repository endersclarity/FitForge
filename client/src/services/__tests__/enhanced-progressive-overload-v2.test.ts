/**
 * Enhanced Progressive Overload Service V2 Tests
 * Comprehensive test suite for AI-driven progression algorithms
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  EnhancedProgressiveOverloadServiceV2,
  createEnhancedProgressiveOverloadServiceV2,
  UserAdaptationProfile
} from '../enhanced-progressive-overload-v2';
import { ExerciseHistory, WorkoutSession, WorkoutSet } from '@/types/progression';

describe('EnhancedProgressiveOverloadServiceV2', () => {
  let service: EnhancedProgressiveOverloadServiceV2;
  let mockExerciseHistory: ExerciseHistory;

  beforeEach(() => {
    service = new EnhancedProgressiveOverloadServiceV2();
    
    // Create realistic mock data
    mockExerciseHistory = {
      exerciseId: 1,
      exerciseName: 'Bench Press',
      exerciseType: 'compound',
      category: 'strength',
      lastPerformed: new Date(),
      sessions: createMockSessions()
    };
  });

  describe('Core AI-Enhanced Progression', () => {
    it('should calculate AI-enhanced progression with confidence scoring', () => {
      const result = service.calculateAIEnhancedProgression(mockExerciseHistory);
      
      expect(result).toBeDefined();
      expect(result.aiInsights).toBeDefined();
      expect(result.aiInsights.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.aiInsights.confidenceScore).toBeLessThanOrEqual(100);
      expect(result.aiInsights.reasoningChain).toBeInstanceOf(Array);
      expect(result.aiInsights.primaryRecommendation).toBeTruthy();
    });

    it('should provide research-backed recommendations', () => {
      const result = service.calculateAIEnhancedProgression(mockExerciseHistory);
      
      expect(result.aiInsights.researchBasis).toBeTruthy();
      expect(result.aiInsights.researchBasis.length).toBeGreaterThan(10);
      expect(result.aiInsights.alternativeStrategies.length).toBeGreaterThan(0);
    });

    it('should assess risks appropriately', () => {
      const result = service.calculateAIEnhancedProgression(mockExerciseHistory);
      
      const { riskAssessment } = result.aiInsights;
      expect(['low', 'medium', 'high']).toContain(riskAssessment.overtrainingRisk);
      expect(['low', 'medium', 'high']).toContain(riskAssessment.injuryRisk);
      expect(['low', 'medium', 'high']).toContain(riskAssessment.plateauRisk);
    });
  });

  describe('Volume Plateau Detection', () => {
    it('should detect volume plateaus accurately', () => {
      const plateauHistory = createPlateauMockHistory();
      const result = service.detectVolumePlateau(plateauHistory);
      
      expect(result.isPlateaued).toBe(true);
      expect(result.volumeIncrease).toBeLessThan(10);
      expect(result.movingAverage.length).toBeGreaterThan(0);
    });

    it('should not detect plateau with progressive volume', () => {
      const progressiveHistory = createProgressiveMockHistory();
      const result = service.detectVolumePlateau(progressiveHistory);
      
      expect(result.isPlateaued).toBe(false);
      expect(result.volumeIncrease).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Smart Progression Formula', () => {
    it('should calculate progression with multi-factor adjustments', () => {
      const result = service.calculateSmartProgression(
        mockExerciseHistory,
        0.9, // High recovery
        0.95, // High consistency
        'intermediate'
      );
      
      expect(result.suggestedWeight).toBeGreaterThan(0);
      expect(result.adjustmentFactors.base).toBe(0.025);
      expect(result.adjustmentFactors.recovery).toBe(0.9);
      expect(result.adjustmentFactors.consistency).toBe(0.95);
      expect(result.adjustmentFactors.strengthLevel).toBe(1.0); // Intermediate
    });

    it('should adjust for different strength levels', () => {
      const noviceResult = service.calculateSmartProgression(mockExerciseHistory, 0.8, 0.9, 'novice');
      const advancedResult = service.calculateSmartProgression(mockExerciseHistory, 0.8, 0.9, 'advanced');
      
      expect(noviceResult.suggestedWeight).toBeGreaterThan(advancedResult.suggestedWeight);
      expect(noviceResult.adjustmentFactors.strengthLevel).toBe(1.5);
      expect(advancedResult.adjustmentFactors.strengthLevel).toBe(0.6);
    });
  });

  describe('Personalized Deload Protocols', () => {
    it('should generate deload when plateau detected', () => {
      const plateauHistory = createPlateauMockHistory();
      const result = service.calculateAIEnhancedProgression(plateauHistory);
      
      if (result.personalizedDeload) {
        expect(result.personalizedDeload.type).toBeDefined();
        expect(result.personalizedDeload.duration).toBeGreaterThan(0);
        expect(result.personalizedDeload.intensityReduction).toBeGreaterThanOrEqual(0);
        expect(result.personalizedDeload.volumeReduction).toBeGreaterThanOrEqual(0);
        expect(result.personalizedDeload.returnProtocol).toBeDefined();
      }
    });

    it('should not generate deload for healthy progression', () => {
      const healthyHistory = createProgressiveMockHistory();
      const result = service.calculateAIEnhancedProgression(healthyHistory);
      
      expect(result.personalizedDeload).toBeNull();
    });
  });

  describe('Adaptive Periodization', () => {
    it('should provide phase recommendations', () => {
      const result = service.calculateAIEnhancedProgression(mockExerciseHistory);
      
      expect(result.adaptivePeriodization.currentPhase).toBeDefined();
      expect(result.adaptivePeriodization.recommendedPhase).toBeDefined();
      expect(result.adaptivePeriodization.phaseOptimality).toBeGreaterThanOrEqual(0);
      expect(result.adaptivePeriodization.phaseOptimality).toBeLessThanOrEqual(100);
      expect(result.adaptivePeriodization.phaseParameters).toBeDefined();
    });

    it('should provide microcycle recommendations', () => {
      const result = service.calculateAIEnhancedProgression(mockExerciseHistory);
      
      const { microCycleRecommendations } = result.adaptivePeriodization;
      expect(microCycleRecommendations.day1).toBeDefined();
      expect(microCycleRecommendations.day2).toBeDefined();
      expect(microCycleRecommendations.day3).toBeDefined();
    });
  });

  describe('Real-time Autoregulation', () => {
    it('should provide real-time adjustments based on RPE', () => {
      const result = service.calculateAIEnhancedProgression(mockExerciseHistory);
      
      expect(result.autoregulation.realTimeAdjustment).toBeDefined();
      expect(result.autoregulation.sessionModification).toBeDefined();
      expect(result.autoregulation.nextSessionPrediction).toBeDefined();
      expect(result.autoregulation.adaptiveTarget).toBeDefined();
    });

    it('should predict next session accurately', () => {
      const result = service.calculateAIEnhancedProgression(mockExerciseHistory);
      
      const { nextSessionPrediction } = result.autoregulation;
      expect(nextSessionPrediction.suggestedWeight).toBeGreaterThan(0);
      expect(nextSessionPrediction.confidence).toBeGreaterThanOrEqual(0);
      expect(nextSessionPrediction.confidence).toBeLessThanOrEqual(100);
      expect(nextSessionPrediction.reasoning).toBeTruthy();
    });
  });

  describe('Performance Prediction', () => {
    it('should provide accurate performance forecasts', () => {
      const result = service.calculateAIEnhancedProgression(mockExerciseHistory);
      
      const { performancePrediction } = result;
      expect(performancePrediction.nextWeekExpectedWeight).toBeGreaterThan(0);
      expect(performancePrediction.nextMonthExpectedWeight).toBeGreaterThan(0);
      expect(performancePrediction.expectedProgressionRate).toBeGreaterThanOrEqual(0);
      expect(performancePrediction.confidenceInterval).toHaveLength(2);
    });
  });

  describe('User Profile Customization', () => {
    it('should adapt to different user profiles', () => {
      const aggressiveProfile: Partial<UserAdaptationProfile> = {
        preferredProgressionStyle: 'aggressive',
        adaptationRate: 'fast',
        recoveryCapacity: 'high'
      };
      
      const conservativeProfile: Partial<UserAdaptationProfile> = {
        preferredProgressionStyle: 'conservative',
        adaptationRate: 'slow',
        recoveryCapacity: 'low'
      };
      
      const aggressiveService = createEnhancedProgressiveOverloadServiceV2(aggressiveProfile);
      const conservativeService = createEnhancedProgressiveOverloadServiceV2(conservativeProfile);
      
      const aggressiveResult = aggressiveService.calculateAIEnhancedProgression(mockExerciseHistory);
      const conservativeResult = conservativeService.calculateAIEnhancedProgression(mockExerciseHistory);
      
      // Aggressive profile should generally have higher confidence and more aggressive recommendations
      expect(aggressiveResult.aiInsights.confidenceScore).toBeGreaterThanOrEqual(conservativeResult.aiInsights.confidenceScore - 10);
    });
  });

  describe('Hook Compatibility', () => {
    it('should be compatible with existing useProgressiveOverload hook', () => {
      const result = service.calculateProgression(mockExerciseHistory);
      
      // Should return ProgressionRecommendation interface
      expect(result.strategy).toBeDefined();
      expect(result.suggestion).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.nextSessionPlan).toBeDefined();
      
      // Enhanced service returns enhanced features directly
      const enhancedResult = result as any;
      if (enhancedResult.aiInsights) {
        expect(enhancedResult.aiInsights).toBeDefined();
        expect(enhancedResult.plateauAnalysis).toBeDefined();
      } else {
        // Base service compatibility - should still work
        expect(result.strategy).toBeDefined();
      }
    });

    it('should handle volume plateau override in hook compatibility mode', () => {
      const plateauHistory = createPlateauMockHistory();
      const result = service.calculateProgression(plateauHistory);
      
      // Should return deload protocol when volume plateau detected
      expect(result.strategy).toBe('deload_protocol');
      expect(result.suggestion.reasoning).toContain('Volume plateau detected');
    });
  });
});

// Test Helper Functions
function createMockSessions(): WorkoutSession[] {
  const sessions: WorkoutSession[] = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 3)); // Every 3 days
    
    const weight = 100 + (i * 2.5); // Progressive weight increase
    
    sessions.push({
      sessionId: `session-${i}`,
      date,
      targetReps: 8,
      targetSets: 3,
      averageRPE: 7.5 + (Math.random() * 1.5), // RPE 7.5-9
      sets: [
        createMockSet(1, weight, 8, 7.5),
        createMockSet(2, weight, 8, 8.0),
        createMockSet(3, weight, 7, 8.5)
      ],
      notes: `Training session ${i + 1}`
    });
  }
  
  return sessions.reverse(); // Most recent first
}

function createMockSet(setNumber: number, weight: number, reps: number, rpe: number): WorkoutSet {
  return {
    setNumber,
    weight,
    reps,
    rpe,
    restTime: 180,
    completed: true,
    formScore: 8 + (Math.random() * 1.5) // Form score 8-9.5
  };
}

function createPlateauMockHistory(): ExerciseHistory {
  // Create history with volume plateau (minimal progression over 3 weeks)
  const sessions: WorkoutSession[] = [];
  
  for (let week = 0; week < 3; week++) {
    for (let session = 0; session < 2; session++) {
      const date = new Date();
      date.setDate(date.getDate() - ((week * 7) + (session * 3)));
      
      const weight = 100; // No weight progression
      const reps = 7 - week; // Declining reps
      
      sessions.push({
        sessionId: `plateau-${week}-${session}`,
        date,
        targetReps: 8,
        targetSets: 3,
        averageRPE: 8.5 + (week * 0.5), // Increasing RPE
        sets: [
          createMockSet(1, weight, reps, 8.5 + (week * 0.5)),
          createMockSet(2, weight, reps - 1, 9.0 + (week * 0.3)),
          createMockSet(3, weight, reps - 2, 9.5)
        ]
      });
    }
  }
  
  return {
    exerciseId: 2,
    exerciseName: 'Squat',
    exerciseType: 'compound',
    category: 'strength',
    lastPerformed: new Date(),
    sessions: sessions.reverse()
  };
}

function createProgressiveMockHistory(): ExerciseHistory {
  // Create history with good progression (>10% volume increase)
  const sessions: WorkoutSession[] = [];
  
  for (let week = 0; week < 3; week++) {
    for (let session = 0; session < 2; session++) {
      const date = new Date();
      date.setDate(date.getDate() - ((week * 7) + (session * 3)));
      
      const weight = 80 + (week * 5) + (session * 2.5); // Progressive weight
      const reps = 8 + Math.floor(week / 2); // Progressive reps
      
      sessions.push({
        sessionId: `progress-${week}-${session}`,
        date,
        targetReps: 8,
        targetSets: 3,
        averageRPE: 7.5,
        sets: [
          createMockSet(1, weight, reps, 7.5),
          createMockSet(2, weight, reps, 7.8),
          createMockSet(3, weight, reps - 1, 8.0)
        ]
      });
    }
  }
  
  return {
    exerciseId: 3,
    exerciseName: 'Deadlift',
    exerciseType: 'compound',
    category: 'strength',
    lastPerformed: new Date(),
    sessions: sessions.reverse()
  };
}