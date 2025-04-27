/**
 * Auth Module Public API
 *
 * This file defines the public interface of the Auth module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */

// Re-export module
export { AuthModule } from "./auth.module";

// Re-export primary services
export { AuthService } from "./services/auth.service";
export { FirebaseAuthService } from "./services/firebase-auth.service";

// Re-export guards (moved to common layer - import from '@common/guards/firebase-auth.guard')

// Re-export decorators (moved to common layer - import from '@common/decorators/get-user.decorator')
export { Public } from "./decorators/public.decorator";

// Re-export DTOs
export { LoginDto } from "./dtos/login.dto";
export { RegisterDto } from "./dtos/register.dto";

// Re-export interfaces
export * from "./interfaces/jwt-payload.interface";
