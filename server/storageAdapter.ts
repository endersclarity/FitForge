/**
 * Storage Adapter - Bridges MemStorage interface with UnifiedFileStorage
 * 
 * This adapter implements the IStorage interface expected by workout session routes
 * while delegating to the UnifiedFileStorage system for persistent data storage.
 * This enables immediate data persistence without changing API endpoints or frontend code.
 */

import { 
  IStorage,
  type User, type InsertUser, type Workout, type InsertWorkout,
  type WorkoutSession, type InsertWorkoutSession, type UserStats, type InsertUserStats,
  type Achievement, type InsertAchievement, type Challenge, type InsertChallenge,
  type ChallengeParticipation, type InsertChallengeParticipation,
  type SocialPost, type InsertSocialPost
} from "./storage";
import { UnifiedFileStorage } from "./unifiedFileStorage";
import { UnifiedWorkoutSession } from "../shared/unified-storage-schema";

export class StorageAdapter implements IStorage {
  private unifiedStorage: UnifiedFileStorage;
  private sessionIdMap: Map<number, string> = new Map(); // numeric ID -> UUID mapping
  private reverseSessionIdMap: Map<string, number> = new Map(); // UUID -> numeric ID mapping
  private nextId = 1;

  constructor() {
    this.unifiedStorage = new UnifiedFileStorage();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.unifiedStorage.initialize();
  }

  private getNextId(): number {
    return this.nextId++;
  }

  private mapSessionId(uuid: string): number {
    if (this.reverseSessionIdMap.has(uuid)) {
      return this.reverseSessionIdMap.get(uuid)!;
    }
    const numericId = this.getNextId();
    this.sessionIdMap.set(numericId, uuid);
    this.reverseSessionIdMap.set(uuid, numericId);
    return numericId;
  }

  private getUuidForId(id: number): string | undefined {
    return this.sessionIdMap.get(id);
  }

  // ============================================================================
  // WORKOUT SESSION METHODS (Primary focus for this migration)
  // ============================================================================

  async getWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    const userWorkoutData = await this.unifiedStorage.getUserWorkoutData(userId.toString());
    
    return userWorkoutData.sessions.map(session => this.convertUnifiedToLegacy(session));
  }

  async getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    const userId = "1"; // For now, assume user 1 (can be enhanced later)
    const userWorkoutData = await this.unifiedStorage.getUserWorkoutData(userId);
    
    // Try to find session by UUID first (if we have the mapping)
    const uuid = this.getUuidForId(id);
    if (uuid) {
      const session = userWorkoutData.sessions.find(s => s.id === uuid);
      if (session) {
        return this.convertUnifiedToLegacy(session, id);
      }
    }
    
    // Fallback: find active session and treat it as the requested session
    // This handles cases where session ID mapping is lost between requests
    const activeSession = userWorkoutData.sessions.find(s => s.sessionType === "active");
    if (activeSession && id === 1) { // Assume session ID 1 for the active session
      const numericId = this.mapSessionId(activeSession.id);
      return this.convertUnifiedToLegacy(activeSession, numericId);
    }
    
    return undefined;
  }

  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const userId = session.userId.toString();
    
    // Convert legacy session format to unified format
    const exercises = Array.isArray(session.exercises) ? session.exercises : [];
    
    const unifiedSession = await this.unifiedStorage.createUnifiedWorkoutSession(
      userId,
      session.workoutType || "custom",
      exercises.map((ex: any) => ({
        exerciseId: ex.exerciseId || ex.id || "unknown",
        exerciseName: ex.exerciseName || ex.name || "Unknown Exercise",
        sets: ex.sets || [],
        targetSets: ex.targetSets || 3,
        targetReps: ex.targetReps || 12,
        targetWeight: ex.targetWeight || 0
      }))
    );

    // Map the UUID to a numeric ID for compatibility
    const numericId = this.mapSessionId(unifiedSession.id);
    
    return this.convertUnifiedToLegacy(unifiedSession, numericId);
  }

  async updateWorkoutSession(id: number, updates: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined> {
    // Handle completion updates (the main use case)
    if (updates.status === "completed") {
      const userId = "1"; // Enhance later for multi-user
      
      // Find the active session for this user instead of relying on ID mapping
      const userWorkoutData = await this.unifiedStorage.getUserWorkoutData(userId);
      const activeSession = userWorkoutData.sessions.find(s => s.sessionType === "active");
      
      if (!activeSession) {
        console.error("No active session found for completion");
        return undefined;
      }
      
      const completionSummary = await this.unifiedStorage.completeUnifiedWorkoutSession(
        userId,
        activeSession.id,
        updates.rating || 4, // Use provided rating or default
        updates.notes || undefined
      );
      
      // Fetch the updated session data after completion
      const updatedUserData = await this.unifiedStorage.getUserWorkoutData(userId);
      const completedSession = updatedUserData.sessions.find(s => s.id === activeSession.id);
      
      return completedSession ? this.convertUnifiedToLegacy(completedSession, id) : undefined;
    }

    // For other updates, we'd need to implement specific handlers
    return this.getWorkoutSession(id);
  }

  async saveWorkoutSession(session: any): Promise<WorkoutSession> {
    // This method is used for persisting session data
    if (session.id && typeof session.id === 'number') {
      // Update existing session
      const updated = await this.updateWorkoutSession(session.id, session);
      if (updated) return updated;
    }
    
    // Create new session
    return this.createWorkoutSession(session);
  }

  async updateSetLog(sessionId: number, exerciseId: string, setNumber: number, setData: any): Promise<boolean> {
    const uuid = this.getUuidForId(sessionId);
    if (!uuid) return false;

    const userId = "1"; // Enhance for multi-user later
    
    try {
      await this.unifiedStorage.logSetToUnifiedStorage(
        userId,
        uuid,
        parseInt(exerciseId), // Convert string to number as expected by UnifiedFileStorage
        `Exercise ${exerciseId}`, // Default exercise name
        {
          setNumber,
          weight: setData.weight || 0,
          reps: setData.reps || 0,
          completed: setData.completed || false,
          restTimeSeconds: setData.restTimeSeconds,
          rpe: setData.rpe,
          notes: setData.notes
        }
      );
      return true;
    } catch (error) {
      console.error("Error updating set log:", error);
      return false;
    }
  }

  async getUserWorkoutHistory(userId: number, limit?: number): Promise<WorkoutSession[]> {
    const userWorkoutData = await this.unifiedStorage.getUserWorkoutData(userId.toString());
    
    let sessions = userWorkoutData.sessions
      .filter(s => s.sessionType === "completed")
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    if (limit) {
      sessions = sessions.slice(0, limit);
    }
    
    return sessions.map(session => this.convertUnifiedToLegacy(session));
  }

  async getExercisePersonalRecords(userId: number, exerciseId: string): Promise<any[]> {
    // This would require aggregating data from all sessions
    // For now, return empty array (can be enhanced later)
    return [];
  }

  // ============================================================================
  // CONVERSION HELPERS
  // ============================================================================

  private convertUnifiedToLegacy(unifiedSession: UnifiedWorkoutSession, providedId?: number): WorkoutSession {
    const numericId = providedId || this.mapSessionId(unifiedSession.id);
    
    return {
      id: numericId,
      userId: parseInt(unifiedSession.userId),
      workoutId: null, // Unified sessions don't have workout template IDs
      workoutType: unifiedSession.workoutType,
      startTime: new Date(unifiedSession.startTime),
      endTime: unifiedSession.endTime ? new Date(unifiedSession.endTime) : null,
      totalDuration: unifiedSession.totalDuration || 0,
      totalVolume: unifiedSession.totalVolume,
      caloriesBurned: unifiedSession.caloriesBurned || null,
      formScore: null, // Not tracked in unified sessions
      notes: unifiedSession.notes || null,
      exercises: unifiedSession.exercises || [],
      status: unifiedSession.sessionType === "completed" ? "completed" : 
              unifiedSession.sessionType === "abandoned" ? "paused" : "in_progress",
      createdAt: new Date(unifiedSession.startTime)
    };
  }

  // ============================================================================
  // STUB IMPLEMENTATIONS (Not needed for workout session functionality)
  // ============================================================================

  async getUser(id: number): Promise<User | undefined> {
    // Stub - return default user for testing
    return {
      id,
      email: "ender@fitforge.dev",
      username: "ender",
      passwordHash: "",
      firstName: "Ender",
      lastName: "Test",
      profileImage: null,
      createdAt: new Date()
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (email === "ender@fitforge.dev") {
      return this.getUser(1);
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (username === "ender") {
      return this.getUser(1);
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    throw new Error("User creation not implemented in adapter");
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    throw new Error("User updates not implemented in adapter");
  }

  // Workout methods (stubs)
  async getWorkouts(filters?: { category?: string; difficulty?: string; userId?: number }): Promise<Workout[]> {
    return [];
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return undefined;
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    throw new Error("Workout creation not implemented in adapter");
  }

  async updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout | undefined> {
    throw new Error("Workout updates not implemented in adapter");
  }

  async deleteWorkout(id: number): Promise<boolean> {
    return false;
  }

  // User stats methods (stubs)
  async getUserStats(userId: number, limit?: number): Promise<UserStats[]> {
    return [];
  }

  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    throw new Error("User stats creation not implemented in adapter");
  }

  async getLatestUserStats(userId: number): Promise<UserStats | undefined> {
    return undefined;
  }

  // Achievement methods (stubs)
  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return [];
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    throw new Error("Achievement creation not implemented in adapter");
  }

  // Challenge methods (stubs)
  async getActiveChallenges(): Promise<Challenge[]> {
    return [];
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    return undefined;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    throw new Error("Challenge creation not implemented in adapter");
  }

  async getUserChallenges(userId: number): Promise<ChallengeParticipation[]> {
    return [];
  }

  async joinChallenge(participation: InsertChallengeParticipation): Promise<ChallengeParticipation> {
    throw new Error("Challenge participation not implemented in adapter");
  }

  async getSocialPosts(limit?: number): Promise<SocialPost[]> {
    return [];
  }

  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    throw new Error("Social post creation not implemented in adapter");
  }
}

// Export the adapter instance
export const storage = new StorageAdapter();