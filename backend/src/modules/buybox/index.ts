/**
 * BuyBox Module Exports
 */

// Main module
export { BuyBoxModule } from './buybox.module';

// Models
export { BuyBoxStatus } from './models/buybox-status.schema';
export { BuyBoxHistory } from './models/buybox-history.schema';
export { RepricingRule } from './models/repricing-rule.schema';

// Interfaces
export {
  PriceSourceType,
  BuyBoxStatus as BuyBoxStatusEnum,
  CompetitorPrice,
  PricingRuleOperation,
  PricingRuleExecutionStatus,
  PriceAdjustment,
  MarketPosition,
  BuyBoxThreshold,
} from './interfaces/types';

// Service Types
export {
  BuyBoxListing,
  CompetitorListing,
} from './services/buybox-monitoring.service';

// Services
export { BuyBoxMonitoringService } from './services/buybox-monitoring.service';
export { RepricingEngineService } from './services/repricing-engine.service';
export { RepricingSchedulerService } from './services/repricing-scheduler.service';

// Repositories
export { BuyBoxStatusRepository } from './repositories/buybox-status.repository';
export { BuyBoxHistoryRepository } from './repositories/buybox-history.repository';
export { RepricingRuleRepository } from './repositories/repricing-rule.repository';

// Controllers
export { BuyBoxController } from './controllers/buybox.controller';
export { RepricingController } from './controllers/repricing.controller';
