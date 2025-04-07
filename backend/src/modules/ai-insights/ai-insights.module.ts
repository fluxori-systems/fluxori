import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Configuration
import { FirestoreConfigService } from '../../config/firestore.config';

// Controllers
import { InsightController } from './controllers/insight.controller';
import { AIModelConfigController } from './controllers/ai-model-config.controller';
import { InsightGenerationController } from './controllers/insight-generation.controller';

// Services
import { InsightService } from './services/insight.service';
import { AIModelConfigService } from './services/ai-model-config.service';
import { CreditSystemService } from './services/credit-system.service';
import { InsightGenerationService } from './services/insight-generation.service';

// Repositories
import { InsightRepository } from './repositories/insight.repository';
import { AIModelConfigRepository } from './repositories/ai-model-config.repository';

/**
 * AI Insights Module
 * 
 * Provides functionality for generating, managing, and accessing AI-driven insights.
 */
@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [
    InsightController,
    AIModelConfigController,
    InsightGenerationController,
  ],
  providers: [
    // Configuration
    FirestoreConfigService,
    
    // Repositories
    InsightRepository,
    AIModelConfigRepository,
    
    // Services
    InsightService,
    AIModelConfigService,
    CreditSystemService,
    InsightGenerationService,
  ],
  exports: [
    InsightService,
    AIModelConfigService,
    CreditSystemService,
    InsightGenerationService,
  ],
})
export class AIInsightsModule {}