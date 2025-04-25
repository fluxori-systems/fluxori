import { Injectable, Logger } from '@nestjs/common';

/**
 * Network status information
 */
export interface NetworkStatus {
  /** Connection type (wifi, 4g, 3g, 2g, offline) */
  connectionType: string;
  /** Download speed in Mbps (if available) */
  downloadSpeed?: number;
  /** Upload speed in Mbps (if available) */
  uploadSpeed?: number;
  /** Latency in milliseconds (if available) */
  latency?: number;
  /** Whether the connection is considered stable */
  isStable: boolean;
  /** Whether the bandwidth is considered sufficient for high-data operations */
  isSufficientBandwidth: boolean;
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * NetworkStatusService
 *
 * Service for detecting and tracking network conditions with South African optimizations
 * This service helps other components adapt to variable network conditions common in South Africa
 */
@Injectable()
export class NetworkStatusService {
  private readonly logger = new Logger(NetworkStatusService.name);

  // Default to a conservative estimate for South African connections
  private currentStatus: NetworkStatus = {
    connectionType: '4g',
    isStable: true,
    isSufficientBandwidth: true,
    lastUpdated: new Date(),
  };

  // Cache of recent test results (organizationId -> NetworkStatus)
  private recentTests: Map<string, NetworkStatus> = new Map();

  // Global network status override (for maintenance or known issues)
  private globalNetworkIssue: boolean = false;

  constructor() {
    // Initialize with conservative defaults for South African market
    this.updateDefaultStatus();
  }

  /**
   * Get the current network status
   * If organization-specific status is available, that will be returned
   * Otherwise, a global default status will be returned
   *
   * @param organizationId Organization ID (optional)
   * @returns Current network status
   */
  async getNetworkStatus(organizationId?: string): Promise<NetworkStatus> {
    // If organization-specific status is available and recent, use it
    if (organizationId && this.recentTests.has(organizationId)) {
      const orgStatus = this.recentTests.get(organizationId);
      if (orgStatus) {
        const ageMs = Date.now() - orgStatus.lastUpdated.getTime();

        // Use cached status if less than 5 minutes old
        if (ageMs < 5 * 60 * 1000) {
          return orgStatus;
        }
      }
    }

    // If there's a global network issue, return a constrained status
    if (this.globalNetworkIssue) {
      return {
        connectionType: '3g',
        downloadSpeed: 1.5,
        uploadSpeed: 0.5,
        latency: 200,
        isStable: false,
        isSufficientBandwidth: false,
        lastUpdated: new Date(),
      };
    }

    return this.currentStatus;
  }

  /**
   * Update network status for an organization based on client-reported metrics
   *
   * @param organizationId Organization ID
   * @param status Network status information
   */
  updateOrganizationNetworkStatus(
    organizationId: string,
    status: Partial<NetworkStatus>,
  ): void {
    const currentOrgStatus = this.recentTests.get(organizationId) || {
      ...this.currentStatus,
    };

    const updatedStatus: NetworkStatus = {
      ...currentOrgStatus,
      ...status,
      lastUpdated: new Date(),
    };

    // Update isSufficientBandwidth based on download speed
    if (updatedStatus.downloadSpeed !== undefined) {
      // South African threshold - 2 Mbps is sufficient for most operations
      updatedStatus.isSufficientBandwidth = updatedStatus.downloadSpeed >= 2;
    }

    // Update isStable based on connection type and latency
    if (
      updatedStatus.connectionType !== undefined ||
      updatedStatus.latency !== undefined
    ) {
      const isLowLatency =
        updatedStatus.latency === undefined || updatedStatus.latency < 200;
      const isGoodConnection = ['wifi', '4g'].includes(
        updatedStatus.connectionType,
      );

      updatedStatus.isStable = isGoodConnection && isLowLatency;
    }

    this.recentTests.set(organizationId, updatedStatus);
    this.logger.debug(
      `Updated network status for organization ${organizationId}: ${JSON.stringify(updatedStatus)}`,
    );

    // Update global default if needed
    this.updateDefaultStatus();
  }

  /**
   * Set a global network issue flag
   * This is useful during known service degradation periods
   *
   * @param isIssueActive Whether a global network issue is active
   */
  setGlobalNetworkIssue(isIssueActive: boolean): void {
    this.globalNetworkIssue = isIssueActive;
    this.logger.log(`Global network issue flag set to: ${isIssueActive}`);
  }

  /**
   * Update the default network status based on recent tests
   * This aggregates recent results to establish a baseline
   */
  private updateDefaultStatus(): void {
    if (this.recentTests.size === 0) {
      return;
    }

    // Calculate average speed from recent tests
    let totalDownloadSpeed = 0;
    let downloadSpeedCount = 0;
    let totalUploadSpeed = 0;
    let uploadSpeedCount = 0;
    let totalLatency = 0;
    let latencyCount = 0;
    let stableCount = 0;
    let sufficientBandwidthCount = 0;

    // Connection type counts
    const connectionCounts = {
      wifi: 0,
      '4g': 0,
      '3g': 0,
      '2g': 0,
      offline: 0,
    };

    // Process recent tests
    for (const status of this.recentTests.values()) {
      // Only consider recent results (less than 30 minutes old)
      const ageMs = Date.now() - status.lastUpdated.getTime();
      if (ageMs > 30 * 60 * 1000) {
        continue;
      }

      if (status.downloadSpeed !== undefined) {
        totalDownloadSpeed += status.downloadSpeed;
        downloadSpeedCount++;
      }

      if (status.uploadSpeed !== undefined) {
        totalUploadSpeed += status.uploadSpeed;
        uploadSpeedCount++;
      }

      if (status.latency !== undefined) {
        totalLatency += status.latency;
        latencyCount++;
      }

      if (status.isStable) {
        stableCount++;
      }

      if (status.isSufficientBandwidth) {
        sufficientBandwidthCount++;
      }

      // Type guard to ensure connectionType is a valid key in connectionCounts
      const connType = status.connectionType as keyof typeof connectionCounts;
      if (connType in connectionCounts) {
        connectionCounts[connType]++;
      }
    }

    // Find most common connection type
    let mostCommonConnection = '4g'; // Default
    let maxCount = 0;

    for (const [type, count] of Object.entries(connectionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonConnection = type;
      }
    }

    // Update default status
    this.currentStatus = {
      connectionType: mostCommonConnection,
      downloadSpeed:
        downloadSpeedCount > 0
          ? totalDownloadSpeed / downloadSpeedCount
          : undefined,
      uploadSpeed:
        uploadSpeedCount > 0 ? totalUploadSpeed / uploadSpeedCount : undefined,
      latency: latencyCount > 0 ? totalLatency / latencyCount : undefined,
      isStable: stableCount > this.recentTests.size / 2, // Majority rule
      isSufficientBandwidth:
        sufficientBandwidthCount > this.recentTests.size / 2, // Majority rule
      lastUpdated: new Date(),
    };

    this.logger.debug(
      `Updated default network status: ${JSON.stringify(this.currentStatus)}`,
    );
  }
}
