import express from 'express';
import { 
  notificationService, 
  NotificationType, 
  NotificationPriority, 
  NotificationChannel,
  NotificationPreferences 
} from './notificationService';

const router = express.Router();

// Middleware for user authentication (placeholder)
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In a real app, verify JWT token or session
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  (req as any).userId = userId;
  next();
};

// Get user notifications
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { limit, offset, unreadOnly, type } = req.query;
    
    const notifications = await notificationService.getUserNotifications(userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      unreadOnly: unreadOnly === 'true',
      type: type as NotificationType
    });

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get notification statistics
router.get('/notifications/stats', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const stats = await notificationService.getStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Delete notification
router.delete('/notifications/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await notificationService.deleteNotification(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Create manual notification (admin/testing)
router.post('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { 
      type, 
      priority, 
      data, 
      scheduledAt, 
      customTitle, 
      customBody, 
      channels 
    } = req.body;

    if (!type || !Object.values(NotificationType).includes(type)) {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    const notificationId = await notificationService.createNotification({
      userId,
      type,
      priority: priority || NotificationPriority.MEDIUM,
      data,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      customTitle,
      customBody,
      channels
    });

    res.json({ notificationId, success: true });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Get user notification preferences
router.get('/notifications/preferences', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const preferences = await notificationService.getUserPreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// Update user notification preferences
router.put('/notifications/preferences', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const preferences = req.body as Partial<NotificationPreferences>;
    
    await notificationService.updateUserPreferences(userId, preferences);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Workout reminder endpoints
router.post('/notifications/workout-reminder', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { workoutType, scheduledAt, workoutId } = req.body;

    const notificationId = await notificationService.createNotification({
      userId,
      type: NotificationType.WORKOUT_REMINDER,
      priority: NotificationPriority.HIGH,
      data: { workoutType, workoutId },
      scheduledAt: new Date(scheduledAt)
    });

    res.json({ notificationId, success: true });
  } catch (error) {
    console.error('Error creating workout reminder:', error);
    res.status(500).json({ error: 'Failed to create workout reminder' });
  }
});

// Achievement unlock notification
router.post('/notifications/achievement', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { achievementId, achievementTitle, achievementDescription } = req.body;

    const notificationId = await notificationService.createNotification({
      userId,
      type: NotificationType.ACHIEVEMENT_UNLOCK,
      priority: NotificationPriority.HIGH,
      data: { 
        achievementId, 
        achievementTitle, 
        achievementDescription 
      }
    });

    res.json({ notificationId, success: true });
  } catch (error) {
    console.error('Error creating achievement notification:', error);
    res.status(500).json({ error: 'Failed to create achievement notification' });
  }
});

// Goal progress notification
router.post('/notifications/goal-progress', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { goalId, goalTitle, progressPercentage, milestone } = req.body;

    const notificationId = await notificationService.createNotification({
      userId,
      type: NotificationType.GOAL_PROGRESS,
      priority: NotificationPriority.MEDIUM,
      data: { 
        goalId, 
        goalTitle, 
        progressPercentage, 
        milestone 
      }
    });

    res.json({ notificationId, success: true });
  } catch (error) {
    console.error('Error creating goal progress notification:', error);
    res.status(500).json({ error: 'Failed to create goal progress notification' });
  }
});

// Social interaction notification
router.post('/notifications/social', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { fromUserId, fromUserName, actionType, details, targetId } = req.body;

    const notificationId = await notificationService.createNotification({
      userId,
      type: NotificationType.SOCIAL_INTERACTION,
      priority: NotificationPriority.LOW,
      data: { 
        fromUserId, 
        fromUserName, 
        actionType, 
        details, 
        targetId 
      }
    });

    res.json({ notificationId, success: true });
  } catch (error) {
    console.error('Error creating social notification:', error);
    res.status(500).json({ error: 'Failed to create social notification' });
  }
});

// Streak milestone notification
router.post('/notifications/streak', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { streakDays, streakType } = req.body;

    const notificationId = await notificationService.createNotification({
      userId,
      type: NotificationType.STREAK_MILESTONE,
      priority: NotificationPriority.HIGH,
      data: { streakDays, streakType }
    });

    res.json({ notificationId, success: true });
  } catch (error) {
    console.error('Error creating streak notification:', error);
    res.status(500).json({ error: 'Failed to create streak notification' });
  }
});

// Recovery reminder notification
router.post('/notifications/recovery', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { muscleGroup, lastWorkoutDate, recoveryHours } = req.body;

    const notificationId = await notificationService.createNotification({
      userId,
      type: NotificationType.RECOVERY_REMINDER,
      priority: NotificationPriority.MEDIUM,
      data: { muscleGroup, lastWorkoutDate, recoveryHours }
    });

    res.json({ notificationId, success: true });
  } catch (error) {
    console.error('Error creating recovery reminder:', error);
    res.status(500).json({ error: 'Failed to create recovery reminder' });
  }
});

// Nutrition reminder notification
router.post('/notifications/nutrition', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { mealType, scheduledAt } = req.body;

    const notificationId = await notificationService.createNotification({
      userId,
      type: NotificationType.NUTRITION_REMINDER,
      priority: NotificationPriority.MEDIUM,
      data: { mealType },
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
    });

    res.json({ notificationId, success: true });
  } catch (error) {
    console.error('Error creating nutrition reminder:', error);
    res.status(500).json({ error: 'Failed to create nutrition reminder' });
  }
});

// Weight log reminder notification
router.post('/notifications/weight-reminder', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { scheduledAt, frequency } = req.body;

    const notificationId = await notificationService.createNotification({
      userId,
      type: NotificationType.WEIGHT_LOG_REMINDER,
      priority: NotificationPriority.MEDIUM,
      data: { frequency },
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
    });

    res.json({ notificationId, success: true });
  } catch (error) {
    console.error('Error creating weight reminder:', error);
    res.status(500).json({ error: 'Failed to create weight reminder' });
  }
});

// Test endpoint for sending sample notifications
router.post('/notifications/test', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { type } = req.body;

    if (!type || !Object.values(NotificationType).includes(type)) {
      return res.status(400).json({ error: 'Invalid notification type for testing' });
    }

    // Sample data for different notification types
    const testData: Record<NotificationType, any> = {
      [NotificationType.WORKOUT_REMINDER]: { workoutType: 'Push Day' },
      [NotificationType.ACHIEVEMENT_UNLOCK]: { achievementTitle: 'First Workout Complete' },
      [NotificationType.GOAL_PROGRESS]: { goalTitle: 'Lose 10 lbs', progressPercentage: 75 },
      [NotificationType.SOCIAL_INTERACTION]: { userName: 'TestUser', actionType: 'liked your workout' },
      [NotificationType.STREAK_MILESTONE]: { streakDays: 7 },
      [NotificationType.RECOVERY_REMINDER]: { muscleGroup: 'Chest' },
      [NotificationType.NUTRITION_REMINDER]: { mealType: 'breakfast' },
      [NotificationType.WEIGHT_LOG_REMINDER]: { frequency: 'weekly' }
    };

    const notificationId = await notificationService.createNotification({
      userId,
      type,
      priority: NotificationPriority.MEDIUM,
      data: testData[type as keyof typeof testData]
    });

    res.json({ notificationId, success: true, message: 'Test notification sent' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Bulk operations
router.post('/notifications/mark-all-read', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const notifications = await notificationService.getUserNotifications(userId, { unreadOnly: true });
    
    await Promise.all(notifications.map(n => notificationService.markAsRead(n.id)));
    
    res.json({ success: true, marked: notifications.length });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

router.delete('/notifications/clear-all', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const notifications = await notificationService.getUserNotifications(userId);
    
    await Promise.all(notifications.map(n => notificationService.deleteNotification(n.id)));
    
    res.json({ success: true, deleted: notifications.length });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({ error: 'Failed to clear all notifications' });
  }
});

// WebSocket endpoint info for real-time notifications
router.get('/notifications/websocket-info', requireAuth, (req, res) => {
  res.json({
    endpoint: '/ws/notifications',
    events: [
      'notification:new',
      'notification:read',
      'notification:deleted'
    ],
    description: 'Connect to WebSocket for real-time notification updates'
  });
});

export default router;