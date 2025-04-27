/**
 * Advanced Compliance Framework Service
 *
 * This service provides a flexible, extensible framework for managing product compliance
 * requirements across different regions, regulatory bodies, and marketplaces.
 */

import { Injectable, Logger, Inject } from "@nestjs/common";
import { MarketContextService } from "../../services/market-context.service";
import { ComplianceRuleRepository } from "../../repositories/compliance-rule.repository";
import { ComplianceCheckRepository } from "../../repositories/compliance-check.repository";
import { ComplianceRequirementRepository } from "../../repositories/compliance-requirement.repository";
import { ProductRepository } from "../../repositories/product.repository";
import {
  ComplianceStatus,
  ComplianceCategory,
  ComplianceAuthority,
  ComplianceValidationRule,
  ComplianceRule,
  ComplianceStatusChange,
  ComplianceRequirement,
  ComplianceCheckResult,
  ComplianceCertificate,
  ComplianceCheckOptions,
} from "../interfaces/compliance.types";

/**
 * Service for managing the advanced compliance framework
 */
@Injectable()
export class ComplianceFrameworkService {
  private readonly logger = new Logger(ComplianceFrameworkService.name);

  // In-memory rule cache to reduce database accesses
  private ruleCache: Map<string, ComplianceRule> = new Map();
  private ruleCacheTimestamp: Date = new Date();
  private readonly RULE_CACHE_TTL = 3600000; // 1 hour in milliseconds

  constructor(
    private readonly marketContextService: MarketContextService,
    private readonly complianceRuleRepository: ComplianceRuleRepository,
    private readonly complianceCheckRepository: ComplianceCheckRepository,
    private readonly complianceRequirementRepository: ComplianceRequirementRepository,
    private readonly productRepository: ProductRepository,
    @Inject("PIM_MODULE_OPTIONS") private readonly pimOptions: any,
  ) {
    this.logger.log("Advanced Compliance Framework Service initialized");
  }

  /**
   * Check compliance of a product against all applicable rules
   *
   * @param productId Product ID to check
   * @param options Compliance check options
   * @returns Result of compliance check
   */
  async checkProductCompliance(
    productId: string,
    tenantId: string,
    options: ComplianceCheckOptions = {},
  ): Promise<ComplianceCheckResult[]> {
    // Get product details
    const product = await this.productRepository.findById(productId, tenantId);

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Get market context to determine applicable rules
    const marketContext =
      await this.marketContextService.getMarketContext(tenantId);
    const region = options.region || marketContext.region;

    // Get applicable compliance rules
    const rules = await this.getApplicableRules(
      product.type,
      region,
      options,
      tenantId,
    );

    // Check each rule
    const results: ComplianceCheckResult[] = [];

    for (const rule of rules) {
      const result = await this.checkRuleCompliance(product, rule, tenantId);
      results.push(result);

      // Update compliance requirement
      await this.updateComplianceRequirement(
        productId,
        rule.id,
        result,
        tenantId,
      );
    }

    // Log compliance check
    this.logger.debug(
      `Completed compliance check for product ${productId} with ${results.length} rules`,
    );

    return results;
  }

  /**
   * Get compliance status for a product across all rules
   *
   * @param productId Product ID
   * @param tenantId Tenant ID
   * @returns Summary of compliance status
   */
  async getProductComplianceStatus(
    productId: string,
    tenantId: string,
  ): Promise<{
    overall: ComplianceStatus;
    requirementCount: number;
    compliantCount: number;
    nonCompliantCount: number;
    pendingCount: number;
    exemptCount: number;
    notApplicableCount: number;
    criticalIssues: number;
    highIssues: number;
    requirements: ComplianceRequirement[];
  }> {
    // Get all requirements for product
    const requirements =
      await this.complianceRequirementRepository.findByProduct(
        productId,
        tenantId,
      );

    // Count by status
    const counts = {
      compliant: 0,
      nonCompliant: 0,
      pending: 0,
      exempt: 0,
      notApplicable: 0,
      criticalIssues: 0,
      highIssues: 0,
    };

    // Count issues by status and severity
    for (const req of requirements) {
      switch (req.status) {
        case ComplianceStatus.COMPLIANT:
          counts.compliant++;
          break;
        case ComplianceStatus.NON_COMPLIANT:
          counts.nonCompliant++;
          // Get rule to check severity
          const rule = await this.getRuleById(req.ruleId, tenantId);
          if (rule.severity === "critical") {
            counts.criticalIssues++;
          } else if (rule.severity === "high") {
            counts.highIssues++;
          }
          break;
        case ComplianceStatus.PENDING_VERIFICATION:
        case ComplianceStatus.IN_PROGRESS:
          counts.pending++;
          break;
        case ComplianceStatus.EXEMPT:
          counts.exempt++;
          break;
        case ComplianceStatus.NOT_APPLICABLE:
          counts.notApplicable++;
          break;
      }
    }

    // Determine overall status
    let overall = ComplianceStatus.COMPLIANT;

    if (counts.criticalIssues > 0) {
      overall = ComplianceStatus.NON_COMPLIANT;
    } else if (counts.highIssues > 0) {
      overall = ComplianceStatus.NON_COMPLIANT;
    } else if (counts.nonCompliant > 0) {
      overall = ComplianceStatus.NON_COMPLIANT;
    } else if (counts.pending > 0) {
      overall = ComplianceStatus.PENDING_VERIFICATION;
    } else if (requirements.length === 0) {
      overall = ComplianceStatus.NOT_APPLICABLE;
    }

    return {
      overall,
      requirementCount: requirements.length,
      compliantCount: counts.compliant,
      nonCompliantCount: counts.nonCompliant,
      pendingCount: counts.pending,
      exemptCount: counts.exempt,
      notApplicableCount: counts.notApplicable,
      criticalIssues: counts.criticalIssues,
      highIssues: counts.highIssues,
      requirements,
    };
  }

  /**
   * Get applicable compliance rules for a product type and region
   *
   * @param productType Product type
   * @param region Region code
   * @param options Filter options
   * @param tenantId Tenant ID
   * @returns List of applicable compliance rules
   */
  async getApplicableRules(
    productType: string,
    region: string,
    options: ComplianceCheckOptions,
    tenantId: string,
  ): Promise<ComplianceRule[]> {
    // Check cache freshness
    const now = new Date();
    if (
      now.getTime() - this.ruleCacheTimestamp.getTime() >
      this.RULE_CACHE_TTL
    ) {
      this.ruleCache.clear();
      this.ruleCacheTimestamp = now;
    }

    // Filter criteria for rules
    const filters = {
      regionCodes: region,
      productTypes: productType,
    };

    // Add optional filters
    if (options.categories && options.categories.length > 0) {
      filters["category"] = { $in: options.categories };
    }

    if (options.authorities && options.authorities.length > 0) {
      filters["authority"] = { $in: options.authorities };
    }

    if (options.severities && options.severities.length > 0) {
      filters["severity"] = { $in: options.severities };
    }

    // Only include current rules unless specified
    if (!options.includeExpired) {
      filters["expirationDate"] = { $gt: new Date() };
    }

    // Get rules from repository
    const rules = await this.complianceRuleRepository.findByFilters(
      filters,
      tenantId,
    );

    // Update cache with new rules
    for (const rule of rules) {
      this.ruleCache.set(rule.id, rule);
    }

    return rules;
  }

  /**
   * Check if a product complies with a specific rule
   *
   * @param product Product to check
   * @param rule Compliance rule
   * @param tenantId Tenant ID
   * @returns Compliance check result
   */
  private async checkRuleCompliance(
    product: any,
    rule: ComplianceRule,
    tenantId: string,
  ): Promise<ComplianceCheckResult> {
    const validationResults = [];
    let overallCompliance = true;
    const missingRequirements = [];

    // Check required attributes presence
    for (const attr of rule.requiredAttributes) {
      const hasAttribute =
        product.attributes &&
        Object.prototype.hasOwnProperty.call(product.attributes, attr) &&
        product.attributes[attr] !== null &&
        product.attributes[attr] !== undefined &&
        product.attributes[attr] !== "";

      if (!hasAttribute) {
        missingRequirements.push(attr);
      }
    }

    // Perform validation according to rules
    for (const validationRule of rule.validationRules) {
      let passed = true;
      let message = "";

      switch (validationRule.type) {
        case "attribute_presence":
          // Check if attribute exists
          if (validationRule.attribute) {
            passed =
              product.attributes &&
              Object.prototype.hasOwnProperty.call(
                product.attributes,
                validationRule.attribute,
              ) &&
              product.attributes[validationRule.attribute] !== null &&
              product.attributes[validationRule.attribute] !== undefined &&
              product.attributes[validationRule.attribute] !== "";

            message = passed
              ? `Attribute ${validationRule.attribute} is present`
              : validationRule.errorMessage ||
                `Missing required attribute: ${validationRule.attribute}`;
          }
          break;

        case "attribute_value":
          // Check attribute value against condition
          if (validationRule.attribute && validationRule.validationExpression) {
            const attrValue = product.attributes?.[validationRule.attribute];

            if (attrValue !== undefined) {
              try {
                // Simple expression evaluation for common patterns
                // Note: In a real system, use a proper expression evaluator with security controls
                const expr = validationRule.validationExpression.replace(
                  "value",
                  JSON.stringify(attrValue),
                );
                passed = eval(expr); // eslint-disable-line no-eval
                message = passed
                  ? `Value of ${validationRule.attribute} is valid`
                  : validationRule.errorMessage ||
                    `Invalid value for ${validationRule.attribute}`;
              } catch (error) {
                this.logger.error(
                  `Error evaluating validation expression: ${error.message}`,
                );
                passed = false;
                message = `Error evaluating compliance rule: ${error.message}`;
              }
            } else {
              passed = false;
              message = `Attribute ${validationRule.attribute} is missing for validation`;
            }
          }
          break;

        case "file_presence":
          // Check if required file/document exists
          if (validationRule.attribute) {
            const fileAttr = product.attributes?.[validationRule.attribute];
            passed =
              fileAttr &&
              typeof fileAttr === "string" &&
              fileAttr.trim() !== "";
            message = passed
              ? `File ${validationRule.attribute} is present`
              : validationRule.errorMessage ||
                `Missing required file: ${validationRule.attribute}`;
          }
          break;

        case "certificate_validity":
          // Check certificate validity
          if (validationRule.attribute) {
            const certId = product.attributes?.[validationRule.attribute];

            if (certId) {
              // In a real implementation, check certificate validity from a certificate service
              const today = new Date();
              const mockCertValid = Math.random() > 0.2; // Simulate 80% valid certificates

              passed = mockCertValid;
              message = passed
                ? `Certificate ${certId} is valid`
                : validationRule.errorMessage ||
                  `Certificate ${certId} is invalid or expired`;
            } else {
              passed = false;
              message = `Certificate ID not specified for ${validationRule.attribute}`;
            }
          }
          break;

        case "custom":
          // Custom validation would call out to custom validation logic
          this.logger.debug(
            `Custom validation not implemented for rule ${validationRule.id}`,
          );
          passed = false;
          message = "Custom validation not implemented";
          break;
      }

      validationResults.push({
        passed,
        rule: validationRule,
        message,
        attributes: validationRule.attribute
          ? {
              [validationRule.attribute]:
                product.attributes?.[validationRule.attribute],
            }
          : undefined,
      });

      // Update overall compliance
      if (!passed) {
        overallCompliance = false;
      }
    }

    // Generate recommendations
    const recommendations = [];
    if (missingRequirements.length > 0) {
      recommendations.push(
        `Add the following required attributes: ${missingRequirements.join(", ")}`,
      );
    }

    const failedValidations = validationResults.filter((r) => !r.passed);
    for (const validation of failedValidations) {
      recommendations.push(validation.message);
    }

    // Determine status
    let status;
    if (overallCompliance) {
      status = ComplianceStatus.COMPLIANT;
    } else {
      status = ComplianceStatus.NON_COMPLIANT;
    }

    return {
      productId: product.id,
      ruleId: rule.id,
      status,
      validationResults,
      overallCompliance,
      missingRequirements,
      recommendations,
      checkDate: new Date(),
    };
  }

  /**
   * Get a compliance rule by ID
   *
   * @param ruleId Rule ID
   * @param tenantId Tenant ID
   * @returns Compliance rule
   */
  async getRuleById(ruleId: string, tenantId: string): Promise<ComplianceRule> {
    // Check cache first
    if (this.ruleCache.has(ruleId)) {
      return this.ruleCache.get(ruleId);
    }

    // Get from repository
    const rule = await this.complianceRuleRepository.findById(ruleId, tenantId);

    if (!rule) {
      throw new Error(`Compliance rule with ID ${ruleId} not found`);
    }

    // Update cache
    this.ruleCache.set(ruleId, rule);

    return rule;
  }

  /**
   * Update compliance requirement after a check
   *
   * @param productId Product ID
   * @param ruleId Rule ID
   * @param checkResult Check result
   * @param tenantId Tenant ID
   */
  private async updateComplianceRequirement(
    productId: string,
    ruleId: string,
    checkResult: ComplianceCheckResult,
    tenantId: string,
  ): Promise<void> {
    // Find existing requirement
    const existingReq =
      await this.complianceRequirementRepository.findByProductAndRule(
        productId,
        ruleId,
        tenantId,
      );

    if (existingReq) {
      // Update existing requirement
      const statusChange: ComplianceStatusChange = {
        status: checkResult.status,
        date: new Date(),
        userId: "system", // In a real system, use the actual user ID
        notes: checkResult.recommendations.join("; "),
      };

      existingReq.status = checkResult.status;
      existingReq.lastChecked = new Date();
      existingReq.history.push(statusChange);

      await this.complianceRequirementRepository.update(existingReq, tenantId);
    } else {
      // Create new requirement
      const newRequirement: ComplianceRequirement = {
        id: `req_${Date.now()}`, // In a real system, use a proper ID generator
        productId,
        ruleId,
        status: checkResult.status,
        requiredBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in the future
        lastChecked: new Date(),
        history: [
          {
            status: checkResult.status,
            date: new Date(),
            userId: "system", // In a real system, use the actual user ID
            notes: checkResult.recommendations.join("; "),
          },
        ],
      };

      await this.complianceRequirementRepository.create(
        newRequirement,
        tenantId,
      );
    }
  }

  /**
   * Create a new compliance rule
   *
   * @param rule Rule to create
   * @param tenantId Tenant ID
   * @returns Created rule
   */
  async createRule(
    rule: Omit<ComplianceRule, "id" | "createdAt" | "updatedAt">,
    tenantId: string,
  ): Promise<ComplianceRule> {
    const newRule: ComplianceRule = {
      ...rule,
      id: `rule_${Date.now()}`, // In a real system, use a proper ID generator
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdRule = await this.complianceRuleRepository.create(
      newRule,
      tenantId,
    );

    // Update cache
    this.ruleCache.set(createdRule.id, createdRule);

    return createdRule;
  }

  /**
   * Update an existing compliance rule
   *
   * @param ruleId Rule ID
   * @param updates Updates to apply
   * @param tenantId Tenant ID
   * @returns Updated rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<ComplianceRule>,
    tenantId: string,
  ): Promise<ComplianceRule> {
    // Get existing rule
    const existingRule = await this.getRuleById(ruleId, tenantId);

    const updatedRule: ComplianceRule = {
      ...existingRule,
      ...updates,
      updatedAt: new Date(),
    };

    const result = await this.complianceRuleRepository.update(
      updatedRule,
      tenantId,
    );

    // Update cache
    this.ruleCache.set(result.id, result);

    return result;
  }

  /**
   * Delete a compliance rule
   *
   * @param ruleId Rule ID
   * @param tenantId Tenant ID
   */
  async deleteRule(ruleId: string, tenantId: string): Promise<void> {
    await this.complianceRuleRepository.delete(ruleId, tenantId);

    // Remove from cache
    this.ruleCache.delete(ruleId);
  }

  /**
   * Get all compliance rules for a tenant
   *
   * @param tenantId Tenant ID
   * @returns List of compliance rules
   */
  async getAllRules(tenantId: string): Promise<ComplianceRule[]> {
    return this.complianceRuleRepository.findAll(tenantId);
  }

  /**
   * Manually update a product's compliance status for a rule
   *
   * @param productId Product ID
   * @param ruleId Rule ID
   * @param status New status
   * @param userId User making the change
   * @param notes Optional notes
   * @param tenantId Tenant ID
   */
  async updateComplianceStatus(
    productId: string,
    ruleId: string,
    status: ComplianceStatus,
    userId: string,
    notes?: string,
    tenantId?: string,
  ): Promise<void> {
    // Find existing requirement
    const existingReq =
      await this.complianceRequirementRepository.findByProductAndRule(
        productId,
        ruleId,
        tenantId,
      );

    if (!existingReq) {
      throw new Error(
        `Compliance requirement for product ${productId} and rule ${ruleId} not found`,
      );
    }

    // Create status change record
    const statusChange: ComplianceStatusChange = {
      status,
      date: new Date(),
      userId,
      notes,
    };

    // Update requirement
    existingReq.status = status;
    existingReq.history.push(statusChange);

    await this.complianceRequirementRepository.update(existingReq, tenantId);
  }

  /**
   * Get compliance requirements for a product
   *
   * @param productId Product ID
   * @param tenantId Tenant ID
   * @returns List of compliance requirements
   */
  async getRequirementsByProduct(
    productId: string,
    tenantId: string,
  ): Promise<ComplianceRequirement[]> {
    return this.complianceRequirementRepository.findByProduct(
      productId,
      tenantId,
    );
  }

  /**
   * Get compliance history for a product and rule
   *
   * @param productId Product ID
   * @param ruleId Rule ID
   * @param tenantId Tenant ID
   * @returns Compliance history
   */
  async getComplianceHistory(
    productId: string,
    ruleId: string,
    tenantId: string,
  ): Promise<ComplianceStatusChange[]> {
    const requirement =
      await this.complianceRequirementRepository.findByProductAndRule(
        productId,
        ruleId,
        tenantId,
      );

    if (!requirement) {
      return [];
    }

    return requirement.history;
  }
}
