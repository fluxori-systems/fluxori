import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * OrderIngestion module for handling order data from various sources
 */
@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class OrderIngestionModule {}
