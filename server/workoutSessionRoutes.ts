import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { smartSessionManager } from "./smartSessionManager";

const router = Router();

// Enhanced request types for better type safety
interface AuthenticatedRequest extends Request {
  userId?: number; // Optional to satisfy Express typing
}

// Middleware to auto-assign Ender's user ID (bypasses authentication for testing)
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  req.userId = 1;
  next();
};

// Validation schemas for enhanced workout logging
const startWorkoutSessionSchema = z.object({
  workoutType: z.string(),
  exerciseIds: z.array(z.string()).optional()
});

const logSetSchema = z.object({
  weight: z.number().min(0),
  reps: z.number().min(0),
  completed: z.boolean(),
  restTimeSeconds: z.number().optional(),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional()
});

const completeWorkoutSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
});

// GET /api/workout-sessions/check-conflicts - Check for session conflicts before starting
router.get("/check-conflicts", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!; // Non-null assertion since middleware sets this
    const workoutType = req.query.workoutType as string;
    
    // Use smart session manager to check for conflicts
    const conflictResolution = await smartSessionManager.checkSessionConflicts(
      userId.toString(), 
      workoutType || 'General'
    );
    
    if (!conflictResolution) {
      return res.json({
        hasConflict: false,
        message: "No conflicts detected, ready to start workout"
      });
    }
    
    // Handle auto-abandonment if recommended
    if (conflictResolution.action === 'auto_abandon') {
      const success = await smartSessionManager.autoAbandonStaleSession(
        conflictResolution.staleSession.sessionId,
        userId.toString(),
        conflictResolution.reason
      );
      
      if (success) {
        return res.json({
          hasConflict: false,
          autoResolved: true,
          message: "Previous stale session auto-abandoned, ready to start workout",
          resolution: conflictResolution
        });
      }
    }
    
    // Return conflict data for user decision
    res.json({
      hasConflict: true,
      conflictData: {
        sessionId: conflictResolution.staleSession.sessionId,
        sessionStartTime: conflictResolution.staleSession.startTime,
        sessionExerciseCount: conflictResolution.staleSession.exerciseCount,
        canAbandon: conflictResolution.staleSession.shouldAutoAbandon || conflictResolution.staleSession.isStale,
        message: conflictResolution.reason,
        idleTime: conflictResolution.staleSession.idleTime,
        warningLevel: conflictResolution.staleSession.warningLevel
      },
      resolution: conflictResolution
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error checking session conflicts:", error);
    res.status(500).json({ 
      hasConflict: false,
      message: "Error checking conflicts, proceeding with caution",
      error: errorMessage 
    });
  }
});

// POST /api/workout-sessions/abandon - Abandon existing session
router.post("/abandon", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!; // Non-null assertion since middleware sets this
    const { sessionId, savePartialData = true } = req.body;
    
    const success = await smartSessionManager.abandonSessionWithUserChoice(
      sessionId,
      userId.toString(),
      savePartialData
    );
    
    if (success) {
      res.json({
        success: true,
        message: savePartialData 
          ? "Session abandoned successfully, partial data saved"
          : "Session cancelled successfully, no data saved"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to abandon session"
      });
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error abandoning session:", error);
    res.status(500).json({ 
      success: false,
      message: errorMessage || "Failed to abandon session" 
    });
  }
});

// POST /api/workout-sessions/start - Begin new workout session
router.post("/start", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workoutType, exerciseIds } = startWorkoutSessionSchema.parse(req.body);
    const userId = req.userId!; // Non-null assertion since middleware sets this
    
    // Smart session management: Check for conflicts before starting
    const conflictResolution = await smartSessionManager.checkSessionConflicts(
      userId.toString(), 
      workoutType
    );
    
    // Handle conflicts according to smart session management
    if (conflictResolution) {
      if (conflictResolution.action === 'auto_abandon') {
        await smartSessionManager.autoAbandonStaleSession(
          conflictResolution.staleSession.sessionId,
          userId.toString(),
          conflictResolution.reason
        );
      } else if (conflictResolution.action === 'user_decision_required') {
        return res.status(409).json({
          error: "Session conflict detected",
          conflictData: {
            sessionId: conflictResolution.staleSession.sessionId,
            sessionStartTime: conflictResolution.staleSession.startTime,
            sessionExerciseCount: conflictResolution.staleSession.exerciseCount,
            canAbandon: true,
            message: conflictResolution.reason
          },
          resolution: conflictResolution,
          suggestion: "Use /api/workout-sessions/check-conflicts to handle this conflict"
        });
      }
    }
    
    // Create new workout session with enhanced structure
    const sessionData = {
      userId,
      workoutType,
      workoutId: null, // Custom workout, not from template
      startTime: new Date(),
      status: "in_progress" as const,
      exercises: exerciseIds ? exerciseIds.map((exerciseId: string, index: number) => ({
        exerciseId,
        exerciseName: `Exercise ${index + 1}`, // Will be filled in by frontend
        sets: [],
        targetSets: 3,
        targetReps: 12,
        targetWeight: 0
      })) : [],
      totalVolume: 0
    };
    
    const session = await storage.createWorkoutSession(sessionData);
    
    res.json({
      sessionId: session.id,
      startTime: session.startTime,
      exercises: session.exercises || [],
      message: "Workout session started successfully"
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    console.error("Error starting workout session:", error);
    res.status(500).json({ message: errorMessage || "Failed to start workout session" });
  }
});

// PATCH /api/workout-sessions/:sessionId/exercises/:exerciseId/sets/:setNumber - Log individual sets
router.patch("/:sessionId/exercises/:exerciseId/sets/:setNumber", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, exerciseId, setNumber } = req.params;
    const setData = logSetSchema.parse(req.body);
    const userId = req.userId!; // Non-null assertion since middleware sets this
    
    // Verify session ownership
    const session = await storage.getWorkoutSession(parseInt(sessionId));
    if (!session || session.userId !== userId) {
      return res.status(404).json({ message: "Workout session not found" });
    }
    
    // Update the set using enhanced storage method
    const success = await storage.updateSetLog(
      parseInt(sessionId),
      exerciseId,
      parseInt(setNumber),
      setData
    );
    
    if (!success) {
      return res.status(400).json({ message: "Failed to update set" });
    }
    
    // Get updated session for progress update
    const updatedSession = await storage.getWorkoutSession(parseInt(sessionId));
    
    res.json({
      success: true,
      progressUpdate: {
        totalVolume: updatedSession?.totalVolume || 0,
        setNumber: parseInt(setNumber),
        exerciseId
      },
      message: `Set ${setNumber} logged successfully`
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid set data", errors: error.errors });
    }
    console.error("Error logging set:", error);
    res.status(500).json({ message: errorMessage || "Failed to log set" });
  }
});

// GET /api/workout-sessions/:sessionId/progress - Real-time session progress
router.get("/:sessionId/progress", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId!; // Non-null assertion since middleware sets this
    
    const session = await storage.getWorkoutSession(parseInt(sessionId));
    if (!session || session.userId !== userId) {
      return res.status(404).json({ message: "Workout session not found" });
    }
    
    // Calculate progress statistics
    const exercises = Array.isArray(session.exercises) ? session.exercises as Array<{
      exerciseId: string;
      exerciseName: string;
      sets?: Array<{ completed: boolean }>;
      targetSets?: number;
    }> : [];
    const completedSets = exercises.reduce((total, ex) => {
      if (ex.sets) {
        return total + ex.sets.filter(set => set.completed).length;
      }
      return total;
    }, 0);
    
    const totalSets = exercises.reduce((total, ex) => {
      return total + (ex.targetSets || 0);
    }, 0);
    
    res.json({
      sessionId: session.id,
      status: session.status,
      totalVolume: session.totalVolume,
      completedSets,
      totalSets,
      duration: session.endTime 
        ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60)
        : Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000 / 60),
      exercises: exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        completedSets: ex.sets ? ex.sets.filter(set => set.completed).length : 0,
        targetSets: ex.targetSets || 0
      }))
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error fetching session progress:", error);
    res.status(500).json({ message: errorMessage || "Failed to fetch session progress" });
  }
});

// POST /api/workout-sessions/:sessionId/complete - Finish workout session
router.post("/:sessionId/complete", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { rating, notes } = completeWorkoutSchema.parse(req.body);
    const userId = req.userId!; // Non-null assertion since middleware sets this
    
    const session = await storage.getWorkoutSession(parseInt(sessionId));
    if (!session || session.userId !== userId) {
      return res.status(404).json({ message: "Workout session not found" });
    }
    
    // Calculate workout statistics
    const exercises = Array.isArray(session.exercises) ? session.exercises as Array<{
      exerciseId: string;
      exerciseName: string;
      sets?: Array<{ completed: boolean }>;
      targetSets?: number;
    }> : [];
    const duration = Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000 / 60);
    const completedSets = exercises.reduce((total, ex) => {
      if (ex.sets) {
        return total + ex.sets.filter(set => set.completed).length;
      }
      return total;
    }, 0);
    
    // Update session as completed
    const updatedSession = await storage.updateWorkoutSession(parseInt(sessionId), {
      status: "completed",
      endTime: new Date(),
      totalDuration: duration,
      notes: notes || session.notes
    });
    
    const summary = {
      duration,
      totalVolume: session.totalVolume,
      exerciseCount: exercises.length,
      setCount: completedSets,
      caloriesBurned: Math.round(duration * 5.5), // Estimate: 5.5 cal/min for strength training
      personalRecords: [] // Personal records calculation pending workout data analysis
    };
    
    res.json({
      session: updatedSession,
      summary,
      message: "Workout completed successfully"
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid completion data", errors: error.errors });
    }
    console.error("Error completing workout:", error);
    res.status(500).json({ message: errorMessage || "Failed to complete workout" });
  }
});

// GET /api/users/:userId/workout-history - Historical workout data
router.get("/users/:userId/workout-history", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const requestUserId = req.userId!; // Non-null assertion since middleware sets this
    
    // Verify user can access this data
    if (parseInt(userId) !== requestUserId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const history = await storage.getUserWorkoutHistory(parseInt(userId));
    
    res.json({
      workouts: history,
      total: history.length,
      message: "Workout history retrieved successfully"
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error fetching workout history:", error);
    res.status(500).json({ message: errorMessage || "Failed to fetch workout history" });
  }
});

// GET /api/exercises/:exerciseId/personal-records - User PRs for exercise
router.get("/exercises/:exerciseId/personal-records", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const userId = req.userId!; // Non-null assertion since middleware sets this
    
    const records = await storage.getExercisePersonalRecords(userId, exerciseId);
    
    // Group records by type
    const maxWeight = records.length > 0 ? Math.max(...records.map(r => r.weight)) : 0;
    const maxReps = records.length > 0 ? Math.max(...records.map(r => r.reps)) : 0;
    const maxVolume = records.length > 0 ? Math.max(...records.map(r => r.volume)) : 0;
    
    res.json({
      exerciseId,
      personalRecords: {
        maxWeight: {
          value: maxWeight,
          date: records.find(r => r.weight === maxWeight)?.date || null
        },
        maxReps: {
          value: maxReps,
          date: records.find(r => r.reps === maxReps)?.date || null
        },
        maxVolume: {
          value: maxVolume,
          date: records.find(r => r.volume === maxVolume)?.date || null
        }
      },
      recentSets: records.slice(0, 10) // Last 10 sets
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error fetching personal records:", error);
    res.status(500).json({ message: errorMessage || "Failed to fetch personal records" });
  }
});

// POST /api/workout-sessions/maintenance/cleanup - Smart session maintenance
router.post("/maintenance/cleanup", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only allow admin/development access for now
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        message: "Maintenance operations are only available in development mode" 
      });
    }
    
    const results = await smartSessionManager.performMaintenanceCleanup();
    
    res.json({
      success: true,
      message: "Smart session maintenance completed",
      results: {
        sessionsProcessed: results.processed,
        sessionsAbandoned: results.abandoned,
        errors: results.errors
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error during smart session maintenance:", error);
    res.status(500).json({ 
      success: false,
      message: errorMessage || "Failed to perform maintenance cleanup" 
    });
  }
});

// GET /api/workout-sessions/session-analysis/:userId - Get session staleness analysis
router.get("/session-analysis/:userId", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const requestUserId = req.userId!; // Non-null assertion since middleware sets this
    
    // Verify user can access this data
    if (parseInt(userId) !== requestUserId && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const analysis = await smartSessionManager.getSessionAnalysis(userId);
    const policy = smartSessionManager.getSessionPolicy();
    
    res.json({
      userId,
      sessionPolicy: policy,
      activeSessions: analysis,
      analysis: {
        totalActiveSessions: analysis.length,
        staleSessions: analysis.filter(s => s.isStale).length,
        criticalSessions: analysis.filter(s => s.warningLevel === 'critical').length,
        autoAbandonCandidates: analysis.filter(s => s.shouldAutoAbandon).length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error getting session analysis:", error);
    res.status(500).json({ 
      message: errorMessage || "Failed to get session analysis" 
    });
  }
});

export default router;