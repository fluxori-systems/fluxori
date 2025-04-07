import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * Organizations module for managing organization entities
 */
@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class OrganizationsModule {}
