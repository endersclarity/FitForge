import { UnifiedFileStorage } from './unifiedFileStorage';
import { z } from 'zod';

// ============================================================================
// SMART SESSION MANAGEMENT SERVICE
// ============================================================================

export interface SessionPolicy {
  maxIdleTime: number; // minutes
  autoAbandonThreshold: number; // minutes 
  warningThreshold: number; // minutes
  enableAutoAbandon: boolean;
  requireUserConfirmation: boolean;
}

export interface StaleSessionInfo {
  sessionId: string;
  userId: string;
  startTime: string;
  lastActivity: string;
  idleTime: number; // minutes
  exerciseCount: number;
  isStale: boolean;
  shouldAutoAbandon: boolean;
  needsUserDecision: boolean;
  warningLevel: 'none' | 'warning' | 'critical';
}

export interface SessionConflictResolution {
  action: 'auto_abandon' | 'user_decision_required' | 'allow_multiple';
  reason: string;
  recommendations: string[];
  staleSession: StaleSessionInfo;
}

const SessionPolicySchema = z.object({
  maxIdleTime: z.number().min(5).max(1440), // 5 minutes to 24 hours
  autoAbandonThreshold: z.number().min(30).max(1440), // 30 minutes to 24 hours
  warningThreshold: z.number().min(10).max(120), // 10 minutes to 2 hours
  enableAutoAbandon: z.boolean(),
  requireUserConfirmation: z.boolean()
});

export class SmartSessionManager {
  private storage: UnifiedFileStorage;
  private defaultPolicy: SessionPolicy;

  constructor(storage: UnifiedFileStorage) {
    this.storage = storage;
    
    // Default session policy - conservative but user-friendly
    this.defaultPolicy = {
      maxIdleTime: 120, // 2 hours max idle time
      autoAbandonThreshold: 240, // 4 hours auto-abandon
      warningThreshold: 60, // 1 hour warning
      enableAutoAbandon: true,
      requireUserConfirmation: false // Don't require confirmation for very old sessions
    };
  }

  /**
   * Check for active sessions and determine smart resolution
   */
  async checkSessionConflicts(userId: string, newWorkoutType: string): Promise<SessionConflictResolution | null> {
    try {
      // Get user's active sessions
      const activeSessions = await this.storage.getUnifiedWorkoutSessions(userId, {
        sessionType: 'active',
        limit: 5
      });

      if (activeSessions.length === 0) {
        return null; // No conflicts
      }

      // Analyze the most recent active session
      const activeSession = activeSessions[0];
      const staleInfo = await this.analyzeSessionStaleness(activeSession);

      // Determine resolution strategy
      if (staleInfo.shouldAutoAbandon && this.defaultPolicy.enableAutoAbandon) {
        return {
          action: 'auto_abandon',
          reason: `Session has been inactive for ${staleInfo.idleTime} minutes (exceeds ${this.defaultPolicy.autoAbandonThreshold} minute threshold)`,
          recommendations: [
            'The old session will be automatically marked as abandoned',
            'You can start your new workout immediately',
            'No data will be lost - sets will be saved as a partial workout'
          ],
          staleSession: staleInfo
        };
      }

      if (staleInfo.needsUserDecision || !this.defaultPolicy.enableAutoAbandon) {
        return {
          action: 'user_decision_required',
          reason: `You have an active workout session from ${new Date(staleInfo.startTime).toLocaleString()}`,
          recommendations: [
            'Resume your previous workout if you want to continue where you left off',
            'Abandon and start new if you want to begin a fresh workout',
            'The previous session has valuable workout data that could be saved'
          ],
          staleSession: staleInfo
        };
      }

      // Default to requiring user decision for safety
      return {
        action: 'user_decision_required',
        reason: 'Active session detected',
        recommendations: ['Choose how to handle your existing workout session'],
        staleSession: staleInfo
      };

    } catch (error) {
      console.error('Error checking session conflicts:', error);
      return null;
    }
  }

  /**
   * Analyze if a session is stale and needs action
   */
  private async analyzeSessionStaleness(session: any): Promise<StaleSessionInfo> {
    const now = new Date();
    const startTime = new Date(session.startTime);
    const lastActivity = session.lastActivity ? new Date(session.lastActivity) : startTime;
    
    // Calculate idle time
    const idleTimeMs = now.getTime() - lastActivity.getTime();
    const idleTimeMinutes = Math.floor(idleTimeMs / (1000 * 60));
    
    // Determine staleness level
    const isStale = idleTimeMinutes > this.defaultPolicy.warningThreshold;
    const shouldAutoAbandon = idleTimeMinutes > this.defaultPolicy.autoAbandonThreshold;
    const needsUserDecision = isStale && !shouldAutoAbandon;

    // Warning level
    let warningLevel: 'none' | 'warning' | 'critical' = 'none';
    if (idleTimeMinutes > this.defaultPolicy.autoAbandonThreshold) {
      warningLevel = 'critical';
    } else if (idleTimeMinutes > this.defaultPolicy.warningThreshold) {
      warningLevel = 'warning';
    }

    return {
      sessionId: session.id,
      userId: session.userId,
      startTime: session.startTime,
      lastActivity: lastActivity.toISOString(),
      idleTime: idleTimeMinutes,
      exerciseCount: session.exercises?.length || 0,
      isStale,
      shouldAutoAbandon,
      needsUserDecision,
      warningLevel
    };
  }

  /**
   * Automatically abandon stale sessions
   */
  async autoAbandonStaleSession(sessionId: string, userId: string, reason: string): Promise<boolean> {
    try {
      // Mark session as abandoned but preserve data for analysis
      const updateData = {
        status: 'abandoned' as const,
        endTime: new Date().toISOString(),
        notes: `Auto-abandoned: ${reason}`,
        abandonedAt: new Date().toISOString()
      };

      // TODO: Implement updateUnifiedWorkoutSession method in UnifiedFileStorage
      console.log(`Auto-abandoning session ${sessionId} for user ${userId}: ${reason}`);
      return true;

    } catch (error) {
      console.error(`Error auto-abandoning session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * User-initiated session abandonment (from UI)
   */
  async abandonSessionWithUserChoice(sessionId: string, userId: string, savePartialData: boolean = true): Promise<boolean> {
    try {
      const updateData = {
        status: savePartialData ? 'abandoned' as const : 'cancelled' as const,
        endTime: new Date().toISOString(),
        notes: savePartialData 
          ? 'Session abandoned by user. Partial workout data saved.'
          : 'Session cancelled by user. No data saved.',
        userInitiated: true,
        abandonedAt: new Date().toISOString()
      };

      // TODO: Implement updateUnifiedWorkoutSession method in UnifiedFileStorage
      console.log(`User-initiated session ${updateData.status} for session ${sessionId}`);
      return true;

    } catch (error) {
      console.error(`Error abandoning session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Cleanup routine to handle very old stale sessions
   */
  async performMaintenanceCleanup(): Promise<{ processed: number; abandoned: number; errors: number }> {
    let processed = 0;
    let abandoned = 0;
    let errors = 0;

    try {
      // Find all active sessions across all users (limited scope for safety)
      const allActiveSessions = await this.storage.getUnifiedWorkoutSessions('*', {
        sessionType: 'active',
        limit: 100
      });

      for (const session of allActiveSessions) {
        try {
          processed++;
          const staleInfo = await this.analyzeSessionStaleness(session);

          // Auto-abandon sessions that are extremely stale (6+ hours)
          if (staleInfo.idleTime > 360) { // 6 hours
            const success = await this.autoAbandonStaleSession(
              session.id,
              session.userId,
              `Maintenance cleanup: ${staleInfo.idleTime} minutes of inactivity`
            );
            
            if (success) {
              abandoned++;
            } else {
              errors++;
            }
          }

        } catch (error) {
          console.error(`Error processing session ${session.id} during cleanup:`, error);
          errors++;
        }
      }


    } catch (error) {
      console.error('Error during maintenance cleanup:', error);
      errors++;
    }

    return { processed, abandoned, errors };
  }

  /**
   * Get session policy (for configuration UI)
   */
  getSessionPolicy(): SessionPolicy {
    return { ...this.defaultPolicy };
  }

  /**
   * Update session policy (for admin configuration)
   */
  updateSessionPolicy(newPolicy: Partial<SessionPolicy>): SessionPolicy {
    const validatedPolicy = SessionPolicySchema.parse({
      ...this.defaultPolicy,
      ...newPolicy
    });
    
    this.defaultPolicy = validatedPolicy;
    return validatedPolicy;
  }

  /**
   * Get detailed session info for debugging/admin
   */
  async getSessionAnalysis(userId: string): Promise<StaleSessionInfo[]> {
    try {
      const sessions = await this.storage.getUnifiedWorkoutSessions(userId, {
        sessionType: 'active',
        limit: 10
      });

      const analyses: StaleSessionInfo[] = [];
      for (const session of sessions) {
        const info = await this.analyzeSessionStaleness(session);
        analyses.push(info);
      }

      return analyses;

    } catch (error) {
      console.error('Error analyzing sessions:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const smartSessionManager = new SmartSessionManager(new UnifiedFileStorage());