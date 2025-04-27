# Fluxori Security Module

A comprehensive security module for the Fluxori platform, providing advanced security controls and protections including VPC Service Controls, IAM roles, Secret Manager integration, file security, and more.

## Core Features

### Perimeter Security

- **VPC Service Controls**: Creates security perimeters around Google Cloud resources
- **Cloud Armor WAF**: Web Application Firewall with pre-configured protections
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Geo-Restrictions**: Region-based access controls with South Africa optimizations

### Identity and Access Management

- **IAM Integration**: Management of service accounts and custom roles
- **Service-to-Service Authentication**: Secure interactions between components
- **Emergency Access Controls**: Temporary access provisions with audit logging

### Data Protection

- **Secret Manager**: Secure credential storage and management
- **Data Loss Prevention**: Scanning and protection of sensitive information
- **South African Compliance**: POPIA-specific data protection controls

### File Security

- **Upload Scanning**: Malware detection for all file uploads
- **Content Validation**: File type verification and content analysis
- **Secure Storage Access**: Pre-signed URLs with expiration and scope limits

### Security Monitoring

- **Audit Logging**: Comprehensive security event recording
- **Security Metrics**: Real-time collection of security telemetry
- **Incident Response**: Automated detection and alerting for security events

## Architecture

The Security Module is designed as a core module that integrates with all other Fluxori platform components. It provides:

1. **Security Service**: Central service for security policy evaluation
2. **Credential Manager**: Interface to Google Secret Manager
3. **VPC Service Controls**: Management of GCP security perimeters
4. **DLP Service**: Scanning for sensitive information
5. **File Scanner**: Malware detection for uploaded files
6. **Cloud Armor**: WAF configuration and management
7. **Security Metrics**: Collection and reporting of security telemetry
8. **Security Audit**: Recording and querying of security events

## Usage Examples

### Security Evaluation

```typescript
// Inject the security service
constructor(private readonly securityService: SecurityService) {}

// Create a security context
const securityContext = this.securityService.createSecurityContext(request);

// Evaluate access permission
const result = await this.securityService.evaluateAccess(
  securityContext,
  'read',
  `product:${productId}`
);

if (!result.allowed) {
  throw new ForbiddenException(result.reason);
}
```

### Credential Management

```typescript
// Inject the credential manager
constructor(private readonly credentialManager: CredentialManagerService) {}

// Store a credential
await this.credentialManager.storeCredential(
  'api-key-name',
  'secret-api-key-value',
  { expireInDays: 90 }
);

// Retrieve a credential
const apiKey = await this.credentialManager.getCredential('api-key-name');

// Rotate a credential
const newApiKey = await this.credentialManager.rotateCredential('api-key-name');
```

### Scanning for Sensitive Information

```typescript
// Inject the DLP service
constructor(private readonly dlpService: DlpService) {}

// Scan text for sensitive information
const scanResult = await this.dlpService.scanText(userInput);

if (scanResult.hasSensitiveInfo) {
  console.log(`Found sensitive info types: ${scanResult.infoTypes.join(', ')}`);

  // Redact sensitive information
  const redactedText = await this.dlpService.redactText(userInput);
}
```

## South African Compliance Features

The Security Module includes specific features for South African compliance requirements:

1. **POPIA Compliance**: Controls for personal information protection
2. **Data Residency**: Enforcement of data storage in South African GCP regions
3. **Identity Document Protection**: Special handling for SA ID numbers
4. **Internet Connection Resilience**: Security measures that work with variable connectivity
5. **Region-Specific Security Monitoring**: Tailored security monitoring for South African operations

## Integration Points

The Security Module integrates with other Fluxori modules:

- **Auth Module**: Security controls are applied based on authentication context
- **Feature Flags**: Security features can be toggled via the feature flag system
- **Observability**: Security events are recorded through the observability system
- **Storage**: File operations are secured through the security module
- **Agent Framework**: AI operations are secured with special controls

## Installation

The Security Module is automatically installed as part of the core Fluxori platform.

## Configuration

Configure the Security Module in your `app.module.ts`:

```typescript
SecurityModule.registerWithOptions({
  enableExtendedAuditLogging: true,
  enableCrossModuleSecurityContext: true,
  southAfricanCompliance: {
    enablePopiaControls: true,
    enforceDataResidency: true,
    enhancedPiiProtection: true,
  },
}),
```

## Additional Documentation

For detailed implementations and best practices, see:

- [Security Architecture](../../SECURITY_ARCHITECTURE.md)
- [South African Compliance Guide](../../../docs/southafrican-compliance.md)
