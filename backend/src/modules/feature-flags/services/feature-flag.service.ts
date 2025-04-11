import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from "@nestjs/common";

import { Timestamp } from "@google-cloud/firestore";

import {
  FeatureFlag,
  FeatureFlagDTO,
  FlagEvaluationContext,
  FlagEvaluationResult,
  FeatureFlagToggleDTO,
  FeatureFlagAuditLog,
  FeatureFlagType,
  Environment,
  FlagSubscription,
  ScheduleConfig,
} from "../interfaces/types";
import { FeatureFlagAuditLogRepository } from "../repositories/feature-flag-audit-log.repository";
import { FeatureFlagRepository } from "../repositories/feature-flag.repository";

@Injectable()
export class FeatureFlagService implements OnModuleInit {
  private readonly logger = new Logger(FeatureFlagService.name);
  private flagCache: Map<string, FeatureFlag> = new Map();
  private subscriptions: Set<FlagSubscription> = new Set();
  private flagChangeListeners: Array<
    (flagKey: string, isEnabled: boolean) => void
  > = [];

  constructor(
    private readonly featureFlagRepository: FeatureFlagRepository,
    private readonly auditLogRepository: FeatureFlagAuditLogRepository,
  ) {}

  /**
   * Initialize service and load flags into cache
   */
  async onModuleInit() {
    this.logger.log("Initializing Feature Flag Service");
    await this.refreshCache();

    // Set up a periodic refresh of the cache
    setInterval(() => {
      this.refreshCache().catch((err) =>
        this.logger.error("Failed to refresh feature flag cache", err),
      );
    }, 60000); // Refresh every 60 seconds
  }

  /**
   * Refresh the flag cache
   */
  private async refreshCache(): Promise<void> {
    this.logger.debug("Refreshing feature flag cache");
    const flags = await this.featureFlagRepository.findAll();

    // Update the cache
    this.flagCache.clear();
    flags.forEach((flag) => {
      this.flagCache.set(flag.key, flag);
    });

    // Notify subscribers of any changes
    this.notifySubscribers();
  }

  /**
   * Create a new feature flag
   */
  async createFlag(
    flagDTO: FeatureFlagDTO,
    userId: string,
  ): Promise<FeatureFlag> {
    // Validate that the key is unique
    const existingFlag = await this.featureFlagRepository.findByKey(
      flagDTO.key,
    );
    if (existingFlag) {
      throw new BadRequestException(
        `Feature flag with key '${flagDTO.key}' already exists`,
      );
    }

    // Perform additional validation based on flag type
    this.validateFlagData(flagDTO);

    // Create the new flag
    const newFlag = await this.featureFlagRepository.create({
      ...flagDTO,
      lastModifiedBy: userId,
      lastModifiedAt: Timestamp.now(),
    });

    // Log the creation in the audit log
    await this.auditLogRepository.create({
      flagId: newFlag.id,
      flagKey: newFlag.key,
      action: "created",
      performedBy: userId,
      timestamp: Timestamp.now(),
      changes: [
        {
          field: "all",
          oldValue: null,
          newValue: newFlag,
        },
      ],
    });

    // Update the cache and notify subscribers
    this.flagCache.set(newFlag.key, newFlag);
    this.notifyFlagChange(newFlag.key, newFlag.enabled);

    return newFlag;
  }

  /**
   * Update an existing feature flag
   */
  async updateFlag(
    id: string,
    flagDTO: Partial<FeatureFlagDTO>,
    userId: string,
  ): Promise<FeatureFlag> {
    // Get the current flag
    const existingFlag = await this.featureFlagRepository.findById(id);
    if (!existingFlag) {
      throw new NotFoundException(`Feature flag with ID '${id}' not found`);
    }

    // Validate the update data
    if (flagDTO.type && flagDTO.type !== existingFlag.type) {
      this.validateFlagData({
        ...existingFlag,
        ...flagDTO,
      } as FeatureFlagDTO);
    }

    // Track changes for audit log
    const changes = [];
    for (const [key, value] of Object.entries(flagDTO)) {
      if (JSON.stringify(existingFlag[key]) !== JSON.stringify(value)) {
        changes.push({
          field: key,
          oldValue: existingFlag[key],
          newValue: value,
        });
      }
    }

    // Update the flag
    const updatedFlag = await this.featureFlagRepository.update(id, {
      ...flagDTO,
      lastModifiedBy: userId,
      lastModifiedAt: Timestamp.now(),
    });

    // Log the update in the audit log
    if (changes.length > 0) {
      await this.auditLogRepository.create({
        flagId: updatedFlag.id,
        flagKey: updatedFlag.key,
        action: "updated",
        performedBy: userId,
        timestamp: Timestamp.now(),
        changes,
      });
    }

    // Update the cache and notify subscribers
    this.flagCache.set(updatedFlag.key, updatedFlag);

    // If the enabled status changed, notify specifically about that
    if (
      flagDTO.enabled !== undefined &&
      flagDTO.enabled !== existingFlag.enabled
    ) {
      this.notifyFlagChange(updatedFlag.key, updatedFlag.enabled);
    }

    return updatedFlag;
  }

  /**
   * Toggle a feature flag on or off
   */
  async toggleFlag(
    id: string,
    toggleDTO: FeatureFlagToggleDTO,
    userId: string,
  ): Promise<FeatureFlag> {
    // Get the current flag
    const existingFlag = await this.featureFlagRepository.findById(id);
    if (!existingFlag) {
      throw new NotFoundException(`Feature flag with ID '${id}' not found`);
    }

    // Skip if the flag is already in the desired state
    if (existingFlag.enabled === toggleDTO.enabled) {
      return existingFlag;
    }

    // Update the flag
    const updatedFlag = await this.featureFlagRepository.toggleFlag(
      id,
      toggleDTO.enabled,
    );

    // Log the toggle in the audit log
    await this.auditLogRepository.create({
      flagId: updatedFlag.id,
      flagKey: updatedFlag.key,
      action: "toggled",
      performedBy: userId,
      timestamp: Timestamp.now(),
      changes: [
        {
          field: "enabled",
          oldValue: existingFlag.enabled,
          newValue: toggleDTO.enabled,
        },
      ],
    });

    // Update the cache and notify subscribers
    this.flagCache.set(updatedFlag.key, updatedFlag);
    this.notifyFlagChange(updatedFlag.key, updatedFlag.enabled);

    return updatedFlag;
  }

  /**
   * Delete a feature flag
   */
  async deleteFlag(id: string, userId: string): Promise<boolean> {
    // Get the current flag
    const existingFlag = await this.featureFlagRepository.findById(id);
    if (!existingFlag) {
      throw new NotFoundException(`Feature flag with ID '${id}' not found`);
    }

    // Delete the flag
    await this.featureFlagRepository.delete(id);

    // Log the deletion in the audit log
    await this.auditLogRepository.create({
      flagId: existingFlag.id,
      flagKey: existingFlag.key,
      action: "deleted",
      performedBy: userId,
      timestamp: Timestamp.now(),
      changes: [
        {
          field: "all",
          oldValue: existingFlag,
          newValue: null,
        },
      ],
    });

    // Update the cache and notify subscribers
    this.flagCache.delete(existingFlag.key);
    this.notifyFlagChange(existingFlag.key, false);

    return true;
  }

  /**
   * Get a feature flag by ID
   */
  async getFlagById(id: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagRepository.findById(id);
    if (!flag) {
      throw new NotFoundException(`Feature flag with ID '${id}' not found`);
    }
    return flag;
  }

  /**
   * Get a feature flag by key
   */
  async getFlagByKey(key: string): Promise<FeatureFlag> {
    // Try to get from cache first
    if (this.flagCache.has(key)) {
      const cachedFlag = this.flagCache.get(key);
      if (cachedFlag) {
        return cachedFlag;
      }
    }

    // Fallback to database lookup
    const flag = await this.featureFlagRepository.findByKey(key);
    if (!flag) {
      throw new NotFoundException(`Feature flag with key '${key}' not found`);
    }

    // Update cache with the retrieved flag
    this.flagCache.set(key, flag);

    return flag;
  }

  /**
   * List all feature flags, optionally filtered by environment
   */
  async getAllFlags(environment?: Environment): Promise<FeatureFlag[]> {
    if (environment) {
      return this.featureFlagRepository.findByEnvironment(environment);
    }
    return this.featureFlagRepository.findAll();
  }

  /**
   * Evaluate a feature flag based on context
   */
  async evaluateFlag(
    flagKey: string,
    context: FlagEvaluationContext,
  ): Promise<FlagEvaluationResult> {
    try {
      // Try to get from cache first
      let flag: FeatureFlag | null = null;
      if (this.flagCache.has(flagKey)) {
        const cachedFlag = this.flagCache.get(flagKey);
        if (cachedFlag) {
          flag = cachedFlag;
        }
      }

      // If not in cache, fetch from repository
      if (!flag) {
        flag = await this.featureFlagRepository.findByKey(flagKey);
        if (flag) {
          this.flagCache.set(flagKey, flag);
        }
      }

      // If flag doesn't exist, return default disabled result
      if (!flag) {
        return {
          flagKey,
          enabled: false,
          source: "error",
          timestamp: new Date(),
          reason: "Flag not found",
        };
      }

      // If flag is disabled, short-circuit the evaluation
      if (!flag.enabled) {
        return {
          flagKey,
          enabled: false,
          source: "evaluation",
          timestamp: new Date(),
          reason: "Flag is disabled",
        };
      }

      // Check environment restrictions
      if (
        flag.environments &&
        flag.environments.length > 0 &&
        context.environment
      ) {
        if (
          !flag.environments.includes(context.environment) &&
          !flag.environments.includes(Environment.ALL)
        ) {
          return {
            flagKey,
            enabled: flag.defaultValue,
            source: "default",
            timestamp: new Date(),
            reason: "Environment mismatch",
          };
        }
      }

      // Check schedule constraints
      if (flag.type === FeatureFlagType.SCHEDULED && flag.schedule) {
        const now = context.currentDate || new Date();

        // Check date range
        if (
          flag.schedule.startDate &&
          new Date(flag.schedule.startDate) > now
        ) {
          return {
            flagKey,
            enabled: flag.defaultValue,
            source: "default",
            timestamp: new Date(),
            reason: "Scheduled start date not reached",
          };
        }

        if (flag.schedule.endDate && new Date(flag.schedule.endDate) < now) {
          return {
            flagKey,
            enabled: flag.defaultValue,
            source: "default",
            timestamp: new Date(),
            reason: "Scheduled end date passed",
          };
        }

        // Check recurrence if specified
        if (flag.schedule.recurrence) {
          const isWithinRecurrence = this.checkRecurrenceSchedule(
            now,
            flag.schedule,
          );
          if (!isWithinRecurrence) {
            return {
              flagKey,
              enabled: flag.defaultValue,
              source: "default",
              timestamp: new Date(),
              reason: "Outside of scheduled recurrence window",
            };
          }
        }
      }

      // Evaluate based on flag type
      switch (flag.type) {
        case FeatureFlagType.BOOLEAN:
          // Simple boolean flag
          return {
            flagKey,
            enabled: true,
            source: "evaluation",
            timestamp: new Date(),
            reason: "Boolean flag enabled",
          };

        case FeatureFlagType.PERCENTAGE:
          // Percentage rollout
          if (!flag.percentage) {
            return {
              flagKey,
              enabled: flag.defaultValue,
              source: "default",
              timestamp: new Date(),
              reason: "Percentage not set",
            };
          }

          // Generate a deterministic hash based on flag key and user ID
          // This ensures that the same user always gets the same result
          let hashInput = flagKey;
          if (context.userId) {
            hashInput += context.userId;
          } else if (context.userEmail) {
            hashInput += context.userEmail;
          } else if (context.organizationId) {
            hashInput += context.organizationId;
          }

          const hash = this.hashString(hashInput);
          const normalizedHash = hash % 100; // Convert to 0-99 range

          const isEnabled = normalizedHash < flag.percentage;
          return {
            flagKey,
            enabled: isEnabled,
            source: "evaluation",
            timestamp: new Date(),
            reason: `Percentage rollout: ${normalizedHash}% (threshold: ${flag.percentage}%)`,
          };

        case FeatureFlagType.USER_TARGETED:
          // User targeting
          if (!flag.userTargeting) {
            return {
              flagKey,
              enabled: flag.defaultValue,
              source: "default",
              timestamp: new Date(),
              reason: "User targeting not configured",
            };
          }

          let isUserTargeted = false;
          const { userIds, userRoles, userEmails } = flag.userTargeting;

          // Check user ID targeting
          if (context.userId && userIds && userIds.includes(context.userId)) {
            isUserTargeted = true;
          }

          // Check role targeting
          if (
            context.userRole &&
            userRoles &&
            userRoles.includes(context.userRole)
          ) {
            isUserTargeted = true;
          }

          // Check email targeting
          if (
            context.userEmail &&
            userEmails &&
            userEmails.includes(context.userEmail)
          ) {
            isUserTargeted = true;
          }

          return {
            flagKey,
            enabled: isUserTargeted,
            source: "evaluation",
            timestamp: new Date(),
            reason: isUserTargeted
              ? "User is in target group"
              : "User is not in target group",
          };

        case FeatureFlagType.ORGANIZATION_TARGETED:
          // Organization targeting
          if (!flag.organizationTargeting) {
            return {
              flagKey,
              enabled: flag.defaultValue,
              source: "default",
              timestamp: new Date(),
              reason: "Organization targeting not configured",
            };
          }

          let isOrgTargeted = false;
          const { organizationIds, organizationTypes } =
            flag.organizationTargeting;

          // Check organization ID targeting
          if (
            context.organizationId &&
            organizationIds &&
            organizationIds.includes(context.organizationId)
          ) {
            isOrgTargeted = true;
          }

          // Check organization type targeting
          if (
            context.organizationType &&
            organizationTypes &&
            organizationTypes.includes(context.organizationType)
          ) {
            isOrgTargeted = true;
          }

          return {
            flagKey,
            enabled: isOrgTargeted,
            source: "evaluation",
            timestamp: new Date(),
            reason: isOrgTargeted
              ? "Organization is in target group"
              : "Organization is not in target group",
          };

        default:
          return {
            flagKey,
            enabled: flag.defaultValue,
            source: "default",
            timestamp: new Date(),
            reason: `Unknown flag type: ${flag.type}`,
          };
      }
    } catch (error) {
      this.logger.error(`Error evaluating flag ${flagKey}:`, error);
      return {
        flagKey,
        enabled: false, // Safe default
        source: "error",
        timestamp: new Date(),
        reason: `Evaluation error: ${error.message}`,
      };
    }
  }

  /**
   * Check if a feature flag is enabled for the given context
   */
  async isEnabled(
    flagKey: string,
    context: FlagEvaluationContext,
  ): Promise<boolean> {
    try {
      const result = await this.evaluateFlag(flagKey, context);
      return result.enabled;
    } catch (error) {
      this.logger.error(`Error checking if flag ${flagKey} is enabled:`, error);
      return false; // Safe default
    }
  }

  /**
   * Get flag audit logs
   */
  async getAuditLogs(flagId: string): Promise<FeatureFlagAuditLog[]> {
    return this.auditLogRepository.findByFlagId(flagId);
  }

  /**
   * Subscribe to flag changes
   */
  addFlagChangeListener(
    callback: (flagKey: string, isEnabled: boolean) => void,
  ): void {
    this.flagChangeListeners.push(callback);
  }

  /**
   * Remove a flag change subscription
   */
  removeFlagChangeListener(
    callback: (flagKey: string, isEnabled: boolean) => void,
  ): void {
    const index = this.flagChangeListeners.indexOf(callback);
    if (index !== -1) {
      this.flagChangeListeners.splice(index, 1);
    }
  }

  /**
   * Subscribe to multiple flag changes at once
   */
  subscribe(subscription: FlagSubscription): () => void {
    this.subscriptions.add(subscription);

    // Immediately evaluate the flags for this subscription
    this.evaluateFlagsForSubscription(subscription);

    // Return an unsubscribe function
    return () => {
      this.subscriptions.delete(subscription);
    };
  }

  /**
   * Validate flag data based on its type
   */
  private validateFlagData(flagDTO: FeatureFlagDTO): void {
    // Validate key format (lowercase, alphanumeric with hyphens)
    if (!/^[a-z0-9-]+$/.test(flagDTO.key)) {
      throw new BadRequestException(
        "Flag key must be lowercase alphanumeric with hyphens only",
      );
    }

    // Type-specific validation
    switch (flagDTO.type) {
      case FeatureFlagType.PERCENTAGE:
        if (
          flagDTO.percentage === undefined ||
          flagDTO.percentage < 0 ||
          flagDTO.percentage > 100
        ) {
          throw new BadRequestException(
            "Percentage flags require a percentage value between 0-100",
          );
        }
        break;

      case FeatureFlagType.USER_TARGETED:
        if (
          !flagDTO.userTargeting ||
          (!flagDTO.userTargeting.userIds &&
            !flagDTO.userTargeting.userRoles &&
            !flagDTO.userTargeting.userEmails)
        ) {
          throw new BadRequestException(
            "User-targeted flags require user targeting configuration",
          );
        }
        break;

      case FeatureFlagType.ORGANIZATION_TARGETED:
        if (
          !flagDTO.organizationTargeting ||
          (!flagDTO.organizationTargeting.organizationIds &&
            !flagDTO.organizationTargeting.organizationTypes)
        ) {
          throw new BadRequestException(
            "Organization-targeted flags require organization targeting configuration",
          );
        }
        break;

      case FeatureFlagType.SCHEDULED:
        if (
          !flagDTO.schedule ||
          (!flagDTO.schedule.startDate &&
            !flagDTO.schedule.endDate &&
            !flagDTO.schedule.recurrence)
        ) {
          throw new BadRequestException(
            "Scheduled flags require schedule configuration",
          );
        }
        break;
    }
  }

  /**
   * Check if current time is within a recurrence schedule
   */
  private checkRecurrenceSchedule(
    now: Date,
    schedule: ScheduleConfig,
  ): boolean {
    if (!schedule.recurrence) return true;

    // For 'once' type, we only need to check the date range, which is already done
    if (schedule.recurrence.type === "once") return true;

    // Check day of week for weekly recurrence
    if (
      schedule.recurrence.type === "weekly" &&
      schedule.recurrence.daysOfWeek &&
      schedule.recurrence.daysOfWeek.length > 0
    ) {
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
      if (!schedule.recurrence.daysOfWeek.includes(currentDay)) {
        return false;
      }
    }

    // Check time ranges if specified
    if (
      schedule.recurrence.timeRanges &&
      schedule.recurrence.timeRanges.length > 0
    ) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      // Check if the current time falls within any of the time ranges
      return schedule.recurrence.timeRanges.some((range) => {
        const [startHour, startMinute] = range.startTime.split(":").map(Number);
        const [endHour, endMinute] = range.endTime.split(":").map(Number);

        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;

        return (
          currentTimeMinutes >= startTimeMinutes &&
          currentTimeMinutes <= endTimeMinutes
        );
      });
    }

    return true;
  }

  /**
   * Hash a string to a number (for percentage-based flags)
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Notify listeners about a flag change
   */
  private notifyFlagChange(flagKey: string, isEnabled: boolean): void {
    // Notify specific flag listeners
    this.flagChangeListeners.forEach((listener) => {
      try {
        listener(flagKey, isEnabled);
      } catch (error) {
        this.logger.error("Error in flag change listener:", error);
      }
    });

    // Notify subscriptions
    this.notifySubscribers();
  }

  /**
   * Notify all subscriptions about their relevant flags
   */
  private notifySubscribers(): void {
    Array.from(this.subscriptions).forEach((subscription) => {
      this.evaluateFlagsForSubscription(subscription);
    });
  }

  /**
   * Evaluate all flags for a specific subscription
   */
  private async evaluateFlagsForSubscription(
    subscription: FlagSubscription,
  ): Promise<void> {
    try {
      const result: Record<string, boolean> = {};

      // Evaluate each flag in the subscription
      for (const flagKey of subscription.flagKeys) {
        const evaluation = await this.evaluateFlag(
          flagKey,
          subscription.evaluationContext || {},
        );
        result[flagKey] = evaluation.enabled;
      }

      // Notify the subscriber
      subscription.callback(result);
    } catch (error) {
      this.logger.error("Error evaluating flags for subscription:", error);
    }
  }
}
