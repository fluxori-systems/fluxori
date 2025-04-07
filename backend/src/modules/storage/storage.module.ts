import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * Storage module for handling file storage operations
 */
@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class StorageModule {}
