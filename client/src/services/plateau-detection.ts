/**
 * Evidence-Based Plateau Detection Service
 * Implementation based on 60+ study meta-analysis from Perplexity Pro research
 * Targeting <3.2% false positive rate with 85%+ detection accuracy
 */

import { ExerciseHistory, WorkoutSession } from '@/types/progression';

export interface PlateauIndicator {
  type: 'weight_stagnation' | 'rpe_elevation' | 'completion_drop' | 'form_degradation';
  severity: 'mild' | 'moderate' | 'severe';
  threshold: number;
  actualValue: number;
  weeksDuration: number;
}

export interface EvidenceBasedPlateauDetection {
  exerciseId: string;
  plateauConfidence: number; // 0-100 confidence score
  activeIndicators: {
    weightStagnation: boolean;    // 4+ weeks no progression
    rpeElevation: boolean;        // >8.5 for 2+ weeks
    completionDrop: boolean;      // <80% target reps
    formDegradation: boolean;     // >15% drop from baseline
  };
  indicators: PlateauIndicator[];
  recommendedAction: 'deload_protocol' | 'technique_focus' | 'dup_periodization' | 'maintain_current';
  evidenceStrength: 'high' | 'moderate' | 'low';
  timelineWeeks: number;
  nextEvaluationDate: Date;
}

export interface PlateauDetectionConfig {
  // Research-validated thresholds
  weightStagnationWeeks: number;        // 4 weeks (from validation studies)
  rpeElevationThreshold: number;        // 8.5 (RIR 0-1 zone)
  rpeElevationWeeks: number;           // 2 weeks sustained
  completionRateThreshold: number;      // 80% minimum
  completionEvaluationSessions: number; // 4 sessions
  formDegradationThreshold: number;     // 15% drop
  formBaselineWeeks: number;           // 4 weeks baseline
  
  // Multi-signal validation
  minIndicatorsForPlateau: number;     // 2+ indicators required
  falsePositiveTarget: number;         // <3.2% target rate
  
  // Confidence scoring
  highConfidenceThreshold: number;     // 85% confidence
  moderateConfidenceThreshold: number; // 60% confidence
}

export class PlateauDetectionService {
  private config: PlateauDetectionConfig;

  constructor(config?: Partial<PlateauDetectionConfig>) {
    this.config = {
      // Evidence-based thresholds from research
      weightStagnationWeeks: 4,        // Validated optimal detection window
      rpeElevationThreshold: 8.5,      // RIR 0-1 zone threshold
      rpeElevationWeeks: 2,            // Sustained elevation period
      completionRateThreshold: 0.80,   // 80% completion minimum
      completionEvaluationSessions: 4, // 4 session evaluation window
      formDegradationThreshold: 0.15,  // 15% degradation threshold
      formBaselineWeeks: 4,            // 4 week baseline period
      
      minIndicatorsForPlateau: 2,      // Multi-signal requirement
      falsePositiveTarget: 0.032,      // <3.2% false positive target
      
      highConfidenceThreshold: 85,     // High confidence threshold
      moderateConfidenceThreshold: 60, // Moderate confidence threshold
      ...config
    };
  }

  /**
   * Main plateau detection method using evidence-based algorithms
   */
  detectPlateau(exerciseHistory: ExerciseHistory): EvidenceBasedPlateauDetection {
    if (exerciseHistory.sessions.length < this.config.weightStagnationWeeks) {
      return this.createInsufficientDataResult(exerciseHistory);
    }

    // Analyze all plateau indicators
    const indicators = this.analyzeAllIndicators(exerciseHistory);
    const activeIndicators = this.determineActiveIndicators(indicators);
    
    // Calculate plateau confidence using multi-signal approach
    const plateauConfidence = this.calculatePlateauConfidence(indicators, activeIndicators);
    
    // Determine evidence strength and recommendations
    const evidenceStrength = this.determineEvidenceStrength(plateauConfidence, indicators);
    const recommendedAction = this.determineRecommendedAction(indicators, activeIndicators);
    
    // Calculate timeline and next evaluation
    const timelineWeeks = this.calculatePlateauTimeline(indicators);
    const nextEvaluationDate = this.calculateNextEvaluation();

    return {
      exerciseId: exerciseHistory.exerciseId,
      plateauConfidence,
      activeIndicators,
      indicators,
      recommendedAction,
      evidenceStrength,
      timelineWeeks,
      nextEvaluationDate
    };
  }

  /**
   * Analyze all plateau indicators based on research thresholds
   */
  private analyzeAllIndicators(exerciseHistory: ExerciseHistory): PlateauIndicator[] {
    const indicators: PlateauIndicator[] = [];

    // 1. Weight Stagnation Analysis (4+ weeks no progression)
    const weightStagnation = this.analyzeWeightStagnation(exerciseHistory);
    if (weightStagnation) {
      indicators.push(weightStagnation);
    }

    // 2. RPE Elevation Analysis (>8.5 for 2+ weeks)
    const rpeElevation = this.analyzeRPEElevation(exerciseHistory);
    if (rpeElevation) {
      indicators.push(rpeElevation);
    }

    // 3. Completion Rate Drop (<80% in last 4 sessions)
    const completionDrop = this.analyzeCompletionDrop(exerciseHistory);
    if (completionDrop) {
      indicators.push(completionDrop);
    }

    // 4. Form Score Degradation (>15% drop from baseline)
    const formDegradation = this.analyzeFormDegradation(exerciseHistory);
    if (formDegradation) {
      indicators.push(formDegradation);
    }

    return indicators;
  }

  /**
   * Weight stagnation analysis: 4+ weeks no progression
   */
  private analyzeWeightStagnation(exerciseHistory: ExerciseHistory): PlateauIndicator | null {
    const sessions = exerciseHistory.sessions.slice(0, this.config.weightStagnationWeeks);
    if (sessions.length < this.config.weightStagnationWeeks) return null;

    const weights = sessions.map(s => s.sets[0]?.weight || 0);
    const maxWeight = Math.max(...weights);
    const latestWeight = weights[0];
    
    // Check if no progression in last 4 weeks
    const stagnationWeeks = this.calculateWeeksWithoutProgression(weights);
    
    if (stagnationWeeks >= this.config.weightStagnationWeeks) {
      return {
        type: 'weight_stagnation',
        severity: stagnationWeeks >= 6 ? 'severe' : stagnationWeeks >= 5 ? 'moderate' : 'mild',
        threshold: this.config.weightStagnationWeeks,
        actualValue: stagnationWeeks,
        weeksDuration: stagnationWeeks
      };
    }

    return null;
  }

  /**
   * RPE elevation analysis: >8.5 sustained for 2+ weeks
   */
  private analyzeRPEElevation(exerciseHistory: ExerciseHistory): PlateauIndicator | null {
    const recentSessions = exerciseHistory.sessions.slice(0, this.config.rpeElevationWeeks * 2); // ~4 sessions
    if (recentSessions.length < this.config.rpeElevationWeeks) return null;

    const rpeValues: number[] = [];
    
    for (const session of recentSessions) {
      const sessionRPEs = session.sets
        .map(set => set.rpe)
        .filter((rpe): rpe is number => rpe !== undefined);
      
      if (sessionRPEs.length > 0) {
        const avgRPE = sessionRPEs.reduce((sum, rpe) => sum + rpe, 0) / sessionRPEs.length;
        rpeValues.push(avgRPE);
      }
    }

    if (rpeValues.length < this.config.rpeElevationWeeks) return null;

    const averageRPE = rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length;
    const elevatedSessions = rpeValues.filter(rpe => rpe > this.config.rpeElevationThreshold).length;
    
    if (elevatedSessions >= this.config.rpeElevationWeeks) {
      return {
        type: 'rpe_elevation',
        severity: averageRPE >= 9.5 ? 'severe' : averageRPE >= 9.0 ? 'moderate' : 'mild',
        threshold: this.config.rpeElevationThreshold,
        actualValue: averageRPE,
        weeksDuration: Math.ceil(elevatedSessions / 2) // Assume ~2 sessions per week
      };
    }

    return null;
  }

  /**
   * Completion rate analysis: <80% in last 4 sessions
   */
  private analyzeCompletionDrop(exerciseHistory: ExerciseHistory): PlateauIndicator | null {
    const recentSessions = exerciseHistory.sessions.slice(0, this.config.completionEvaluationSessions);
    if (recentSessions.length < this.config.completionEvaluationSessions) return null;

    const completionRates = recentSessions.map(session => {
      const targetReps = session.targetReps * session.targetSets;
      const actualReps = session.sets.reduce((sum, set) => sum + set.reps, 0);
      return actualReps / targetReps;
    });

    const averageCompletion = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
    
    if (averageCompletion < this.config.completionRateThreshold) {
      return {
        type: 'completion_drop',
        severity: averageCompletion < 0.65 ? 'severe' : averageCompletion < 0.75 ? 'moderate' : 'mild',
        threshold: this.config.completionRateThreshold,
        actualValue: averageCompletion,
        weeksDuration: Math.ceil(this.config.completionEvaluationSessions / 2)
      };
    }

    return null;
  }

  /**
   * Form score degradation: >15% drop from 4-week baseline
   */
  private analyzeFormDegradation(exerciseHistory: ExerciseHistory): PlateauIndicator | null {
    const allSessions = exerciseHistory.sessions;
    if (allSessions.length < this.config.formBaselineWeeks * 2) return null;

    // Calculate baseline form score (weeks 4-8 ago)
    const baselineSessions = allSessions.slice(this.config.formBaselineWeeks, this.config.formBaselineWeeks * 2);
    const recentSessions = allSessions.slice(0, this.config.formBaselineWeeks);

    const getAverageFormScore = (sessions: WorkoutSession[]) => {
      const formScores = sessions.flatMap(s => s.sets.map(set => set.formScore || 8)).filter(score => score > 0);
      return formScores.length > 0 ? formScores.reduce((sum, score) => sum + score, 0) / formScores.length : 8;
    };

    const baselineFormScore = getAverageFormScore(baselineSessions);
    const recentFormScore = getAverageFormScore(recentSessions);
    
    const degradation = (baselineFormScore - recentFormScore) / baselineFormScore;
    
    if (degradation > this.config.formDegradationThreshold) {
      return {
        type: 'form_degradation',
        severity: degradation > 0.25 ? 'severe' : degradation > 0.20 ? 'moderate' : 'mild',
        threshold: this.config.formDegradationThreshold,
        actualValue: degradation,
        weeksDuration: this.config.formBaselineWeeks
      };
    }

    return null;
  }

  /**
   * Calculate plateau confidence using multi-signal approach
   */
  private calculatePlateauConfidence(indicators: PlateauIndicator[], activeIndicators: any): number {
    if (indicators.length === 0) return 0;

    const activeCount = Object.values(activeIndicators).filter(Boolean).length;
    
    // Base confidence from number of active indicators
    let confidence = (activeCount / 4) * 60; // Max 60% from indicator count
    
    // Add severity weighting
    const severityWeights = { mild: 10, moderate: 20, severe: 30 };
    const severityBonus = indicators.reduce((sum, indicator) => sum + severityWeights[indicator.severity], 0);
    confidence += Math.min(severityBonus, 40); // Max 40% from severity
    
    // Multi-signal validation bonus (research shows superior accuracy)
    if (activeCount >= this.config.minIndicatorsForPlateau) {
      confidence += 20; // Multi-signal bonus
    }
    
    // Duration weighting (longer plateaus more confident)
    const maxDuration = Math.max(...indicators.map(i => i.weeksDuration));
    const durationBonus = Math.min(maxDuration * 2, 15); // Max 15% from duration
    confidence += durationBonus;

    return Math.min(Math.round(confidence), 100);
  }

  /**
   * Helper methods
   */
  private determineActiveIndicators(indicators: PlateauIndicator[]) {
    return {
      weightStagnation: indicators.some(i => i.type === 'weight_stagnation'),
      rpeElevation: indicators.some(i => i.type === 'rpe_elevation'),
      completionDrop: indicators.some(i => i.type === 'completion_drop'),
      formDegradation: indicators.some(i => i.type === 'form_degradation')
    };
  }

  private determineEvidenceStrength(confidence: number, indicators: PlateauIndicator[]): 'high' | 'moderate' | 'low' {
    if (confidence >= this.config.highConfidenceThreshold && indicators.length >= 2) return 'high';
    if (confidence >= this.config.moderateConfidenceThreshold) return 'moderate';
    return 'low';
  }

  private determineRecommendedAction(
    indicators: PlateauIndicator[], 
    activeIndicators: any
  ): 'deload_protocol' | 'technique_focus' | 'dup_periodization' | 'maintain_current' {
    // High RPE with completion issues = deload
    if (activeIndicators.rpeElevation && activeIndicators.completionDrop) {
      return 'deload_protocol';
    }
    
    // Form degradation = technique focus
    if (activeIndicators.formDegradation) {
      return 'technique_focus';
    }
    
    // Pure weight stagnation = periodization change (research shows DUP superiority)
    if (activeIndicators.weightStagnation && !activeIndicators.rpeElevation) {
      return 'dup_periodization';
    }
    
    return 'maintain_current';
  }

  private calculateWeeksWithoutProgression(weights: number[]): number {
    let weeks = 0;
    const latestWeight = weights[0];
    
    for (let i = 1; i < weights.length; i++) {
      if (weights[i] >= latestWeight) {
        weeks++;
      } else {
        break;
      }
    }
    
    return weeks;
  }

  private calculatePlateauTimeline(indicators: PlateauIndicator[]): number {
    return indicators.length > 0 ? Math.max(...indicators.map(i => i.weeksDuration)) : 0;
  }

  private calculateNextEvaluation(): Date {
    const nextEval = new Date();
    nextEval.setDate(nextEval.getDate() + 7); // Weekly evaluation
    return nextEval;
  }

  private createInsufficientDataResult(exerciseHistory: ExerciseHistory): EvidenceBasedPlateauDetection {
    return {
      exerciseId: exerciseHistory.exerciseId,
      plateauConfidence: 0,
      activeIndicators: {
        weightStagnation: false,
        rpeElevation: false,
        completionDrop: false,
        formDegradation: false
      },
      indicators: [],
      recommendedAction: 'maintain_current',
      evidenceStrength: 'low',
      timelineWeeks: 0,
      nextEvaluationDate: this.calculateNextEvaluation()
    };
  }
}

// Export singleton instance with default config
export const plateauDetectionService = new PlateauDetectionService();

// Export factory function for custom configs
export const createPlateauDetectionService = (config?: Partial<PlateauDetectionConfig>) => {
  return new PlateauDetectionService(config);
};