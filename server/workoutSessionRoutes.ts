import { Router } from "express";
import { storage } from "./storage";
import { z } from "zod";

const router = Router();

// Middleware to auto-assign Ender's user ID (bypasses authentication for testing)
const authenticateToken = (req: any, res: any, next: any) => {
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

// POST /api/workout-sessions/start - Begin new workout session
router.post("/start", authenticateToken, async (req: any, res) => {
  try {
    const { workoutType, exerciseIds } = startWorkoutSessionSchema.parse(req.body);
    const userId = req.userId;
    
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    console.error("Error starting workout session:", error);
    res.status(500).json({ message: error.message || "Failed to start workout session" });
  }
});

// PATCH /api/workout-sessions/:sessionId/exercises/:exerciseId/sets/:setNumber - Log individual sets
router.patch("/:sessionId/exercises/:exerciseId/sets/:setNumber", authenticateToken, async (req: any, res) => {
  try {
    const { sessionId, exerciseId, setNumber } = req.params;
    const setData = logSetSchema.parse(req.body);
    const userId = req.userId;
    
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid set data", errors: error.errors });
    }
    console.error("Error logging set:", error);
    res.status(500).json({ message: error.message || "Failed to log set" });
  }
});

// GET /api/workout-sessions/:sessionId/progress - Real-time session progress
router.get("/:sessionId/progress", authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;
    
    const session = await storage.getWorkoutSession(parseInt(sessionId));
    if (!session || session.userId !== userId) {
      return res.status(404).json({ message: "Workout session not found" });
    }
    
    // Calculate progress statistics
    const exercises = Array.isArray(session.exercises) ? session.exercises as any[] : [];
    const completedSets = exercises.reduce((total, ex) => {
      if (ex.sets) {
        return total + ex.sets.filter((set: any) => set.completed).length;
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
      exercises: exercises.map((ex: any) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        completedSets: ex.sets ? ex.sets.filter((set: any) => set.completed).length : 0,
        targetSets: ex.targetSets || 0
      }))
    });
  } catch (error: any) {
    console.error("Error fetching session progress:", error);
    res.status(500).json({ message: error.message || "Failed to fetch session progress" });
  }
});

// POST /api/workout-sessions/:sessionId/complete - Finish workout session
router.post("/:sessionId/complete", authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, notes } = completeWorkoutSchema.parse(req.body);
    const userId = req.userId;
    
    const session = await storage.getWorkoutSession(parseInt(sessionId));
    if (!session || session.userId !== userId) {
      return res.status(404).json({ message: "Workout session not found" });
    }
    
    // Calculate workout statistics
    const exercises = Array.isArray(session.exercises) ? session.exercises as any[] : [];
    const duration = Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000 / 60);
    const completedSets = exercises.reduce((total, ex) => {
      if (ex.sets) {
        return total + ex.sets.filter((set: any) => set.completed).length;
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
      personalRecords: [] // TODO: Calculate personal records
    };
    
    res.json({
      session: updatedSession,
      summary,
      message: "Workout completed successfully"
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid completion data", errors: error.errors });
    }
    console.error("Error completing workout:", error);
    res.status(500).json({ message: error.message || "Failed to complete workout" });
  }
});

// GET /api/users/:userId/workout-history - Historical workout data
router.get("/users/:userId/workout-history", authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const requestUserId = req.userId;
    
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
  } catch (error: any) {
    console.error("Error fetching workout history:", error);
    res.status(500).json({ message: error.message || "Failed to fetch workout history" });
  }
});

// GET /api/exercises/:exerciseId/personal-records - User PRs for exercise
router.get("/exercises/:exerciseId/personal-records", authenticateToken, async (req: any, res) => {
  try {
    const { exerciseId } = req.params;
    const userId = req.userId;
    
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
  } catch (error: any) {
    console.error("Error fetching personal records:", error);
    res.status(500).json({ message: error.message || "Failed to fetch personal records" });
  }
});

export default router;