import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Import Firestore configuration
import { FirestoreConfigService } from '../config/firestore.config';

// Import repository implementations
import { YourEntityRepository } from './your-entity.repository';

// Import services
import { YourEntityService } from './your-entity.service';

// Import controllers
import { YourEntityController } from './your-entity.controller';

/**
 * Template for a module using Firestore repositories
 *
 * This shows the proper way to configure a module with Firestore repositories
 * in a Google Cloud native architecture.
 */
@Module({
  imports: [
    // Make configuration available to services
    ConfigModule,
  ],
  controllers: [YourEntityController],
  providers: [
    // Firestore configuration service
    FirestoreConfigService,

    // Repositories
    YourEntityRepository,

    // Services
    YourEntityService,
  ],
  exports: [
    // Export services for use in other modules
    YourEntityService,
  ],
})
export class YourEntityModule {}
