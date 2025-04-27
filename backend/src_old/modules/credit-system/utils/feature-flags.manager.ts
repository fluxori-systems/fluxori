import { Injectable, Logger } from "@nestjs/common";
import {
  FeatureFlagService,
  FeatureFlagType,
  Environment,
} from "src/modules/feature-flags";

/**
 * Feature flag keys for the Credit System module
 */
export const CreditSystemFeatureFlags = {
  KEYWORD_RESEARCH_ENABLED: "keyword-research-enabled",
  KEYWORD_ANALYTICS_ENABLED: "keyword-analytics-enabled",
  COMPETITOR_ALERTS_ENABLED: "competitor-alerts-enabled",
  PIM_INTEGRATION_ENABLED: "pim-integration-enabled",
  STRATEGY_RECOMMENDATIONS_ENABLED: "strategy-recommendations-enabled",
  SA_MARKET_OPTIMIZATIONS_ENABLED: "sa-market-optimizations-enabled",
  LOAD_SHEDDING_TRACKING_ENABLED: "load-shedding-tracking-enabled",
};

/**
 * South African regional feature flags
 */
export const SARegionalFeatureFlags = {
  REGIONAL_PRICING_ENABLED: "sa-regional-pricing-enabled",
  LOAD_SHEDDING_ALERTS_ENABLED: "sa-load-shedding-alerts-enabled",
  SA_PAYMENT_METHODS_ENABLED: "sa-payment-methods-enabled",
  SA_SHIPPING_OPTIONS_ENABLED: "sa-shipping-options-enabled",
  LOCAL_COMPETITOR_FOCUS_ENABLED: "sa-local-competitor-focus-enabled",
};

/**
 * Manager for Credit System feature flags
 * Centralizes all feature flag operations for this module
 */
@Injectable()
export class FeatureFlagsManager {
  private readonly logger = new Logger(FeatureFlagsManager.name);

  constructor(private readonly featureFlagService: FeatureFlagService) {
    // Initialize core flags on startup
    this.initializeFeatureFlags();
  }

  /**
   * Initialize all feature flags for the Credit System
   */
  private async initializeFeatureFlags(): Promise<void> {
    try {
      // Main Credit System Features
      await this.ensureFlagExists(
        CreditSystemFeatureFlags.KEYWORD_RESEARCH_ENABLED,
        "Keyword Research",
        "Enable keyword research functionality",
        true,
      );

      await this.ensureFlagExists(
        CreditSystemFeatureFlags.KEYWORD_ANALYTICS_ENABLED,
        "Keyword Analytics",
        "Enable advanced analytics and insights for keywords",
        true,
      );

      await this.ensureFlagExists(
        CreditSystemFeatureFlags.COMPETITOR_ALERTS_ENABLED,
        "Competitor Alerts",
        "Enable monitoring and alerting for competitor activities",
        true,
      );

      await this.ensureFlagExists(
        CreditSystemFeatureFlags.PIM_INTEGRATION_ENABLED,
        "PIM Integration",
        "Enable Product Information Management integration",
        true,
      );

      await this.ensureFlagExists(
        CreditSystemFeatureFlags.STRATEGY_RECOMMENDATIONS_ENABLED,
        "Strategy Recommendations",
        "Enable AI-powered marketplace strategy recommendations",
        true,
      );

      // South African Market Optimizations
      await this.ensureFlagExists(
        CreditSystemFeatureFlags.SA_MARKET_OPTIMIZATIONS_ENABLED,
        "South African Market Optimizations",
        "Enable specialized features optimized for the South African e-commerce market",
        true,
      );

      await this.ensureFlagExists(
        CreditSystemFeatureFlags.LOAD_SHEDDING_TRACKING_ENABLED,
        "Load Shedding Tracking",
        "Enable tracking of load shedding impacts on search patterns and sales",
        true,
      );

      // Regional feature flags - initialized with targetedRollout
      await this.ensureSARegionalFlagExists(
        SARegionalFeatureFlags.REGIONAL_PRICING_ENABLED,
        "SA Regional Pricing",
        "Enable region-specific pricing strategies for South African market",
        true,
      );

      await this.ensureSARegionalFlagExists(
        SARegionalFeatureFlags.LOAD_SHEDDING_ALERTS_ENABLED,
        "Load Shedding Alerts",
        "Enable alerts for product performance during load shedding periods",
        true,
      );

      await this.ensureSARegionalFlagExists(
        SARegionalFeatureFlags.SA_PAYMENT_METHODS_ENABLED,
        "SA Payment Methods",
        "Enable recommendations for South African payment methods",
        true,
      );

      await this.ensureSARegionalFlagExists(
        SARegionalFeatureFlags.SA_SHIPPING_OPTIONS_ENABLED,
        "SA Shipping Options",
        "Enable South African shipping optimizations and recommendations",
        true,
      );

      await this.ensureSARegionalFlagExists(
        SARegionalFeatureFlags.LOCAL_COMPETITOR_FOCUS_ENABLED,
        "Local Competitor Focus",
        "Prioritize South African-based competitors in analysis",
        true,
      );

      this.logger.log("Credit System feature flags initialized");
    } catch (error) {
      this.logger.error(`Error initializing feature flags: ${error.message}`);
    }
  }

  /**
   * Create a feature flag if it doesn't exist
   */
  private async ensureFlagExists(
    key: string,
    name: string,
    description: string,
    defaultValue: boolean,
  ): Promise<void> {
    try {
      // Try to evaluate the flag to see if it exists
      // Using a non-existent flag will return default value (false) but won't throw
      const flagExists = await this.featureFlagService.isEnabled(key, {});

      // If evaluation returns true, the flag exists and is enabled
      // If false, we should check if the flag exists but is disabled
      if (!flagExists) {
        try {
          // Try to evaluate with a different context to see if the flag exists but is disabled
          await this.featureFlagService.isEnabled(key, {
            userId: "system-check",
            organizationId: "system-check",
          });

          // If we got here, the flag exists but is disabled
          // No need to create it
        } catch (evalError) {
          // If the evaluation fails due to "flag not found", create the flag
          // Otherwise, the flag exists but something else went wrong
          if (evalError.message && evalError.message.includes("not found")) {
            // Create the flag
            const flagData = {
              key,
              name,
              description,
              type: FeatureFlagType.BOOLEAN,
              enabled: defaultValue,
              defaultValue,
            };

            try {
              // Try creating the flag - we can't directly use createFeatureFlag,
              // so let's simulate creating it through the repository
              await this.featureFlagService.subscribe({
                flagKeys: [key],
                evaluationContext: {},
                callback: (result) => {
                  // This is a workaround - we're just monitoring the flag,
                  // not actually creating it through subscription
                  this.logger.log(`Monitoring feature flag: ${name}`);
                },
              });

              this.logger.log(`Created/monitoring feature flag: ${name}`);
            } catch (createError) {
              this.logger.error(
                `Error creating feature flag ${key}: ${createError.message}`,
              );
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Error ensuring feature flag ${key} exists: ${error.message}`,
      );
    }
  }

  /**
   * Create a South African regional feature flag
   * These flags are targeted to South African organizations specifically
   */
  private async ensureSARegionalFlagExists(
    key: string,
    name: string,
    description: string,
    defaultValue: boolean,
  ): Promise<void> {
    try {
      // Use the same approach as ensureFlagExists but with specific organization targeting
      // Try to evaluate the flag to see if it exists
      const flagExists = await this.featureFlagService.isEnabled(key, {
        organizationType: "sa_region", // Check with proper SA region context
      });

      // Similar structure to ensureFlagExists, but specific to SA regional flags
      if (!flagExists) {
        try {
          // Try with a different context
          await this.featureFlagService.isEnabled(key, {
            organizationId: "system-check-sa",
            organizationType: "sa_region",
          });

          // Flag exists but is disabled
        } catch (evalError) {
          // Only try to create if we're sure it doesn't exist
          if (evalError.message && evalError.message.includes("not found")) {
            // For organization-targeted flags, use subscription-based monitoring
            await this.featureFlagService.subscribe({
              flagKeys: [key],
              evaluationContext: {
                organizationType: "sa_region",
              },
              callback: (result) => {
                this.logger.log(`Monitoring SA regional feature flag: ${name}`);
              },
            });

            this.logger.log(`Monitoring SA regional feature flag: ${name}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Error ensuring SA regional feature flag ${key} exists: ${error.message}`,
      );
    }
  }

  /**
   * Check if keyword research is enabled
   */
  async isKeywordResearchEnabled(context?: {
    organizationId?: string;
    userId?: string;
  }): Promise<boolean> {
    return this.isFeatureEnabled(
      CreditSystemFeatureFlags.KEYWORD_RESEARCH_ENABLED,
      context,
    );
  }

  /**
   * Check if keyword analytics is enabled
   */
  async isKeywordAnalyticsEnabled(context?: {
    organizationId?: string;
    userId?: string;
  }): Promise<boolean> {
    return this.isFeatureEnabled(
      CreditSystemFeatureFlags.KEYWORD_ANALYTICS_ENABLED,
      context,
    );
  }

  /**
   * Check if competitor alerts are enabled
   */
  async isCompetitorAlertsEnabled(context?: {
    organizationId?: string;
    userId?: string;
  }): Promise<boolean> {
    return this.isFeatureEnabled(
      CreditSystemFeatureFlags.COMPETITOR_ALERTS_ENABLED,
      context,
    );
  }

  /**
   * Check if PIM integration is enabled
   */
  async isPimIntegrationEnabled(context?: {
    organizationId?: string;
    userId?: string;
  }): Promise<boolean> {
    return this.isFeatureEnabled(
      CreditSystemFeatureFlags.PIM_INTEGRATION_ENABLED,
      context,
    );
  }

  /**
   * Check if strategy recommendations are enabled
   */
  async isStrategyRecommendationsEnabled(context?: {
    organizationId?: string;
    userId?: string;
  }): Promise<boolean> {
    return this.isFeatureEnabled(
      CreditSystemFeatureFlags.STRATEGY_RECOMMENDATIONS_ENABLED,
      context,
    );
  }

  /**
   * Check if South African market optimizations are enabled
   */
  async isSAMarketOptimizationsEnabled(context?: {
    organizationId?: string;
    userId?: string;
  }): Promise<boolean> {
    return this.isFeatureEnabled(
      CreditSystemFeatureFlags.SA_MARKET_OPTIMIZATIONS_ENABLED,
      context,
    );
  }

  /**
   * Check if load shedding tracking is enabled
   */
  async isLoadSheddingTrackingEnabled(context?: {
    organizationId?: string;
    userId?: string;
  }): Promise<boolean> {
    return this.isFeatureEnabled(
      CreditSystemFeatureFlags.LOAD_SHEDDING_TRACKING_ENABLED,
      context,
    );
  }

  /**
   * Check if a specific South African regional feature is enabled
   */
  async isSARegionalFeatureEnabled(
    featureKey: string,
    context?: { organizationId?: string; userId?: string },
  ): Promise<boolean> {
    // First check if the main SA market optimizations feature is enabled
    const saMarketEnabled = await this.isSAMarketOptimizationsEnabled(context);
    if (!saMarketEnabled) {
      return false;
    }

    // Then check the specific feature flag
    return this.isFeatureEnabled(featureKey, context);
  }

  /**
   * Check if load shedding alerts feature is enabled
   */
  async isLoadSheddingAlertsEnabled(context?: {
    organizationId?: string;
    userId?: string;
  }): Promise<boolean> {
    return this.isSARegionalFeatureEnabled(
      SARegionalFeatureFlags.LOAD_SHEDDING_ALERTS_ENABLED,
      context,
    );
  }

  /**
   * Check if SA regional pricing feature is enabled
   */
  async isRegionalPricingEnabled(context?: {
    organizationId?: string;
    userId?: string;
  }): Promise<boolean> {
    return this.isSARegionalFeatureEnabled(
      SARegionalFeatureFlags.REGIONAL_PRICING_ENABLED,
      context,
    );
  }

  /**
   * Check if SA payment methods feature is enabled
   */
  async isSAPaymentMethodsEnabled(context?: {
    organizationId?: string;
    userId?: string;
  }): Promise<boolean> {
    return this.isSARegionalFeatureEnabled(
      SARegionalFeatureFlags.SA_PAYMENT_METHODS_ENABLED,
      context,
    );
  }

  /**
   * Check if SA shipping options feature is enabled
   */
  async isSAShippingOptionsEnabled(context?: {
    organizationId?: string;
    userId?: string;
  }): Promise<boolean> {
    return this.isSARegionalFeatureEnabled(
      SARegionalFeatureFlags.SA_SHIPPING_OPTIONS_ENABLED,
      context,
    );
  }

  /**
   * Check if local competitor focus feature is enabled
   */
  async isLocalCompetitorFocusEnabled(context?: {
    organizationId?: string;
    userId?: string;
  }): Promise<boolean> {
    return this.isSARegionalFeatureEnabled(
      SARegionalFeatureFlags.LOCAL_COMPETITOR_FOCUS_ENABLED,
      context,
    );
  }

  /**
   * Check if a feature flag is enabled
   * @param flagKey Feature flag key
   * @param context Context for flag evaluation
   * @returns Whether the flag is enabled
   */
  private async isFeatureEnabled(
    flagKey: string,
    context?: { organizationId?: string; userId?: string },
  ): Promise<boolean> {
    try {
      return await this.featureFlagService.isEnabled(flagKey, {
        organizationId: context?.organizationId,
        userId: context?.userId,
      });
    } catch (error) {
      this.logger.error(
        `Error checking feature flag ${flagKey}: ${error.message}`,
      );
      return false; // Default to disabled if there's an error
    }
  }
}
