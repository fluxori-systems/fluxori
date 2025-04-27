/**
 * Security Module Public API
 *
 * Exports the security module and its public services and utilities.
 */
// Module
export { SecurityModule } from "./security.module";

// Services
export { SecurityService } from "./services/security.service";
export { DlpService } from "./services/dlp.service";
export { FileScannerService } from "./services/file-scanner.service";
// Credential manager for external connectors
export { CredentialManagerService } from "./services/credential-manager.service";

// Public interfaces
export * from "./interfaces/security.interfaces";
