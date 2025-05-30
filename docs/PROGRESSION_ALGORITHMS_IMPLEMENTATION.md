# Progressive Overload & Periodization Algorithms - Implementation Guide

## Overview

This document provides specific implementation details for integrating evidence-based progressive overload and periodization algorithms into FitForge, building upon the existing `ProgressiveOverloadService` and data structures.

## Enhanced Data Types

### Extended Progression Types
```typescript
// Add to existing progression.ts
export interface AdvancedProgressionConfig extends ProgressionConfig {
  // Periodization settings
  periodizationModel: 'linear' | 'daily_undulating' | 'weekly_undulating' | 'block' | 'autoregulated'
  deloadStrategy: 'time_based' | 'auto_detected' | 'rpe_triggered' | 'plateau_triggered'
  
  // Plateau detection
  plateauDetection: {
    enabled: boolean
    windowWeeks: number // 4-6 weeks recommended
    significanceThreshold: number // 0.5% minimum progress
    rpeThreshold: number // 8.5 for fatigue detection
  }
  
  // Personalization factors
  personalization: {
    trainingAge: number // months
    responseRate: number // learned from history, 0.5-2.0
    volumeTolerance: number // sets per week
    recoveryRate: 'fast' | 'average' | 'slow'
  }
  
  // Autoregulation
  autoregulation: {
    enabled: boolean
    targetRPE: number // 7.5 default
    rpeRange: number // ±1.0 tolerance
    volumeAdjustment: boolean
  }
}

export interface PlateauSignal {
  type: 'weight_stagnation' | 'volume_stagnation' | 'rpe_elevation' | 'completion_decline'
  severity: number // 0-1 scale
  confidence: number // 0-1 scale
  timeDetected: Date
  recommendedAction: 'continue' | 'deload' | 'adjust_volume' | 'change_exercise'
}

export interface DeloadRecommendation {
  shouldDeload: boolean
  urgency: 'immediate' | 'recommended' | 'optional'
  strategy: 'intensity' | 'volume' | 'combined' | 'active_recovery'
  duration: number // weeks
  intensityReduction: number // 0.1-0.2
  volumeReduction: number // 0.3-0.6
  reasoning: string
}

export interface PersonalizedRecommendation extends ProgressionRecommendation {
  personalizedProgressionRate: number
  volumeRecommendation: VolumeRecommendation
  deloadFrequency: number // weeks
  periodizationSuggestion: string
  confidenceFactors: {
    dataQuality: number // 0-1
    historicalAccuracy: number // 0-1
    responseConsistency: number // 0-1
  }
}

export interface VolumeRecommendation {
  recommendedSets: number
  setRange: [number, number] // min, max
  reasoning: string
  rpeAdjustment: number
  volumeProgression: 'increase' | 'maintain' | 'decrease'
}
```

## Core Algorithm Implementations

### 1. Enhanced Progressive Overload Service

```typescript
import { AdvancedProgressionConfig, PlateauSignal, DeloadRecommendation } from '@/types/progression';

export class AdvancedProgressiveOverloadService extends ProgressiveOverloadService {
  private plateauDetector: PlateauDetectionAlgorithm;
  private deloadProtocol: DeloadProtocolAlgorithm;
  private periodizationEngine: PeriodizationEngine;
  private personalizationService: PersonalizationService;

  constructor(config?: Partial<AdvancedProgressionConfig>) {
    super(config);
    this.plateauDetector = new PlateauDetectionAlgorithm();
    this.deloadProtocol = new DeloadProtocolAlgorithm();
    this.periodizationEngine = new PeriodizationEngine();
    this.personalizationService = new PersonalizationService();
  }

  calculateAdvancedProgression(exerciseHistory: ExerciseHistory): PersonalizedRecommendation {
    // Step 1: Check for plateau or deload necessity
    const plateauSignals = this.plateauDetector.detectPlateau(exerciseHistory, this.config);
    const deloadRecommendation = this.deloadProtocol.shouldDeload(exerciseHistory, plateauSignals);
    
    if (deloadRecommendation.shouldDeload) {
      return this.generateDeloadRecommendation(exerciseHistory, deloadRecommendation);
    }

    // Step 2: Apply periodization model
    const periodizedPlan = this.periodizationEngine.generateNextSession(
      exerciseHistory, 
      this.config.periodizationModel
    );

    // Step 3: Personalize based on individual factors
    const personalizedRecommendation = this.personalizationService.personalizeRecommendation(
      periodizedPlan,
      exerciseHistory,
      this.config.personalization
    );

    // Step 4: Apply autoregulation if enabled
    if (this.config.autoregulation.enabled) {
      return this.applyAutoregulation(personalizedRecommendation, exerciseHistory);
    }

    return personalizedRecommendation;
  }

  private generateDeloadRecommendation(
    history: ExerciseHistory, 
    deload: DeloadRecommendation
  ): PersonalizedRecommendation {
    const lastSession = history.sessions[0];
    const deloadedSession = this.deloadProtocol.generateDeloadSession(lastSession, deload);
    
    return {
      strategy: 'deload_protocol',
      suggestion: {
        suggestedWeight: deloadedSession.targetWeight,
        confidenceLevel: 'high',
        reasoning: `Deload recommended: ${deload.reasoning}`,
        increaseAmount: deloadedSession.targetWeight - lastSession.sets[0]?.weight || 0,
        alternativeWeights: this.generateDeloadAlternatives(deloadedSession.targetWeight),
        lastSessionSummary: this.createSessionSummary(lastSession)
      },
      metrics: this.analyzePerformanceMetrics(history),
      nextSessionPlan: deloadedSession,
      personalizedProgressionRate: 0, // No progression during deload
      volumeRecommendation: this.createDeloadVolumeRecommendation(deload),
      deloadFrequency: this.calculateOptimalDeloadFrequency(history),
      periodizationSuggestion: `Deload week ${deload.duration} using ${deload.strategy} strategy`,
      confidenceFactors: {
        dataQuality: this.assessDataQuality(history),
        historicalAccuracy: this.calculateHistoricalAccuracy(history),
        responseConsistency: this.assessResponseConsistency(history)
      }
    };
  }
}
```

### 2. Plateau Detection Algorithm

```typescript
export class PlateauDetectionAlgorithm {
  detectPlateau(
    history: ExerciseHistory, 
    config: AdvancedProgressionConfig
  ): PlateauSignal[] {
    const signals: PlateauSignal[] = [];
    const windowSize = config.plateauDetection.windowWeeks;
    const recentSessions = history.sessions.slice(0, windowSize);

    if (recentSessions.length < windowSize) {
      return []; // Not enough data
    }

    // Weight stagnation detection
    const weightSignal = this.detectWeightStagnation(recentSessions, config);
    if (weightSignal) signals.push(weightSignal);

    // RPE elevation detection
    const rpeSignal = this.detectRPEElevation(recentSessions, config);
    if (rpeSignal) signals.push(rpeSignal);

    // Volume stagnation detection
    const volumeSignal = this.detectVolumeStagnation(recentSessions, config);
    if (volumeSignal) signals.push(volumeSignal);

    // Completion rate decline
    const completionSignal = this.detectCompletionDecline(recentSessions, config);
    if (completionSignal) signals.push(completionSignal);

    return signals;
  }

  private detectWeightStagnation(
    sessions: WorkoutSession[], 
    config: AdvancedProgressionConfig
  ): PlateauSignal | null {
    const weights = sessions.map(s => s.sets[0]?.weight || 0);
    const progressionRate = this.calculateProgressionRate(weights);
    
    if (progressionRate < config.plateauDetection.significanceThreshold) {
      return {
        type: 'weight_stagnation',
        severity: Math.max(0, 1 - (progressionRate / config.plateauDetection.significanceThreshold)),
        confidence: this.calculateConfidence(sessions.length, weights),
        timeDetected: new Date(),
        recommendedAction: this.determineWeightStagnationAction(progressionRate, sessions)
      };
    }

    return null;
  }

  private detectRPEElevation(
    sessions: WorkoutSession[], 
    config: AdvancedProgressionConfig
  ): PlateauSignal | null {
    const rpeValues = sessions
      .flatMap(s => s.sets)
      .map(set => set.rpe)
      .filter((rpe): rpe is number => rpe !== undefined);

    if (rpeValues.length === 0) return null;

    const averageRPE = rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length;
    const rpeSlope = this.calculateLinearSlope(rpeValues);

    if (averageRPE > config.plateauDetection.rpeThreshold || rpeSlope > 0.1) {
      return {
        type: 'rpe_elevation',
        severity: Math.min(1, (averageRPE - 7) / 3), // Normalize to 0-1
        confidence: Math.min(1, rpeValues.length / (sessions.length * 3)), // Expect ~3 sets per session
        timeDetected: new Date(),
        recommendedAction: averageRPE > 9 ? 'deload' : 'adjust_volume'
      };
    }

    return null;
  }

  private calculateProgressionRate(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstValue = values[values.length - 1];
    const lastValue = values[0];
    const timeSpan = values.length - 1;
    
    if (firstValue === 0) return 0;
    
    const totalChange = (lastValue - firstValue) / firstValue;
    return totalChange / timeSpan; // Weekly progression rate
  }

  private calculateLinearSlope(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const xSum = (n * (n - 1)) / 2; // Sum of indices 0,1,2...n-1
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, idx) => sum + (val * idx), 0);
    const x2Sum = values.reduce((sum, _, idx) => sum + (idx * idx), 0);
    
    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    return slope;
  }

  private determineWeightStagnationAction(
    progressionRate: number, 
    sessions: WorkoutSession[]
  ): PlateauSignal['recommendedAction'] {
    const recentRPE = this.getRecentAverageRPE(sessions);
    
    if (recentRPE > 8.5) return 'deload';
    if (progressionRate < -0.01) return 'change_exercise'; // Negative progression
    if (progressionRate < 0.001) return 'adjust_volume'; // Very slow progression
    return 'continue';
  }

  private getRecentAverageRPE(sessions: WorkoutSession[]): number {
    const rpeValues = sessions
      .slice(0, 3) // Last 3 sessions
      .flatMap(s => s.sets)
      .map(set => set.rpe)
      .filter((rpe): rpe is number => rpe !== undefined);

    if (rpeValues.length === 0) return 7; // Default assumption
    return rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length;
  }

  private calculateConfidence(sessionCount: number, values: number[]): number {
    // Confidence based on data quantity and variance
    const dataQuantityScore = Math.min(1, sessionCount / 6); // 6 sessions for full confidence
    const variance = this.calculateVariance(values);
    const consistencyScore = Math.max(0, 1 - (variance / Math.max(...values)));
    
    return (dataQuantityScore + consistencyScore) / 2;
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    return squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
  }
}
```

### 3. Deload Protocol Algorithm

```typescript
export class DeloadProtocolAlgorithm {
  shouldDeload(
    history: ExerciseHistory, 
    plateauSignals: PlateauSignal[]
  ): DeloadRecommendation {
    const lastSession = history.sessions[0];
    const weeksSinceLastDeload = this.calculateWeeksSinceLastDeload(history);
    
    // Time-based deload (every 4-6 weeks)
    const timeBasedNeed = weeksSinceLastDeload >= 4;
    
    // Signal-based deload
    const highSeveritySignals = plateauSignals.filter(s => s.severity > 0.7);
    const signalBasedNeed = highSeveritySignals.length >= 2;
    
    // RPE-based deload
    const recentRPE = this.getRecentAverageRPE(history.sessions.slice(0, 3));
    const rpeBasedNeed = recentRPE > 9;
    
    const shouldDeload = rpeBasedNeed || signalBasedNeed || 
                        (timeBasedNeed && plateauSignals.length > 0);
    
    if (!shouldDeload) {
      return {
        shouldDeload: false,
        urgency: 'optional',
        strategy: 'volume',
        duration: 1,
        intensityReduction: 0,
        volumeReduction: 0,
        reasoning: 'No deload indicators present'
      };
    }

    // Determine deload strategy based on signals
    const strategy = this.determineDeloadStrategy(plateauSignals, recentRPE);
    const urgency = rpeBasedNeed ? 'immediate' : 
                   signalBasedNeed ? 'recommended' : 'optional';
    
    return {
      shouldDeload: true,
      urgency,
      strategy,
      duration: urgency === 'immediate' ? 2 : 1,
      intensityReduction: strategy === 'intensity' ? 0.15 : 
                         strategy === 'combined' ? 0.1 : 0,
      volumeReduction: strategy === 'volume' ? 0.5 : 
                      strategy === 'combined' ? 0.3 : 0,
      reasoning: this.generateDeloadReasoning(plateauSignals, recentRPE, weeksSinceLastDeload)
    };
  }

  generateDeloadSession(
    lastSession: WorkoutSession, 
    deload: DeloadRecommendation
  ): SessionPlan {
    const baseWeight = lastSession.sets[0]?.weight || 0;
    const baseReps = lastSession.targetReps;
    const baseSets = lastSession.targetSets;

    return {
      targetWeight: Math.round((baseWeight * (1 - deload.intensityReduction)) * 4) / 4,
      targetReps: Math.floor(baseReps * (1 - deload.volumeReduction)),
      targetSets: Math.floor(baseSets * (1 - deload.volumeReduction)),
      expectedRPE: 5, // Much lighter feeling during deload
      restTime: 180 // Standard rest during deload
    };
  }

  private determineDeloadStrategy(
    signals: PlateauSignal[], 
    recentRPE: number
  ): DeloadRecommendation['strategy'] {
    const hasRPEElevation = signals.some(s => s.type === 'rpe_elevation');
    const hasVolumeStagnation = signals.some(s => s.type === 'volume_stagnation');
    const hasWeightStagnation = signals.some(s => s.type === 'weight_stagnation');

    if (recentRPE > 9) {
      return 'combined'; // High fatigue needs both intensity and volume reduction
    }
    
    if (hasRPEElevation && hasVolumeStagnation) {
      return 'volume'; // Focus on volume reduction for recovery
    }
    
    if (hasWeightStagnation && recentRPE > 8) {
      return 'intensity'; // Reduce intensity while maintaining volume
    }
    
    return 'combined'; // Default to balanced approach
  }

  private generateDeloadReasoning(
    signals: PlateauSignal[], 
    rpe: number, 
    weeksSince: number
  ): string {
    const reasons = [];
    
    if (rpe > 9) reasons.push(`High fatigue (RPE: ${rpe.toFixed(1)})`);
    if (weeksSince >= 5) reasons.push(`Extended training block (${weeksSince} weeks)`);
    
    const signalTypes = signals.map(s => {
      switch (s.type) {
        case 'weight_stagnation': return 'weight plateau';
        case 'rpe_elevation': return 'elevated fatigue';
        case 'volume_stagnation': return 'volume plateau';
        case 'completion_decline': return 'performance decline';
        default: return 'training stress';
      }
    });

    if (signalTypes.length > 0) {
      reasons.push(`Multiple indicators: ${signalTypes.join(', ')}`);
    }

    return reasons.join('; ') || 'Preventive deload for optimal recovery';
  }

  private calculateWeeksSinceLastDeload(history: ExerciseHistory): number {
    // Look for sessions with significantly reduced weight/volume
    let weeks = 0;
    const sessions = history.sessions;
    
    for (let i = 1; i < sessions.length; i++) {
      const current = sessions[i - 1];
      const previous = sessions[i];
      
      const currentWeight = current.sets[0]?.weight || 0;
      const previousWeight = previous.sets[0]?.weight || 0;
      
      // Check for significant weight reduction (likely deload)
      if (previousWeight > 0 && currentWeight > 0) {
        const reduction = (previousWeight - currentWeight) / previousWeight;
        if (reduction > 0.1) { // 10% or more reduction
          break; // Found likely deload
        }
      }
      
      weeks++;
      
      // Cap at reasonable timeframe
      if (weeks >= 12) break;
    }
    
    return weeks;
  }

  private getRecentAverageRPE(sessions: WorkoutSession[]): number {
    const rpeValues = sessions
      .flatMap(s => s.sets)
      .map(set => set.rpe)
      .filter((rpe): rpe is number => rpe !== undefined);

    if (rpeValues.length === 0) return 7;
    return rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length;
  }
}
```

### 4. Periodization Engine

```typescript
export class PeriodizationEngine {
  generateNextSession(
    history: ExerciseHistory, 
    model: AdvancedProgressionConfig['periodizationModel']
  ): SessionPlan {
    switch (model) {
      case 'daily_undulating':
        return this.generateDUPSession(history);
      case 'weekly_undulating':
        return this.generateWUPSession(history);
      case 'block':
        return this.generateBlockSession(history);
      case 'autoregulated':
        return this.generateAutoregulatedSession(history);
      default:
        return this.generateLinearSession(history);
    }
  }

  private generateDUPSession(history: ExerciseHistory): SessionPlan {
    const lastSession = history.sessions[0];
    const recentSessions = history.sessions.slice(0, 7); // Last week
    
    // Determine next intensity zone based on recent pattern
    const intensityZones = this.classifyRecentIntensities(recentSessions);
    const nextZone = this.selectNextIntensityZone(intensityZones);
    
    return this.createSessionFromIntensityZone(lastSession, nextZone);
  }

  private classifyRecentIntensities(sessions: WorkoutSession[]): string[] {
    return sessions.map(session => {
      const avgWeight = session.sets.reduce((sum, set) => sum + set.weight, 0) / session.sets.length;
      const lastMaxWeight = sessions[0]?.sets[0]?.weight || avgWeight;
      const intensity = lastMaxWeight > 0 ? avgWeight / lastMaxWeight : 0.75;
      
      if (intensity >= 0.85) return 'heavy';
      if (intensity >= 0.70) return 'moderate';
      return 'light';
    });
  }

  private selectNextIntensityZone(recentZones: string[]): string {
    const lastZone = recentZones[0] || 'moderate';
    
    // DUP pattern: avoid consecutive heavy days, ensure variety
    const heavyCount = recentZones.slice(0, 3).filter(z => z === 'heavy').length;
    const lightCount = recentZones.slice(0, 3).filter(z => z === 'light').length;
    
    if (lastZone === 'heavy' || heavyCount >= 2) {
      return lightCount === 0 ? 'light' : 'moderate';
    }
    
    if (lastZone === 'light' && heavyCount === 0) {
      return 'heavy';
    }
    
    // Default progression
    const zoneProgression = { 'light': 'moderate', 'moderate': 'heavy', 'heavy': 'light' };
    return zoneProgression[lastZone] || 'moderate';
  }

  private createSessionFromIntensityZone(lastSession: WorkoutSession, zone: string): SessionPlan {
    const baseWeight = lastSession.sets[0]?.weight || 0;
    
    const zoneConfigs = {
      heavy: { intensityMod: 1.05, reps: 3, sets: 4, rpe: 8.5 },
      moderate: { intensityMod: 0.85, reps: 8, sets: 3, rpe: 7.5 },
      light: { intensityMod: 0.65, reps: 15, sets: 3, rpe: 6.5 }
    };
    
    const config = zoneConfigs[zone] || zoneConfigs.moderate;
    
    return {
      targetWeight: Math.round((baseWeight * config.intensityMod) * 4) / 4,
      targetReps: config.reps,
      targetSets: config.sets,
      expectedRPE: config.rpe,
      restTime: config.reps <= 5 ? 240 : config.reps <= 10 ? 180 : 120
    };
  }

  private generateAutoregulatedSession(history: ExerciseHistory): SessionPlan {
    const lastSession = history.sessions[0];
    const lastRPE = this.getLastSessionRPE(lastSession);
    const targetRPE = 7.5;
    
    // Adjust intensity based on RPE feedback
    let intensityAdjustment = 0;
    
    if (lastRPE > targetRPE + 1) {
      intensityAdjustment = -0.05 * (lastRPE - targetRPE); // Reduce intensity
    } else if (lastRPE < targetRPE - 1) {
      intensityAdjustment = 0.025 * (targetRPE - lastRPE); // Increase intensity
    }
    
    const baseWeight = lastSession.sets[0]?.weight || 0;
    const adjustedWeight = baseWeight * (1 + intensityAdjustment);
    
    return {
      targetWeight: Math.round(adjustedWeight * 4) / 4,
      targetReps: lastSession.targetReps,
      targetSets: lastSession.targetSets,
      expectedRPE: targetRPE,
      restTime: 180
    };
  }

  private getLastSessionRPE(session: WorkoutSession): number {
    const rpeValues = session.sets
      .map(set => set.rpe)
      .filter((rpe): rpe is number => rpe !== undefined);
    
    if (rpeValues.length === 0) return 7; // Default
    return rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length;
  }
}
```

### 5. Personalization Service

```typescript
export class PersonalizationService {
  personalizeRecommendation(
    basePlan: SessionPlan,
    history: ExerciseHistory,
    factors: AdvancedProgressionConfig['personalization']
  ): PersonalizedRecommendation {
    const personalizedRate = this.calculatePersonalizedRate(history, factors);
    const volumeRec = this.calculateVolumeRecommendation(history, factors);
    const deloadFreq = this.calculateOptimalDeloadFrequency(history, factors);
    
    return {
      strategy: 'personalized_progression',
      suggestion: this.adjustSuggestionForIndividual(basePlan, personalizedRate),
      metrics: this.analyzePersonalizedMetrics(history),
      nextSessionPlan: this.personalizeSessionPlan(basePlan, factors),
      personalizedProgressionRate: personalizedRate,
      volumeRecommendation: volumeRec,
      deloadFrequency: deloadFreq,
      periodizationSuggestion: this.generatePeriodizationAdvice(history, factors),
      confidenceFactors: this.calculateConfidenceFactors(history)
    };
  }

  private calculatePersonalizedRate(
    history: ExerciseHistory,
    factors: AdvancedProgressionConfig['personalization']
  ): number {
    // Base rate on training age
    let baseRate = 0.015; // 1.5% per week baseline
    
    if (factors.trainingAge < 6) {
      baseRate = 0.025; // Beginner: 2.5% per week
    } else if (factors.trainingAge < 24) {
      baseRate = 0.015; // Intermediate: 1.5% per week  
    } else {
      baseRate = 0.008; // Advanced: 0.8% per week
    }
    
    // Adjust for historical response
    const historicalRate = this.calculateHistoricalProgressionRate(history);
    const responseModifier = factors.responseRate || (historicalRate / baseRate);
    
    // Adjust for recovery rate
    const recoveryModifier = {
      'fast': 1.2,
      'average': 1.0,
      'slow': 0.8
    }[factors.recoveryRate] || 1.0;
    
    return baseRate * responseModifier * recoveryModifier;
  }

  private calculateVolumeRecommendation(
    history: ExerciseHistory,
    factors: AdvancedProgressionConfig['personalization']
  ): VolumeRecommendation {
    const currentVolume = this.getCurrentWeeklyVolume(history);
    const tolerance = factors.volumeTolerance || this.estimateVolumeTolerance(history);
    
    // Volume progression based on training age and current tolerance
    let recommendedSets = currentVolume;
    let progression: VolumeRecommendation['volumeProgression'] = 'maintain';
    
    if (currentVolume < tolerance * 0.8) {
      recommendedSets = Math.min(tolerance, currentVolume + 1);
      progression = 'increase';
    } else if (currentVolume > tolerance) {
      recommendedSets = Math.max(tolerance * 0.7, currentVolume - 1);
      progression = 'decrease';
    }
    
    return {
      recommendedSets: Math.round(recommendedSets),
      setRange: [Math.max(1, recommendedSets - 2), recommendedSets + 2],
      reasoning: this.generateVolumeReasoning(currentVolume, tolerance, progression),
      rpeAdjustment: 0,
      volumeProgression: progression
    };
  }

  private calculateOptimalDeloadFrequency(
    history: ExerciseHistory,
    factors: AdvancedProgressionConfig['personalization']
  ): number {
    // Base frequency on training age and recovery rate
    let baseFrequency = 4; // weeks
    
    if (factors.trainingAge > 24) {
      baseFrequency = 3; // Advanced athletes need more frequent deloads
    }
    
    const recoveryModifier = {
      'fast': 1.3,    // Can go longer between deloads
      'average': 1.0,
      'slow': 0.7     // Need more frequent deloads
    }[factors.recoveryRate] || 1.0;
    
    return Math.round(baseFrequency * recoveryModifier);
  }

  private generatePeriodizationAdvice(
    history: ExerciseHistory,
    factors: AdvancedProgressionConfig['personalization']
  ): string {
    if (factors.trainingAge < 6) {
      return "Linear progression recommended for consistent strength gains during beginner phase";
    } else if (factors.trainingAge < 24) {
      return "Daily undulating periodization recommended to break through intermediate plateaus";
    } else {
      return "Block periodization with competition peaking phases recommended for advanced training";
    }
  }

  private calculateHistoricalProgressionRate(history: ExerciseHistory): number {
    if (history.sessions.length < 4) return 0.015; // Default
    
    const weights = history.sessions.slice(0, 8).map(s => s.sets[0]?.weight || 0);
    const oldestWeight = weights[weights.length - 1];
    const newestWeight = weights[0];
    
    if (oldestWeight === 0) return 0.015;
    
    const totalChange = (newestWeight - oldestWeight) / oldestWeight;
    return totalChange / (weights.length - 1); // Weekly rate
  }

  private getCurrentWeeklyVolume(history: ExerciseHistory): number {
    // Estimate weekly volume from recent sessions
    const recentSessions = history.sessions.slice(0, 4); // Last month
    const totalSets = recentSessions.reduce((sum, session) => sum + session.sets.length, 0);
    return totalSets / 4; // Average sets per week
  }

  private estimateVolumeTolerance(history: ExerciseHistory): number {
    // Analyze historical volume to find maximum productive volume
    const sessionVolumes = history.sessions.map(session => session.sets.length);
    return Math.max(...sessionVolumes, 8); // Minimum 8 sets tolerance
  }
}
```

## Integration with Existing System

### Modified ProgressiveOverloadSuggestion Component

```typescript
// Enhanced component to use new algorithms
import { AdvancedProgressiveOverloadService } from '@/services/advanced-progressive-overload';

export function EnhancedProgressiveOverloadSuggestion({ 
  exerciseHistory, 
  userConfig 
}: {
  exerciseHistory: ExerciseHistory;
  userConfig: AdvancedProgressionConfig;
}) {
  const advancedService = new AdvancedProgressiveOverloadService(userConfig);
  const recommendation = advancedService.calculateAdvancedProgression(exerciseHistory);
  
  return (
    <div className="progressive-overload-suggestion">
      <div className="main-recommendation">
        <h3>Next Session Recommendation</h3>
        <div className="weight-suggestion">
          {recommendation.suggestion.suggestedWeight}kg
          <span className="confidence">{recommendation.suggestion.confidenceLevel}</span>
        </div>
        <p className="reasoning">{recommendation.suggestion.reasoning}</p>
      </div>
      
      {recommendation.volumeRecommendation && (
        <div className="volume-recommendation">
          <h4>Volume Guidance</h4>
          <p>Recommended sets: {recommendation.volumeRecommendation.recommendedSets}</p>
          <p>{recommendation.volumeRecommendation.reasoning}</p>
        </div>
      )}
      
      <div className="periodization-advice">
        <h4>Training Strategy</h4>
        <p>{recommendation.periodizationSuggestion}</p>
        <p>Deload every {recommendation.deloadFrequency} weeks</p>
      </div>
      
      <div className="confidence-indicators">
        <h4>Recommendation Confidence</h4>
        <div className="confidence-bars">
          <div>Data Quality: {(recommendation.confidenceFactors.dataQuality * 100).toFixed(0)}%</div>
          <div>Historical Accuracy: {(recommendation.confidenceFactors.historicalAccuracy * 100).toFixed(0)}%</div>
          <div>Response Consistency: {(recommendation.confidenceFactors.responseConsistency * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
}
```

## Implementation Timeline

### Phase 1 (Immediate - 2 weeks)
1. Implement plateau detection algorithms
2. Add RPE tracking to workout sessions
3. Enhance deload recommendation system
4. Update ProgressiveOverloadService with advanced features

### Phase 2 (1-2 months)
1. Implement Daily Undulating Periodization
2. Add personalization based on training age and response rates
3. Implement autoregulation features
4. Create comprehensive testing suite

### Phase 3 (2-4 months)
1. Implement block periodization
2. Add machine learning for individual response prediction
3. Integrate with external biometric data (sleep, HRV)
4. Create comprehensive user dashboard for periodization insights

This implementation provides a solid foundation for evidence-based progressive overload and periodization in FitForge, with clear upgrade paths for more advanced features as user data accumulates and research evolves.