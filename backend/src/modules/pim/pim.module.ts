import { DynamicModule, Module, forwardRef, Inject } from '@nestjs/common';
import { AgentFrameworkModule } from '../agent-framework/agent-framework.module';
import { CreditSystemModule } from '../credit-system/credit-system.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';
import { FirestoreConfigService } from '../../config/firestore.config';
import { InventoryModule } from '../inventory/inventory.module';

import { AdvancedImageController } from './controllers/advanced-image.controller';
import { AfricanTaxFrameworkController } from './controllers/african-tax-framework.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { AttributeTemplateController } from './controllers/attribute-template.controller';
import { B2BController } from './controllers/b2b.controller';
import { BulkOperationsController } from './controllers/bulk-operations.controller';
import { BundleController } from './controllers/bundle.controller';
import { CatalogOptimizationController } from './controllers/catalog-optimization.controller';
import { CategoryClassificationController } from './controllers/category-classification.controller';
import { CategoryController } from './controllers/category.controller';
import { ProductController } from './controllers/product.controller';
import { ProductVariantController } from './controllers/product-variant.controller';
import { MarketplaceConnectorController } from './controllers/marketplace-connector.controller';
import { ImportExportController } from './controllers/import-export.controller';
import { ReportExportController } from './controllers/report-export.controller';
import { TaxRateController } from './controllers/tax-rate.controller';
import { ValidationController } from './controllers/validation.controller';
import { PricingRuleController } from './controllers/pricing-rule.controller';
import { ProductReviewController } from './controllers/product-review.controller';
import { CompetitivePriceMonitoringController } from './controllers/competitive-price-monitoring.controller';
import { AttributeTemplateService } from './services/attribute-template.service';
import { CategoryService } from './services/category.service';
import { ProductService } from './services/product.service';
import { ProductVariantService } from './services/product-variant.service';
import { RegionalWarehouseService } from './services/regional-warehouse.service';
import { ReportExporterService } from './services/report-exporter.service';
import { TakealotConnectorService } from './services/takealot-connector.service';
import { ImportExportService } from './services/import-export.service';
import { ValidationService } from './services/validation.service';
import { TaxRateService } from './services/tax-rate.service';
import { VatServiceFactory } from './services/vat-service.factory';
import { BundleService } from './services/bundle.service';
import { DynamicPricingService } from './services/dynamic-pricing.service';
import { ProductReviewService } from './services/product-review.service';
import { CompetitivePriceMonitoringService } from './services/competitive-price-monitoring.service';
import { ImageAnalysisService } from './services/image-analysis.service';
import { ProductRepository } from './repositories/product.repository';
import { CategoryRepository } from './repositories/category.repository';
import { AttributeTemplateRepository } from './repositories/attribute-template.repository';
import { ProductVariantRepository } from './repositories/product-variant.repository';
import { ProductMarketplaceMappingRepository } from './repositories/product-marketplace-mapping.repository';
import { BundleRepository } from './repositories/bundle.repository';
import { PricingRuleRepository } from './repositories/pricing-rule.repository';
import { ProductReviewRepository } from './repositories/product-review.repository';
import { CompetitorPriceRepository } from './repositories/competitor-price.repository';
import { PriceHistoryRepository } from './repositories/price-history.repository';
import { PriceHistoryService } from './services/price-history.service';
import { PriceHistoryController } from './controllers/price-history.controller';
import { PriceMonitoringConfigRepository } from './repositories/price-monitoring-config.repository';
import { PriceAlertRepository } from './repositories/price-alert.repository';
import { ProductAiService } from './services/product-ai.service';
import { MarketplaceSyncService } from './services/marketplace-sync.service';
import { MarketplaceValidationService } from './services/marketplace-validation.service';

import { PimStorageService } from './services/pim-storage.service';
import { MarketContextService } from './services/market-context.service';
import { NetworkAwareStorageService } from './services/network-aware-storage.service';
import { LoadSheddingResilienceService } from './services/load-shedding-resilience.service';
import { OfferController } from './controllers/offer.controller';
import { OfferRepository } from './repositories/offer.repository';
import { LoadSheddingService } from './services/load-shedding.service';
import { MultiCurrencyService } from './services/multi-currency.service';
import { AfricanTaxFrameworkService } from './services/african-tax-framework.service';
import { CrossBorderTradeService } from './services/cross-border-trade.service';
import { CrossBorderTradeController } from './controllers/cross-border-trade.controller';
import { OfferService } from './services/offer.service';
import {
  BulkOperationsService,
  ProductBulkOperationsService,
  CategoryBulkOperationsService,
  AttributeTemplateBulkOperationsService,
} from './services/bulk-operations';
import { RegionalWarehouseController } from './controllers/regional-warehouse.controller';
import { MultiCurrencyController } from './controllers/multi-currency.controller';
import { MobileFirstController } from './controllers/mobile-first.controller';
import { MobileFirstDetectionService } from './services/mobile-first-detection.service';
import { ComplianceFrameworkService } from './services/compliance/compliance-framework.service';
import { ComplianceFrameworkController } from './controllers/compliance-framework.controller';
import { ComplianceRuleRepository } from './repositories/compliance-rule.repository';
import { ComplianceRequirementRepository } from './repositories/compliance-requirement.repository';
import { ComplianceCheckRepository } from './repositories/compliance-check.repository';
import { RegionalConfigurationService } from './services/enhanced-regional/regional-configuration.service';
import { RegionalProductEnhancerService } from './services/enhanced-regional/regional-product-enhancer.service';
import { RegionalConfigurationController } from './controllers/regional-configuration.controller';
import { RegionalProductController } from './controllers/regional-product.controller';
import { RegionalConfigurationRepository } from './repositories/regional-configuration.repository';
import { ProductAttributeRepository } from './repositories/product-attribute.repository';
import { DataProtectionService } from './services/data-protection/data-protection.service';
import { DataProtectionController } from './controllers/data-protection.controller';



import { B2BService } from './services/b2b/b2b-service';
import { B2BCustomerRepository } from './repositories/b2b-customer.repository';
import { CustomerTierRepository } from './repositories/customer-tier.repository';
import { CustomerGroupRepository } from './repositories/customer-group.repository';
import { B2BPriceListRepository } from './repositories/b2b-price-list.repository';
import { B2BContractRepository } from './repositories/b2b-contract.repository';
import { PurchaseOrderRepository } from './repositories/purchase-order.repository';
import { ApprovalWorkflowRepository } from './repositories/approval-workflow.repository';

/**
 * Configuration options for the PIM module
 */
export interface PimModuleOptions {
  /**
   * Whether to enable South African market optimizations
   * @default true
   */
  enableSouthAfricanOptimizations?: boolean;

  /**
   * Whether to enable VAT rate management
   * @default true
   */
  enableVatRateManagement?: boolean;

  /**
   * Whether to enable advanced image processing
   * @default true
   */
  enableAdvancedImageProcessing?: boolean;

  /**
   * Whether to enable AI-powered features
   * @default true
   */
  enableAiFeatures?: boolean;

  /**
   * Whether to enable marketplace synchronization
   * @default true
   */
  enableMarketplaceSync?: boolean;

  /**
   * Whether to enable load shedding resilience
   * @default true
   */
  enableLoadSheddingResilience?: boolean;

  /**
   * Whether to enable dynamic pricing rules
   * @default true
   */
  enableDynamicPricing?: boolean;

  /**
   * Whether to enable product reviews
   * @default true
   */
  enableProductReviews?: boolean;

  /**
   * Whether to enable multi-currency support
   * @default true
   */
  enableMultiCurrency?: boolean;

  /**
   * Whether to enable regional warehouse support
   * @default true
   */
  enableRegionalWarehouse?: boolean;

  /**
   * Whether to enable the African tax framework
   * @default true
   */
  enableAfricanTaxFramework?: boolean;

  /**
   * Whether to enable cross-border trade features
   * @default true
   */
  enableCrossBorderTrade?: boolean;

  /**
   * Whether to enable advanced compliance framework
   * @default true
   */
  enableAdvancedComplianceFramework?: boolean;

  /**
   * Whether to enable extended data protection features with POPIA compliance
   * @default true
   */
  enableExtendedDataProtection?: boolean;

  /**
   * Whether to enable advanced B2B support features
   * @default true
   */
  enableAdvancedB2BSupport?: boolean;
}

/**
 * Product Information Management Module
 *
 * Core module for managing product data, categories, attributes, etc.
 * With specific optimizations for South African e-commerce businesses.
 */
@Module({})
export class PimModule {
  /**
   * Register the PIM module with options
   */
  static register(options: PimModuleOptions = {}): DynamicModule {
    // Set defaults
    const moduleOptions = {
      enableSouthAfricanOptimizations: true,
      enableVatRateManagement: true,
      enableAdvancedImageProcessing: true,
      enableAiFeatures: true,
      enableMarketplaceSync: true,
      enableLoadSheddingResilience: true,
      enableDynamicPricing: true,
      enableProductReviews: true,
      enableMultiCurrency: true,
      enableRegionalWarehouse: true,
      enableAfricanTaxFramework: true,
      enableCrossBorderTrade: true,
      enableAdvancedComplianceFramework: true,
      enableExtendedDataProtection: true,
      enableAdvancedB2BSupport: true,
      ...options,
    };

    return {
      module: PimModule,
      imports: [
        // Import required modules
        AgentFrameworkModule,
        CreditSystemModule,
        FeatureFlagsModule,
        InventoryModule,
      ],
      controllers: [
        ProductController,
        CategoryController,
        AttributeTemplateController,
        ProductVariantController,
        MarketplaceConnectorController,
        ImportExportController,
        ValidationController,
        TaxRateController,
        BundleController,
        AdvancedImageController,
        AnalyticsController,
        CatalogOptimizationController,
        CategoryClassificationController,
        PricingRuleController,
        ProductReviewController,
        CompetitivePriceMonitoringController,
        BulkOperationsController,
        ReportExportController,
        RegionalWarehouseController,
        MultiCurrencyController,
        AfricanTaxFrameworkController,
        CrossBorderTradeController,
        MobileFirstController,
        ComplianceFrameworkController,
        RegionalConfigurationController,
        RegionalProductController,
        PriceHistoryController,
        DataProtectionController,
        ...(moduleOptions.enableAdvancedB2BSupport ? [B2BController] : []),
        OfferController,
      ],
      providers: [
        // Core services
        ProductService,
        FirestoreConfigService,
        CategoryService,
        AttributeTemplateService,
        ProductVariantService,
        
        PimStorageService,
        ImportExportService,
        ValidationService,
        TaxRateService,
        VatServiceFactory,
        BundleService,
        DynamicPricingService,
        ProductReviewService,
        CompetitivePriceMonitoringService,
        ImageAnalysisService,
        PriceHistoryService,

        // Marketplace integration services
        MarketplaceSyncService,
        MarketplaceValidationService,
        TakealotConnectorService,

        // AI services
        ProductAiService,

        // South African optimizations
        MarketContextService,
        NetworkAwareStorageService,
        LoadSheddingResilienceService,
        LoadSheddingService,

        // Bulk operations services
        BulkOperationsService,
        ProductBulkOperationsService,
        CategoryBulkOperationsService,
        AttributeTemplateBulkOperationsService,

        // Analytics and reporting services
        ReportExporterService,
        LoadSheddingService,

        // Phase 2: African Expansion services
        {
          provide: RegionalWarehouseService,
          useClass: RegionalWarehouseService,
        },
        MultiCurrencyService,
        AfricanTaxFrameworkService,
        CrossBorderTradeService,
        MobileFirstDetectionService,

        // Phase 3: Platform Enhancement services
        ComplianceFrameworkService,
        RegionalConfigurationService,
        RegionalProductEnhancerService,
        DataProtectionService,

        // Advanced B2B Support services
        ...(moduleOptions.enableAdvancedB2BSupport ? [B2BService] : []),

        OfferService,
        OfferRepository,

        // Repositories
        ProductRepository,
        CategoryRepository,
        AttributeTemplateRepository,
        ComplianceRuleRepository,
        ComplianceRequirementRepository,
        ComplianceCheckRepository,
        RegionalConfigurationRepository,
        ProductAttributeRepository,
        ProductVariantRepository,
        ProductMarketplaceMappingRepository,
        BundleRepository,
        PricingRuleRepository,
        ProductReviewRepository,
        CompetitorPriceRepository,
        PriceHistoryRepository,
        PriceMonitoringConfigRepository,
        PriceAlertRepository,


        // B2B Repositories
        ...(moduleOptions.enableAdvancedB2BSupport
          ? [
              B2BCustomerRepository,
              CustomerTierRepository,
              CustomerGroupRepository,
              B2BPriceListRepository,
              B2BContractRepository,
              PurchaseOrderRepository,
              ApprovalWorkflowRepository,
            ]
          : []),

        // Module options
        {
          provide: 'PIM_MODULE_OPTIONS',
          useValue: moduleOptions,
        },
        {
          provide: 'InventoryWarehouseService',
          useFactory: (moduleRef) => {
            return moduleRef.get('InventoryModule').WarehouseService;
          },
          inject: ['MODULE_REF'],
        },
        {
          provide: 'MARKET_CONTEXT_OPTIONS',
          useValue: {
            defaultRegion: 'south-africa',
            enabledRegions: ['south-africa', 'africa', 'europe'],
            regionCurrencies: {
              'south-africa': 'ZAR',
              africa: 'USD',
              europe: 'EUR',
              global: 'USD',
            },
            regionalFeatures: {
              'south-africa': {
                loadSheddingResilience: true,
                networkAwareComponents: true,
                multiWarehouseSupport: true,
                marketplaceIntegration: true,
                vatRateManagement: true,
              },
              africa: {
                loadSheddingResilience: true,
                networkAwareComponents: true,
                multiWarehouseSupport: true,
                marketplaceIntegration: true,
                africanTaxFramework: true,
                multiCurrencySupport: true,
                crossBorderTrading: true,
              },
              europe: {
                loadSheddingResilience: false,
                networkAwareComponents: false,
                multiWarehouseSupport: true,
                euVatCompliance: true,
                marketplaceIntegration: true,
                multiCurrencySupport: true,
              },
            },
          },
        },
      ],
      exports: [
        ProductService,
        CategoryService,
        AttributeTemplateService,
        ProductVariantService,
        
        PimStorageService,
        ImportExportService,
        ValidationService,
        TaxRateService,
        VatServiceFactory,
        BundleService,
        DynamicPricingService,
        ProductReviewService,
        CompetitivePriceMonitoringService,
        ImageAnalysisService,
        PriceHistoryService,
        NetworkAwareStorageService,
        LoadSheddingResilienceService,
        MarketContextService,
        MarketplaceSyncService,
        MarketplaceValidationService,
        TakealotConnectorService,

        // Bulk operations services
        BulkOperationsService,
        ProductBulkOperationsService,
        CategoryBulkOperationsService,
        AttributeTemplateBulkOperationsService,
        LoadSheddingService,
        ReportExporterService,

        // Phase 2: African Expansion exports
        RegionalWarehouseService,
        MultiCurrencyService,
        AfricanTaxFrameworkService,
        CrossBorderTradeService,
        MobileFirstDetectionService,

        // Phase 3: Platform Enhancements exports
        ComplianceFrameworkService,
        RegionalConfigurationService,
        RegionalProductEnhancerService,
        DataProtectionService,

        // Advanced B2B Support exports
        ...(moduleOptions.enableAdvancedB2BSupport ? [B2BService] : []),
      ],
    };
  }
}
