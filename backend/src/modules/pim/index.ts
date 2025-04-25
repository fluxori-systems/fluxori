/**
 * Product Information Management (PIM) Module
 *
 * This module provides product information management capabilities for the Fluxori platform.
 * It includes features for product data management, categorization, attribute management,
 * and integration with marketplaces, with specific optimizations for South African e-commerce businesses.
 *
 * The PIM module is the centralized hub for all product information and serves as the
 * source of truth for product data across all sales channels.
 */

// Module
export { PimModule, PimModuleOptions } from './pim.module';

// Controllers
export { ProductController } from './controllers/product.controller';
export { CategoryController } from './controllers/category.controller';
export { AttributeTemplateController } from './controllers/attribute-template.controller';
export { ProductVariantController } from './controllers/product-variant.controller';
export { MarketplaceConnectorController } from './controllers/marketplace-connector.controller';
export { ImportExportController } from './controllers/import-export.controller';
export { ValidationController } from './controllers/validation.controller';
export { TaxRateController } from './controllers/tax-rate.controller';
export { BundleController } from './controllers/bundle.controller';
export { AnalyticsController } from './controllers/analytics.controller';
export { CatalogOptimizationController } from './controllers/catalog-optimization.controller';
export { CategoryClassificationController } from './controllers/category-classification.controller';
export { PricingRuleController } from './controllers/pricing-rule.controller';
export { ProductReviewController } from './controllers/product-review.controller';
export { CompetitivePriceMonitoringController } from './controllers/competitive-price-monitoring.controller';
export { AdvancedImageController } from './controllers/advanced-image.controller';
export { BulkOperationsController } from './controllers/bulk-operations.controller';
export { ReportExportController } from './controllers/report-export.controller';
export { RegionalWarehouseController } from './controllers/regional-warehouse.controller';
export { MultiCurrencyController } from './controllers/multi-currency.controller';
export { AfricanTaxFrameworkController } from './controllers/african-tax-framework.controller';
export { CrossBorderTradeController } from './controllers/cross-border-trade.controller';

// Services
export { ProductService } from './services/product.service';
export { CategoryService } from './services/category.service';
export { AttributeTemplateService } from './services/attribute-template.service';
export { ProductVariantService } from './services/product-variant.service';
export { MarketplaceSyncService } from './services/marketplace-sync.service';
export { MarketplaceValidationService } from './services/marketplace-validation.service';
export { MarketContextService } from './services/market-context.service';
export { NetworkAwareStorageService } from './services/network-aware-storage.service';
export { LoadSheddingResilienceService } from './services/load-shedding-resilience.service';
export { LoadSheddingService } from './services/load-shedding.service';
export { TakealotConnectorService } from './services/takealot-connector.service';
export { ReportExporterService } from './services/report-exporter.service';

// Phase 2: African Expansion Services
export {
  RegionalWarehouseService,
  RegionalWarehouse,
  AllocationStrategy,
} from './services/regional-warehouse.service';
export {
  MultiCurrencyService,
  ExchangeRate,
  CurrencyInfo,
  PriceConversionResult,
  MultiCurrencyConfig,
} from './services/multi-currency.service';
export {
  AfricanTaxFrameworkService,
  AfricanTaxRule,
} from './services/african-tax-framework.service';
export {
  CrossBorderTradeService,
  TradeAgreement,
  ShippingEstimate,
  ShippingMethod,
  ProductCustomsInfo,
  ShipmentStatus,
  DocumentRequirement,
  DocumentType,
  TradeRestriction,
} from './services/cross-border-trade.service';

// Bulk Operations Services
export {
  BulkOperationsService,
  BulkOperationOptions,
  BulkOperationStats,
} from './services/bulk-operations/bulk-operations.service';
export {
  ProductBulkOperationsService,
  ProductBulkOperationType,
  ProductBulkUpdateOperation,
  ProductBulkStatusOperation,
  ProductBulkPriceOperation,
  ProductBulkCategoryOperation,
  ProductBulkInventoryOperation,
  ProductBulkDuplicateOperation,
} from './services/bulk-operations/product-bulk-operations.service';
export {
  CategoryBulkOperationsService,
  CategoryBulkOperationType,
  CategoryBulkUpdateOperation,
  CategoryBulkMoveOperation,
  CategoryBulkMarketplaceMappingOperation,
} from './services/bulk-operations/category-bulk-operations.service';
export {
  AttributeTemplateBulkOperationsService,
  AttributeTemplateBulkUpdateOperation,
  AttributeTemplateBulkAttributeOperation,
  AttributeTemplateBulkMarketplaceMappingOperation,
} from './services/bulk-operations/attribute-template-bulk-operations.service';

// Report exporter
export {
  ReportExporterService,
  ExportFormat,
  ExportStatus,
  ExportOperation,
  ExportOptions,
  ReportBundleOptions,
  ScheduledExport,
} from './services/report-exporter.service';
export { ImportExportService } from './services/import-export.service';
export { ValidationService } from './services/validation.service';
export { TaxRateService } from './services/tax-rate.service';
export { VatServiceFactory } from './services/vat-service.factory';
export { VatService } from './services/vat.service.interface';
export { ProductAiService } from './services/product-ai.service';
export { BundleService } from './services/bundle.service';
export { DynamicPricingService } from './services/dynamic-pricing.service';
export { ProductReviewService } from './services/product-review.service';
export { CompetitivePriceMonitoringService } from './services/competitive-price-monitoring.service';
export { ImageAnalysisService } from './services/image-analysis.service';

// Models/DTOs
export { Product, ProductStatus } from './models/product.model';
export { Category } from './models/category.model';
export { AttributeTemplate } from './models/attribute-template.model';
export { ProductVariant } from './models/product-variant.model';
export {
  Bundle,
  BundleComponent,
  PricingStrategy,
} from './models/bundle.model';
export {
  PricingRule,
  PricingRuleOperation,
  PricingRuleScheduleType,
  PricingRuleExecutionStatus,
  PricingRuleScope,
  PricingRuleConstraints,
  PricingRuleSchedule,
} from './models/pricing-rule.model';

export {
  ProductReview,
  ProductReviewStatus,
  ReviewSource,
  MarketplaceSource,
  ReviewMedia,
  ReviewSentiment,
  ModerationResult,
} from './models/product-review.model';

export {
  CompetitorPrice,
  PriceSourceType,
  PriceVerificationStatus,
  CompetitorStockStatus,
  MarketPosition,
  PriceHistoryRecord,
  PriceMonitoringConfig,
  PriceAlert,
  CompetitorPriceReport,
  DateRange,
} from './models/competitor-price.model';

export {
  ProductImage,
  CompressionQuality,
  ResizeOption,
} from './models/image.model';

export { ImageUploadOptions } from './interfaces/image-upload-options.interface';

export {
  ImageAnalysisResult,
  ImageAttributeDetectionOptions,
} from './services/image-analysis.service';

// Utils
export {
  SouthAfricanVat,
  VatCalculation,
  VatRateSchedule,
} from './utils/south-african-vat';

// Interfaces
export { ProductFilter } from './interfaces/product-filter.interface';
export { CategoryFilter } from './interfaces/category-filter.interface';
export { ImageUploadOptions } from './interfaces/image-upload-options.interface';
export {
  TaxRate,
  TaxType,
  TaxJurisdiction,
  TaxJurisdictionLevel,
  TaxRateSchedule,
  TaxRateRequest,
  TaxRateResult,
  TaxRateService,
} from './interfaces/tax-rate.interface';
export { NetworkQualityInfo, LoadSheddingInfo } from './interfaces/types';
export {
  MarketContext,
  ProductType,
  MarketplaceConnector,
} from './interfaces/types';
export {
  IMarketContextProvider,
  MarketFeature,
} from './interfaces/market-context.interface';
