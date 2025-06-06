import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storageAdapter";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { 
  insertUserSchema, loginSchema, insertWorkoutSchema, 
  insertWorkoutSessionSchema, insertUserStatsSchema,
  insertAchievementSchema, insertChallengeSchema,
  insertChallengeParticipationSchema, insertSocialPostSchema
} from "@shared/schema";
import workoutRoutes from "./workoutRoutes";
import workoutSessionRoutes from "./workoutSessionRoutes";
import bodyStatsRoutes from "./bodyStatsRoutes";
import progressRoutes from "./progressRoutes";
import progressAnalyticsRoutes from "./progressAnalyticsRoutes";
import userPreferencesRoutes from "./userPreferencesRoutes";
import exerciseRoutes from "./routes/exercises";
import goalRoutes from "./goalRoutes";
import notificationRoutes from "./notificationRoutes";

const JWT_SECRET = process.env.JWT_SECRET || "fitforge-secret-key";

interface AuthRequest extends Request {
  userId?: number;
}

// Middleware to auto-assign user ID (bypasses authentication for testing)
const authenticateToken = (req: any, res: any, next: any) => {
  // Use user-id header if provided (for testing), otherwise default to 1
  const userIdHeader = req.headers['user-id'];
  req.userId = userIdHeader ? parseInt(userIdHeader) : 1;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body; // Only require email for now
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "No account found with that email address" });
      }

      // Generate JWT token (skip password verification for now)
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", async (req: any, res) => {
    try {
      // Auto-return Ender's profile (user ID 1)
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Profile update routes
  app.patch("/api/auth/profile", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId;
      const updates = req.body;
      
      // Only allow certain fields to be updated
      const allowedFields = ['firstName', 'lastName', 'email', 'height', 'weight'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      // For this demo, we'll simulate a successful update
      // In a real app, this would update the database
      const updatedUser = {
        id: userId,
        ...filteredUpdates,
        updatedAt: new Date().toISOString()
      };
      
      res.json({
        message: "Profile updated successfully",
        user: updatedUser
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/auth/goals", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { weeklyWorkouts, targetWeight, dailyCalories } = req.body;
      
      // In a real app, this would save to a user_goals table
      const goals = {
        userId,
        weeklyWorkouts: Number(weeklyWorkouts),
        targetWeight: Number(targetWeight),
        dailyCalories: Number(dailyCalories),
        updatedAt: new Date().toISOString()
      };
      
      res.json({
        message: "Goals updated successfully",
        goals
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Legacy exercise route handling moved to mounted router
  // DEPRECATED: Direct workout routes moved to workoutRoutes.ts to prevent conflicts

  // Get previous workout data for ghost text (target calculations)
  app.get("/api/exercises/:exerciseName/previous", authenticateToken, async (req, res) => {
    try {
      const { exerciseName } = req.params;
      const userId = (req as any).userId;
      
      // Get user's workout sessions
      const sessions = await storage.getWorkoutSessions(userId);
      
      // Find the most recent session containing this exercise
      for (const session of sessions.reverse()) { // Most recent first
        if (session.exercises) {
          const exerciseData = Array.isArray(session.exercises) ? session.exercises.find((ex: any) => ex.exerciseName === exerciseName) : null;
          if (exerciseData && exerciseData.sets && exerciseData.sets.length > 0) {
            // Calculate +3% targets based on previous performance
            const lastSet = exerciseData.sets[exerciseData.sets.length - 1];
            const targets = {
              weight: lastSet.weight ? Math.ceil(lastSet.weight * 1.03) : lastSet.weight,
              reps: lastSet.reps ? Math.ceil(lastSet.reps * 1.03) : lastSet.reps,
              previous: {
                weight: lastSet.weight,
                reps: lastSet.reps,
                formScore: lastSet.formScore,
                date: session.startTime
              }
            };
            
            return res.json(targets);
          }
        }
      }
      
      // No previous data found
      res.json({ weight: null, reps: null, previous: null });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Exercise history endpoint for progressive overload
  app.get("/api/exercises/:exerciseId/history", authenticateToken, async (req, res) => {
    try {
      const exerciseId = parseInt(req.params.exerciseId);
      const userId = (req as any).userId;
      
      // Get exercise by weight (used as ID in the current structure)
      const { enderExerciseDatabase } = await import("../scripts/ender-real-exercises");
      const exercise = enderExerciseDatabase.find(ex => ex.weight === exerciseId);
      
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      // Get user's workout sessions
      const sessions = await storage.getWorkoutSessions(userId);
      
      // Filter sessions containing this exercise
      const exerciseSessions = sessions
        .filter(session => {
          if (!session.exercises || !Array.isArray(session.exercises)) return false;
          return session.exercises.some((ex: any) => ex.exerciseName === exercise.exerciseName);
        })
        .map(session => {
          const exerciseData = (session.exercises as any[])?.find((ex: any) => ex.exerciseName === exercise.exerciseName);
          if (!exerciseData) return null;
          
          return {
            sessionId: session.id,
            date: new Date(session.startTime),
            sets: exerciseData.sets || [],
            targetReps: exerciseData.targetReps || 8,
            targetSets: exerciseData.targetSets || 3,
            averageRPE: exerciseData.sets?.length > 0 
              ? exerciseData.sets.reduce((sum: number, set: any) => sum + (set.rpe ?? 7), 0) / exerciseData.sets.length 
              : undefined,
            notes: exerciseData.notes
          };
        })
        .filter(Boolean)
        .sort((a, b) => (b?.date?.getTime() || 0) - (a?.date?.getTime() || 0)) // Most recent first
        .slice(0, 10); // Limit to last 10 sessions
      
      const exerciseHistory = {
        exerciseId,
        exerciseName: exercise.exerciseName,
        exerciseType: exercise.category === 'strength' ? 'compound' : 'isolation',
        category: exercise.category as 'strength' | 'hypertrophy' | 'endurance',
        lastPerformed: exerciseSessions[0]?.date || new Date(),
        sessions: exerciseSessions
      };
      
      res.json(exerciseHistory);
    } catch (error: any) {
      console.error("Error fetching exercise history:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Workout session routes
  app.get("/api/workout-sessions", authenticateToken, async (req: any, res) => {
    try {
      // Use our new StorageAdapter for consistent real data access
      const sessions = await storage.getWorkoutSessions(req.userId);
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching workout sessions:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/workout-logs - Raw workout log data
  app.get("/api/workout-logs", authenticateToken, async (req: any, res) => {
    try {
      
      // Import fileStorage for real workout logs
      const { fileStorage } = await import("./fileStorage");
      await fileStorage.initialize();
      
      // Get raw workout logs
      const workoutLogs = await fileStorage.getWorkoutLogs();
      
      res.json(workoutLogs);
    } catch (error: any) {
      console.error("Error fetching workout logs:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/workout-analytics - Comprehensive workout data including logs
  app.get("/api/workout-analytics", authenticateToken, async (req: any, res) => {
    try {
      
      // Import fileStorage for real user data
      const { fileStorage } = await import("./fileStorage");
      await fileStorage.initialize();
      
      // Get both workout sessions and logs
      const workoutSessions = await fileStorage.getWorkoutSessions(req.userId.toString());
      const workoutLogs = await fileStorage.getWorkoutLogs();
      
      
      // Aggregate completed workouts from logs
      const completedSessionIds = new Set();
      const logsBySession = new Map();
      
      workoutLogs.forEach(log => {
        if (log.exerciseName === 'WORKOUT_COMPLETED') {
          completedSessionIds.add(log.sessionId);
        } else {
          if (!logsBySession.has(log.sessionId)) {
            logsBySession.set(log.sessionId, []);
          }
          logsBySession.get(log.sessionId).push(log);
        }
      });
      
      // Calculate comprehensive stats
      let totalCompletedWorkouts = workoutSessions.filter(s => s.status === 'completed').length;
      totalCompletedWorkouts += completedSessionIds.size; // Add completed sessions from logs
      
      let totalVolume = workoutSessions.reduce((sum, session) => sum + (session.totalVolume || 0), 0);
      
      // Add volume from workout logs
      logsBySession.forEach((logs, sessionId) => {
        if (completedSessionIds.has(sessionId)) {
          const sessionVolume = logs.reduce((sum: number, log: any) => sum + (log.set?.volume || 0), 0);
          totalVolume += sessionVolume;
        }
      });
      
      const totalCalories = Math.round(totalVolume * 0.1); // Estimate: 0.1 cal per lb
      
      
      res.json({
        totalCompletedWorkouts,
        totalVolume,
        totalCalories,
        sessionsFromDatabase: workoutSessions.length,
        completedFromLogs: completedSessionIds.size,
        logEntries: workoutLogs.length,
        message: "Comprehensive workout analytics aggregated from all sources"
      });
    } catch (error: any) {
      console.error("Error fetching comprehensive workout analytics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/workout-sessions", authenticateToken, async (req: any, res) => {
    try {
      const sessionData = insertWorkoutSessionSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const session = await storage.createWorkoutSession(sessionData);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/workout-sessions/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const session = await storage.updateWorkoutSession(id, updates);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User stats routes
  app.get("/api/user-stats", authenticateToken, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const stats = await storage.getUserStats(req.userId, limit);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/user-stats/latest", authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getLatestUserStats(req.userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/user-stats", authenticateToken, async (req: any, res) => {
    try {
      const statsData = insertUserStatsSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const stats = await storage.createUserStats(statsData);
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Achievement routes
  app.get("/api/achievements", authenticateToken, async (req: any, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.userId);
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/achievements", authenticateToken, async (req: any, res) => {
    try {
      const achievementData = insertAchievementSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const achievement = await storage.createAchievement(achievementData);
      res.json(achievement);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Challenge routes
  app.get("/api/challenges", async (req, res) => {
    try {
      const challenges = await storage.getActiveChallenges();
      res.json(challenges);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/challenges/my-participations", authenticateToken, async (req: any, res) => {
    try {
      const participations = await storage.getChallengeParticipations(req.userId);
      res.json(participations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/join", authenticateToken, async (req: any, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const participation = await storage.joinChallenge({
        userId: req.userId,
        challengeId,
        progress: 0,
        isCompleted: false
      });
      res.json(participation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/challenges/:id/progress", authenticateToken, async (req: any, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const { progress } = req.body;
      const participation = await storage.updateChallengeProgress(req.userId, challengeId, progress);
      if (!participation) {
        return res.status(404).json({ message: "Participation not found" });
      }
      res.json(participation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Social routes
  app.get("/api/social/posts", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const posts = await storage.getSocialPosts(limit);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/social/posts", authenticateToken, async (req: any, res) => {
    try {
      const postData = insertSocialPostSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const post = await storage.createSocialPost(postData);
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/social/posts/:id/like", authenticateToken, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const success = await storage.likeSocialPost(postId);
      if (!success) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Nutrition routes
  app.get("/api/nutrition/foods/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }
      
      // Mock food database - in a real app this would be a proper food API
      const mockFoods = [
        { id: 1, name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.3, serving: "1 medium" },
        { id: 2, name: "Chicken Breast", calories: 231, protein: 43.5, carbs: 0, fat: 5, serving: "4 oz" },
        { id: 3, name: "Brown Rice", calories: 216, protein: 5, carbs: 45, fat: 1.8, serving: "1 cup cooked" },
        { id: 4, name: "Eggs", calories: 140, protein: 12, carbs: 1, fat: 10, serving: "2 large" },
        { id: 5, name: "Almonds", calories: 164, protein: 6, carbs: 6, fat: 14, serving: "1 oz" },
        { id: 6, name: "Avocado", calories: 160, protein: 2, carbs: 9, fat: 15, serving: "1/2 medium" },
        { id: 7, name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fat: 0, serving: "6 oz" },
        { id: 8, name: "Oatmeal", calories: 150, protein: 5, carbs: 27, fat: 3, serving: "1/2 cup dry" },
        { id: 9, name: "Salmon", calories: 208, protein: 28, carbs: 0, fat: 10, serving: "4 oz" },
        { id: 10, name: "Quinoa", calories: 222, protein: 8, carbs: 39, fat: 4, serving: "1 cup cooked" }
      ];
      
      const results = mockFoods.filter(food => 
        food.name.toLowerCase().includes(q.toLowerCase())
      );
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/nutrition/log", authenticateToken, async (req: any, res) => {
    try {
      const { foodId, foodName, calories, protein, carbs, fat, serving, mealType } = req.body;
      
      // In a real app, this would save to a nutrition_logs table
      // For now, just return success with the logged food data
      const logEntry = {
        id: Date.now(), // Mock ID
        userId: req.userId,
        foodId,
        foodName,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
        serving,
        mealType: mealType || 'snack',
        loggedAt: new Date().toISOString()
      };
      
      res.json(logEntry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/nutrition/daily-intake", authenticateToken, async (req: any, res) => {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      
      // Mock daily intake data - in a real app this would aggregate from nutrition_logs
      const dailyIntake = {
        date: targetDate.toISOString().split('T')[0],
        calories: 1650,
        protein: 98,
        carbs: 180,
        fat: 45,
        meals: [
          {
            type: 'breakfast',
            foods: [
              { name: 'Oatmeal with berries', calories: 320, protein: 12 }
            ]
          },
          {
            type: 'lunch', 
            foods: [
              { name: 'Chicken salad bowl', calories: 450, protein: 35 }
            ]
          },
          {
            type: 'snack',
            foods: [
              { name: 'Greek yogurt', calories: 150, protein: 15 }
            ]
          },
          {
            type: 'dinner',
            foods: [
              { name: 'Salmon with quinoa', calories: 520, protein: 36 }
            ]
          }
        ]
      };
      
      res.json(dailyIntake);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Progress export route
  app.get("/api/progress/export", authenticateToken, async (req: any, res) => {
    try {
      const { format = 'csv' } = req.query;
      const userId = req.userId;
      
      // Get user data for export
      const [userStats, workoutSessions] = await Promise.all([
        storage.getUserStats(userId),
        storage.getWorkoutSessions(userId)
      ]);

      // Generate export data based on real user data
      const exportData = [];
      
      // Add workout session data
      for (const session of workoutSessions) {
        exportData.push({
          date: new Date(session.startTime).toISOString().split('T')[0],
          type: 'workout',
          sessionId: session.id,
          workoutType: 'Mixed', // workoutType not available in schema
          duration: session.totalDuration || 0,
          calories: session.caloriesBurned || 0,
          formScore: session.formScore || 0,
          exercises: session.exercises ? (Array.isArray(session.exercises) ? session.exercises.length : 0) : 0,
          notes: session.notes || ''
        });
      }

      // Add user stats data (body composition)
      for (const stat of userStats) {
        exportData.push({
          date: new Date(stat.createdAt).toISOString().split('T')[0],
          type: 'body_stats',
          weight: stat.weight || '',
          bodyFat: stat.bodyFat || '',
          muscleMass: stat.muscleMass || '',
          energyLevel: stat.energyLevel || '',
          stressLevel: stat.stressLevel || '', // restingHeartRate not available in schema
          sleepHours: stat.sleepHours || ''
        });
      }

      // Sort by date
      exportData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (format === 'csv') {
        // Create CSV content
        const headers = [
          'Date', 'Type', 'Workout_Type', 'Duration_Min', 'Calories_Burned', 
          'Form_Score', 'Exercise_Count', 'Weight_kg', 'Body_Fat_%', 
          'Muscle_Mass_kg', 'Energy_Level', 'Stress_Level', 'Sleep_Hours', 'Notes'
        ];
        
        const csvRows = exportData.map(row => [
          row.date,
          row.type,
          row.workoutType || '',
          row.duration || '',
          row.calories || '',
          row.formScore || '',
          row.exercises || '',
          row.weight || '',
          row.bodyFat || '',
          row.muscleMass || '',
          row.energyLevel || '',
          row.stressLevel || '',
          row.sleepHours || '',
          (row.notes || '').replace(/,/g, ';') // Escape commas in notes
        ]);

        const csvContent = [
          headers.join(','),
          ...csvRows.map(row => row.join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="fitforge-progress-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // Return JSON format
        res.json({
          exportDate: new Date().toISOString(),
          userId,
          totalWorkouts: workoutSessions.length,
          totalStats: userStats.length,
          data: exportData
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Mount real data routes
  app.use("/api/workouts", workoutRoutes);
  app.use("/api/workout-sessions", workoutSessionRoutes);
  app.use("/api/body-stats", bodyStatsRoutes);
  app.use("/api/progress", progressRoutes);
  app.use("/api/progress", progressAnalyticsRoutes);
  app.use("/api/users", userPreferencesRoutes);
  app.use("/api/exercises", exerciseRoutes);
  app.use("/api/goals", goalRoutes);
  app.use("/api/notifications", notificationRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
