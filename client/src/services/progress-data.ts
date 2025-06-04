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
   * Fetch workout sessions from unified storage API
   */
  async getWorkoutSessions(timeRange: '1M' | '3M' | '6M' | '1Y'): Promise<WorkoutSession[]> {
    try {
      const response = await fetch('/api/workouts/history');
      if (!response.ok) {
        throw new Error('Failed to fetch workout sessions');
      }
      
      const { workouts } = await response.json();
      
      // Filter by time range and completed sessions only
      const now = new Date();
      const monthsBack = this.getMonthsFromRange(timeRange);
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
      
      const filteredSessions = workouts.filter((session: any) => 
        session.sessionType === 'completed' && new Date(session.startTime) >= cutoffDate
      );
      
      // Transform to chart data format
      return filteredSessions.map((session: any) => ({
        date: session.startTime,
        workoutType: session.workoutType || 'Mixed',
        duration: session.totalDuration || 0,
        totalVolume: session.totalVolume || this.calculateSessionVolume(session),
        caloriesBurned: session.caloriesBurned || 0,
        formScore: session.averageFormScore || session.formScore || 8,
        exercises: this.transformExercises(session.exercises || [])
      }));
    } catch (error) {
      console.error('Error fetching workout sessions:', error);
      // NO MOCK DATA - Show real error
      throw new Error(`Failed to load workout data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
      
      const filteredStats = stats.filter((stat: any) => 
        new Date(stat.createdAt) >= cutoffDate
      );
      
      // Transform to chart data format - REAL DATA ONLY
      return filteredStats.map((stat: any) => ({
        date: stat.createdAt,
        weight: stat.weight || 0, // Show 0 if no real data
        bodyFat: stat.bodyFat || 0, // Show 0 if no real data  
        muscleMass: stat.muscleMass || 0 // Show 0 if no real data
      }));
    } catch (error) {
      console.error('Error fetching body stats:', error);
      // NO MOCK DATA - Show real error  
      throw new Error(`Failed to load body stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // ALL MOCK DATA FUNCTIONS REMOVED - REAL DATA ONLY
}

// Export singleton instance
export const progressDataService = new ProgressDataService();

// Export types
export type { WorkoutSession, BodyStats, ExerciseProgress, ProgressMetrics };