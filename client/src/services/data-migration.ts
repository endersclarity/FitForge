/**
 * Data Migration Service
 * Handles schema versioning and data migration for offline storage
 */

import { offlineStorage } from './offline-storage';

interface MigrationScript {
  version: number;
  description: string;
  migrate: (data: any) => any;
  rollback?: (data: any) => any;
}

interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  migrationsApplied: number[];
  errors?: string[];
}

class DataMigrationService {
  private readonly CURRENT_VERSION = 1;
  private readonly VERSION_KEY = 'fitforge_data_version';
  
  private migrations: MigrationScript[] = [
    // Migration from v0 to v1: Add versioning and new field structures
    {
      version: 1,
      description: 'Initial versioning and data structure standardization',
      migrate: (data: any) => {
        console.log('🔄 Migrating to version 1: Adding versioning support');
        
        // Add version field to all data structures
        if (data.activeSession && !data.activeSession.version) {
          data.activeSession.version = 1;
          data.activeSession.syncStatus = data.activeSession.syncStatus || 'pending';
        }
        
        if (data.sessionHistory && Array.isArray(data.sessionHistory)) {
          data.sessionHistory = data.sessionHistory.map((session: any) => ({
            ...session,
            version: session.version || 1,
            syncStatus: session.syncStatus || 'synced'
          }));
        }
        
        if (data.syncQueue && Array.isArray(data.syncQueue)) {
          data.syncQueue = data.syncQueue.map((item: any) => ({
            ...item,
            retryCount: item.retryCount || 0,
            maxRetries: item.maxRetries || 3
          }));
        }
        
        return data;
      },
      rollback: (data: any) => {
        console.log('⏪ Rolling back version 1: Removing versioning fields');
        
        if (data.activeSession) {
          data.activeSession = {
            ...data.activeSession,
            version: undefined,
            syncStatus: undefined,
          };
        }
        
        if (data.sessionHistory && Array.isArray(data.sessionHistory)) {
          data.sessionHistory = data.sessionHistory.map((session: any) => {
            const { version, syncStatus, ...sessionWithoutVersion } = session;
            return sessionWithoutVersion;
          });
        }
        
        return data;
      }
    }
    
    // Future migrations can be added here
    // {
    //   version: 2,
    //   description: 'Add new exercise tracking fields',
    //   migrate: (data: any) => {
    //     // Migration logic for v2
    //     return data;
    //   }
    // }
  ];

  /**
   * Check if data migration is needed
   */
  needsMigration(): boolean {
    const currentVersion = this.getCurrentDataVersion();
    return currentVersion < this.CURRENT_VERSION;
  }

  /**
   * Get current data version from storage
   */
  getCurrentDataVersion(): number {
    try {
      const version = localStorage.getItem(this.VERSION_KEY);
      return version ? parseInt(version, 10) : 0;
    } catch (error) {
      console.error('Error reading data version:', error);
      return 0;
    }
  }

  /**
   * Set data version in storage
   */
  private setDataVersion(version: number): void {
    try {
      localStorage.setItem(this.VERSION_KEY, version.toString());
    } catch (error) {
      console.error('Error setting data version:', error);
    }
  }

  /**
   * Perform automatic migration to latest version
   */
  async migrateToLatest(): Promise<MigrationResult> {
    const fromVersion = this.getCurrentDataVersion();
    
    if (fromVersion >= this.CURRENT_VERSION) {
      return {
        success: true,
        fromVersion,
        toVersion: fromVersion,
        migrationsApplied: []
      };
    }

    console.log(`🚀 Starting migration from v${fromVersion} to v${this.CURRENT_VERSION}`);
    
    // Create backup before migration
    const backupData = this.createDataBackup();
    
    try {
      const result = await this.migrateFromTo(fromVersion, this.CURRENT_VERSION);
      
      if (result.success) {
        this.setDataVersion(this.CURRENT_VERSION);
        console.log(`✅ Migration completed successfully`);
        
        // Clean up old backup after successful migration
        this.cleanupOldBackups();
      } else {
        console.error('❌ Migration failed, restoring backup');
        this.restoreFromBackup(backupData);
      }
      
      return result;
    } catch (error) {
      console.error('💥 Migration error:', error);
      this.restoreFromBackup(backupData);
      
      return {
        success: false,
        fromVersion,
        toVersion: fromVersion,
        migrationsApplied: [],
        errors: [error instanceof Error ? error.message : 'Unknown migration error']
      };
    }
  }

  /**
   * Migrate data from one version to another
   */
  private async migrateFromTo(fromVersion: number, toVersion: number): Promise<MigrationResult> {
    const migrationsToApply = this.migrations.filter(
      migration => migration.version > fromVersion && migration.version <= toVersion
    ).sort((a, b) => a.version - b.version);

    if (migrationsToApply.length === 0) {
      return {
        success: true,
        fromVersion,
        toVersion,
        migrationsApplied: []
      };
    }

    // Load all current data
    const data = this.loadAllData();
    let currentData = { ...data };
    const appliedMigrations: number[] = [];
    const errors: string[] = [];

    for (const migration of migrationsToApply) {
      try {
        console.log(`🔄 Applying migration v${migration.version}: ${migration.description}`);
        
        currentData = migration.migrate(currentData);
        appliedMigrations.push(migration.version);
        
        // Save intermediate state
        this.saveAllData(currentData);
        
        console.log(`✅ Migration v${migration.version} completed`);
      } catch (error) {
        const errorMessage = `Migration v${migration.version} failed: ${error}`;
        console.error('❌', errorMessage);
        errors.push(errorMessage);
        
        return {
          success: false,
          fromVersion,
          toVersion: migration.version - 1,
          migrationsApplied: appliedMigrations,
          errors
        };
      }
    }

    return {
      success: true,
      fromVersion,
      toVersion,
      migrationsApplied: appliedMigrations,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(targetVersion: number): Promise<MigrationResult> {
    const currentVersion = this.getCurrentDataVersion();
    
    if (targetVersion >= currentVersion) {
      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: currentVersion,
        migrationsApplied: []
      };
    }

    console.log(`⏪ Rolling back from v${currentVersion} to v${targetVersion}`);
    
    // Create backup before rollback
    const backupData = this.createDataBackup();
    
    try {
      const migrationsToRollback = this.migrations.filter(
        migration => migration.version > targetVersion && migration.version <= currentVersion && migration.rollback
      ).sort((a, b) => b.version - a.version); // Reverse order for rollback

      let data = this.loadAllData();
      const rolledBackMigrations: number[] = [];

      for (const migration of migrationsToRollback) {
        if (migration.rollback) {
          console.log(`⏪ Rolling back migration v${migration.version}`);
          data = migration.rollback(data);
          rolledBackMigrations.push(migration.version);
        }
      }

      this.saveAllData(data);
      this.setDataVersion(targetVersion);

      console.log(`✅ Rollback to v${targetVersion} completed`);
      
      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: targetVersion,
        migrationsApplied: rolledBackMigrations
      };
    } catch (error) {
      console.error('💥 Rollback error:', error);
      this.restoreFromBackup(backupData);
      
      return {
        success: false,
        fromVersion: currentVersion,
        toVersion: currentVersion,
        migrationsApplied: [],
        errors: [error instanceof Error ? error.message : 'Unknown rollback error']
      };
    }
  }

  /**
   * Create a complete backup of current data
   */
  createDataBackup(): any {
    const timestamp = new Date().toISOString();
    const data = this.loadAllData();
    
    const backup = {
      timestamp,
      version: this.getCurrentDataVersion(),
      data
    };
    
    // Store backup in localStorage with timestamp
    const backupKey = `fitforge_backup_${Date.now()}`;
    try {
      localStorage.setItem(backupKey, JSON.stringify(backup));
      console.log(`💾 Backup created: ${backupKey}`);
    } catch (error) {
      console.error('Error creating backup:', error);
    }
    
    return backup;
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(backup: any): boolean {
    try {
      if (backup?.data) {
        this.saveAllData(backup.data);
        this.setDataVersion(backup.version || 0);
        console.log(`🔄 Data restored from backup (v${backup.version})`);
        return true;
      }
    } catch (error) {
      console.error('Error restoring from backup:', error);
    }
    return false;
  }

  /**
   * Load all FitForge data from localStorage
   */
  private loadAllData(): any {
    return {
      activeSession: offlineStorage.getActiveSession(),
      sessionHistory: offlineStorage.getSessionHistory(100),
      syncQueue: offlineStorage.getSyncQueue(),
      lastSync: localStorage.getItem('fitforge_last_sync'),
      userPreferences: localStorage.getItem('fitforge_user_preferences')
    };
  }

  /**
   * Save all data to localStorage
   */
  private saveAllData(data: any): void {
    // Save each data type using the appropriate service method
    if (data.activeSession) {
      offlineStorage.saveActiveSession(data.activeSession);
    }
    
    if (data.sessionHistory) {
      localStorage.setItem('fitforge_session_history', JSON.stringify(data.sessionHistory));
    }
    
    if (data.syncQueue) {
      localStorage.setItem('fitforge_sync_queue', JSON.stringify(data.syncQueue));
    }
    
    if (data.lastSync) {
      localStorage.setItem('fitforge_last_sync', data.lastSync);
    }
    
    if (data.userPreferences) {
      localStorage.setItem('fitforge_user_preferences', data.userPreferences);
    }
  }

  /**
   * Clean up old backup files
   */
  private cleanupOldBackups(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('fitforge_backup_')) {
          const timestamp = parseInt(key.replace('fitforge_backup_', ''), 10);
          const age = Date.now() - timestamp;
          
          // Remove backups older than 7 days
          if (age > 7 * 24 * 60 * 60 * 1000) {
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Cleaned up old backup: ${key}`);
      });
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  }

  /**
   * Get migration history
   */
  getMigrationHistory(): { version: number; timestamp: string }[] {
    try {
      const history = localStorage.getItem('fitforge_migration_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error reading migration history:', error);
      return [];
    }
  }

  /**
   * Record migration in history
   */
  private recordMigration(version: number): void {
    try {
      const history = this.getMigrationHistory();
      history.push({
        version,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 migration records
      const trimmedHistory = history.slice(-50);
      
      localStorage.setItem('fitforge_migration_history', JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error recording migration history:', error);
    }
  }

  /**
   * Get available backups
   */
  getAvailableBackups(): Array<{ key: string; timestamp: string; version: number }> {
    const backups: Array<{ key: string; timestamp: string; version: number }> = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('fitforge_backup_')) {
          const backupData = localStorage.getItem(key);
          if (backupData) {
            const backup = JSON.parse(backupData);
            backups.push({
              key,
              timestamp: backup.timestamp,
              version: backup.version || 0
            });
          }
        }
      }
    } catch (error) {
      console.error('Error reading available backups:', error);
    }
    
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Initialize data versioning for new installations
   */
  initializeVersioning(): void {
    const currentVersion = this.getCurrentDataVersion();
    
    if (currentVersion === 0) {
      // First time setup - set current version
      this.setDataVersion(this.CURRENT_VERSION);
      console.log(`🆕 Initialized data versioning at v${this.CURRENT_VERSION}`);
    }
  }

  /**
   * Validate data integrity after migration
   */
  validateDataIntegrity(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    try {
      // Check active session structure
      const activeSession = offlineStorage.getActiveSession();
      if (activeSession && !activeSession.version) {
        issues.push('Active session missing version field');
      }
      
      // Check session history structure
      const sessionHistory = offlineStorage.getSessionHistory(10);
      sessionHistory.forEach((session, index) => {
        if (!session.version) {
          issues.push(`Session history item ${index} missing version field`);
        }
        if (!session.syncStatus) {
          issues.push(`Session history item ${index} missing syncStatus field`);
        }
      });
      
      // Check sync queue structure
      const syncQueue = offlineStorage.getSyncQueue();
      syncQueue.forEach((item, index) => {
        if (typeof item.retryCount !== 'number') {
          issues.push(`Sync queue item ${index} missing or invalid retryCount`);
        }
        if (typeof item.maxRetries !== 'number') {
          issues.push(`Sync queue item ${index} missing or invalid maxRetries`);
        }
      });
      
    } catch (error) {
      issues.push(`Data validation error: ${error}`);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const dataMigration = new DataMigrationService();

// Export types
export type { MigrationResult, MigrationScript };