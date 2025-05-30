/**
 * Smart Exercise Selection Service
 * Intelligent exercise recommendation based on workout patterns, muscle groups, and recovery
 */

interface Exercise {
  id: number;
  weight: number;  // Used as ID in current system
  name: string;
  description: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'Strength' | 'Cardio' | 'Flexibility' | 'Endurance';
  primaryMuscles: string[];
  secondaryMuscles: string[];
  compoundMovement: boolean;
  workoutTypes: string[];
}

interface WorkoutSession {
  date: string;
  workoutType: string;
  exercises: Array<{
    exerciseId: number;
    exerciseName: string;
    sets: Array<{
      weight: number;
      reps: number;
      rpe?: number;
    }>;
  }>;
}

interface ExerciseRecommendation {
  exercise: Exercise;
  score: number;
  reasons: string[];
  muscleGroups: string[];
  difficulty: string;
  estimatedSets: number;
  estimatedReps: number;
  estimatedWeight: number;
}

interface WorkoutPlan {
  primaryExercises: ExerciseRecommendation[];
  accessoryExercises: ExerciseRecommendation[];
  totalEstimatedTime: number;
  muscleGroupBalance: Record<string, number>;
  workoutIntensity: 'Light' | 'Moderate' | 'Intense';
}

interface SmartSelectionOptions {
  workoutType: string;
  targetDuration: number; // minutes
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  availableEquipment: string[];
  focusMuscleGroups?: string[];
  avoidMuscleGroups?: string[];
  preferCompoundMovements?: boolean;
  maxExercises?: number;
}

class SmartExerciseSelectionService {
  private exerciseDatabase: Exercise[] = [];
  private recentWorkouts: WorkoutSession[] = [];
  
  // Muscle group recovery times (in days)
  private readonly RECOVERY_TIMES = {
    'chest': 2,
    'back': 2,
    'shoulders': 1.5,
    'arms': 1,
    'biceps': 1,
    'triceps': 1,
    'legs': 3,
    'quads': 2.5,
    'hamstrings': 2.5,
    'glutes': 2,
    'calves': 1,
    'abs': 1,
    'core': 1
  };

  // Exercise time estimates (in minutes)
  private readonly EXERCISE_TIME_ESTIMATES = {
    compound: 8,  // Including warm-up sets
    isolation: 5,
    cardio: 15,
    flexibility: 3
  };

  /**
   * Initialize with exercise database and recent workouts
   */
  async initialize(): Promise<void> {
    try {
      // Load exercise database
      this.exerciseDatabase = await this.loadExerciseDatabase();
      
      // Load recent workout history
      this.recentWorkouts = await this.loadRecentWorkouts();
      
      console.log(`🧠 Smart Exercise Selection initialized with ${this.exerciseDatabase.length} exercises`);
    } catch (error) {
      console.error('Error initializing smart exercise selection:', error);
      // Use mock data for development
      this.exerciseDatabase = this.getMockExerciseDatabase();
      this.recentWorkouts = [];
    }
  }

  /**
   * Generate intelligent workout plan based on options
   */
  generateWorkoutPlan(options: SmartSelectionOptions): WorkoutPlan {
    console.log(`🎯 Generating ${options.workoutType} workout plan...`);

    // Get exercises that haven't been used recently
    const availableExercises = this.getAvailableExercises(options);
    
    // Filter by muscle groups and recovery status
    const recoveredExercises = this.filterByRecovery(availableExercises, options.workoutType);
    
    // Score and rank exercises
    const scoredExercises = this.scoreExercises(recoveredExercises, options);
    
    // Select primary (compound) exercises
    const primaryExercises = this.selectPrimaryExercises(scoredExercises, options);
    
    // Select accessory (isolation) exercises
    const accessoryExercises = this.selectAccessoryExercises(
      scoredExercises, 
      primaryExercises, 
      options
    );
    
    // Calculate workout metrics
    const totalEstimatedTime = this.calculateWorkoutTime(primaryExercises, accessoryExercises);
    const muscleGroupBalance = this.calculateMuscleGroupBalance(primaryExercises, accessoryExercises);
    const workoutIntensity = this.assessWorkoutIntensity(primaryExercises, accessoryExercises);

    const plan: WorkoutPlan = {
      primaryExercises,
      accessoryExercises,
      totalEstimatedTime,
      muscleGroupBalance,
      workoutIntensity
    };

    console.log(`✅ Generated plan: ${primaryExercises.length} primary + ${accessoryExercises.length} accessory exercises`);
    return plan;
  }

  /**
   * Get exercise recommendations for current session
   */
  getExerciseRecommendations(
    currentExercises: string[], 
    workoutType: string, 
    remainingTime: number
  ): ExerciseRecommendation[] {
    const usedMuscleGroups = this.getUsedMuscleGroups(currentExercises);
    const availableExercises = this.exerciseDatabase.filter(exercise => 
      exercise.workoutTypes.includes(workoutType) &&
      !currentExercises.includes(exercise.name)
    );

    // Prefer exercises that target underworked muscle groups
    const recommendations = availableExercises
      .map(exercise => this.scoreExerciseForSession(exercise, usedMuscleGroups, remainingTime))
      .filter(rec => rec.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Top 8 recommendations

    return recommendations;
  }

  /**
   * Detect supersets and exercise combinations
   */
  detectSupersets(exercises: Exercise[]): Array<{ primary: Exercise; secondary: Exercise; type: string }> {
    const supersets: Array<{ primary: Exercise; secondary: Exercise; type: string }> = [];
    
    for (let i = 0; i < exercises.length; i++) {
      for (let j = i + 1; j < exercises.length; j++) {
        const primary = exercises[i];
        const secondary = exercises[j];
        
        // Antagonist superset (opposing muscle groups)
        if (this.areAntagonistMuscles(primary.primaryMuscles, secondary.primaryMuscles)) {
          supersets.push({ primary, secondary, type: 'antagonist' });
        }
        
        // Compound superset (same muscle group, different angle)
        else if (this.areComplementaryExercises(primary, secondary)) {
          supersets.push({ primary, secondary, type: 'compound' });
        }
      }
    }
    
    return supersets;
  }

  /**
   * Get muscle group balancing suggestions
   */
  getMuscleGroupBalance(workoutHistory: WorkoutSession[], days: number = 7): Record<string, number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentWorkouts = workoutHistory.filter(w => 
      new Date(w.date) >= cutoffDate
    );
    
    const muscleGroupCounts: Record<string, number> = {};
    
    recentWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const exerciseData = this.exerciseDatabase.find(e => e.name === exercise.exerciseName);
        if (exerciseData) {
          exerciseData.primaryMuscles.forEach(muscle => {
            muscleGroupCounts[muscle] = (muscleGroupCounts[muscle] || 0) + 1;
          });
        }
      });
    });
    
    return muscleGroupCounts;
  }

  /**
   * Private helper methods
   */
  private async loadExerciseDatabase(): Promise<Exercise[]> {
    try {
      const response = await fetch('/api/exercises');
      if (!response.ok) throw new Error('Failed to fetch exercises');
      
      const exercises = await response.json();
      return exercises.map((ex: any) => this.transformExerciseData(ex));
    } catch (error) {
      console.error('Error loading exercise database:', error);
      return this.getMockExerciseDatabase();
    }
  }

  private async loadRecentWorkouts(): Promise<WorkoutSession[]> {
    try {
      const response = await fetch('/api/workout-sessions?limit=20');
      if (!response.ok) throw new Error('Failed to fetch workouts');
      
      return await response.json();
    } catch (error) {
      console.error('Error loading recent workouts:', error);
      return [];
    }
  }

  private transformExerciseData(exerciseData: any): Exercise {
    return {
      id: exerciseData.id || exerciseData.weight,
      weight: exerciseData.weight,
      name: exerciseData.name,
      description: exerciseData.description || '',
      muscleGroups: this.extractMuscleGroups(exerciseData.name),
      equipment: exerciseData.equipment || ['Barbell', 'Dumbbell'],
      difficulty: this.determineDifficulty(exerciseData.name),
      type: 'Strength',
      primaryMuscles: this.extractPrimaryMuscles(exerciseData.name),
      secondaryMuscles: this.extractSecondaryMuscles(exerciseData.name),
      compoundMovement: this.isCompoundMovement(exerciseData.name),
      workoutTypes: exerciseData.workoutTypes || this.inferWorkoutTypes(exerciseData.name)
    };
  }

  private getAvailableExercises(options: SmartSelectionOptions): Exercise[] {
    return this.exerciseDatabase.filter(exercise => {
      // Filter by workout type
      if (!exercise.workoutTypes.includes(options.workoutType)) return false;
      
      // Filter by experience level
      if (this.getDifficultyScore(exercise.difficulty) > this.getDifficultyScore(options.experienceLevel)) {
        return false;
      }
      
      // Filter by available equipment
      if (!exercise.equipment.some(eq => options.availableEquipment.includes(eq))) {
        return false;
      }
      
      return true;
    });
  }

  private filterByRecovery(exercises: Exercise[], workoutType: string): Exercise[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 3); // Look at last 3 days
    
    const recentlyWorkedMuscles = new Set<string>();
    
    this.recentWorkouts
      .filter(w => new Date(w.date) >= cutoffDate)
      .forEach(workout => {
        workout.exercises.forEach(exercise => {
          const exerciseData = this.exerciseDatabase.find(e => e.name === exercise.exerciseName);
          if (exerciseData) {
            exerciseData.primaryMuscles.forEach(muscle => {
              const daysSinceWorked = (Date.now() - new Date(workout.date).getTime()) / (1000 * 60 * 60 * 24);
              const recoveryTime = this.RECOVERY_TIMES[muscle.toLowerCase() as keyof typeof this.RECOVERY_TIMES] || 2;
              
              if (daysSinceWorked < recoveryTime) {
                recentlyWorkedMuscles.add(muscle.toLowerCase());
              }
            });
          }
        });
      });

    return exercises.filter(exercise => {
      // Allow exercises if at least 75% of muscles are recovered
      const recoveredMuscles = exercise.primaryMuscles.filter(muscle => 
        !recentlyWorkedMuscles.has(muscle.toLowerCase())
      );
      
      return recoveredMuscles.length >= exercise.primaryMuscles.length * 0.75;
    });
  }

  private scoreExercises(exercises: Exercise[], options: SmartSelectionOptions): ExerciseRecommendation[] {
    return exercises.map(exercise => {
      let score = 50; // Base score
      const reasons: string[] = [];
      
      // Compound movement bonus
      if (exercise.compoundMovement && (options.preferCompoundMovements !== false)) {
        score += 20;
        reasons.push('Compound movement');
      }
      
      // Focus muscle group bonus
      if (options.focusMuscleGroups) {
        const overlap = exercise.primaryMuscles.filter(muscle => 
          options.focusMuscleGroups!.some(focus => 
            muscle.toLowerCase().includes(focus.toLowerCase())
          )
        ).length;
        score += overlap * 15;
        if (overlap > 0) reasons.push(`Targets ${options.focusMuscleGroups.join(', ')}`);
      }
      
      // Avoid muscle group penalty
      if (options.avoidMuscleGroups) {
        const avoided = exercise.primaryMuscles.some(muscle => 
          options.avoidMuscleGroups!.some(avoid => 
            muscle.toLowerCase().includes(avoid.toLowerCase())
          )
        );
        if (avoided) {
          score -= 30;
          reasons.push('Avoiding overworked muscles');
        }
      }
      
      // Experience level matching
      if (exercise.difficulty === options.experienceLevel) {
        score += 10;
        reasons.push('Matches experience level');
      }
      
      // Variety bonus (haven't done recently)
      const recentlyUsed = this.recentWorkouts.some(workout =>
        workout.exercises.some(ex => ex.exerciseName === exercise.name)
      );
      if (!recentlyUsed) {
        score += 15;
        reasons.push('Fresh exercise');
      }

      return {
        exercise,
        score: Math.max(0, score),
        reasons,
        muscleGroups: exercise.primaryMuscles,
        difficulty: exercise.difficulty,
        estimatedSets: this.estimateSets(exercise),
        estimatedReps: this.estimateReps(exercise),
        estimatedWeight: this.estimateWeight(exercise)
      };
    });
  }

  private selectPrimaryExercises(
    scoredExercises: ExerciseRecommendation[], 
    options: SmartSelectionOptions
  ): ExerciseRecommendation[] {
    const primaryCount = Math.min(4, Math.floor((options.maxExercises || 8) * 0.6));
    
    // Prefer compound movements for primary exercises
    const compoundExercises = scoredExercises
      .filter(rec => rec.exercise.compoundMovement)
      .sort((a, b) => b.score - a.score);
    
    return compoundExercises.slice(0, primaryCount);
  }

  private selectAccessoryExercises(
    scoredExercises: ExerciseRecommendation[],
    primaryExercises: ExerciseRecommendation[],
    options: SmartSelectionOptions
  ): ExerciseRecommendation[] {
    const accessoryCount = (options.maxExercises || 8) - primaryExercises.length;
    const usedMuscles = new Set(primaryExercises.flatMap(ex => ex.exercise.primaryMuscles));
    
    // Prefer isolation exercises that complement primary movements
    const accessoryExercises = scoredExercises
      .filter(rec => 
        !rec.exercise.compoundMovement && 
        !primaryExercises.some(pri => pri.exercise.id === rec.exercise.id)
      )
      .map(rec => ({
        ...rec,
        score: rec.score + (rec.exercise.primaryMuscles.some(muscle => 
          usedMuscles.has(muscle)
        ) ? 10 : 0) // Bonus for targeting already worked muscles
      }))
      .sort((a, b) => b.score - a.score);
    
    return accessoryExercises.slice(0, accessoryCount);
  }

  private scoreExerciseForSession(
    exercise: Exercise, 
    usedMuscleGroups: string[], 
    remainingTime: number
  ): ExerciseRecommendation {
    let score = 30;
    const reasons: string[] = [];
    
    // Time constraint check
    const timeNeeded = exercise.compoundMovement ? 
      this.EXERCISE_TIME_ESTIMATES.compound : 
      this.EXERCISE_TIME_ESTIMATES.isolation;
    
    if (timeNeeded > remainingTime) {
      score = 0;
      reasons.push('Not enough time remaining');
    } else {
      // Balance score - prefer underworked muscle groups
      const muscleBalance = exercise.primaryMuscles.reduce((balance, muscle) => {
        const usage = usedMuscleGroups.filter(used => used === muscle).length;
        return balance - usage * 5; // Penalty for overworked muscles
      }, 0);
      
      score += muscleBalance;
      
      if (muscleBalance > 0) {
        reasons.push('Balances muscle groups');
      }
    }
    
    return {
      exercise,
      score: Math.max(0, score),
      reasons,
      muscleGroups: exercise.primaryMuscles,
      difficulty: exercise.difficulty,
      estimatedSets: this.estimateSets(exercise),
      estimatedReps: this.estimateReps(exercise),
      estimatedWeight: this.estimateWeight(exercise)
    };
  }

  // Utility methods for muscle group analysis
  private extractMuscleGroups(exerciseName: string): string[] {
    const name = exerciseName.toLowerCase();
    const groups: string[] = [];
    
    if (name.includes('bench') || name.includes('press') && name.includes('chest')) {
      groups.push('chest');
    }
    if (name.includes('pull') || name.includes('row') || name.includes('lat')) {
      groups.push('back');
    }
    if (name.includes('squat') || name.includes('leg')) {
      groups.push('legs');
    }
    if (name.includes('curl') && name.includes('bicep')) {
      groups.push('biceps');
    }
    if (name.includes('extension') || name.includes('tricep')) {
      groups.push('triceps');
    }
    if (name.includes('shoulder') || name.includes('deltoid')) {
      groups.push('shoulders');
    }
    
    return groups.length > 0 ? groups : ['mixed'];
  }

  private extractPrimaryMuscles(exerciseName: string): string[] {
    // More detailed muscle mapping
    const name = exerciseName.toLowerCase();
    
    if (name.includes('bench press')) return ['chest', 'triceps'];
    if (name.includes('deadlift')) return ['back', 'glutes', 'hamstrings'];
    if (name.includes('squat')) return ['quads', 'glutes'];
    if (name.includes('pull up') || name.includes('pullup')) return ['back', 'biceps'];
    if (name.includes('shoulder press')) return ['shoulders', 'triceps'];
    if (name.includes('bicep curl')) return ['biceps'];
    if (name.includes('tricep')) return ['triceps'];
    if (name.includes('lat pulldown')) return ['back', 'biceps'];
    if (name.includes('leg press')) return ['quads', 'glutes'];
    
    return this.extractMuscleGroups(exerciseName);
  }

  private extractSecondaryMuscles(exerciseName: string): string[] {
    const name = exerciseName.toLowerCase();
    
    if (name.includes('bench press')) return ['shoulders'];
    if (name.includes('deadlift')) return ['traps', 'forearms'];
    if (name.includes('squat')) return ['calves', 'core'];
    if (name.includes('pull up')) return ['forearms'];
    if (name.includes('shoulder press')) return ['core'];
    
    return [];
  }

  private isCompoundMovement(exerciseName: string): boolean {
    const compoundKeywords = [
      'squat', 'deadlift', 'bench press', 'pull up', 'pullup', 'chin up',
      'shoulder press', 'military press', 'row', 'clean', 'snatch', 'lunge'
    ];
    
    return compoundKeywords.some(keyword => 
      exerciseName.toLowerCase().includes(keyword)
    );
  }

  private inferWorkoutTypes(exerciseName: string): string[] {
    const name = exerciseName.toLowerCase();
    
    if (name.includes('bench') || name.includes('press') && (name.includes('chest') || name.includes('tricep'))) {
      return ['ChestTriceps'];
    }
    if (name.includes('pull') || name.includes('row') || name.includes('lat') || name.includes('bicep')) {
      return ['BackBiceps'];
    }
    if (name.includes('squat') || name.includes('leg') || name.includes('lunge')) {
      return ['Legs'];
    }
    if (name.includes('abs') || name.includes('core') || name.includes('plank')) {
      return ['Abs'];
    }
    
    return ['Mixed'];
  }

  private determineDifficulty(exerciseName: string): 'Beginner' | 'Intermediate' | 'Advanced' {
    const name = exerciseName.toLowerCase();
    
    // Advanced exercises
    if (name.includes('clean') || name.includes('snatch') || name.includes('muscle up')) {
      return 'Advanced';
    }
    
    // Intermediate exercises
    if (name.includes('deadlift') || name.includes('pull up') || name.includes('dip')) {
      return 'Intermediate';
    }
    
    // Default to beginner
    return 'Beginner';
  }

  private getDifficultyScore(difficulty: string): number {
    switch (difficulty) {
      case 'Beginner': return 1;
      case 'Intermediate': return 2;
      case 'Advanced': return 3;
      default: return 1;
    }
  }

  private getUsedMuscleGroups(exerciseNames: string[]): string[] {
    const used: string[] = [];
    
    exerciseNames.forEach(name => {
      const exercise = this.exerciseDatabase.find(ex => ex.name === name);
      if (exercise) {
        used.push(...exercise.primaryMuscles);
      }
    });
    
    return used;
  }

  private areAntagonistMuscles(muscles1: string[], muscles2: string[]): boolean {
    const antagonistPairs = [
      ['chest', 'back'],
      ['biceps', 'triceps'],
      ['quads', 'hamstrings']
    ];
    
    return antagonistPairs.some(([muscle1, muscle2]) =>
      (muscles1.some(m => m.toLowerCase().includes(muscle1)) && 
       muscles2.some(m => m.toLowerCase().includes(muscle2))) ||
      (muscles1.some(m => m.toLowerCase().includes(muscle2)) && 
       muscles2.some(m => m.toLowerCase().includes(muscle1)))
    );
  }

  private areComplementaryExercises(ex1: Exercise, ex2: Exercise): boolean {
    // Same primary muscle but different movement patterns
    const sharedMuscles = ex1.primaryMuscles.filter(muscle => 
      ex2.primaryMuscles.includes(muscle)
    );
    
    return sharedMuscles.length > 0 && ex1.id !== ex2.id;
  }

  private calculateWorkoutTime(
    primaryExercises: ExerciseRecommendation[], 
    accessoryExercises: ExerciseRecommendation[]
  ): number {
    const primaryTime = primaryExercises.length * this.EXERCISE_TIME_ESTIMATES.compound;
    const accessoryTime = accessoryExercises.length * this.EXERCISE_TIME_ESTIMATES.isolation;
    
    return primaryTime + accessoryTime + 10; // +10 for warm-up/cool-down
  }

  private calculateMuscleGroupBalance(
    primaryExercises: ExerciseRecommendation[], 
    accessoryExercises: ExerciseRecommendation[]
  ): Record<string, number> {
    const balance: Record<string, number> = {};
    
    [...primaryExercises, ...accessoryExercises].forEach(rec => {
      rec.exercise.primaryMuscles.forEach(muscle => {
        balance[muscle] = (balance[muscle] || 0) + 1;
      });
    });
    
    return balance;
  }

  private assessWorkoutIntensity(
    primaryExercises: ExerciseRecommendation[], 
    accessoryExercises: ExerciseRecommendation[]
  ): 'Light' | 'Moderate' | 'Intense' {
    const totalExercises = primaryExercises.length + accessoryExercises.length;
    const compoundCount = primaryExercises.length;
    
    if (totalExercises <= 4 && compoundCount <= 2) return 'Light';
    if (totalExercises <= 7 && compoundCount <= 3) return 'Moderate';
    return 'Intense';
  }

  private estimateSets(exercise: Exercise): number {
    return exercise.compoundMovement ? 4 : 3;
  }

  private estimateReps(exercise: Exercise): number {
    if (exercise.name.toLowerCase().includes('deadlift')) return 5;
    if (exercise.compoundMovement) return 8;
    return 12;
  }

  private estimateWeight(exercise: Exercise): number {
    // This would ideally use user's historical data
    // For now, return reasonable defaults based on exercise type
    const baseWeights: Record<string, number> = {
      'bench press': 135,
      'deadlift': 185,
      'squat': 155,
      'shoulder press': 85,
      'bicep curl': 35,
      'tricep extension': 45
    };
    
    const name = exercise.name.toLowerCase();
    for (const [key, weight] of Object.entries(baseWeights)) {
      if (name.includes(key)) return weight;
    }
    
    return exercise.compoundMovement ? 135 : 50;
  }

  private getMockExerciseDatabase(): Exercise[] {
    return [
      {
        id: 1, weight: 225, name: 'Bench Press', description: 'Chest and tricep compound movement',
        muscleGroups: ['chest'], equipment: ['Barbell'], difficulty: 'Intermediate', type: 'Strength',
        primaryMuscles: ['chest', 'triceps'], secondaryMuscles: ['shoulders'], compoundMovement: true,
        workoutTypes: ['ChestTriceps']
      },
      {
        id: 2, weight: 315, name: 'Deadlift', description: 'Full body compound movement',
        muscleGroups: ['back', 'legs'], equipment: ['Barbell'], difficulty: 'Intermediate', type: 'Strength',
        primaryMuscles: ['back', 'glutes', 'hamstrings'], secondaryMuscles: ['traps', 'forearms'], compoundMovement: true,
        workoutTypes: ['BackBiceps', 'Legs']
      },
      {
        id: 3, weight: 185, name: 'Squat', description: 'Lower body compound movement',
        muscleGroups: ['legs'], equipment: ['Barbell'], difficulty: 'Intermediate', type: 'Strength',
        primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['calves', 'core'], compoundMovement: true,
        workoutTypes: ['Legs']
      },
      {
        id: 4, weight: 35, name: 'Bicep Curls', description: 'Isolation exercise for biceps',
        muscleGroups: ['arms'], equipment: ['Dumbbell'], difficulty: 'Beginner', type: 'Strength',
        primaryMuscles: ['biceps'], secondaryMuscles: [], compoundMovement: false,
        workoutTypes: ['BackBiceps']
      },
      {
        id: 5, weight: 45, name: 'Tricep Extensions', description: 'Isolation exercise for triceps',
        muscleGroups: ['arms'], equipment: ['Dumbbell'], difficulty: 'Beginner', type: 'Strength',
        primaryMuscles: ['triceps'], secondaryMuscles: [], compoundMovement: false,
        workoutTypes: ['ChestTriceps']
      }
    ];
  }
}

// Export singleton instance
export const smartExerciseSelection = new SmartExerciseSelectionService();

// Export types
export type { 
  Exercise, 
  ExerciseRecommendation, 
  WorkoutPlan, 
  SmartSelectionOptions,
  WorkoutSession 
};