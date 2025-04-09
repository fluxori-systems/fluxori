/**
 * Core interfaces for the Fluxori Security Module
 */

import { Request } from 'express';
import { Observable } from 'rxjs';

/**
 * Security policy configuration for different components
 */
export interface SecurityPolicyConfig {
  /** Maximum allowed concurrent requests per IP */
  maxConcurrentRequests?: number;
  
  /** Rate limiting configuration */
  rateLimit?: {
    /** Number of requests per time window */
    limit: number;
    /** Time window in seconds */
    windowSecs: number;
    /** Skip rate limiting for these IPs */
    skipIps?: string[];
  };
  
  /** Content security policy configuration */
  csp?: {
    /** Whether to report only (vs enforce) */
    reportOnly?: boolean;
    /** CSP directives */
    directives: Record<string, string[]>;
  };
  
  /** CORS configuration */
  cors?: {
    /** Allowed origins */
    origins: string[];
    /** Allowed methods */
    methods: string[];
    /** Allowed headers */
    headers: string[];
    /** Whether to allow credentials */
    allowCredentials: boolean;
    /** Max age of preflight requests in seconds */
    maxAge?: number;
  };
  
  /** Data Loss Prevention configuration */
  dlp?: {
    /** Enable scanning for PII */
    scanForPii?: boolean;
    /** Enable scanning for credit card info */
    scanForCreditCards?: boolean;
    /** Enable scanning for SA ID numbers */
    scanForSaIdNumbers?: boolean;
    /** Enable redaction of sensitive information */
    enableRedaction?: boolean;
  };
  
  /** File security configuration */
  fileUpload?: {
    /** Maximum file size in bytes */
    maxSizeBytes: number;
    /** Allowed file extensions */
    allowedExtensions: string[];
    /** Scan files for malware */
    scanForMalware?: boolean;
    /** Validate content type matches extension */
    validateContentType?: boolean;
  };
}

/**
 * Security context containing information about the request
 */
export interface SecurityContext {
  /** User ID if authenticated */
  userId?: string;
  /** User roles */
  roles?: string[];
  /** Organization ID */
  organizationId?: string;
  /** Client IP address */
  clientIp?: string;
  /** User agent string */
  userAgent?: string;
  /** Session information */
  session?: {
    /** Session ID */
    id: string;
    /** When the session started */
    createdAt: Date;
    /** Last activity time */
    lastActivity: Date;
  };
  /** Request path */
  path?: string;
  /** Request method */
  method?: string;
  /** Resource ID being accessed */
  resourceId?: string;
  /** Resource type being accessed */
  resourceType?: string;
}

/**
 * Result of a security evaluation
 */
export interface SecurityEvaluationResult {
  /** Whether the action is allowed */
  allowed: boolean;
  /** Reason for decision */
  reason?: string;
  /** Resource level granted if allowed */
  accessLevel?: 'read' | 'write' | 'admin';
  /** Risk score (0-100, higher is riskier) */
  riskScore?: number;
  /** Actions to take (e.g., log, alert, block) */
  actions?: string[];
  /** Additional information about the evaluation */
  metadata?: Record<string, any>;
}

/**
 * Security service for evaluating and enforcing security policies
 */
export interface SecurityService {
  /**
   * Evaluates whether a given security context meets policy requirements
   * @param context The security context to evaluate
   * @param operation The operation being performed
   * @param resource The resource being accessed
   * @returns The security evaluation result
   */
  evaluateAccess(
    context: SecurityContext,
    operation: string,
    resource: string
  ): Promise<SecurityEvaluationResult>;
  
  /**
   * Creates a security context from an Express request
   * @param request The Express request
   * @returns A security context
   */
  createSecurityContext(request: Request): SecurityContext;
  
  /**
   * Validates whether a file meets security requirements
   * @param file The file to validate
   * @param config The security policy configuration
   * @returns Whether the file is valid and any validation messages
   */
  validateFile(
    file: Buffer,
    config: SecurityPolicyConfig
  ): Promise<{ valid: boolean; messages: string[] }>;
  
  /**
   * Scans a file for malware and other security threats
   * @param file The file to scan
   * @returns Scan results including threats detected
   */
  scanFile(
    file: Buffer
  ): Promise<{ clean: boolean; threats: string[] }>;
  
  /**
   * Scans text for sensitive information (PII, credentials, etc.)
   * @param text The text to scan
   * @param config DLP configuration
   * @returns Scan results with detected sensitive information
   */
  scanText(
    text: string,
    config?: Record<string, any>
  ): Promise<{ hasSensitiveInfo: boolean; infoTypes: string[] }>;
  
  /**
   * Apply security headers to an HTTP response
   * @param response The HTTP response
   * @param config Security policy configuration
   */
  applySecurityHeaders(
    response: any,
    config: SecurityPolicyConfig
  ): void;
  
  /**
   * Get security metrics
   * @returns Observable of security metrics
   */
  getSecurityMetrics(): Observable<Record<string, number>>;
  
  /**
   * Log a security event
   * @param event The security event to log
   * @param context The security context
   */
  logSecurityEvent(
    event: string,
    context: SecurityContext
  ): Promise<void>;
}

/**
 * Security health status
 */
export interface SecurityHealthStatus {
  /** Overall security health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Security components status */
  components: {
    /** Name of the component */
    name: string;
    /** Status of the component */
    status: 'healthy' | 'degraded' | 'unhealthy';
    /** Last check time */
    lastChecked: Date;
    /** Error message if unhealthy */
    error?: string;
  }[];
  /** Last security scan time */
  lastScanTime?: Date;
  /** Number of active security incidents */
  activeIncidents: number;
  /** Number of security alerts in the last 24 hours */
  recentAlerts: number;
}

/**
 * Service for managing sensitive credentials
 */
export interface CredentialManagerService {
  /**
   * Get a credential by key
   * @param key The credential key
   * @returns The credential value
   */
  getCredential(key: string): Promise<string>;
  
  /**
   * Store a credential
   * @param key The credential key
   * @param value The credential value
   * @param options Options such as expiration
   */
  storeCredential(
    key: string,
    value: string,
    options?: { expireInDays?: number }
  ): Promise<void>;
  
  /**
   * Rotate a credential
   * @param key The credential key
   * @returns The new credential value
   */
  rotateCredential(key: string): Promise<string>;
  
  /**
   * List available credentials (only returns metadata, not values)
   * @returns List of credential metadata
   */
  listCredentials(): Promise<{ key: string; createdAt: Date; expiresAt?: Date }[]>;
}

/**
 * Security audit record structure
 */
export interface SecurityAuditRecord {
  /** Unique ID for this audit record */
  id: string;
  /** Timestamp when the event occurred */
  timestamp: Date;
  /** The actor (user/service) that performed the action */
  actor: {
    /** ID of the actor */
    id: string;
    /** Type of actor (user, service, system) */
    type: 'user' | 'service' | 'system';
    /** IP address of the actor */
    ip?: string;
  };
  /** The action performed */
  action: string;
  /** The target resource */
  resource: {
    /** Type of resource */
    type: string;
    /** ID of the resource */
    id: string;
  };
  /** Whether the action was allowed */
  outcome: 'allowed' | 'denied';
  /** Reason for the outcome */
  reason?: string;
  /** Additional metadata about the event */
  metadata?: Record<string, any>;
}

/**
 * Security audit service interface
 */
export interface SecurityAuditService {
  /**
   * Record a security audit event
   * @param record The audit record to store
   */
  recordAudit(record: Omit<SecurityAuditRecord, 'id' | 'timestamp'>): Promise<void>;
  
  /**
   * Query audit logs
   * @param query Query parameters
   * @returns Matching audit records
   */
  queryAuditLogs(query: {
    startTime?: Date;
    endTime?: Date;
    actorId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    outcome?: 'allowed' | 'denied';
    limit?: number;
    offset?: number;
  }): Promise<SecurityAuditRecord[]>;
  
  /**
   * Get audit stats by dimension
   * @param dimension The dimension to group by
   * @param timeWindow Time window to analyze
   * @returns Audit statistics
   */
  getAuditStats(
    dimension: 'action' | 'actorId' | 'resourceType' | 'outcome',
    timeWindow: { start: Date; end: Date }
  ): Promise<Record<string, number>>;
}

/**
 * VPC Service Controls configuration
 */
export interface VpcScConfiguration {
  /** Service perimeters to create */
  perimeters: {
    /** Name of the perimeter */
    name: string;
    /** Title of the perimeter */
    title: string;
    /** Description of the perimeter */
    description: string;
    /** Protected services */
    services: string[];
    /** Restricted projects */
    projects: string[];
    /** VPC networks allowed within the perimeter */
    vpcNetworks?: string[];
    /** Explicit ingress rules */
    ingressRules?: Array<{
      /** Source (project/VPC) */
      source: string;
      /** Identity type for ingress */
      identityType?: 'ANY_IDENTITY' | 'ANY_SERVICE_ACCOUNT' | 'ANY_USER_ACCOUNT';
    }>;
    /** Explicit egress rules */
    egressRules?: Array<{
      /** Destination (project/VPC) */
      destination: string;
      /** Identity type for egress */
      identityType?: 'ANY_IDENTITY' | 'ANY_SERVICE_ACCOUNT' | 'ANY_USER_ACCOUNT';
    }>;
  }[];
  
  /** Access level configurations */
  accessLevels: {
    /** Name of the access level */
    name: string;
    /** Title of the access level */
    title: string;
    /** Description of the access level */
    description: string;
    /** IP CIDR ranges to allow */
    ipCidrRanges?: string[];
    /** Whether to require VPN access */
    requireVpn?: boolean;
    /** Required device policy */
    requireCorpDevice?: boolean;
    /** Regions to allow (ISO 3166-1 alpha-2 codes) */
    regions?: string[];
  }[];
}

/**
 * Service for managing VPC Service Controls
 */
export interface VpcServiceControlsService {
  /**
   * Configure VPC Service Controls
   * @param config The VPC SC configuration
   */
  configureServiceControls(config: VpcScConfiguration): Promise<void>;
  
  /**
   * Add an emergency access binding
   * @param email User email to grant emergency access
   * @param durationHours How long the access should last
   * @param reason Reason for emergency access
   */
  grantEmergencyAccess(
    email: string,
    durationHours: number,
    reason: string
  ): Promise<void>;
  
  /**
   * Test VPC Service Controls configuration
   * @returns Validation results
   */
  testServiceControls(): Promise<{
    valid: boolean;
    issues: string[];
  }>;
  
  /**
   * Get current VPC Service Controls status
   * @returns Current status
   */
  getServiceControlsStatus(): Promise<{
    enabled: boolean;
    perimeters: Array<{
      name: string;
      status: 'active' | 'pending' | 'error';
      lastUpdated: Date;
    }>;
  }>;
}

/**
 * Web Application Firewall configuration
 */
export interface WafConfiguration {
  /** Rate limiting configuration */
  rateLimit: {
    /** Requests per minute threshold */
    requestsPerMinute: number;
    /** Ban duration after exceeding threshold (seconds) */
    banDurationSeconds: number;
  };
  
  /** Geographic restrictions */
  geoRestrictions: {
    /** Whether to enable geo-blocking */
    enabled: boolean;
    /** Countries to allow (ISO 3166-1 alpha-2 codes) */
    allowedCountries: string[];
    /** Default is to block countries not in the allowed list */
    blockUnlisted: boolean;
  };
  
  /** OWASP protection settings */
  owaspProtection: {
    /** Whether to enable XSS protection */
    xssProtection: boolean;
    /** Whether to enable SQL injection protection */
    sqlInjectionProtection: boolean;
    /** Whether to enable remote file inclusion protection */
    remoteFileInclusionProtection: boolean;
    /** Whether to enable local file inclusion protection */
    localFileInclusionProtection: boolean;
  };
  
  /** Custom rules */
  customRules: Array<{
    /** Rule name */
    name: string;
    /** Rule priority (lower numbers run first) */
    priority: number;
    /** Expression to match */
    expression: string;
    /** Action to take when matched */
    action: 'allow' | 'deny' | 'throttle';
  }>;
}

/**
 * Security options for the Fluxori Security Module
 */
export interface SecurityModuleOptions {
  /** Whether to enable extended audit logging */
  enableExtendedAuditLogging?: boolean;
  
  /** Whether to enable cross-module security context */
  enableCrossModuleSecurityContext?: boolean;
  
  /** Default security policy configuration */
  defaultPolicyConfig?: SecurityPolicyConfig;
  
  /** VPC Service Controls configuration */
  vpcServiceControls?: VpcScConfiguration;
  
  /** Web Application Firewall configuration */
  wafConfig?: WafConfiguration;
  
  /** Rate limiting configuration */
  rateLimiting?: {
    /** Global rate limits */
    global?: {
      /** Requests per IP per minute */
      requestsPerMinutePerIp: number;
    };
    /** Endpoint-specific rate limits */
    endpoints?: Record<string, {
      /** Requests per minute */
      requestsPerMinute: number;
      /** Whether to scope by IP address */
      scopeByIp: boolean;
      /** Whether to scope by user ID */
      scopeByUser: boolean;
      /** Whether to scope by organization ID */
      scopeByOrganization: boolean;
    }>;
  };
  
  /** South African compliance options */
  southAfricanCompliance?: {
    /** Whether to enable POPIA-specific controls */
    enablePopiaControls: boolean;
    /** Whether to restrict data to South African regions */
    enforceDataResidency: boolean;
    /** Whether to enhance personal information protection */
    enhancedPiiProtection: boolean;
  };
}