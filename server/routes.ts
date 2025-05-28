import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { 
  insertUserSchema, loginSchema, insertWorkoutSchema, 
  insertWorkoutSessionSchema, insertUserStatsSchema,
  insertAchievementSchema, insertChallengeSchema,
  insertChallengeParticipationSchema, insertSocialPostSchema
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "fitforge-secret-key";

interface AuthRequest extends Request {
  userId?: number;
}

// Middleware to auto-assign Ender's user ID (bypasses authentication for testing)
const authenticateToken = (req: any, res: any, next: any) => {
  // Auto-assign Ender's user ID (first user in storage)
  req.userId = 1;
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
        profileImage: user.profileImage
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Exercise library routes
  app.get("/api/exercises", async (req, res) => {
    try {
      const { enderExerciseDatabase } = await import("../scripts/ender-real-exercises");
      
      // Return all exercises with filtering options
      const { category, workoutType, equipment } = req.query;
      let exercises = enderExerciseDatabase;
      
      if (category) {
        exercises = exercises.filter(ex => ex.category === category);
      }
      if (workoutType) {
        exercises = exercises.filter(ex => ex.workoutType === workoutType);
      }
      if (equipment) {
        exercises = exercises.filter(ex => ex.equipmentType === equipment);
      }
      
      res.json(exercises);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Workout routes
  app.get("/api/workouts", async (req, res) => {
    try {
      const { category, difficulty } = req.query;
      const workouts = await storage.getWorkouts({
        category: category as string,
        difficulty: difficulty as string
      });
      res.json(workouts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workout = await storage.getWorkout(id);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.json(workout);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/workouts", authenticateToken, async (req: any, res) => {
    try {
      const workoutData = insertWorkoutSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const workout = await storage.createWorkout(workoutData);
      res.json(workout);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

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
          const exerciseData = session.exercises.find((ex: any) => ex.exerciseName === exerciseName);
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

  // Workout session routes
  app.get("/api/workout-sessions", authenticateToken, async (req: any, res) => {
    try {
      const sessions = await storage.getWorkoutSessions(req.userId);
      res.json(sessions);
    } catch (error: any) {
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

  const httpServer = createServer(app);
  return httpServer;
}
