/**
 * Storage Module Public API
 *
 * This file defines the public interface of the Storage module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Re-export module
export { StorageModule } from './storage.module';

// Re-export DTOs
export { SignedUrlRequestDto } from './dto/signed-url-request.dto';
export { SignedUrlResponseDto } from './dto/signed-url-response.dto';

// Note: This module is currently minimal with primarily DTOs.
// As the module is developed with services or repositories, they should be exported here.
