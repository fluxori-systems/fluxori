import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Import services
import { FirestoreConfigService } from '../../config/firestore.config';

// Import repositories
import { UserRepository } from './repositories/user.repository';

/**
 * Users module for managing user entities
 */
@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    // Config
    FirestoreConfigService,
    
    // Repositories
    UserRepository,
  ],
  exports: [UserRepository],
})
export class UsersModule {}