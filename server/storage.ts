import { 
  users, workouts, workoutSessions, userStats, achievements, 
  challenges, challengeParticipations, socialPosts,
  type User, type InsertUser, type Workout, type InsertWorkout,
  type WorkoutSession, type InsertWorkoutSession, type UserStats, type InsertUserStats,
  type Achievement, type InsertAchievement, type Challenge, type InsertChallenge,
  type ChallengeParticipation, type InsertChallengeParticipation,
  type SocialPost, type InsertSocialPost
} from "@shared/schema";
import { enderExerciseDatabase, enderWorkoutRoutines } from "../scripts/ender-real-exercises";
import { generateSixMonthWorkoutHistory } from "../scripts/generate-realistic-workout-history";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Workout methods
  getWorkouts(filters?: { category?: string; difficulty?: string; userId?: number }): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout | undefined>;
  deleteWorkout(id: number): Promise<boolean>;

  // Workout session methods
  getWorkoutSessions(userId: number): Promise<WorkoutSession[]>;
  getWorkoutSession(id: number): Promise<WorkoutSession | undefined>;
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  updateWorkoutSession(id: number, updates: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined>;

  // User stats methods
  getUserStats(userId: number, limit?: number): Promise<UserStats[]>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  getLatestUserStats(userId: number): Promise<UserStats | undefined>;

  // Achievement methods
  getUserAchievements(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;

  // Challenge methods
  getActiveChallenges(): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getChallengeParticipations(userId: number): Promise<(ChallengeParticipation & { challenge: Challenge })[]>;
  joinChallenge(participation: InsertChallengeParticipation): Promise<ChallengeParticipation>;
  updateChallengeProgress(userId: number, challengeId: number, progress: number): Promise<ChallengeParticipation | undefined>;

  // Social methods
  getSocialPosts(limit?: number): Promise<(SocialPost & { user: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImage'> })[]>;
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  likeSocialPost(postId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workouts: Map<number, Workout>;
  private workoutSessions: Map<number, WorkoutSession>;
  private userStats: Map<number, UserStats>;
  private achievements: Map<number, Achievement>;
  private challenges: Map<number, Challenge>;
  private challengeParticipations: Map<number, ChallengeParticipation>;
  private socialPosts: Map<number, SocialPost>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.workouts = new Map();
    this.workoutSessions = new Map();
    this.userStats = new Map();
    this.achievements = new Map();
    this.challenges = new Map();
    this.challengeParticipations = new Map();
    this.socialPosts = new Map();
    this.currentId = 1;
    
    this.seedData();
  }

  private seedData() {
    // Create real workouts from Ender's exercise database with A/B variations
    const realWorkouts: InsertWorkout[] = [
      // PUSH DAY - Chest & Triceps
      {
        userId: 1,
        name: enderWorkoutRoutines.ChestTriceps.name,
        description: enderWorkoutRoutines.ChestTriceps.description,
        category: "strength",
        difficulty: "intermediate",
        duration: enderWorkoutRoutines.ChestTriceps.duration,
        calories: enderWorkoutRoutines.ChestTriceps.duration * 5.5, // ~5.5 cal/min for strength training
        equipment: ["barbell", "dumbbells", "trx", "bench", "kettlebell"],
        exercises: enderWorkoutRoutines.ChestTriceps.exercises.slice(0, 6).map(ex => ({
          name: ex.exerciseName,
          sets: 3,
          reps: ex.reps <= 5 ? 12 : Math.max(8, 15 - ex.reps),
          weight: ex.weight === "Bodyweight" ? undefined : ex.weight,
          equipment: ex.equipmentType,
          primaryMuscles: ex.primaryMuscles.map(m => `${m.muscle}:${m.percentage}%`).join(", "),
          variation: ex.variation
        })),
        imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        isPublic: true
      },
      // PULL DAY - Back & Biceps  
      {
        userId: 1,
        name: enderWorkoutRoutines.BackBiceps.name,
        description: enderWorkoutRoutines.BackBiceps.description,
        category: "strength", 
        difficulty: "intermediate",
        duration: enderWorkoutRoutines.BackBiceps.duration,
        calories: enderWorkoutRoutines.BackBiceps.duration * 5.5,
        equipment: ["dumbbells", "pull-up bar", "trx", "cable", "barbell"],
        exercises: enderWorkoutRoutines.BackBiceps.exercises.slice(0, 6).map(ex => ({
          name: ex.exerciseName,
          sets: 3,
          reps: ex.reps <= 5 ? 12 : Math.max(8, 15 - ex.reps),
          weight: ex.weight === "Bodyweight" ? undefined : ex.weight,
          equipment: ex.equipmentType,
          primaryMuscles: ex.primaryMuscles.map(m => `${m.muscle}:${m.percentage}%`).join(", "),
          variation: ex.variation
        })),
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        isPublic: true
      },
      // LEG DAY
      {
        userId: 1,
        name: enderWorkoutRoutines.Legs.name,
        description: enderWorkoutRoutines.Legs.description,
        category: "strength",
        difficulty: "intermediate", 
        duration: enderWorkoutRoutines.Legs.duration,
        calories: enderWorkoutRoutines.Legs.duration * 6.5, // Higher calorie burn for legs
        equipment: ["kettlebell", "barbell", "plybox"],
        exercises: enderWorkoutRoutines.Legs.exercises.map(ex => ({
          name: ex.exerciseName,
          sets: ex.exerciseName.includes("Calf") ? 4 : 3,
          reps: ex.exerciseName.includes("Deadlift") ? 6 : ex.exerciseName.includes("Calf") ? 20 : 12,
          weight: ex.weight === "Bodyweight" ? undefined : ex.weight,
          equipment: ex.equipmentType,
          primaryMuscles: ex.primaryMuscles.map(m => `${m.muscle}:${m.percentage}%`).join(", "),
          variation: ex.variation
        })),
        imageUrl: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        isPublic: true
      },
      // CORE DAY
      {
        userId: 1,
        name: enderWorkoutRoutines.Abs.name,
        description: enderWorkoutRoutines.Abs.description,
        category: "core",
        difficulty: "intermediate",
        duration: enderWorkoutRoutines.Abs.duration,
        calories: enderWorkoutRoutines.Abs.duration * 4.5,
        equipment: ["trx", "bench", "pull-up bar"],
        exercises: enderWorkoutRoutines.Abs.exercises.map(ex => ({
          name: ex.exerciseName,
          sets: 3,
          reps: ex.exerciseName.includes("Plank") ? 1 : 15,
          duration: ex.exerciseName.includes("Plank") ? 60 : undefined,
          equipment: ex.equipmentType,
          primaryMuscles: ex.primaryMuscles.map(m => `${m.muscle}:${m.percentage}%`).join(", "),
          variation: ex.variation
        })),
        imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        isPublic: true
      },
      // PUSH DAY - Variation A (Focus on Compound Movements)
      {
        userId: 1,
        name: "Ender's Push Day - Variation A",
        description: "Heavy compound focus with barbells and progressive overload",
        category: "strength",
        difficulty: "intermediate",
        duration: 70,
        calories: 385,
        equipment: ["barbell", "bench", "dumbbells"],
        exercises: enderWorkoutRoutines.ChestTriceps.exercises.filter(ex => ex.variation === "A").map(ex => ({
          name: ex.exerciseName,
          sets: 4,
          reps: Math.max(6, 12 - Math.floor(ex.reps / 3)),
          weight: ex.weight === "Bodyweight" ? undefined : ex.weight,
          equipment: ex.equipmentType,
          primaryMuscles: ex.primaryMuscles.map(m => `${m.muscle}:${m.percentage}%`).join(", "),
          variation: ex.variation
        })),
        imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        isPublic: true
      },
      // PUSH DAY - Variation B (Focus on Volume & Accessories)  
      {
        userId: 1,
        name: "Ender's Push Day - Variation B",
        description: "Higher volume with accessory movements and isolation work",
        category: "strength", 
        difficulty: "intermediate",
        duration: 75,
        calories: 410,
        equipment: ["dumbbells", "trx", "kettlebell", "incline bench"],
        exercises: enderWorkoutRoutines.ChestTriceps.exercises.filter(ex => ex.variation === "B" || ex.variation === "A/B").map(ex => ({
          name: ex.exerciseName,
          sets: 3,
          reps: Math.max(10, 18 - Math.floor(ex.reps / 2)),
          weight: ex.weight === "Bodyweight" ? undefined : ex.weight,
          equipment: ex.equipmentType,
          primaryMuscles: ex.primaryMuscles.map(m => `${m.muscle}:${m.percentage}%`).join(", "),
          variation: ex.variation
        })),
        imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        isPublic: true
      },
      // PULL DAY - Variation A (Heavy Pulling)
      {
        userId: 1,
        name: "Ender's Pull Day - Variation A", 
        description: "Heavy compound pulling with deadlifts and weighted pull-ups",
        category: "strength",
        difficulty: "intermediate", 
        duration: 65,
        calories: 360,
        equipment: ["barbell", "pull-up bar", "dumbbells"],
        exercises: enderWorkoutRoutines.BackBiceps.exercises.filter(ex => ex.variation === "A").map(ex => ({
          name: ex.exerciseName,
          sets: 4,
          reps: ex.exerciseName.includes("Pull") ? 8 : Math.max(6, 12 - Math.floor(ex.reps / 3)),
          weight: ex.weight === "Bodyweight" ? undefined : ex.weight,
          equipment: ex.equipmentType,
          primaryMuscles: ex.primaryMuscles.map(m => `${m.muscle}:${m.percentage}%`).join(", "),
          variation: ex.variation
        })),
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        isPublic: true
      },
      // PULL DAY - Variation B (Volume & Width Focus)
      {
        userId: 1,
        name: "Ender's Pull Day - Variation B",
        description: "High volume back width and bicep specialization",
        category: "strength",
        difficulty: "intermediate",
        duration: 60,
        calories: 330,
        equipment: ["pull-up bar", "cable", "trx", "dumbbells"],
        exercises: enderWorkoutRoutines.BackBiceps.exercises.filter(ex => ex.variation === "B" || ex.variation === "A/B").slice(0, 7).map(ex => ({
          name: ex.exerciseName,
          sets: 3,
          reps: ex.exerciseName.includes("Curl") ? 15 : Math.max(8, 15 - Math.floor(ex.reps / 3)),
          weight: ex.weight === "Bodyweight" ? undefined : ex.weight,
          equipment: ex.equipmentType,
          primaryMuscles: ex.primaryMuscles.map(m => `${m.muscle}:${m.percentage}%`).join(", "),
          variation: ex.variation
        })),
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        isPublic: true
      },
      // LEGS - Heavy Compound
      {
        userId: 1,
        name: "Ender's Leg Day - Heavy Compound",
        description: "Heavy squats, deadlifts, and compound leg movements",
        category: "strength",
        difficulty: "intermediate",
        duration: 55,
        calories: 360,
        equipment: ["barbell", "kettlebell"],
        exercises: enderWorkoutRoutines.Legs.exercises.filter(ex => ex.exerciseName.includes("Squat") || ex.exerciseName.includes("Deadlift")).map(ex => ({
          name: ex.exerciseName,
          sets: 4,
          reps: ex.exerciseName.includes("Deadlift") ? 5 : 8,
          weight: ex.weight === "Bodyweight" ? undefined : ex.weight,
          equipment: ex.equipmentType,
          primaryMuscles: ex.primaryMuscles.map(m => `${m.muscle}:${m.percentage}%`).join(", "),
          variation: ex.variation
        })),
        imageUrl: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        isPublic: true
      },
      // FREEFORM WORKOUT - For custom exercise logging
      {
        userId: 1,
        name: "Freeform Workout",
        description: "Custom exercise selection and logging",
        category: "custom",
        difficulty: "any",
        duration: 60,
        calories: 300,
        equipment: [],
        exercises: [],
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        isPublic: true
      }
    ];

    // Create sample challenges
    const sampleChallenges: InsertChallenge[] = [
      {
        name: "January Cardio Blitz",
        description: "Complete 20 cardio sessions this month. Win exclusive NFT badges!",
        type: "cardio",
        target: 20,
        unit: "sessions",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        isActive: true,
        participants: 12847
      },
      {
        name: "Mindful Movement",
        description: "Practice yoga or mobility work for 10 minutes daily for 30 days.",
        type: "mindfulness",
        target: 30,
        unit: "days",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-30"),
        isActive: true,
        participants: 8432
      }
    ];

    // Create sample user for login
    const sampleUser = {
      firstName: "Ender",
      lastName: "Test",
      email: "ender@test.com",
      username: "ender",
      password: "password123", // Simple password for testing
      fitnessLevel: "intermediate",
      goals: ["strength", "endurance"]
    };

    // Seed user
    const userId = this.currentId++;
    this.users.set(userId, {
      ...sampleUser,
      id: userId,
      createdAt: new Date(),
      profileImage: null
    });

    // REMOVED: No fake workout history generation - only real user data
    const realisticWorkoutHistory: any[] = [];
    console.log(`No fake data generated - using only real user workout sessions`);

    // Seed workouts
    realWorkouts.forEach(workout => {
      const id = this.currentId++;
      this.workouts.set(id, { 
        ...workout, 
        id, 
        createdAt: new Date(),
        description: workout.description || null,
        equipment: workout.equipment || null,
        imageUrl: workout.imageUrl || null,
        isPublic: workout.isPublic ?? null
      });
    });

    // Seed challenges
    sampleChallenges.forEach(challenge => {
      const id = this.currentId++;
      this.challenges.set(id, { 
        ...challenge, 
        id, 
        createdAt: new Date(),
        isActive: challenge.isActive ?? null,
        participants: challenge.participants ?? null
      });
    });

    // Seed realistic workout sessions with proper periodization
    realisticWorkoutHistory.forEach(session => {
      const id = this.currentId++;
      this.workoutSessions.set(id, {
        ...session,
        id,
        createdAt: session.startTime,
        workoutId: 1, // Use first workout template as fallback
        totalDuration: session.duration,
        formScore: session.exercises.reduce((avg, ex) => 
          avg + ex.sets.reduce((setAvg, set) => setAvg + set.formScore, 0) / ex.sets.length, 0) / session.exercises.length,
        notes: (session as any).notes || null
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      profileImage: insertUser.profileImage || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Workout methods
  async getWorkouts(filters?: { category?: string; difficulty?: string; userId?: number }): Promise<Workout[]> {
    let workouts = Array.from(this.workouts.values());
    
    if (filters?.category) {
      workouts = workouts.filter(w => w.category === filters.category);
    }
    if (filters?.difficulty) {
      workouts = workouts.filter(w => w.difficulty === filters.difficulty);
    }
    if (filters?.userId) {
      workouts = workouts.filter(w => w.userId === filters.userId);
    }
    
    return workouts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const id = this.currentId++;
    const newWorkout: Workout = { 
      ...workout, 
      id, 
      createdAt: new Date(),
      description: workout.description || null,
      equipment: workout.equipment || null,
      imageUrl: workout.imageUrl || null,
      isPublic: workout.isPublic ?? null
    };
    this.workouts.set(id, newWorkout);
    return newWorkout;
  }

  async updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout | undefined> {
    const workout = this.workouts.get(id);
    if (!workout) return undefined;
    
    const updatedWorkout = { ...workout, ...updates };
    this.workouts.set(id, updatedWorkout);
    return updatedWorkout;
  }

  async deleteWorkout(id: number): Promise<boolean> {
    return this.workouts.delete(id);
  }

  // Workout session methods
  async getWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    return Array.from(this.workoutSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    return this.workoutSessions.get(id);
  }

  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const id = this.currentId++;
    const newSession: WorkoutSession = { 
      ...session, 
      id, 
      createdAt: new Date(),
      exercises: session.exercises || null,
      endTime: session.endTime || null,
      totalDuration: session.totalDuration || null,
      caloriesBurned: session.caloriesBurned || null,
      formScore: session.formScore || null,
      notes: session.notes || null,
      completionStatus: session.completionStatus || "in_progress"
    };
    this.workoutSessions.set(id, newSession);
    return newSession;
  }

  async updateWorkoutSession(id: number, updates: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined> {
    const session = this.workoutSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.workoutSessions.set(id, updatedSession);
    return updatedSession;
  }

  // User stats methods
  async getUserStats(userId: number, limit = 30): Promise<UserStats[]> {
    return Array.from(this.userStats.values())
      .filter(stats => stats.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    const id = this.currentId++;
    const newStats: UserStats = { 
      ...stats, 
      id, 
      createdAt: new Date(),
      weight: stats.weight ?? null,
      bodyFat: stats.bodyFat ?? null,
      muscleMass: stats.muscleMass ?? null,
      caloriesConsumed: stats.caloriesConsumed ?? null,
      proteinConsumed: stats.proteinConsumed ?? null,
      carbsConsumed: stats.carbsConsumed ?? null,
      fatsConsumed: stats.fatsConsumed ?? null,
      sleepHours: stats.sleepHours ?? null,
      stressLevel: stats.stressLevel ?? null,
      energyLevel: stats.energyLevel ?? null
    };
    this.userStats.set(id, newStats);
    return newStats;
  }

  async getLatestUserStats(userId: number): Promise<UserStats | undefined> {
    const userStats = await this.getUserStats(userId, 1);
    return userStats[0];
  }

  // Achievement methods
  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.currentId++;
    const newAchievement: Achievement = { 
      ...achievement, 
      id, 
      unlockedAt: new Date(),
      value: achievement.value || null
    };
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }

  // Challenge methods
  async getActiveChallenges(): Promise<Challenge[]> {
    const now = new Date();
    return Array.from(this.challenges.values())
      .filter(challenge => challenge.isActive && challenge.endDate > now)
      .sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const id = this.currentId++;
    const newChallenge: Challenge = { 
      ...challenge, 
      id, 
      createdAt: new Date(),
      isActive: challenge.isActive ?? null,
      participants: challenge.participants ?? null
    };
    this.challenges.set(id, newChallenge);
    return newChallenge;
  }

  async getChallengeParticipations(userId: number): Promise<(ChallengeParticipation & { challenge: Challenge })[]> {
    const participations = Array.from(this.challengeParticipations.values())
      .filter(p => p.userId === userId);
    
    return participations.map(p => {
      const challenge = this.challenges.get(p.challengeId)!;
      return { ...p, challenge };
    });
  }

  async joinChallenge(participation: InsertChallengeParticipation): Promise<ChallengeParticipation> {
    const id = this.currentId++;
    const newParticipation: ChallengeParticipation = { 
      ...participation, 
      id, 
      joinedAt: new Date(),
      progress: participation.progress ?? null,
      isCompleted: participation.isCompleted ?? null
    };
    this.challengeParticipations.set(id, newParticipation);
    
    // Update challenge participant count
    const challenge = this.challenges.get(participation.challengeId);
    if (challenge) {
      challenge.participants = (challenge.participants || 0) + 1;
    }
    
    return newParticipation;
  }

  async updateChallengeProgress(userId: number, challengeId: number, progress: number): Promise<ChallengeParticipation | undefined> {
    const participation = Array.from(this.challengeParticipations.values())
      .find(p => p.userId === userId && p.challengeId === challengeId);
    
    if (!participation) return undefined;
    
    participation.progress = progress;
    const challenge = this.challenges.get(challengeId);
    if (challenge && progress >= challenge.target) {
      participation.isCompleted = true;
    }
    
    return participation;
  }

  // Social methods
  async getSocialPosts(limit = 20): Promise<(SocialPost & { user: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImage'> })[]> {
    const posts = Array.from(this.socialPosts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return posts.map(post => {
      const user = this.users.get(post.userId)!;
      return {
        ...post,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage
        }
      };
    });
  }

  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const id = this.currentId++;
    const newPost: SocialPost = { 
      ...post, 
      id, 
      likes: 0, 
      comments: 0, 
      createdAt: new Date(),
      imageUrl: post.imageUrl || null,
      workoutSessionId: post.workoutSessionId || null,
      achievementId: post.achievementId || null
    };
    this.socialPosts.set(id, newPost);
    return newPost;
  }

  async likeSocialPost(postId: number): Promise<boolean> {
    const post = this.socialPosts.get(postId);
    if (!post) return false;
    
    post.likes = (post.likes || 0) + 1;
    return true;
  }
}

export const storage = new MemStorage();
