/**
 * Offline Storage Service
 * Local storage abstraction for workout data with background sync capability
 */

export interface OfflineWorkoutSession {
  id: string;
  startTime: string;
  workoutType: string;
  exercises: OfflineExerciseData[];
  totalDuration?: number;
  caloriesBurned?: number;
  formScore?: number;
  notes?: string;
  isCompleted: boolean;
  lastSyncAttempt?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  version: number; // For future schema migrations
}

export interface OfflineExerciseData {
  exerciseId: number;
  exerciseName: string;
  sets: OfflineSetData[];
  targetReps: number;
  targetSets: number;
}

export interface OfflineSetData {
  setNumber: number;
  weight: number;
  reps: number;
  equipment?: string;
  formScore?: number;
  notes?: string;
  rpe?: number;
  restTime?: number;
  completed: boolean;
  timestamp: string;
}

export interface StartWorkoutData {
  workoutType: string;
  plannedExercises?: string[];
}

export interface LogSetData {
  sessionId: string;
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  equipment?: string;
  formScore?: number;
  notes?: string;
  rpe?: number;
  restTime?: number;
}

export interface CompleteWorkoutData {
  sessionId: string;
  rating?: number;
  notes?: string;
}

export interface AbandonWorkoutData {
  sessionId: string;
  reason?: string;
}

type SyncQueueData = StartWorkoutData | LogSetData | CompleteWorkoutData | AbandonWorkoutData;

export interface SyncQueueItem {
  id: string;
  type: 'START_WORKOUT' | 'LOG_SET' | 'COMPLETE_WORKOUT' | 'ABANDON_WORKOUT';
  data: SyncQueueData;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineStorageService {
  private readonly STORAGE_KEYS = {
    ACTIVE_SESSION: 'fitforge_active_session',
    SESSION_HISTORY: 'fitforge_session_history',
    SYNC_QUEUE: 'fitforge_sync_queue',
    LAST_SYNC: 'fitforge_last_sync',
    USER_PREFERENCES: 'fitforge_user_preferences'
  };

  private readonly CURRENT_VERSION = 1;

  /**
   * Get the current active workout session
   */
  getActiveSession(): OfflineWorkoutSession | null {
    try {
      const sessionData = localStorage.getItem(this.STORAGE_KEYS.ACTIVE_SESSION);
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData) as OfflineWorkoutSession;
      
      // Validate session data
      if (!session.id || !session.startTime) {
        console.warn('Invalid session data found, clearing');
        this.clearActiveSession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Error reading active session:', error);
      this.clearActiveSession();
      return null;
    }
  }

  /**
   * Save/update the active workout session
   */
  saveActiveSession(session: OfflineWorkoutSession): boolean {
    try {
      // Ensure version is set
      session.version = session.version || this.CURRENT_VERSION;
      
      localStorage.setItem(this.STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
      
      // Update session history as well
      this.addToSessionHistory(session);
      
      return true;
    } catch (error) {
      console.error('Error saving active session:', error);
      return false;
    }
  }

  /**
   * Clear the active session
   */
  clearActiveSession(): void {
    localStorage.removeItem(this.STORAGE_KEYS.ACTIVE_SESSION);
  }

  /**
   * Start a new workout session (offline-first)
   */
  startWorkoutSession(workoutType: string, plannedExercises?: string[]): OfflineWorkoutSession {
    const session: OfflineWorkoutSession = {
      id: this.generateSessionId(),
      startTime: new Date().toISOString(),
      workoutType,
      exercises: [],
      isCompleted: false,
      syncStatus: 'pending',
      version: this.CURRENT_VERSION
    };

    // Save locally immediately
    this.saveActiveSession(session);

    // Add to sync queue for background upload
    this.addToSyncQueue({
      id: `start_${session.id}`,
      type: 'START_WORKOUT',
      data: { workoutType, plannedExercises },
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    });

    return session;
  }

  /**
   * Log a set to the current session (offline-first)
   */
  logSet(
    exerciseId: number,
    exerciseName: string,
    setData: Omit<OfflineSetData, 'timestamp' | 'completed'>
  ): boolean {
    const session = this.getActiveSession();
    if (!session) {
      console.error('No active session to log set to');
      return false;
    }

    // Find or create exercise entry
    let exercise = session.exercises.find(ex => ex.exerciseId === exerciseId);
    if (!exercise) {
      exercise = {
        exerciseId,
        exerciseName,
        sets: [],
        targetReps: 8, // Default, should be configurable
        targetSets: 3  // Default, should be configurable
      };
      session.exercises.push(exercise);
    }

    // Add the set
    const newSet: OfflineSetData = {
      ...setData,
      timestamp: new Date().toISOString(),
      completed: true
    };

    exercise.sets.push(newSet);

    // Save locally immediately
    this.saveActiveSession(session);

    // Add to sync queue
    this.addToSyncQueue({
      id: `set_${session.id}_${exerciseId}_${newSet.setNumber}`,
      type: 'LOG_SET',
      data: {
        sessionId: session.id,
        exerciseId,
        exerciseName,
        ...setData
      },
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    });

    return true;
  }

  /**
   * Complete the current workout session
   */
  completeWorkoutSession(rating?: number, notes?: string): boolean {
    const session = this.getActiveSession();
    if (!session) {
      console.error('No active session to complete');
      return false;
    }

    // Update session
    session.isCompleted = true;
    session.notes = notes;
    session.totalDuration = this.calculateSessionDuration(session);
    session.caloriesBurned = this.estimateCaloriesBurned(session);
    session.formScore = this.calculateAverageFormScore(session);

    // Save locally
    this.saveActiveSession(session);

    // Add to sync queue
    this.addToSyncQueue({
      id: `complete_${session.id}`,
      type: 'COMPLETE_WORKOUT',
      data: {
        sessionId: session.id,
        rating,
        notes
      },
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    });

    // Clear active session after completion
    this.clearActiveSession();

    return true;
  }

  /**
   * Get session history from local storage
   */
  getSessionHistory(limit: number = 10): OfflineWorkoutSession[] {
    try {
      const historyData = localStorage.getItem(this.STORAGE_KEYS.SESSION_HISTORY);
      if (!historyData) return [];
      
      const history = JSON.parse(historyData) as OfflineWorkoutSession[];
      
      return history
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error reading session history:', error);
      return [];
    }
  }

  /**
   * Add session to history
   */
  private addToSessionHistory(session: OfflineWorkoutSession): void {
    try {
      const history = this.getSessionHistory(50); // Keep last 50 sessions
      
      // Remove existing session if it exists
      const filteredHistory = history.filter(s => s.id !== session.id);
      
      // Add current session
      filteredHistory.unshift(session);
      
      // Keep only the most recent sessions
      const trimmedHistory = filteredHistory.slice(0, 50);
      
      localStorage.setItem(this.STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error updating session history:', error);
    }
  }

  /**
   * Sync queue management
   */
  addToSyncQueue(item: SyncQueueItem): void {
    try {
      const queue = this.getSyncQueue();
      
      // Remove any existing item with the same ID
      const filteredQueue = queue.filter(q => q.id !== item.id);
      
      filteredQueue.push(item);
      
      localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filteredQueue));
      
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  getSyncQueue(): SyncQueueItem[] {
    try {
      const queueData = localStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE);
      if (!queueData) return [];
      
      return JSON.parse(queueData) as SyncQueueItem[];
    } catch (error) {
      console.error('Error reading sync queue:', error);
      return [];
    }
  }

  removeFromSyncQueue(itemId: string): void {
    try {
      const queue = this.getSyncQueue();
      const filteredQueue = queue.filter(q => q.id !== itemId);
      
      localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error('Error removing from sync queue:', error);
    }
  }

  /**
   * Clear corrupted sync queue items (emergency cleanup)
   */
  clearCorruptedSyncItems(): void {
    try {
      const queue = this.getSyncQueue();
      const originalLength = queue.length;
      
      // Remove items containing the known corrupted session ID
      const cleanQueue = queue.filter(item => 
        !item.id.includes('session_1748626935840_z2vi8nw1d') &&
        !JSON.stringify(item.data).includes('session_1748626935840_z2vi8nw1d')
      );
      
      localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(cleanQueue));
    } catch (error) {
      console.error('Error clearing corrupted sync items:', error);
    }
  }

  /**
   * Utility methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateSessionDuration(session: OfflineWorkoutSession): number {
    const start = new Date(session.startTime).getTime();
    const end = Date.now();
    return Math.round((end - start) / 1000 / 60); // Duration in minutes
  }

  private estimateCaloriesBurned(session: OfflineWorkoutSession): number {
    // Simple estimation: 5 calories per set, 10 calories per minute
    const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const duration = this.calculateSessionDuration(session);
    
    return Math.round(totalSets * 5 + duration * 10);
  }

  private calculateAverageFormScore(session: OfflineWorkoutSession): number {
    const allSets = session.exercises.flatMap(ex => ex.sets);
    const formScores = allSets.map(set => set.formScore || 8).filter(score => score > 0);
    
    if (formScores.length === 0) return 8;
    
    return Math.round(formScores.reduce((sum, score) => sum + score, 0) / formScores.length);
  }

  /**
   * Data management utilities
   */
  getStorageUsage(): { used: number; available: number; percentage: number } {
    let totalSize = 0;
    
    for (const key in localStorage) {
      if (key.startsWith('fitforge_')) {
        totalSize += localStorage[key].length;
      }
    }
    
    // Rough estimate of available space (5MB typical limit)
    const availableSpace = 5 * 1024 * 1024; // 5MB in bytes
    const usedSpace = totalSize * 2; // Rough estimate (UTF-16 encoding)
    
    return {
      used: usedSpace,
      available: availableSpace,
      percentage: (usedSpace / availableSpace) * 100
    };
  }

  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Backup and restore functionality
   */
  exportData(): string {
    const data = {
      activeSession: this.getActiveSession(),
      sessionHistory: this.getSessionHistory(100),
      syncQueue: this.getSyncQueue(),
      lastSync: localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC),
      exportDate: new Date().toISOString(),
      version: this.CURRENT_VERSION
    };
    
    return JSON.stringify(data, null, 2);
  }

  importData(dataString: string): boolean {
    try {
      const data = JSON.parse(dataString);
      
      if (data.activeSession) {
        this.saveActiveSession(data.activeSession);
      }
      
      if (data.sessionHistory) {
        localStorage.setItem(this.STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(data.sessionHistory));
      }
      
      if (data.syncQueue) {
        localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(data.syncQueue));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();

// Export class for testing
export { OfflineStorageService };