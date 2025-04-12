# Module Interface Analysis

## Summary

Total modules: 19
Modules with index.ts: 17
Modules without index.ts: 2

## Modules With Proper Public API

No modules have a complete public API.

## Modules With Incomplete Public API

### agent-framework
Current exports: AgentFrameworkModule, AgentService, ModelAdapterFactory, ModelRegistryRepository, AgentConfigRepository, AgentConversationRepository, ModelAdapter, VertexAIModelAdapter, TokenEstimator
Missing exports: Agent, agent-frameworkModule

### ai-insights
Current exports: AIInsightsModule, AIModelConfigService, CreditSystemService, InsightGenerationService, InsightService, AIModelConfigRepository, InsightRepository, AIModelConfig, Insight, IAIModelConfigDocument
Missing exports: AiModelConfig, CreditSystem, InsightGeneration, AiModelConfig, ai-insightsModule

### auth
Current exports: AuthModule, AuthService, FirebaseAuthService, FirebaseAuthGuard, GetUser, Public, LoginDto, RegisterDto
Missing exports: Auth, FirebaseAuth, authModule

### buybox
Current exports: BuyBoxModule, BuyBoxStatus, BuyBoxHistory, RepricingRule, PriceSourceType, CompetitorPrice, PricingRuleOperation, PricingRuleExecutionStatus, PriceAdjustment, MarketPosition, BuyBoxThreshold, BuyBoxListing, CompetitorListing, BuyBoxMonitoringService, RepricingEngineService, RepricingSchedulerService, BuyBoxStatusRepository, BuyBoxHistoryRepository, RepricingRuleRepository, BuyBoxController, RepricingController
Missing exports: BuyboxMonitoring, RepricingEngine, RepricingScheduler, BuyboxHistory, BuyboxStatus, buyboxModule

### connectors
Current exports: 
Missing exports: ConnectorFactory, ConnectorCredential, connectorsModule

### credit-system
Current exports: CreditSystemModule, CreditSystemService, TokenTrackingService, CreditCheckRequest, CreditCheckResponse, CreditUsageRequest, CreditUsageType, CreditModelType, TokenUsageCalculation, CreateAllocationDto, AddCreditsDto, CheckCreditsDto, RecordUsageDto, OptimizeModelDto
Missing exports: CreditSystem, TokenTracking, CreditAllocation, CreditPricing, credit-systemModule

### feature-flags
Current exports: FeatureFlagsModule, FeatureFlagService, FeatureFlagCacheService, FeatureFlagRepository, FeatureFlagAuditLogRepository
Missing exports: FeatureFlagCache, FeatureFlag, FeatureFlagAuditLog, FeatureFlag, feature-flagsModule

### international-trade
Current exports: InternationalTradeModule, // Enums
  ShippingMethod, ShipmentStatus, CustomsStatus, ComplianceStatus, IncoTerm, // Interfaces
  IInternationalShipment, IHSCode, ITradeRestriction, IComplianceRequirement, // DTOs
  CreateShipmentDto, UpdateShipmentDto, QueryShipmentsDto, ShipmentResponse
Missing exports: international-tradeModule

### inventory
Current exports: InventoryModule, InventoryService, WarehouseService, ProductRepository, StockLevelRepository, StockMovementRepository, WarehouseRepository, Product, StockLevel, StockMovement, Warehouse
Missing exports: Inventory, inventoryModule

### marketplaces
Current exports: MarketplacesModule, MarketplaceAdapterFactory, MarketplaceSyncService, MarketplaceCredentialsRepository, MarketplaceCredential, MarketplaceCredentials, ConnectionStatus, MarketplaceProduct, StockUpdatePayload, PriceUpdatePayload, StatusUpdatePayload, MarketplaceOrder, MarketplaceOrderItem, Address, OrderAcknowledgment, MarketplaceCategory, PaginatedResponse, OperationResult, ProductFilterOptions, OrderFilterOptions, BaseMarketplaceAdapter
Missing exports: MarketplaceSync, marketplacesModule

### notifications
Current exports: NotificationsModule, NotificationType, NotificationPriority, NotificationStatus, DeliveryChannel, INotification, CreateNotificationDto, UpdateNotificationDto, QueryNotificationsDto, NotificationResponse, NotificationSettings, INotificationDocument, INotificationSettingsDocument
Missing exports: notificationsModule

### order-ingestion
Current exports: OrderIngestionModule, IOrderMapper, IOrderMapperRegistry, OrderMapperRegistry
Missing exports: order-ingestionModule

### organizations
Current exports: OrganizationsModule
Missing exports: organizationsModule

### rag-retrieval
Current exports: RagRetrievalModule, Document, EmbeddingProvider, DocumentType, DocumentStatus, DocumentChunk, EmbeddingProviderType, VectorSearchResult, DocumentSearchQuery, ChunkingOptions, DocumentProcessingResult, DocumentService, EmbeddingService, DocumentChunkingService, CreateDocumentDto, UpdateDocumentDto, CreateEmbeddingProviderDto, UpdateEmbeddingProviderDto, EmbeddingResponse, DocumentRepository, EmbeddingProviderRepository
Missing exports: DocumentChunking, Embedding, rag-retrievalModule

### scheduled-tasks
Current exports: ScheduledTasksModule
Missing exports: scheduled-tasksModule

### security
Current exports: SecurityService, CredentialManagerService, VpcServiceControlsService, FileScannerService, DlpService, CloudArmorService, SecurityMetricsService, SecurityAuditService
Missing exports: CloudArmor, CredentialManager, Dlp, FileScanner, SecurityAudit, SecurityMetrics, Security, VpcServiceControls, securityModule

### storage
Current exports: StorageModule, SignedUrlRequestDto, SignedUrlResponseDto
Missing exports: storageModule

## Modules Without Public API

### interfaces
Components that should be exported:
- Module: interfacesModule

### users
Components that should be exported:
- Models: User
- Module: usersModule

