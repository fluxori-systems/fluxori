/**
 * Data Protection Service
 *
 * This service provides enhanced data protection features for the PIM module,
 * including sensitive data detection, POPIA (South African data protection law)
 * compliance, and data redaction capabilities.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';

import { DlpService } from '../../../security/services/dlp.service';
import { RegionalConfigurationService } from '../enhanced-regional/regional-configuration.service';
import { MarketContextService } from '../market-context.service';

/**
 * Data sensitivity level
 */
export enum DataSensitivityLevel {
  /** Not sensitive - public information */
  PUBLIC = 'public',

  /** Low sensitivity - internal use */
  INTERNAL = 'internal',

  /** Medium sensitivity - confidential business information */
  CONFIDENTIAL = 'confidential',

  /** High sensitivity - regulated personal information */
  SENSITIVE = 'sensitive',

  /** Highest sensitivity - special category personal information */
  SPECIAL_CATEGORY = 'special_category',
}

/**
 * Data protection policy for a field
 */
export interface DataProtectionPolicy {
  /** Field pattern to match (can use wildcards) */
  field: string;

  /** Sensitivity level of this data */
  sensitivity: DataSensitivityLevel;

  /** Whether this field contains personal information */
  isPersonalInfo: boolean;

  /** Whether this field is required for operating purposes */
  isOperationallyNecessary: boolean;

  /** Information type category */
  infoType: string;

  /** Whether this field should be redacted in logs */
  redactInLogs: boolean;

  /** Whether this field should be masked in UI */
  maskInUi: boolean;

  /** Whether this field can be exported */
  allowExport: boolean;

  /** Maximum retention period in days (0 = no limit) */
  retentionPeriodDays: number;

  /** Whether to encrypt this field (beyond database encryption) */
  requiresEncryption: boolean;

  /** Special handling instructions */
  specialHandling?: string;

  /** Applicable region codes (empty = all regions) */
  applicableRegions: string[];
}

/**
 * Field scan result from DLP
 */
export interface FieldScanResult {
  /** Field name */
  field: string;

  /** Whether sensitive info was found */
  hasSensitiveInfo: boolean;

  /** Detected information types */
  infoTypes: string[];

  /** Data policy that matches this field */
  matchedPolicy?: DataProtectionPolicy;

  /** Risk level for this field */
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';

  /** Whether this field violates policy */
  violatesPolicy: boolean;

  /** Policy violation reason */
  violationReason?: string;
}

/**
 * Product scan result
 */
export interface ProductScanResult {
  /** Product ID */
  productId: string;

  /** Whether sensitive info was found */
  hasSensitiveInfo: boolean;

  /** Field-level results */
  fields: FieldScanResult[];

  /** Overall product risk level */
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';

  /** Whether this product violates policy */
  violatesPolicy: boolean;

  /** Redacted version of the product */
  redactedProduct?: Record<string, any>;

  /** Actions recommended to fix policy violations */
  recommendedActions?: string[];
}

/**
 * Consent record for personal information
 */
export interface ConsentRecord {
  /** Unique ID for this consent record */
  id: string;

  /** User ID that provided consent */
  userId: string;

  /** Organization ID */
  organizationId: string;

  /** When consent was given */
  consentDate: Date;

  /** Scope of the consent */
  scope: string[];

  /** Expiration date of consent */
  expirationDate?: Date;

  /** Whether consent is active */
  isActive: boolean;

  /** Consent withdrawal date */
  withdrawalDate?: Date;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Data subject access request
 */
export interface DataSubjectRequest {
  /** Request ID */
  id: string;

  /** Request type */
  type:
    | 'access'
    | 'rectification'
    | 'erasure'
    | 'restriction'
    | 'portability'
    | 'objection';

  /** Request status */
  status: 'pending' | 'in_progress' | 'completed' | 'denied';

  /** Data subject ID */
  dataSubjectId: string;

  /** Data subject email */
  dataSubjectEmail: string;

  /** Request details */
  details: string;

  /** Date of request */
  requestDate: Date;

  /** Due date for responding */
  dueDate: Date;

  /** Date of completion */
  completionDate?: Date;

  /** Request handler user ID */
  assignedToUserId?: string;

  /** Request history for audit */
  history: Array<{
    /** Action taken */
    action: string;

    /** Date of action */
    date: Date;

    /** User ID that performed the action */
    userId: string;

    /** Notes about the action */
    notes?: string;
  }>;
}

/**
 * Service for enhanced data protection
 */
@Injectable()
export class DataProtectionService {
  private readonly logger = new Logger(DataProtectionService.name);

  // Default data protection policies
  private dataPolicies: DataProtectionPolicy[] = [
    // Identity information
    {
      field: 'customer.firstName',
      sensitivity: DataSensitivityLevel.INTERNAL,
      isPersonalInfo: true,
      isOperationallyNecessary: true,
      infoType: 'PERSON_NAME',
      redactInLogs: true,
      maskInUi: false,
      allowExport: true,
      retentionPeriodDays: 365 * 3, // 3 years
      requiresEncryption: false,
      applicableRegions: [],
    },
    {
      field: 'customer.lastName',
      sensitivity: DataSensitivityLevel.INTERNAL,
      isPersonalInfo: true,
      isOperationallyNecessary: true,
      infoType: 'PERSON_NAME',
      redactInLogs: true,
      maskInUi: false,
      allowExport: true,
      retentionPeriodDays: 365 * 3, // 3 years
      requiresEncryption: false,
      applicableRegions: [],
    },
    {
      field: 'customer.email',
      sensitivity: DataSensitivityLevel.CONFIDENTIAL,
      isPersonalInfo: true,
      isOperationallyNecessary: true,
      infoType: 'EMAIL_ADDRESS',
      redactInLogs: true,
      maskInUi: true,
      allowExport: true,
      retentionPeriodDays: 365 * 3, // 3 years
      requiresEncryption: false,
      applicableRegions: [],
    },
    {
      field: 'customer.phone',
      sensitivity: DataSensitivityLevel.CONFIDENTIAL,
      isPersonalInfo: true,
      isOperationallyNecessary: true,
      infoType: 'PHONE_NUMBER',
      redactInLogs: true,
      maskInUi: true,
      allowExport: true,
      retentionPeriodDays: 365 * 3, // 3 years
      requiresEncryption: false,
      applicableRegions: [],
    },
    {
      field: 'customer.idNumber',
      sensitivity: DataSensitivityLevel.SENSITIVE,
      isPersonalInfo: true,
      isOperationallyNecessary: false,
      infoType: 'SOUTH_AFRICA_ID_NUMBER',
      redactInLogs: true,
      maskInUi: true,
      allowExport: false,
      retentionPeriodDays: 90, // Only keep as long as necessary
      requiresEncryption: true,
      specialHandling: 'Requires special handling under POPIA',
      applicableRegions: ['south-africa', 'za'],
    },

    // Address information
    {
      field: 'customer.address.street',
      sensitivity: DataSensitivityLevel.CONFIDENTIAL,
      isPersonalInfo: true,
      isOperationallyNecessary: true,
      infoType: 'STREET_ADDRESS',
      redactInLogs: true,
      maskInUi: false,
      allowExport: true,
      retentionPeriodDays: 365 * 3, // 3 years
      requiresEncryption: false,
      applicableRegions: [],
    },
    {
      field: 'customer.address.city',
      sensitivity: DataSensitivityLevel.INTERNAL,
      isPersonalInfo: true,
      isOperationallyNecessary: true,
      infoType: 'LOCATION',
      redactInLogs: false,
      maskInUi: false,
      allowExport: true,
      retentionPeriodDays: 365 * 3, // 3 years
      requiresEncryption: false,
      applicableRegions: [],
    },
    {
      field: 'customer.address.postalCode',
      sensitivity: DataSensitivityLevel.INTERNAL,
      isPersonalInfo: true,
      isOperationallyNecessary: true,
      infoType: 'POSTAL_CODE',
      redactInLogs: false,
      maskInUi: false,
      allowExport: true,
      retentionPeriodDays: 365 * 3, // 3 years
      requiresEncryption: false,
      applicableRegions: [],
    },

    // Financial information
    {
      field: 'payment.cardNumber',
      sensitivity: DataSensitivityLevel.SENSITIVE,
      isPersonalInfo: true,
      isOperationallyNecessary: false,
      infoType: 'CREDIT_CARD_NUMBER',
      redactInLogs: true,
      maskInUi: true,
      allowExport: false,
      retentionPeriodDays: 0, // Don't store
      requiresEncryption: true,
      specialHandling: 'Never store full card numbers',
      applicableRegions: [],
    },
    {
      field: 'payment.cardCvv',
      sensitivity: DataSensitivityLevel.SENSITIVE,
      isPersonalInfo: true,
      isOperationallyNecessary: false,
      infoType: 'CREDIT_CARD_CVV',
      redactInLogs: true,
      maskInUi: true,
      allowExport: false,
      retentionPeriodDays: 0, // Don't store
      requiresEncryption: true,
      specialHandling: 'Never store CVV',
      applicableRegions: [],
    },
    {
      field: 'payment.bankAccount',
      sensitivity: DataSensitivityLevel.SENSITIVE,
      isPersonalInfo: true,
      isOperationallyNecessary: false,
      infoType: 'IBAN_CODE',
      redactInLogs: true,
      maskInUi: true,
      allowExport: false,
      retentionPeriodDays: 90, // Only store as long as necessary
      requiresEncryption: true,
      applicableRegions: [],
    },

    // Special category data
    {
      field: 'customer.dateOfBirth',
      sensitivity: DataSensitivityLevel.CONFIDENTIAL,
      isPersonalInfo: true,
      isOperationallyNecessary: false,
      infoType: 'DATE_OF_BIRTH',
      redactInLogs: true,
      maskInUi: false,
      allowExport: false,
      retentionPeriodDays: 365 * 3, // 3 years
      requiresEncryption: false,
      applicableRegions: [],
    },
    {
      field: 'customer.healthInfo',
      sensitivity: DataSensitivityLevel.SPECIAL_CATEGORY,
      isPersonalInfo: true,
      isOperationallyNecessary: false,
      infoType: 'HEALTH_INFORMATION',
      redactInLogs: true,
      maskInUi: true,
      allowExport: false,
      retentionPeriodDays: 90, // Only keep as long as necessary
      requiresEncryption: true,
      specialHandling: 'Special category data under POPIA/GDPR',
      applicableRegions: [],
    },

    // Product metadata (not personal)
    {
      field: 'product.name',
      sensitivity: DataSensitivityLevel.PUBLIC,
      isPersonalInfo: false,
      isOperationallyNecessary: true,
      infoType: 'PRODUCT_METADATA',
      redactInLogs: false,
      maskInUi: false,
      allowExport: true,
      retentionPeriodDays: 0, // No limit
      requiresEncryption: false,
      applicableRegions: [],
    },
    {
      field: 'product.description',
      sensitivity: DataSensitivityLevel.PUBLIC,
      isPersonalInfo: false,
      isOperationallyNecessary: true,
      infoType: 'PRODUCT_METADATA',
      redactInLogs: false,
      maskInUi: false,
      allowExport: true,
      retentionPeriodDays: 0, // No limit
      requiresEncryption: false,
      applicableRegions: [],
    },
  ];

  constructor(
    private readonly dlpService: DlpService,
    private readonly marketContextService: MarketContextService,
    private readonly regionalConfigService: RegionalConfigurationService,
    @Inject('PIM_MODULE_OPTIONS') private readonly pimOptions: any,
  ) {
    this.logger.log('Data Protection Service initialized');
  }

  /**
   * Scan a product for sensitive information
   *
   * @param product The product to scan
   * @param tenantId Tenant ID
   * @param options Scan options
   * @returns Product scan result
   */
  async scanProduct(
    product: Record<string, any>,
    tenantId: string,
    options?: {
      skipRedaction?: boolean;
      skipFields?: string[];
      onlyFields?: string[];
      region?: string;
    },
  ): Promise<ProductScanResult> {
    try {
      // Get market context to determine applicable policies
      const marketContext =
        await this.marketContextService.getMarketContext(tenantId);
      const region = options?.region || marketContext.region;

      // Initialize scan result
      const scanResult: ProductScanResult = {
        productId: product.id,
        hasSensitiveInfo: false,
        fields: [],
        overallRiskLevel: 'low',
        violatesPolicy: false,
        recommendedActions: [],
      };

      // Use DLP to scan product for sensitive data
      const productText = JSON.stringify(product);
      const dlpResult = await this.dlpService.scanText(productText);

      scanResult.hasSensitiveInfo = dlpResult.hasSensitiveInfo;

      // If sensitive information is found, do a detailed field scan
      if (dlpResult.hasSensitiveInfo) {
        // Get fields to scan
        const fieldsToScan: Record<string, any> = {};

        // Helper function to extract field paths from a nested object
        const extractFields = (obj: any, path = '') => {
          if (!obj || typeof obj !== 'object') return;

          for (const [key, value] of Object.entries(obj)) {
            const fieldPath = path ? `${path}.${key}` : key;

            // Skip fields if specified
            if (options?.skipFields?.includes(fieldPath)) continue;

            // Only include specific fields if specified
            if (options?.onlyFields && !options.onlyFields.includes(fieldPath))
              continue;

            if (typeof value === 'string') {
              fieldsToScan[fieldPath] = value;
            } else if (
              typeof value === 'number' ||
              typeof value === 'boolean'
            ) {
              fieldsToScan[fieldPath] = String(value);
            } else if (value instanceof Date) {
              fieldsToScan[fieldPath] = value.toISOString();
            } else if (typeof value === 'object' && value !== null) {
              // Handle nested objects recursively
              extractFields(value, fieldPath);
            }
          }
        };

        extractFields(product);

        // Scan each field
        const fieldResults: FieldScanResult[] = [];

        for (const [field, value] of Object.entries(fieldsToScan)) {
          // Skip empty values
          if (!value) continue;

          // Scan the field value
          const fieldScan = await this.dlpService.scanText(value);

          // Find matching data policy
          const matchedPolicy = this.findMatchingPolicy(field, region);

          // Determine risk level
          const riskLevel = this.determineRiskLevel(fieldScan, matchedPolicy);

          // Check for policy violations
          const violatesPolicy = this.checkPolicyViolation(
            field,
            fieldScan,
            matchedPolicy,
          );

          const fieldResult: FieldScanResult = {
            field,
            hasSensitiveInfo: fieldScan.hasSensitiveInfo,
            infoTypes: fieldScan.infoTypes,
            matchedPolicy,
            riskLevel,
            violatesPolicy,
            violationReason: violatesPolicy
              ? `Field contains sensitive data (${fieldScan.infoTypes.join(', ')})`
              : undefined,
          };

          fieldResults.push(fieldResult);

          // Update overall policy violation status
          if (violatesPolicy) {
            scanResult.violatesPolicy = true;

            // Add recommended action
            scanResult.recommendedActions.push(
              `Remove sensitive information from '${field}': ${fieldScan.infoTypes.join(', ')}`,
            );
          }
        }

        scanResult.fields = fieldResults;

        // Determine overall risk level based on the highest risk field
        if (fieldResults.some((f) => f.riskLevel === 'critical')) {
          scanResult.overallRiskLevel = 'critical';
        } else if (fieldResults.some((f) => f.riskLevel === 'high')) {
          scanResult.overallRiskLevel = 'high';
        } else if (fieldResults.some((f) => f.riskLevel === 'medium')) {
          scanResult.overallRiskLevel = 'medium';
        }

        // Create redacted version if needed
        if (!options?.skipRedaction) {
          scanResult.redactedProduct = await this.createRedactedProduct(
            product,
            fieldResults,
          );
        }
      }

      return scanResult;
    } catch (error) {
      this.logger.error(
        `Error scanning product: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to scan product: ${error.message}`);
    }
  }

  /**
   * Redact sensitive information from text
   *
   * @param text Text to redact
   * @param options Redaction options
   * @returns Redacted text
   */
  async redactText(
    text: string,
    options?: {
      infoTypes?: string[];
      replaceWith?: string;
    },
  ): Promise<string> {
    try {
      // Define default info types to redact
      const defaultInfoTypes = [
        { name: 'PERSON_NAME' },
        { name: 'EMAIL_ADDRESS' },
        { name: 'PHONE_NUMBER' },
        { name: 'CREDIT_CARD_NUMBER' },
        { name: 'SOUTH_AFRICA_ID_NUMBER' },
        { name: 'IBAN_CODE' },
        { name: 'STREET_ADDRESS' },
      ];

      // Use the DLP service to redact the text
      return this.dlpService.redactText(text, {
        infoTypes:
          options?.infoTypes?.map((type) => ({ name: type })) ||
          defaultInfoTypes,
        replaceWith: options?.replaceWith || '[REDACTED]',
      });
    } catch (error) {
      this.logger.error(`Error redacting text: ${error.message}`, error.stack);
      // Return the original text in case of error
      return text;
    }
  }

  /**
   * Mask a specific field pattern
   *
   * @param text Text to mask
   * @param pattern Pattern to mask
   * @param maskChar Character to use for masking
   * @returns Masked text
   */
  async maskSensitiveData(
    text: string,
    pattern:
      | 'CREDIT_CARD_NUMBER'
      | 'PHONE_NUMBER'
      | 'EMAIL_ADDRESS'
      | 'SOUTH_AFRICA_ID_NUMBER',
    maskChar = '*',
  ): Promise<string> {
    try {
      return this.dlpService.maskText(text, pattern, maskChar);
    } catch (error) {
      this.logger.error(
        `Error masking sensitive data: ${error.message}`,
        error.stack,
      );
      // Return the original text in case of error
      return text;
    }
  }

  /**
   * Create a consent record
   *
   * @param userId User ID
   * @param organizationId Organization ID
   * @param scope Scope of consent
   * @param expirationDate Optional expiration date
   * @param tenantId Tenant ID
   * @returns Created consent record
   */
  async createConsentRecord(
    userId: string,
    organizationId: string,
    scope: string[],
    expirationDate: Date | undefined,
    tenantId: string,
  ): Promise<ConsentRecord> {
    // In a real implementation, this would save to a database
    // For demonstration purposes, return a mock record
    const consentRecord: ConsentRecord = {
      id: `consent_${Date.now()}`,
      userId,
      organizationId,
      consentDate: new Date(),
      scope,
      expirationDate,
      isActive: true,
      metadata: {
        createdBy: 'system',
      },
    };

    this.logger.log(
      `Created consent record for user ${userId} with scope: ${scope.join(', ')}`,
    );

    return consentRecord;
  }

  /**
   * Withdraw consent
   *
   * @param consentId Consent record ID
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Updated consent record
   */
  async withdrawConsent(
    consentId: string,
    userId: string,
    tenantId: string,
  ): Promise<ConsentRecord> {
    // In a real implementation, this would update the database
    // For demonstration purposes, return a mock record
    const consentRecord: ConsentRecord = {
      id: consentId,
      userId,
      organizationId: 'org123',
      consentDate: new Date(Date.now() - 86400000), // Yesterday
      scope: ['marketing', 'product-recommendations'],
      isActive: false,
      withdrawalDate: new Date(),
      metadata: {
        withdrawalReason: 'User requested',
      },
    };

    this.logger.log(
      `Withdrew consent for record ${consentId} for user ${userId}`,
    );

    return consentRecord;
  }

  /**
   * Create a data subject request
   *
   * @param type Request type
   * @param dataSubjectId Data subject ID
   * @param dataSubjectEmail Data subject email
   * @param details Request details
   * @param tenantId Tenant ID
   * @returns Created data subject request
   */
  async createDataSubjectRequest(
    type:
      | 'access'
      | 'rectification'
      | 'erasure'
      | 'restriction'
      | 'portability'
      | 'objection',
    dataSubjectId: string,
    dataSubjectEmail: string,
    details: string,
    tenantId: string,
  ): Promise<DataSubjectRequest> {
    // In a real implementation, this would save to a database
    // For demonstration purposes, return a mock record

    // Due date is 30 days from now (POPIA/GDPR requirement)
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30);

    const request: DataSubjectRequest = {
      id: `dsar_${Date.now()}`,
      type,
      status: 'pending',
      dataSubjectId,
      dataSubjectEmail,
      details,
      requestDate: now,
      dueDate,
      history: [
        {
          action: 'created',
          date: now,
          userId: 'system',
          notes: 'Request created',
        },
      ],
    };

    this.logger.log(
      `Created ${type} data subject request for subject ${dataSubjectId}`,
    );

    return request;
  }

  /**
   * Update a data subject request status
   *
   * @param requestId Request ID
   * @param newStatus New status
   * @param userId User ID making the update
   * @param notes Optional notes
   * @param tenantId Tenant ID
   * @returns Updated data subject request
   */
  async updateDataSubjectRequestStatus(
    requestId: string,
    newStatus: 'pending' | 'in_progress' | 'completed' | 'denied',
    userId: string,
    notes: string | undefined,
    tenantId: string,
  ): Promise<DataSubjectRequest> {
    // In a real implementation, this would update the database
    // For demonstration purposes, return a mock record
    const request: DataSubjectRequest = {
      id: requestId,
      type: 'access',
      status: newStatus,
      dataSubjectId: 'user123',
      dataSubjectEmail: 'user@example.com',
      details: 'Request for personal data access',
      requestDate: new Date(Date.now() - 86400000), // Yesterday
      dueDate: new Date(Date.now() + 29 * 86400000), // 29 days from now
      completionDate: newStatus === 'completed' ? new Date() : undefined,
      assignedToUserId: userId,
      history: [
        {
          action: 'created',
          date: new Date(Date.now() - 86400000),
          userId: 'system',
          notes: 'Request created',
        },
        {
          action: `status_changed_to_${newStatus}`,
          date: new Date(),
          userId,
          notes,
        },
      ],
    };

    this.logger.log(
      `Updated data subject request ${requestId} to status: ${newStatus}`,
    );

    return request;
  }

  /**
   * Check if product data is exportable according to policy
   *
   * @param product Product to check
   * @param region Region code
   * @param tenantId Tenant ID
   * @returns Whether the product is exportable and reasons for any restrictions
   */
  async isProductDataExportable(
    product: Record<string, any>,
    region: string,
    tenantId: string,
  ): Promise<{
    exportable: boolean;
    restrictedFields: string[];
    reasons: string[];
  }> {
    try {
      // Scan the product
      const scanResult = await this.scanProduct(product, tenantId, { region });

      // Check if any fields are restricted from export
      const restrictedFields = scanResult.fields
        .filter((field) => {
          return field.matchedPolicy && !field.matchedPolicy.allowExport;
        })
        .map((field) => field.field);

      const exportable = restrictedFields.length === 0;

      // Generate reasons for restrictions
      const reasons = restrictedFields.map((field) => {
        const fieldResult = scanResult.fields.find((f) => f.field === field);
        return `Field '${field}' contains ${fieldResult.infoTypes.join(', ')} and cannot be exported`;
      });

      return {
        exportable,
        restrictedFields,
        reasons,
      };
    } catch (error) {
      this.logger.error(
        `Error checking export rules: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to check export rules: ${error.message}`);
    }
  }

  /**
   * Create an export-safe version of a product
   *
   * @param product Product to prepare for export
   * @param region Region code
   * @param tenantId Tenant ID
   * @returns Export-safe product
   */
  async prepareProductForExport(
    product: Record<string, any>,
    region: string,
    tenantId: string,
  ): Promise<Record<string, any>> {
    try {
      // Scan the product
      const scanResult = await this.scanProduct(product, tenantId, {
        region,
        skipRedaction: true, // We'll do our own redaction
      });

      // Create a deep copy of the product
      const exportProduct = JSON.parse(JSON.stringify(product));

      // Remove or redact fields that can't be exported
      for (const fieldResult of scanResult.fields) {
        if (
          fieldResult.matchedPolicy &&
          !fieldResult.matchedPolicy.allowExport
        ) {
          // Split the field path into segments
          const segments = fieldResult.field.split('.');
          let current = exportProduct;

          // Traverse to the parent object
          for (let i = 0; i < segments.length - 1; i++) {
            if (current[segments[i]] === undefined) break;
            current = current[segments[i]];
          }

          // Remove the field from the parent object
          const lastSegment = segments[segments.length - 1];
          if (current && current[lastSegment] !== undefined) {
            delete current[lastSegment];
          }
        }
      }

      return exportProduct;
    } catch (error) {
      this.logger.error(
        `Error preparing product for export: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to prepare product for export: ${error.message}`);
    }
  }

  /**
   * Check if personal data protection compliance is enabled for a region
   *
   * @param region Region code
   * @param tenantId Tenant ID
   * @returns Whether compliance is enabled
   */
  async isComplianceEnabledForRegion(
    region: string,
    tenantId: string,
  ): Promise<boolean> {
    try {
      // Get region configuration
      const regionConfig = await this.regionalConfigService.getRegionById(
        region,
        tenantId,
      );

      // Check if data protection is enabled for this region
      if (region === 'south-africa' || region === 'za') {
        // South Africa uses POPIA
        return this.isPOPIAComplianceEnabled();
      } else if (
        ['eu', 'europe', 'gb', 'de', 'fr', 'it', 'es', 'nl'].includes(region)
      ) {
        // European regions use GDPR
        return true;
      }

      // Default to enabled
      return true;
    } catch (error) {
      this.logger.error(
        `Error checking region compliance: ${error.message}`,
        error.stack,
      );

      // Default to enabled for safety
      return true;
    }
  }

  /**
   * Add a custom data policy
   *
   * @param policy Data protection policy
   * @returns Updated policies
   */
  addDataPolicy(policy: DataProtectionPolicy): DataProtectionPolicy[] {
    this.dataPolicies.push(policy);
    return this.dataPolicies;
  }

  /**
   * Get all data policies
   *
   * @param region Optional region filter
   * @returns Data protection policies
   */
  getDataPolicies(region?: string): DataProtectionPolicy[] {
    if (region) {
      return this.dataPolicies.filter(
        (policy) =>
          policy.applicableRegions.length === 0 ||
          policy.applicableRegions.includes(region),
      );
    }

    return this.dataPolicies;
  }

  // Private helper methods

  /**
   * Check if POPIA compliance is enabled
   */
  private isPOPIAComplianceEnabled(): boolean {
    // Check the PIM module options
    return this.pimOptions?.enablePopiaCompliance !== false;
  }

  /**
   * Find a matching data policy for a field
   */
  private findMatchingPolicy(
    field: string,
    region: string,
  ): DataProtectionPolicy | undefined {
    // First try to find an exact match
    let policy = this.dataPolicies.find(
      (p) =>
        p.field === field &&
        (p.applicableRegions.length === 0 ||
          p.applicableRegions.includes(region)),
    );

    // If no exact match, try pattern matching
    if (!policy) {
      const normalizedField = field.toLowerCase();

      policy = this.dataPolicies.find((p) => {
        // Convert policy field to regex pattern
        const pattern = p.field
          .toLowerCase()
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');

        const regex = new RegExp(`^${pattern}$`);

        return (
          regex.test(normalizedField) &&
          (p.applicableRegions.length === 0 ||
            p.applicableRegions.includes(region))
        );
      });
    }

    return policy;
  }

  /**
   * Determine risk level based on scan result and policy
   */
  private determineRiskLevel(
    scan: { hasSensitiveInfo: boolean; infoTypes: string[] },
    policy?: DataProtectionPolicy,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (!scan.hasSensitiveInfo) {
      return 'low';
    }

    if (!policy) {
      // No policy but sensitive info found - medium risk
      return 'medium';
    }

    // Determine risk based on sensitivity level and info types
    switch (policy.sensitivity) {
      case DataSensitivityLevel.PUBLIC:
        return 'low';

      case DataSensitivityLevel.INTERNAL:
        return 'low';

      case DataSensitivityLevel.CONFIDENTIAL:
        return 'medium';

      case DataSensitivityLevel.SENSITIVE:
        return 'high';

      case DataSensitivityLevel.SPECIAL_CATEGORY:
        return 'critical';

      default:
        return 'medium';
    }
  }

  /**
   * Check if a field violates policy
   */
  private checkPolicyViolation(
    field: string,
    scan: { hasSensitiveInfo: boolean; infoTypes: string[] },
    policy?: DataProtectionPolicy,
  ): boolean {
    // No sensitive info, no violation
    if (!scan.hasSensitiveInfo) {
      return false;
    }

    // No policy found, consider it a violation if sensitive info is found
    if (!policy) {
      return true;
    }

    // Check if field has a higher sensitivity than policy allows
    if (
      scan.infoTypes.includes('CREDIT_CARD_NUMBER') ||
      scan.infoTypes.includes('CREDIT_CARD_CVV') ||
      scan.infoTypes.includes('SOUTH_AFRICA_ID_NUMBER') ||
      scan.infoTypes.includes('PASSPORT_NUMBER')
    ) {
      // These are always high risk and should only be in fields marked as sensitive
      return (
        policy.sensitivity !== DataSensitivityLevel.SENSITIVE &&
        policy.sensitivity !== DataSensitivityLevel.SPECIAL_CATEGORY
      );
    }

    // For other info types, check against policy
    if (
      policy.sensitivity === DataSensitivityLevel.PUBLIC &&
      scan.hasSensitiveInfo
    ) {
      return true;
    }

    return false;
  }

  /**
   * Create a redacted version of a product
   */
  private async createRedactedProduct(
    product: Record<string, any>,
    fieldResults: FieldScanResult[],
  ): Promise<Record<string, any>> {
    try {
      // Create a deep copy of the product
      const redactedProduct = JSON.parse(JSON.stringify(product));

      // Redact fields that need redaction
      for (const fieldResult of fieldResults) {
        if (
          fieldResult.hasSensitiveInfo &&
          fieldResult.matchedPolicy?.redactInLogs
        ) {
          // Split the field path into segments
          const segments = fieldResult.field.split('.');
          let current = redactedProduct;

          // Traverse to the parent object
          let found = true;
          for (let i = 0; i < segments.length - 1; i++) {
            if (current[segments[i]] === undefined) {
              found = false;
              break;
            }
            current = current[segments[i]];
          }

          // If we found the field, redact it
          if (found) {
            const lastSegment = segments[segments.length - 1];
            if (current && current[lastSegment] !== undefined) {
              if (typeof current[lastSegment] === 'string') {
                // Redact the value
                current[lastSegment] = '[REDACTED]';
              } else if (typeof current[lastSegment] === 'number') {
                // Redact numbers
                current[lastSegment] = 0;
              } else if (typeof current[lastSegment] === 'boolean') {
                // Keep booleans as they are rarely sensitive
                // No change needed
              } else if (current[lastSegment] instanceof Date) {
                // Redact dates
                current[lastSegment] = '[REDACTED DATE]';
              } else if (
                typeof current[lastSegment] === 'object' &&
                current[lastSegment] !== null
              ) {
                // For objects, replace with a placeholder
                current[lastSegment] = { redacted: true };
              }
            }
          }
        }
      }

      return redactedProduct;
    } catch (error) {
      this.logger.error(
        `Error creating redacted product: ${error.message}`,
        error.stack,
      );
      // Return a simpler redacted product in case of error
      return {
        id: product.id,
        redacted: true,
        message: 'Error creating redacted version',
      };
    }
  }
}
