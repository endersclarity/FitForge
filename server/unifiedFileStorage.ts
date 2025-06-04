/**
 * Enhanced FileStorage Service with Unified Storage Schema
 * 
 * This service implements the unified storage architecture to eliminate
 * the dual storage system and provide a single source of truth for
 * workout data, progress analytics, and real-time logging.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  UnifiedWorkoutSession,
  UserWorkoutData,
  WorkoutExercise,
  SetData,
  SetLogEvent,
  SessionEvent,
  UnifiedWorkoutSessionSchema,
  UserWorkoutDataSchema,
  convertWorkoutLogToSession,
  convertLegacySessionToUnified
} from '../shared/unified-storage-schema';

export interface UnifiedFilters {
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
  workoutType?: string;
  sessionType?: 'active' | 'completed' | 'abandoned';
}

export class UnifiedFileStorage {
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.join(process.cwd(), 'data');
  }

  async initialize(): Promise<void> {
    await fs.ensureDir(this.dataDir);
    await fs.ensureDir(path.join(this.dataDir, 'users'));
    await fs.ensureDir(path.join(this.dataDir, 'backup'));
    await fs.ensureDir(path.join(this.dataDir, 'migration'));
  }

  // ============================================================================
  // CORE UNIFIED STORAGE METHODS
  // ============================================================================

  /**
   * Get complete user workout data in unified format
   */
  async getUserWorkoutData(userId: string): Promise<UserWorkoutData> {
    const dataPath = path.join(this.dataDir, 'users', userId, 'unified-workouts.json');
    const defaultData: UserWorkoutData = {
      userId,
      lastUpdated: new Date().toISOString(),
      sessions: [],
      aggregations: {
        totalWorkouts: 0,
        totalVolume: 0,
        totalCalories: 0,
        totalDuration: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageWorkoutsPerWeek: 0,
        strongestMuscleGroups: [],
        personalRecordCount: 0
      }
    };

    try {
      const rawData = await this.readJsonFile<UserWorkoutData>(dataPath, defaultData);
      return UserWorkoutDataSchema.parse(rawData);
    } catch (error) {
      console.warn(`Error reading unified workout data for user ${userId}:`, error);
      return defaultData;
    }
  }

  /**
   * Save complete user workout data in unified format
   */
  async saveUserWorkoutData(userData: UserWorkoutData): Promise<void> {
    const validatedData = UserWorkoutDataSchema.parse(userData);
    validatedData.lastUpdated = new Date().toISOString();

    const dataPath = path.join(this.dataDir, 'users', validatedData.userId, 'unified-workouts.json');
    await this.ensureUserDir(validatedData.userId);
    await this.writeJsonFile(dataPath, validatedData);
    await this.createBackup(validatedData.userId, 'unified-workouts', validatedData);
  }

  // ============================================================================
  // WORKOUT SESSION LIFECYCLE
  // ============================================================================

  /**
   * Create a new workout session in unified format
   */
  async createUnifiedWorkoutSession(
    userId: string, 
    workoutType: string, 
    plannedExercises?: string[]
  ): Promise<UnifiedWorkoutSession> {
    const session: UnifiedWorkoutSession = {
      id: uuidv4(),
      userId,
      sessionType: 'active',
      startTime: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      workoutType,
      exercises: [],
      plannedExercises,
      totalVolume: 0,
      totalDuration: 0,
      caloriesBurned: 0,
      personalRecords: [],
      progressMetrics: {
        totalSets: 0,
        totalExercises: 0,
        muscleGroupsTargeted: []
      }
    };

    const validatedSession = UnifiedWorkoutSessionSchema.parse(session);
    
    // Check for existing active session
    const userData = await this.getUserWorkoutData(userId);
    const existingActive = userData.sessions.find(s => s.sessionType === 'active');
    if (existingActive) {
      throw new Error(`Active session already exists: ${existingActive.id}`);
    }

    // Add to user data
    userData.sessions.unshift(validatedSession);
    await this.saveUserWorkoutData(userData);

    // Log session event
    await this.logSessionEvent(userId, validatedSession.id, 'created');

    return validatedSession;
  }

  /**
   * Log a set with immediate persistence to unified storage
   */
  async logSetToUnifiedStorage(
    userId: string,
    sessionId: string,
    exerciseId: number,
    exerciseName: string,
    setData: Omit<SetData, 'timestamp' | 'volume'>
  ): Promise<{ success: boolean; totalVolume: number; setId: string }> {
    const userData = await this.getUserWorkoutData(userId);
    const sessionIndex = userData.sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new Error('Workout session not found');
    }

    const session = userData.sessions[sessionIndex];
    if (session.sessionType !== 'active') {
      throw new Error('Cannot log sets to inactive session');
    }

    // Find or create exercise
    let exercise = session.exercises.find(e => e.exerciseId === exerciseId.toString());
    if (!exercise) {
      exercise = {
        exerciseId: exerciseId.toString(),
        exerciseName,
        muscleGroups: this.mapExerciseToMuscleGroups(exerciseName), // Auto-populate muscle groups
        exerciseOrder: session.exercises.length + 1,
        sets: [],
        targetSets: 3,
        targetReps: 8,
        restTimeSeconds: 60,
        personalRecord: false
      };
      session.exercises.push(exercise);
    }

    // Create complete set data
    const completeSet: SetData = {
      ...setData,
      timestamp: new Date().toISOString(),
      volume: setData.weight * setData.reps
    };

    // Add set to exercise
    exercise.sets.push(completeSet);

    // Update session metrics
    session.totalVolume += completeSet.volume;
    session.lastModified = new Date().toISOString();
    
    // Update exercise-level metrics
    exercise.formScore = exercise.sets.reduce((sum, set) => sum + (set.formScore || 8), 0) / exercise.sets.length;

    // Update session progress metrics
    session.progressMetrics = {
      totalSets: session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
      totalExercises: session.exercises.length,
      muscleGroupsTargeted: Array.from(new Set(session.exercises.flatMap(ex => ex.muscleGroups || [])))
    };

    // Save immediately
    await this.saveUserWorkoutData(userData);

    // Log set event
    await this.logSetEvent(userId, sessionId, exerciseId, exerciseName, completeSet);

    const setId = `${sessionId}-${exerciseId}-${completeSet.setNumber}`;
    return {
      success: true,
      totalVolume: session.totalVolume,
      setId
    };
  }

  /**
   * Complete workout session with analytics and personal records
   */
  async completeUnifiedWorkoutSession(
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
    personalRecords: Array<{ exerciseName: string; recordType: string; newValue: number; improvementPercentage: number }>;
  }> {
    const userData = await this.getUserWorkoutData(userId);
    const sessionIndex = userData.sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new Error('Workout session not found');
    }

    const session = userData.sessions[sessionIndex];
    if (session.sessionType !== 'active') {
      throw new Error('Session is not active');
    }

    // Complete session
    session.sessionType = 'completed';
    session.endTime = new Date().toISOString();
    session.lastModified = new Date().toISOString();
    session.rating = rating;
    session.notes = notes;

    // Calculate duration
    const durationMs = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
    session.totalDuration = Math.round(durationMs / 1000 / 60); // minutes

    // Calculate calories (enhanced formula)
    session.caloriesBurned = Math.round(session.totalDuration * 5.5 + session.totalVolume * 0.1);

    // Check for personal records
    const personalRecords = await this.checkPersonalRecords(userData, session);
    session.personalRecords = personalRecords;

    // Update progressive overload data for each exercise
    await this.updateProgressiveOverloadData(userData, session);

    // Calculate session averages
    if (session.exercises.length > 0) {
      session.averageFormScore = session.exercises.reduce((sum, ex) => sum + (ex.formScore || 8), 0) / session.exercises.length;
      session.averageRPE = session.exercises.reduce((sum, ex) => {
        const avgRPE = ex.sets.reduce((setSum, set) => setSum + (set.rpe || 7), 0) / ex.sets.length;
        return sum + avgRPE;
      }, 0) / session.exercises.length;
    }

    // Update user aggregations
    await this.updateUserAggregations(userData);

    // Save all changes
    await this.saveUserWorkoutData(userData);

    // Log completion event
    await this.logSessionEvent(userId, sessionId, 'completed');

    return {
      duration: session.totalDuration,
      totalVolume: session.totalVolume,
      exerciseCount: session.exercises.length,
      setCount: session.progressMetrics?.totalSets || 0,
      caloriesBurned: session.caloriesBurned,
      personalRecords: personalRecords.map(pr => ({
        exerciseName: pr.exerciseName,
        recordType: pr.recordType,
        newValue: pr.newValue,
        improvementPercentage: pr.improvementPercentage
      }))
    };
  }

  // ============================================================================
  // QUERY AND RETRIEVAL METHODS
  // ============================================================================

  /**
   * Get workout sessions with filtering
   */
  async getUnifiedWorkoutSessions(userId: string, filters?: UnifiedFilters): Promise<UnifiedWorkoutSession[]> {
    const userData = await this.getUserWorkoutData(userId);
    let sessions = [...userData.sessions];

    // Apply filters
    if (filters?.sessionType) {
      sessions = sessions.filter(s => s.sessionType === filters.sessionType);
    }
    if (filters?.workoutType) {
      sessions = sessions.filter(s => s.workoutType === filters.workoutType);
    }
    if (filters?.from) {
      sessions = sessions.filter(s => new Date(s.startTime) >= new Date(filters.from!));
    }
    if (filters?.to) {
      sessions = sessions.filter(s => new Date(s.startTime) <= new Date(filters.to!));
    }

    // Sort by start time (newest first)
    sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    // Apply pagination
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    
    return sessions.slice(offset, offset + limit);
  }

  /**
   * Get active workout session
   */
  async getActiveUnifiedSession(userId: string): Promise<UnifiedWorkoutSession | null> {
    const userData = await this.getUserWorkoutData(userId);
    return userData.sessions.find(s => s.sessionType === 'active') || null;
  }

  /**
   * Get user aggregations for dashboard
   */
  async getUserAggregations(userId: string): Promise<UserWorkoutData['aggregations']> {
    const userData = await this.getUserWorkoutData(userId);
    return userData.aggregations;
  }

  // ============================================================================
  // MIGRATION AND COMPATIBILITY
  // ============================================================================

  /**
   * Migrate existing data to unified format
   */
  async migrateToUnifiedStorage(userId: string): Promise<{ 
    migratedSessions: number; 
    migratedLogs: number; 
    errors: string[] 
  }> {
    const errors: string[] = [];
    let migratedSessions = 0;
    let migratedLogs = 0;

    try {
      // Initialize unified storage
      const userData: UserWorkoutData = {
        userId,
        lastUpdated: new Date().toISOString(),
        sessions: []
      };

      // Migrate legacy structured sessions
      try {
        const legacyPath = path.join(this.dataDir, 'users', userId, 'workouts.json');
        const legacySessions = await this.readJsonFile<any[]>(legacyPath, []);
        
        for (const legacySession of legacySessions) {
          try {
            const unifiedSession = convertLegacySessionToUnified(legacySession);
            const validatedSession = UnifiedWorkoutSessionSchema.parse(unifiedSession);
            userData.sessions.push(validatedSession);
            migratedSessions++;
          } catch (error) {
            errors.push(`Failed to migrate session ${legacySession.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to read legacy sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Migrate simple workout logs
      try {
        const logsPath = path.join(this.dataDir, 'workout-logs');
        const logFiles = await fs.readdir(logsPath).catch(() => []);
        
        for (const file of logFiles) {
          if (!file.endsWith('.json')) continue;
          
          try {
            const filePath = path.join(logsPath, file);
            const logs = await this.readJsonFile<any[]>(filePath, []);
            
            // Group logs by session ID
            const sessionGroups = new Map<string, any[]>();
            logs.forEach(log => {
              if (!sessionGroups.has(log.sessionId)) {
                sessionGroups.set(log.sessionId, []);
              }
              sessionGroups.get(log.sessionId)!.push(log);
            });

            // Convert each session group
            for (const [sessionId, sessionLogs] of Array.from(sessionGroups.entries())) {
              try {
                const unifiedSession = convertWorkoutLogToSession(sessionLogs, sessionId, userId);
                if (unifiedSession.exercises && unifiedSession.exercises.length > 0) {
                  const validatedSession = UnifiedWorkoutSessionSchema.parse(unifiedSession);
                  userData.sessions.push(validatedSession);
                  migratedLogs++;
                }
              } catch (error) {
                errors.push(`Failed to migrate log session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          } catch (error) {
            errors.push(`Failed to process log file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to migrate workout logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Sort sessions by date and remove duplicates
      userData.sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      
      // Remove duplicates based on start time and workout type
      const uniqueSessions = new Map<string, UnifiedWorkoutSession>();
      userData.sessions.forEach(session => {
        const key = `${session.startTime}-${session.workoutType}`;
        if (!uniqueSessions.has(key)) {
          uniqueSessions.set(key, session);
        }
      });
      userData.sessions = Array.from(uniqueSessions.values());

      // Update aggregations
      await this.updateUserAggregations(userData);

      // Save unified data
      await this.saveUserWorkoutData(userData);

      // Create migration backup
      const migrationData = {
        timestamp: new Date().toISOString(),
        userId,
        migratedSessions,
        migratedLogs,
        errors,
        totalUnifiedSessions: userData.sessions.length
      };
      
      const migrationPath = path.join(this.dataDir, 'migration', `${userId}-migration-${Date.now()}.json`);
      await fs.ensureDir(path.dirname(migrationPath));
      await this.writeJsonFile(migrationPath, migrationData);

      return { migratedSessions, migratedLogs, errors };
    } catch (error) {
      errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { migratedSessions, migratedLogs, errors };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async checkPersonalRecords(
    userData: UserWorkoutData, 
    currentSession: UnifiedWorkoutSession
  ): Promise<UnifiedWorkoutSession['personalRecords']> {
    const personalRecords: UnifiedWorkoutSession['personalRecords'] = [];
    
    for (const exercise of currentSession.exercises) {
      const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
      const totalVolume = exercise.sets.reduce((sum, set) => sum + set.volume, 0);
      
      // Find previous best for this exercise
      let previousBestWeight = 0;
      let previousBestVolume = 0;
      
      for (const session of userData.sessions) {
        if (session.id === currentSession.id || session.sessionType !== 'completed') continue;
        
        const previousExercise = session.exercises.find(e => e.exerciseName === exercise.exerciseName);
        if (previousExercise) {
          const sessionMaxWeight = Math.max(...previousExercise.sets.map(s => s.weight));
          const sessionVolume = previousExercise.sets.reduce((sum, set) => sum + set.volume, 0);
          
          if (sessionMaxWeight > previousBestWeight) {
            previousBestWeight = sessionMaxWeight;
          }
          if (sessionVolume > previousBestVolume) {
            previousBestVolume = sessionVolume;
          }
        }
      }
      
      // Check for weight PR
      if (maxWeight > previousBestWeight && previousBestWeight > 0) {
        personalRecords.push({
          exerciseName: exercise.exerciseName,
          recordType: 'weight',
          previousValue: previousBestWeight,
          newValue: maxWeight,
          improvementPercentage: ((maxWeight - previousBestWeight) / previousBestWeight) * 100
        });
      }
      
      // Check for volume PR
      if (totalVolume > previousBestVolume && previousBestVolume > 0) {
        personalRecords.push({
          exerciseName: exercise.exerciseName,
          recordType: 'volume',
          previousValue: previousBestVolume,
          newValue: totalVolume,
          improvementPercentage: ((totalVolume - previousBestVolume) / previousBestVolume) * 100
        });
      }
    }
    
    return personalRecords;
  }

  private async updateProgressiveOverloadData(
    userData: UserWorkoutData,
    currentSession: UnifiedWorkoutSession
  ): Promise<void> {
    for (const exercise of currentSession.exercises) {
      // Find the most recent previous session with this exercise
      let previousSession: UnifiedWorkoutSession | null = null;
      for (const session of userData.sessions) {
        if (session.id === currentSession.id || session.sessionType !== 'completed') continue;
        
        const hasExercise = session.exercises.some(e => e.exerciseName === exercise.exerciseName);
        if (hasExercise) {
          previousSession = session;
          break;
        }
      }
      
      if (previousSession) {
        const previousExercise = previousSession.exercises.find(e => e.exerciseName === exercise.exerciseName)!;
        const previousBestWeight = Math.max(...previousExercise.sets.map(s => s.weight));
        const previousBestVolume = previousExercise.sets.reduce((sum, set) => sum + set.volume, 0);
        const currentBestWeight = Math.max(...exercise.sets.map(s => s.weight));
        const currentVolume = exercise.sets.reduce((sum, set) => sum + set.volume, 0);
        
        exercise.progressiveOverload = {
          previousBestWeight,
          previousBestVolume,
          recommendedWeight: Math.ceil(previousBestWeight * 1.03), // 3% increase
          recommendedReps: Math.ceil(exercise.targetReps || 8),
          progressPercentage: previousBestWeight ? ((currentBestWeight - previousBestWeight) / previousBestWeight) * 100 : 0
        };
      }
    }
  }

  private async updateUserAggregations(userData: UserWorkoutData): Promise<void> {
    const completedSessions = userData.sessions.filter(s => s.sessionType === 'completed');
    
    userData.aggregations = {
      totalWorkouts: completedSessions.length,
      totalVolume: completedSessions.reduce((sum, s) => sum + s.totalVolume, 0),
      totalCalories: completedSessions.reduce((sum, s) => sum + s.caloriesBurned, 0),
      totalDuration: completedSessions.reduce((sum, s) => sum + s.totalDuration, 0),
      currentStreak: this.calculateStreak(completedSessions),
      longestStreak: this.calculateLongestStreak(completedSessions),
      averageWorkoutsPerWeek: this.calculateAverageWorkoutsPerWeek(completedSessions),
      lastWorkoutDate: completedSessions[0]?.endTime,
      favoriteWorkoutType: this.getFavoriteWorkoutType(completedSessions),
      strongestMuscleGroups: this.getStrongestMuscleGroups(completedSessions),
      personalRecordCount: completedSessions.reduce((sum, s) => sum + s.personalRecords.length, 0)
    };
  }

  private calculateStreak(sessions: UnifiedWorkoutSession[]): number {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = sessions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].startTime);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak || (streak === 0 && daysDiff <= 1)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateLongestStreak(sessions: UnifiedWorkoutSession[]): number {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = sessions.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      
      if (!lastDate) {
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor((sessionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 2) { // Allow 1 rest day
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      }
      
      lastDate = sessionDate;
    }
    
    return Math.max(maxStreak, currentStreak);
  }

  private calculateAverageWorkoutsPerWeek(sessions: UnifiedWorkoutSession[]): number {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = sessions.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    const firstSession = new Date(sortedSessions[0].startTime);
    const lastSession = new Date(sortedSessions[sortedSessions.length - 1].startTime);
    const daysDiff = Math.ceil((lastSession.getTime() - firstSession.getTime()) / (1000 * 60 * 60 * 24));
    const weeksDiff = Math.max(1, daysDiff / 7);
    
    return sessions.length / weeksDiff;
  }

  private getFavoriteWorkoutType(sessions: UnifiedWorkoutSession[]): string | undefined {
    if (sessions.length === 0) return undefined;
    
    const workoutTypeCounts = new Map<string, number>();
    sessions.forEach(session => {
      const count = workoutTypeCounts.get(session.workoutType) || 0;
      workoutTypeCounts.set(session.workoutType, count + 1);
    });
    
    let maxCount = 0;
    let favorite: string | undefined;
    
    for (const [type, count] of Array.from(workoutTypeCounts.entries())) {
      if (count > maxCount) {
        maxCount = count;
        favorite = type;
      }
    }
    
    return favorite;
  }

  private getStrongestMuscleGroups(sessions: UnifiedWorkoutSession[]): string[] {
    const muscleGroupVolumes = new Map<string, number>();
    
    sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        const exerciseVolume = exercise.sets.reduce((sum, set) => sum + set.volume, 0);
        (exercise.muscleGroups || []).forEach(muscle => {
          const currentVolume = muscleGroupVolumes.get(muscle) || 0;
          muscleGroupVolumes.set(muscle, currentVolume + exerciseVolume);
        });
      });
    });
    
    return Array.from(muscleGroupVolumes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([muscle]) => muscle);
  }

  private async logSetEvent(
    userId: string,
    sessionId: string,
    exerciseId: number,
    exerciseName: string,
    setData: SetData
  ): Promise<void> {
    const event: SetLogEvent = {
      sessionId,
      exerciseId: exerciseId.toString(),
      exerciseName,
      setData,
      timestamp: new Date().toISOString(),
      userId
    };
    
    // Optional: Store set events for debugging/analytics
    const eventsPath = path.join(this.dataDir, 'users', userId, 'set-events.json');
    const events = await this.readJsonFile<SetLogEvent[]>(eventsPath, []);
    events.push(event);
    
    // Keep only last 1000 events to prevent unbounded growth
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }
    
    await this.writeJsonFile(eventsPath, events);
  }

  private async logSessionEvent(
    userId: string,
    sessionId: string,
    eventType: SessionEvent['eventType'],
    data?: any
  ): Promise<void> {
    const event: SessionEvent = {
      sessionId,
      userId,
      eventType,
      timestamp: new Date().toISOString(),
      data
    };
    
    // Optional: Store session events for debugging/analytics
    const eventsPath = path.join(this.dataDir, 'users', userId, 'session-events.json');
    const events = await this.readJsonFile<SessionEvent[]>(eventsPath, []);
    events.push(event);
    
    // Keep only last 500 events
    if (events.length > 500) {
      events.splice(0, events.length - 500);
    }
    
    await this.writeJsonFile(eventsPath, events);
  }

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
    await fs.ensureDir(path.dirname(filePath));
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

  // ============================================================================
  // SESSION MANAGEMENT AND CLEANUP
  // ============================================================================

  /**
   * Force abandon a specific session
   */
  async forceAbandonSession(userId: string, sessionId: string): Promise<void> {
    const userData = await this.getUserWorkoutData(userId);
    const sessionIndex = userData.sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new Error('Workout session not found');
    }

    const session = userData.sessions[sessionIndex];
    session.sessionType = 'abandoned';
    session.endTime = new Date().toISOString();
    session.lastModified = new Date().toISOString();

    await this.saveUserWorkoutData(userData);
    await this.logSessionEvent(userId, sessionId, 'abandoned');
  }

  /**
   * Cleanup old sessions based on age threshold
   */
  async cleanupOldSessions(userId: string, maxAgeHours: number = 24): Promise<number> {
    const userData = await this.getUserWorkoutData(userId);
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    
    let cleanedCount = 0;
    const sessionsBefore = userData.sessions.length;

    // Find sessions to abandon
    userData.sessions.forEach(session => {
      if (session.sessionType === 'active') {
        const sessionAge = now - new Date(session.startTime).getTime();
        if (sessionAge > maxAgeMs) {
          session.sessionType = 'abandoned';
          session.endTime = new Date().toISOString();
          session.lastModified = new Date().toISOString();
          cleanedCount++;
        }
      }
    });

    if (cleanedCount > 0) {
      await this.saveUserWorkoutData(userData);
      
      // Log cleanup events
      const abandonedSessions = userData.sessions.filter(s => 
        s.sessionType === 'abandoned' && 
        new Date(s.lastModified!).getTime() > (now - 5000) // Within last 5 seconds
      );
      
      for (const session of abandonedSessions) {
        await this.logSessionEvent(userId, session.id, 'abandoned');
      }
    }

    return cleanedCount;
  }

  // ============================================================================
  // MUSCLE MAPPING UTILITIES
  // ============================================================================

  /**
   * Exercise to muscle group mapping for automatic muscle group population
   */
  private static readonly EXERCISE_TO_MUSCLE_MAPPING: Record<string, string[]> = {
    // Chest exercises
    'bench press': ['chest', 'triceps', 'shoulders'],
    'incline bench press': ['chest', 'shoulders', 'triceps'],
    'decline bench press': ['chest', 'triceps'],
    'push ups': ['chest', 'triceps', 'shoulders'],
    'dumbbell press': ['chest', 'triceps', 'shoulders'],
    'chest fly': ['chest'],
    'dips': ['chest', 'triceps'],

    // Back exercises
    'pull ups': ['back', 'biceps'],
    'chin ups': ['back', 'biceps'],
    'rows': ['back', 'biceps'],
    'bent over row': ['back', 'biceps'],
    'lat pulldown': ['back', 'biceps'],
    'deadlift': ['back', 'hamstrings', 'glutes'],
    't-bar row': ['back', 'biceps'],

    // Shoulders
    'overhead press': ['shoulders', 'triceps'],
    'shoulder press': ['shoulders', 'triceps'],
    'lateral raises': ['shoulders'],
    'front raises': ['shoulders'],
    'rear delt fly': ['shoulders', 'back'],
    'upright row': ['shoulders', 'back'],

    // Arms
    'bicep curls': ['biceps'],
    'hammer curls': ['biceps'],
    'tricep extension': ['triceps'],
    'tricep pushdown': ['triceps'],
    'close grip bench': ['triceps', 'chest'],

    // Legs
    'squats': ['quadriceps', 'glutes'],
    'leg press': ['quadriceps', 'glutes'],
    'lunges': ['quadriceps', 'glutes'],
    'leg extension': ['quadriceps'],
    'leg curls': ['hamstrings'],
    'calf raises': ['calves'],
    'hip thrust': ['glutes', 'hamstrings'],

    // Core
    'plank': ['abs'],
    'crunches': ['abs'],
    'sit ups': ['abs'],
    'russian twists': ['abs'],
    'leg raises': ['abs'],
    'hanging knee raises': ['abs'],
    'knee raises': ['abs'],

    // Compound movements
    'burpees': ['chest', 'quadriceps', 'abs', 'shoulders'],
    'mountain climbers': ['abs', 'quadriceps', 'shoulders'],
    'thrusters': ['shoulders', 'quadriceps', 'glutes']
  };

  /**
   * Map exercise name to muscle groups using fuzzy matching
   */
  private mapExerciseToMuscleGroups(exerciseName: string): string[] {
    const searchName = exerciseName.toLowerCase();
    
    // First try exact matches
    for (const [exerciseKey, muscles] of Object.entries(UnifiedFileStorage.EXERCISE_TO_MUSCLE_MAPPING)) {
      if (searchName.includes(exerciseKey) || exerciseKey.includes(searchName)) {
        return muscles;
      }
    }
    
    // If no match found, try to infer from common exercise patterns
    if (searchName.includes('press') && (searchName.includes('bench') || searchName.includes('chest'))) {
      return ['chest', 'triceps', 'shoulders'];
    }
    if (searchName.includes('pull') || searchName.includes('row')) {
      return ['back', 'biceps'];
    }
    if (searchName.includes('squat') || searchName.includes('leg')) {
      return ['quadriceps', 'glutes'];
    }
    if (searchName.includes('curl') && searchName.includes('bicep')) {
      return ['biceps'];
    }
    if (searchName.includes('press') && searchName.includes('shoulder')) {
      return ['shoulders', 'triceps'];
    }
    
    // Default fallback - return empty array if no mapping found
    console.warn(`No muscle mapping found for exercise: ${exerciseName}`);
    return [];
  }
}

// Export singleton instance
export const unifiedFileStorage = new UnifiedFileStorage();