/**
 * Types for the Notifications module
 */



export enum NotificationType {
  ORDER = 'order',
  INVENTORY = 'inventory',
  MARKETPLACE = 'marketplace',
  SYSTEM = 'system',
  AI_INSIGHT = 'ai_insight',
  BUYBOX = 'buybox',
  PRICING = 'pricing',
  USER = 'user',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

export enum DeliveryChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
}

export interface INotification {
  organizationId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  status: NotificationStatus;
  deliveryChannels: DeliveryChannel[];
  deliveryStatus: Record<DeliveryChannel, boolean>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  readAt?: Date;
  archivedAt?: Date;
  scheduledAt?: Date;
  expiresAt?: Date;
}

export interface INotificationDocument extends INotification, Document {}

export interface CreateNotificationDto {
  organizationId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  deliveryChannels: DeliveryChannel[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
}

export interface UpdateNotificationDto {
  status?: NotificationStatus;
  readAt?: Date;
  archivedAt?: Date;
}

export interface QueryNotificationsDto {
  organizationId?: string;
  userId?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  deliveryChannel?: DeliveryChannel;
  relatedEntityType?: string;
  relatedEntityId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface NotificationResponse {
  id: string;
  organizationId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  status: NotificationStatus;
  deliveryChannels: DeliveryChannel[];
  deliveryStatus: Record<DeliveryChannel, boolean>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  readAt?: Date;
  archivedAt?: Date;
  scheduledAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  organizationId: string;
  userId?: string;
  enabledChannels: Record<NotificationType, DeliveryChannel[]>;
  emailSettings?: {
    emailAddress?: string;
    dailyDigest: boolean;
    digestTime?: string; // HH:MM format
  };
  smsSettings?: {
    phoneNumber?: string;
    limitToHighPriority: boolean;
  };
  pushSettings?: {
    deviceTokens: string[];
    limitToHighPriority: boolean;
  };
  webhookSettings?: {
    endpoints: string[];
    secret: string;
  };
}

export interface INotificationSettingsDocument extends NotificationSettings, Document {}