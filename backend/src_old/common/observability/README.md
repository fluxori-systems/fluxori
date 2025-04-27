# Fluxori Observability System

A comprehensive observability solution for the Fluxori platform, providing structured logging, distributed tracing, metric collection, and health monitoring capabilities.

## Features

- **Structured Logging**: Context-rich logs with user, organization, and trace information
- **Distributed Tracing**: Track requests across service boundaries
- **Metrics Collection**: Technical and business metrics with GCP Cloud Monitoring integration
- **Health Monitoring**: Self-monitoring system with component health checks
- **South African Optimizations**: Special performance thresholds and monitoring for SA region

## Quick Start

### 1. Import the Observability Module

```typescript
// In app.module.ts
import { ObservabilityModule } from "./common/observability";

@Module({
  imports: [
    // ... other imports
    ObservabilityModule.register(),
  ],
  // ... providers, controllers, etc.
})
export class AppModule {}
```

### 2. Using the Observability Service

```typescript
// In your service
import { Injectable } from "@nestjs/common";
import { ObservabilityService } from "../../common/observability";

@Injectable()
export class YourService {
  constructor(private readonly observability: ObservabilityService) {}

  async doSomething() {
    // Log something
    this.observability.log("Operation started", "YourService");

    // Create a trace
    const span = this.observability.startTrace("your-operation");

    try {
      // Perform your operation
      const result = await this.performOperation();

      // Record a metric
      this.observability.incrementCounter("your.operation.count");

      // End the span
      span.end();

      return result;
    } catch (error) {
      // Record error
      this.observability.error("Operation failed", error, "YourService");
      span.recordException(error);
      span.end();
      throw error;
    }
  }
}
```

## Usage Examples

### Logging

```typescript
// Simple log
observability.log("User logged in", "AuthService");

// Log with context
observability.log("Order processed", {
  service: "OrderService",
  userId: order.userId,
  organizationId: order.organizationId,
  data: { orderId: order.id, total: order.total },
});

// Error logging
try {
  // ... some operation
} catch (error) {
  observability.error("Failed to process order", error, "OrderService");
}
```

### Tracing

```typescript
// Start a new trace
const span = observability.startTrace("process-order", {
  orderId: order.id,
  userId: user.id,
});

// Add more attributes
span.setAttribute("orderValue", order.total);

// Record events
span.addEvent("payment-processed", {
  provider: "stripe",
  amount: order.total,
});

// Handle errors
try {
  // ... some operation
} catch (error) {
  span.recordException(error);
  span.end();
  throw error;
}

// End the span
span.end();

// Trace a function
const result = await observability.traceFunction(
  "validate-inventory",
  () => this.inventoryService.validateStock(items),
  span, // parent span
);
```

### Metrics

```typescript
// Increment counters
observability.incrementCounter("orders.processed");
observability.incrementCounter("order.items.count", order.items.length);

// Record gauges
observability.recordGauge("inventory.stock.level", stockLevel, {
  productId: product.id,
  warehouseId: warehouse.id,
});

// Record distributions (for timings, sizes, etc.)
observability.recordDistribution("order.processing.time", processingTimeMs);

// Using timers
const stopTimer = observability.startTimer("inventory.check.duration", {
  warehouseId: warehouse.id,
});
// ... perform inventory check
stopTimer(); // This will record the duration

// Track database operations
observability.trackDatabaseOperation("query", "products", queryTimeMs, success);

// Track AI model usage
observability.trackAIModelUsage(
  "gpt-4",
  "product-description",
  inputTokens,
  outputTokens,
  durationMs,
  creditCost,
  organizationId,
);
```

### Health Checks

```typescript
// Register a custom health check
observability.registerHealthCheck("database.connection", async () => {
  try {
    await this.database.pingConnection();
    return {
      component: "database.connection",
      status: "healthy",
      details: { latency: pingTimeMs },
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      component: "database.connection",
      status: "unhealthy",
      details: { error: error.message },
      timestamp: new Date(),
    };
  }
});

// Get health status
const health = await observability.getDetailedHealthCheck();
console.log(`System health: ${health.status}`);
```

## Using Interceptors

The Observability module provides the following interceptors that can be applied globally or to specific controllers:

- **TracingInterceptor**: Adds distributed tracing to HTTP requests
- **MetricsInterceptor**: Collects metrics for HTTP requests
- **LoggingInterceptor**: Adds structured logging to HTTP requests

```typescript
// In main.ts to apply globally
import {
  TracingInterceptor,
  MetricsInterceptor,
  LoggingInterceptor,
} from "./common/observability";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply interceptors globally
  app.useGlobalInterceptors(
    app.get(TracingInterceptor),
    app.get(MetricsInterceptor),
    app.get(LoggingInterceptor),
  );

  await app.listen(3000);
}
```

## Configuration

The Observability module can be configured with custom options:

```typescript
ObservabilityModule.registerWithOptions({
  appName: "fluxori-api",
  environment: "production",
  region: "africa-south1",
  logging: {
    logLevel: "log",
    sanitizeLogs: true,
    useJsonFormat: true,
    debugSamplingRate: 0.05,
  },
  tracing: {
    enabled: true,
    defaultSamplingRate: 1.0,
    pathSamplingRates: {
      "^/api/health": 0.1,
      "^/api/metrics": 0.1,
    },
    includeRequestBodies: false,
    includeResponseBodies: false,
  },
  metrics: {
    enabled: true,
    registerDefaultMetrics: true,
    metricPrefix: "fluxori.",
    collectionInterval: 60000,
  },
  health: {
    enabled: true,
    registerDefaultHealthChecks: true,
    healthCheckInterval: 60000,
    exposeDetails: false,
  },
});
```

## South African Performance Considerations

The system includes special considerations for South African deployments:

- Custom performance thresholds for South African infrastructure
- Region-specific monitoring for key operations
- Bandwidth-optimized logging with appropriate sampling rates
- Special monitoring for connectivity issues common in the region

## Integration Points

The observability system integrates with:

- **Authentication System**: Automatically adds user/organization context to logs and traces
- **Feature Flag System**: Tracks feature flag usage and can be used to control observability features
- **Agent Framework**: Monitors AI model usage, latency and costs
- **GCP Cloud Monitoring**: Publishes metrics to Cloud Monitoring for dashboards and alerts
