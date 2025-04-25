import { Injectable, Logger } from '@nestjs/common';

import { AIModelConfigService } from './ai-model-config.service';
import { CreditSystemService } from './credit-system.service';
import { InsightService } from './insight.service';
import {
  InsightType,
  InsightSeverity,
  CreateInsightDto,
  AIAnalysisResult,
  AIModelConfig,
} from '../interfaces/types';

/**
 * Request for generating insights
 */
export interface GenerateInsightsRequest {
  organizationId: string;
  userId: string;
  dataType: 'inventory' | 'sales' | 'marketplaces' | 'competitors';
  data: Record<string, any>;
  options?: {
    modelProvider?: string;
    modelName?: string;
    minConfidence?: number;
  };
}

/**
 * Service for generating insights from data using AI
 */
@Injectable()
export class InsightGenerationService {
  private readonly logger = new Logger(InsightGenerationService.name);

  constructor(
    private readonly insightService: InsightService,
    private readonly modelConfigService: AIModelConfigService,
    private readonly creditService: CreditSystemService,
  ) {}

  /**
   * Generate insights from data
   * @param request Generation request
   * @returns Generated insights
   */
  async generateInsights(
    request: GenerateInsightsRequest,
  ): Promise<AIAnalysisResult> {
    this.logger.log(
      `Generating insights from ${request.dataType} data for organization ${request.organizationId}`,
    );

    // Get AI model configuration
    const modelConfig = await this.getModelConfig(
      request.organizationId,
      request.options?.modelProvider,
      request.options?.modelName,
    );

    // Check credit balance
    const balance = await this.creditService.getBalance(request.organizationId);

    // Estimate cost
    const estimatedCost = this.estimateCost(modelConfig, request.data);

    if (balance < estimatedCost) {
      throw new Error(
        `Insufficient credits. Required: ${estimatedCost}, Available: ${balance}`,
      );
    }

    // Start processing timer
    const startTime = Date.now();

    try {
      // Process data with AI - example implementation
      const result = await this.processWithAI(
        modelConfig,
        request.dataType,
        request.data,
      );

      // Record processing time
      const processingTime = Date.now() - startTime;

      // Calculate actual cost
      const actualCost = this.calculateActualCost(
        modelConfig,
        result.metadata.tokensUsed,
        processingTime,
      );

      // Deduct credits
      await this.creditService.useCredits({
        organizationId: request.organizationId,
        userId: request.userId,
        amount: actualCost,
        description: `AI analysis of ${request.dataType} data`,
        metadata: {
          modelProvider: modelConfig.modelProvider,
          modelName: modelConfig.modelName,
          processingTime,
          tokensUsed: result.metadata.tokensUsed,
        },
      });

      // Filter low confidence insights if requested
      let filteredInsights = result.insights;
      if (request.options?.minConfidence !== undefined) {
        const minConfidence = request.options.minConfidence;
        filteredInsights = result.insights.filter(
          (insight) => insight.confidence >= minConfidence,
        );
      }

      // Save insights to database
      const savedInsights = [];
      for (const insightData of filteredInsights) {
        const insight = await this.insightService.createInsight(insightData);
        savedInsights.push(insight);
      }

      return {
        insights: filteredInsights,
        metadata: {
          ...result.metadata,
          processingTime,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error generating insights: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to generate insights: ${error.message}`);
    }
  }

  /**
   * Get the appropriate model configuration
   * @param organizationId Organization ID
   * @param providerName Optional provider name
   * @param modelName Optional model name
   * @returns Model configuration
   */
  private async getModelConfig(
    organizationId: string,
    providerName?: string,
    modelName?: string,
  ): Promise<AIModelConfig> {
    // If specific provider and model are requested, find matching config
    if (providerName && modelName) {
      const configs =
        await this.modelConfigService.findByOrganization(organizationId);

      const matchingConfig = configs.find(
        (config) =>
          config.modelProvider === providerName &&
          config.modelName === modelName &&
          config.isEnabled,
      );

      if (matchingConfig) {
        return matchingConfig;
      }
    }

    // Fall back to default config
    const defaultConfig =
      await this.modelConfigService.findDefaultConfig(organizationId);

    if (!defaultConfig) {
      throw new Error(
        `No AI model configuration found for organization ${organizationId}`,
      );
    }

    return defaultConfig;
  }

  /**
   * Process data with AI model
   * @param modelConfig Model configuration
   * @param dataType Type of data
   * @param data Data to analyze
   * @returns AI analysis result
   */
  private async processWithAI(
    modelConfig: AIModelConfig,
    dataType: string,
    data: Record<string, any>,
  ): Promise<AIAnalysisResult> {
    // This is a placeholder for the actual AI processing implementation
    // In a real implementation, this would use an API client for the specified model provider

    this.logger.log(
      `Processing with ${modelConfig.modelProvider}/${modelConfig.modelName}`,
    );

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Example response with mock insights
    const organizationId = data.organizationId || 'unknown';
    const mockInsights: CreateInsightDto[] = [];

    // Generate mock insights based on data type
    if (dataType === 'inventory') {
      // Example inventory insight
      mockInsights.push({
        organizationId,
        type: InsightType.INVENTORY_ALERT,
        title: 'Low stock alert for high-demand products',
        description:
          'Several products with high sales velocity are approaching low stock levels.',
        severity: InsightSeverity.HIGH,
        confidence: 0.87,
        data: {
          affectedProducts: [
            {
              id: 'product-1',
              name: 'Product 1',
              stock: 5,
              salesVelocity: 2.3,
            },
            {
              id: 'product-2',
              name: 'Product 2',
              stock: 8,
              salesVelocity: 1.8,
            },
          ],
          recommendation:
            'Restock these items within 3 days to avoid stockouts',
        },
      });
    } else if (dataType === 'sales') {
      // Example sales insight
      mockInsights.push({
        organizationId,
        type: InsightType.SALES_TREND,
        title: 'Significant increase in category performance',
        description:
          'Electronics category has shown 32% growth over the last 30 days.',
        severity: InsightSeverity.MEDIUM,
        confidence: 0.92,
        data: {
          category: 'Electronics',
          previousPeriod: { revenue: 24500, units: 126 },
          currentPeriod: { revenue: 32340, units: 165 },
          growthRate: 0.32,
          topProducts: ['product-5', 'product-12', 'product-8'],
        },
      });
    } else if (dataType === 'marketplaces') {
      // Example marketplace insight
      mockInsights.push({
        organizationId,
        type: InsightType.MARKET_OPPORTUNITY,
        title: 'New marketplace opportunity detected',
        description:
          'Your top 5 products have high potential on Marketplace X based on competitive analysis.',
        severity: InsightSeverity.MEDIUM,
        confidence: 0.78,
        data: {
          marketplace: 'Marketplace X',
          potentialRevenue: 45000,
          competitiveAdvantage: 'Lower price point and faster shipping',
          recommendedProducts: [
            'product-3',
            'product-7',
            'product-9',
            'product-11',
            'product-15',
          ],
        },
      });
    } else if (dataType === 'competitors') {
      // Example competitor insight
      mockInsights.push({
        organizationId,
        type: InsightType.COMPETITOR_CHANGE,
        title: 'Competitor price reduction detected',
        description:
          'Main competitor has reduced prices across 15 comparable products by an average of 12%.',
        severity: InsightSeverity.HIGH,
        confidence: 0.85,
        data: {
          competitor: 'Competitor A',
          averagePriceReduction: 0.12,
          affectedProducts: [
            { id: 'product-4', yourPrice: 49.99, newCompetitorPrice: 42.99 },
            { id: 'product-6', yourPrice: 89.99, newCompetitorPrice: 79.99 },
            // More products would be listed here
          ],
          recommendation: 'Review pricing strategy for affected products',
        },
      });
    }

    // Return mock result
    return {
      insights: mockInsights,
      metadata: {
        modelUsed: `${modelConfig.modelProvider}/${modelConfig.modelName}`,
        processingTime: 1253, // milliseconds
        tokensUsed: 1420,
      },
    };
  }

  /**
   * Estimate cost for processing
   * @param modelConfig Model configuration
   * @param data Data to process
   * @returns Estimated cost in credits
   */
  private estimateCost(
    modelConfig: AIModelConfig,
    data: Record<string, any>,
  ): number {
    // Simplified estimation based on data size
    const dataString = JSON.stringify(data);

    // Rough token estimation (1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(dataString.length / 4);

    // Estimate output tokens (usually smaller than input)
    const estimatedOutputTokens = Math.ceil(estimatedTokens * 0.3);

    return this.creditService.calculateCost(
      modelConfig.modelName,
      estimatedTokens,
      estimatedOutputTokens,
    );
  }

  /**
   * Calculate actual cost based on tokens used
   * @param modelConfig Model configuration
   * @param tokensUsed Tokens used in processing
   * @param processingTime Processing time in milliseconds
   * @returns Actual cost in credits
   */
  private calculateActualCost(
    modelConfig: AIModelConfig,
    tokensUsed: number,
    processingTime: number,
  ): number {
    // Base cost from token usage
    const tokenCost = this.creditService.calculateCost(
      modelConfig.modelName,
      tokensUsed,
      0,
    );

    // Add cost based on processing time for expensive models
    let processingCost = 0;
    if (modelConfig.modelName.includes('gpt-4')) {
      // Add 1 credit per second of processing for GPT-4
      processingCost = Math.ceil(processingTime / 1000);
    }

    return Math.max(1, tokenCost + processingCost);
  }
}
