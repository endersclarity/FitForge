import { Router } from "express";
import { authenticateToken } from "./auth-middleware";
import { fileStorage } from "./fileStorage";
import { z } from "zod";

const router = Router();

// Validation schemas
const bodyStatsSchema = z.object({
  weight: z.number().min(20).max(300).optional(),
  bodyFat: z.number().min(1).max(50).optional(),
  muscleMass: z.number().min(10).max(150).optional(),
  restingHeartRate: z.number().min(30).max(200).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  notes: z.string().optional()
});

// Log body stats
router.post("/", authenticateToken, async (req: any, res) => {
  try {
    const stats = bodyStatsSchema.parse(req.body);
    const userId = req.userId.toString();
    
    // Ensure at least one stat is provided
    if (!Object.keys(stats).some(key => stats[key as keyof typeof stats] !== undefined)) {
      return res.status(400).json({ message: "Please provide at least one body stat to log" });
    }
    
    const result = await fileStorage.logBodyStats(userId, stats);
    
    res.json({
      message: "Body stats logged successfully",
      id: result.id,
      date: result.date
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid body stats data", errors: error.errors });
    }
    console.error("Error logging body stats:", error);
    res.status(500).json({ message: error.message || "Failed to log body stats" });
  }
});

// Get body stats history
router.get("/", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { from, to } = req.query;
    
    const stats = await fileStorage.getBodyStats(
      userId,
      from as string,
      to as string
    );
    
    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching body stats:", error);
    res.status(500).json({ message: error.message || "Failed to fetch body stats" });
  }
});

// Get latest body stats
router.get("/latest", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const latestStats = await fileStorage.getLatestBodyStats(userId);
    
    if (!latestStats) {
      return res.status(404).json({ message: "No body stats found" });
    }
    
    res.json(latestStats);
  } catch (error: any) {
    console.error("Error fetching latest body stats:", error);
    res.status(500).json({ message: error.message || "Failed to fetch latest body stats" });
  }
});

export default router;