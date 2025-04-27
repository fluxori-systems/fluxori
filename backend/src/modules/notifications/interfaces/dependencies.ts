// Dependencies for notifications module
// Using Google Cloud services

import { NotificationData } from './types';
// Export the interfaces and types needed by this module
export interface INotificationDocument {
  id: string;
  userId: string;
  organizationId: string;
  title: string;
  message: string;
  type: string;
  status: string;
  priority: string;
  data?: NotificationData; // TODO: Refine fields as discovered
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationSettingsDocument {
  id: string;
  userId: string;
  organizationId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  types: {
    [key: string]: {
      enabled: boolean;
      channels: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
