/**
 * Data Migration Hook
 * React hook for managing data migrations and version compatibility
 */

import { useState, useEffect } from 'react';
import { dataMigration, type MigrationResult } from '../services/data-migration';

interface MigrationState {
  isLoading: boolean;
  needsMigration: boolean;
  currentVersion: number;
  migrationResult: MigrationResult | null;
  error: string | null;
}

interface UseMigrationOptions {
  autoMigrate?: boolean;
  onMigrationComplete?: (result: MigrationResult) => void;
  onMigrationError?: (error: string) => void;
}

export function useDataMigration(options: UseMigrationOptions = {}) {
  const { autoMigrate = true, onMigrationComplete, onMigrationError } = options;
  
  const [migrationState, setMigrationState] = useState<MigrationState>({
    isLoading: true,
    needsMigration: false,
    currentVersion: 0,
    migrationResult: null,
    error: null
  });

  // Check for migration needs on component mount
  useEffect(() => {
    checkMigrationStatus();
  }, []);

  // Auto-migrate if enabled
  useEffect(() => {
    if (autoMigrate && migrationState.needsMigration && !migrationState.isLoading) {
      performMigration();
    }
  }, [autoMigrate, migrationState.needsMigration, migrationState.isLoading]);

  const checkMigrationStatus = () => {
    try {
      setMigrationState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const needsMigration = dataMigration.needsMigration();
      const currentVersion = dataMigration.getCurrentDataVersion();
      
      setMigrationState(prev => ({
        ...prev,
        isLoading: false,
        needsMigration,
        currentVersion
      }));
      
      // Initialize versioning for new installations
      if (currentVersion === 0) {
        dataMigration.initializeVersioning();
      }
      
      console.log(`📊 Migration status: ${needsMigration ? 'Required' : 'Up to date'} (v${currentVersion})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error checking migration status';
      setMigrationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      console.error('Error checking migration status:', error);
    }
  };

  const performMigration = async () => {
    try {
      setMigrationState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🚀 Starting data migration...');
      const result = await dataMigration.migrateToLatest();
      
      setMigrationState(prev => ({
        ...prev,
        isLoading: false,
        needsMigration: !result.success,
        currentVersion: result.toVersion,
        migrationResult: result,
        error: result.success ? null : result.errors?.join(', ') || 'Migration failed'
      }));
      
      if (result.success) {
        console.log('✅ Migration completed successfully');
        onMigrationComplete?.(result);
        
        // Validate data integrity after migration
        const validation = dataMigration.validateDataIntegrity();
        if (!validation.valid) {
          console.warn('⚠️ Data integrity issues found:', validation.issues);
        }
      } else {
        console.error('❌ Migration failed:', result.errors);
        onMigrationError?.(result.errors?.join(', ') || 'Migration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown migration error';
      setMigrationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      console.error('Migration error:', error);
      onMigrationError?.(errorMessage);
    }
  };

  const rollbackToVersion = async (targetVersion: number) => {
    try {
      setMigrationState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log(`⏪ Rolling back to version ${targetVersion}...`);
      const result = await dataMigration.rollbackToVersion(targetVersion);
      
      setMigrationState(prev => ({
        ...prev,
        isLoading: false,
        currentVersion: result.toVersion,
        migrationResult: result,
        error: result.success ? null : result.errors?.join(', ') || 'Rollback failed'
      }));
      
      if (result.success) {
        console.log(`✅ Rollback to v${targetVersion} completed`);
        // Recheck migration status after rollback
        setTimeout(checkMigrationStatus, 100);
      } else {
        console.error('❌ Rollback failed:', result.errors);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown rollback error';
      setMigrationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      console.error('Rollback error:', error);
      throw error;
    }
  };

  const createBackup = () => {
    try {
      const backup = dataMigration.createDataBackup();
      console.log('💾 Manual backup created');
      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  };

  const getBackupList = () => {
    try {
      return dataMigration.getAvailableBackups();
    } catch (error) {
      console.error('Error getting backup list:', error);
      return [];
    }
  };

  const getMigrationHistory = () => {
    try {
      return dataMigration.getMigrationHistory();
    } catch (error) {
      console.error('Error getting migration history:', error);
      return [];
    }
  };

  const validateDataIntegrity = () => {
    try {
      return dataMigration.validateDataIntegrity();
    } catch (error) {
      console.error('Error validating data integrity:', error);
      return { valid: false, issues: ['Error during validation'] };
    }
  };

  return {
    // State
    isLoading: migrationState.isLoading,
    needsMigration: migrationState.needsMigration,
    currentVersion: migrationState.currentVersion,
    migrationResult: migrationState.migrationResult,
    error: migrationState.error,
    
    // Actions
    checkMigrationStatus,
    performMigration,
    rollbackToVersion,
    createBackup,
    getBackupList,
    getMigrationHistory,
    validateDataIntegrity,
    
    // Helper methods
    isUpToDate: !migrationState.needsMigration && !migrationState.isLoading,
    hasMigrationErrors: !!migrationState.error,
    lastMigrationSuccessful: migrationState.migrationResult?.success ?? true
  };
}

// Migration status component for debugging
export function MigrationStatus() {
  const migration = useDataMigration({ autoMigrate: false });
  
  if (!migration.isLoading && migration.isUpToDate) {
    return null; // Don't show anything if up to date
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg max-w-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            migration.isLoading ? 'bg-yellow-500' : 
            migration.error ? 'bg-red-500' : 
            migration.needsMigration ? 'bg-orange-500' : 'bg-green-500'
          }`} />
          <span className="text-sm font-medium">
            {migration.isLoading ? 'Checking data...' :
             migration.error ? 'Migration Error' :
             migration.needsMigration ? 'Migration Required' : 'Data Up to Date'}
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Version: {migration.currentVersion}
        </div>
        
        {migration.error && (
          <div className="text-xs text-red-600">
            {migration.error}
          </div>
        )}
        
        {migration.needsMigration && !migration.isLoading && (
          <button
            onClick={migration.performMigration}
            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
          >
            Migrate Now
          </button>
        )}
      </div>
    </div>
  );
}

// Types for external use
export type { MigrationState, UseMigrationOptions };