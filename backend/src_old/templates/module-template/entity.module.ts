import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

// Firestore configuration
import { FirestoreConfigService } from "../../../config/firestore.config";

// Entity components
import { EntityRepository } from "./entity.repository";
import { EntityService } from "./entity.service";
import { EntityController } from "./entity.controller";

/**
 * Module for Entity functionality
 */
@Module({
  imports: [ConfigModule],
  controllers: [EntityController],
  providers: [
    // Configuration
    FirestoreConfigService,

    // Repositories
    EntityRepository,

    // Services
    EntityService,
  ],
  exports: [EntityService],
})
export class EntityModule {}
