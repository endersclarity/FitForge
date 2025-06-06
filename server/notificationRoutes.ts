/**
 * FitForge Notification Routes
 * 
 * RESTful API endpoints for notification system integration with:
 * - Agent C: User preferences and settings
 * - Agent B: Goal milestones and progress celebrations
 * - Agent A: Mobile-optimized response formats
 */

import { Router } from "express";
import { z } from "zod";
import { NotificationService } from "./notificationService";

const router = Router();
const notificationService = new NotificationService();

// Middleware to auto-assign user ID (bypasses authentication for testing)
const authenticateToken = (req: any, res: any, next: any) => {
  // Use user-id header if provided (for testing), otherwise default to 1
  const userIdHeader = req.headers['user-id'];
  req.userId = userIdHeader ? parseInt(userIdHeader) : 1;
  next();
};

// ============================================================================
// NOTIFICATION MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/notifications
 * Get user notifications with pagination and filtering
 * Mobile-optimized: Efficient payload, touch-friendly actions
 */
router.get("/", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const {
      page = 1,
      limit = 20,
      category,
      unreadOnly = false,
      includeExpired = false
    } = req.query;

    const result = await notificationService.getNotifications(
      userId,
      {
        offset: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit),
        category: category as string,
        unreadOnly: unreadOnly === 'true'
      }
    );
    
    const notifications = result.notifications;

    res.json({
      success: true,
      data: notifications,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: notifications.length === parseInt(limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for badge display
 * Mobile-optimized: Minimal payload for quick updates
 */
router.get("/unread-count", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to get unread count",
      message: error.message
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 * Mobile-optimized: Simple success response
 */
router.put("/:id/read", authenticateToken, async (req: any, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.userId;

    const success = await notificationService.markAsRead(notificationId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Notification not found or access denied"
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read"
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to mark notification as read",
      message: error.message
    });
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read for user
 * Mobile-optimized: Batch operation for efficiency
 */
router.put("/mark-all-read", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { category } = req.body;

    const count = await notificationService.markAllAsRead(userId, category);

    res.json({
      success: true,
      data: { markedCount: count },
      message: `${count} notifications marked as read`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to mark notifications as read",
      message: error.message
    });
  }
});

// ============================================================================
// AGENT C INTEGRATION: USER PREFERENCE ENDPOINTS
// ============================================================================

/**
 * GET /api/notifications/preferences
 * Get user notification preferences
 * Integrates with Agent C's user preferences service
 */
router.get("/preferences", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const preferences = await notificationService.getUserPreferences(userId);

    res.json({
      success: true,
      data: preferences,
      categories: ['fitness', 'social', 'achievement', 'system', 'health'],
      channels: ['in_app', 'push', 'email', 'sms']
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch notification preferences",
      message: error.message
    });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update user notification preferences
 * Integrates with Agent C's standardized preference format
 */
const updatePreferencesSchema = z.object({
  enabled: z.boolean().optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  }).optional(),
  channels: z.object({
    in_app: z.boolean(),
    push: z.boolean(),
    email: z.boolean(),
    sms: z.boolean()
  }).optional(),
  categories: z.object({
    fitness: z.object({
      enabled: z.boolean(),
      channels: z.array(z.enum(['in_app', 'push', 'email', 'sms'])),
      frequency: z.enum(['immediate', 'batched_hourly', 'batched_daily'])
    }),
    social: z.object({
      enabled: z.boolean(),
      channels: z.array(z.enum(['in_app', 'push', 'email', 'sms'])),
      frequency: z.enum(['immediate', 'batched_hourly', 'batched_daily'])
    }),
    achievement: z.object({
      enabled: z.boolean(),
      channels: z.array(z.enum(['in_app', 'push', 'email', 'sms'])),
      frequency: z.enum(['immediate', 'batched_hourly', 'batched_daily'])
    }),
    system: z.object({
      enabled: z.boolean(),
      channels: z.array(z.enum(['in_app', 'push', 'email', 'sms'])),
      frequency: z.enum(['immediate', 'batched_hourly', 'batched_daily'])
    }),
    health: z.object({
      enabled: z.boolean(),
      channels: z.array(z.enum(['in_app', 'push', 'email', 'sms'])),
      frequency: z.enum(['immediate', 'batched_hourly', 'batched_daily'])
    })
  }).optional()
});

router.put("/preferences", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const preferences = updatePreferencesSchema.parse(req.body);

    const updated = await notificationService.updateUserPreferences(userId, preferences);

    res.json({
      success: true,
      data: updated,
      message: "Notification preferences updated successfully"
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid preference data",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update notification preferences",
      message: error.message
    });
  }
});

// ============================================================================
// AGENT B INTEGRATION: GOAL MILESTONE ENDPOINTS
// ============================================================================

/**
 * POST /api/notifications/goal-milestone
 * Trigger goal milestone achievement notification
 * Integrates with Agent B's goal progress system
 */
const goalMilestoneSchema = z.object({
  goalId: z.string(),
  milestoneType: z.enum(['goal_created', 'progress_25', 'progress_50', 'progress_75', 'goal_achieved', 'streak_milestone']),
  currentValue: z.number(),
  targetValue: z.number(),
  progressPercentage: z.number().min(0).max(100),
  goalTitle: z.string(),
  category: z.enum(['weight_loss', 'muscle_gain', 'strength', 'endurance', 'consistency']).optional()
});

router.post("/goal-milestone", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const milestoneData = goalMilestoneSchema.parse(req.body);

    const notification = await notificationService.createGoalMilestoneNotification(
      userId,
      milestoneData
    );

    res.json({
      success: true,
      data: notification,
      message: "Goal milestone notification created"
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid milestone data",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create goal milestone notification",
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/workout-reminder
 * Schedule workout reminder notification
 * Integrates with Agent B's goal-driven workout planning
 */
const workoutReminderSchema = z.object({
  goalId: z.string().optional(),
  workoutType: z.string(),
  scheduledFor: z.string().datetime(),
  reminderType: z.enum(['pre_workout', 'missed_workout', 'streak_maintenance']),
  customMessage: z.string().optional()
});

router.post("/workout-reminder", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const reminderData = workoutReminderSchema.parse(req.body);

    const notification = await notificationService.scheduleWorkoutReminder(
      userId,
      reminderData
    );

    res.json({
      success: true,
      data: notification,
      message: "Workout reminder scheduled"
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid reminder data",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to schedule workout reminder",
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/goal-progress
 * Get goal-related notifications for Agent B's goal pages
 * Mobile-optimized: Efficient goal progress summary
 */
router.get("/goal-progress", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { goalId } = req.query;

    const notifications = await notificationService.getGoalProgressNotifications(
      userId,
      goalId as string
    );

    res.json({
      success: true,
      data: notifications,
      meta: {
        totalNotifications: notifications.length,
        categories: [...new Set(notifications.map(n => n.type))]
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch goal progress notifications",
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/achievement-unlock
 * Create achievement unlock notification
 * Integrates with Agent B's achievement system
 */
const achievementSchema = z.object({
  achievementId: z.string(),
  achievementTitle: z.string(),
  achievementDescription: z.string(),
  category: z.enum(['first_workout', 'streak_milestone', 'weight_milestone', 'strength_milestone', 'consistency']),
  badgeImageUrl: z.string().url().optional(),
  celebrationLevel: z.enum(['bronze', 'silver', 'gold', 'platinum']).default('bronze')
});

router.post("/achievement-unlock", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const achievementData = achievementSchema.parse(req.body);

    const notification = await notificationService.createAchievementNotification(
      userId,
      achievementData
    );

    res.json({
      success: true,
      data: notification,
      message: "Achievement notification created"
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid achievement data",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create achievement notification",
      message: error.message
    });
  }
});

// ============================================================================
// SCHEDULED NOTIFICATION MANAGEMENT
// ============================================================================

/**
 * GET /api/notifications/scheduled
 * Get user's scheduled notifications
 * Mobile-optimized: Upcoming reminders and schedule management
 */
router.get("/scheduled", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { upcoming = true, limit = 10 } = req.query;

    const scheduled = await notificationService.getScheduledNotifications(
      userId,
      {
        upcomingOnly: upcoming === 'true',
        limit: parseInt(limit as string)
      }
    );

    res.json({
      success: true,
      data: scheduled,
      meta: {
        count: scheduled.length,
        upcomingOnly: upcoming === 'true'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch scheduled notifications",
      message: error.message
    });
  }
});

/**
 * DELETE /api/notifications/scheduled/:id
 * Cancel a scheduled notification
 * Mobile-optimized: Simple cancellation for reminder management
 */
router.delete("/scheduled/:id", authenticateToken, async (req: any, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.userId;

    const success = await notificationService.cancelScheduledNotification(notificationId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Scheduled notification not found or access denied"
      });
    }

    res.json({
      success: true,
      message: "Scheduled notification cancelled"
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to cancel scheduled notification",
      message: error.message
    });
  }
});

export default router;