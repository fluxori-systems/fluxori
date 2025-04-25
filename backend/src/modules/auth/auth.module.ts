import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AuthController } from './controllers/auth.controller';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { AuthService } from './services/auth.service';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { FirestoreConfigService } from '../../config/firestore.config';
import { UserRepository } from '../users/repositories/user.repository';

/**
 * Auth module for handling authentication and authorization
 */
@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [
    // Config
    FirestoreConfigService,

    // Services
    FirebaseAuthService,
    AuthService,

    // Repositories
    UserRepository,

    // Global auth guard
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
  exports: [FirebaseAuthService, AuthService, UserRepository],
})
export class AuthModule {}
