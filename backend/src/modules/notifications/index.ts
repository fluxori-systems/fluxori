/**
 * Notifications Module Public API
 *
 * This file defines the public interface of the Notifications module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Re-export module
export { NotificationsModule } from "./notifications.module";

// Re-export types and interfaces
export {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  DeliveryChannel,
  INotification,
  CreateNotificationDto,
  UpdateNotificationDto,
  QueryNotificationsDto,
  NotificationResponse,
  NotificationSettings,
} from "./interfaces/types";

export {
  INotificationDocument,
  INotificationSettingsDocument,
} from "./interfaces/dependencies";

// Note: As the module is developed with services or repositories, they should be exported here.
