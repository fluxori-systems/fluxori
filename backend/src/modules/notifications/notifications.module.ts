import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

/**
 * Notifications module for handling system notifications
 */
@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class NotificationsModule {}
