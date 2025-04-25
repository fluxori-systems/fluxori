/**
 * Health module for NestJS application
 *
 * Provides health check endpoints and indicators for the application
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  HealthCheckService,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HttpHealthIndicator,
} from '@nestjs/terminus';

import { FirestoreHealthIndicator } from './firestore-health.indicator';
import { HealthController } from './health.controller';
import { GoogleCloudStorageService } from '../common/storage/google-cloud-storage.service';
import { STORAGE_SERVICE } from '../common/storage/storage.interface';
import { FirestoreConfigService } from '../config/firestore.config';

@Module({
  imports: [ConfigModule],
  controllers: [HealthController],
  providers: [
    HealthCheckService,
    DiskHealthIndicator,
    MemoryHealthIndicator,
    HttpHealthIndicator,
    FirestoreHealthIndicator,
    FirestoreConfigService,
    {
      provide: STORAGE_SERVICE,
      useClass: GoogleCloudStorageService,
    },
  ],
  exports: [FirestoreHealthIndicator],
})
export class HealthModule {}
