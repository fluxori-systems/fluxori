import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Import GCP services
import { FirestoreConfigService } from './config/firestore.config';
import { GoogleCloudStorageService } from './common/storage/google-cloud-storage.service';
import { STORAGE_SERVICE } from './common/storage/storage.interface';
import { ServiceAuthUtils } from './common/utils/service-auth';

// Import modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MarketplacesModule } from './modules/marketplaces/marketplaces.module';
import { OrderIngestionModule } from './modules/order-ingestion/order-ingestion.module';
import { BuyBoxModule } from './modules/buybox/buybox.module';
import { AIInsightsModule } from './modules/ai-insights/ai-insights.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ScheduledTasksModule } from './modules/scheduled-tasks/scheduled-tasks.module';
import { InternationalTradeModule } from './modules/international-trade/international-trade.module';
import { RagRetrievalModule } from './modules/rag-retrieval/rag-retrieval.module';
import { StorageModule } from './modules/storage/storage.module';

// Import global filters, guards, and interceptors
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ServiceAuthInterceptor } from './common/interceptors/service-auth.interceptor';

// Configuration validation schema
import { configValidationSchema } from './config/validation.schema';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      envFilePath: ['.env'],
    }),
    
    // Feature modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    InventoryModule,
    MarketplacesModule,
    OrderIngestionModule,
    BuyBoxModule,
    AIInsightsModule,
    NotificationsModule,
    ScheduledTasksModule,
    InternationalTradeModule,
    RagRetrievalModule,
    StorageModule,
  ],
  providers: [
    // GCP Services
    FirestoreConfigService,
    {
      provide: STORAGE_SERVICE,
      useClass: GoogleCloudStorageService,
    },
    ServiceAuthUtils,
    
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    
    // Service authentication interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ServiceAuthInterceptor,
    },
  ],
  exports: [
    FirestoreConfigService,
    ServiceAuthUtils,
  ],
})
export class AppModule {}