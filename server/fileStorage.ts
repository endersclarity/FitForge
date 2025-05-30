import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UserPreferences, Achievement, CORE_ACHIEVEMENTS } from '../shared/user-profile';

export interface WorkoutSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  workoutType: string;
  exercises: ExerciseLog[];
  totalVolume: number;
  caloriesBurned: number;
  notes?: string;
  rating?: number;
  status: "in_progress" | "completed" | "abandoned";
}

export interface ExerciseLog {
  exerciseId: number;
  exerciseName: string;
  sets: SetLog[];
  restTimes: number[];
  formScore?: number;
}

export interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  timestamp: string;
  formScore?: number;
  notes?: string;
  equipment?: string;
}

export interface BodyStats {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  restingHeartRate?: number;
  sleepHours?: number;
  energyLevel?: number;
  notes?: string;
}

export interface UserGoals {
  weightGoal?: {
    target: number;
    deadline?: string;
  };
  bodyFatGoal?: {
    target: number;
    deadline?: string;
  };
  strengthGoals?: {
    [exerciseName: string]: {
      target: number;
      currentMax?: number;
      deadline?: string;
    };
  };
  weeklyWorkoutTarget?: number;
}

export interface WorkoutFilters {
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
  workoutType?: string;
}

export class FileStorage {
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.join(process.cwd(), 'data');
  }

  async initialize(): Promise<void> {
    await fs.ensureDir(this.dataDir);
    await fs.ensureDir(path.join(this.dataDir, 'users'));
    await fs.ensureDir(path.join(this.dataDir, 'exercises'));
    await fs.ensureDir(path.join(this.dataDir, 'backup'));
  }

  // Workout Session Methods
  async createWorkoutSession(userId: string, workoutType: string, plannedExercises?: string[]): Promise<WorkoutSession> {
    const session: WorkoutSession = {
      id: uuidv4(),
      userId,
      startTime: new Date().toISOString(),
      workoutType,
      exercises: [],
      totalVolume: 0,
      caloriesBurned: 0,
      status: "in_progress"
    };

    const userDir = await this.ensureUserDir(userId);
    const workoutsPath = path.join(userDir, 'workouts.json');
    const workouts = await this.readJsonFile<WorkoutSession[]>(workoutsPath, []);
    
    workouts.push(session);
    await this.writeJsonFile(workoutsPath, workouts);
    
    return session;
  }

  async logSet(
    userId: string, 
    sessionId: string, 
    exerciseId: number,
    exerciseName: string,
    setData: Omit<SetLog, 'timestamp'>
  ): Promise<{ success: boolean; totalVolume: number; setId: string }> {
    const workoutsPath = path.join(this.dataDir, 'users', userId, 'workouts.json');
    const workouts = await this.readJsonFile<WorkoutSession[]>(workoutsPath, []);
    
    const sessionIndex = workouts.findIndex(w => w.id === sessionId);
    if (sessionIndex === -1) {
      throw new Error('Workout session not found');
    }

    const session = workouts[sessionIndex];
    if (session.status !== "in_progress") {
      throw new Error('Cannot log sets to a completed workout');
    }

    // Find or create exercise entry
    let exercise = session.exercises.find(e => e.exerciseId === exerciseId);
    if (!exercise) {
      exercise = {
        exerciseId,
        exerciseName,
        sets: [],
        restTimes: []
      };
      session.exercises.push(exercise);
    }

    // Add set
    const set: SetLog = {
      ...setData,
      timestamp: new Date().toISOString()
    };
    exercise.sets.push(set);

    // Update total volume
    const setVolume = set.weight * set.reps;
    session.totalVolume += setVolume;

    // Save
    workouts[sessionIndex] = session;
    await this.writeJsonFile(workoutsPath, workouts);

    return {
      success: true,
      totalVolume: session.totalVolume,
      setId: `${sessionId}-${exerciseId}-${set.setNumber}`
    };
  }

  async completeWorkout(
    userId: string, 
    sessionId: string, 
    rating?: number, 
    notes?: string
  ): Promise<{
    duration: number;
    totalVolume: number;
    exerciseCount: number;
    setCount: number;
    caloriesBurned: number;
    personalRecords: string[];
  }> {
    const workoutsPath = path.join(this.dataDir, 'users', userId, 'workouts.json');
    const workouts = await this.readJsonFile<WorkoutSession[]>(workoutsPath, []);
    
    const sessionIndex = workouts.findIndex(w => w.id === sessionId);
    if (sessionIndex === -1) {
      throw new Error('Workout session not found');
    }

    const session = workouts[sessionIndex];
    session.endTime = new Date().toISOString();
    session.status = "completed";
    if (rating) session.rating = rating;
    if (notes) session.notes = notes;

    // Calculate duration in minutes
    const duration = Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60);
    
    // Calculate calories (rough estimate: 5 cal/min + 0.5 cal per kg of volume)
    session.caloriesBurned = Math.round(duration * 5 + session.totalVolume * 0.5);

    // Check for personal records (simplified - just check max weight per exercise)
    const personalRecords: string[] = [];
    for (const exercise of session.exercises) {
      const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
      const previousMax = await this.getExerciseMaxWeight(userId, exercise.exerciseName, sessionId);
      if (maxWeight > previousMax) {
        personalRecords.push(`${exercise.exerciseName}: ${maxWeight}kg`);
      }
    }

    // Save
    workouts[sessionIndex] = session;
    await this.writeJsonFile(workoutsPath, workouts);
    await this.createBackup(userId, 'workouts', workouts);

    return {
      duration,
      totalVolume: session.totalVolume,
      exerciseCount: session.exercises.length,
      setCount: session.exercises.reduce((sum, e) => sum + e.sets.length, 0),
      caloriesBurned: session.caloriesBurned,
      personalRecords
    };
  }

  async getWorkoutSessions(userId: string, filters?: WorkoutFilters): Promise<WorkoutSession[]> {
    const workoutsPath = path.join(this.dataDir, 'users', userId, 'workouts.json');
    const workouts = await this.readJsonFile<WorkoutSession[]>(workoutsPath, []);
    
    // Apply filters
    let filtered = workouts.filter(w => w.status === "completed");
    
    if (filters?.from) {
      filtered = filtered.filter(w => new Date(w.startTime) >= new Date(filters.from!));
    }
    if (filters?.to) {
      filtered = filtered.filter(w => new Date(w.startTime) <= new Date(filters.to!));
    }
    if (filters?.workoutType) {
      filtered = filtered.filter(w => w.workoutType === filters.workoutType);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    // Apply pagination
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    
    return filtered.slice(offset, offset + limit);
  }

  async getActiveWorkoutSession(userId: string): Promise<WorkoutSession | null> {
    const workoutsPath = path.join(this.dataDir, 'users', userId, 'workouts.json');
    const workouts = await this.readJsonFile<WorkoutSession[]>(workoutsPath, []);
    
    return workouts.find(w => w.status === "in_progress") || null;
  }

  // Body Stats Methods
  async logBodyStats(userId: string, stats: Omit<BodyStats, 'id' | 'date'>): Promise<BodyStats> {
    const bodyStats: BodyStats = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      ...stats
    };

    const userDir = await this.ensureUserDir(userId);
    const statsPath = path.join(userDir, 'body-stats.json');
    const allStats = await this.readJsonFile<BodyStats[]>(statsPath, []);
    
    // Check if there's already an entry for today
    const todayIndex = allStats.findIndex(s => s.date === bodyStats.date);
    if (todayIndex >= 0) {
      allStats[todayIndex] = { ...allStats[todayIndex], ...bodyStats };
    } else {
      allStats.push(bodyStats);
    }
    
    await this.writeJsonFile(statsPath, allStats);
    await this.createBackup(userId, 'body-stats', allStats);
    
    return bodyStats;
  }

  async getBodyStats(userId: string, from?: string, to?: string): Promise<BodyStats[]> {
    const statsPath = path.join(this.dataDir, 'users', userId, 'body-stats.json');
    const stats = await this.readJsonFile<BodyStats[]>(statsPath, []);
    
    let filtered = stats;
    if (from) {
      filtered = filtered.filter(s => s.date >= from);
    }
    if (to) {
      filtered = filtered.filter(s => s.date <= to);
    }
    
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }

  async getLatestBodyStats(userId: string): Promise<BodyStats | null> {
    const stats = await this.getBodyStats(userId);
    return stats[0] || null;
  }

  // Goals Methods
  async saveUserGoals(userId: string, goals: UserGoals): Promise<void> {
    const userDir = await this.ensureUserDir(userId);
    const goalsPath = path.join(userDir, 'goals.json');
    await this.writeJsonFile(goalsPath, goals);
  }

  async getUserGoals(userId: string): Promise<UserGoals> {
    const goalsPath = path.join(this.dataDir, 'users', userId, 'goals.json');
    return await this.readJsonFile<UserGoals>(goalsPath, {});
  }

  // Helper Methods
  private async ensureUserDir(userId: string): Promise<string> {
    const userDir = path.join(this.dataDir, 'users', userId);
    await fs.ensureDir(userDir);
    return userDir;
  }

  private async readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return defaultValue;
    }
  }

  private async writeJsonFile(filePath: string, data: any): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  private async createBackup(userId: string, type: string, data: any): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const backupDir = path.join(this.dataDir, 'backup', date, userId);
    await fs.ensureDir(backupDir);
    
    const timestamp = Date.now();
    const backupPath = path.join(backupDir, `${type}-${timestamp}.json`);
    await this.writeJsonFile(backupPath, data);
  }

  private async getExerciseMaxWeight(userId: string, exerciseName: string, excludeSessionId?: string): Promise<number> {
    const workouts = await this.getWorkoutSessions(userId);
    let maxWeight = 0;
    
    for (const workout of workouts) {
      if (workout.id === excludeSessionId) continue;
      
      const exercise = workout.exercises.find(e => e.exerciseName === exerciseName);
      if (exercise) {
        const sessionMax = Math.max(...exercise.sets.map(s => s.weight));
        maxWeight = Math.max(maxWeight, sessionMax);
      }
    }
    
    return maxWeight;
  }

  // Progress Metrics
  async getProgressMetrics(userId: string, period: "1M" | "3M" | "6M" | "1Y" | "ALL"): Promise<{
    muscle: { start: number; current: number; change: number; changePercent: number };
    bodyFat: { start: number; current: number; change: number; changePercent: number };
    strength: { 
      exercises: { [name: string]: { start: number; current: number; change: number; changePercent: number } };
      overall: { changePercent: number };
    };
    consistency: { workoutsPerWeek: number; streak: number; totalWorkouts: number };
  }> {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case "1M": startDate.setMonth(startDate.getMonth() - 1); break;
      case "3M": startDate.setMonth(startDate.getMonth() - 3); break;
      case "6M": startDate.setMonth(startDate.getMonth() - 6); break;
      case "1Y": startDate.setFullYear(startDate.getFullYear() - 1); break;
      case "ALL": startDate.setFullYear(2020); break;
    }

    // Get body stats
    const bodyStats = await this.getBodyStats(userId, startDate.toISOString().split('T')[0]);
    const startStats = bodyStats[bodyStats.length - 1] || null;
    const currentStats = bodyStats[0] || null;

    // Calculate muscle mass changes
    const muscleStart = startStats?.muscleMass || 0;
    const muscleCurrent = currentStats?.muscleMass || muscleStart;
    const muscleChange = muscleCurrent - muscleStart;
    const muscleChangePercent = muscleStart ? (muscleChange / muscleStart) * 100 : 0;

    // Calculate body fat changes
    const fatStart = startStats?.bodyFat || 0;
    const fatCurrent = currentStats?.bodyFat || fatStart;
    const fatChange = fatCurrent - fatStart;
    const fatChangePercent = fatStart ? (fatChange / fatStart) * 100 : 0;

    // Get workout sessions for strength metrics
    const workouts = await this.getWorkoutSessions(userId, {
      from: startDate.toISOString(),
      to: endDate.toISOString()
    });

    // Calculate strength changes per exercise
    const exerciseStrength: { [name: string]: { start: number; current: number; change: number; changePercent: number } } = {};
    const exerciseMaxes: { [name: string]: { first: number; last: number; firstDate: Date; lastDate: Date } } = {};

    // Find first and last max for each exercise
    for (const workout of workouts.reverse()) {
      for (const exercise of workout.exercises) {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
        const workoutDate = new Date(workout.startTime);
        
        if (!exerciseMaxes[exercise.exerciseName]) {
          exerciseMaxes[exercise.exerciseName] = {
            first: maxWeight,
            last: maxWeight,
            firstDate: workoutDate,
            lastDate: workoutDate
          };
        } else {
          exerciseMaxes[exercise.exerciseName].last = maxWeight;
          exerciseMaxes[exercise.exerciseName].lastDate = workoutDate;
        }
      }
    }

    // Calculate strength changes
    let totalStrengthChange = 0;
    let exerciseCount = 0;
    
    for (const [name, data] of Object.entries(exerciseMaxes)) {
      const change = data.last - data.first;
      const changePercent = data.first ? (change / data.first) * 100 : 0;
      
      exerciseStrength[name] = {
        start: data.first,
        current: data.last,
        change,
        changePercent
      };
      
      totalStrengthChange += changePercent;
      exerciseCount++;
    }

    // Calculate consistency metrics
    const totalWorkouts = workouts.length;
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksDiff = Math.max(1, daysDiff / 7);
    const workoutsPerWeek = totalWorkouts / weeksDiff;

    // Calculate current streak (simplified)
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasWorkout = workouts.some(w => 
        w.startTime.split('T')[0] === dateStr
      );
      
      if (hasWorkout) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      muscle: {
        start: muscleStart,
        current: muscleCurrent,
        change: muscleChange,
        changePercent: muscleChangePercent
      },
      bodyFat: {
        start: fatStart,
        current: fatCurrent,
        change: fatChange,
        changePercent: fatChangePercent
      },
      strength: {
        exercises: exerciseStrength,
        overall: {
          changePercent: exerciseCount ? totalStrengthChange / exerciseCount : 0
        }
      },
      consistency: {
        workoutsPerWeek,
        streak,
        totalWorkouts
      }
    };
  }

  // User preferences and guided experience methods
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const preferencesPath = path.join(this.dataDir, 'users', userId, 'preferences.json');
    return await this.readJsonFile<UserPreferences | null>(preferencesPath, null);
  }

  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    const preferencesPath = path.join(this.dataDir, 'users', userId, 'preferences.json');
    await this.writeJsonFile(preferencesPath, preferences);
    await this.createBackup(userId, 'preferences', preferences);
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const achievementsPath = path.join(this.dataDir, 'users', userId, 'achievements.json');
    return await this.readJsonFile<Achievement[]>(achievementsPath, []);
  }

  async saveUserAchievements(userId: string, achievements: Achievement[]): Promise<void> {
    const achievementsPath = path.join(this.dataDir, 'users', userId, 'achievements.json');
    await this.writeJsonFile(achievementsPath, achievements);
    await this.createBackup(userId, 'achievements', achievements);
  }

  async initializeUserAchievements(userId: string): Promise<void> {
    const achievements: Achievement[] = CORE_ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      progress: 0,
      unlockedAt: undefined
    }));
    await this.saveUserAchievements(userId, achievements);
  }

  async checkAndUpdateAchievements(userId: string, workoutSession: WorkoutSession): Promise<Achievement[]> {
    const achievements = await this.getUserAchievements(userId);
    const workouts = await this.getWorkoutSessions(userId);
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of achievements) {
      if (achievement.unlockedAt) continue; // Already unlocked

      let progress = achievement.progress;
      let unlocked = false;

      switch (achievement.id) {
        case 'first_workout':
          if (workoutSession.status === 'completed') {
            progress = 1;
            unlocked = true;
          }
          break;
        
        case 'workout_streak_3':
        case 'workout_streak_7':
          const targetStreak = achievement.id === 'workout_streak_3' ? 3 : 7;
          progress = this.calculateCurrentStreak(workouts);
          unlocked = progress >= targetStreak;
          break;

        case 'first_pr':
          // Check if this workout had any personal records
          const hasNewPR = workoutSession.exercises.some(exercise => 
            exercise.sets.some(set => set.weight > 0) // Simplified PR check
          );
          if (hasNewPR) {
            progress = 1;
            unlocked = true;
          }
          break;

        case 'volume_1000':
          if (workoutSession.totalVolume >= 1000) {
            progress = workoutSession.totalVolume;
            unlocked = true;
          }
          break;

        case 'month_consistent':
          progress = this.calculateMonthlyConsistency(workouts);
          unlocked = progress >= 12;
          break;
      }

      achievement.progress = progress;
      if (unlocked && !achievement.unlockedAt) {
        achievement.unlockedAt = new Date().toISOString();
        newlyUnlocked.push(achievement);
      }
    }

    await this.saveUserAchievements(userId, achievements);
    return newlyUnlocked;
  }

  private calculateCurrentStreak(workouts: WorkoutSession[]): number {
    if (workouts.length === 0) return 0;
    
    const sortedWorkouts = workouts
      .filter(w => w.status === 'completed')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.startTime);
      workoutDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 2) { // Allow for 1 rest day
        streak++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateMonthlyConsistency(workouts: WorkoutSession[]): number {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const recentWorkouts = workouts.filter(w => 
      w.status === 'completed' && 
      new Date(w.startTime) >= thirtyDaysAgo
    );
    
    return recentWorkouts.length;
  }

  async getUserWorkouts(userId: string): Promise<WorkoutSession[]> {
    return this.getWorkoutSessions(userId);
  }

  async trackRecommendationUsage(userId: string, recommendationId: string, used: boolean): Promise<void> {
    const trackingPath = path.join(this.dataDir, 'users', userId, 'recommendation_tracking.json');
    const tracking = await this.readJsonFile<any[]>(trackingPath, []);
    
    tracking.push({
      recommendationId,
      used,
      timestamp: new Date().toISOString()
    });
    
    await this.writeJsonFile(trackingPath, tracking);
  }
}

// Export singleton instance
export const fileStorage = new FileStorage();