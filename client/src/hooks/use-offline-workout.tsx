/**
 * Offline Workout Hook
 * React hook for managing offline-first workout sessions
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, type OfflineWorkoutSession, type OfflineSetData } from '../services/offline-storage';
import { syncQueue } from '../services/sync-queue';

interface UseOfflineWorkoutReturn {
  // Session state
  activeSession: OfflineWorkoutSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Session management
  startWorkout: (workoutType: string, plannedExercises?: string[]) => Promise<OfflineWorkoutSession | null>;
  completeWorkout: (rating?: number, notes?: string) => Promise<boolean>;
  abandonWorkout: () => Promise<boolean>;
  
  // Set logging
  logSet: (
    exerciseId: number,
    exerciseName: string,
    setData: Omit<OfflineSetData, 'timestamp' | 'completed'>
  ) => Promise<boolean>;
  
  // Session history
  getSessionHistory: (limit?: number) => OfflineWorkoutSession[];
  
  // Sync status
  syncStatus: {
    isOnline: boolean;
    isProcessing: boolean;
    queueSize: number;
    lastSyncAttempt?: Date;
  };
  
  // Sync actions
  forceSyncAll: () => Promise<{ synced: number; failed: number }>;
  clearFailedSyncs: () => number;
  clearCorruptedSyncItems: () => void;
}

export function useOfflineWorkout(): UseOfflineWorkoutReturn {
  const [activeSession, setActiveSession] = useState<OfflineWorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    isProcessing: false,
    queueSize: 0,
    lastSyncAttempt: undefined as Date | undefined
  });

  // Load active session on mount
  useEffect(() => {
    const session = offlineStorage.getActiveSession();
    setActiveSession(session);
    
    // Clear any corrupted sync items on startup
    try {
      const syncQueue = offlineStorage.getSyncQueue();
      const corruptedItems = syncQueue.filter(item => 
        item.id.includes('session_1748626935840_z2vi8nw1d') ||
        JSON.stringify(item.data).includes('session_1748626935840_z2vi8nw1d')
      );
      
      if (corruptedItems.length > 0) {
        console.log(`🚨 Found ${corruptedItems.length} corrupted sync items, cleaning up...`);
        offlineStorage.clearCorruptedSyncItems();
      }
    } catch (error) {
      console.error('Error checking for corrupted sync items:', error);
    }
    
    // Start background sync
    syncQueue.startBackgroundSync(30000); // Every 30 seconds
    syncQueue.addConnectionListeners();
    
    return () => {
      syncQueue.stopBackgroundSync();
      syncQueue.removeConnectionListeners();
    };
  }, []);

  // Update sync status periodically
  useEffect(() => {
    const updateSyncStatus = () => {
      const status = syncQueue.getQueueStatus();
      setSyncStatus({
        isOnline: status.isOnline,
        isProcessing: status.isProcessing,
        queueSize: status.totalItems,
        lastSyncAttempt: status.oldestItem
      });
    };

    // Initial status
    updateSyncStatus();

    // Update every 5 seconds
    const interval = setInterval(updateSyncStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const startWorkout = useCallback(async (
    workoutType: string, 
    plannedExercises?: string[]
  ): Promise<OfflineWorkoutSession | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if there's already an active session
      const existingSession = offlineStorage.getActiveSession();
      if (existingSession) {
        setError('You already have an active workout session. Please complete or abandon it first.');
        return null;
      }
      
      const session = offlineStorage.startWorkoutSession(workoutType, plannedExercises);
      setActiveSession(session);
      
      console.log('🚀 Workout started offline:', session.id);
      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start workout';
      setError(errorMessage);
      console.error('Error starting workout:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeWorkout = useCallback(async (
    rating?: number, 
    notes?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = offlineStorage.completeWorkoutSession(rating, notes);
      
      if (success) {
        setActiveSession(null);
        console.log('🎉 Workout completed offline');
        return true;
      } else {
        setError('No active workout session to complete');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete workout';
      setError(errorMessage);
      console.error('Error completing workout:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const abandonWorkout = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const session = offlineStorage.getActiveSession();
      if (!session) {
        setError('No active workout session to abandon');
        return false;
      }
      
      // Add abandon action to sync queue
      syncQueue.processQueue();
      
      // Clear local session
      offlineStorage.clearActiveSession();
      setActiveSession(null);
      
      console.log('🗑️ Workout abandoned offline');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to abandon workout';
      setError(errorMessage);
      console.error('Error abandoning workout:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logSet = useCallback(async (
    exerciseId: number,
    exerciseName: string,
    setData: Omit<OfflineSetData, 'timestamp' | 'completed'>
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = offlineStorage.logSet(exerciseId, exerciseName, setData);
      
      if (success) {
        // Refresh active session to show new set
        const updatedSession = offlineStorage.getActiveSession();
        setActiveSession(updatedSession);
        
        console.log('💪 Set logged offline:', setData);
        return true;
      } else {
        setError('Failed to log set - no active session');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log set';
      setError(errorMessage);
      console.error('Error logging set:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSessionHistory = useCallback((limit: number = 10): OfflineWorkoutSession[] => {
    return offlineStorage.getSessionHistory(limit);
  }, []);

  const forceSyncAll = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await syncQueue.forceSyncAll();
      console.log('🔄 Force sync result:', result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync data';
      setError(errorMessage);
      console.error('Error force syncing:', err);
      return { synced: 0, failed: 0 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearFailedSyncs = useCallback((): number => {
    try {
      const cleared = syncQueue.clearFailedItems();
      console.log('🗑️ Cleared failed syncs:', cleared);
      return cleared;
    } catch (err) {
      console.error('Error clearing failed syncs:', err);
      return 0;
    }
  }, []);

  const clearCorruptedSyncItems = useCallback((): void => {
    try {
      offlineStorage.clearCorruptedSyncItems();
      console.log('🧹 Corrupted sync items cleared');
    } catch (err) {
      console.error('Error clearing corrupted sync items:', err);
    }
  }, []);

  // Auto-refresh active session when it changes
  useEffect(() => {
    const refreshSession = () => {
      const session = offlineStorage.getActiveSession();
      setActiveSession(session);
    };

    // Listen for storage events (in case of updates from other tabs)
    window.addEventListener('storage', refreshSession);
    
    return () => {
      window.removeEventListener('storage', refreshSession);
    };
  }, []);

  return {
    // Session state
    activeSession,
    isLoading,
    error,
    
    // Session management
    startWorkout,
    completeWorkout,
    abandonWorkout,
    
    // Set logging
    logSet,
    
    // Session history
    getSessionHistory,
    
    // Sync status
    syncStatus,
    
    // Sync actions
    forceSyncAll,
    clearFailedSyncs,
    clearCorruptedSyncItems
  };
}