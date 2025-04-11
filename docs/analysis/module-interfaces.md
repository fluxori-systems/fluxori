# Module Interface Analysis

## Summary

Total modules: 15
Modules with index.ts: 5
Modules without index.ts: 10

## Modules With Proper Public API

No modules have a complete public API.

## Modules With Incomplete Public API

### agent-framework
Current exports: 
Missing exports: Agent, agent-frameworkModule

### buybox
Current exports: BuyBoxModule, BuyBoxStatus, BuyBoxHistory, RepricingRule, PriceSourceType, CompetitorPrice, PricingRuleOperation, PricingRuleExecutionStatus, PriceAdjustment, MarketPosition, BuyBoxThreshold, BuyBoxListing, CompetitorListing, BuyBoxMonitoringService, RepricingEngineService, RepricingSchedulerService, BuyBoxStatusRepository, BuyBoxHistoryRepository, RepricingRuleRepository, BuyBoxController, RepricingController
Missing exports: BuyboxMonitoring, RepricingEngine, RepricingScheduler, BuyboxHistory, BuyboxStatus, buyboxModule

### feature-flags
Current exports: 
Missing exports: FeatureFlagCache, FeatureFlag, FeatureFlagAuditLog, FeatureFlag, feature-flagsModule

### marketplaces
Current exports: MarketplaceCredential
Missing exports: MarketplaceSync, MarketplaceCredentials, marketplacesModule

### rag-retrieval
Current exports: RagRetrievalModule, Document, EmbeddingProvider, DocumentType, DocumentStatus, DocumentChunk, EmbeddingProviderType, VectorSearchResult, DocumentSearchQuery, ChunkingOptions, DocumentProcessingResult, DocumentService, EmbeddingService, DocumentChunkingService, CreateDocumentDto, UpdateDocumentDto, CreateEmbeddingProviderDto, UpdateEmbeddingProviderDto, EmbeddingResponse, DocumentRepository, EmbeddingProviderRepository
Missing exports: DocumentChunking, Embedding, rag-retrievalModule

## Modules Without Public API

### ai-insights
Components that should be exported:
- Services: AiModelConfig, CreditSystem, InsightGeneration, Insight
- Models: AiModelConfig, Insight
- Module: ai-insightsModule

### auth
Components that should be exported:
- Services: Auth, FirebaseAuth
- Module: authModule

### international-trade
Components that should be exported:
- Module: international-tradeModule

### inventory
Components that should be exported:
- Services: Inventory, Warehouse
- Models: Product, StockLevel, StockMovement, Warehouse
- Module: inventoryModule

### notifications
Components that should be exported:
- Module: notificationsModule

### order-ingestion
Components that should be exported:
- Module: order-ingestionModule

### organizations
Components that should be exported:
- Module: organizationsModule

### scheduled-tasks
Components that should be exported:
- Module: scheduled-tasksModule

### storage
Components that should be exported:
- Module: storageModule

### users
Components that should be exported:
- Models: User
- Module: usersModule

