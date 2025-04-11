import { Injectable, Logger, Inject } from '@nestjs/common';
import * as DLP from '@google-cloud/dlp';
import { ConfigService } from '@nestjs/config';

import { ObservabilityService } from '../../../common/observability';

/**
 * Service for data loss prevention and sensitive data protection
 * Uses Google Cloud DLP to identify, classify, and protect sensitive data
 */
@Injectable()
export class DlpService {
  private readonly logger = new Logger(DlpService.name);
  private readonly dlpClient: any;
  private readonly projectId: string;
  
  constructor(
    @Inject('SECURITY_MODULE_OPTIONS') private readonly options: any,
    private readonly configService: ConfigService,
    private readonly observability: ObservabilityService,
  ) {
    this.projectId = this.configService.get<string>('GCP_PROJECT_ID') || '';
    
    // Initialize GCP DLP client
    this.dlpClient = new DLP.DlpServiceClient();
    
    this.logger.log('DLP service initialized');
  }
  
  /**
   * Scan text for sensitive information
   * @param text The text to scan
   * @param config DLP configuration options
   * @returns Results of the scan
   */
  async scanText(
    text: string,
    config?: Record<string, any>
  ): Promise<{ hasSensitiveInfo: boolean; infoTypes: string[] }> {
    const span = this.observability.startTrace('security.scanText', {
      textLength: text.length,
      hasConfig: !!config,
    });
    
    try {
      // Default info types to inspect
      const defaultInfoTypes = [
        { name: 'CREDIT_CARD_NUMBER' },
        { name: 'PHONE_NUMBER' },
        { name: 'EMAIL_ADDRESS' },
        { name: 'PERSON_NAME' },
        { name: 'SOUTH_AFRICA_ID_NUMBER' }, // SA-specific info type
        { name: 'IBAN_CODE' },
        { name: 'IP_ADDRESS' },
        { name: 'PASSWORD' },
        { name: 'API_KEY' },
      ];
      
      // Allow configuration to override or extend the default info types
      const infoTypes = config?.infoTypes || defaultInfoTypes;
      
      // Minimum likelihood setting (how confident the API must be to report a finding)
      const minLikelihood = config?.minLikelihood || 'LIKELY';
      
      // Configure the inspection request
      const request: Record<string, any> = {
        parent: `projects/${this.projectId}/locations/global`,
        inspectConfig: {
          infoTypes,
          minLikelihood,
          includeQuote: false, // Don't include the matched text in the response for security
          limits: {
            maxFindingsPerRequest: 100,
          },
        },
        item: {
          value: text,
        },
      };
      
      // Execute the inspection
      const [response] = await this.dlpClient.inspectContent(request);
      const findings = response.result?.findings || [];
      
      // Extract info types from the findings
      const detectedInfoTypes = findings.map((finding: Record<string, any>) => finding.infoType?.name || 'UNKNOWN');
      
      // Record metrics
      this.observability.incrementCounter('dlp.scan.count');
      if (findings.length > 0) {
        this.observability.incrementCounter('dlp.findings.count', findings.length);
      }
      
      span.setAttribute('dlp.findings.count', findings.length);
      span.end();
      
      // Deduplicate info types using object instead of Set to avoid ES2015 requirement
      const uniqueInfoTypes: Record<string, boolean> = {};
      detectedInfoTypes.forEach((type: string) => { uniqueInfoTypes[type] = true; });
      
      return {
        hasSensitiveInfo: findings.length > 0,
        infoTypes: Object.keys(uniqueInfoTypes),
      };
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`DLP scan failed: ${error.message}`, error.stack);
      this.observability.error('DLP scan failed', error, DlpService.name);
      
      throw new Error(`Failed to scan text for sensitive information: ${error.message}`);
    }
  }
  
  /**
   * Redact sensitive information from text
   * @param text The text to redact
   * @param config Redaction configuration
   * @returns The redacted text
   */
  async redactText(
    text: string,
    config?: {
      infoTypes?: Array<{ name: string }>;
      replaceWith?: string;
    }
  ): Promise<string> {
    const span = this.observability.startTrace('security.redactText', {
      textLength: text.length,
      hasConfig: !!config,
    });
    
    try {
      // Default info types to redact
      const defaultInfoTypes = [
        { name: 'CREDIT_CARD_NUMBER' },
        { name: 'PHONE_NUMBER' },
        { name: 'EMAIL_ADDRESS' },
        { name: 'PERSON_NAME' },
        { name: 'SOUTH_AFRICA_ID_NUMBER' },
        { name: 'PASSWORD' },
        { name: 'API_KEY' },
      ];
      
      // Allow configuration to override or extend the default info types
      const infoTypes = config?.infoTypes || defaultInfoTypes;
      
      // Default replacement character
      const replaceWith = config?.replaceWith || '[REDACTED]';
      
      // Configure the redaction request
      const request: Record<string, any> = {
        parent: `projects/${this.projectId}/locations/global`,
        inspectConfig: {
          infoTypes,
          minLikelihood: 'LIKELY',
        },
        item: {
          value: text,
        },
        deidentifyConfig: {
          infoTypeTransformations: {
            transformations: [
              {
                primitiveTransformation: {
                  replaceWithInfoTypeConfig: {},
                },
              },
            ],
          },
        },
      };
      
      // Add custom replacement string if specified
      if (replaceWith !== '[REDACTED]') {
        request.deidentifyConfig = {
          infoTypeTransformations: {
            transformations: [
              {
                primitiveTransformation: {
                  replaceConfig: {
                    newValue: {
                      stringValue: replaceWith,
                    },
                  },
                },
              },
            ],
          },
        };
      }
      
      // Execute the redaction
      const [response] = await this.dlpClient.deidentifyContent(request);
      const redactedText = response.item?.value || '';
      
      // Record metrics
      this.observability.incrementCounter('dlp.redact.count');
      
      span.end();
      return redactedText;
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`DLP redaction failed: ${error.message}`, error.stack);
      this.observability.error('DLP redaction failed', error, DlpService.name);
      
      // Return the original text if redaction fails, but log the error
      return text;
    }
  }
  
  /**
   * Mask specific pattern in text (e.g., credit card numbers)
   * @param text The text to mask
   * @param pattern The pattern to mask
   * @param maskChar The character to use for masking
   * @returns The masked text
   */
  async maskText(
    text: string,
    pattern: 'CREDIT_CARD_NUMBER' | 'PHONE_NUMBER' | 'EMAIL_ADDRESS' | 'SOUTH_AFRICA_ID_NUMBER',
    maskChar = '*'
  ): Promise<string> {
    const span = this.observability.startTrace('security.maskText', {
      textLength: text.length,
      pattern,
    });
    
    try {
      // Configure the masking request
      const request: Record<string, any> = {
        parent: `projects/${this.projectId}/locations/global`,
        inspectConfig: {
          infoTypes: [{ name: pattern }],
          minLikelihood: 'LIKELY',
        },
        item: {
          value: text,
        },
        deidentifyConfig: {
          infoTypeTransformations: {
            transformations: [
              {
                primitiveTransformation: {
                  characterMaskConfig: {
                    maskingCharacter: maskChar,
                    numberToMask: 0, // Mask all characters
                    reverseOrder: false,
                    charactersToIgnore: [
                      { charactersToSkip: ' -' }, // Don't mask spaces and hyphens
                    ],
                  },
                },
              },
            ],
          },
        },
      };
      
      // Execute the masking
      const [response] = await this.dlpClient.deidentifyContent(request);
      const maskedText = response.item?.value || '';
      
      // Record metrics
      this.observability.incrementCounter('dlp.mask.count');
      
      span.end();
      return maskedText;
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`DLP masking failed: ${error.message}`, error.stack);
      this.observability.error('DLP masking failed', error, DlpService.name);
      
      // Return the original text if masking fails, but log the error
      return text;
    }
  }
  
  /**
   * Scan structured data for sensitive information
   * @param data The data object to scan
   * @returns Results of the scan
   */
  async scanStructuredData(
    data: Record<string, any>
  ): Promise<{ hasSensitiveInfo: boolean; sensitiveFields: string[] }> {
    const span = this.observability.startTrace('security.scanStructuredData');
    
    try {
      // Convert structured data to JSON string
      const jsonString = JSON.stringify(data);
      
      // Scan the JSON string for sensitive information
      const result = await this.scanText(jsonString);
      
      // If sensitive information is found, scan each field to identify which ones contain it
      const sensitiveFields: string[] = [];
      
      if (result.hasSensitiveInfo) {
        // Scan each field individually
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            const fieldResult = await this.scanText(value);
            if (fieldResult.hasSensitiveInfo) {
              sensitiveFields.push(key);
            }
          } else if (typeof value === 'object' && value !== null) {
            // For nested objects, convert to JSON and scan
            const nestedResult = await this.scanText(JSON.stringify(value));
            if (nestedResult.hasSensitiveInfo) {
              sensitiveFields.push(key);
            }
          }
        }
      }
      
      span.end();
      return {
        hasSensitiveInfo: result.hasSensitiveInfo,
        sensitiveFields,
      };
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`Failed to scan structured data: ${error.message}`, error.stack);
      this.observability.error('Structured data scan failed', error, DlpService.name);
      
      throw new Error(`Failed to scan structured data: ${error.message}`);
    }
  }
  
  /**
   * Get the health status of the DLP service
   * @returns Health status
   */
  async getServiceHealth(): Promise<{ status: string; error?: string }> {
    try {
      // Perform a simple test to verify the DLP service is working
      await this.scanText('test@example.com 4111111111111111');
      
      return { status: 'healthy' };
    } catch (error) {
      this.logger.error(`DLP service health check failed: ${error.message}`, error.stack);
      
      return { 
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}