import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

/**
 * ScheduledTasks module for running periodic tasks
 */
@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class ScheduledTasksModule {}
