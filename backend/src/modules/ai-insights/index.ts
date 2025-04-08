/**
 * AI Insights Module Public API
 * 
 * This file defines the public interface of the AI Insights module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Re-export module
export { AIInsightsModule } from './ai-insights.module';

// Re-export primary services
export { AIModelConfigService } from './services/ai-model-config.service';
export { CreditSystemService } from './services/credit-system.service';
export { InsightGenerationService } from './services/insight-generation.service';
export { InsightService } from './services/insight.service';

// Re-export repositories
export { AIModelConfigRepository } from './repositories/ai-model-config.repository';
export { InsightRepository } from './repositories/insight.repository';

// Re-export models/schemas
export { AIModelConfig } from './models/ai-model-config.schema';
export { Insight } from './models/insight.schema';

// Re-export interfaces and types
export * from './interfaces/types';
// Export only specific non-overlapping types from dependencies
export { IAIModelConfigDocument } from './interfaces/dependencies';
export * from './interfaces/firestore-types';