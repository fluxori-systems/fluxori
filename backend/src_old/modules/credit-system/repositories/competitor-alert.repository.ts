import { Injectable } from "@nestjs/common";
import { CompetitorAlert, CompetitorWatch } from "../interfaces/types";
import { FirestoreBaseRepository } from "@common/repositories";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { FindOptions } from "@common/repositories";

/**
 * Repository for competitor watches
 */
@Injectable()
export class CompetitorWatchRepository extends FirestoreBaseRepository<CompetitorWatch> {
  constructor(private readonly firestoreConfig: FirestoreConfigService) {
    super(firestoreConfig, "competitor-watches");
  }

  /**
   * Find competitor watches by organization ID
   * @param organizationId Organization ID
   * @returns Promise with array of CompetitorWatch objects
   */
  async findByOrganization(organizationId: string): Promise<CompetitorWatch[]> {
    return await this.findBy("organizationId", organizationId);
  }

  /**
   * Find active watches due for checking
   * @returns Promise with array of active CompetitorWatch objects
   */
  async findActiveWatches(): Promise<CompetitorWatch[]> {
    const now = new Date();

    return await this.find({
      advancedFilters: [
        { field: "isActive", operator: "==", value: true },
        { field: "nextCheckAt", operator: "<=", value: now },
      ],
    });
  }

  /**
   * Find competitor watches by user
   * @param organizationId Organization ID
   * @param userId User ID
   * @returns Promise with array of CompetitorWatch objects
   */
  async findByUser(
    organizationId: string,
    userId: string,
  ): Promise<CompetitorWatch[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "userId", operator: "==", value: userId },
      ],
    });
  }

  /**
   * Find competitor watches by keyword
   * @param organizationId Organization ID
   * @param keyword Keyword to search for
   * @returns Promise with array of CompetitorWatch objects
   */
  async findByKeyword(
    organizationId: string,
    keyword: string,
  ): Promise<CompetitorWatch[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "keyword", operator: "==", value: keyword },
      ],
    });
  }

  /**
   * Find competitor watches by product ID
   * @param organizationId Organization ID
   * @param productId Product ID to search for
   * @returns Promise with array of CompetitorWatch objects
   */
  async findByProduct(
    organizationId: string,
    productId: string,
  ): Promise<CompetitorWatch[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "productId", operator: "==", value: productId },
      ],
    });
  }

  /**
   * Update next check date for a competitor watch
   * @param id Watch ID
   * @param lastCheckedAt Last checked date
   * @param nextCheckAt Next check date
   */
  async updateNextCheckAt(
    id: string,
    lastCheckedAt: Date,
    nextCheckAt: Date,
  ): Promise<void> {
    await this.update(id, { lastCheckedAt, nextCheckAt });
  }
}

/**
 * Repository for competitor alerts
 */
@Injectable()
export class CompetitorAlertRepository extends FirestoreBaseRepository<CompetitorAlert> {
  constructor(private readonly firestoreConfig: FirestoreConfigService) {
    super(firestoreConfig, "competitor-alerts");
  }

  /**
   * Find competitor alerts by organization ID
   * @param organizationId Organization ID
   * @returns Promise with array of CompetitorAlert objects
   */
  async findByOrganization(organizationId: string): Promise<CompetitorAlert[]> {
    return await this.findBy("organizationId", organizationId);
  }

  /**
   * Find competitor alerts by user
   * @param organizationId Organization ID
   * @param userId User ID
   * @returns Promise with array of CompetitorAlert objects
   */
  async findByUser(
    organizationId: string,
    userId: string,
  ): Promise<CompetitorAlert[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "userId", operator: "==", value: userId },
      ],
    });
  }

  /**
   * Find competitor alerts by watch ID
   * @param watchId Watch ID
   * @returns Promise with array of CompetitorAlert objects
   */
  async findByWatchId(watchId: string): Promise<CompetitorAlert[]> {
    return await this.findBy("watchId", watchId);
  }

  /**
   * Find new alerts for an organization
   * @param organizationId Organization ID
   * @returns Promise with array of new CompetitorAlert objects
   */
  async findNewAlerts(organizationId: string): Promise<CompetitorAlert[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "status", operator: "==", value: "new" },
      ],
    });
  }

  /**
   * Find alerts by status
   * @param organizationId Organization ID
   * @param status Alert status
   * @returns Promise with array of CompetitorAlert objects
   */
  async findByStatus(
    organizationId: string,
    status: "new" | "viewed" | "dismissed",
  ): Promise<CompetitorAlert[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "status", operator: "==", value: status },
      ],
    });
  }

  /**
   * Find alerts by importance
   * @param organizationId Organization ID
   * @param importance Alert importance
   * @returns Promise with array of CompetitorAlert objects
   */
  async findByImportance(
    organizationId: string,
    importance: "critical" | "high" | "medium" | "low",
  ): Promise<CompetitorAlert[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "importance", operator: "==", value: importance },
      ],
    });
  }

  /**
   * Find alerts by alert type
   * @param organizationId Organization ID
   * @param alertType Alert type
   * @returns Promise with array of CompetitorAlert objects
   */
  async findByAlertType(
    organizationId: string,
    alertType: string,
  ): Promise<CompetitorAlert[]> {
    return await this.find({
      advancedFilters: [
        { field: "organizationId", operator: "==", value: organizationId },
        { field: "alertType", operator: "==", value: alertType },
      ],
    });
  }

  /**
   * Mark an alert as sent
   * @param id Alert ID
   * @param channels Notification channels
   */
  async markAsSent(id: string, channels: string[]): Promise<void> {
    await this.update(id, {
      notificationStatus: {
        sent: true,
        sentAt: new Date(),
        channels,
      },
    });
  }

  /**
   * Update alert status
   * @param id Alert ID
   * @param status New status
   */
  async updateStatus(
    id: string,
    status: "viewed" | "dismissed",
  ): Promise<void> {
    await this.update(id, { status });
  }
}
