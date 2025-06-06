/**
 * FitForge Notification Service
 * 
 * Comprehensive notification infrastructure supporting:
 * - In-app notifications
 * - Push notifications (mobile/web)
 * - Email notifications
 * - Scheduled reminders
 * - Real-time activity notifications
 */

import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { FileStorage } from "./fileStorage";
import type { UserPreferences } from "../shared/user-profile";

// ============================================================================
// NOTIFICATION SCHEMAS & TYPES
// ============================================================================

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.number(),
  type: z.enum([
    // Workout & Fitness Notifications
    'workout_reminder',
    'workout_completed',
    'workout_streak',
    'rest_day_reminder',
    'form_feedback',
    
    // Achievement & Progress Notifications
    'achievement_unlocked',
    'personal_record',
    'goal_milestone',
    'progress_update',
    'level_up',
    
    // Social Notifications
    'follower_new',
    'post_liked',
    'post_commented',
    'challenge_invitation',
    'challenge_completed',
    'challenge_reminder',
    
    // System Notifications
    'account_security',
    'feature_announcement',
    'maintenance_notice',
    'subscription_update',
    
    // Health & Wellness
    'hydration_reminder',
    'sleep_reminder',
    'nutrition_log',
    'recovery_suggestion'
  ]),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  category: z.enum(['fitness', 'social', 'achievement', 'system', 'health']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  
  // Delivery channels
  channels: z.array(z.enum(['in_app', 'push', 'email', 'sms'])).default(['in_app']),
  
  // Notification data and context
  data: z.record(z.any()).optional(), // Additional context data
  actionUrl: z.string().optional(), // Deep link or action URL
  imageUrl: z.string().url().optional(), // Notification image
  
  // Scheduling and timing
  scheduledFor: z.string().datetime().optional(), // When to send (for scheduled notifications)
  expiresAt: z.string().datetime().optional(), // When notification expires
  
  // User interaction tracking
  isRead: z.boolean().default(false),
  isClicked: z.boolean().default(false),
  readAt: z.string().datetime().optional(),
  clickedAt: z.string().datetime().optional(),
  
  // Delivery tracking
  deliveryStatus: z.enum(['pending', 'sent', 'delivered', 'failed']).default('pending'),
  deliveryChannels: z.array(z.object({
    channel: z.enum(['in_app', 'push', 'email', 'sms']),
    status: z.enum(['pending', 'sent', 'delivered', 'failed']),
    sentAt: z.string().datetime().optional(),
    deliveredAt: z.string().datetime().optional(),
    error: z.string().optional()
  })).default([]),
  
  // Metadata
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  source: z.string().optional(), // What triggered this notification
  templateId: z.string().optional() // Template used for generation
});

export const NotificationPreferencesSchema = z.object({
  userId: z.number(),
  
  // Global notification settings
  enabled: z.boolean().default(true),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  }).optional(),
  
  // Channel preferences
  channels: z.object({
    in_app: z.boolean().default(true),
    push: z.boolean().default(true),
    email: z.boolean().default(true),
    sms: z.boolean().default(false)
  }),
  
  // Category-specific preferences
  categories: z.object({
    fitness: z.object({
      enabled: z.boolean().default(true),
      channels: z.array(z.enum(['in_app', 'push', 'email', 'sms'])).default(['in_app', 'push']),
      frequency: z.enum(['immediate', 'batched_hourly', 'batched_daily']).default('immediate')
    }),
    social: z.object({
      enabled: z.boolean().default(true),
      channels: z.array(z.enum(['in_app', 'push', 'email', 'sms'])).default(['in_app', 'push']),
      frequency: z.enum(['immediate', 'batched_hourly', 'batched_daily']).default('immediate')
    }),
    achievement: z.object({
      enabled: z.boolean().default(true),
      channels: z.array(z.enum(['in_app', 'push', 'email', 'sms'])).default(['in_app', 'push', 'email']),
      frequency: z.enum(['immediate', 'batched_hourly', 'batched_daily']).default('immediate')
    }),
    system: z.object({
      enabled: z.boolean().default(true),
      channels: z.array(z.enum(['in_app', 'push', 'email', 'sms'])).default(['in_app', 'email']),
      frequency: z.enum(['immediate', 'batched_hourly', 'batched_daily']).default('immediate')
    }),
    health: z.object({
      enabled: z.boolean().default(true),
      channels: z.array(z.enum(['in_app', 'push', 'email', 'sms'])).default(['in_app', 'push']),
      frequency: z.enum(['immediate', 'batched_hourly', 'batched_daily']).default('immediate')
    })
  }),
  
  // Specific notification type preferences
  workoutReminders: z.boolean().default(true),
  achievementAlerts: z.boolean().default(true),
  socialUpdates: z.boolean().default(true),
  progressReports: z.boolean().default(true),
  challengeUpdates: z.boolean().default(true),
  
  updatedAt: z.string().datetime()
});

export const NotificationTemplateSchema = z.object({
  id: z.string(),
  type: z.string(),
  category: z.enum(['fitness', 'social', 'achievement', 'system', 'health']),
  
  // Template content
  titleTemplate: z.string(),
  messageTemplate: z.string(),
  
  // Template variables
  variables: z.array(z.string()).default([]),
  
  // Channel-specific templates
  channelTemplates: z.object({
    email: z.object({
      subject: z.string().optional(),
      htmlBody: z.string().optional(),
      textBody: z.string().optional()
    }).optional(),
    push: z.object({
      title: z.string().optional(),
      body: z.string().optional(),
      icon: z.string().optional(),
      badge: z.string().optional()
    }).optional(),
    sms: z.object({
      body: z.string().optional()
    }).optional()
  }).optional(),
  
  // Template configuration
  defaultChannels: z.array(z.enum(['in_app', 'push', 'email', 'sms'])),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  expirationHours: z.number().optional(),
  
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>;

// ============================================================================
// NOTIFICATION SERVICE CLASS
// ============================================================================

export class NotificationService {
  private dataDir: string;
  private notificationsFile: string;
  private preferencesFile: string;
  private templatesFile: string;
  private scheduledNotificationsFile: string;
  
  // AGENT C INTEGRATION: File storage for user preferences
  private fileStorage: FileStorage;

  constructor(dataDir = 'data/notifications') {
    this.dataDir = dataDir;
    this.notificationsFile = path.join(dataDir, 'notifications.json');
    this.preferencesFile = path.join(dataDir, 'preferences.json');
    this.templatesFile = path.join(dataDir, 'templates.json');
    this.scheduledNotificationsFile = path.join(dataDir, 'scheduled.json');
    this.fileStorage = new FileStorage();
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize files if they don't exist
      const files = [
        { path: this.notificationsFile, data: [] },
        { path: this.preferencesFile, data: {} },
        { path: this.templatesFile, data: this.getDefaultTemplates() },
        { path: this.scheduledNotificationsFile, data: [] }
      ];

      for (const file of files) {
        try {
          await fs.access(file.path);
        } catch {
          await fs.writeFile(file.path, JSON.stringify(file.data, null, 2));
        }
      }
    } catch (error) {
      console.error('Error initializing notification storage:', error);
    }
  }

  // ============================================================================
  // CORE NOTIFICATION METHODS
  // ============================================================================

  async createNotification(notificationData: Partial<Notification>): Promise<Notification> {
    const now = new Date().toISOString();
    
    // AGENT C INTEGRATION: Check user preferences before creating notification
    const userPreferences = await this.getUserPreferences(notificationData.userId!);
    
    // Skip notification creation if user has disabled this category
    if (!userPreferences.enabled || !userPreferences.categories[notificationData.category!]?.enabled) {
      console.log(`Notification skipped for user ${notificationData.userId} - category ${notificationData.category} disabled`);
      // Return a minimal notification object to indicate it was skipped
      return {
        id: crypto.randomUUID(),
        userId: notificationData.userId!,
        type: notificationData.type!,
        title: notificationData.title!,
        message: notificationData.message!,
        category: notificationData.category!,
        priority: 'low' as const,
        channels: [],
        isRead: true, // Mark as read since it's skipped
        isClicked: false,
        deliveryStatus: 'sent' as const, // Mark as sent to prevent reprocessing
        deliveryChannels: [],
        createdAt: now,
        updatedAt: now
      } as Notification;
    }

    // Apply user's preferred channels from Agent C integration
    const preferredChannels = userPreferences.categories[notificationData.category!]?.channels || ['in_app'];
    
    const notification: Notification = {
      id: crypto.randomUUID(),
      userId: notificationData.userId!,
      type: notificationData.type!,
      title: notificationData.title!,
      message: notificationData.message!,
      category: notificationData.category!,
      priority: notificationData.priority || 'medium',
      channels: preferredChannels, // Use Agent C's preferred channels
      data: notificationData.data,
      actionUrl: notificationData.actionUrl,
      imageUrl: notificationData.imageUrl,
      scheduledFor: notificationData.scheduledFor,
      expiresAt: notificationData.expiresAt,
      isRead: false,
      isClicked: false,
      deliveryStatus: 'pending',
      deliveryChannels: preferredChannels.map(channel => ({
        channel,
        status: 'pending' as const
      })),
      createdAt: now,
      updatedAt: now,
      source: notificationData.source,
      templateId: notificationData.templateId
    };

    // Validate notification
    const validatedNotification = NotificationSchema.parse(notification);
    
    // Save to storage
    await this.saveNotification(validatedNotification);
    
    // Process delivery if not scheduled and preferences allow
    if (!notification.scheduledFor && this.shouldDeliverNow(userPreferences, notification)) {
      await this.processDelivery(validatedNotification);
    }
    
    return validatedNotification;
  }

  // AGENT C INTEGRATION: Check if notification should be delivered immediately
  private shouldDeliverNow(preferences: NotificationPreferences, notification: Notification): boolean {
    const categoryPrefs = preferences.categories[notification.category];
    
    // Check quiet hours if enabled
    if (preferences.quietHours?.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const startTime = preferences.quietHours.startTime;
      const endTime = preferences.quietHours.endTime;
      
      // Simple time comparison - doesn't handle overnight quiet hours
      if (currentTime >= startTime && currentTime <= endTime) {
        return false; // Don't deliver during quiet hours
      }
    }
    
    // Check frequency preferences
    if (categoryPrefs?.frequency === 'batched_daily' || categoryPrefs?.frequency === 'batched_hourly') {
      return false; // Will be processed in batch later
    }
    
    return true; // Deliver immediately
  }

  async getNotifications(userId: number, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: string;
    type?: string;
  } = {}): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const notifications = await this.loadNotifications();
    let userNotifications = notifications.filter(n => n.userId === userId);
    
    // Apply filters
    if (options.unreadOnly) {
      userNotifications = userNotifications.filter(n => !n.isRead);
    }
    
    if (options.category) {
      userNotifications = userNotifications.filter(n => n.category === options.category);
    }
    
    if (options.type) {
      userNotifications = userNotifications.filter(n => n.type === options.type);
    }
    
    // Sort by creation date (newest first)
    userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply pagination
    const total = userNotifications.length;
    const unreadCount = notifications.filter(n => n.userId === userId && !n.isRead).length;
    
    if (options.limit || options.offset) {
      const offset = options.offset || 0;
      const limit = options.limit || 20;
      userNotifications = userNotifications.slice(offset, offset + limit);
    }
    
    return {
      notifications: userNotifications,
      total,
      unreadCount
    };
  }

  async markAsRead(userId: number, notificationId: string): Promise<boolean> {
    const notifications = await this.loadNotifications();
    const notification = notifications.find(n => n.id === notificationId && n.userId === userId);
    
    if (!notification) return false;
    
    notification.isRead = true;
    notification.readAt = new Date().toISOString();
    notification.updatedAt = new Date().toISOString();
    
    await this.saveNotifications(notifications);
    return true;
  }

  async markAsClicked(userId: number, notificationId: string): Promise<boolean> {
    const notifications = await this.loadNotifications();
    const notification = notifications.find(n => n.id === notificationId && n.userId === userId);
    
    if (!notification) return false;
    
    notification.isClicked = true;
    notification.clickedAt = new Date().toISOString();
    notification.updatedAt = new Date().toISOString();
    
    await this.saveNotifications(notifications);
    return true;
  }


  async deleteNotification(userId: number, notificationId: string): Promise<boolean> {
    const notifications = await this.loadNotifications();
    const index = notifications.findIndex(n => n.id === notificationId && n.userId === userId);
    
    if (index === -1) return false;
    
    notifications.splice(index, 1);
    await this.saveNotifications(notifications);
    return true;
  }

  // ============================================================================
  // NOTIFICATION PREFERENCES
  // ============================================================================

  async getUserPreferences(userId: number): Promise<NotificationPreferences> {
    const preferences = await this.loadPreferences();
    const basePreferences = preferences[userId] || this.getDefaultPreferences(userId);
    
    // AGENT C INTEGRATION: Merge with Agent C's user preferences
    return await this.mergeWithAgentCPreferences(userId, basePreferences);
  }

  // AGENT C INTEGRATION: Merge notification preferences with Agent C's user preferences
  private async mergeWithAgentCPreferences(userId: number, basePreferences: NotificationPreferences): Promise<NotificationPreferences> {
    try {
      // Get Agent C's user preferences
      const agentCPreferences = await this.fileStorage.getUserPreferences(userId.toString());
      
      if (!agentCPreferences) {
        return basePreferences;
      }

      // Merge Agent C preferences with notification preferences
      const mergedPreferences: NotificationPreferences = {
        ...basePreferences,
        // Update achievement-specific settings based on Agent C preferences
        achievementAlerts: agentCPreferences.achievementNotifications ?? true,
        // Merge categories with Agent C preferences
        categories: {
          ...basePreferences.categories,
          achievement: {
            ...basePreferences.categories.achievement,
            enabled: agentCPreferences.achievementNotifications ?? true
          },
          fitness: {
            ...basePreferences.categories.fitness,
            frequency: agentCPreferences.coachingEnabled ? 'immediate' : 'batched_daily'
          }
        }
      };

      return mergedPreferences;
    } catch (error) {
      console.error('Failed to merge with Agent C preferences:', error);
      return basePreferences;
    }
  }

  async updateUserPreferences(userId: number, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const preferences = await this.loadPreferences();
    const currentPrefs = preferences[userId] || this.getDefaultPreferences(userId);
    
    const updatedPrefs = {
      ...currentPrefs,
      ...updates,
      userId,
      updatedAt: new Date().toISOString()
    };
    
    const validatedPrefs = NotificationPreferencesSchema.parse(updatedPrefs);
    preferences[userId] = validatedPrefs;
    
    await this.savePreferences(preferences);
    return validatedPrefs;
  }

  private getDefaultPreferences(userId: number): NotificationPreferences {
    return {
      userId,
      enabled: true,
      channels: {
        in_app: true,
        push: true,
        email: true,
        sms: false
      },
      categories: {
        fitness: {
          enabled: true,
          channels: ['in_app', 'push'],
          frequency: 'immediate'
        },
        social: {
          enabled: true,
          channels: ['in_app', 'push'],
          frequency: 'immediate'
        },
        achievement: {
          enabled: true,
          channels: ['in_app', 'push', 'email'],
          frequency: 'immediate'
        },
        system: {
          enabled: true,
          channels: ['in_app', 'email'],
          frequency: 'immediate'
        },
        health: {
          enabled: true,
          channels: ['in_app', 'push'],
          frequency: 'immediate'
        }
      },
      workoutReminders: true,
      achievementAlerts: true,
      socialUpdates: true,
      progressReports: true,
      challengeUpdates: true,
      updatedAt: new Date().toISOString()
    };
  }

  // ============================================================================
  // NOTIFICATION TRIGGERS & AUTOMATIONS
  // ============================================================================

  async triggerWorkoutReminder(userId: number, workoutType?: string): Promise<Notification> {
    const template = await this.getTemplate('workout_reminder');
    
    return this.createNotification({
      userId,
      type: 'workout_reminder',
      title: 'Time for your workout! 💪',
      message: workoutType 
        ? `Your ${workoutType} workout is scheduled for now. Ready to crush it?`
        : 'Your workout is scheduled for now. Ready to get started?',
      category: 'fitness',
      priority: 'medium',
      channels: ['in_app', 'push'],
      data: { workoutType },
      templateId: template?.id
    });
  }

  async triggerAchievementUnlock(userId: number, achievement: {
    title: string;
    description: string;
    iconType: string;
    value?: string;
  }): Promise<Notification> {
    return this.createNotification({
      userId,
      type: 'achievement_unlocked',
      title: `🏆 Achievement Unlocked: ${achievement.title}`,
      message: achievement.description,
      category: 'achievement',
      priority: 'high',
      channels: ['in_app', 'push', 'email'],
      data: achievement
    });
  }

  // ============================================================================
  // AGENT B INTEGRATION: GOAL MILESTONE NOTIFICATIONS
  // ============================================================================

  async createGoalMilestoneNotification(userId: number, milestoneData: {
    goalId: string;
    milestoneType: 'goal_created' | 'progress_25' | 'progress_50' | 'progress_75' | 'goal_achieved' | 'streak_milestone';
    currentValue: number;
    targetValue: number;
    progressPercentage: number;
    goalTitle: string;
    category?: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'consistency';
  }): Promise<Notification> {
    const milestoneMessages = {
      goal_created: {
        title: `🎯 New Goal Set: ${milestoneData.goalTitle}`,
        message: `You're on your way! Target: ${milestoneData.targetValue}. Let's make it happen!`,
        emoji: '🎯'
      },
      progress_25: {
        title: `🚀 25% Progress: ${milestoneData.goalTitle}`,
        message: `Great start! You've reached ${milestoneData.currentValue}/${milestoneData.targetValue}. Keep going!`,
        emoji: '🚀'
      },
      progress_50: {
        title: `🔥 Halfway There: ${milestoneData.goalTitle}`,
        message: `Amazing! You're 50% complete at ${milestoneData.currentValue}/${milestoneData.targetValue}. You've got this!`,
        emoji: '🔥'
      },
      progress_75: {
        title: `⚡ Almost There: ${milestoneData.goalTitle}`,
        message: `So close! 75% complete at ${milestoneData.currentValue}/${milestoneData.targetValue}. Final push!`,
        emoji: '⚡'
      },
      goal_achieved: {
        title: `🏆 Goal Achieved: ${milestoneData.goalTitle}`,
        message: `Incredible! You reached ${milestoneData.currentValue}/${milestoneData.targetValue}. Time to celebrate! 🎉`,
        emoji: '🏆'
      },
      streak_milestone: {
        title: `🔥 Streak Milestone: ${milestoneData.goalTitle}`,
        message: `Amazing consistency! ${milestoneData.currentValue} days strong. You're building incredible habits!`,
        emoji: '🔥'
      }
    };

    const milestone = milestoneMessages[milestoneData.milestoneType];
    
    return this.createNotification({
      userId,
      type: 'goal_milestone',
      title: milestone.title,
      message: milestone.message,
      category: 'achievement',
      priority: milestoneData.milestoneType === 'goal_achieved' ? 'high' : 'medium',
      channels: milestoneData.milestoneType === 'goal_achieved' 
        ? ['in_app', 'push', 'email'] 
        : ['in_app', 'push'],
      data: {
        ...milestoneData,
        emoji: milestone.emoji
      },
      actionUrl: `/goals/${milestoneData.goalId}`
    });
  }

  async scheduleWorkoutReminder(userId: number, reminderData: {
    goalId?: string;
    workoutType: string;
    scheduledFor: string;
    reminderType: 'pre_workout' | 'missed_workout' | 'streak_maintenance';
    customMessage?: string;
  }): Promise<Notification> {
    const reminderMessages = {
      pre_workout: {
        title: `💪 Workout Reminder: ${reminderData.workoutType}`,
        message: reminderData.customMessage || `Time for your ${reminderData.workoutType} workout! You've got this!`
      },
      missed_workout: {
        title: `🤔 Missed Workout Check-in`,
        message: reminderData.customMessage || `Haven't seen your ${reminderData.workoutType} workout yet. Everything okay?`
      },
      streak_maintenance: {
        title: `🔥 Keep Your Streak Alive`,
        message: reminderData.customMessage || `Don't break the chain! Your ${reminderData.workoutType} workout is waiting.`
      }
    };

    const message = reminderMessages[reminderData.reminderType];

    return this.createNotification({
      userId,
      type: 'workout_reminder',
      title: message.title,
      message: message.message,
      category: 'fitness',
      priority: reminderData.reminderType === 'streak_maintenance' ? 'medium' : 'low',
      channels: ['in_app', 'push'],
      scheduledFor: reminderData.scheduledFor,
      data: {
        ...reminderData,
        isScheduled: true
      },
      actionUrl: reminderData.goalId ? `/goals/${reminderData.goalId}` : '/workouts'
    });
  }

  async createAchievementNotification(userId: number, achievementData: {
    achievementId: string;
    achievementTitle: string;
    achievementDescription: string;
    category: 'first_workout' | 'streak_milestone' | 'weight_milestone' | 'strength_milestone' | 'consistency';
    badgeImageUrl?: string;
    celebrationLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  }): Promise<Notification> {
    const celebrationEmojis = {
      bronze: '🥉',
      silver: '🥈', 
      gold: '🥇',
      platinum: '💎'
    };

    const emoji = celebrationEmojis[achievementData.celebrationLevel];

    return this.createNotification({
      userId,
      type: 'achievement_unlocked',
      title: `${emoji} ${achievementData.achievementTitle}`,
      message: achievementData.achievementDescription,
      category: 'achievement',
      priority: achievementData.celebrationLevel === 'platinum' ? 'urgent' : 'high',
      channels: ['in_app', 'push', 'email'],
      data: {
        ...achievementData,
        emoji
      },
      imageUrl: achievementData.badgeImageUrl,
      actionUrl: `/achievements/${achievementData.achievementId}`
    });
  }

  async getGoalProgressNotifications(userId: number, goalId?: string): Promise<Notification[]> {
    const result = await this.getNotifications(userId, {
      category: 'achievement'
    });

    return result.notifications.filter(notification => 
      (notification.type === 'goal_milestone' || notification.type === 'achievement_unlocked') &&
      (!goalId || notification.data?.goalId === goalId)
    );
  }

  async getUnreadCount(userId: number): Promise<number> {
    const result = await this.getNotifications(userId, {
      unreadOnly: true
    });
    
    return result.unreadCount;
  }


  async markAllAsRead(userId: number, category?: string): Promise<number> {
    try {
      const notifications = await this.loadNotifications();
      let markedCount = 0;

      for (const notification of notifications) {
        if (notification.userId === userId && 
            !notification.isRead && 
            (!category || notification.category === category)) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          notification.updatedAt = new Date().toISOString();
          markedCount++;
        }
      }

      if (markedCount > 0) {
        await this.saveNotifications(notifications);
      }

      return markedCount;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  async getScheduledNotifications(userId: number, options?: {
    upcomingOnly?: boolean;
    limit?: number;
  }): Promise<Partial<Notification>[]> {
    try {
      const scheduledNotifications = await this.loadScheduledNotifications();
      
      let userScheduled = scheduledNotifications.filter(n => n.userId === userId);

      if (options?.upcomingOnly) {
        const now = new Date();
        userScheduled = userScheduled.filter(n => 
          n.scheduledFor && new Date(n.scheduledFor) > now
        );
      }

      if (options?.limit) {
        userScheduled = userScheduled.slice(0, options.limit);
      }

      return userScheduled.sort((a, b) => {
        if (!a.scheduledFor || !b.scheduledFor) return 0;
        return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
      });
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async cancelScheduledNotification(notificationId: string, userId: number): Promise<boolean> {
    try {
      const scheduledNotifications = await this.loadScheduledNotifications();
      
      const index = scheduledNotifications.findIndex(n => n.id === notificationId && n.userId === userId);
      if (index === -1) {
        return false;
      }

      scheduledNotifications.splice(index, 1);
      await this.saveScheduledNotifications(scheduledNotifications);
      return true;
    } catch (error) {
      console.error('Error cancelling scheduled notification:', error);
      return false;
    }
  }

  async triggerPersonalRecord(userId: number, exercise: string, newRecord: {
    type: 'weight' | 'reps' | 'volume';
    value: number;
    previousValue?: number;
  }): Promise<Notification> {
    const improvement = newRecord.previousValue 
      ? `+${newRecord.value - newRecord.previousValue}`
      : '';
    
    return this.createNotification({
      userId,
      type: 'personal_record',
      title: `🔥 New Personal Record!`,
      message: `You just hit a new ${newRecord.type} PR on ${exercise}: ${newRecord.value} ${improvement}`,
      category: 'achievement',
      priority: 'high',
      channels: ['in_app', 'push', 'email'],
      data: { exercise, record: newRecord }
    });
  }

  async triggerSocialNotification(userId: number, type: 'follower_new' | 'post_liked' | 'post_commented', data: any): Promise<Notification> {
    const messages = {
      follower_new: `${data.followerName} started following you!`,
      post_liked: `${data.likerName} liked your post`,
      post_commented: `${data.commenterName} commented on your post: "${data.comment}"`
    };

    return this.createNotification({
      userId,
      type,
      title: 'Social Update',
      message: messages[type],
      category: 'social',
      priority: 'medium',
      channels: ['in_app', 'push'],
      data
    });
  }

  async triggerChallengeUpdate(userId: number, challenge: {
    name: string;
    progress: number;
    target: number;
    completed?: boolean;
  }): Promise<Notification> {
    if (challenge.completed) {
      return this.createNotification({
        userId,
        type: 'challenge_completed',
        title: `🎉 Challenge Completed!`,
        message: `Congratulations! You've completed the ${challenge.name} challenge!`,
        category: 'achievement',
        priority: 'high',
        channels: ['in_app', 'push', 'email'],
        data: challenge
      });
    } else {
      const progressPercentage = Math.round((challenge.progress / challenge.target) * 100);
      return this.createNotification({
        userId,
        type: 'challenge_reminder',
        title: `Challenge Progress Update`,
        message: `You're ${progressPercentage}% complete with ${challenge.name}. Keep going!`,
        category: 'fitness',
        priority: 'medium',
        channels: ['in_app', 'push'],
        data: challenge
      });
    }
  }

  // ============================================================================
  // SCHEDULED NOTIFICATIONS
  // ============================================================================

  async scheduleNotification(notificationData: Partial<Notification>, scheduledFor: Date): Promise<string> {
    const scheduledNotification = {
      ...notificationData,
      id: crypto.randomUUID(),
      scheduledFor: scheduledFor.toISOString(),
      createdAt: new Date().toISOString()
    };

    const scheduledNotifications = await this.loadScheduledNotifications();
    scheduledNotifications.push(scheduledNotification);
    await this.saveScheduledNotifications(scheduledNotifications);

    return scheduledNotification.id!;
  }

  async processScheduledNotifications(): Promise<number> {
    const now = new Date();
    const scheduledNotifications = await this.loadScheduledNotifications();
    const dueNotifications = scheduledNotifications.filter(n => 
      n.scheduledFor && new Date(n.scheduledFor) <= now
    );

    let processedCount = 0;
    for (const notification of dueNotifications) {
      try {
        await this.createNotification(notification);
        processedCount++;
      } catch (error) {
        console.error('Error processing scheduled notification:', error);
      }
    }

    // Remove processed notifications
    const remainingNotifications = scheduledNotifications.filter(n => 
      !n.scheduledFor || new Date(n.scheduledFor) > now
    );
    await this.saveScheduledNotifications(remainingNotifications);

    return processedCount;
  }

  // ============================================================================
  // DELIVERY PROCESSING
  // ============================================================================

  private async processDelivery(notification: Notification): Promise<void> {
    const userPrefs = await this.getUserPreferences(notification.userId);
    
    // Check if notifications are enabled and not in quiet hours
    if (!userPrefs.enabled || this.isInQuietHours(userPrefs)) {
      return;
    }

    // Check category preferences
    const categoryPrefs = userPrefs.categories[notification.category];
    if (!categoryPrefs.enabled) {
      return;
    }

    // Filter channels based on user preferences
    const allowedChannels = notification.channels.filter(channel => 
      userPrefs.channels[channel] && categoryPrefs.channels.includes(channel)
    );

    // Process delivery for each allowed channel
    for (const channel of allowedChannels) {
      await this.deliverToChannel(notification, channel);
    }
  }

  private async deliverToChannel(notification: Notification, channel: string): Promise<void> {
    try {
      switch (channel) {
        case 'in_app':
          // In-app notifications are stored and delivered via API
          await this.updateDeliveryStatus(notification.id, channel, 'delivered');
          break;
          
        case 'push':
          await this.sendPushNotification(notification);
          break;
          
        case 'email':
          await this.sendEmailNotification(notification);
          break;
          
        case 'sms':
          await this.sendSMSNotification(notification);
          break;
      }
    } catch (error) {
      console.error(`Error delivering notification via ${channel}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateDeliveryStatus(notification.id, channel, 'failed', errorMessage);
    }
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    // Integration point for push notification services (Firebase, OneSignal, etc.)
    console.log('Sending push notification:', {
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      data: notification.data
    });
    
    // Simulate successful delivery
    await this.updateDeliveryStatus(notification.id, 'push', 'sent');
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    // Integration point for email services (SendGrid, SES, etc.)
    console.log('Sending email notification:', {
      userId: notification.userId,
      subject: notification.title,
      body: notification.message,
      data: notification.data
    });
    
    // Simulate successful delivery
    await this.updateDeliveryStatus(notification.id, 'email', 'sent');
  }

  private async sendSMSNotification(notification: Notification): Promise<void> {
    // Integration point for SMS services (Twilio, etc.)
    console.log('Sending SMS notification:', {
      userId: notification.userId,
      message: `${notification.title}: ${notification.message}`,
      data: notification.data
    });
    
    // Simulate successful delivery
    await this.updateDeliveryStatus(notification.id, 'sms', 'sent');
  }

  private async updateDeliveryStatus(notificationId: string, channel: string, status: string, error?: string): Promise<void> {
    const notifications = await this.loadNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) return;
    
    const deliveryChannel = notification.deliveryChannels.find(dc => dc.channel === channel);
    if (deliveryChannel) {
      deliveryChannel.status = status as any;
      deliveryChannel.sentAt = new Date().toISOString();
      if (error) deliveryChannel.error = error;
    }
    
    // Update overall delivery status
    const allDelivered = notification.deliveryChannels.every(dc => 
      dc.status === 'delivered' || dc.status === 'sent'
    );
    const anyFailed = notification.deliveryChannels.some(dc => dc.status === 'failed');
    
    if (allDelivered) {
      notification.deliveryStatus = 'delivered';
    } else if (anyFailed) {
      notification.deliveryStatus = 'failed';
    } else {
      notification.deliveryStatus = 'sent';
    }
    
    notification.updatedAt = new Date().toISOString();
    await this.saveNotifications(notifications);
  }

  private isInQuietHours(userPrefs: NotificationPreferences): boolean {
    if (!userPrefs.quietHours?.enabled) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { startTime, endTime } = userPrefs.quietHours;
    
    // Handle quiet hours that span midnight
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  private getDefaultTemplates(): NotificationTemplate[] {
    return [
      {
        id: 'workout_reminder',
        type: 'workout_reminder',
        category: 'fitness',
        titleTemplate: 'Time for your workout! 💪',
        messageTemplate: 'Your {{workoutType}} workout is scheduled for now. Ready to crush it?',
        variables: ['workoutType'],
        defaultChannels: ['in_app', 'push'],
        priority: 'medium',
        expirationHours: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'achievement_unlocked',
        type: 'achievement_unlocked',
        category: 'achievement',
        titleTemplate: '🏆 Achievement Unlocked: {{title}}',
        messageTemplate: '{{description}}',
        variables: ['title', 'description'],
        defaultChannels: ['in_app', 'push', 'email'],
        priority: 'high',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    const templates = await this.loadTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  // ============================================================================
  // STORAGE METHODS
  // ============================================================================

  private async loadNotifications(): Promise<Notification[]> {
    try {
      const data = await fs.readFile(this.notificationsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveNotifications(notifications: Notification[]): Promise<void> {
    await fs.writeFile(this.notificationsFile, JSON.stringify(notifications, null, 2));
  }

  private async saveNotification(notification: Notification): Promise<void> {
    const notifications = await this.loadNotifications();
    notifications.push(notification);
    await this.saveNotifications(notifications);
  }

  private async loadPreferences(): Promise<Record<number, NotificationPreferences>> {
    try {
      const data = await fs.readFile(this.preferencesFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private async savePreferences(preferences: Record<number, NotificationPreferences>): Promise<void> {
    await fs.writeFile(this.preferencesFile, JSON.stringify(preferences, null, 2));
  }

  private async loadTemplates(): Promise<NotificationTemplate[]> {
    try {
      const data = await fs.readFile(this.templatesFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return this.getDefaultTemplates();
    }
  }

  private async loadScheduledNotifications(): Promise<Partial<Notification>[]> {
    try {
      const data = await fs.readFile(this.scheduledNotificationsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveScheduledNotifications(notifications: Partial<Notification>[]): Promise<void> {
    await fs.writeFile(this.scheduledNotificationsFile, JSON.stringify(notifications, null, 2));
  }
}

// Export singleton instance
export const notificationService = new NotificationService();