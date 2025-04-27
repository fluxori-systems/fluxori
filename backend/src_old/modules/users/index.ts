/**
 * Users Module Public API
 *
 * This file defines the public interface of the Users module, exporting only what should be
 * accessible to other modules. This ensures proper encapsulation and prevents direct access to
 * internal components.
 */
// Re-export module
export { UsersModule } from "./users.module";

// Re-export repository
export { UserRepository } from "./repositories/user.repository";

// Re-export schemas/types
export { User, UserRole } from "./schemas/user.schema";
