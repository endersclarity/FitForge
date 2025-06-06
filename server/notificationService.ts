import { EventEmitter } from 'events';

// Core notification types
export enum NotificationType {
  WORKOUT_REMINDER = 'workout_reminder',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  GOAL_PROGRESS = 'goal_progress',
  SOCIAL_INTERACTION = 'social_interaction',
  STREAK_MILESTONE = 'streak_milestone',
  RECOVERY_REMINDER = 'recovery_reminder',
  NUTRITION_REMINDER = 'nutrition_reminder',
  WEIGHT_LOG_REMINDER = 'weight_log_reminder'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationChannel {
  PUSH = 'push',
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms'
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  iconUrl?: string;
  actionUrl?: string;
  variables?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    [key in NotificationType]: NotificationChannel[];
  };
  quietHours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  frequency?: {
    [key in NotificationType]: 'immediate' | 'daily' | 'weekly' | 'disabled';
  };
}

export interface NotificationData {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  scheduledAt?: Date;
  sentAt?: Date;
  readAt?: Date;
  actionUrl?: string;
  iconUrl?: string;
  expiresAt?: Date;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'expired';
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  vibrate?: number[];
}

export interface EmailNotificationPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

// Notification templates for different types
export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  [NotificationType.WORKOUT_REMINDER]: {
    id: 'workout_reminder',
    type: NotificationType.WORKOUT_REMINDER,
    title: "Time to workout! 💪",
    body: "Your {{workoutType}} session is scheduled. Let's crush those goals!",
    iconUrl: "/icons/workout.png",
    actionUrl: "/start-workout"
  },
  
  [NotificationType.ACHIEVEMENT_UNLOCK]: {
    id: 'achievement_unlock',
    type: NotificationType.ACHIEVEMENT_UNLOCK,
    title: "🎉 Achievement Unlocked!",
    body: "Congratulations! You've earned '{{achievementTitle}}'",
    iconUrl: "/icons/trophy.png",
    actionUrl: "/achievements"
  },
  
  [NotificationType.GOAL_PROGRESS]: {
    id: 'goal_progress',
    type: NotificationType.GOAL_PROGRESS,
    title: "Goal Progress Update 📈",
    body: "You're {{progressPercentage}}% towards your {{goalTitle}} goal!",
    iconUrl: "/icons/target.png",
    actionUrl: "/goals"
  },
  
  [NotificationType.SOCIAL_INTERACTION]: {
    id: 'social_interaction',
    type: NotificationType.SOCIAL_INTERACTION,
    title: "{{userName}} {{actionType}}",
    body: "{{details}}",
    iconUrl: "/icons/social.png",
    actionUrl: "/community"
  },
  
  [NotificationType.STREAK_MILESTONE]: {
    id: 'streak_milestone',
    type: NotificationType.STREAK_MILESTONE,
    title: "🔥 {{streakDays}} Day Streak!",
    body: "Amazing consistency! Keep the momentum going.",
    iconUrl: "/icons/fire.png",
    actionUrl: "/progress"
  },
  
  [NotificationType.RECOVERY_REMINDER]: {
    id: 'recovery_reminder',
    type: NotificationType.RECOVERY_REMINDER,
    title: "Recovery Day Reminder 😴",
    body: "Your {{muscleGroup}} needs rest. Consider light activity or stretching.",
    iconUrl: "/icons/rest.png",
    actionUrl: "/recovery"
  },
  
  [NotificationType.NUTRITION_REMINDER]: {
    id: 'nutrition_reminder',
    type: NotificationType.NUTRITION_REMINDER,
    title: "Nutrition Check-in 🥗",
    body: "Don't forget to log your meals and stay hydrated!",
    iconUrl: "/icons/nutrition.png",
    actionUrl: "/nutrition"
  },
  
  [NotificationType.WEIGHT_LOG_REMINDER]: {
    id: 'weight_log_reminder',
    type: NotificationType.WEIGHT_LOG_REMINDER,
    title: "Weekly Weigh-in ⚖️",
    body: "Time for your weekly progress check-in!",
    iconUrl: "/icons/scale.png",
    actionUrl: "/progress"
  }
};

// Notification service class
export class NotificationService extends EventEmitter {
  private notifications: Map<string, NotificationData> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.setupCleanupInterval();
  }

  // Template rendering utility
  private renderTemplate(template: NotificationTemplate, variables: Record<string, any> = {}): { title: string; body: string } {
    let title = template.title;
    let body = template.body;

    // Replace variables in title and body
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      title = title.replace(placeholder, String(value));
      body = body.replace(placeholder, String(value));
    });

    return { title, body };
  }

  // Create notification
  async createNotification(params: {
    userId: string;
    type: NotificationType;
    priority?: NotificationPriority;
    data?: Record<string, any>;
    scheduledAt?: Date;
    customTitle?: string;
    customBody?: string;
    channels?: NotificationChannel[];
  }): Promise<string> {
    const template = NOTIFICATION_TEMPLATES[params.type];
    const { title, body } = params.customTitle && params.customBody 
      ? { title: params.customTitle, body: params.customBody }
      : this.renderTemplate(template, params.data);

    const notification: NotificationData = {
      id: this.generateId(),
      userId: params.userId,
      type: params.type,
      priority: params.priority || NotificationPriority.MEDIUM,
      title,
      body,
      data: params.data,
      channels: params.channels || await this.getPreferredChannels(params.userId, params.type),
      scheduledAt: params.scheduledAt,
      actionUrl: template.actionUrl,
      iconUrl: template.iconUrl,
      retryCount: 0,
      maxRetries: 3,
      status: 'pending'
    };

    this.notifications.set(notification.id, notification);

    if (params.scheduledAt && params.scheduledAt > new Date()) {
      // Schedule for later
      this.scheduleNotification(notification);
    } else {
      // Send immediately
      await this.sendNotification(notification.id);
    }

    return notification.id;
  }

  // Send notification through appropriate channels
  private async sendNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    // Check quiet hours
    if (await this.isInQuietHours(notification.userId)) {
      // Reschedule for after quiet hours
      const nextAvailableTime = await this.getNextAvailableTime(notification.userId);
      this.scheduleNotification({ ...notification, scheduledAt: nextAvailableTime });
      return;
    }

    try {
      notification.sentAt = new Date();
      notification.status = 'sent';

      // Send through each preferred channel
      const sendPromises = notification.channels.map(channel => {
        switch (channel) {
          case NotificationChannel.PUSH:
            return this.sendPushNotification(notification);
          case NotificationChannel.IN_APP:
            return this.sendInAppNotification(notification);
          case NotificationChannel.EMAIL:
            return this.sendEmailNotification(notification);
          case NotificationChannel.SMS:
            return this.sendSMSNotification(notification);
          default:
            return Promise.resolve();
        }
      });

      await Promise.allSettled(sendPromises);
      notification.status = 'delivered';
      
      this.emit('notification:sent', notification);
    } catch (error) {
      notification.retryCount++;
      if (notification.retryCount < notification.maxRetries) {
        // Retry with exponential backoff
        const delay = Math.pow(2, notification.retryCount) * 1000;
        setTimeout(() => this.sendNotification(notificationId), delay);
      } else {
        notification.status = 'failed';
        this.emit('notification:failed', notification, error);
      }
    }
  }

  // Push notification implementation
  private async sendPushNotification(notification: NotificationData): Promise<void> {
    const payload: PushNotificationPayload = {
      title: notification.title,
      body: notification.body,
      icon: notification.iconUrl,
      badge: '/icons/badge.png',
      data: {
        notificationId: notification.id,
        actionUrl: notification.actionUrl,
        type: notification.type,
        ...notification.data
      },
      actions: notification.actionUrl ? [{
        action: 'open',
        title: 'View',
        icon: '/icons/view.png'
      }] : undefined,
      requireInteraction: notification.priority === NotificationPriority.HIGH || notification.priority === NotificationPriority.URGENT,
      timestamp: Date.now()
    };

    // Here you would integrate with your push notification service
    // For example: Firebase Cloud Messaging, OneSignal, etc.
    console.log('Sending push notification:', payload);
    
    // Emit event for real-time updates
    this.emit('push:send', notification.userId, payload);
  }

  // In-app notification
  private async sendInAppNotification(notification: NotificationData): Promise<void> {
    // Store in-app notification for user
    this.emit('in_app:new', notification.userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      priority: notification.priority,
      timestamp: new Date(),
      actionUrl: notification.actionUrl,
      iconUrl: notification.iconUrl,
      data: notification.data
    });
  }

  // Email notification
  private async sendEmailNotification(notification: NotificationData): Promise<void> {
    // Get user email
    const userEmail = await this.getUserEmail(notification.userId);
    if (!userEmail) return;

    const emailPayload: EmailNotificationPayload = {
      to: userEmail,
      subject: notification.title,
      html: this.generateEmailHTML(notification),
      text: notification.body
    };

    // Here you would integrate with your email service
    // For example: SendGrid, Mailgun, AWS SES, etc.
    console.log('Sending email notification:', emailPayload);
    
    this.emit('email:send', emailPayload);
  }

  // SMS notification
  private async sendSMSNotification(notification: NotificationData): Promise<void> {
    // Get user phone number
    const userPhone = await this.getUserPhone(notification.userId);
    if (!userPhone) return;

    const smsPayload = {
      to: userPhone,
      body: `${notification.title}\n${notification.body}`
    };

    // Here you would integrate with your SMS service
    // For example: Twilio, AWS SNS, etc.
    console.log('Sending SMS notification:', smsPayload);
    
    this.emit('sms:send', smsPayload);
  }

  // Schedule notification
  private scheduleNotification(notification: NotificationData): void {
    if (!notification.scheduledAt) return;

    const delay = notification.scheduledAt.getTime() - Date.now();
    if (delay <= 0) {
      this.sendNotification(notification.id);
      return;
    }

    const timeout = setTimeout(() => {
      this.sendNotification(notification.id);
      this.scheduledNotifications.delete(notification.id);
    }, delay);

    this.scheduledNotifications.set(notification.id, timeout);
  }

  // User preference management
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    const existing = this.userPreferences.get(userId) || {
      userId,
      channels: this.getDefaultChannelPreferences(),
      frequency: this.getDefaultFrequencyPreferences()
    };

    const updated = { ...existing, ...preferences, userId };
    this.userPreferences.set(userId, updated);
    
    // Here you would persist to database
    this.emit('preferences:updated', userId, updated);
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    return this.userPreferences.get(userId) || {
      userId,
      channels: this.getDefaultChannelPreferences(),
      frequency: this.getDefaultFrequencyPreferences()
    };
  }

  // Get preferred channels for notification type
  private async getPreferredChannels(userId: string, type: NotificationType): Promise<NotificationChannel[]> {
    const preferences = await this.getUserPreferences(userId);
    return preferences.channels[type] || [NotificationChannel.IN_APP];
  }

  // Check if in quiet hours
  private async isInQuietHours(userId: string): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    if (!preferences.quietHours) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    // Simple time comparison (would need proper timezone handling in production)
    return currentTime >= preferences.quietHours.start && currentTime <= preferences.quietHours.end;
  }

  // Get next available time after quiet hours
  private async getNextAvailableTime(userId: string): Promise<Date> {
    const preferences = await this.getUserPreferences(userId);
    if (!preferences.quietHours) return new Date();

    // Calculate next available time (simplified)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(parseInt(preferences.quietHours.end.split(':')[0]));
    tomorrow.setMinutes(parseInt(preferences.quietHours.end.split(':')[1]));
    
    return tomorrow;
  }

  // Utility methods
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getUserEmail(userId: string): Promise<string | null> {
    // This would query your user database
    return `user${userId}@example.com`; // Placeholder
  }

  private async getUserPhone(userId: string): Promise<string | null> {
    // This would query your user database
    return null; // Placeholder
  }

  private generateEmailHTML(notification: NotificationData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${notification.title}</h2>
        <p>${notification.body}</p>
        ${notification.actionUrl ? `<a href="${notification.actionUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in App</a>` : ''}
      </div>
    `;
  }

  private getDefaultChannelPreferences(): Record<NotificationType, NotificationChannel[]> {
    return {
      [NotificationType.WORKOUT_REMINDER]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
      [NotificationType.ACHIEVEMENT_UNLOCK]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
      [NotificationType.GOAL_PROGRESS]: [NotificationChannel.IN_APP],
      [NotificationType.SOCIAL_INTERACTION]: [NotificationChannel.IN_APP],
      [NotificationType.STREAK_MILESTONE]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
      [NotificationType.RECOVERY_REMINDER]: [NotificationChannel.IN_APP],
      [NotificationType.NUTRITION_REMINDER]: [NotificationChannel.IN_APP],
      [NotificationType.WEIGHT_LOG_REMINDER]: [NotificationChannel.IN_APP]
    };
  }

  private getDefaultFrequencyPreferences(): Record<NotificationType, 'immediate' | 'daily' | 'weekly' | 'disabled'> {
    return {
      [NotificationType.WORKOUT_REMINDER]: 'immediate',
      [NotificationType.ACHIEVEMENT_UNLOCK]: 'immediate',
      [NotificationType.GOAL_PROGRESS]: 'daily',
      [NotificationType.SOCIAL_INTERACTION]: 'immediate',
      [NotificationType.STREAK_MILESTONE]: 'immediate',
      [NotificationType.RECOVERY_REMINDER]: 'daily',
      [NotificationType.NUTRITION_REMINDER]: 'daily',
      [NotificationType.WEIGHT_LOG_REMINDER]: 'weekly'
    };
  }

  // Cleanup expired notifications
  private setupCleanupInterval(): void {
    setInterval(() => {
      const now = new Date();
      for (const [id, notification] of this.notifications.entries()) {
        if (notification.expiresAt && notification.expiresAt < now) {
          this.notifications.delete(id);
          const scheduledTimeout = this.scheduledNotifications.get(id);
          if (scheduledTimeout) {
            clearTimeout(scheduledTimeout);
            this.scheduledNotifications.delete(id);
          }
        }
      }
    }, 60000); // Clean up every minute
  }

  // Get user notifications
  async getUserNotifications(userId: string, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {}): Promise<NotificationData[]> {
    const notifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .filter(n => !options.unreadOnly || !n.readAt)
      .filter(n => !options.type || n.type === options.type)
      .sort((a, b) => (b.sentAt || b.scheduledAt || new Date()).getTime() - (a.sentAt || a.scheduledAt || new Date()).getTime())
      .slice(options.offset || 0, (options.offset || 0) + (options.limit || 50));

    return notifications;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.readAt = new Date();
      this.emit('notification:read', notification);
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    this.notifications.delete(notificationId);
    const scheduledTimeout = this.scheduledNotifications.get(notificationId);
    if (scheduledTimeout) {
      clearTimeout(scheduledTimeout);
      this.scheduledNotifications.delete(notificationId);
    }
  }

  // Get notification statistics
  async getStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byChannel: Record<NotificationChannel, number>;
  }> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId);

    const byType = {} as Record<NotificationType, number>;
    const byChannel = {} as Record<NotificationChannel, number>;

    userNotifications.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
      n.channels.forEach(channel => {
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      });
    });

    return {
      total: userNotifications.length,
      unread: userNotifications.filter(n => !n.readAt).length,
      byType,
      byChannel
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();