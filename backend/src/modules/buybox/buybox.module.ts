import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Configuration

// Controllers
import { BuyBoxController } from './controllers/buybox.controller';
import { RepricingController } from './controllers/repricing.controller';

// Services
import { BuyBoxHistoryRepository } from './repositories/buybox-history.repository';
import { BuyBoxStatusRepository } from './repositories/buybox-status.repository';
import { RepricingRuleRepository } from './repositories/repricing-rule.repository';
import { BuyBoxMonitoringService } from './services/buybox-monitoring.service';
import { RepricingEngineService } from './services/repricing-engine.service';
import { RepricingSchedulerService } from './services/repricing-scheduler.service';

// Repositories
import { FirestoreConfigService } from '../../config/firestore.config';

/**
 * BuyBox Module
 *
 * Provides functionality for BuyBox monitoring and repricing
 */
@Module({
  imports: [ConfigModule],
  controllers: [BuyBoxController, RepricingController],
  providers: [
    // Configuration
    FirestoreConfigService,

    // Repositories
    BuyBoxStatusRepository,
    BuyBoxHistoryRepository,
    RepricingRuleRepository,

    // Services
    BuyBoxMonitoringService,
    RepricingEngineService,
    RepricingSchedulerService,
  ],
  exports: [
    BuyBoxMonitoringService,
    RepricingEngineService,
    RepricingSchedulerService,
  ],
})
export class BuyBoxModule {}
