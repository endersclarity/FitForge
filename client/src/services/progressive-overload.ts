/**
 * Progressive Overload Intelligence Service
 * Implements LiftLog's proven progression algorithms with enhancements
 */

import { 
  ExerciseHistory, 
  WorkoutSession, 
  ProgressionSuggestion, 
  ProgressionConfig,
  ExercisePerformanceMetrics,
  ProgressionRecommendation,
  ProgressionStrategy,
  WorkoutSet
} from '@/types/progression';

export class ProgressiveOverloadService {
  private config: ProgressionConfig;

  constructor(config?: Partial<ProgressionConfig>) {
    this.config = {
      compoundIncrement: 2.5,
      isolationIncrement: 1.25,
      bodyweightIncrement: 1, // reps
      progressionRPEThreshold: 7.5,
      deloadRPEThreshold: 9.5,
      minCompletionRate: 0.85,
      consecutiveSessionsRequired: 1,
      maxWeeklyIncrease: 10,
      minWeightIncrease: 0.5,
      ...config
    };
  }

  /**
   * Main method: Calculate progression recommendation for an exercise
   */
  calculateProgression(exerciseHistory: ExerciseHistory): ProgressionRecommendation {
    const lastSession = exerciseHistory.sessions[0];
    if (!lastSession) {
      return this.createInitialRecommendation(exerciseHistory);
    }

    const metrics = this.analyzePerformanceMetrics(exerciseHistory);
    const strategy = this.determineProgressionStrategy(exerciseHistory, metrics);
    const suggestion = this.generateProgressionSuggestion(exerciseHistory, strategy, metrics);

    return {
      strategy,
      suggestion,
      metrics,
      nextSessionPlan: this.createNextSessionPlan(suggestion, lastSession)
    };
  }

  /**
   * Generate weight progression suggestion based on LiftLog's algorithm
   */
  private generateProgressionSuggestion(
    exerciseHistory: ExerciseHistory,
    strategy: ProgressionStrategy,
    metrics: ExercisePerformanceMetrics
  ): ProgressionSuggestion {
    const lastSession = exerciseHistory.sessions[0];
    const lastWeight = lastSession.sets[0]?.weight || 0;
    
    // Base increment based on exercise type
    const baseIncrement = this.getBaseIncrement(exerciseHistory.exerciseType);
    
    let suggestedWeight = lastWeight;
    let reasoning = '';
    let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';

    switch (strategy) {
      case 'linear_progression':
        if (metrics.readyForProgression) {
          suggestedWeight = lastWeight + baseIncrement;
          reasoning = `All sets completed with good form (RPE ${metrics.averageRPE.toFixed(1)}). Ready for ${baseIncrement}kg increase.`;
          confidenceLevel = metrics.completionRate > 0.95 ? 'high' : 'medium';
        } else {
          suggestedWeight = lastWeight;
          reasoning = `Repeat current weight. Completion rate: ${(metrics.completionRate * 100).toFixed(0)}%`;
          confidenceLevel = 'high';
        }
        break;

      case 'double_progression':
        // Try adding reps first, then weight
        if (lastSession.sets.every(s => s.reps >= lastSession.targetReps + 2)) {
          suggestedWeight = lastWeight + baseIncrement;
          reasoning = `Extra reps achieved consistently. Increase weight by ${baseIncrement}kg.`;
          confidenceLevel = 'high';
        } else {
          suggestedWeight = lastWeight;
          reasoning = `Focus on adding reps before increasing weight.`;
          confidenceLevel = 'medium';
        }
        break;

      case 'deload_protocol':
        suggestedWeight = Math.round(lastWeight * 0.9 * 4) / 4; // 10% deload, rounded to 0.25kg
        reasoning = `High RPE (${metrics.averageRPE.toFixed(1)}) detected. Deload recommended for recovery.`;
        confidenceLevel = 'high';
        break;

      case 'auto_regulation':
        // RPE-based progression
        if (metrics.averageRPE < this.config.progressionRPEThreshold) {
          const rpeAdjustment = (this.config.progressionRPEThreshold - metrics.averageRPE) / 2;
          suggestedWeight = lastWeight + (baseIncrement * rpeAdjustment);
          reasoning = `Low RPE indicates capacity for larger increase.`;
          confidenceLevel = 'medium';
        } else {
          suggestedWeight = lastWeight + (baseIncrement * 0.5);
          reasoning = `Moderate RPE suggests conservative progression.`;
          confidenceLevel = 'medium';
        }
        break;

      default:
        suggestedWeight = lastWeight;
        reasoning = 'Maintain current weight until more data available.';
        confidenceLevel = 'low';
    }

    // Handle zero weight edge case
    if (lastWeight === 0 && suggestedWeight === 0) {
      suggestedWeight = this.getBaseIncrement(exerciseHistory.exerciseType);
      reasoning = 'Starting weight set to base increment for exercise type.';
      confidenceLevel = 'medium';
    }

    // Safety checks
    const weeklyIncrease = this.calculateWeeklyIncrease(exerciseHistory);
    if (weeklyIncrease > this.config.maxWeeklyIncrease) {
      suggestedWeight = lastWeight;
      reasoning = 'Weekly increase limit reached. Maintain current weight.';
      confidenceLevel = 'high';
    }

    // Minimum increase threshold
    const increaseAmount = suggestedWeight - lastWeight;
    if (increaseAmount > 0 && increaseAmount < this.config.minWeightIncrease) {
      suggestedWeight = lastWeight + this.config.minWeightIncrease;
    }

    return {
      suggestedWeight: Math.round(suggestedWeight * 4) / 4, // Round to nearest 0.25kg
      confidenceLevel,
      reasoning,
      increaseAmount: suggestedWeight - lastWeight,
      alternativeWeights: this.generateAlternativeWeights(suggestedWeight, baseIncrement, lastWeight),
      lastSessionSummary: {
        weight: lastWeight,
        totalReps: lastSession.sets.reduce((sum, set) => sum + set.reps, 0),
        averageRPE: metrics.averageRPE,
        allSetsCompleted: lastSession.sets.every(set => set.completed)
      }
    };
  }

  /**
   * Analyze exercise performance metrics
   */
  private analyzePerformanceMetrics(exerciseHistory: ExerciseHistory): ExercisePerformanceMetrics {
    const recentSessions = exerciseHistory.sessions.slice(0, 5);
    const lastSession = recentSessions[0];

    // Calculate completion rate
    const targetReps = lastSession.targetReps * lastSession.targetSets;
    const actualReps = lastSession.sets.reduce((sum, set) => sum + set.reps, 0);
    const completionRate = actualReps / targetReps;

    // Calculate average RPE
    const rpeValues = lastSession.sets
      .map(set => set.rpe)
      .filter((rpe): rpe is number => rpe !== undefined);
    const averageRPE = rpeValues.length > 0 
      ? rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length 
      : 7; // Default assumption

    // Determine if ready for progression
    const readyForProgression = 
      completionRate >= this.config.minCompletionRate &&
      averageRPE < this.config.progressionRPEThreshold &&
      lastSession.sets.every(set => set.completed) &&
      lastSession.sets.every(set => set.reps >= lastSession.targetReps); // All target reps achieved

    // Calculate trends
    const weights = recentSessions.map(s => s.sets[0]?.weight || 0);
    const weightTrend = this.calculateTrend(weights);
    
    const volumes = recentSessions.map(s => 
      s.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0)
    );
    const volumeTrend = this.calculateTrend(volumes);

    return {
      weightTrend,
      volumeTrend,
      consistencyScore: this.calculateConsistencyScore(recentSessions),
      readyForProgression,
      weeksSinceLastProgression: this.calculateWeeksSinceProgression(exerciseHistory),
      totalVolumeProgress: this.calculateVolumeProgress(exerciseHistory),
      averageRPE,
      completionRate,
      strengthEndurance: this.calculateStrengthEndurance(lastSession)
    };
  }

  /**
   * Determine the best progression strategy
   */
  private determineProgressionStrategy(
    exerciseHistory: ExerciseHistory,
    metrics: ExercisePerformanceMetrics
  ): ProgressionStrategy {
    // Deload if RPE is too high
    if (metrics.averageRPE > this.config.deloadRPEThreshold) {
      return 'deload_protocol';
    }

    // Double progression for isolation exercises
    if (exerciseHistory.exerciseType === 'isolation') {
      return 'double_progression';
    }

    // Auto-regulation for experienced users with RPE data (only if we have multiple sessions)
    const hasReliableRPE = exerciseHistory.sessions.length >= 3 &&
      exerciseHistory.sessions
        .slice(0, 3)
        .every(session => session.sets.some(set => set.rpe !== undefined));
    
    if (hasReliableRPE && exerciseHistory.exerciseType === 'compound') {
      return 'auto_regulation';
    }

    // Default to linear progression
    return 'linear_progression';
  }

  /**
   * Helper methods
   */
  private getBaseIncrement(exerciseType: 'compound' | 'isolation'): number {
    return exerciseType === 'compound' 
      ? this.config.compoundIncrement 
      : this.config.isolationIncrement;
  }

  private calculateTrend(values: number[]): 'increasing' | 'stable' | 'decreasing' {
    if (values.length < 2) return 'stable';
    
    // Calculate slope: positive slope means increasing over time (newest to oldest)
    const slope = (values[0] - values[values.length - 1]) / (values.length - 1);
    const threshold = Math.max(values[0] * 0.02, 1); // 2% threshold with minimum 1kg
    
    if (slope > threshold) return 'increasing';
    if (slope < -threshold) return 'decreasing';
    return 'stable';
  }

  private calculateConsistencyScore(sessions: WorkoutSession[]): number {
    if (sessions.length < 2) return 1;
    
    const weights = sessions.map(s => s.sets[0]?.weight || 0);
    const mean = weights.reduce((sum, w) => sum + w, 0) / weights.length;
    const variance = weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length;
    const cv = Math.sqrt(variance) / mean; // Coefficient of variation
    
    return Math.max(0, 1 - cv); // Higher score = more consistent
  }

  private calculateWeeksSinceProgression(exerciseHistory: ExerciseHistory): number {
    const sessions = exerciseHistory.sessions;
    let weeks = 0;
    
    for (let i = 1; i < sessions.length; i++) {
      const currentWeight = sessions[i - 1].sets[0]?.weight || 0;
      const previousWeight = sessions[i].sets[0]?.weight || 0;
      
      if (currentWeight > previousWeight) {
        break;
      }
      
      weeks++;
    }
    
    return weeks;
  }

  private calculateVolumeProgress(exerciseHistory: ExerciseHistory): number {
    const sessions = exerciseHistory.sessions;
    if (sessions.length < 2) return 0;
    
    const recentVolume = this.calculateSessionVolume(sessions[0]);
    const baselineVolume = this.calculateSessionVolume(sessions[sessions.length - 1]);
    
    return baselineVolume > 0 ? ((recentVolume - baselineVolume) / baselineVolume) * 100 : 0;
  }

  private calculateSessionVolume(session: WorkoutSession): number {
    return session.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
  }

  private calculateStrengthEndurance(session: WorkoutSession): number {
    const reps = session.sets.map(set => set.reps);
    if (reps.length < 2) return 1;
    
    // Calculate how well reps are maintained across sets
    const firstSetReps = reps[0];
    const averageDropoff = reps.slice(1)
      .reduce((sum, rep) => sum + Math.max(0, firstSetReps - rep), 0) / (reps.length - 1);
    
    return Math.max(0, 1 - (averageDropoff / firstSetReps));
  }

  private calculateWeeklyIncrease(exerciseHistory: ExerciseHistory): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentSessions = exerciseHistory.sessions.filter(
      session => session.date >= oneWeekAgo
    );
    
    if (recentSessions.length < 2) return 0;
    
    const weights = recentSessions.map(s => s.sets[0]?.weight || 0);
    return Math.max(...weights) - Math.min(...weights);
  }

  private generateAlternativeWeights(suggestedWeight: number, baseIncrement: number, currentWeight?: number): number[] {
    const alternatives = [
      suggestedWeight - baseIncrement,
      suggestedWeight - (baseIncrement * 0.5),
      suggestedWeight + (baseIncrement * 0.5),
      suggestedWeight + baseIncrement
    ];
    
    // Always include current weight if provided and not already in alternatives
    if (currentWeight !== undefined) {
      const rounded = Math.round(currentWeight * 4) / 4;
      if (!alternatives.some(w => Math.abs(w - rounded) < 0.01)) {
        alternatives.push(rounded);
      }
    }
    
    return alternatives
      .map(w => Math.round(w * 4) / 4) // Round to nearest 0.25kg
      .sort((a, b) => a - b); // Sort ascending
  }

  private createInitialRecommendation(exerciseHistory: ExerciseHistory): ProgressionRecommendation {
    const initialWeight = exerciseHistory.exerciseType === 'compound' ? 20 : 10; // kg
    
    return {
      strategy: 'linear_progression',
      suggestion: {
        suggestedWeight: initialWeight,
        confidenceLevel: 'medium',
        reasoning: 'No previous data. Starting with conservative weight.',
        increaseAmount: 0,
        alternativeWeights: [initialWeight - 5, initialWeight, initialWeight + 5, initialWeight + 10],
        lastSessionSummary: {
          weight: 0,
          totalReps: 0,
          averageRPE: 0,
          allSetsCompleted: false
        }
      },
      metrics: {
        weightTrend: 'stable',
        volumeTrend: 'stable',
        consistencyScore: 1,
        readyForProgression: false,
        weeksSinceLastProgression: 0,
        totalVolumeProgress: 0,
        averageRPE: 0,
        completionRate: 0,
        strengthEndurance: 1
      },
      nextSessionPlan: {
        targetWeight: initialWeight,
        targetReps: 8,
        targetSets: 3,
        expectedRPE: 6,
        restTime: 180
      }
    };
  }

  private createNextSessionPlan(suggestion: ProgressionSuggestion, lastSession: WorkoutSession) {
    return {
      targetWeight: suggestion.suggestedWeight,
      targetReps: lastSession.targetReps,
      targetSets: lastSession.targetSets,
      expectedRPE: suggestion.confidenceLevel === 'high' ? 7 : 6,
      restTime: suggestion.suggestedWeight > suggestion.lastSessionSummary.weight ? 240 : 180 // More rest if weight increased
    };
  }
}

// Export singleton instance with default config
export const progressiveOverloadService = new ProgressiveOverloadService();

// Export factory function for custom configs
export const createProgressiveOverloadService = (config?: Partial<ProgressionConfig>) => {
  return new ProgressiveOverloadService(config);
};