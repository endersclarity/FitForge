/**
 * AI-Driven Workout Recommendation System
 * 
 * Features:
 * - Plateau detection integration with enhanced progressive overload V2
 * - Exercise variation suggestions based on biomechanics and preferences
 * - Goal-based workout optimization with periodization
 * - Real-time adaptation based on performance metrics
 * - Research-backed recommendation algorithms
 * 
 * Integration: Enhanced Progressive Overload V2 Service
 * Boundary: client/src/services/workout-recommendations.ts
 */

import { 
  EnhancedProgressiveOverloadServiceV2,
  enhancedProgressiveOverloadServiceV2,
  UserAdaptationProfile,
  EnhancedProgressionRecommendationV2,
  AIProgressionInsights,
  AdaptivePeriodization,
  PersonalizedDeloadProtocol
} from './enhanced-progressive-overload-v2';
import { 
  ExerciseHistory, 
  WorkoutSession, 
  WorkoutSet,
  ProgressionStrategy,
  ExercisePerformanceMetrics
} from '@/types/progression';

// Core recommendation system interfaces
export interface UserGoals {
  primary: 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'body_recomposition' | 'general_fitness';
  secondary?: Array<'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'body_recomposition' | 'general_fitness'>;
  targetTimeframe: number; // weeks
  specificTargets?: {
    weight?: number; // kg
    bodyFatPercentage?: number;
    liftingGoals?: Array<{
      exerciseName: string;
      targetWeight: number;
      targetReps: number;
    }>;
  };
  preferences: {
    workoutDuration: number; // minutes
    exercisePreferences: string[]; // preferred exercises
    equipmentAvailable: string[]; // available equipment
    injuryHistory?: string[];
    dislikedExercises?: string[];
  };
}

export interface ExerciseVariation {
  originalExercise: string;
  variation: string;
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  biomechanicalBenefit: string;
  progressionReason: string;
  swapConfidence: number; // 0-100
}

export interface WorkoutRecommendation {
  workoutId: string;
  recommendationType: 'progression' | 'plateau_break' | 'deload' | 'variation' | 'goal_optimization';
  confidenceScore: number; // 0-100
  
  // Workout structure
  exercises: RecommendedExercise[];
  totalDuration: number; // minutes
  volumeLoad: number; // total kg*reps
  intensityProfile: 'low' | 'moderate' | 'high' | 'mixed';
  
  // AI insights
  reasoning: string[];
  expectedOutcomes: string[];
  riskAssessment: {
    overtrainingRisk: 'low' | 'medium' | 'high';
    injuryRisk: 'low' | 'medium' | 'high';
    plateauRisk: 'low' | 'medium' | 'high';
  };
  
  // Adaptation tracking
  adaptationTargets: {
    strength: number; // expected % improvement
    hypertrophy: number; // expected % improvement
    endurance: number; // expected % improvement
  };
  
  // Integration with progressive overload
  progressionInsights: AIProgressionInsights;
  plateauInterventions: PlateauIntervention[];
}

export interface RecommendedExercise {
  exerciseName: string;
  exerciseType: 'compound' | 'isolation';
  muscleGroups: string[];
  
  // Performance parameters
  sets: number;
  reps: number | [number, number]; // range for autoregulation
  weight: number;
  restTime: number; // seconds
  rpe: number | [number, number]; // target RPE or range
  
  // Progression context
  progressionReason: string;
  previousPerformance?: {
    lastWeight: number;
    lastReps: number;
    lastRPE: number;
  };
  
  // Variations and alternatives
  variations: ExerciseVariation[];
  substitutions?: string[];
  
  // Form and technique focus
  techniqueFocus?: string[];
  warmupRecommendations?: string[];
}

export interface PlateauIntervention {
  exerciseName: string;
  plateauType: 'strength' | 'volume' | 'technique' | 'motivation';
  intervention: 'deload' | 'variation' | 'technique_focus' | 'periodization_change';
  duration: number; // weeks
  specificActions: string[];
  expectedOutcome: string;
  successMetrics: string[];
}

export interface RecommendationConfig {
  // AI recommendation parameters
  plateauDetectionSensitivity: 'conservative' | 'moderate' | 'aggressive';
  variationFrequency: 'low' | 'moderate' | 'high'; // how often to suggest variations
  riskTolerance: 'conservative' | 'balanced' | 'aggressive';
  
  // Goal optimization
  goalPrioritization: {
    strength: number; // 0-100 weight
    hypertrophy: number; // 0-100 weight
    endurance: number; // 0-100 weight
  };
  
  // Adaptation preferences
  adaptationSpeed: 'slow' | 'moderate' | 'fast';
  recoveryEmphasis: 'low' | 'moderate' | 'high';
  
  // Exercise selection
  exercisePool: 'basic' | 'intermediate' | 'advanced' | 'unlimited';
  equipmentConstraints: string[];
  timeConstraints: {
    maxWorkoutDuration: number; // minutes
    sessionsPerWeek: number;
  };
}

export interface RecommendationHistory {
  recommendations: Array<{
    date: Date;
    recommendation: WorkoutRecommendation;
    userFeedback?: {
      difficulty: number; // 1-10
      enjoyment: number; // 1-10
      effectiveness: number; // 1-10
      completionRate: number; // 0-1
      notes?: string;
    };
    actualPerformance?: WorkoutSession[];
  }>;
  adaptationTrends: {
    strengthGains: number[];
    volumeProgression: number[];
    userSatisfaction: number[];
  };
}

export class WorkoutRecommendationEngine {
  private progressiveOverloadService: EnhancedProgressiveOverloadServiceV2;
  private config: RecommendationConfig;
  private exerciseDatabase: ExerciseDatabase;

  constructor(
    userProfile?: Partial<UserAdaptationProfile>,
    config?: Partial<RecommendationConfig>
  ) {
    this.progressiveOverloadService = userProfile 
      ? new EnhancedProgressiveOverloadServiceV2(userProfile)
      : enhancedProgressiveOverloadServiceV2;
    
    this.config = {
      plateauDetectionSensitivity: 'moderate',
      variationFrequency: 'moderate',
      riskTolerance: 'balanced',
      goalPrioritization: { strength: 40, hypertrophy: 40, endurance: 20 },
      adaptationSpeed: 'moderate',
      recoveryEmphasis: 'moderate',
      exercisePool: 'intermediate',
      equipmentConstraints: [],
      timeConstraints: { maxWorkoutDuration: 90, sessionsPerWeek: 4 },
      ...config
    };
    
    this.exerciseDatabase = new ExerciseDatabase();
  }

  /**
   * Main recommendation generation method
   */
  async generateWorkoutRecommendation(
    exerciseHistories: ExerciseHistory[],
    userGoals: UserGoals,
    recommendationHistory?: RecommendationHistory
  ): Promise<WorkoutRecommendation> {
    // Handle empty exercise history case
    if (exerciseHistories.length === 0) {
      return this.generateBaselineRecommendation(userGoals);
    }

    // 1. Analyze current performance state
    const performanceAnalysis = await this.analyzePerformanceState(exerciseHistories);
    
    // 2. Detect plateaus and progression needs
    const plateauAnalysis = await this.detectPlateausAndNeeds(exerciseHistories);
    
    // 3. Generate goal-optimized exercise selection
    const exerciseSelection = await this.optimizeExerciseSelection(
      exerciseHistories, 
      userGoals, 
      performanceAnalysis
    );
    
    // 4. Apply progressive overload integration
    const progressionPlan = await this.integrateProgressiveOverload(
      exerciseSelection,
      exerciseHistories
    );
    
    // 5. Generate plateau interventions
    const plateauInterventions = await this.generatePlateauInterventions(plateauAnalysis);
    
    // 6. Optimize workout structure
    const workoutStructure = await this.optimizeWorkoutStructure(
      progressionPlan,
      userGoals,
      plateauInterventions
    );
    
    // 7. Apply time constraints
    workoutStructure.exercises = this.adjustDurationForConstraints(
      workoutStructure.exercises,
      userGoals
    );
    
    // Recalculate duration and volume after constraint adjustments
    workoutStructure.totalDuration = this.calculateWorkoutDuration(workoutStructure.exercises);
    workoutStructure.volumeLoad = this.calculateOptimalVolume(workoutStructure.exercises, userGoals).totalVolume;
    
    // 8. Calculate confidence and risk assessment
    const confidenceScore = this.calculateRecommendationConfidence(
      performanceAnalysis,
      plateauAnalysis,
      exerciseHistories.length
    );
    
    const riskAssessment = this.assessRecommendationRisks(
      workoutStructure,
      performanceAnalysis
    );

    return {
      workoutId: this.generateWorkoutId(),
      recommendationType: this.determineRecommendationType(plateauAnalysis, performanceAnalysis),
      confidenceScore,
      exercises: workoutStructure.exercises,
      totalDuration: workoutStructure.totalDuration,
      volumeLoad: workoutStructure.volumeLoad,
      intensityProfile: workoutStructure.intensityProfile,
      reasoning: workoutStructure.reasoning,
      expectedOutcomes: workoutStructure.expectedOutcomes,
      riskAssessment,
      adaptationTargets: this.calculateAdaptationTargets(userGoals, workoutStructure),
      progressionInsights: workoutStructure.progressionInsights,
      plateauInterventions
    };
  }

  /**
   * Generate baseline recommendation for users with no exercise history
   */
  private generateBaselineRecommendation(userGoals: UserGoals): WorkoutRecommendation {
    const exercises = this.handleEmptyExerciseHistory(userGoals);
    const totalDuration = this.calculateWorkoutDuration(exercises);
    const volumeLoad = this.calculateOptimalVolume(exercises, userGoals).totalVolume;
    
    return {
      workoutId: this.generateWorkoutId(),
      recommendationType: 'goal_optimization',
      confidenceScore: 60, // Moderate confidence for new users
      exercises,
      totalDuration,
      volumeLoad,
      intensityProfile: 'moderate',
      reasoning: [
        `Beginner-friendly workout optimized for ${userGoals.primary} goal`,
        'Progressive foundation with compound movements',
        'Conservative starting weights to establish proper form'
      ],
      expectedOutcomes: [
        'Establish movement patterns and training routine',
        'Build foundational strength and conditioning',
        'Prepare for progressive overload implementation'
      ],
      riskAssessment: {
        overtrainingRisk: 'low',
        injuryRisk: 'low',
        plateauRisk: 'low'
      },
      adaptationTargets: {
        strength: userGoals.primary === 'strength' ? 20 : 10,
        hypertrophy: userGoals.primary === 'hypertrophy' ? 15 : 8,
        endurance: userGoals.primary === 'endurance' ? 25 : 10
      },
      progressionInsights: {
        primaryRecommendation: 'Focus on learning proper form and establishing consistent training habits',
        confidenceScore: 60,
        reasoningChain: ['New user baseline recommendation', 'Goal-optimized exercise selection'],
        alternativeStrategies: [],
        researchBasis: 'Evidence-based beginner programming principles',
        riskAssessment: {
          overtrainingRisk: 'low',
          injuryRisk: 'low',
          plateauRisk: 'low'
        }
      },
      plateauInterventions: []
    };
  }

  /**
   * Analyze current performance state across all exercises
   */
  private async analyzePerformanceState(exerciseHistories: ExerciseHistory[]) {
    const analyses = await Promise.all(
      exerciseHistories.map(async (history) => {
        const progression = this.progressiveOverloadService.calculateAIEnhancedProgression(history);
        return {
          exerciseName: history.exerciseName,
          exerciseType: history.exerciseType,
          progression,
          performanceScore: this.calculatePerformanceScore(progression),
          readinessLevel: this.assessReadiness(progression)
        };
      })
    );

    return {
      analyses,
      overallPerformanceScore: this.calculateOverallPerformanceScore(analyses),
      readyForProgression: analyses.filter(a => a.readinessLevel === 'ready').length,
      needingAttention: analyses.filter(a => a.readinessLevel === 'attention').length,
      plateauedExercises: analyses.filter(a => a.progression.plateauAnalysis.plateauConfidence > 60).length
    };
  }

  /**
   * Detect plateaus and specific progression needs
   */
  private async detectPlateausAndNeeds(exerciseHistories: ExerciseHistory[]) {
    const plateauDetections = exerciseHistories.map(history => {
      const analysis = this.progressiveOverloadService.calculateAIEnhancedProgression(history);
      const volumePlateau = this.progressiveOverloadService.detectVolumePlateau(history);
      
      return {
        exerciseName: history.exerciseName,
        plateauConfidence: analysis.plateauAnalysis.plateauConfidence,
        plateauType: this.determinePlateauType(analysis.plateauAnalysis),
        volumePlateau: volumePlateau.isPlateaued,
        interventionNeeded: analysis.plateauAnalysis.plateauConfidence > 50,
        recommendedAction: analysis.plateauAnalysis.recommendedAction,
        timeToIntervention: this.calculateTimeToIntervention(analysis.plateauAnalysis)
      };
    });

    return {
      detections: plateauDetections,
      totalPlateaus: plateauDetections.filter(p => p.interventionNeeded).length,
      urgentInterventions: plateauDetections.filter(p => p.plateauConfidence > 70).length,
      overallPlateauRisk: this.calculateOverallPlateauRisk(plateauDetections)
    };
  }

  /**
   * Optimize exercise selection based on goals and performance
   */
  private async optimizeExerciseSelection(
    exerciseHistories: ExerciseHistory[],
    userGoals: UserGoals,
    performanceAnalysis: any
  ) {
    const currentExercises = exerciseHistories.map(h => h.exerciseName);
    const goalOptimizedExercises = this.getGoalOptimizedExercises(userGoals);
    const variationSuggestions = this.generateExerciseVariations(
      currentExercises, 
      performanceAnalysis,
      userGoals
    );

    return {
      coreExercises: this.selectCoreExercises(currentExercises, goalOptimizedExercises),
      variations: variationSuggestions,
      newExercises: this.suggestNewExercises(userGoals, currentExercises),
      retiredExercises: this.identifyExercisesToRetire(performanceAnalysis),
      selectionReasoning: this.generateSelectionReasoning(userGoals, performanceAnalysis)
    };
  }

  /**
   * Integrate progressive overload recommendations
   */
  private async integrateProgressiveOverload(
    exerciseSelection: any,
    exerciseHistories: ExerciseHistory[]
  ) {
    const progressionPlans = await Promise.all(
      exerciseSelection.coreExercises.map(async (exerciseName: string) => {
        const history = exerciseHistories.find(h => h.exerciseName === exerciseName);
        if (!history) return null;

        const progression = this.progressiveOverloadService.calculateAIEnhancedProgression(history);
        const smartProgression = this.progressiveOverloadService.calculateSmartProgression(
          history,
          this.getUserRecoveryScore(history),
          this.getUserConsistencyScore(history),
          this.determineStrengthLevel(history)
        );

        return {
          exerciseName,
          progression,
          smartProgression,
          autoregulation: progression.autoregulation,
          periodization: progression.adaptivePeriodization
        };
      })
    );

    return progressionPlans.filter(plan => plan !== null);
  }

  /**
   * Generate specific plateau interventions
   */
  private async generatePlateauInterventions(plateauAnalysis: any): Promise<PlateauIntervention[]> {
    return plateauAnalysis.detections
      .filter((detection: any) => detection.interventionNeeded)
      .map((detection: any) => {
        const intervention = this.selectOptimalIntervention(detection);
        return {
          exerciseName: detection.exerciseName,
          plateauType: detection.plateauType,
          intervention: intervention.type,
          duration: intervention.duration,
          specificActions: intervention.actions,
          expectedOutcome: intervention.expectedOutcome,
          successMetrics: intervention.successMetrics
        };
      });
  }

  /**
   * Optimize overall workout structure
   */
  private async optimizeWorkoutStructure(
    progressionPlan: any[],
    userGoals: UserGoals,
    plateauInterventions: PlateauIntervention[]
  ) {
    const exercises = this.constructRecommendedExercises(progressionPlan, plateauInterventions, userGoals);
    const structure = this.optimizeExerciseOrder(exercises, userGoals);
    const volumeCalculation = this.calculateOptimalVolume(structure, userGoals);
    
    return {
      exercises: structure,
      totalDuration: this.calculateWorkoutDuration(structure),
      volumeLoad: volumeCalculation.totalVolume,
      intensityProfile: this.determineIntensityProfile(structure),
      reasoning: this.generateStructureReasoning(structure, userGoals, plateauInterventions),
      expectedOutcomes: this.predictWorkoutOutcomes(structure, userGoals),
      progressionInsights: this.synthesizeProgressionInsights(progressionPlan)
    };
  }

  /**
   * Exercise variation generation with biomechanical analysis
   */
  generateExerciseVariations(
    currentExercises: string[],
    performanceAnalysis: any,
    userGoals: UserGoals
  ): ExerciseVariation[] {
    const variations: ExerciseVariation[] = [];

    currentExercises.forEach(exercise => {
      const exerciseData = this.exerciseDatabase.getExercise(exercise);
      if (!exerciseData) return;

      const plateauedExercise = performanceAnalysis.analyses.find(
        (a: any) => a.exerciseName === exercise && a.progression.plateauAnalysis.plateauConfidence > 50
      );

      if (plateauedExercise || this.config.variationFrequency === 'high') {
        const exerciseVariations = this.exerciseDatabase.getVariations(exercise);
        
        exerciseVariations.forEach(variation => {
          const biomechanicalBenefit = this.analyzeBiomechanicalBenefit(exercise, variation, plateauedExercise);
          const swapConfidence = this.calculateSwapConfidence(exercise, variation, userGoals);

          if (swapConfidence > 60) {
            variations.push({
              originalExercise: exercise,
              variation: variation.name,
              muscleGroups: variation.muscleGroups,
              difficulty: variation.difficulty,
              equipment: variation.equipment,
              biomechanicalBenefit,
              progressionReason: this.generateProgressionReason(exercise, variation, plateauedExercise),
              swapConfidence
            });
          }
        });
      }
    });

    return variations.sort((a, b) => b.swapConfidence - a.swapConfidence).slice(0, 5);
  }

  /**
   * Calculate recommendation confidence score
   */
  private calculateRecommendationConfidence(
    performanceAnalysis: any,
    plateauAnalysis: any,
    historyLength: number
  ): number {
    let confidence = 50; // Base confidence

    // Data quality bonus
    if (historyLength >= 12) confidence += 20;
    else if (historyLength >= 6) confidence += 10;
    else confidence -= 10;

    // Performance analysis confidence
    const avgPerformanceScore = performanceAnalysis.overallPerformanceScore;
    if (avgPerformanceScore > 80) confidence += 15;
    else if (avgPerformanceScore > 60) confidence += 10;
    else if (avgPerformanceScore < 40) confidence -= 10;

    // Plateau clarity bonus
    if (plateauAnalysis.urgentInterventions > 0) confidence += 10;
    if (plateauAnalysis.overallPlateauRisk === 'low') confidence += 5;

    // Config-based adjustments
    if (this.config.riskTolerance === 'conservative') confidence += 5;
    if (this.config.plateauDetectionSensitivity === 'aggressive') confidence += 10;

    return Math.min(Math.max(confidence, 0), 100);
  }

  /**
   * Assess risks of the recommendation
   */
  private assessRecommendationRisks(workoutStructure: any, performanceAnalysis: any) {
    const volumeLoad = workoutStructure.volumeLoad;
    const intensityProfile = workoutStructure.intensityProfile;
    const avgPerformanceScore = performanceAnalysis.overallPerformanceScore;

    let overtrainingRisk: 'low' | 'medium' | 'high' = 'low';
    let injuryRisk: 'low' | 'medium' | 'high' = 'low';
    let plateauRisk: 'low' | 'medium' | 'high' = 'low';

    // Overtraining risk assessment
    if (volumeLoad > 50000 && intensityProfile === 'high') overtrainingRisk = 'high';
    else if (volumeLoad > 30000 || intensityProfile === 'high') overtrainingRisk = 'medium';

    // Injury risk assessment
    if (avgPerformanceScore < 40 && intensityProfile === 'high') injuryRisk = 'high';
    else if (avgPerformanceScore < 60) injuryRisk = 'medium';

    // Plateau risk assessment
    if (performanceAnalysis.plateauedExercises > performanceAnalysis.analyses.length * 0.5) {
      plateauRisk = 'high';
    } else if (performanceAnalysis.plateauedExercises > 0) {
      plateauRisk = 'medium';
    }

    return { overtrainingRisk, injuryRisk, plateauRisk };
  }

  // Helper methods for recommendation generation
  private calculatePerformanceScore(progression: EnhancedProgressionRecommendationV2): number {
    const confidenceScore = progression.aiInsights.confidenceScore;
    const plateauRisk = 100 - progression.plateauAnalysis.plateauConfidence;
    const readiness = progression.metrics.readyForProgression ? 20 : 0;
    
    return (confidenceScore * 0.4) + (plateauRisk * 0.4) + readiness;
  }

  private assessReadiness(progression: EnhancedProgressionRecommendationV2): 'ready' | 'caution' | 'attention' {
    if (progression.metrics.readyForProgression && progression.plateauAnalysis.plateauConfidence < 30) {
      return 'ready';
    } else if (progression.plateauAnalysis.plateauConfidence > 60) {
      return 'attention';
    }
    return 'caution';
  }

  private calculateOverallPerformanceScore(analyses: any[]): number {
    if (analyses.length === 0) return 0;
    return analyses.reduce((sum, a) => sum + a.performanceScore, 0) / analyses.length;
  }

  private determinePlateauType(plateauAnalysis: any): 'strength' | 'volume' | 'technique' | 'motivation' {
    if (plateauAnalysis.activeIndicators.formDegradation) return 'technique';
    if (plateauAnalysis.activeIndicators.weightStagnation) return 'strength';
    if (plateauAnalysis.activeIndicators.completionDrop) return 'volume';
    return 'motivation';
  }

  private calculateTimeToIntervention(plateauAnalysis: any): number {
    const confidence = plateauAnalysis.plateauConfidence;
    if (confidence > 80) return 1; // Immediate intervention
    if (confidence > 60) return 2; // Within 2 weeks
    if (confidence > 40) return 4; // Within 4 weeks
    return 6; // Monitor for 6 weeks
  }

  private calculateOverallPlateauRisk(detections: any[]): 'low' | 'medium' | 'high' {
    const avgConfidence = detections.reduce((sum, d) => sum + d.plateauConfidence, 0) / detections.length;
    if (avgConfidence > 60) return 'high';
    if (avgConfidence > 30) return 'medium';
    return 'low';
  }

  private getGoalOptimizedExercises(userGoals: UserGoals): string[] {
    // This would be implemented with a comprehensive exercise database
    // For now, return goal-specific exercise recommendations
    const exerciseMap = {
      strength: ['Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Row'],
      hypertrophy: ['Squat', 'Romanian Deadlift', 'Bench Press', 'Pull-ups', 'Dips', 'Lateral Raises'],
      endurance: ['Squat', 'Push-ups', 'Pull-ups', 'Lunges', 'Mountain Climbers'],
      weight_loss: ['Squat', 'Deadlift', 'Burpees', 'Mountain Climbers', 'Jump Squats'],
      body_recomposition: ['Squat', 'Deadlift', 'Bench Press', 'Pull-ups', 'Plank'],
      general_fitness: ['Squat', 'Push-ups', 'Pull-ups', 'Lunges', 'Plank']
    };

    return exerciseMap[userGoals.primary] || exerciseMap.general_fitness;
  }

  private selectCoreExercises(currentExercises: string[], goalOptimized: string[]): string[] {
    // Keep exercises that align with goals, add missing core exercises
    const coreExercises = new Set(currentExercises.filter(ex => goalOptimized.includes(ex)));
    
    // Add essential exercises if missing
    goalOptimized.slice(0, 5).forEach(ex => coreExercises.add(ex));
    
    return Array.from(coreExercises);
  }

  private suggestNewExercises(userGoals: UserGoals, currentExercises: string[]): string[] {
    const goalExercises = this.getGoalOptimizedExercises(userGoals);
    return goalExercises.filter(ex => !currentExercises.includes(ex)).slice(0, 2);
  }

  private identifyExercisesToRetire(performanceAnalysis: any): string[] {
    return performanceAnalysis.analyses
      .filter((a: any) => a.performanceScore < 30 && a.readinessLevel === 'attention')
      .map((a: any) => a.exerciseName)
      .slice(0, 2); // Limit to 2 retirements per recommendation
  }

  private generateSelectionReasoning(userGoals: UserGoals, performanceAnalysis: any): string[] {
    const reasoning = [];
    reasoning.push(`Exercise selection optimized for ${userGoals.primary} goal`);
    
    if (performanceAnalysis.plateauedExercises > 0) {
      reasoning.push(`${performanceAnalysis.plateauedExercises} exercises showing plateau indicators`);
    }
    
    if (performanceAnalysis.needingAttention > 0) {
      reasoning.push(`${performanceAnalysis.needingAttention} exercises requiring technique attention`);
    }
    
    return reasoning;
  }

  private getUserRecoveryScore(history: ExerciseHistory): number {
    // Calculate recovery score based on session frequency and RPE trends
    const sessions = history.sessions.slice(0, 6);
    if (sessions.length < 2) return 0.8; // Default moderate recovery
    
    const avgRPE = sessions
      .map(s => s.averageRPE || 7.5)
      .reduce((sum, rpe) => sum + rpe, 0) / sessions.length;
    
    // Lower RPE indicates better recovery
    return Math.max(0.3, Math.min(1.0, (10 - avgRPE) / 3));
  }

  private getUserConsistencyScore(history: ExerciseHistory): number {
    // Calculate consistency based on completion rates and frequency
    const sessions = history.sessions.slice(0, 8);
    if (sessions.length < 3) return 0.7; // Default moderate consistency
    
    const completionRates = sessions.map(session => {
      const targetReps = session.targetReps * session.targetSets;
      const actualReps = session.sets.reduce((sum, set) => sum + set.reps, 0);
      return actualReps / targetReps;
    });
    
    const avgCompletion = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
    return Math.max(0.3, Math.min(1.0, avgCompletion));
  }

  private determineStrengthLevel(history: ExerciseHistory): 'novice' | 'intermediate' | 'advanced' {
    const sessions = history.sessions;
    if (sessions.length < 12) return 'novice';
    
    const weights = sessions.slice(0, 12).map(s => s.sets[0]?.weight || 0);
    const progressionRate = this.calculateProgressionRate(weights);
    
    if (progressionRate > 5) return 'novice'; // Fast progression = novice
    if (progressionRate > 2) return 'intermediate'; // Moderate progression = intermediate
    return 'advanced'; // Slow progression = advanced
  }

  private calculateProgressionRate(weights: number[]): number {
    if (weights.length < 4) return 0;
    
    const recent = weights.slice(0, 4);
    const earlier = weights.slice(4, 8);
    
    if (earlier.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, w) => sum + w, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, w) => sum + w, 0) / earlier.length;
    
    return earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;
  }

  private selectOptimalIntervention(detection: any) {
    const interventionMap = {
      strength: {
        type: 'deload' as const,
        duration: 2,
        actions: ['Reduce weight by 10-15%', 'Focus on form and tempo', 'Increase rest periods'],
        expectedOutcome: 'Restored strength progression within 2-3 weeks',
        successMetrics: ['Weight progression resumed', 'RPE decreased', 'Form quality improved']
      },
      volume: {
        type: 'variation' as const,
        duration: 3,
        actions: ['Introduce exercise variations', 'Modify rep ranges', 'Add unilateral work'],
        expectedOutcome: 'Increased training stimulus and volume progression',
        successMetrics: ['Volume increase >10%', 'Exercise variation mastery', 'Sustained motivation']
      },
      technique: {
        type: 'technique_focus' as const,
        duration: 4,
        actions: ['Reduce load 20%', 'Focus on movement quality', 'Video analysis recommended'],
        expectedOutcome: 'Improved movement efficiency and strength transfer',
        successMetrics: ['Form score improvement', 'Better mind-muscle connection', 'Reduced injury risk']
      },
      motivation: {
        type: 'variation' as const,
        duration: 2,
        actions: ['Introduce fun variations', 'Change workout structure', 'Set short-term challenges'],
        expectedOutcome: 'Renewed training motivation and engagement',
        successMetrics: ['Increased session completion', 'Higher enjoyment ratings', 'Consistent attendance']
      }
    };

    return interventionMap[detection.plateauType] || interventionMap.strength;
  }

  private constructRecommendedExercises(
    progressionPlan: any[],
    plateauInterventions: PlateauIntervention[],
    userGoals: UserGoals
  ): RecommendedExercise[] {
    return progressionPlan.map(plan => {
      const intervention = plateauInterventions.find(i => i.exerciseName === plan.exerciseName);
      const autoregulation = plan.autoregulation;
      const smartProgression = plan.smartProgression;

      // Apply goal-based rep range optimization
      const optimizedReps = this.optimizeRepsForGoal(
        plan.progression.nextSessionPlan.targetReps,
        userGoals.primary,
        plan.exerciseName
      );

      // Apply goal-based RPE optimization  
      const optimizedRPE = this.optimizeRPEForGoal(
        autoregulation.adaptiveTarget.targetRPE,
        userGoals.primary
      );

      return {
        exerciseName: plan.exerciseName,
        exerciseType: this.exerciseDatabase.getExerciseType(plan.exerciseName),
        muscleGroups: this.exerciseDatabase.getMuscleGroups(plan.exerciseName),
        sets: plan.progression.nextSessionPlan.targetSets,
        reps: optimizedReps,
        weight: smartProgression.suggestedWeight,
        restTime: plan.progression.nextSessionPlan.restTime,
        rpe: optimizedRPE,
        progressionReason: plan.progression.aiInsights.primaryRecommendation,
        previousPerformance: this.extractPreviousPerformance(plan.progression),
        variations: this.exerciseDatabase.getVariations(plan.exerciseName).slice(0, 3),
        techniqueFocus: intervention?.specificActions || [],
        warmupRecommendations: this.generateWarmupRecommendations(plan.exerciseName)
      };
    });
  }

  private optimizeExerciseOrder(exercises: RecommendedExercise[], userGoals: UserGoals): RecommendedExercise[] {
    // Order exercises: Compound first, then isolation, considering fatigue
    const compound = exercises.filter(ex => ex.exerciseType === 'compound');
    const isolation = exercises.filter(ex => ex.exerciseType === 'isolation');
    
    // Sort compound by complexity/load, isolation by muscle group
    compound.sort((a, b) => this.getExerciseComplexity(b.exerciseName) - this.getExerciseComplexity(a.exerciseName));
    
    return [...compound, ...isolation];
  }

  private calculateOptimalVolume(exercises: RecommendedExercise[], userGoals: UserGoals) {
    const totalVolume = exercises.reduce((sum, ex) => {
      const reps = typeof ex.reps === 'number' ? ex.reps : ex.reps[0];
      return sum + (ex.weight * reps * ex.sets);
    }, 0);

    return { totalVolume, volumePerExercise: totalVolume / exercises.length };
  }

  private calculateWorkoutDuration(exercises: RecommendedExercise[]): number {
    const exerciseTime = exercises.length * 3; // 3 minutes per exercise setup
    const setTime = exercises.reduce((sum, ex) => {
      const reps = typeof ex.reps === 'number' ? ex.reps : ex.reps[0];
      const setDuration = reps * 3 + ex.restTime; // 3 seconds per rep + rest
      return sum + (setDuration * ex.sets);
    }, 0);
    
    return Math.round((exerciseTime + setTime / 60) * 1.2); // Add 20% buffer
  }

  private determineIntensityProfile(exercises: RecommendedExercise[]): 'low' | 'moderate' | 'high' | 'mixed' {
    const avgRPE = exercises.reduce((sum, ex) => {
      const rpe = typeof ex.rpe === 'number' ? ex.rpe : ex.rpe[0];
      return sum + rpe;
    }, 0) / exercises.length;

    if (avgRPE < 6) return 'low';
    if (avgRPE < 8) return 'moderate';
    if (avgRPE < 9) return 'high';
    return 'mixed';
  }

  private generateStructureReasoning(
    exercises: RecommendedExercise[],
    userGoals: UserGoals,
    interventions: PlateauIntervention[]
  ): string[] {
    const reasoning = [];
    reasoning.push(`Workout structured for ${userGoals.primary} optimization`);
    reasoning.push(`${exercises.filter(ex => ex.exerciseType === 'compound').length} compound movements for maximum efficiency`);
    
    if (interventions.length > 0) {
      reasoning.push(`${interventions.length} plateau interventions integrated`);
    }
    
    return reasoning;
  }

  private predictWorkoutOutcomes(exercises: RecommendedExercise[], userGoals: UserGoals): string[] {
    const outcomes = [];
    const avgRPE = exercises.reduce((sum, ex) => {
      const rpe = typeof ex.rpe === 'number' ? ex.rpe : ex.rpe[0];
      return sum + rpe;
    }, 0) / exercises.length;

    if (avgRPE > 8) {
      outcomes.push('Strength gains expected within 2-3 weeks');
      outcomes.push('Increased neuromuscular adaptation');
    } else {
      outcomes.push('Volume adaptation and work capacity improvement');
      outcomes.push('Enhanced movement quality and technique');
    }

    if (userGoals.primary === 'hypertrophy') {
      outcomes.push('Muscle growth stimulus optimized for target rep ranges');
    }

    return outcomes;
  }

  private synthesizeProgressionInsights(progressionPlan: any[]): AIProgressionInsights {
    const allInsights = progressionPlan.map(p => p.progression.aiInsights);
    
    return {
      primaryRecommendation: this.synthesizePrimaryRecommendation(allInsights),
      confidenceScore: this.calculateAverageConfidence(allInsights),
      reasoningChain: this.combineReasoningChains(allInsights),
      alternativeStrategies: this.synthesizeAlternativeStrategies(allInsights),
      researchBasis: 'Combined analysis from enhanced progressive overload V2 service',
      riskAssessment: this.synthesizeRiskAssessment(allInsights)
    };
  }

  private calculateAdaptationTargets(userGoals: UserGoals, workoutStructure: any) {
    const baseTargets = {
      strength: userGoals.primary === 'strength' ? 15 : 8,
      hypertrophy: userGoals.primary === 'hypertrophy' ? 12 : 6,
      endurance: userGoals.primary === 'endurance' ? 20 : 5
    };

    // Adjust based on workout intensity
    const intensityMultiplier = workoutStructure.intensityProfile === 'high' ? 1.2 : 
                              workoutStructure.intensityProfile === 'low' ? 0.8 : 1.0;

    return {
      strength: Math.round(baseTargets.strength * intensityMultiplier),
      hypertrophy: Math.round(baseTargets.hypertrophy * intensityMultiplier),
      endurance: Math.round(baseTargets.endurance * intensityMultiplier)
    };
  }

  // Goal optimization methods
  private optimizeRepsForGoal(baseReps: number, goal: UserGoals['primary'], exerciseName: string): number {
    const goalRepRanges = {
      strength: { min: 1, max: 6 },
      hypertrophy: { min: 6, max: 15 },
      endurance: { min: 12, max: 25 },
      weight_loss: { min: 10, max: 20 },
      body_recomposition: { min: 8, max: 15 },
      general_fitness: { min: 8, max: 12 }
    };

    const range = goalRepRanges[goal] || goalRepRanges.general_fitness;
    return Math.max(range.min, Math.min(range.max, baseReps));
  }

  private optimizeRPEForGoal(baseRPE: number, goal: UserGoals['primary']): number {
    const goalRPEAdjustments = {
      strength: 0.5,    // Higher intensity for strength
      hypertrophy: 0,   // Moderate intensity for hypertrophy
      endurance: -0.5,  // Lower intensity for endurance
      weight_loss: -0.5, // Lower intensity for fat loss
      body_recomposition: 0, // Moderate intensity
      general_fitness: -0.25 // Slightly lower intensity
    };

    const adjustment = goalRPEAdjustments[goal] || 0;
    return Math.max(6, Math.min(10, baseRPE + adjustment));
  }

  private handleEmptyExerciseHistory(userGoals: UserGoals): RecommendedExercise[] {
    const goalBasedExercises = this.getGoalOptimizedExercises(userGoals);
    
    return goalBasedExercises.slice(0, 4).map(exerciseName => ({
      exerciseName,
      exerciseType: this.exerciseDatabase.getExerciseType(exerciseName),
      muscleGroups: this.exerciseDatabase.getMuscleGroups(exerciseName),
      sets: 3,
      reps: this.optimizeRepsForGoal(8, userGoals.primary, exerciseName),
      weight: this.getStartingWeight(exerciseName),
      restTime: 180,
      rpe: this.optimizeRPEForGoal(7, userGoals.primary),
      progressionReason: `Starting recommendation for ${userGoals.primary} goal`,
      variations: this.exerciseDatabase.getVariations(exerciseName).slice(0, 2),
      warmupRecommendations: this.generateWarmupRecommendations(exerciseName)
    }));
  }

  private getStartingWeight(exerciseName: string): number {
    const startingWeights: Record<string, number> = {
      'Squat': 60,
      'Deadlift': 70,
      'Bench Press': 45,
      'Overhead Press': 25,
      'Row': 35,
      default: 20
    };
    return startingWeights[exerciseName] || startingWeights.default;
  }

  private adjustDurationForConstraints(
    exercises: RecommendedExercise[], 
    userGoals: UserGoals
  ): RecommendedExercise[] {
    const targetDuration = userGoals.preferences.workoutDuration;
    const currentDuration = this.calculateWorkoutDuration(exercises);
    
    if (currentDuration <= targetDuration) {
      return exercises;
    }
    
    // Reduce exercises if duration is too long
    const reductionFactor = targetDuration / currentDuration;
    const targetExerciseCount = Math.max(3, Math.floor(exercises.length * reductionFactor));
    
    return exercises.slice(0, targetExerciseCount);
  }

  // Utility methods
  private generateWorkoutId(): string {
    return `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineRecommendationType(plateauAnalysis: any, performanceAnalysis: any): WorkoutRecommendation['recommendationType'] {
    if (plateauAnalysis.urgentInterventions > 0) return 'plateau_break';
    if (performanceAnalysis.overallPerformanceScore < 40) return 'deload';
    if (plateauAnalysis.totalPlateaus > 0) return 'variation';
    if (performanceAnalysis.readyForProgression > performanceAnalysis.analyses.length * 0.7) return 'progression';
    return 'goal_optimization';
  }

  private extractPreviousPerformance(progression: EnhancedProgressionRecommendationV2) {
    const lastSession = progression.suggestion.lastSessionSummary;
    return {
      lastWeight: lastSession.weight,
      lastReps: lastSession.totalReps,
      lastRPE: lastSession.averageRPE
    };
  }

  private generateWarmupRecommendations(exerciseName: string): string[] {
    const warmupMap: Record<string, string[]> = {
      'Squat': ['Bodyweight squats', 'Leg swings', 'Hip circles'],
      'Deadlift': ['Hip hinges', 'Glute bridges', 'Cat-cow stretches'],
      'Bench Press': ['Arm circles', 'Band pull-aparts', 'Push-ups'],
      default: ['Light cardio', 'Dynamic stretching', 'Movement-specific warm-up']
    };

    return warmupMap[exerciseName] || warmupMap.default;
  }

  private getExerciseComplexity(exerciseName: string): number {
    const complexityMap: Record<string, number> = {
      'Deadlift': 10,
      'Squat': 9,
      'Clean': 8,
      'Snatch': 8,
      'Overhead Press': 7,
      'Bench Press': 6,
      'Row': 5,
      default: 3
    };

    return complexityMap[exerciseName] || complexityMap.default;
  }

  private analyzeBiomechanicalBenefit(original: string, variation: any, plateauedExercise: any): string {
    if (plateauedExercise?.progression?.plateauAnalysis?.activeIndicators?.formDegradation) {
      return 'Improved movement mechanics and reduced compensation patterns';
    }
    if (plateauedExercise?.progression?.plateauAnalysis?.activeIndicators?.weightStagnation) {
      return 'Novel stimulus to overcome strength plateau';
    }
    return 'Enhanced muscle activation and movement variety';
  }

  private generateProgressionReason(original: string, variation: any, plateauedExercise: any): string {
    if (plateauedExercise?.progression?.plateauAnalysis?.recommendedAction) {
      return `Variation recommended to break ${plateauedExercise.progression.plateauAnalysis.recommendedAction} plateau`;
    }
    return 'Variation for enhanced muscle development and movement quality';
  }

  private calculateSwapConfidence(original: string, variation: any, userGoals: UserGoals): number {
    let confidence = 70; // Base confidence
    
    // Equipment availability
    if (userGoals.preferences.equipmentAvailable.includes(variation.equipment[0])) {
      confidence += 15;
    } else {
      confidence -= 20;
    }
    
    // User preferences
    if (userGoals.preferences.exercisePreferences.includes(variation.name)) {
      confidence += 10;
    }
    
    if (userGoals.preferences.dislikedExercises?.includes(variation.name)) {
      confidence -= 30;
    }
    
    return Math.max(0, Math.min(100, confidence));
  }

  // Synthesis helper methods
  private synthesizePrimaryRecommendation(insights: AIProgressionInsights[]): string {
    const recommendations = insights.map(i => i.primaryRecommendation);
    const plateauCount = recommendations.filter(r => r.includes('plateau')).length;
    const progressionCount = recommendations.filter(r => r.includes('progression')).length;

    if (plateauCount > progressionCount) {
      return 'Focus on plateau interventions with strategic deloading and variation';
    }
    return 'Continue progressive overload with optimized load management';
  }

  private calculateAverageConfidence(insights: AIProgressionInsights[]): number {
    if (insights.length === 0) return 50;
    return insights.reduce((sum, i) => sum + i.confidenceScore, 0) / insights.length;
  }

  private combineReasoningChains(insights: AIProgressionInsights[]): string[] {
    const allReasons = insights.flatMap(i => i.reasoningChain);
    return [...new Set(allReasons)].slice(0, 8); // Unique reasons, max 8
  }

  private synthesizeAlternativeStrategies(insights: AIProgressionInsights[]) {
    const allStrategies = insights.flatMap(i => i.alternativeStrategies);
    const strategyMap = new Map();
    
    allStrategies.forEach(strategy => {
      const key = strategy.strategy;
      if (!strategyMap.has(key) || strategyMap.get(key).confidence < strategy.confidence) {
        strategyMap.set(key, strategy);
      }
    });
    
    return Array.from(strategyMap.values()).slice(0, 5);
  }

  private synthesizeRiskAssessment(insights: AIProgressionInsights[]) {
    const risks = insights.map(i => i.riskAssessment);
    
    const riskCounts = {
      overtraining: { low: 0, medium: 0, high: 0 },
      injury: { low: 0, medium: 0, high: 0 },
      plateau: { low: 0, medium: 0, high: 0 }
    };
    
    risks.forEach(risk => {
      riskCounts.overtraining[risk.overtrainingRisk]++;
      riskCounts.injury[risk.injuryRisk]++;
      riskCounts.plateau[risk.plateauRisk]++;
    });
    
    return {
      overtrainingRisk: this.getHighestRisk(riskCounts.overtraining),
      injuryRisk: this.getHighestRisk(riskCounts.injury),
      plateauRisk: this.getHighestRisk(riskCounts.plateau)
    } as const;
  }

  private getHighestRisk(riskCount: { low: number; medium: number; high: number }): 'low' | 'medium' | 'high' {
    if (riskCount.high > 0) return 'high';
    if (riskCount.medium > 0) return 'medium';
    return 'low';
  }
}

/**
 * Exercise Database for variations and biomechanical analysis
 */
class ExerciseDatabase {
  private exercises: Map<string, any> = new Map();
  private variations: Map<string, any[]> = new Map();

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Initialize with basic exercise data
    const exerciseData = [
      {
        name: 'Squat',
        type: 'compound',
        muscleGroups: ['quadriceps', 'glutes', 'core'],
        difficulty: 'intermediate',
        equipment: ['barbell', 'squat_rack'],
        variations: [
          { name: 'Front Squat', muscleGroups: ['quadriceps', 'core'], difficulty: 'advanced', equipment: ['barbell'] },
          { name: 'Goblet Squat', muscleGroups: ['quadriceps', 'glutes'], difficulty: 'beginner', equipment: ['dumbbell'] },
          { name: 'Bulgarian Split Squat', muscleGroups: ['quadriceps', 'glutes'], difficulty: 'intermediate', equipment: ['none'] }
        ]
      },
      {
        name: 'Deadlift',
        type: 'compound',
        muscleGroups: ['hamstrings', 'glutes', 'back', 'core'],
        difficulty: 'advanced',
        equipment: ['barbell'],
        variations: [
          { name: 'Romanian Deadlift', muscleGroups: ['hamstrings', 'glutes'], difficulty: 'intermediate', equipment: ['barbell'] },
          { name: 'Sumo Deadlift', muscleGroups: ['quadriceps', 'glutes', 'back'], difficulty: 'advanced', equipment: ['barbell'] },
          { name: 'Trap Bar Deadlift', muscleGroups: ['quadriceps', 'glutes', 'back'], difficulty: 'intermediate', equipment: ['trap_bar'] }
        ]
      },
      {
        name: 'Bench Press',
        type: 'compound',
        muscleGroups: ['chest', 'triceps', 'shoulders'],
        difficulty: 'intermediate',
        equipment: ['barbell', 'bench'],
        variations: [
          { name: 'Incline Bench Press', muscleGroups: ['upper_chest', 'shoulders'], difficulty: 'intermediate', equipment: ['barbell', 'incline_bench'] },
          { name: 'Dumbbell Bench Press', muscleGroups: ['chest', 'triceps'], difficulty: 'beginner', equipment: ['dumbbell', 'bench'] },
          { name: 'Close-Grip Bench Press', muscleGroups: ['triceps', 'chest'], difficulty: 'intermediate', equipment: ['barbell', 'bench'] }
        ]
      }
    ];

    exerciseData.forEach(exercise => {
      this.exercises.set(exercise.name, exercise);
      this.variations.set(exercise.name, exercise.variations);
    });
  }

  getExercise(name: string) {
    return this.exercises.get(name);
  }

  getVariations(name: string): any[] {
    return this.variations.get(name) || [];
  }

  getExerciseType(name: string): 'compound' | 'isolation' {
    const exercise = this.exercises.get(name);
    return exercise?.type || 'compound';
  }

  getMuscleGroups(name: string): string[] {
    const exercise = this.exercises.get(name);
    return exercise?.muscleGroups || [];
  }
}

// Export singleton instance and factory function
export const workoutRecommendationEngine = new WorkoutRecommendationEngine();

export const createWorkoutRecommendationEngine = (
  userProfile?: Partial<UserAdaptationProfile>,
  config?: Partial<RecommendationConfig>
) => {
  return new WorkoutRecommendationEngine(userProfile, config);
};

// Export main recommendation service
export const workoutRecommendationService = workoutRecommendationEngine;