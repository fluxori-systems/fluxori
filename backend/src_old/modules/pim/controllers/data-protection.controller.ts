/**
 * Data Protection Controller
 *
 * This controller provides API endpoints for enhanced data protection features
 * in the PIM module, including personal data protection, consent management,
 * and data subject requests.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FirebaseAuthGuard } from "@common/guards";
import { GetUser } from "@common/decorators";
import {
  DataProtectionService,
  DataProtectionPolicy,
  DataSensitivityLevel,
  ProductScanResult,
  ConsentRecord,
  DataSubjectRequest,
} from "../services/data-protection/data-protection.service";

/**
 * DTO for scanning a product
 */
class ScanProductDto {
  productId: string;
  skipRedaction?: boolean;
  skipFields?: string[];
  onlyFields?: string[];
  region?: string;
}

/**
 * DTO for redacting text
 */
class RedactTextDto {
  text: string;
  infoTypes?: string[];
  replaceWith?: string;
}

/**
 * DTO for creating a data policy
 */
class CreateDataPolicyDto {
  field: string;
  sensitivity: DataSensitivityLevel;
  isPersonalInfo: boolean;
  isOperationallyNecessary: boolean;
  infoType: string;
  redactInLogs: boolean;
  maskInUi: boolean;
  allowExport: boolean;
  retentionPeriodDays: number;
  requiresEncryption: boolean;
  specialHandling?: string;
  applicableRegions: string[];
}

/**
 * DTO for creating a consent record
 */
class CreateConsentDto {
  userId: string;
  scope: string[];
  expirationDate?: Date;
}

/**
 * DTO for creating a data subject request
 */
class CreateDataSubjectRequestDto {
  type:
    | "access"
    | "rectification"
    | "erasure"
    | "restriction"
    | "portability"
    | "objection";
  dataSubjectId: string;
  dataSubjectEmail: string;
  details: string;
}

/**
 * DTO for updating a data subject request status
 */
class UpdateDataSubjectRequestStatusDto {
  status: "pending" | "in_progress" | "completed" | "denied";
  notes?: string;
}

/**
 * Controller for data protection features
 */
@Controller("pim/data-protection")
@UseGuards(FirebaseAuthGuard)
export class DataProtectionController {
  private readonly logger = new Logger(DataProtectionController.name);

  constructor(private readonly dataProtectionService: DataProtectionService) {
    this.logger.log("Data Protection Controller initialized");
  }

  /**
   * Scan a product for sensitive information
   */
  @Post("scan-product")
  async scanProduct(
    @Body() scanDto: ScanProductDto,
    @GetUser() user: any,
  ): Promise<ProductScanResult> {
    try {
      // In a real implementation, this would fetch the product from the repository
      // For now, let's mock a product for demonstration
      const product = {
        id: scanDto.productId,
        name: "Test Product",
        description: "This is a test product",
        customer: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "+27123456789",
          idNumber: "8801015800082", // Mock South African ID
          address: {
            street: "123 Test Street",
            city: "Johannesburg",
            province: "Gauteng",
            postalCode: "2000",
            country: "South Africa",
          },
        },
        payment: {
          cardNumber: "4111111111111111",
          cardCvv: "123",
          cardExpiry: "12/25",
        },
      };

      return this.dataProtectionService.scanProduct(product, user.tenantId, {
        skipRedaction: scanDto.skipRedaction,
        skipFields: scanDto.skipFields,
        onlyFields: scanDto.onlyFields,
        region: scanDto.region,
      });
    } catch (error) {
      this.logger.error(
        `Error scanning product: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to scan product: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Redact sensitive information from text
   */
  @Post("redact-text")
  async redactText(
    @Body() redactDto: RedactTextDto,
    @GetUser() user: any,
  ): Promise<{ original: string; redacted: string }> {
    try {
      const redacted = await this.dataProtectionService.redactText(
        redactDto.text,
        {
          infoTypes: redactDto.infoTypes,
          replaceWith: redactDto.replaceWith,
        },
      );

      return {
        original: redactDto.text,
        redacted,
      };
    } catch (error) {
      this.logger.error(`Error redacting text: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to redact text: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if product data is exportable
   */
  @Get("export-rules/:productId")
  async checkExportRules(
    @Param("productId") productId: string,
    @Query("region") region: string,
    @GetUser() user: any,
  ) {
    try {
      // In a real implementation, this would fetch the product from the repository
      // For now, let's mock a product for demonstration
      const product = {
        id: productId,
        name: "Test Product",
        description: "This is a test product",
        customer: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "+27123456789",
          idNumber: "8801015800082", // Mock South African ID
          address: {
            street: "123 Test Street",
            city: "Johannesburg",
            province: "Gauteng",
            postalCode: "2000",
            country: "South Africa",
          },
        },
        payment: {
          cardNumber: "4111111111111111",
          cardCvv: "123",
          cardExpiry: "12/25",
        },
      };

      return this.dataProtectionService.isProductDataExportable(
        product,
        region || "south-africa",
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error checking export rules: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to check export rules: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prepare a product for export
   */
  @Get("prepare-export/:productId")
  async prepareForExport(
    @Param("productId") productId: string,
    @Query("region") region: string,
    @GetUser() user: any,
  ) {
    try {
      // In a real implementation, this would fetch the product from the repository
      // For now, let's mock a product for demonstration
      const product = {
        id: productId,
        name: "Test Product",
        description: "This is a test product",
        customer: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "+27123456789",
          idNumber: "8801015800082", // Mock South African ID
          address: {
            street: "123 Test Street",
            city: "Johannesburg",
            province: "Gauteng",
            postalCode: "2000",
            country: "South Africa",
          },
        },
        payment: {
          cardNumber: "4111111111111111",
          cardCvv: "123",
          cardExpiry: "12/25",
        },
      };

      return this.dataProtectionService.prepareProductForExport(
        product,
        region || "south-africa",
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error preparing product for export: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to prepare product for export: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all data protection policies
   */
  @Get("policies")
  async getDataPolicies(
    @Query("region") region: string,
    @GetUser() user: any,
  ): Promise<DataProtectionPolicy[]> {
    try {
      return this.dataProtectionService.getDataPolicies(region);
    } catch (error) {
      this.logger.error(
        `Error getting data policies: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get data policies: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Add a new data protection policy
   */
  @Post("policies")
  async addDataPolicy(
    @Body() policyDto: CreateDataPolicyDto,
    @GetUser() user: any,
  ): Promise<DataProtectionPolicy[]> {
    try {
      return this.dataProtectionService.addDataPolicy(policyDto);
    } catch (error) {
      this.logger.error(
        `Error adding data policy: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to add data policy: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if compliance is enabled for a region
   */
  @Get("compliance/:region")
  async checkRegionCompliance(
    @Param("region") region: string,
    @GetUser() user: any,
  ) {
    try {
      const enabled =
        await this.dataProtectionService.isComplianceEnabledForRegion(
          region,
          user.tenantId,
        );

      return {
        region,
        complianceEnabled: enabled,
        complianceFramework:
          region === "south-africa" || region === "za"
            ? "POPIA"
            : ["eu", "europe", "gb", "de", "fr", "it", "es", "nl"].includes(
                  region,
                )
              ? "GDPR"
              : "Standard",
      };
    } catch (error) {
      this.logger.error(
        `Error checking region compliance: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to check region compliance: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a consent record
   */
  @Post("consent")
  async createConsent(
    @Body() consentDto: CreateConsentDto,
    @GetUser() user: any,
  ): Promise<ConsentRecord> {
    try {
      return this.dataProtectionService.createConsentRecord(
        consentDto.userId,
        user.tenantId,
        consentDto.scope,
        consentDto.expirationDate,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error creating consent record: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create consent record: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Withdraw consent
   */
  @Put("consent/:id/withdraw")
  async withdrawConsent(
    @Param("id") consentId: string,
    @GetUser() user: any,
  ): Promise<ConsentRecord> {
    try {
      return this.dataProtectionService.withdrawConsent(
        consentId,
        user.id,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error withdrawing consent: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to withdraw consent: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a data subject request
   */
  @Post("data-subject-request")
  async createDataSubjectRequest(
    @Body() requestDto: CreateDataSubjectRequestDto,
    @GetUser() user: any,
  ): Promise<DataSubjectRequest> {
    try {
      return this.dataProtectionService.createDataSubjectRequest(
        requestDto.type,
        requestDto.dataSubjectId,
        requestDto.dataSubjectEmail,
        requestDto.details,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error creating data subject request: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create data subject request: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update a data subject request status
   */
  @Put("data-subject-request/:id/status")
  async updateDataSubjectRequestStatus(
    @Param("id") requestId: string,
    @Body() updateDto: UpdateDataSubjectRequestStatusDto,
    @GetUser() user: any,
  ): Promise<DataSubjectRequest> {
    try {
      return this.dataProtectionService.updateDataSubjectRequestStatus(
        requestId,
        updateDto.status,
        user.id,
        updateDto.notes,
        user.tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Error updating data subject request: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to update data subject request: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
