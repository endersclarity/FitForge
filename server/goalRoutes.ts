import { Router } from "express";
import { authenticateToken } from "./auth-middleware";
import { UnifiedFileStorage } from "./unifiedFileStorage";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { NotificationService } from "./notificationService";

const router = Router();

// Initialize unified file storage for goals and notification service
const unifiedStorage = new UnifiedFileStorage();
unifiedStorage.initialize().catch(console.error);

const notificationService = new NotificationService();

// ============================================================================
// GOAL DATA TYPES & VALIDATION SCHEMAS
// ============================================================================

export type GoalType = 'weight_loss' | 'strength_gain' | 'body_composition';

export interface Goal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  goal_title: string;
  goal_description?: string;
  
  // Target values (flexible based on goal type)
  target_weight_lbs?: number;
  target_body_fat_percentage?: number;
  target_exercise_id?: string;
  target_weight_for_exercise_lbs?: number;
  target_reps_for_exercise?: number;
  
  // Starting baseline (recorded when goal is created)
  start_weight_lbs?: number;
  start_body_fat_percentage?: number;
  start_exercise_max_weight_lbs?: number;
  start_exercise_max_reps?: number;
  
  // Timeline
  target_date: string; // ISO date string
  created_date: string; // ISO date string
  
  // Progress tracking
  current_progress_percentage: number;
  is_achieved: boolean;
  achieved_date?: string; // ISO date string
  
  // Motivation and tracking
  motivation_notes?: string;
  reward_description?: string;
  
  // Goal status
  is_active: boolean;
  priority_level: 'high' | 'medium' | 'low';
  
  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

const CreateGoalSchema = z.object({
  goal_type: z.enum(['weight_loss', 'strength_gain', 'body_composition']),
  goal_title: z.string().min(1, "Goal title is required"),
  goal_description: z.string().optional(),
  target_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid target date"),
  
  // Weight loss specific
  target_weight_lbs: z.number().positive().optional(),
  start_weight_lbs: z.number().positive().optional(),
  
  // Body composition specific  
  target_body_fat_percentage: z.number().min(1).max(50).optional(),
  start_body_fat_percentage: z.number().min(1).max(50).optional(),
  
  // Strength gain specific
  target_exercise_id: z.string().optional(),
  target_weight_for_exercise_lbs: z.number().positive().optional(),
  target_reps_for_exercise: z.number().min(1).optional(),
  start_exercise_max_weight_lbs: z.number().positive().optional(),
  start_exercise_max_reps: z.number().min(1).optional(),
  
  // Motivation
  motivation_notes: z.string().optional(),
  reward_description: z.string().optional(),
  priority_level: z.enum(['high', 'medium', 'low']).default('medium')
});

const UpdateGoalSchema = CreateGoalSchema.partial();

const GoalFiltersSchema = z.object({
  goal_type: z.enum(['weight_loss', 'strength_gain', 'body_composition']).optional(),
  is_active: z.boolean().optional(),
  is_achieved: z.boolean().optional(),
  priority_level: z.enum(['high', 'medium', 'low']).optional(),
  limit: z.number().min(1).max(100).default(20).optional(),
  offset: z.number().min(0).default(0).optional()
});

// ============================================================================
// GOAL STORAGE OPERATIONS
// ============================================================================

class GoalStorage {
  private getGoalsFilePath(userId: string): string {
    return `data/users/${userId}/goals.json`;
  }

  async getGoals(userId: string, filters: any = {}): Promise<Goal[]> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.resolve(this.getGoalsFilePath(userId));
      
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        let goals: Goal[] = JSON.parse(data);
        
        // Apply filters
        if (filters.goal_type) {
          goals = goals.filter(g => g.goal_type === filters.goal_type);
        }
        if (filters.is_active !== undefined) {
          goals = goals.filter(g => g.is_active === filters.is_active);
        }
        if (filters.is_achieved !== undefined) {
          goals = goals.filter(g => g.is_achieved === filters.is_achieved);
        }
        if (filters.priority_level) {
          goals = goals.filter(g => g.priority_level === filters.priority_level);
        }
        
        // Sort by most recent first
        goals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Apply pagination
        const offset = filters.offset || 0;
        const limit = filters.limit || 20;
        return goals.slice(offset, offset + limit);
        
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return []; // No goals file exists yet
        }
        throw error;
      }
    } catch (error) {
      console.error("Error getting goals:", error);
      throw error;
    }
  }

  async getGoal(userId: string, goalId: string): Promise<Goal | null> {
    const goals = await this.getGoals(userId);
    return goals.find(g => g.id === goalId) || null;
  }

  async createGoal(userId: string, goalData: any): Promise<Goal> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.resolve(this.getGoalsFilePath(userId));
      
      // Ensure user directory exists
      const userDir = path.dirname(filePath);
      await fs.mkdir(userDir, { recursive: true });
      
      const newGoal: Goal = {
        id: uuidv4(),
        user_id: userId,
        ...goalData,
        created_date: new Date().toISOString().split('T')[0],
        current_progress_percentage: 0,
        is_achieved: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Read existing goals or create empty array
      let goals: Goal[] = [];
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        goals = JSON.parse(data);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      
      goals.push(newGoal);
      await fs.writeFile(filePath, JSON.stringify(goals, null, 2));
      
      return newGoal;
    } catch (error) {
      console.error("Error creating goal:", error);
      throw error;
    }
  }

  async updateGoal(userId: string, goalId: string, updates: any): Promise<Goal | null> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.resolve(this.getGoalsFilePath(userId));
      
      let goals: Goal[] = [];
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        goals = JSON.parse(data);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return null; // No goals file exists
        }
        throw error;
      }
      
      const goalIndex = goals.findIndex(g => g.id === goalId);
      if (goalIndex === -1) {
        return null;
      }
      
      // Update goal with new data
      goals[goalIndex] = {
        ...goals[goalIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      await fs.writeFile(filePath, JSON.stringify(goals, null, 2));
      return goals[goalIndex];
    } catch (error) {
      console.error("Error updating goal:", error);
      throw error;
    }
  }

  async deleteGoal(userId: string, goalId: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.resolve(this.getGoalsFilePath(userId));
      
      let goals: Goal[] = [];
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        goals = JSON.parse(data);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return false; // No goals file exists
        }
        throw error;
      }
      
      const initialLength = goals.length;
      goals = goals.filter(g => g.id !== goalId);
      
      if (goals.length === initialLength) {
        return false; // Goal not found
      }
      
      await fs.writeFile(filePath, JSON.stringify(goals, null, 2));
      return true;
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  }

  async calculateGoalProgress(userId: string, goal: Goal): Promise<number> {
    try {
      // Get user's current stats and workout data for progress calculation
      
      if (goal.goal_type === 'weight_loss' && goal.target_weight_lbs && goal.start_weight_lbs) {
        // Get latest weight from user stats or body stats
        // For now, simulate progress calculation
        const currentWeight = goal.start_weight_lbs - Math.random() * 5; // Simulate weight loss
        const totalWeightToLose = goal.start_weight_lbs - goal.target_weight_lbs;
        const weightLost = goal.start_weight_lbs - currentWeight;
        return Math.min(100, Math.max(0, (weightLost / totalWeightToLose) * 100));
      }
      
      if (goal.goal_type === 'strength_gain' && goal.target_exercise_id) {
        // Get exercise progress from workout sessions
        const sessions = await unifiedStorage.getUnifiedWorkoutSessions(userId, { limit: 50 });
        
        // Find sessions with this exercise
        const exerciseSessions = sessions.filter(session => 
          session.exercises.some(ex => ex.exerciseId.toString() === goal.target_exercise_id)
        );
        
        if (exerciseSessions.length > 0) {
          // Get the most recent max weight for this exercise
          let maxWeight = 0;
          exerciseSessions.forEach(session => {
            session.exercises.forEach(exercise => {
              if (exercise.exerciseId.toString() === goal.target_exercise_id) {
                exercise.sets.forEach(set => {
                  if (set.weight > maxWeight) {
                    maxWeight = set.weight;
                  }
                });
              }
            });
          });
          
          if (goal.start_exercise_max_weight_lbs && goal.target_weight_for_exercise_lbs) {
            const weightGained = maxWeight - goal.start_exercise_max_weight_lbs;
            const totalWeightToGain = goal.target_weight_for_exercise_lbs - goal.start_exercise_max_weight_lbs;
            return Math.min(100, Math.max(0, (weightGained / totalWeightToGain) * 100));
          }
        }
      }
      
      if (goal.goal_type === 'body_composition') {
        // Body composition goals would need body fat percentage tracking
        // For now, simulate progress
        return Math.random() * 50; // Simulate 0-50% progress
      }
      
      return 0;
    } catch (error) {
      console.error("Error calculating goal progress:", error);
      return 0;
    }
  }
}

const goalStorage = new GoalStorage();

// ============================================================================
// GOAL API ROUTES
// ============================================================================

// GET /api/goals - List all goals for user
router.get("/", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const filters = GoalFiltersSchema.parse(req.query);
    
    const goals = await goalStorage.getGoals(userId, filters);
    
    // Calculate current progress for each goal
    for (const goal of goals) {
      const currentProgress = await goalStorage.calculateGoalProgress(userId, goal);
      goal.current_progress_percentage = Math.round(currentProgress);
      
      // Check if goal is achieved
      if (currentProgress >= 100 && !goal.is_achieved) {
        goal.is_achieved = true;
        goal.achieved_date = new Date().toISOString().split('T')[0];
        await goalStorage.updateGoal(userId, goal.id, {
          is_achieved: true,
          achieved_date: goal.achieved_date,
          current_progress_percentage: goal.current_progress_percentage
        });
        
        // AGENT B INTEGRATION: Trigger goal achievement notification
        try {
          await notificationService.createGoalMilestoneNotification(parseInt(userId), {
            goalId: goal.id,
            milestoneType: 'goal_achieved',
            currentValue: goal.target_weight_lbs || goal.target_weight_for_exercise_lbs || 100,
            targetValue: goal.target_weight_lbs || goal.target_weight_for_exercise_lbs || 100,
            progressPercentage: 100,
            goalTitle: goal.goal_title,
            category: goal.goal_type === 'weight_loss' ? 'weight_loss' : 
                      goal.goal_type === 'strength_gain' ? 'strength' : 'consistency'
          });
        } catch (notificationError) {
          console.error('Failed to create goal achievement notification:', notificationError);
        }
      } else {
        // Check for milestone notifications (25%, 50%, 75%)
        const previousProgress = goal.current_progress_percentage;
        const newProgress = Math.round(currentProgress);
        
        // Only trigger milestone notifications when crossing thresholds
        const milestones = [
          { threshold: 25, type: 'progress_25' as const },
          { threshold: 50, type: 'progress_50' as const },
          { threshold: 75, type: 'progress_75' as const }
        ];
        
        for (const milestone of milestones) {
          if (previousProgress < milestone.threshold && newProgress >= milestone.threshold) {
            try {
              await notificationService.createGoalMilestoneNotification(parseInt(userId), {
                goalId: goal.id,
                milestoneType: milestone.type,
                currentValue: Math.round((newProgress / 100) * (goal.target_weight_lbs || goal.target_weight_for_exercise_lbs || 100)),
                targetValue: goal.target_weight_lbs || goal.target_weight_for_exercise_lbs || 100,
                progressPercentage: newProgress,
                goalTitle: goal.goal_title,
                category: goal.goal_type === 'weight_loss' ? 'weight_loss' : 
                          goal.goal_type === 'strength_gain' ? 'strength' : 'consistency'
              });
            } catch (notificationError) {
              console.error(`Failed to create ${milestone.type} notification:`, notificationError);
            }
          }
        }
      }
    }
    
    res.json({
      goals,
      total: goals.length,
      filters
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid filters", errors: error.errors });
    }
    console.error("Error fetching goals:", error);
    res.status(500).json({ message: error.message || "Failed to fetch goals" });
  }
});

// GET /api/goals/:id - Get specific goal
router.get("/:id", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { id } = req.params;
    
    const goal = await goalStorage.getGoal(userId, id);
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    
    // Calculate current progress
    const currentProgress = await goalStorage.calculateGoalProgress(userId, goal);
    goal.current_progress_percentage = Math.round(currentProgress);
    
    res.json(goal);
  } catch (error: any) {
    console.error("Error fetching goal:", error);
    res.status(500).json({ message: error.message || "Failed to fetch goal" });
  }
});

// POST /api/goals - Create new goal
router.post("/", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const goalData = CreateGoalSchema.parse(req.body);
    
    const newGoal = await goalStorage.createGoal(userId, goalData);
    
    // AGENT B INTEGRATION: Trigger goal creation notification
    try {
      await notificationService.createGoalMilestoneNotification(parseInt(userId), {
        goalId: newGoal.id,
        milestoneType: 'goal_created',
        currentValue: 0,
        targetValue: newGoal.target_weight_lbs || newGoal.target_weight_for_exercise_lbs || 100,
        progressPercentage: 0,
        goalTitle: newGoal.goal_title,
        category: newGoal.goal_type === 'weight_loss' ? 'weight_loss' : 
                  newGoal.goal_type === 'strength_gain' ? 'strength' : 'consistency'
      });
    } catch (notificationError) {
      console.error('Failed to create goal creation notification:', notificationError);
      // Don't fail the goal creation if notification fails
    }
    
    res.status(201).json({
      message: "Goal created successfully",
      goal: newGoal
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
    }
    console.error("Error creating goal:", error);
    res.status(500).json({ message: error.message || "Failed to create goal" });
  }
});

// PUT /api/goals/:id - Update goal
router.put("/:id", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { id } = req.params;
    const updates = UpdateGoalSchema.parse(req.body);
    
    const updatedGoal = await goalStorage.updateGoal(userId, id, updates);
    if (!updatedGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    
    res.json({
      message: "Goal updated successfully", 
      goal: updatedGoal
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid update data", errors: error.errors });
    }
    console.error("Error updating goal:", error);
    res.status(500).json({ message: error.message || "Failed to update goal" });
  }
});

// DELETE /api/goals/:id - Delete goal
router.delete("/:id", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { id } = req.params;
    
    const deleted = await goalStorage.deleteGoal(userId, id);
    if (!deleted) {
      return res.status(404).json({ message: "Goal not found" });
    }
    
    res.json({ message: "Goal deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting goal:", error);
    res.status(500).json({ message: error.message || "Failed to delete goal" });
  }
});

// POST /api/goals/:id/progress - Update goal progress manually
router.post("/:id/progress", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const { id } = req.params;
    const { progress_percentage, notes } = req.body;
    
    if (typeof progress_percentage !== 'number' || progress_percentage < 0 || progress_percentage > 100) {
      return res.status(400).json({ message: "Progress percentage must be a number between 0 and 100" });
    }
    
    const goal = await goalStorage.getGoal(userId, id);
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    
    const updates: any = {
      current_progress_percentage: progress_percentage
    };
    
    // Track previous progress for milestone notifications
    const previousProgress = goal.current_progress_percentage;
    
    if (progress_percentage >= 100 && !goal.is_achieved) {
      updates.is_achieved = true;
      updates.achieved_date = new Date().toISOString().split('T')[0];
    }
    
    if (notes) {
      updates.motivation_notes = notes;
    }
    
    const updatedGoal = await goalStorage.updateGoal(userId, id, updates);
    
    // AGENT B INTEGRATION: Trigger milestone notifications on manual progress updates
    try {
      if (progress_percentage >= 100 && !goal.is_achieved) {
        // Goal achievement notification
        await notificationService.createGoalMilestoneNotification(parseInt(userId), {
          goalId: goal.id,
          milestoneType: 'goal_achieved',
          currentValue: goal.target_weight_lbs || goal.target_weight_for_exercise_lbs || 100,
          targetValue: goal.target_weight_lbs || goal.target_weight_for_exercise_lbs || 100,
          progressPercentage: 100,
          goalTitle: goal.goal_title,
          category: goal.goal_type === 'weight_loss' ? 'weight_loss' : 
                    goal.goal_type === 'strength_gain' ? 'strength' : 'consistency'
        });
      } else {
        // Check for milestone notifications (25%, 50%, 75%)
        const milestones = [
          { threshold: 25, type: 'progress_25' as const },
          { threshold: 50, type: 'progress_50' as const },
          { threshold: 75, type: 'progress_75' as const }
        ];
        
        for (const milestone of milestones) {
          if (previousProgress < milestone.threshold && progress_percentage >= milestone.threshold) {
            await notificationService.createGoalMilestoneNotification(parseInt(userId), {
              goalId: goal.id,
              milestoneType: milestone.type,
              currentValue: Math.round((progress_percentage / 100) * (goal.target_weight_lbs || goal.target_weight_for_exercise_lbs || 100)),
              targetValue: goal.target_weight_lbs || goal.target_weight_for_exercise_lbs || 100,
              progressPercentage: progress_percentage,
              goalTitle: goal.goal_title,
              category: goal.goal_type === 'weight_loss' ? 'weight_loss' : 
                        goal.goal_type === 'strength_gain' ? 'strength' : 'consistency'
            });
          }
        }
      }
    } catch (notificationError) {
      console.error('Failed to create progress milestone notification:', notificationError);
      // Don't fail the progress update if notification fails
    }
    
    res.json({
      message: "Goal progress updated successfully",
      goal: updatedGoal
    });
  } catch (error: any) {
    console.error("Error updating goal progress:", error);
    res.status(500).json({ message: error.message || "Failed to update goal progress" });
  }
});

// GET /api/goals/analytics/summary - Goal analytics summary
router.get("/analytics/summary", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId.toString();
    const goals = await goalStorage.getGoals(userId);
    
    const analytics = {
      total_goals: goals.length,
      active_goals: goals.filter(g => g.is_active).length,
      achieved_goals: goals.filter(g => g.is_achieved).length,
      high_priority_goals: goals.filter(g => g.priority_level === 'high').length,
      average_progress: goals.length > 0 ? 
        Math.round(goals.reduce((sum, g) => sum + g.current_progress_percentage, 0) / goals.length) : 0,
      goals_by_type: {
        weight_loss: goals.filter(g => g.goal_type === 'weight_loss').length,
        strength_gain: goals.filter(g => g.goal_type === 'strength_gain').length,
        body_composition: goals.filter(g => g.goal_type === 'body_composition').length
      },
      recent_achievements: goals
        .filter(g => g.is_achieved && g.achieved_date)
        .sort((a, b) => new Date(b.achieved_date!).getTime() - new Date(a.achieved_date!).getTime())
        .slice(0, 5)
        .map(g => ({
          id: g.id,
          title: g.goal_title,
          type: g.goal_type,
          achieved_date: g.achieved_date
        }))
    };
    
    res.json(analytics);
  } catch (error: any) {
    console.error("Error fetching goal analytics:", error);
    res.status(500).json({ message: error.message || "Failed to fetch goal analytics" });
  }
});

export default router;