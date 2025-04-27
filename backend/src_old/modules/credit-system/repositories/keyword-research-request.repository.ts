import { Injectable } from "@nestjs/common";
import { FirestoreBaseRepository } from "@common/repositories";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { KeywordResearchRequest } from "../interfaces/types";

/**
 * Repository for keyword research requests
 */
@Injectable()
export class KeywordResearchRequestRepository extends FirestoreBaseRepository<KeywordResearchRequest> {
  protected readonly collectionName = "keyword_research_requests";

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "keyword_research_requests", {
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000, // 5 minutes
      requiredFields: [
        "organizationId",
        "userId",
        "keywords",
        "marketplaces",
        "status",
      ],
    });
  }

  /**
   * Find pending requests by organization ID
   * @param organizationId Organization ID
   * @returns Array of pending keyword research requests
   */
  async findPendingByOrganization(
    organizationId: string,
  ): Promise<KeywordResearchRequest[]> {
    return this.find({
      filter: {
        organizationId,
        status: "pending",
      } as Partial<KeywordResearchRequest>,
      queryOptions: {
        orderBy: "priority",
        direction: "desc", // Higher priority first
      },
    });
  }

  /**
   * Find processing requests by organization ID
   * @param organizationId Organization ID
   * @returns Array of processing keyword research requests
   */
  async findProcessingByOrganization(
    organizationId: string,
  ): Promise<KeywordResearchRequest[]> {
    return this.find({
      filter: {
        organizationId,
        status: "processing",
      } as Partial<KeywordResearchRequest>,
      queryOptions: {
        orderBy: "requestedAt",
        direction: "asc",
      },
    });
  }

  /**
   * Find completed requests by organization ID
   * @param organizationId Organization ID
   * @param limit Maximum number of requests to return
   * @returns Array of completed keyword research requests
   */
  async findCompletedByOrganization(
    organizationId: string,
    limit: number = 50,
  ): Promise<KeywordResearchRequest[]> {
    return this.find({
      filter: {
        organizationId,
        status: "completed",
      } as Partial<KeywordResearchRequest>,
      queryOptions: {
        orderBy: "completedAt",
        direction: "desc",
        limit,
      },
    });
  }

  /**
   * Find requests by user ID
   * @param userId User ID
   * @param limit Maximum number of requests to return
   * @returns Array of keyword research requests
   */
  async findByUser(
    userId: string,
    limit: number = 50,
  ): Promise<KeywordResearchRequest[]> {
    return this.find({
      filter: { userId } as Partial<KeywordResearchRequest>,
      queryOptions: {
        orderBy: "requestedAt",
        direction: "desc",
        limit,
      },
    });
  }

  /**
   * Find next request to process based on priority
   * @param limit Maximum number of requests to return
   * @returns Array of pending keyword research requests
   */
  async findNextToProcess(
    limit: number = 10,
  ): Promise<KeywordResearchRequest[]> {
    return this.find({
      filter: { status: "pending" } as Partial<KeywordResearchRequest>,
      queryOptions: {
        orderBy: "priority",
        direction: "desc", // Higher priority first
        limit,
      },
    });
  }

  /**
   * Update request status
   * @param requestId Request ID
   * @param status New status
   * @param additionalData Additional data to update
   * @returns Updated request
   */
  async updateStatus(
    requestId: string,
    status: "pending" | "processing" | "completed" | "failed" | "cached",
    additionalData: Partial<KeywordResearchRequest> = {},
  ): Promise<KeywordResearchRequest> {
    const data: Partial<KeywordResearchRequest> = {
      status,
      ...additionalData,
    };

    // If status is completed, set completedAt
    if (status === "completed") {
      data.completedAt = new Date();
    }

    return this.update(requestId, data);
  }

  /**
   * Count total pending requests
   * @returns Number of pending requests
   */
  async countPendingRequests(): Promise<number> {
    const pendingRequests = await this.find({
      filter: { status: "pending" } as Partial<KeywordResearchRequest>,
    });
    return pendingRequests.length;
  }

  /**
   * Find requests with pending notifications
   * @param limit Maximum number of requests to return
   * @returns Array of completed requests with notifications pending
   */
  async findPendingNotifications(
    limit: number = 20,
  ): Promise<KeywordResearchRequest[]> {
    return this.find({
      filter: {
        status: "completed",
        notificationEnabled: true,
        notificationSent: false,
      } as any,
      queryOptions: {
        orderBy: "completedAt",
        direction: "asc",
        limit,
      },
    });
  }

  /**
   * Get queue position for a request
   * @param requestId Request ID
   * @returns Queue position (1-based) or null if not found
   */
  async getQueuePosition(requestId: string): Promise<number | null> {
    const request = await this.findById(requestId);

    if (!request || request.status !== "pending") {
      return null;
    }

    // Get all pending requests ordered by priority (desc) and requestedAt (asc)
    const pendingRequests = await this.find({
      filter: { status: "pending" } as Partial<KeywordResearchRequest>,
      queryOptions: {
        orderBy: "priority",
        direction: "desc",
      },
    });

    // Find position of current request
    const position = pendingRequests.findIndex((req) => req.id === requestId);
    return position >= 0 ? position + 1 : null;
  }
}
