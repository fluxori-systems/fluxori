# Low-Bandwidth Mode for WooCommerce Connector

## Overview

This document outlines the low-bandwidth mode implementation for the WooCommerce connector in the Fluxori platform. This feature is specifically designed to optimize the connector's performance in South African network conditions, where bandwidth may be limited, expensive, or unreliable.

## Context and Problem Statement

South African e-commerce businesses face several bandwidth-related challenges:

1. **High data costs**: Mobile data in South Africa is relatively expensive
2. **Variable connection speeds**: Many regions experience slow or intermittent connections
3. **Data caps**: Many internet plans have limited data allowances
4. **Mobile-first users**: Many users access e-commerce platforms via mobile networks
5. **Load shedding impact**: Power outages affect network infrastructure reliability

These challenges require a specialized approach to bandwidth management to ensure:

- Minimized data usage while maintaining functionality
- Optimized operation during slow or degraded connections
- Prioritization of critical operations when bandwidth is limited
- Reduced costs for businesses operating in South Africa

## Solution: Low-Bandwidth Mode

The implemented solution provides a comprehensive set of bandwidth optimization techniques that automatically adapt to network conditions.

### Key Features

1. **Automatic Bandwidth Detection**

   - Real-time bandwidth monitoring
   - Automatic mode activation based on threshold detection
   - Connection quality classification (excellent, good, fair, poor, critical)

2. **Request and Response Compression**

   - GZIP compression for request and response payloads
   - Configurable compression levels based on CPU/bandwidth trade-offs
   - Only applied when content type supports compression

3. **Field Filtering and Selective Loading**

   - Only essential fields requested from API (vs. full resource representation)
   - Endpoint-specific field configurations
   - Reduced data for listing endpoints

4. **Image Optimization**

   - Automatic image dimension reduction
   - Lower resolution for product images in listings
   - Smart loading of images based on connection quality

5. **Request Prioritization and Deferral**

   - Critical requests processed immediately (orders, payments)
   - Non-critical requests queued during bandwidth constraints
   - Priority-based processing queue
   - Batch processing when bandwidth improves

6. **Metrics and Reporting**
   - Bandwidth usage tracking
   - Compression ratio statistics
   - Data saving calculations
   - Queue status monitoring

### Implementation Details

The low-bandwidth mode is implemented in the `NetworkAwareClient` class, with configuration specifically tuned for South African networks:

```typescript
// Enable low-bandwidth mode for South African networks
lowBandwidth: {
  enabled: false, // Off by default, auto-activates based on network conditions
  activationThreshold: 50000, // 50 KB/s (typical slow 3G connection)
  compressionLevel: 6,
  compressRequests: true,
  requestCompressedResponses: true,
  // Optimize fields for WooCommerce API
  fieldsToExclude: {
    'products': [
      'description',
      'short_description',
      'price_html',
      'related_ids',
      'meta_data',
      'downloads',
      'attributes'
    ],
    // Additional field configurations
  },
  essentialFields: {
    'products': [
      'id',
      'name',
      'sku',
      'price',
      'regular_price',
      'sale_price',
      'stock_quantity',
      'stock_status'
    ],
    // Essential fields for other endpoints
  }
}
```

### Bandwidth Detection and Adaptive Behavior

The system includes automatic detection of available bandwidth:

```typescript
private updateBandwidthEstimate(): void {
  // Calculate current bandwidth based on recent samples
  const totalBytes = this.bandwidthSamples.reduce(
    (sum, sample) => sum + sample.bytes, 0
  );

  // Calculate bandwidth in bytes per second
  const windowDuration = (now - Math.min(...this.bandwidthSamples.map(s => s.timestamp))) / 1000;

  this.currentBandwidth = totalBytes / windowDuration;

  // Auto-enable or disable based on bandwidth conditions
  if (!this.lowBandwidthConfig.enabled &&
      this.currentBandwidth < this.lowBandwidthConfig.activationThreshold) {
    this.logger.warn(
      `Auto-enabling low-bandwidth mode. Current bandwidth: ${this.formatBandwidth(this.currentBandwidth)}`
    );
    this.lowBandwidthConfig.enabled = true;
  }

  // Additional logic for mode switching
}
```

### Request Compression

The system compresses request data when appropriate:

```typescript
// Compress request body for POST/PUT/PATCH
if (
  this.lowBandwidthConfig.compressRequests &&
  config.data &&
  ["POST", "PUT", "PATCH"].includes(config.method.toUpperCase())
) {
  // Convert data to buffer
  const dataToCompress = Buffer.from(JSON.stringify(originalData));

  // Record original size for metrics
  const originalSize = dataToCompress.length;

  // Compress data
  const compressedData = await this.gzip(dataToCompress, {
    level: this.lowBandwidthConfig.compressionLevel,
  });

  // Update request with compressed data
  lowBandwidthConfig.data = compressedData;
  lowBandwidthConfig.headers = {
    ...lowBandwidthConfig.headers,
    "Content-Type": "application/json",
    "Content-Encoding": "gzip",
  };
}
```

### Request Deferral System

The system includes a sophisticated request queueing system:

```typescript
// Check if this request should be deferred in low-bandwidth mode
if (config && this.shouldDeferRequest(config)) {
  return new Promise((resolve, reject) => {
    // Determine request priority (0-10, higher = more important)
    let priority = 5; // Default medium priority

    // Check URL patterns to adjust priority
    const url = config.url || "";
    if (url.includes("/orders/")) {
      priority = 8; // Higher priority for order operations
    } else if (url.includes("/products/")) {
      priority = 6; // Medium-high priority for product operations
    }

    // Add to deferred queue
    this.deferredRequestsQueue.push({
      config: { ...config },
      resolve,
      reject,
      priority,
      timestamp: Date.now(),
    });

    this.logger.debug(
      `Request to ${config.url} deferred in low-bandwidth mode. ` +
        `Queue size: ${this.deferredRequestsQueue.length}`,
    );
  });
}
```

## Client-Side API

The low-bandwidth mode is exposed through a REST API for client-side control:

### 1. Get Low-Bandwidth Status

```
GET /api/connectors/woocommerce/low-bandwidth/status?organizationId={orgId}
```

Response:

```json
{
  "success": true,
  "data": {
    "active": true,
    "currentBandwidth": 45000,
    "config": {
      "enabled": true,
      "compressionLevel": 6,
      "requestCompressedResponses": true
      // Additional configuration
    },
    "stats": {
      "bytesSaved": 15483921,
      "compressionRatio": 3.2,
      "deferredRequests": 5
    }
  }
}
```

### 2. Configure Low-Bandwidth Mode

```
PUT /api/connectors/woocommerce/low-bandwidth/config?organizationId={orgId}
```

Request:

```json
{
  "enabled": true,
  "compressionLevel": 7,
  "maxImageDimensions": {
    "width": 200,
    "height": 200
  },
  "deferNonCriticalRequests": true
}
```

Response:

```json
{
  "success": true,
  "data": {
    "updated": true,
    "active": true
  }
}
```

## Benefits

This low-bandwidth mode provides several benefits for South African merchants:

1. **Reduced data costs**: Significantly lower data usage for API interactions
2. **Faster operations**: Less data means quicker response times on slow connections
3. **More reliable service**: Better operation during network degradation
4. **Lower operational costs**: Minimized data usage translates to direct cost savings
5. **Mobile-friendly operation**: Optimized for mobile network conditions
6. **Load shedding resilience**: Better functionality during power outage periods

## Metrics and Monitoring

The system collects extensive metrics to measure effectiveness:

- Data volume sent and received (compressed vs. uncompressed)
- Bandwidth estimates over time
- Compression ratios achieved
- Request queue length and processing times
- Auto-activation frequency

## Integration with Other South African Optimizations

This feature works in concert with other South African optimizations:

1. **Regional Caching Strategy**: Complements caching by reducing data size
2. **Adaptive Timeout System**: Works with timeouts to ensure operation during slow connections
3. **Load Shedding Detection**: Increases optimization during power outages
4. **Network Resilience Features**: Adds another layer of resilience during poor connectivity

## Future Enhancements

Planned future enhancements include:

1. **Differential synchronization**: Only sending changed fields
2. **Binary data format option**: Alternative to JSON for further size reduction
3. **Connection-aware field selection**: Dynamic field selection based on bandwidth
4. **Predictive prefetching**: Downloading likely-needed data during good connectivity
5. **Regional network mapping**: South African ISP-specific optimizations
