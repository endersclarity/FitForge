/**
 * Progress Data Service
 * Fetches and processes workout data for progress visualization
 */

interface WorkoutSession {
  date: string;
  workoutType: string;
  duration: number;
  totalVolume: number;
  caloriesBurned: number;
  formScore: number;
  exercises: Array<{
    name: string;
    sets: Array<{
      weight: number;
      reps: number;
      volume: number;
    }>;
  }>;
}

interface BodyStats {
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
}

interface ExerciseProgress {
  exerciseName: string;
  dates: string[];
  maxWeights: number[];
  totalVolumes: number[];
}

interface ProgressMetrics {
  sessions: WorkoutSession[];
  bodyStats: BodyStats[];
  exerciseProgress: ExerciseProgress[];
}

class ProgressDataService {
  /**
   * Fetch workout sessions from API
   */
  async getWorkoutSessions(timeRange: '1M' | '3M' | '6M' | '1Y'): Promise<WorkoutSession[]> {
    try {
      const response = await fetch('/api/workout-sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch workout sessions');
      }
      
      const sessions = await response.json();
      
      // Filter by time range
      const now = new Date();
      const monthsBack = this.getMonthsFromRange(timeRange);
      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());
      
      const filteredSessions = sessions.filter((session: any) => 
        new Date(session.startTime) >= cutoffDate
      );
      
      // Transform to chart data format
      return filteredSessions.map((session: any) => ({
        date: session.startTime,
        workoutType: session.workoutType || 'Mixed',
        duration: session.totalDuration || 0,
        totalVolume: this.calculateSessionVolume(session),
        caloriesBurned: session.caloriesBurned || 0,
        formScore: session.formScore || 8,
        exercises: this.transformExercises(session.exercises || [])
      }));
    } catch (error) {
      console.error('Error fetching workout sessions:', error);
      // Return mock data for development
      return this.getMockWorkoutData(timeRange);
    }
  }

  /**
   * Fetch body stats from API
   */
  async getBodyStats(timeRange: '1M' | '3M' | '6M' | '1Y'): Promise<BodyStats[]> {
    try {
      const response = await fetch('/api/user-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch body stats');
      }
      
      const stats = await response.json();
      
      // Filter by time range
      const now = new Date();
      const monthsBack = this.getMonthsFromRange(timeRange);
      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());
      
      const filteredStats = stats.filter((stat: any) => 
        new Date(stat.createdAt) >= cutoffDate
      );
      
      // Transform to chart data format
      return filteredStats.map((stat: any) => ({
        date: stat.createdAt,
        weight: stat.weight || 175,
        bodyFat: stat.bodyFat || 15,
        muscleMass: stat.muscleMass || 140
      }));
    } catch (error) {
      console.error('Error fetching body stats:', error);
      // Return mock data for development
      return this.getMockBodyStatsData(timeRange);
    }
  }

  /**
   * Calculate exercise-specific progress
   */
  async getExerciseProgress(timeRange: '1M' | '3M' | '6M' | '1Y'): Promise<ExerciseProgress[]> {
    try {
      const sessions = await this.getWorkoutSessions(timeRange);
      const exerciseMap = new Map<string, {dates: string[], weights: number[], volumes: number[]}>();
      
      sessions.forEach(session => {
        session.exercises.forEach(exercise => {
          if (!exerciseMap.has(exercise.name)) {
            exerciseMap.set(exercise.name, { dates: [], weights: [], volumes: [] });
          }
          
          const data = exerciseMap.get(exercise.name)!;
          data.dates.push(session.date);
          
          const maxWeight = Math.max(...exercise.sets.map(set => set.weight));
          const totalVolume = exercise.sets.reduce((sum, set) => sum + set.volume, 0);
          
          data.weights.push(maxWeight);
          data.volumes.push(totalVolume);
        });
      });
      
      return Array.from(exerciseMap.entries()).map(([name, data]) => ({
        exerciseName: name,
        dates: data.dates,
        maxWeights: data.weights,
        totalVolumes: data.volumes
      }));
    } catch (error) {
      console.error('Error calculating exercise progress:', error);
      return [];
    }
  }

  /**
   * Get complete progress metrics
   */
  async getProgressMetrics(timeRange: '1M' | '3M' | '6M' | '1Y'): Promise<ProgressMetrics> {
    const [sessions, bodyStats, exerciseProgress] = await Promise.all([
      this.getWorkoutSessions(timeRange),
      this.getBodyStats(timeRange),
      this.getExerciseProgress(timeRange)
    ]);

    return {
      sessions,
      bodyStats,
      exerciseProgress
    };
  }

  /**
   * Export progress data as CSV
   */
  async exportProgressData(timeRange: '1M' | '3M' | '6M' | '1Y'): Promise<string> {
    try {
      const response = await fetch(`/api/progress/export?format=csv&timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to export progress data');
      }
      
      const csvData = await response.text();
      
      // Trigger download
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `fitforge-progress-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return 'Export completed successfully';
    } catch (error) {
      console.error('Error exporting progress data:', error);
      throw new Error('Failed to export progress data');
    }
  }

  /**
   * Helper method to get months from time range
   */
  private getMonthsFromRange(timeRange: '1M' | '3M' | '6M' | '1Y'): number {
    switch (timeRange) {
      case '1M': return 1;
      case '3M': return 3;
      case '6M': return 6;
      case '1Y': return 12;
      default: return 3;
    }
  }

  /**
   * Calculate total volume for a session
   */
  private calculateSessionVolume(session: any): number {
    if (!session.exercises || !Array.isArray(session.exercises)) return 0;
    
    return session.exercises.reduce((total: number, exercise: any) => {
      if (!exercise.sets || !Array.isArray(exercise.sets)) return total;
      
      return total + exercise.sets.reduce((exerciseTotal: number, set: any) => {
        return exerciseTotal + (set.weight || 0) * (set.reps || 0);
      }, 0);
    }, 0);
  }

  /**
   * Transform exercises to chart format
   */
  private transformExercises(exercises: any[]): WorkoutSession['exercises'] {
    if (!Array.isArray(exercises)) return [];
    
    return exercises.map(exercise => ({
      name: exercise.exerciseName || exercise.name || 'Unknown Exercise',
      sets: (exercise.sets || []).map((set: any) => ({
        weight: set.weight || 0,
        reps: set.reps || 0,
        volume: (set.weight || 0) * (set.reps || 0)
      }))
    }));
  }

  /**
   * Mock workout data for development/demo
   */
  private getMockWorkoutData(timeRange: '1M' | '3M' | '6M' | '1Y'): WorkoutSession[] {
    const sessionCount = this.getMonthsFromRange(timeRange) * 8; // ~2 workouts per week
    const sessions: WorkoutSession[] = [];
    
    const workoutTypes = ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Abs', 'Mixed'];
    const exercises = [
      'Bench Press', 'Deadlift', 'Squat', 'Pull-ups', 'Shoulder Press',
      'Barbell Rows', 'Bicep Curls', 'Tricep Extensions', 'Planks', 'Lunges'
    ];
    
    for (let i = 0; i < sessionCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 3.5)); // Every ~3.5 days
      
      const workoutType = workoutTypes[Math.floor(Math.random() * workoutTypes.length)];
      const sessionExercises = this.getRandomSubset(exercises, 3 + Math.floor(Math.random() * 3));
      
      sessions.push({
        date: date.toISOString(),
        workoutType,
        duration: 45 + Math.floor(Math.random() * 30), // 45-75 minutes
        totalVolume: 2000 + Math.floor(Math.random() * 2000), // 2000-4000 lbs
        caloriesBurned: 300 + Math.floor(Math.random() * 200), // 300-500 calories
        formScore: 7 + Math.random() * 2.5, // 7-9.5
        exercises: sessionExercises.map(name => ({
          name,
          sets: Array.from({ length: 3 + Math.floor(Math.random() * 2) }, (_, setIndex) => ({
            weight: 135 + Math.floor(Math.random() * 90), // 135-225 lbs
            reps: 8 + Math.floor(Math.random() * 5), // 8-12 reps
            volume: 0 // Will be calculated
          }))
        }))
      });
    }
    
    // Calculate volumes
    sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          set.volume = set.weight * set.reps;
        });
      });
    });
    
    return sessions.reverse(); // Chronological order
  }

  /**
   * Mock body stats data for development/demo
   */
  private getMockBodyStatsData(timeRange: '1M' | '3M' | '6M' | '1Y'): BodyStats[] {
    const dataPoints = this.getMonthsFromRange(timeRange) * 4; // Weekly measurements
    const stats: BodyStats[] = [];
    
    let weight = 175;
    let bodyFat = 18;
    let muscleMass = 140;
    
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7)); // Weekly
      
      // Simulate gradual improvement
      weight += (Math.random() - 0.6) * 0.5; // Slight weight loss trend
      bodyFat += (Math.random() - 0.7) * 0.3; // Body fat loss trend
      muscleMass += (Math.random() - 0.3) * 0.4; // Muscle gain trend
      
      stats.push({
        date: date.toISOString(),
        weight: Math.round(weight * 10) / 10,
        bodyFat: Math.round(bodyFat * 10) / 10,
        muscleMass: Math.round(muscleMass * 10) / 10
      });
    }
    
    return stats.reverse(); // Chronological order
  }

  /**
   * Get random subset of array
   */
  private getRandomSubset<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

// Export singleton instance
export const progressDataService = new ProgressDataService();

// Export types
export type { WorkoutSession, BodyStats, ExerciseProgress, ProgressMetrics };