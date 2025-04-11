import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

// Import services
import { UserRepository } from "./repositories/user.repository";
import { FirestoreConfigService } from "../../config/firestore.config";

// Import repositories

/**
 * Users module for managing user entities
 */
@Module({
  imports: [ConfigModule],
  providers: [
    // Config
    FirestoreConfigService,

    // Repositories
    UserRepository,
  ],
  exports: [UserRepository],
})
export class UsersModule {}
