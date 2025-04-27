import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

import { FirestoreConfigService } from "src/config/firestore.config";

import { FirestoreBaseRepository } from "src/common/repositories";

import { FeatureFlag, FeatureFlagType, Environment } from "../interfaces/types";

/**
 * Repository for managing feature flags
 */
@Injectable()
export class FeatureFlagRepository
  extends FirestoreBaseRepository<FeatureFlag>
  implements OnModuleInit
{
  protected readonly logger = new Logger(FeatureFlagRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "feature_flags", {
      enableCache: true,
      cacheTTLMs: 60000, // 1 minute cache TTL for feature flags
      useSoftDeletes: true,
    });
  }

  /**
   * Initialize the repository when the module loads
   */
  onModuleInit(): void {
    this.logger.log("FeatureFlagRepository initialized");
  }

  /**
   * Find a feature flag by its key
   * @param key The unique feature flag key
   * @returns The feature flag or null if not found
   */
  async findByKey(key: string): Promise<FeatureFlag | null> {
    const results = await this.find({
      advancedFilters: [{ field: "key", operator: "==", value: key }],
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all feature flags for a specific environment
   * @param environment The target environment
   * @returns List of feature flags for the environment
   */
  async findByEnvironment(environment: Environment): Promise<FeatureFlag[]> {
    // Find flags specific to this environment or marked as 'all'
    return this.find({
      advancedFilters: [
        {
          field: "environments",
          operator: "array-contains-any",
          value: [environment, Environment.ALL],
        },
      ],
    });
  }

  /**
   * Find all feature flags by type
   * @param type The feature flag type
   * @returns List of feature flags of the specified type
   */
  async findByType(type: FeatureFlagType): Promise<FeatureFlag[]> {
    return this.find({
      advancedFilters: [{ field: "type", operator: "==", value: type }],
    });
  }

  /**
   * Find all feature flags by tag
   * @param tag The tag to search for
   * @returns List of feature flags with the specified tag
   */
  async findByTag(tag: string): Promise<FeatureFlag[]> {
    // In a real implementation, we would use a more sophisticated query
    // that checks array membership. This is a simplified approach.
    const allFlags = await this.findAll();
    return allFlags.filter((flag) => flag.tags && flag.tags.includes(tag));
  }

  /**
   * Find feature flags for a specific organization
   * @param organizationId The organization ID
   * @returns List of feature flags targeted to this organization
   */
  async findByOrganization(organizationId: string): Promise<FeatureFlag[]> {
    // Retrieve all flags that might be relevant to organizations
    const orgTargetedFlags = await this.find({
      advancedFilters: [
        {
          field: "type",
          operator: "==",
          value: FeatureFlagType.ORGANIZATION_TARGETED,
        },
      ],
    });

    // Filter to include only those targeting this organization
    return orgTargetedFlags.filter((flag) => {
      if (!flag.organizationTargeting) return false;

      const { organizationIds } = flag.organizationTargeting;
      return organizationIds && organizationIds.includes(organizationId);
    });
  }

  /**
   * Find feature flags for a specific user
   * @param userId The user ID
   * @param userRole The user's role
   * @param userEmail The user's email
   * @returns List of feature flags targeted to this user
   */
  async findByUser(
    userId: string,
    userRole?: string,
    userEmail?: string,
  ): Promise<FeatureFlag[]> {
    // Retrieve all user-targeted flags
    const userTargetedFlags = await this.find({
      advancedFilters: [
        { field: "type", operator: "==", value: FeatureFlagType.USER_TARGETED },
      ],
    });

    // Filter to include only those targeting this user
    return userTargetedFlags.filter((flag) => {
      if (!flag.userTargeting) return false;

      const { userIds, userRoles, userEmails } = flag.userTargeting;

      let isTargeted = false;

      // Check user ID targeting
      if (userIds && userIds.includes(userId)) {
        isTargeted = true;
      }

      // Check role targeting
      if (userRole && userRoles && userRoles.includes(userRole)) {
        isTargeted = true;
      }

      // Check email targeting
      if (userEmail && userEmails && userEmails.includes(userEmail)) {
        isTargeted = true;
      }

      return isTargeted;
    });
  }

  /**
   * Toggle a feature flag's enabled status
   * @param id The feature flag ID
   * @param enabled The new enabled state
   * @returns The updated feature flag
   */
  async toggleFlag(id: string, enabled: boolean): Promise<FeatureFlag> {
    return this.update(id, { enabled });
  }
}
