# PIM Module Troubleshooting Guide

This guide provides solutions to common issues encountered with the Product Information Management (PIM) module in the Fluxori platform, with a focus on South African e-commerce requirements.

## Table of Contents

1. [General Issues](#general-issues)
2. [Performance Issues](#performance-issues)
3. [Marketplace Integration Problems](#marketplace-integration-problems)
4. [South African Specific Issues](#south-african-specific-issues)
5. [Network and Load Shedding Problems](#network-and-load-shedding-problems)
6. [Data Synchronization Issues](#data-synchronization-issues)
7. [AI Feature Limitations](#ai-feature-limitations)
8. [Troubleshooting Tools](#troubleshooting-tools)
9. [Support Resources](#support-resources)

## General Issues

### Products Not Appearing in Search Results

**Problem**: Products created or updated are not appearing in search results.

**Solutions**:

1. **Check Product Status**: Verify the product's status is set to `active`.
2. **Indexing Delay**: There may be a delay before products are indexed for search. Allow 5-10 minutes.
3. **Search Filters**: Check if any search filters are excluding your products.

**Diagnostic Steps**:

```javascript
// Check if product is active
const product = await ProductApi.getProductById("product-id");
console.log("Product status:", product.status);

// Try direct ID lookup instead of search
try {
  const product = await ProductApi.getProductById("product-id");
  console.log("Product exists but may not be indexed:", product);
} catch (error) {
  console.error("Product not found:", error);
}
```

### Missing Product Images

**Problem**: Product images do not appear after upload.

**Solutions**:

1. **Image Processing**: Images may still be processing. Allow a few minutes.
2. **Format Check**: Ensure images are in supported formats (JPG, PNG, WebP).
3. **Size Limits**: Check that images don't exceed size limits (max 10MB per image).
4. **CDN Propagation**: For users in South Africa, CDN propagation may take longer.

**Diagnostic Steps**:

```javascript
// Check the image upload status
const mediaItems = await ProductApi.getProductMediaItems("product-id");
console.log("Media items:", mediaItems);
```

### Product Import Failures

**Problem**: Bulk product imports fail or complete with errors.

**Solutions**:

1. **Check Format**: Ensure CSV/JSON follows the required format.
2. **Required Fields**: Verify all required fields are present (sku, name, etc.).
3. **Data Validation**: Check for data validation errors (invalid prices, etc.).
4. **File Size**: Large imports (>5000 products) should be split into smaller batches.

**Diagnostic Steps**:

```
// Detailed import logs can be retrieved with:
GET /pim/import-logs/{importId}
```

## Performance Issues

### Slow Catalog Browsing with Large Product Sets

**Problem**: Poor performance when browsing catalogs with 10,000+ products.

**Solutions**:

1. **Enable Optimization**: Use the catalog optimization endpoint:

   ```javascript
   await ProductApi.optimizeCatalogPerformance({
     prefetchHighTrafficCategories: true,
     precomputeFilters: true,
     optimizeCaching: true,
   });
   ```

2. **Use Pagination**: Always implement pagination with smaller page sizes (20-50 items).

3. **Minimized Data**: Request only needed fields:

   ```javascript
   const products = await ProductApi.searchProducts({
     // ...search options
     fields: ["id", "name", "sku", "pricing", "mainImageUrl"],
   });
   ```

4. **Network-Aware Endpoint**: Use the resilient endpoint for better performance:
   ```javascript
   const products = await ProductApi.getProductsResilient({
     // ...search options
     adaptToNetworkQuality: true,
     minimalFields: true,
   });
   ```

### Slow Batch Operations

**Problem**: Batch operations (updates, deletions) take too long or time out.

**Solutions**:

1. **Optimal Batch Size**: Adjust batch size based on network conditions:

   ```javascript
   // Get recommended batch size
   const networkStatus = await ProductApi.getNetworkStatus();
   const batchSize = networkStatus.recommendedBatchSize;

   // Split operations into batches of this size
   ```

2. **Progressive Updates**: Use smaller, sequential batches instead of one large batch.

3. **Off-peak Operations**: Schedule large batch operations during off-peak hours.

4. **Parallel Processing**: For advanced users, implement parallel processing with multiple smaller batches.

### Memory Usage Issues

**Problem**: High memory usage or out-of-memory errors when working with large catalogs.

**Solutions**:

1. **Virtual Scrolling**: Implement virtual scrolling in frontend product lists.
2. **Pagination**: Always use pagination rather than loading all products.
3. **Memory Monitoring**: Monitor client memory usage and implement cleanup.

**Diagnostic Steps**:

```javascript
// Get catalog metrics to understand scale
const metrics = await ProductApi.getCatalogMetrics();
console.log("Catalog size:", metrics.catalogSizeKB, "KB");
console.log("Total products:", metrics.totalProducts);
```

## Marketplace Integration Problems

### Takealot Sync Failures

**Problem**: Products fail to sync to Takealot marketplace.

**Solutions**:

1. **Validation First**: Always validate before sync:

   ```javascript
   const validation = await ProductApi.validateProductForMarketplace(
     "product-id",
     "takealot-marketplace-id",
   );

   if (!validation.isValid) {
     console.error("Validation issues:", validation.errors);
   }
   ```

2. **Common Takealot Issues**:

   - **GTIN/Barcode**: Ensure valid barcode format
   - **Category**: Verify Takealot category mapping
   - **Offer System**: Check offer system compatibility
   - **Images**: Ensure at least one image is provided

3. **Rate Limiting**: Takealot has strict API rate limits. Implement exponential backoff.

### WooCommerce Integration Issues

**Problem**: WooCommerce sync is inconsistent or fails.

**Solutions**:

1. **Authentication**: Verify API credentials are still valid.
2. **URL Accessibility**: Ensure the WooCommerce site is accessible from Fluxori servers.
3. **Plugin Compatibility**: Verify WooCommerce REST API plugin version.
4. **Network Stability**: For South African sites, use the resilient sync endpoints.

### Cross-Marketplace Consistency Issues

**Problem**: Product data becomes inconsistent across different marketplaces.

**Solutions**:

1. **Master Source**: Use PIM as the single source of truth.
2. **Scheduled Sync**: Set up regular synchronization schedules.
3. **Audit Logs**: Review sync history to identify when divergence occurred:

   ```javascript
   const syncHistory = await ProductApi.getProductSyncHistory(
     "product-id",
     "marketplace-id",
   );
   ```

4. **Conflict Resolution**: Use the conflict resolution tools when needed:
   ```javascript
   // Resolve conflicts in favor of PIM data
   await ProductApi.resolveConflicts("product-id", {
     resolutionStrategy: "use_pim_data",
   });
   ```

## South African Specific Issues

### VAT Calculation Discrepancies

**Problem**: VAT calculations differ between PIM and marketplaces.

**Solutions**:

1. **VAT Setting**: Ensure VAT included/excluded setting is consistent:

   ```javascript
   // Update product to explicitly set VAT inclusion
   await ProductApi.updateProduct("product-id", {
     pricing: {
       vatIncluded: true,
       vatRate: 0.15, // 15% South African VAT
     },
   });
   ```

2. **Rounding Differences**: Check for rounding differences in tax calculations.
3. **Historical VAT Changes**: Be aware of historical VAT rate changes when viewing older orders.

### Multi-Warehouse Allocation Issues

**Problem**: Stock is not correctly allocated across multiple South African warehouses.

**Solutions**:

1. **Warehouse Priority**: Check warehouse priority settings:

   ```javascript
   await ProductApi.updateProductWarehouseSettings("product-id", {
     warehousePriorities: [
       { warehouseId: "jhb-warehouse", priority: 1 },
       { warehouseId: "cpt-warehouse", priority: 2 },
     ],
   });
   ```

2. **Regional Settings**: Verify regional shipping settings for each warehouse.
3. **Stock Transfer**: If needed, transfer stock between warehouses:
   ```javascript
   await ProductApi.transferStock({
     productId: "product-id",
     fromWarehouseId: "source-warehouse",
     toWarehouseId: "destination-warehouse",
     quantity: 10,
   });
   ```

### South African Compliance Fields Missing

**Problem**: South African compliance fields are missing or incorrect.

**Solutions**:

1. **ICASA Approval**: For electronic devices, add ICASA approval:

   ```javascript
   await ProductApi.updateProduct("product-id", {
     saCompliance: {
       icasaApproved: true,
       icasaNumber: "TA-YYYY/NNNN",
     },
   });
   ```

2. **Required Certifications**: Add other required certifications:

   ```javascript
   await ProductApi.updateProduct("product-id", {
     saCompliance: {
       sansCompliant: true,
       nrcsApproved: true,
     },
   });
   ```

3. **Import Regulations**: For imported goods, add import permit information if required.

## Network and Load Shedding Problems

### Operations Failing During Load Shedding

**Problem**: API operations fail during load shedding power outages.

**Solutions**:

1. **Check Load Shedding Status**:

   ```javascript
   const status = await ProductApi.getLoadSheddingStatus();
   if (status.isActive) {
     console.log(`Load shedding active: Stage ${status.stage}`);
     // Implement appropriate UI feedback
   }
   ```

2. **Queue Operations**: Use queue mode during outages:

   ```javascript
   await ProductApi.updateProduct("product-id", updatedData, {
     queueIfOffline: true,
   });
   ```

3. **Offline Mode**: Implement offline-first functionality:

   ```javascript
   await ProductApi.enableOfflineMode({
     cacheProducts: true,
     syncOnReconnect: true,
     lowBandwidthMode: true,
   });
   ```

4. **Battery Backup**: Ensure servers/devices have UPS backup for critical operations.

### Slow or Unreliable Network Performance

**Problem**: Operations are slow or fail due to poor South African network conditions.

**Solutions**:

1. **Network-Aware API Calls**:

   ```javascript
   const searchResult = await ProductApi.searchProductsResilient({
     search: "keyword",
     adaptToNetworkQuality: true,
     cacheResults: true,
     cacheTtlSeconds: 3600, // 1 hour
   });
   ```

2. **Compressed Data Mode**:

   ```javascript
   await ProductApi.setNetworkOptimizations({
     compressResponses: true,
     minimizePayloads: true,
   });
   ```

3. **Progressive Loading**: Implement progressive loading patterns:
   ```javascript
   const results = await ProductApi.searchProducts({
     // ... search params
     progressiveLoading: true,
     criticalFieldsFirst: true,
   });
   ```

### Synchronization Queue Backlog

**Problem**: Operations queued during offline periods aren't processing after connectivity returns.

**Solutions**:

1. **Check Queue Status**:

   ```javascript
   const queueStatus = await ProductApi.getQueueStatus();
   console.log(`Queued operations: ${queueStatus.queuedOperations}`);
   ```

2. **Force Processing**:

   ```javascript
   await ProductApi.processQueue({
     priority: "high",
     forceBatchSize: 10,
   });
   ```

3. **Clear Problematic Items**:
   ```javascript
   await ProductApi.removeFromQueue("operation-id");
   ```

## Data Synchronization Issues

### Conflict Resolution

**Problem**: Conflicts between PIM data and marketplace data.

**Solutions**:

1. **View Conflicts**:

   ```javascript
   const conflicts = await ProductApi.getSyncConflicts("product-id");
   console.log("Conflicts:", conflicts);
   ```

2. **Resolve Individual Conflicts**:

   ```javascript
   await ProductApi.resolveSyncConflict("conflict-id", {
     resolution: "use_pim_data", // or 'use_marketplace_data'
   });
   ```

3. **Bulk Resolve Conflicts**:
   ```javascript
   await ProductApi.bulkResolveSyncConflicts({
     productIds: ["id1", "id2", "id3"],
     strategy: "use_pim_data",
   });
   ```

### Data Export/Import Issues

**Problem**: Export or import operations fail or produce incorrect data.

**Solutions**:

1. **Format Validation**: Validate export/import format:

   ```javascript
   await ProductApi.validateImportFile(file, {
     validateOnly: true,
     generateReport: true,
   });
   ```

2. **Field Mapping**: Check field mappings for imports:

   ```javascript
   await ProductApi.importProducts(file, {
     fieldMapping: {
       "Product Name": "name",
       "Product Code": "sku",
       // ...other mappings
     },
   });
   ```

3. **Incremental Sync**: Use incremental syncing for large catalogs:
   ```javascript
   await ProductApi.incrementalSync({
     lastSyncTimestamp: lastSyncDate,
     conflictStrategy: "newer_wins",
   });
   ```

## AI Feature Limitations

### AI Credit Usage and Limits

**Problem**: AI features stop working due to reaching credit limits.

**Solutions**:

1. **Check Credit Usage**:

   ```javascript
   const creditStatus = await ProductAiApi.getCreditStatus();
   console.log(
     `Used: ${creditStatus.used}, Remaining: ${creditStatus.remaining}`,
   );
   ```

2. **Optimize Usage**:

   ```javascript
   // Generate descriptions with optimized token usage
   await ProductAiApi.generateProductDescription({
     productInfo: {
       // ... product details
     },
     options: {
       optimizeTokenUsage: true,
       maxLength: "short",
     },
   });
   ```

3. **Batch Processing**: Batch AI operations for efficiency:

   ```javascript
   await ProductAiApi.batchGenerateDescriptions({
     products: [
       /* product list */
     ],
     prioritizeEfficiency: true,
   });
   ```

4. **Purchase Additional Credits**: If needed, purchase additional AI credits through the billing system.

### Low Quality AI-Generated Content

**Problem**: AI-generated descriptions, attributes, or variants are low quality.

**Solutions**:

1. **Improve Input Data**:

   ```javascript
   await ProductAiApi.generateProductDescription({
     productInfo: {
       // Include more detailed information
       name: "Product Name",
       category: "Specific Category",
       basicDescription: "Initial high-quality description",
       keyFeatures: ["Feature 1", "Feature 2", "Feature 3"],
       specifications: {
         // Detailed specifications
       },
       targetAudience: "Specific target audience",
     },
   });
   ```

2. **Adjust Generation Parameters**:

   ```javascript
   await ProductAiApi.generateProductDescription({
     // ... product details
     options: {
       tone: "professional",
       includeBulletPoints: true,
       focusOnBenefits: true,
     },
   });
   ```

3. **Human Review**: Implement a review workflow for AI-generated content before publication.

## Troubleshooting Tools

### Diagnostic Endpoints

The PIM module includes several diagnostic endpoints to help troubleshoot issues:

#### System Health Check

```javascript
const healthStatus = await ProductApi.getSystemHealth();
console.log("PIM system health:", healthStatus);

// Example output:
// {
//   status: 'healthy',
//   components: {
//     database: { status: 'healthy', latencyMs: 45 },
//     storage: { status: 'healthy', latencyMs: 120 },
//     ai: { status: 'degraded', message: 'High latency' }
//   },
//   networkQuality: 'good',
//   loadSheddingActive: false
// }
```

#### Performance Metrics

```javascript
const metrics = await ProductApi.getPerformanceMetrics();
console.log("Performance metrics:", metrics);

// Example output:
// {
//   apiLatencyMs: 230,
//   databaseLatencyMs: 45,
//   storageBandwidthMbps: 5.2,
//   activeConnections: 24,
//   memoryUsageMb: 1240,
//   cpuUsagePercent: 35
// }
```

#### Catalog Analysis

```javascript
const analysis = await ProductApi.analyzeCatalog();
console.log("Catalog analysis:", analysis);

// Example output:
// {
//   totalProducts: 15420,
//   catalogSizeKb: 45200,
//   duplicateSkus: 3,
//   missingImages: 142,
//   incompleteProducts: 24,
//   recommendedActions: [
//     { type: 'index_optimization', priority: 'high' },
//     { type: 'complete_missing_data', priority: 'medium' }
//   ]
// }
```

### Log Analysis

Enable detailed logging for troubleshooting:

```javascript
await ProductApi.setLoggingLevel({
  syncOperations: "debug",
  apiOperations: "info",
  databaseOperations: "warning",
});

// To retrieve logs:
const logs = await ProductApi.getLogs({
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
  endTime: new Date(),
  level: "warning",
  limit: 100,
});
```

### Monitoring Tools

Set up monitoring alerts for important metrics:

```javascript
await ProductApi.setMonitoringAlerts({
  syncFailureThreshold: 5, // Alert after 5 sync failures
  apiLatencyThreshold: 500, // Alert if API responds slower than 500ms
  catalogSizeThreshold: 50000, // Alert if catalog exceeds 50K products
  creditUsagePercentThreshold: 80, // Alert at 80% AI credit usage
});
```

## Support Resources

### Getting Help

If you're unable to resolve an issue using this guide, please use the following support resources:

1. **Documentation**: Full API documentation at `/docs/api/pim-api-reference.md`
2. **Community Forum**: https://community.fluxori.com/pim
3. **Support Ticket**: Create a support ticket through the Fluxori dashboard
4. **Email Support**: support@fluxori.com

### Providing Helpful Information

When seeking support, please provide:

1. **Error Messages**: Full error messages and stack traces if available
2. **Reproduction Steps**: Steps to reproduce the issue
3. **Environment**: Details of your environment (browser, OS, network)
4. **Diagnostic Data**: If possible, include diagnostic data:
   ```javascript
   const diagnosticData = await ProductApi.generateDiagnosticReport();
   ```

## Common Error Codes and Resolutions

| Error Code | Description                     | Resolution                                           |
| ---------- | ------------------------------- | ---------------------------------------------------- |
| `PIM_001`  | Invalid product data            | Check required fields and data formats               |
| `PIM_002`  | Duplicate SKU                   | Use a unique SKU or update existing product          |
| `PIM_003`  | Category not found              | Verify category ID exists                            |
| `PIM_004`  | Media upload failed             | Check file format, size, and permissions             |
| `PIM_005`  | Sync conflict detected          | Use conflict resolution tools                        |
| `PIM_006`  | Marketplace validation failed   | Address validation issues before syncing             |
| `PIM_007`  | Rate limit exceeded             | Implement backoff strategy                           |
| `PIM_008`  | Network error                   | Check connectivity and retry with resilient endpoint |
| `PIM_009`  | Load shedding detected          | Use queue mode for operations                        |
| `PIM_010`  | AI credit depleted              | Purchase additional credits                          |
| `PIM_011`  | Invalid variant configuration   | Check attribute combinations                         |
| `PIM_012`  | Batch operation partial failure | Check individual operation status                    |
