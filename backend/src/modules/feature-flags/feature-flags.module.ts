import { Module } from '@nestjs/common';

import { FeatureFlagController } from './controllers/feature-flag.controller';
import { FeatureFlagAuditLogRepository } from './repositories/feature-flag-audit-log.repository';
import { FeatureFlagRepository } from './repositories/feature-flag.repository';
import { FeatureFlagCacheService } from './services/feature-flag-cache.service';
import { FeatureFlagService } from './services/feature-flag.service';
import { FirestoreConfigService } from '../../config/firestore.config';

/**
 * Feature Flags module for controlling feature availability and rollout
 */
@Module({
  imports: [],
  controllers: [FeatureFlagController],
  providers: [
    // Services
    FeatureFlagService,
    FeatureFlagCacheService,
    FirestoreConfigService,

    // Repositories
    FeatureFlagRepository,
    FeatureFlagAuditLogRepository,
  ],
  exports: [FeatureFlagService, FeatureFlagCacheService],
})
export class FeatureFlagsModule {}
