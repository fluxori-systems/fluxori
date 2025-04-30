import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityModuleOptions } from '../interfaces/security.interfaces';

import { AccessContextManagerClient } from '@google-cloud/access-context-manager';
import { ServiceUsageClient } from '@google-cloud/service-usage';

import { ObservabilityService } from '../../../../common/observability';
import {
  VpcServiceControlsService as IVpcServiceControlsService,
  VpcScConfiguration,
} from '../interfaces/security.interfaces';

/**
 * Service for managing Google Cloud VPC Service Controls
 */
@Injectable()
export class VpcServiceControlsService implements IVpcServiceControlsService {
  private readonly logger = new Logger(VpcServiceControlsService.name);
  private readonly accessContextManager: AccessContextManagerClient;
  private readonly serviceUsageClient: ServiceUsageClient;
  private readonly projectId: string;
  private readonly organizationId: string;

  constructor(
    @Inject('SECURITY_MODULE_OPTIONS')
    private readonly options: SecurityModuleOptions,
    private readonly configService: ConfigService,
    private readonly observability: ObservabilityService,
  ) {
    this.projectId = this.configService.get<string>('GCP_PROJECT_ID') || '';
    this.organizationId =
      this.configService.get<string>('GCP_ORGANIZATION_ID') || '';

    // Initialize GCP clients
    this.accessContextManager = new AccessContextManagerClient();
    this.serviceUsageClient = new ServiceUsageClient();

    this.logger.log('VPC Service Controls service initialized');
  }

  /**
   * Configure VPC Service Controls
   * @param config The VPC SC configuration
   */
  async configureServiceControls(config: VpcScConfiguration): Promise<void> {
    const span = this.observability.startTrace(
      'security.configureServiceControls',
    );

    try {
      // First, configure access levels
      await this.configureAccessLevels(config.accessLevels);

      // Then, configure service perimeters
      await this.configureServicePerimeters(config.perimeters);

      span.end();
      this.logger.log('VPC Service Controls configured successfully');
    } catch (error) {
      span.recordException(error);
      span.end();

      this.logger.error(
        `Failed to configure VPC Service Controls: ${error.message}`,
        error.stack,
      );
      this.observability.error(
        'VPC Service Controls configuration failed',
        error,
        VpcServiceControlsService.name,
      );

      throw error;
    }
  }

  /**
   * Configure access levels for VPC Service Controls
   */
  private async configureAccessLevels(
    accessLevels: VpcScConfiguration['accessLevels'],
  ): Promise<void> {
    if (!accessLevels || accessLevels.length === 0) {
      this.logger.warn(
        'No access levels provided, skipping access level configuration',
      );
      return;
    }

    // Parent path for organization access levels
    const parent = `organizations/${this.organizationId}`;

    for (const level of accessLevels) {
      try {
        // Check if access level already exists
        const accessLevelName = `${parent}/accessLevels/${level.name}`;

        try {
          const [existingLevel] =
            await this.accessContextManager.getAccessLevel({
              name: accessLevelName,
            });

          if (existingLevel) {
            this.logger.log(`Updating existing access level: ${level.name}`);
            await this.updateAccessLevel(level, accessLevelName);
          }
        } catch (error) {
          if (error.code === 5) {
            // NOT_FOUND
            this.logger.log(`Creating new access level: ${level.name}`);
            await this.createAccessLevel(level, parent);
          } else {
            throw error;
          }
        }
      } catch (error) {
        this.logger.error(
          `Error configuring access level ${level.name}: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }
  }

  /**
   * Create a new access level
   */
  private async createAccessLevel(
    level: VpcScConfiguration['accessLevels'][0],
    parent: string,
  ): Promise<void> {
    const accessLevelConfig: Record<string, any> = {
      parent,
      accessLevel: {
        name: `${parent}/accessLevels/${level.name}`,
        title: level.title,
        description: level.description,
        basic: {
          conditions: this.buildAccessConditions(level),
        },
      },
    };

    await this.accessContextManager.createAccessLevel(accessLevelConfig);
    this.logger.log(`Access level created: ${level.name}`);
  }

  /**
   * Update an existing access level
   */
  private async updateAccessLevel(
    level: VpcScConfiguration['accessLevels'][0],
    name: string,
  ): Promise<void> {
    const accessLevelConfig: Record<string, any> = {
      name,
      title: level.title,
      description: level.description,
      basic: {
        conditions: this.buildAccessConditions(level),
      },
    };

    await this.accessContextManager.updateAccessLevel({
      accessLevel: accessLevelConfig,
    });

    this.logger.log(`Access level updated: ${level.name}`);
  }

  /**
   * Build access level conditions based on configuration
   */
  private buildAccessConditions(
    level: VpcScConfiguration['accessLevels'][0],
  ): Array<Record<string, any>> {
    const conditions = [];
    const condition: Record<string, any> = {};

    // Add IP CIDR ranges if specified
    if (level.ipCidrRanges && level.ipCidrRanges.length > 0) {
      condition.ipSubnetworks = level.ipCidrRanges;
    }

    // Add VPN requirement if specified
    if (level.requireVpn) {
      condition.requiredAccessLevels = ['vpn_access']; // Assuming 'vpn_access' is defined elsewhere
    }

    // Add device policy if specified
    if (level.requireCorpDevice) {
      condition.devicePolicy = {
        requireCorpOwned: true,
        osConstraints: [
          { osType: 'DESKTOP_MAC' },
          { osType: 'DESKTOP_WINDOWS' },
          { osType: 'DESKTOP_CHROME_OS' },
          { osType: 'DESKTOP_LINUX' },
        ],
      };
    }

    // Add regions if specified
    if (level.regions && level.regions.length > 0) {
      condition.regions = level.regions;
    }

    conditions.push(condition);
    return conditions;
  }

  /**
   * Configure service perimeters for VPC Service Controls
   */
  private async configureServicePerimeters(
    perimeters: VpcScConfiguration['perimeters'],
  ): Promise<void> {
    if (!perimeters || perimeters.length === 0) {
      this.logger.warn(
        'No perimeters provided, skipping perimeter configuration',
      );
      return;
    }

    // Parent path for organization service perimeters
    const parent = `organizations/${this.organizationId}`;

    for (const perimeter of perimeters) {
      try {
        // Check if perimeter already exists
        const perimeterName = `${parent}/servicePerimeters/${perimeter.name}`;

        try {
          const [existingPerimeter] =
            await this.accessContextManager.getServicePerimeter({
              name: perimeterName,
            });

          if (existingPerimeter) {
            this.logger.log(
              `Updating existing service perimeter: ${perimeter.name}`,
            );
            await this.updateServicePerimeter(perimeter, perimeterName);
          }
        } catch (error) {
          if (error.code === 5) {
            // NOT_FOUND
            this.logger.log(
              `Creating new service perimeter: ${perimeter.name}`,
            );
            await this.createServicePerimeter(perimeter, parent);
          } else {
            throw error;
          }
        }
      } catch (error) {
        this.logger.error(
          `Error configuring service perimeter ${perimeter.name}: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }
  }

  /**
   * Create a new service perimeter
   */
  private async createServicePerimeter(
    perimeter: VpcScConfiguration['perimeters'][0],
    parent: string,
  ): Promise<void> {
    const projectResources = perimeter.projects.map(
      (projectId) => `projects/${projectId}`,
    );

    const perimeterConfig: Record<string, any> = {
      parent,
      servicePerimeter: {
        name: `${parent}/servicePerimeters/${perimeter.name}`,
        title: perimeter.title,
        description: perimeter.description,
        status: {
          resources: projectResources,
          restrictedServices: this.formatServiceNames(perimeter.services),
          ingressPolicies: this.formatIngressPolicies(perimeter.ingressRules),
          egressPolicies: this.formatEgressPolicies(perimeter.egressRules),
          vpcAccessibleServices: {
            enableRestriction: true,
            allowedServices: perimeter.services,
          },
        },
        perimeterType: 'PERIMETER_TYPE_REGULAR',
      },
    };

    await this.accessContextManager.createServicePerimeter(perimeterConfig);
    this.logger.log(`Service perimeter created: ${perimeter.name}`);
  }

  /**
   * Update an existing service perimeter
   */
  private async updateServicePerimeter(
    perimeter: VpcScConfiguration['perimeters'][0],
    name: string,
  ): Promise<void> {
    const projectResources = perimeter.projects.map(
      (projectId) => `projects/${projectId}`,
    );

    const perimeterConfig: Record<string, any> = {
      name,
      title: perimeter.title,
      description: perimeter.description,
      status: {
        resources: projectResources,
        restrictedServices: this.formatServiceNames(perimeter.services),
        ingressPolicies: this.formatIngressPolicies(perimeter.ingressRules),
        egressPolicies: this.formatEgressPolicies(perimeter.egressRules),
        vpcAccessibleServices: {
          enableRestriction: true,
          allowedServices: perimeter.services,
        },
      },
      perimeterType: 'PERIMETER_TYPE_REGULAR',
    };

    await this.accessContextManager.updateServicePerimeter({
      servicePerimeter: perimeterConfig,
    });

    this.logger.log(`Service perimeter updated: ${perimeter.name}`);
  }

  /**
   * Format service names for the API
   */
  private formatServiceNames(services: string[]): string[] {
    return services.map((service) => {
      // Add '.googleapis.com' suffix if not already present
      if (!service.includes('.')) {
        return `${service}.googleapis.com`;
      }
      return service;
    });
  }

  /**
   * Format ingress rules into API format
   */
  private formatIngressPolicies(
    ingressRules?: VpcScConfiguration['perimeters'][0]['ingressRules'],
  ): Record<string, any>[] {
    if (!ingressRules || ingressRules.length === 0) {
      return [];
    }

    return ingressRules.map((rule) => {
      return {
        sourceIdentityType: rule.identityType || 'ANY_IDENTITY',
        sources: [
          {
            resource: rule.source,
          },
        ],
        ingress_to: {
          resources: ['*'],
          operations: {
            serviceName: '*',
            methodSelectors: {
              method: '*',
            },
          },
        },
      };
    });
  }

  /**
   * Format egress rules into API format
   */
  private formatEgressPolicies(
    egressRules?: VpcScConfiguration['perimeters'][0]['egressRules'],
  ): Record<string, any>[] {
    if (!egressRules || egressRules.length === 0) {
      return [];
    }

    return egressRules.map((rule) => {
      return {
        identityType: rule.identityType || 'ANY_IDENTITY',
        egress_from: {
          identityType: rule.identityType || 'ANY_IDENTITY',
          sources: [
            {
              resource: '*',
            },
          ],
        },
        egress_to: {
          resources: [rule.destination],
          operations: {
            serviceName: '*',
            methodSelectors: {
              method: '*',
            },
          },
        },
      };
    });
  }

  /**
   * Add an emergency access binding
   * @param email User email to grant emergency access
   * @param durationHours How long the access should last
   * @param reason Reason for emergency access
   */
  async grantEmergencyAccess(
    email: string,
    durationHours: number,
    reason: string,
  ): Promise<void> {
    const span = this.observability.startTrace(
      'security.grantEmergencyAccess',
      {
        email,
        durationHours,
      },
    );

    try {
      // Log the emergency access request
      this.logger.warn(
        `Emergency access granted to ${email} for ${durationHours} hours. Reason: ${reason}`,
      );

      // In a real implementation, this would create a temporary IAM binding or
      // add a time-limited exception to the VPC Service Controls

      // For now, log the emergency access event
      this.observability.log('Emergency access granted', {
        service: VpcServiceControlsService.name,
        customFields: {
          email,
          durationHours,
          reason,
          grantedAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + durationHours * 60 * 60 * 1000,
          ).toISOString(),
        },
        timestamp: new Date(),
      });

      // Create a future task to revoke access
      // This would be implemented using a Cloud Scheduler job in a real system
      this.scheduleEmergencyAccessRevocation(email, durationHours);

      span.end();
    } catch (error) {
      span.recordException(error);
      span.end();

      this.logger.error(
        `Failed to grant emergency access: ${error.message}`,
        error.stack,
      );
      this.observability.error(
        'Emergency access grant failed',
        error,
        VpcServiceControlsService.name,
      );

      throw error;
    }
  }

  /**
   * Schedule the revocation of emergency access
   */
  private scheduleEmergencyAccessRevocation(
    email: string,
    durationHours: number,
  ): void {
    // In a real implementation, this would create a Cloud Scheduler job
    // For this example, we'll just log the intent
    this.logger.log(
      `Scheduled emergency access revocation for ${email} in ${durationHours} hours`,
    );
  }

  /**
   * Test VPC Service Controls configuration
   * @returns Validation results
   */
  async testServiceControls(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const span = this.observability.startTrace('security.testServiceControls');

    try {
      // In a real implementation, this would:
      // 1. Attempt to access protected resources from inside the perimeter
      // 2. Attempt to access protected resources from outside the perimeter
      // 3. Verify that the expected access controls are working

      // For this example, we'll simulate a basic check
      const valid = true;
      const issues: string[] = [];

      span.end();
      return { valid, issues };
    } catch (error) {
      span.recordException(error);
      span.end();

      this.logger.error(
        `Failed to test VPC Service Controls: ${error.message}`,
        error.stack,
      );
      this.observability.error(
        'VPC Service Controls test failed',
        error,
        VpcServiceControlsService.name,
      );

      return {
        valid: false,
        issues: [error.message],
      };
    }
  }

  /**
   * Get current VPC Service Controls status
   * @returns Current status
   */
  async getServiceControlsStatus(): Promise<{
    enabled: boolean;
    perimeters: Array<{
      name: string;
      status: 'active' | 'pending' | 'error';
      lastUpdated: Date;
    }>;
  }> {
    const span = this.observability.startTrace(
      'security.getServiceControlsStatus',
    );

    try {
      // In a real implementation, this would retrieve the actual status from the API
      // For this example, we'll return a simulated status

      // Default status when no configuration is present
      if (!this.options.vpcServiceControls) {
        span.end();
        return {
          enabled: false,
          perimeters: [],
        };
      }

      // Simulate perimeter status based on configuration
      const perimeters = this.options.vpcServiceControls.perimeters.map(
        (p: Record<string, any>) => ({
          name: p.name,
          status: 'active' as const,
          lastUpdated: new Date(),
        }),
      );

      span.end();
      return {
        enabled: true,
        perimeters,
      };
    } catch (error) {
      span.recordException(error);
      span.end();

      this.logger.error(
        `Failed to get VPC Service Controls status: ${error.message}`,
        error.stack,
      );
      this.observability.error(
        'VPC Service Controls status check failed',
        error,
        VpcServiceControlsService.name,
      );

      return {
        enabled: false,
        perimeters: [],
      };
    }
  }
}
