/**
 * Enhanced Progressive Overload Service with Evidence-Based Plateau Detection
 * Integrates Perplexity Pro research findings with existing FitForge architecture
 */

import { ProgressiveOverloadService } from './progressive-overload';
import { PlateauDetectionService, EvidenceBasedPlateauDetection } from './plateau-detection';
import { 
  ExerciseHistory, 
  ProgressionRecommendation,
  ProgressionStrategy 
} from '@/types/progression';

export interface EnhancedProgressionRecommendation extends ProgressionRecommendation {
  plateauAnalysis: EvidenceBasedPlateauDetection;
  aiInsights: {
    primaryRecommendation: string;
    alternativeStrategies: string[];
    confidenceExplanation: string;
    researchBasis: string;
    expectedOutcome: string;
  };
  periodizationSuggestion?: {
    currentPhase: 'strength' | 'hypertrophy' | 'power' | 'deload';
    nextPhase: 'strength' | 'hypertrophy' | 'power' | 'deload';
    phaseTransitionDate: Date;
    dupRecommendation: boolean; // Daily Undulating Periodization
  };
}

export interface RPETrackingData {
  sessionDate: Date;
  exerciseId: string;
  setNumber: number;
  targetRPE: number;
  actualRPE: number;
  repsInReserve: number;
  autoregulationAdjustment: number; // Weight adjustment based on RPE
}

export class EnhancedProgressiveOverloadService {
  private baseService: ProgressiveOverloadService;
  private plateauService: PlateauDetectionService;

  constructor() {
    this.baseService = new ProgressiveOverloadService();
    this.plateauService = new PlateauDetectionService();
  }

  /**
   * Enhanced progression analysis with plateau detection and AI insights
   */
  calculateEnhancedProgression(exerciseHistory: ExerciseHistory): EnhancedProgressionRecommendation {
    // Get base progression recommendation
    const baseRecommendation = this.baseService.calculateProgression(exerciseHistory);
    
    // Perform evidence-based plateau detection
    const plateauAnalysis = this.plateauService.detectPlateau(exerciseHistory);
    
    // Generate AI insights based on research
    const aiInsights = this.generateAIInsights(baseRecommendation, plateauAnalysis, exerciseHistory);
    
    // Create periodization suggestions
    const periodizationSuggestion = this.generatePeriodizationSuggestion(
      baseRecommendation, 
      plateauAnalysis, 
      exerciseHistory
    );
    
    // Override base strategy if plateau detected
    const enhancedStrategy = this.determineEnhancedStrategy(
      baseRecommendation.strategy, 
      plateauAnalysis
    );

    return {
      ...baseRecommendation,
      strategy: enhancedStrategy,
      plateauAnalysis,
      aiInsights,
      periodizationSuggestion
    };
  }

  /**
   * RPE-based autoregulation (research shows superior outcomes)
   */
  calculateRPEAutoregulation(
    exerciseHistory: ExerciseHistory,
    targetRPE: number = 7.5
  ): { adjustedWeight: number; reasoning: string; confidenceLevel: 'high' | 'medium' | 'low' } {
    const lastSession = exerciseHistory.sessions[0];
    if (!lastSession) {
      return {
        adjustedWeight: 0,
        reasoning: 'No session data available for RPE autoregulation',
        confidenceLevel: 'low'
      };
    }

    const lastWeight = lastSession.sets[0]?.weight || 0;
    const averageRPE = this.calculateAverageRPE(lastSession);
    
    // Research-based RPE autoregulation (target RPE 7-9 zone)
    const rpeDeviation = averageRPE - targetRPE;
    const baseIncrement = exerciseHistory.exerciseType === 'compound' ? 2.5 : 1.25;
    
    let adjustedWeight = lastWeight;
    let reasoning = '';
    let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';

    if (Math.abs(rpeDeviation) <= 0.5) {
      // Within optimal zone - maintain weight
      adjustedWeight = lastWeight;
      reasoning = `RPE ${averageRPE.toFixed(1)} within optimal zone (7-8). Maintain current weight.`;
      confidenceLevel = 'high';
    } else if (rpeDeviation < -1.0) {
      // RPE too low - increase weight more aggressively
      const multiplier = Math.min(-rpeDeviation / 1.5, 2.0); // Cap at 2x increase
      adjustedWeight = lastWeight + (baseIncrement * multiplier);
      reasoning = `Low RPE ${averageRPE.toFixed(1)} indicates capacity for larger increase (+${(baseIncrement * multiplier).toFixed(1)}kg).`;
      confidenceLevel = 'medium';
    } else if (rpeDeviation > 1.0) {
      // RPE too high - reduce weight or maintain
      if (averageRPE >= 9.0) {
        adjustedWeight = lastWeight * 0.95; // 5% reduction for very high RPE
        reasoning = `High RPE ${averageRPE.toFixed(1)} requires weight reduction for recovery.`;
        confidenceLevel = 'high';
      } else {
        adjustedWeight = lastWeight;
        reasoning = `Elevated RPE ${averageRPE.toFixed(1)} suggests maintaining current weight.`;
        confidenceLevel = 'medium';
      }
    } else {
      // Small adjustments for minor deviations
      const adjustment = -rpeDeviation * (baseIncrement * 0.3);
      adjustedWeight = lastWeight + adjustment;
      reasoning = `RPE ${averageRPE.toFixed(1)} suggests ${adjustment > 0 ? 'small increase' : 'small decrease'}.`;
      confidenceLevel = 'medium';
    }

    return {
      adjustedWeight: Math.round(adjustedWeight * 4) / 4, // Round to 0.25kg
      reasoning,
      confidenceLevel
    };
  }

  /**
   * Generate AI insights based on research findings
   */
  private generateAIInsights(
    baseRecommendation: ProgressionRecommendation,
    plateauAnalysis: EvidenceBasedPlateauDetection,
    exerciseHistory: ExerciseHistory
  ) {
    let primaryRecommendation = '';
    const alternativeStrategies: string[] = [];
    let confidenceExplanation = '';
    let researchBasis = '';
    let expectedOutcome = '';

    // Plateau-specific recommendations
    if (plateauAnalysis.plateauConfidence > 60) {
      switch (plateauAnalysis.recommendedAction) {
        case 'deload_protocol':
          primaryRecommendation = 'Implement evidence-based deload protocol: reduce intensity by 10-20% for 1 week';
          researchBasis = 'Research shows deload protocols every 4-6 weeks reduce overtraining risk and enhance recovery';
          expectedOutcome = 'Restored performance capacity within 1-2 weeks, enabling renewed progression';
          alternativeStrategies.push('Volume deload: reduce sets by 40-60% while maintaining intensity');
          break;
          
        case 'dup_periodization':
          primaryRecommendation = 'Transition to Daily Undulating Periodization (DUP) for superior progression';
          researchBasis = 'Meta-analysis shows DUP produces 28% better strength gains than linear periodization';
          expectedOutcome = 'Breakthrough plateau within 3-4 weeks with varied daily stimuli';
          alternativeStrategies.push('Block periodization: 3-week focused phases', 'Autoregulation with RPE targets');
          break;
          
        case 'technique_focus':
          primaryRecommendation = 'Prioritize technique refinement over load progression';
          researchBasis = 'Form degradation >15% indicates motor pattern breakdown requiring technical focus';
          expectedOutcome = 'Improved form scores and renewed progression within 2-3 weeks';
          alternativeStrategies.push('Tempo manipulation for motor control', 'Reduced range of motion practice');
          break;
          
        default:
          primaryRecommendation = 'Continue current programming with enhanced monitoring';
          researchBasis = 'Insufficient plateau indicators detected - maintain current approach';
          expectedOutcome = 'Sustained progression with close monitoring for plateau development';
      }
      
      confidenceExplanation = `${plateauAnalysis.plateauConfidence}% confidence based on ${Object.values(plateauAnalysis.activeIndicators).filter(Boolean).length} active plateau indicators`;
    } else {
      // Standard progression recommendations
      primaryRecommendation = this.getStandardRecommendation(baseRecommendation.strategy);
      researchBasis = this.getResearchBasis(baseRecommendation.strategy);
      expectedOutcome = this.getExpectedOutcome(baseRecommendation.strategy);
      confidenceExplanation = `Standard progression based on ${baseRecommendation.suggestion.confidenceLevel} confidence metrics`;
    }

    return {
      primaryRecommendation,
      alternativeStrategies,
      confidenceExplanation,
      researchBasis,
      expectedOutcome
    };
  }

  /**
   * Generate periodization suggestions based on research
   */
  private generatePeriodizationSuggestion(
    baseRecommendation: ProgressionRecommendation,
    plateauAnalysis: EvidenceBasedPlateauDetection,
    exerciseHistory: ExerciseHistory
  ) {
    const currentPhase = this.determineCurrentPhase(exerciseHistory);
    const shouldUseDUP = plateauAnalysis.plateauConfidence > 40 || 
                        exerciseHistory.sessions.length > 12; // Trained individuals benefit more from DUP
    
    let nextPhase: 'strength' | 'hypertrophy' | 'power' | 'deload' = currentPhase;
    
    // Evidence-based phase transitions
    if (plateauAnalysis.recommendedAction === 'deload_protocol') {
      nextPhase = 'deload';
    } else if (currentPhase === 'strength' && plateauAnalysis.plateauConfidence > 60) {
      nextPhase = 'hypertrophy'; // Volume phase after strength plateau
    } else if (currentPhase === 'hypertrophy' && plateauAnalysis.plateauConfidence > 60) {
      nextPhase = 'strength'; // Intensity phase after volume plateau
    }

    const phaseTransitionDate = new Date();
    phaseTransitionDate.setDate(phaseTransitionDate.getDate() + 21); // 3-week phases

    return {
      currentPhase,
      nextPhase,
      phaseTransitionDate,
      dupRecommendation: shouldUseDUP
    };
  }

  /**
   * Determine enhanced strategy based on plateau analysis
   */
  private determineEnhancedStrategy(
    baseStrategy: ProgressionStrategy,
    plateauAnalysis: EvidenceBasedPlateauDetection
  ): ProgressionStrategy {
    // Override base strategy if plateau detected with high confidence
    if (plateauAnalysis.plateauConfidence > 70) {
      switch (plateauAnalysis.recommendedAction) {
        case 'deload_protocol':
          return 'deload_protocol';
        case 'dup_periodization':
          return 'auto_regulation'; // Use autoregulation as proxy for DUP
        case 'technique_focus':
          return 'double_progression'; // Focus on reps before weight
        default:
          return baseStrategy;
      }
    }
    
    return baseStrategy;
  }

  /**
   * Helper methods
   */
  private calculateAverageRPE(session: any): number {
    const rpeValues = session.sets
      .map((set: any) => set.rpe)
      .filter((rpe: any): rpe is number => rpe !== undefined);
    
    return rpeValues.length > 0 
      ? rpeValues.reduce((sum: number, rpe: number) => sum + rpe, 0) / rpeValues.length 
      : 7.5; // Default assumption
  }

  private determineCurrentPhase(exerciseHistory: ExerciseHistory): 'strength' | 'hypertrophy' | 'power' | 'deload' {
    const lastSession = exerciseHistory.sessions[0];
    if (!lastSession) return 'hypertrophy';
    
    const avgReps = lastSession.sets.reduce((sum, set) => sum + set.reps, 0) / lastSession.sets.length;
    
    if (avgReps <= 5) return 'strength';
    if (avgReps <= 8) return 'power';
    return 'hypertrophy';
  }

  private getStandardRecommendation(strategy: ProgressionStrategy): string {
    const recommendations: Record<ProgressionStrategy, string> = {
      linear_progression: 'Continue linear weight progression based on completion and RPE metrics',
      double_progression: 'Focus on rep progression before increasing weight',
      auto_regulation: 'Use RPE-based autoregulation for optimal load selection',
      deload_protocol: 'Implement recovery-focused deload protocol',
      wave_loading: 'Implement wave loading with cyclical intensity patterns'
    };
    return recommendations[strategy] || 'Continue current programming approach';
  }

  private getResearchBasis(strategy: ProgressionStrategy): string {
    const research: Record<ProgressionStrategy, string> = {
      linear_progression: 'Linear progression effective for novice trainees with consistent adaptation',
      double_progression: 'Double progression maximizes volume before intensity increases',
      auto_regulation: 'RPE-based training shows superior outcomes in trained individuals',
      deload_protocol: 'Systematic deloading prevents overtraining and enhances recovery',
      wave_loading: 'Wave loading periodization optimizes fatigue management'
    };
    return research[strategy] || 'Standard periodization principles';
  }

  private getExpectedOutcome(strategy: ProgressionStrategy): string {
    const outcomes: Record<ProgressionStrategy, string> = {
      linear_progression: 'Consistent strength gains over 8-12 week periods',
      double_progression: 'Enhanced work capacity and muscle endurance development',
      auto_regulation: 'Optimized training stimulus matching daily readiness',
      deload_protocol: 'Restored performance capacity and renewed progression',
      wave_loading: 'Optimized strength gains through periodized loading'
    };
    return outcomes[strategy] || 'Continued training adaptation';
  }
}

// Export singleton instance
export const enhancedProgressiveOverloadService = new EnhancedProgressiveOverloadService();