import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// POST /api/log-workout - Log workout data to local file
router.post('/', async (req, res) => {
  try {
    const { sessionId, exerciseName, set, workoutType, timestamp } = req.body;
    
    if (!sessionId || !exerciseName || !set) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'sessionId, exerciseName, and set are required'
      });
    }

    // Create workout logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'data', 'workout-logs');
    await fs.mkdir(logsDir, { recursive: true });

    // Create log entry
    const logEntry = {
      timestamp,
      sessionId,
      workoutType,
      exerciseName,
      set: {
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
        equipment: set.equipment,
        volume: set.volume,
        timestamp: set.timestamp
      }
    };

    // Append to daily log file
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(logsDir, `workout-${today}.json`);
    
    let existingLogs = [];
    try {
      const existingData = await fs.readFile(logFile, 'utf-8');
      existingLogs = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist yet, start with empty array
    }

    existingLogs.push(logEntry);
    
    await fs.writeFile(logFile, JSON.stringify(existingLogs, null, 2));
    
    console.log(`📝 Logged set to: ${logFile}`);
    console.log(`   Exercise: ${exerciseName}`);
    console.log(`   Set: ${set.weight}lbs x ${set.reps} reps`);
    
    res.json({
      success: true,
      message: 'Workout logged successfully',
      logFile: `workout-${today}.json`
    });

  } catch (error) {
    console.error('Error logging workout:', error);
    res.status(500).json({
      error: 'Failed to log workout',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;