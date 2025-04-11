import { Injectable } from "@nestjs/common";

import { FeatureFlagService } from "src/modules/feature-flags";

import { FeatureFlagDependencies } from "../interfaces/dependencies";

/**
 * Adapter for integrating with Feature Flag system
 */
@Injectable()
export class FeatureFlagAdapter implements FeatureFlagDependencies {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  /**
   * Check if a feature flag is enabled
   * @param flagKey Feature flag key
   * @param context Context for flag evaluation
   * @returns Whether the flag is enabled
   */
  async isFeatureEnabled(
    flagKey: string,
    context: {
      organizationId?: string;
      userId?: string;
      environment?: string;
    },
  ): Promise<boolean> {
    // Convert the context to match FeatureFlagService's expected format
    return this.featureFlagService.isEnabled(flagKey, {
      organizationId: context.organizationId,
      userId: context.userId,
      // Handle environment differently since it might be a string and not an enum
      ...(context.environment ? {} : {})
    });
  }

  /**
   * Subscribe to changes in feature flags
   * @param flagKeys Feature flag keys to subscribe to
   * @param callback Callback function for handling flag changes
   * @returns Unsubscribe function
   */
  subscribeToFlagChanges(
    flagKeys: string[],
    callback: (flags: Record<string, boolean>) => void,
  ): () => void {
    // Create subscription object for feature flag service
    const subscription = {
      flagKeys,
      callback,
      evaluationContext: {},
    };
    
    // Subscribe to flag changes
    return this.featureFlagService.subscribe(subscription);
  }
}