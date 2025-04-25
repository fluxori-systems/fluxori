import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { FirestoreConfigService } from 'src/config/firestore.config';

import { FirestoreBaseRepository } from 'src/common/repositories';

import { FeatureFlagAuditLog } from '../interfaces/types';

/**
 * Repository for managing feature flag audit logs
 */
@Injectable()
export class FeatureFlagAuditLogRepository
  extends FirestoreBaseRepository<FeatureFlagAuditLog>
  implements OnModuleInit
{
  protected readonly logger = new Logger(FeatureFlagAuditLogRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'feature_flag_audit_logs', {
      enableCache: false, // No caching for audit logs
      useSoftDeletes: false, // We don't want to delete audit logs
    });
  }

  /**
   * Initialize the repository when the module loads
   */
  onModuleInit(): void {
    this.logger.log('FeatureFlagAuditLogRepository initialized');
  }

  /**
   * Find audit logs for a specific feature flag
   * @param flagId The feature flag ID
   * @returns List of audit logs for the flag
   */
  async findByFlagId(flagId: string): Promise<FeatureFlagAuditLog[]> {
    return this.find({
      advancedFilters: [{ field: 'flagId', operator: '==', value: flagId }],
      queryOptions: {
        orderBy: 'timestamp',
        direction: 'desc',
      },
    });
  }

  /**
   * Find audit logs by flag key
   * @param flagKey The feature flag key
   * @returns List of audit logs for the flag
   */
  async findByFlagKey(flagKey: string): Promise<FeatureFlagAuditLog[]> {
    return this.find({
      advancedFilters: [{ field: 'flagKey', operator: '==', value: flagKey }],
      queryOptions: {
        orderBy: 'timestamp',
        direction: 'desc',
      },
    });
  }

  /**
   * Find audit logs by user
   * @param userId The user ID who performed the actions
   * @returns List of audit logs for the user
   */
  async findByUser(userId: string): Promise<FeatureFlagAuditLog[]> {
    return this.find({
      advancedFilters: [
        { field: 'performedBy', operator: '==', value: userId },
      ],
      queryOptions: {
        orderBy: 'timestamp',
        direction: 'desc',
      },
    });
  }

  /**
   * Find audit logs by action type
   * @param action The action type
   * @returns List of audit logs for the action
   */
  async findByAction(
    action: 'created' | 'updated' | 'deleted' | 'toggled',
  ): Promise<FeatureFlagAuditLog[]> {
    return this.find({
      advancedFilters: [{ field: 'action', operator: '==', value: action }],
      queryOptions: {
        orderBy: 'timestamp',
        direction: 'desc',
      },
    });
  }

  /**
   * Find recent audit logs with pagination
   * @param limit The maximum number of logs to return
   * @param offset The pagination offset
   * @returns List of recent audit logs
   */
  async findRecent(limit = 20, offset = 0): Promise<FeatureFlagAuditLog[]> {
    return this.find({
      queryOptions: {
        orderBy: 'timestamp',
        direction: 'desc',
        limit,
        offset,
      },
    });
  }
}
