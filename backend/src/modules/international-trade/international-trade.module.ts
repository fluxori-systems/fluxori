import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * InternationalTrade module for handling international shipping and compliance
 */
@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class InternationalTradeModule {}
