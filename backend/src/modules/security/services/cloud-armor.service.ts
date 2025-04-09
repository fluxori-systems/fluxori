import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Compute } from '@google-cloud/compute';

import { ObservabilityService } from '../../../common/observability';
import { WafConfiguration } from '../interfaces/security.interfaces';

/**
 * Service for managing Google Cloud Armor WAF policies
 */
@Injectable()
export class CloudArmorService {
  private readonly logger = new Logger(CloudArmorService.name);
  private readonly computeClient: Compute;
  private readonly projectId: string;
  private readonly securityPolicyName: string;
  
  constructor(
    @Inject('SECURITY_MODULE_OPTIONS') private readonly options: any,
    private readonly configService: ConfigService,
    private readonly observability: ObservabilityService,
  ) {
    this.projectId = this.configService.get<string>('GCP_PROJECT_ID');
    this.securityPolicyName = this.configService.get<string>('SECURITY_POLICY_NAME') || 'fluxori-waf-policy';
    
    // Initialize GCP Compute client for Cloud Armor operations
    this.computeClient = new Compute();
    
    this.logger.log('Cloud Armor service initialized');
  }
  
  /**
   * Create or update a Cloud Armor security policy
   * @param config WAF configuration
   */
  async configureSecurityPolicy(config: WafConfiguration): Promise<void> {
    const span = this.observability.startTrace('security.configureCloudArmor', {
      policyName: this.securityPolicyName,
    });
    
    try {
      // Check if the security policy already exists
      let policyExists = true;
      try {
        await this.computeClient.securityPolicy(this.securityPolicyName).get();
      } catch (error) {
        policyExists = false;
      }
      
      if (policyExists) {
        // Update existing policy
        await this.updateSecurityPolicy(config);
      } else {
        // Create new policy
        await this.createSecurityPolicy(config);
      }
      
      span.end();
      this.logger.log(`Cloud Armor security policy configured: ${this.securityPolicyName}`);
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`Failed to configure Cloud Armor security policy: ${error.message}`, error.stack);
      this.observability.error('Cloud Armor configuration failed', error, CloudArmorService.name);
      
      throw error;
    }
  }
  
  /**
   * Create a new Cloud Armor security policy
   */
  private async createSecurityPolicy(config: WafConfiguration): Promise<void> {
    try {
      // Create the basic security policy
      await this.computeClient.createSecurityPolicy({
        name: this.securityPolicyName,
        description: 'Fluxori WAF security policy',
        
        // Default rule (allow all traffic)
        default: {
          action: 'allow',
          preview: false,
        },
      });
      
      // Add all the rules
      await this.configureSecurityPolicyRules(config);
      
      this.logger.log(`Created Cloud Armor security policy: ${this.securityPolicyName}`);
    } catch (error) {
      this.logger.error(`Failed to create security policy: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Update an existing Cloud Armor security policy
   */
  private async updateSecurityPolicy(config: WafConfiguration): Promise<void> {
    try {
      const securityPolicy = this.computeClient.securityPolicy(this.securityPolicyName);
      
      // First, remove all existing rules except the default rule
      const [rules] = await securityPolicy.getRules();
      
      for (const rule of rules) {
        // Skip the default rule
        if (rule.priority === 2147483647) {
          continue;
        }
        
        await securityPolicy.deleteRule(rule.priority);
      }
      
      // Add all the rules from the config
      await this.configureSecurityPolicyRules(config);
      
      this.logger.log(`Updated Cloud Armor security policy: ${this.securityPolicyName}`);
    } catch (error) {
      this.logger.error(`Failed to update security policy: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Configure the rules for a security policy
   */
  private async configureSecurityPolicyRules(config: WafConfiguration): Promise<void> {
    const securityPolicy = this.computeClient.securityPolicy(this.securityPolicyName);
    let priority = 1000; // Starting priority
    
    // Add rate limiting rule
    await securityPolicy.addRule({
      priority: priority++,
      description: 'Rate limiting rule',
      match: {
        versionedExpr: 'SRC_IPS_V1',
        config: {
          srcIpRanges: ['*'],
        },
      },
      action: 'rate_based_ban',
      rateLimitOptions: {
        rateLimitThreshold: {
          count: config.rateLimit.requestsPerMinute,
          intervalSec: 60,
        },
        conformAction: 'allow',
        exceedAction: 'deny(429)',
        enforceOnKey: 'IP',
        banDurationSec: config.rateLimit.banDurationSeconds,
      },
    });
    
    // Add geo-restriction rule if enabled
    if (config.geoRestrictions.enabled) {
      await securityPolicy.addRule({
        priority: priority++,
        description: 'Geographic restrictions',
        match: {
          expr: {
            // If blockUnlisted is true, block all countries not in allowedCountries
            // Otherwise, only block countries NOT in the allowedCountries list
            expression: config.geoRestrictions.blockUnlisted
              ? `!has(geoIP.country_code) || !(geoIP.country_code in ${JSON.stringify(config.geoRestrictions.allowedCountries)})`
              : `has(geoIP.country_code) && !(geoIP.country_code in ${JSON.stringify(config.geoRestrictions.allowedCountries)})`,
          },
        },
        action: 'deny(403)',
      });
    }
    
    // Add OWASP protection rules
    if (config.owaspProtection.xssProtection) {
      await securityPolicy.addRule({
        priority: priority++,
        description: 'XSS protection',
        match: {
          expr: {
            expression: 'evaluatePreconfiguredExpr(\'xss-stable\')',
          },
        },
        action: 'deny(403)',
      });
    }
    
    if (config.owaspProtection.sqlInjectionProtection) {
      await securityPolicy.addRule({
        priority: priority++,
        description: 'SQL injection protection',
        match: {
          expr: {
            expression: 'evaluatePreconfiguredExpr(\'sqli-stable\')',
          },
        },
        action: 'deny(403)',
      });
    }
    
    if (config.owaspProtection.remoteFileInclusionProtection) {
      await securityPolicy.addRule({
        priority: priority++,
        description: 'Remote file inclusion protection',
        match: {
          expr: {
            expression: 'evaluatePreconfiguredExpr(\'rfi-stable\')',
          },
        },
        action: 'deny(403)',
      });
    }
    
    if (config.owaspProtection.localFileInclusionProtection) {
      await securityPolicy.addRule({
        priority: priority++,
        description: 'Local file inclusion protection',
        match: {
          expr: {
            expression: 'evaluatePreconfiguredExpr(\'lfi-stable\')',
          },
        },
        action: 'deny(403)',
      });
    }
    
    // Add custom rules
    for (const rule of config.customRules) {
      await securityPolicy.addRule({
        priority: rule.priority || priority++,
        description: rule.name,
        match: {
          expr: {
            expression: rule.expression,
          },
        },
        action: rule.action,
      });
    }
    
    // Add scanner protection rule
    await securityPolicy.addRule({
      priority: priority++,
      description: 'Scanner protection',
      match: {
        expr: {
          expression: 'evaluatePreconfiguredExpr(\'scanners-whitelist\')',
        },
      },
      action: 'deny(403)',
    });
    
    // Add protection against Tor exit nodes
    await securityPolicy.addRule({
      priority: priority++,
      description: 'Block Tor exit nodes',
      match: {
        expr: {
          expression: 'evaluatePreconfiguredExpr(\'tor-exit-node\')',
        },
      },
      action: 'deny(403)',
    });
  }
  
  /**
   * Add a custom rule to the security policy
   * @param ruleName Name of the rule
   * @param expression Rule expression
   * @param action Action to take (allow, deny, throttle)
   * @param priority Rule priority
   */
  async addCustomRule(
    ruleName: string,
    expression: string,
    action: 'allow' | 'deny' | 'throttle',
    priority?: number
  ): Promise<void> {
    const span = this.observability.startTrace('security.addCloudArmorRule', {
      ruleName,
      action,
    });
    
    try {
      const securityPolicy = this.computeClient.securityPolicy(this.securityPolicyName);
      
      // If no priority is specified, place the rule at priority 2000
      const rulePriority = priority || 2000;
      
      await securityPolicy.addRule({
        priority: rulePriority,
        description: ruleName,
        match: {
          expr: {
            expression,
          },
        },
        action,
      });
      
      span.end();
      this.logger.log(`Added custom rule to Cloud Armor: ${ruleName}`);
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`Failed to add custom rule: ${error.message}`, error.stack);
      this.observability.error('Cloud Armor rule addition failed', error, CloudArmorService.name);
      
      throw error;
    }
  }
  
  /**
   * Get security policy rules
   * @returns List of security policy rules
   */
  async getSecurityPolicyRules(): Promise<any[]> {
    try {
      const securityPolicy = this.computeClient.securityPolicy(this.securityPolicyName);
      const [rules] = await securityPolicy.getRules();
      
      return rules;
    } catch (error) {
      this.logger.error(`Failed to get security policy rules: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get security policy metrics
   * @returns Security policy metrics
   */
  async getSecurityPolicyMetrics(): Promise<{
    totalRequests: number;
    blockedRequests: number;
    allowedRequests: number;
    rateLimitedRequests: number;
  }> {
    try {
      // In a real implementation, this would query Cloud Monitoring metrics
      // For this example, we'll return placeholder values
      
      return {
        totalRequests: 1000,
        blockedRequests: 50,
        allowedRequests: 950,
        rateLimitedRequests: 10,
      };
    } catch (error) {
      this.logger.error(`Failed to get security policy metrics: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Emergency block an IP address
   * @param ipAddress The IP address to block
   * @param reason Reason for blocking
   * @param durationHours Duration of the block in hours
   */
  async emergencyBlockIp(
    ipAddress: string,
    reason: string,
    durationHours = 24
  ): Promise<void> {
    const span = this.observability.startTrace('security.emergencyBlockIp', {
      ipAddress,
      durationHours,
    });
    
    try {
      const securityPolicy = this.computeClient.securityPolicy(this.securityPolicyName);
      
      // Add a new rule at high priority to block the IP
      await securityPolicy.addRule({
        priority: 100, // High priority
        description: `Emergency block: ${reason}`,
        match: {
          versionedExpr: 'SRC_IPS_V1',
          config: {
            srcIpRanges: [ipAddress],
          },
        },
        action: 'deny(403)',
      });
      
      // Log the emergency block
      this.logger.warn(`Emergency IP block applied to ${ipAddress} for ${durationHours} hours: ${reason}`);
      
      // Schedule rule removal (in a real implementation, this would use Cloud Scheduler)
      this.scheduleEmergencyRuleRemoval(100, durationHours);
      
      span.end();
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`Failed to apply emergency IP block: ${error.message}`, error.stack);
      this.observability.error('Emergency IP block failed', error, CloudArmorService.name);
      
      throw error;
    }
  }
  
  /**
   * Schedule the removal of an emergency rule
   */
  private scheduleEmergencyRuleRemoval(priority: number, durationHours: number): void {
    // In a real implementation, this would create a Cloud Scheduler job
    // For this example, we'll just log the intent
    
    this.logger.log(`Would schedule removal of emergency rule (priority ${priority}) in ${durationHours} hours`);
  }
}