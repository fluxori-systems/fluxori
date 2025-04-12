# Regional Caching Strategy for South African Network Conditions

## Overview

This document outlines the regional caching strategy implemented in the WooCommerce connector for the Fluxori platform, specifically targeting South African network conditions. The strategy addresses the unique challenges faced by e-commerce operations in South Africa, including variable network quality, load shedding (planned power outages), high data costs, and limited connectivity in certain regions.

## Context and Problem Statement

South African e-commerce businesses face several network-related challenges:

1. **Inconsistent connectivity**: Network quality can vary significantly throughout the day
2. **Load shedding**: Scheduled power outages affect data centers and internet connectivity
3. **High data costs**: South Africa has relatively expensive mobile data
4. **Regional service variance**: Different ISPs have varying levels of service in different provinces

These challenges can lead to:
- Poor user experience due to slow API responses
- Increased operational costs from redundant API calls
- Data inconsistency when updates fail during connectivity issues
- Poor application performance during load shedding periods

## Solution: Regional Caching Strategy

The implemented solution provides a sophisticated caching system with South African-specific optimizations that automatically adapt to network conditions.

### Key Components

1. **Adaptive Time-To-Live (TTL) based on network quality**
   - Cache duration automatically extends during poor network conditions
   - Cache items expire faster during excellent connectivity

2. **Load shedding awareness**
   - Cache TTLs are extended during detected or scheduled load shedding periods
   - Critical data is prioritized for caching during power interruptions

3. **Regional network provider optimizations**
   - Cache behavior adapts based on detected South African ISP
   - Specific optimizations for major providers (Vodacom, MTN, Telkom, etc.)

4. **Time-of-day optimizations**
   - Extended cache during peak internet usage hours (6PM-10PM)
   - Longer TTLs during overnight hours when data is less likely to change
   - Reduced cache times during business hours when data changes frequently

5. **Resource relationship tracking for smart invalidation**
   - Product-category relationships are tracked for smarter cache invalidation
   - Order-customer relationships ensure consistent data

6. **Cost-aware caching**
   - More aggressive caching for high-cost connections (3G/mobile)
   - Balanced approach for lower-cost connections (fiber)

### Implementation Details

The caching system is implemented in the `NetworkAwareClient` class with South African-specific configurations:

```typescript
// Default cache configuration for South African network conditions
export const DEFAULT_SA_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  defaultTtl: 5 * 60 * 1000, // 5 minutes default
  maxSize: 500, // Store up to 500 items
  qualityTtlAdjustments: {
    [ConnectionQuality.EXCELLENT]: 0.5,  // 2.5 minutes
    [ConnectionQuality.GOOD]: 1,         // 5 minutes (unchanged) 
    [ConnectionQuality.FAIR]: 2,         // 10 minutes
    [ConnectionQuality.POOR]: 4,         // 20 minutes
    [ConnectionQuality.CRITICAL]: 8,     // 40 minutes
  },
  // South African e-commerce specific paths to cache
  includePaths: [
    /\/products\//,
    /\/categories\//,
    /\/tax_rates\//,
    /\/shipping_zones\//
  ],
  smartInvalidation: true,
  regionalOptimization: true
};
```

### Regional Optimizations

Several South Africa-specific optimizations are implemented:

```typescript
// During load shedding, cache for longer periods
if (this.networkStatus.possibleLoadShedding) {
  ttl = ttl * 3; // Triple the cache TTL during load shedding
}

// Consider the time of day in South Africa
const hour = new Date().getHours();

// During peak internet usage hours in South Africa, cache for longer
const peakHours = [18, 19, 20, 21, 22]; // 6pm-10pm
if (peakHours.includes(hour)) {
  ttl = ttl * 1.5; // 50% longer cache during peak hours
}

// During overnight hours, cache much longer as data is less likely to change
const overnightHours = [0, 1, 2, 3, 4, 5]; // 12am-6am
if (overnightHours.includes(hour)) {
  ttl = ttl * 2; // Double cache time overnight
}
```

### Load Shedding Detection

The system includes automated detection of possible load shedding conditions:

```typescript
private checkLoadSheddingPattern(): boolean {
  // Current hour in South Africa (SAST is UTC+2)
  const now = new Date();
  const hour = now.getHours();
  
  // Common load shedding hours in South Africa
  const loadSheddingHours = [6, 7, 8, 12, 13, 18, 19, 20];
  
  // Check if we're in a common load shedding hour and success rate is low
  if (loadSheddingHours.includes(hour) && this.requestStats.failedRequests > 3) {
    const failRate = this.requestStats.failedRequests / 
      Math.max(1, this.requestStats.totalRequests);
    
    if (failRate > 0.5) {
      return true;
    }
  }
  
  return false;
}
```

## Runtime Control

The caching system exposes several endpoints for monitoring and control:

1. **Stats Monitoring**
   - `GET /connectors/woocommerce/cache/stats` - Returns cache hit rates and effectiveness
   - `GET /connectors/woocommerce/network/status` - Shows current connectivity and cache status

2. **Cache Control**
   - `POST /connectors/woocommerce/cache/clear` - Force clears cache when fresh data is needed
   - `PUT /connectors/woocommerce/cache/config` - Runtime configuration adjustments

## Benefits

This regional caching strategy provides several benefits for South African merchants:

1. **Improved reliability** - Consistent operation during network fluctuations
2. **Reduced data costs** - Fewer redundant API calls means lower data usage
3. **Better performance** - Faster response times from cached data
4. **Load shedding resilience** - Graceful operation during power outages
5. **Bandwidth optimization** - Reduced bandwidth needs in congested networks

## Metrics and Monitoring

The following metrics are collected to measure the effectiveness of the caching strategy:

- Cache hit rate (% of requests served from cache)
- Network quality over time (excellent, good, fair, poor, critical)
- Estimated data savings
- Detection accuracy for load shedding
- Average latency with and without cache

## Future Enhancements

1. Implement predictive caching based on usage patterns
2. Add cache prefetching during good connectivity
3. Integrate with external load shedding schedule APIs for predictive caching
4. Further optimizations for specific South African provinces
5. Cache compression for high-volume data

## Related Components

This caching strategy works in conjunction with:
- Adaptive timeout mechanism
- Network-aware retry logic
- Load shedding detection and handling
- Low-bandwidth mode (to be implemented)