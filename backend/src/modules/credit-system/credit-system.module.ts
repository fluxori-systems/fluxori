import { Module } from "@nestjs/common";

import { FirestoreConfigService } from "src/config/firestore.config";
import { FeatureFlagService } from "src/modules/feature-flags";
import { AgentFrameworkModule, ModelRegistryRepository, TokenEstimator } from "src/modules/agent-framework";

import { CreditSystemController } from "./controllers/credit-system.controller";
import { CreditSystemService } from "./services/credit-system.service";
import { TokenTrackingService } from "./services/token-tracking.service";
import { CreditAllocationRepository } from "./repositories/credit-allocation.repository";
import { CreditTransactionRepository } from "./repositories/credit-transaction.repository";
import { CreditPricingTierRepository } from "./repositories/credit-pricing-tier.repository";
import { CreditReservationRepository } from "./repositories/credit-reservation.repository";
import { CreditUsageLogRepository } from "./repositories/credit-usage-log.repository";
import { AgentFrameworkAdapter } from "./utils/agent-framework-adapter";
import { FeatureFlagAdapter } from "./utils/feature-flag-adapter";

/**
 * Credit System Module for tracking, managing, and optimizing AI model usage
 */
@Module({
  imports: [
    AgentFrameworkModule,
  ],
  controllers: [
    CreditSystemController,
  ],
  providers: [
    // Core services
    CreditSystemService,
    TokenTrackingService,
    
    // Repositories
    CreditAllocationRepository,
    CreditTransactionRepository,
    CreditPricingTierRepository,
    CreditReservationRepository,
    CreditUsageLogRepository,
    
    // Adapters
    {
      provide: "AgentFrameworkDependencies",
      useClass: AgentFrameworkAdapter,
    },
    {
      provide: "FeatureFlagDependencies",
      useClass: FeatureFlagAdapter,
    },
    
    // External dependencies
    FirestoreConfigService,
    FeatureFlagService,
    ModelRegistryRepository,
    TokenEstimator,
  ],
  exports: [
    CreditSystemService,
    TokenTrackingService,
  ],
})
export class CreditSystemModule {}