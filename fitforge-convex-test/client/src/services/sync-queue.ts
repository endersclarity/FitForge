/**
 * Sync Queue Service
 * Handles background synchronization of offline workout data with the server
 */

import { offlineStorage, type SyncQueueItem } from './offline-storage';

interface SyncResult {
  success: boolean;
  error?: string;
  shouldRetry?: boolean;
}

class SyncQueueService {
  private isProcessing = false;
  private syncInterval: number | null = null;
  private readonly API_BASE = '/api/workouts';
  
  /**
   * Start background sync processing
   */
  startBackgroundSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = window.setInterval(() => {
      this.processQueue();
    }, intervalMs);
    
    // Process immediately
    this.processQueue();
    
    console.log('🔄 Background sync started');
  }
  
  /**
   * Stop background sync processing
   */
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    console.log('⏹️ Background sync stopped');
  }
  
  /**
   * Process all items in the sync queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('🔄 Sync already in progress, skipping...');
      return;
    }
    
    // Check if we're online
    if (!navigator.onLine) {
      console.log('📵 Offline - skipping sync');
      return;
    }
    
    this.isProcessing = true;
    
    try {
      const queue = offlineStorage.getSyncQueue();
      
      if (queue.length === 0) {
        console.log('✅ Sync queue empty');
        return;
      }
      
      console.log(`🔄 Processing ${queue.length} items in sync queue`);
      
      for (const item of queue) {
        try {
          const result = await this.processQueueItem(item);
          
          if (result.success) {
            // Remove successful item from queue
            offlineStorage.removeFromSyncQueue(item.id);
            console.log(`✅ Synced: ${item.type} ${item.id}`);
          } else if (!result.shouldRetry || item.retryCount >= item.maxRetries) {
            // Remove failed item that shouldn't retry or has exceeded max retries
            offlineStorage.removeFromSyncQueue(item.id);
            console.error(`❌ Failed permanently: ${item.type} ${item.id} - ${result.error}`);
          } else {
            // Increment retry count for items that should be retried
            item.retryCount++;
            console.warn(`🔄 Retry ${item.retryCount}/${item.maxRetries}: ${item.type} ${item.id} - ${result.error}`);
          }
        } catch (error) {
          console.error(`💥 Error processing queue item ${item.id}:`, error);
          
          // Increment retry count for unexpected errors
          item.retryCount++;
          if (item.retryCount >= item.maxRetries) {
            offlineStorage.removeFromSyncQueue(item.id);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Process a single queue item
   */
  private async processQueueItem(item: SyncQueueItem): Promise<SyncResult> {
    switch (item.type) {
      case 'START_WORKOUT':
        return this.syncStartWorkout(item);
      case 'LOG_SET':
        return this.syncLogSet(item);
      case 'COMPLETE_WORKOUT':
        return this.syncCompleteWorkout(item);
      case 'ABANDON_WORKOUT':
        return this.syncAbandonWorkout(item);
      default:
        return {
          success: false,
          error: `Unknown sync item type: ${item.type}`,
          shouldRetry: false
        };
    }
  }
  
  /**
   * Sync workout start with server
   */
  private async syncStartWorkout(item: SyncQueueItem): Promise<SyncResult> {
    try {
      const response = await fetch(`${this.API_BASE}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.data)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('🚀 Workout started on server:', result.sessionId);
        return { success: true };
      } else if (response.status === 409) {
        // Active session conflict - this is expected, remove from queue
        console.log('⚠️ Server already has active session, skipping start sync');
        return { success: true };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${error}`,
          shouldRetry: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`,
        shouldRetry: true
      };
    }
  }
  
  /**
   * Sync set logging with server
   */
  private async syncLogSet(item: SyncQueueItem): Promise<SyncResult> {
    try {
      const { sessionId, ...setData } = item.data;
      
      const response = await fetch(`${this.API_BASE}/${sessionId}/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`💪 Set synced to server: ${result.setId}`);
        return { success: true };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${error}`,
          shouldRetry: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`,
        shouldRetry: true
      };
    }
  }
  
  /**
   * Sync workout completion with server
   */
  private async syncCompleteWorkout(item: SyncQueueItem): Promise<SyncResult> {
    try {
      const { sessionId, ...completionData } = item.data;
      
      const response = await fetch(`${this.API_BASE}/${sessionId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`🎉 Workout completion synced to server:`, result.summary);
        return { success: true };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${error}`,
          shouldRetry: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`,
        shouldRetry: true
      };
    }
  }
  
  /**
   * Sync workout abandonment with server
   */
  private async syncAbandonWorkout(item: SyncQueueItem): Promise<SyncResult> {
    try {
      const { sessionId } = item.data;
      
      const response = await fetch(`${this.API_BASE}/${sessionId}/abandon`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        console.log(`🗑️ Workout abandonment synced to server`);
        return { success: true };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${error}`,
          shouldRetry: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`,
        shouldRetry: true
      };
    }
  }
  
  /**
   * Force sync all pending items immediately
   */
  async forceSyncAll(): Promise<{ synced: number; failed: number }> {
    console.log('🔄 Force syncing all pending items...');
    
    const queue = offlineStorage.getSyncQueue();
    let synced = 0;
    let failed = 0;
    
    for (const item of queue) {
      try {
        const result = await this.processQueueItem(item);
        
        if (result.success) {
          offlineStorage.removeFromSyncQueue(item.id);
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error force syncing item ${item.id}:`, error);
        failed++;
      }
    }
    
    console.log(`✅ Force sync complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  }
  
  /**
   * Get sync queue status
   */
  getQueueStatus(): {
    totalItems: number;
    pendingItems: number;
    failedItems: number;
    oldestItem?: Date;
    isOnline: boolean;
    isProcessing: boolean;
  } {
    const queue = offlineStorage.getSyncQueue();
    const failedItems = queue.filter(item => item.retryCount > 0).length;
    const oldestTimestamp = queue.length > 0 ? Math.min(...queue.map(item => item.timestamp)) : undefined;
    
    return {
      totalItems: queue.length,
      pendingItems: queue.length - failedItems,
      failedItems,
      oldestItem: oldestTimestamp ? new Date(oldestTimestamp) : undefined,
      isOnline: navigator.onLine,
      isProcessing: this.isProcessing
    };
  }
  
  /**
   * Clear all failed items from queue
   */
  clearFailedItems(): number {
    const queue = offlineStorage.getSyncQueue();
    const failedItems = queue.filter(item => item.retryCount > 0);
    
    failedItems.forEach(item => {
      offlineStorage.removeFromSyncQueue(item.id);
    });
    
    console.log(`🗑️ Cleared ${failedItems.length} failed sync items`);
    return failedItems.length;
  }
  
  /**
   * Add connection event listeners
   */
  addConnectionListeners(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Back online - resuming sync');
      this.processQueue();
    });
    
    window.addEventListener('offline', () => {
      console.log('📵 Gone offline - sync paused');
    });
  }
  
  /**
   * Remove connection event listeners
   */
  removeConnectionListeners(): void {
    window.removeEventListener('online', this.processQueue);
    window.removeEventListener('offline', () => {});
  }
}

// Export singleton instance
export const syncQueue = new SyncQueueService();

// Export class for testing
export { SyncQueueService };