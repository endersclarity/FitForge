import { Router } from "express";
import { authenticateToken } from "./auth-middleware";
import { fileStorage } from "./fileStorage";
import { z } from "zod";

const router = Router();

// Initialize file storage on startup
fileStorage.initialize().catch(console.error);

// Validation schemas
const startWorkoutSchema = z.object({
  workoutType: z.string(),
  plannedExercises: z.array(z.string()).optional()
});

const logSetSchema = z.object({
  exerciseId: z.number(),
  exerciseName: z.string(),
  setNumber: z.number(),
  weight: z.number().min(0),
  reps: z.number().min(1),
  equipment: z.string().optional(),
  formScore: z.number().min(1).max(10).optional(),
  notes: z.string().optional()
});

const completeWorkoutSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
});

// Start a new workout session
router.post("/start", authenticateToken, async (req: any, res) => {
  try {
    const { workoutType, plannedExercises } = startWorkoutSchema.parse(req.body);
    const userId = req.userId.toString();
    
    // Check if there's already an active session
    const activeSession = await fileStorage.getActiveWorkoutSession(userId);
    if (activeSession) {
      return res.status(409).json({ 
        message: "You already have an active workout session. Please complete or abandon it first.",
        sessionId: activeSession.id,
        sessionStartTime: activeSession.startTime,
        sessionExerciseCount: activeSession.exercises.length,
        canAbandon: true
      });
    }
    
    const session = await fileStorage.createWorkoutSession(userId, workoutType, plannedExercises);
    
    res.json({
      sessionId: session.id,
      startTime: session.startTime,
      message: "Workout session started successfully"
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    console.error("Error starting workout:", error);
    res.status(500).json({ message: error.message || "Failed to start workout session" });
  }
});

// Log a set during workout
router.post("/:sessionId/sets", authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const setData = logSetSchema.parse(req.body);
    const userId = req.userId.toString();
    
    const result = await fileStorage.logSet(
      userId,
      sessionId,
      setData.exerciseId,
      setData.exerciseName,
      {
        setNumber: setData.setNumber,
        weight: setData.weight,
        reps: setData.reps,
        equipment: setData.equipment,
        formScore: setData.formScore,
        notes: setData.notes
      }
    );
    
    res.json({
      success: result.success,
      totalVolume: result.totalVolume,
      setId: result.setId,
      message: `Set ${setData.setNumber} logged successfully`
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid set data", errors: error.errors });
    }
    console.error("Error logging set:", error);
    res.status(500).json({ message: error.message || "Failed to log set" });
  }
});

// Complete a workout session
router.put("/:sessionId/complete", authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, notes } = completeWorkoutSchema.parse(req.body);
    const userId = req.userId.toString();
    
    const summary = await fileStorage.completeWorkout(userId, sessionId, rating, notes);
    
    res.json({
      message: "Workout completed successfully",
      summary: {
        duration: summary.duration,
        totalVolume: summary.totalVolume,
        exerciseCount: summary.exerciseCount,
        setCount: summary.setCount,
        caloriesBurned: summary.caloriesBurned,
        personalRecords: summary.personalRecords
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid completion data", errors: error.errors });
    }
    console.error("Error completing workout:", error);
    res.status(500).json({ message: error.message || "Failed to complete workout" });
  }
});

// Get workout history
router.get("/history", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { limit, offset, from, to, workoutType } = req.query;
    
    const filters = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      from: from as string,
      to: to as string,
      workoutType: workoutType as string
    };
    
    const workouts = await fileStorage.getWorkoutSessions(userId, filters);
    
    res.json({
      workouts,
      total: workouts.length,
      hasMore: workouts.length === (filters.limit || 50)
    });
  } catch (error: any) {
    console.error("Error fetching workout history:", error);
    res.status(500).json({ message: error.message || "Failed to fetch workout history" });
  }
});

// Get active workout session
router.get("/active", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const activeSession = await fileStorage.getActiveWorkoutSession(userId);
    
    if (!activeSession) {
      return res.status(404).json({ message: "No active workout session found" });
    }
    
    res.json(activeSession);
  } catch (error: any) {
    console.error("Error fetching active session:", error);
    res.status(500).json({ message: error.message || "Failed to fetch active session" });
  }
});

// Get detailed active session info
router.get("/active/details", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const activeSession = await fileStorage.getActiveWorkoutSession(userId);
    
    if (!activeSession) {
      return res.status(404).json({ message: "No active workout session found" });
    }
    
    const sessionAge = Date.now() - new Date(activeSession.startTime).getTime();
    const sessionAgeMinutes = Math.round(sessionAge / 1000 / 60);
    
    res.json({
      ...activeSession,
      sessionAgeMinutes,
      canAbandon: true,
      canResume: activeSession.exercises.some(e => e.sets.length > 0)
    });
  } catch (error: any) {
    console.error("Error fetching active session details:", error);
    res.status(500).json({ message: error.message || "Failed to fetch active session details" });
  }
});

// Force cleanup active sessions
router.delete("/active", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const cleanedCount = await fileStorage.cleanupOldSessions(userId, 0); // Force cleanup all
    
    res.json({ 
      message: `Cleaned up ${cleanedCount} active sessions`,
      cleanedCount 
    });
  } catch (error: any) {
    console.error("Error cleaning up sessions:", error);
    res.status(500).json({ message: error.message || "Failed to cleanup sessions" });
  }
});

// Force abandon specific session
router.put("/:sessionId/force-abandon", authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId.toString();
    
    await fileStorage.forceAbandonSession(userId, sessionId);
    
    res.json({ message: "Session force abandoned successfully" });
  } catch (error: any) {
    console.error("Error force abandoning session:", error);
    res.status(500).json({ message: error.message || "Failed to force abandon session" });
  }
});

// Abandon a workout session
router.put("/:sessionId/abandon", authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId.toString();
    
    // Use the dedicated abandon method instead of completing
    await fileStorage.forceAbandonSession(userId, sessionId);
    
    res.json({ message: "Workout session abandoned successfully" });
  } catch (error: any) {
    console.error("Error abandoning workout:", error);
    res.status(500).json({ message: error.message || "Failed to abandon workout" });
  }
});

export default router;