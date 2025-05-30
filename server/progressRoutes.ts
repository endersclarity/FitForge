import { Router } from "express";
import { authenticateToken } from "./auth-middleware";
import { fileStorage } from "./fileStorage";
import { z } from "zod";

const router = Router();

// Get progress metrics
router.get("/metrics", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const period = z.enum(["1M", "3M", "6M", "1Y", "ALL"]).parse(req.query.period || "3M");
    
    const metrics = await fileStorage.getProgressMetrics(userId, period);
    
    res.json(metrics);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid period parameter" });
    }
    console.error("Error fetching progress metrics:", error);
    res.status(500).json({ message: error.message || "Failed to fetch progress metrics" });
  }
});

// Export progress data (enhanced version using real data)
router.get("/export", authenticateToken, async (req: any, res) => {
  try {
    const { format = 'csv' } = req.query;
    const userId = req.userId.toString();
    
    // Get all user data
    const [workouts, bodyStats] = await Promise.all([
      fileStorage.getWorkoutSessions(userId, { limit: 1000 }),
      fileStorage.getBodyStats(userId)
    ]);

    if (format === 'csv') {
      // Create CSV content
      const headers = [
        'Date', 'Type', 'Workout_Type', 'Duration_Min', 'Total_Volume_kg',
        'Exercise_Count', 'Set_Count', 'Calories_Burned', 'Rating',
        'Weight_kg', 'Body_Fat_%', 'Muscle_Mass_kg', 'Energy_Level',
        'Resting_HR', 'Sleep_Hours', 'Notes'
      ];
      
      const rows: string[][] = [];
      
      // Add workout data
      for (const workout of workouts) {
        if (workout.status !== 'completed') continue;
        
        const duration = workout.endTime 
          ? Math.round((new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / 1000 / 60)
          : 0;
        
        rows.push([
          workout.startTime.split('T')[0],
          'workout',
          workout.workoutType,
          duration.toString(),
          workout.totalVolume.toString(),
          workout.exercises.length.toString(),
          workout.exercises.reduce((sum, e) => sum + e.sets.length, 0).toString(),
          workout.caloriesBurned.toString(),
          workout.rating?.toString() || '',
          '', '', '', '', '', '',
          (workout.notes || '').replace(/[,\n]/g, ' ')
        ]);
      }
      
      // Add body stats data
      for (const stat of bodyStats) {
        rows.push([
          stat.date,
          'body_stats',
          '', '', '', '', '', '', '',
          stat.weight?.toString() || '',
          stat.bodyFat?.toString() || '',
          stat.muscleMass?.toString() || '',
          stat.energyLevel?.toString() || '',
          stat.restingHeartRate?.toString() || '',
          stat.sleepHours?.toString() || '',
          (stat.notes || '').replace(/[,\n]/g, ' ')
        ]);
      }
      
      // Sort by date
      rows.sort((a, b) => a[0].localeCompare(b[0]));
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="fitforge-progress-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON format
      res.json({
        exportDate: new Date().toISOString(),
        userId,
        totalWorkouts: workouts.length,
        totalBodyStats: bodyStats.length,
        workouts,
        bodyStats
      });
    }
  } catch (error: any) {
    console.error("Error exporting progress data:", error);
    res.status(500).json({ message: error.message || "Failed to export progress data" });
  }
});

// Get progress chart data
router.get("/chart-data", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const period = z.enum(["1M", "3M", "6M", "1Y", "ALL"]).parse(req.query.period || "3M");
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case "1M": startDate.setMonth(startDate.getMonth() - 1); break;
      case "3M": startDate.setMonth(startDate.getMonth() - 3); break;
      case "6M": startDate.setMonth(startDate.getMonth() - 6); break;
      case "1Y": startDate.setFullYear(startDate.getFullYear() - 1); break;
      case "ALL": startDate.setFullYear(2020); break;
    }

    // Get body stats for the period
    const bodyStats = await fileStorage.getBodyStats(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    // Transform to chart format
    const chartData = bodyStats
      .filter(stat => stat.weight || stat.bodyFat || stat.muscleMass)
      .map(stat => ({
        month: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        muscle: stat.muscleMass || 0,
        fat: stat.bodyFat || 0,
        weight: stat.weight || 0
      }))
      .reverse(); // Oldest first for chart
    
    res.json(chartData);
  } catch (error: any) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({ message: error.message || "Failed to fetch chart data" });
  }
});

export default router;