import {
  Injectable,
  Inject,
  Optional,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

// Import the monitoring client
import { MetricServiceClient } from "@google-cloud/monitoring";

// Import interfaces
import {
  MetricOptions,
  MetricReporter,
  MetricCategory,
  MetricValueType,
  IMetricsService,
  IEnhancedLoggerService,
} from "../interfaces/observability.interfaces";

// Import constants
import { METRIC_NAMES } from "../constants/observability.constants";
import { OBSERVABILITY_TOKENS } from "../constants/observability.tokens";
import { DEFAULT_OBSERVABILITY_OPTIONS } from "../interfaces/observability-options.interface";

/**
 * Google Cloud Monitoring metric type mapping
 */
const GCP_METRIC_TYPE_MAPPING = {
  [MetricValueType.INT64]: "INT64",
  [MetricValueType.DOUBLE]: "DOUBLE",
  [MetricValueType.DISTRIBUTION]: "DISTRIBUTION",
  [MetricValueType.BOOLEAN]: "BOOL",
  [MetricValueType.STRING]: "STRING",
};

/**
 * Metric definition
 */
interface MetricDefinition {
  name: string;
  displayName: string;
  description: string;
  valueType: MetricValueType;
  metricKind: "GAUGE" | "CUMULATIVE" | "DELTA";
  unit?: string;
  labels: string[];
  gcpMetricType?: string;
}

/**
 * Metrics service that provides metrics collection and reporting capabilities
 * with a focus on Cloud Monitoring integration
 */
@Injectable()
export class MetricsService
  implements IMetricsService, OnModuleInit, OnModuleDestroy
{
  private client: MetricServiceClient | undefined;
  private metricDefinitions: Map<string, MetricDefinition> = new Map();

  // Memory storage for metrics in development and local collection
  private memoryMetrics: Map<string, Map<string, number>> = new Map();
  private distributionValues: Map<string, number[]> = new Map();

  // Options
  private readonly enabled: boolean;
  private readonly projectId: string;
  private readonly metricPrefix: string;
  private readonly defaultLabels: Record<string, string>;
  private readonly environment: string;
  private readonly region: string;
  private readonly serviceName: string;
  private collectionInterval: NodeJS.Timeout | null = null;
  private readonly collectionIntervalMs: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(OBSERVABILITY_TOKENS.LOGGER_SERVICE)
    private readonly logger: IEnhancedLoggerService,
    @Optional()
    @Inject(OBSERVABILITY_TOKENS.OBSERVABILITY_OPTIONS)
    private readonly options?: any,
  ) {
    // Apply options with defaults
    const mergedOptions = { ...DEFAULT_OBSERVABILITY_OPTIONS, ...options };
    const metricsOptions = mergedOptions.metrics || {};

    this.enabled =
      metricsOptions.enabled !== undefined ? metricsOptions.enabled : true;
    this.projectId = this.configService.get<string>("GCP_PROJECT_ID", "");
    this.metricPrefix = metricsOptions.metricPrefix || "fluxori.";
    this.defaultLabels = {
      service: mergedOptions.appName || "fluxori-api",
      environment:
        mergedOptions.environment || process.env.NODE_ENV || "development",
      region: mergedOptions.region || process.env.GCP_REGION || "africa-south1",
      ...(metricsOptions.defaultLabels || {}),
    };
    this.environment =
      mergedOptions.environment || process.env.NODE_ENV || "development";
    this.region =
      mergedOptions.region || process.env.GCP_REGION || "africa-south1";
    this.serviceName = mergedOptions.appName || "fluxori-api";
    this.collectionIntervalMs = metricsOptions.collectionInterval || 60000; // 1 minute

    // Initialize Google Cloud Monitoring client in production
    if (this.enabled && this.projectId && this.environment === "production") {
      try {
        this.client = new MetricServiceClient({
          projectId: this.projectId,
        });
        this.logger.log(
          "Metrics service initialized with GCP Monitoring",
          "MetricsService",
        );
      } catch (error) {
        this.logger.error(
          "Failed to initialize GCP Monitoring client",
          error,
          "MetricsService",
        );
      }
    } else if (this.enabled) {
      this.logger.log(
        "Metrics service initialized with local storage",
        "MetricsService",
      );
    }

    // Register default metrics if enabled
    if (this.enabled && metricsOptions.registerDefaultMetrics !== false) {
      this.registerDefaultMetrics();
    }
  }

  /**
   * Initialize metrics collection
   */
  async onModuleInit() {
    if (this.enabled) {
      // Start periodic collection for development environments
      if (this.environment !== "production") {
        this.collectionInterval = setInterval(() => {
          this.logLocalMetrics();
        }, this.collectionIntervalMs);
      }
    }
  }

  /**
   * Clean up resources
   */
  async onModuleDestroy() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
  }

  /**
   * Register a metric with the metrics service
   */
  registerMetric(options: MetricOptions): void {
    if (!this.enabled) {
      return;
    }

    // Format name with prefix
    const name = options.name.startsWith(this.metricPrefix)
      ? options.name
      : `${this.metricPrefix}${options.name}`;

    // Create metric definition
    const metricDefinition: MetricDefinition = {
      name,
      displayName: options.name.replace(/\\./g, " ").trim(),
      description: options.description,
      valueType: options.valueType,
      metricKind: options.isCumulative ? "CUMULATIVE" : "GAUGE",
      unit: options.unit,
      labels: [...(options.labels || []), ...Object.keys(this.defaultLabels)],
    };

    // Calculate GCP metric type
    if (this.projectId) {
      metricDefinition.gcpMetricType = `custom.googleapis.com/${this.metricPrefix}${options.name.replace(/\\./g, "/")}`;
    }

    // Store metric definition
    this.metricDefinitions.set(name, metricDefinition);

    // Initialize memory storage
    this.memoryMetrics.set(name, new Map());

    if (options.valueType === MetricValueType.DISTRIBUTION) {
      this.distributionValues.set(name, []);
    }

    if (this.logger?.debug) {
      this.logger.debug(`Registered metric: ${name}`, {
        service: "MetricsService",
        metric: metricDefinition,
      });
    }
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(
    metricName: string,
    value: number = 1,
    labels?: Record<string, string>,
  ): void {
    if (!this.enabled) {
      return;
    }

    // Format name with prefix if needed
    const name = metricName.startsWith(this.metricPrefix)
      ? metricName
      : `${this.metricPrefix}${metricName}`;

    // Auto-register if not already registered
    if (!this.metricDefinitions.has(name)) {
      this.registerMetric({
        name: metricName,
        description: `Auto-registered counter for ${metricName}`,
        category: MetricCategory.TECHNICAL,
        valueType: MetricValueType.INT64,
        isCumulative: true,
      });
    }

    const metricDef = this.metricDefinitions.get(name);
    if (!metricDef) return;

    // Combine with default labels
    const allLabels = { ...this.defaultLabels, ...(labels || {}) };
    const labelKey = this.getLabelKey(allLabels);

    // Update memory storage
    let metricValues = this.memoryMetrics.get(name);
    if (!metricValues) {
      metricValues = new Map();
      this.memoryMetrics.set(name, metricValues);
    }

    const currentValue = metricValues.get(labelKey) || 0;
    metricValues.set(labelKey, currentValue + value);

    // If we're in production, write to Cloud Monitoring
    if (
      this.environment === "production" &&
      this.client &&
      metricDef.gcpMetricType
    ) {
      this.writeToCloudMonitoring(
        metricDef,
        allLabels,
        currentValue + value,
      ).catch((err) => {
        if (this.logger?.error) {
          this.logger.error(
            `Failed to write metric ${name} to Cloud Monitoring`,
            err,
            "MetricsService",
          );
        }
      });
    }
  }

  /**
   * Record a gauge value
   */
  recordGauge(
    metricName: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    if (!this.enabled) {
      return;
    }

    // Format name with prefix if needed
    const name = metricName.startsWith(this.metricPrefix)
      ? metricName
      : `${this.metricPrefix}${metricName}`;

    // Auto-register if not already registered
    if (!this.metricDefinitions.has(name)) {
      this.registerMetric({
        name: metricName,
        description: `Auto-registered gauge for ${metricName}`,
        category: MetricCategory.TECHNICAL,
        valueType: MetricValueType.DOUBLE,
        isCumulative: false,
      });
    }

    const metricDef = this.metricDefinitions.get(name);
    if (!metricDef) return;

    // Combine with default labels
    const allLabels = { ...this.defaultLabels, ...(labels || {}) };
    const labelKey = this.getLabelKey(allLabels);

    // Update memory storage
    let metricValues = this.memoryMetrics.get(name);
    if (!metricValues) {
      metricValues = new Map();
      this.memoryMetrics.set(name, metricValues);
    }

    metricValues.set(labelKey, value);

    // If we're in production, write to Cloud Monitoring
    if (
      this.environment === "production" &&
      this.client &&
      metricDef.gcpMetricType
    ) {
      this.writeToCloudMonitoring(metricDef, allLabels, value).catch((err) => {
        if (this.logger?.error) {
          this.logger.error(
            `Failed to write metric ${name} to Cloud Monitoring`,
            err,
            "MetricsService",
          );
        }
      });
    }
  }

  /**
   * Record a distribution value
   */
  recordDistribution(
    metricName: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    if (!this.enabled) {
      return;
    }

    // Format name with prefix if needed
    const name = metricName.startsWith(this.metricPrefix)
      ? metricName
      : `${this.metricPrefix}${metricName}`;

    // Auto-register if not already registered
    if (!this.metricDefinitions.has(name)) {
      this.registerMetric({
        name: metricName,
        description: `Auto-registered distribution for ${metricName}`,
        category: MetricCategory.TECHNICAL,
        valueType: MetricValueType.DISTRIBUTION,
        isCumulative: false,
      });
    }

    const metricDef = this.metricDefinitions.get(name);
    if (!metricDef) return;

    // Add value to the distribution array
    let values = this.distributionValues.get(name);
    if (!values) {
      values = [];
      this.distributionValues.set(name, values);
    }
    values.push(value);

    // Limit the number of stored values for memory efficiency
    if (values.length > 1000) {
      values.shift();
    }

    // If we're in production, write to Cloud Monitoring
    if (
      this.environment === "production" &&
      this.client &&
      metricDef.gcpMetricType
    ) {
      const allLabels = { ...this.defaultLabels, ...(labels || {}) };

      this.writeDistributionToCloudMonitoring(
        metricDef,
        allLabels,
        value,
      ).catch((err) => {
        if (this.logger?.error) {
          this.logger.error(
            `Failed to write distribution ${name} to Cloud Monitoring`,
            err,
            "MetricsService",
          );
        }
      });
    }
  }

  /**
   * Start a timer and return a function to stop and record the duration
   */
  startTimer(metricName: string, labels?: Record<string, string>): () => void {
    if (!this.enabled) {
      return () => {}; // No-op
    }

    const startTime = Date.now();

    // Return a function that, when called, will record the duration
    return () => {
      const duration = Date.now() - startTime;
      this.recordDistribution(metricName, duration, labels);
    };
  }

  /**
   * Get current metric values for a specific metric
   */
  getMetricValues(metricName: string): Map<string, number> | undefined {
    const name = metricName.startsWith(this.metricPrefix)
      ? metricName
      : `${this.metricPrefix}${metricName}`;

    return this.memoryMetrics.get(name);
  }

  /**
   * Get distribution values for a specific metric
   */
  getDistributionValues(metricName: string): number[] | undefined {
    const name = metricName.startsWith(this.metricPrefix)
      ? metricName
      : `${this.metricPrefix}${metricName}`;

    return this.distributionValues.get(name);
  }

  /**
   * Get distribution statistics for a metric
   */
  getDistributionStats(metricName: string):
    | {
        count: number;
        min: number;
        max: number;
        mean: number;
        p50: number;
        p90: number;
        p95: number;
        p99: number;
      }
    | undefined {
    const values = this.getDistributionValues(metricName);
    if (!values || values.length === 0) {
      return undefined;
    }

    // Sort values for percentile calculations
    const sorted = [...values].sort((a, b) => a - b);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: values.reduce((sum, val) => sum + val, 0) / values.length,
      p50: this.getPercentile(sorted, 0.5),
      p90: this.getPercentile(sorted, 0.9),
      p95: this.getPercentile(sorted, 0.95),
      p99: this.getPercentile(sorted, 0.99),
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {};

    for (const [metricName, values] of this.memoryMetrics.entries()) {
      result[metricName] = Object.fromEntries(values);
    }

    return result;
  }

  /**
   * Write a metric value to Google Cloud Monitoring
   */
  private async writeToCloudMonitoring(
    metricDef: MetricDefinition,
    labels: Record<string, string>,
    value: number,
  ): Promise<void> {
    if (!this.client || !metricDef.gcpMetricType) {
      return;
    }

    try {
      const dataPoint = {
        interval: {
          endTime: {
            seconds: Math.floor(Date.now() / 1000),
            nanos: (Date.now() % 1000) * 1000000,
          },
        },
        value: {
          [this.getGcpValueType(metricDef.valueType)]: value,
        },
      };

      const timeSeriesData = {
        metric: {
          type: metricDef.gcpMetricType,
          labels,
        },
        resource: {
          type: "global",
        },
        points: [dataPoint],
      };

      const projectPath = this.client.projectPath(this.projectId);
      await this.client.createTimeSeries({
        name: projectPath,
        timeSeries: [timeSeriesData],
      });
    } catch (error) {
      if (this.logger?.error) {
        this.logger.error(
          `Failed to write metric ${metricDef.name} to Cloud Monitoring`,
          error,
          "MetricsService",
        );
      }
    }
  }

  /**
   * Write a distribution value to Google Cloud Monitoring
   */
  private async writeDistributionToCloudMonitoring(
    metricDef: MetricDefinition,
    labels: Record<string, string>,
    value: number,
  ): Promise<void> {
    if (!this.client || !metricDef.gcpMetricType) {
      return;
    }

    try {
      // Create distribution buckets
      const bucketOptions = {
        exponentialBuckets: {
          numFiniteBuckets: 64,
          scale: 0.01,
          growthFactor: 1.5,
        },
      };

      const distributionValue = {
        count: 1,
        mean: value,
        sumOfSquaredDeviation: 0,
        bucketOptions,
        bucketCounts: this.createDistributionBuckets(value, bucketOptions),
      };

      const dataPoint = {
        interval: {
          endTime: {
            seconds: Math.floor(Date.now() / 1000),
            nanos: (Date.now() % 1000) * 1000000,
          },
        },
        value: {
          distributionValue,
        },
      };

      const timeSeriesData = {
        metric: {
          type: metricDef.gcpMetricType,
          labels,
        },
        resource: {
          type: "global",
        },
        points: [dataPoint],
      };

      const projectPath = this.client.projectPath(this.projectId);
      await this.client.createTimeSeries({
        name: projectPath,
        timeSeries: [timeSeriesData],
      });
    } catch (error) {
      if (this.logger?.error) {
        this.logger.error(
          `Failed to write distribution ${metricDef.name} to Cloud Monitoring`,
          error,
          "MetricsService",
        );
      }
    }
  }

  /**
   * Create distribution buckets for a value
   */
  private createDistributionBuckets(
    value: number,
    bucketOptions: any,
  ): number[] {
    // Simplified bucket creation
    const buckets: number[] = new Array(65).fill(0);

    // Find the bucket for the value
    let bucketIndex = 0;
    let bucketBound = bucketOptions.exponentialBuckets.scale;

    while (bucketIndex < 64 && value > bucketBound) {
      bucketBound *= bucketOptions.exponentialBuckets.growthFactor;
      bucketIndex++;
    }

    buckets[bucketIndex] = 1;
    return buckets;
  }

  /**
   * Get the Cloud Monitoring value type for a metric
   */
  private getGcpValueType(valueType: MetricValueType): string {
    switch (valueType) {
      case MetricValueType.INT64:
        return "int64Value";
      case MetricValueType.DOUBLE:
        return "doubleValue";
      case MetricValueType.BOOLEAN:
        return "boolValue";
      case MetricValueType.STRING:
        return "stringValue";
      case MetricValueType.DISTRIBUTION:
        return "distributionValue";
      default:
        return "doubleValue";
    }
  }

  /**
   * Get a percentile value from a sorted array
   */
  private getPercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil(sortedValues.length * percentile) - 1;
    return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))];
  }

  /**
   * Create a string key for labels
   */
  private getLabelKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
  }

  /**
   * Log local metrics to the console/logger
   */
  private logLocalMetrics(): void {
    if (this.environment === "production") {
      return; // Don't log in production as they're sent to Cloud Monitoring
    }

    const metricsSnapshot = this.getAllMetrics();

    // Log counter and gauge metrics
    for (const [metricName, values] of Object.entries(metricsSnapshot)) {
      if (Object.keys(values).length === 0) continue;

      const metricDef = this.metricDefinitions.get(metricName);
      if (!metricDef) continue;

      if (this.logger?.debug) {
        this.logger.debug(`Metric: ${metricName}`, {
          service: "MetricsService",
          metric: {
            name: metricName,
            type: metricDef.valueType,
            values,
          },
        });
      }
    }

    // Log distribution metrics
    for (const [metricName, values] of this.distributionValues.entries()) {
      if (values.length === 0) continue;

      const stats = this.getDistributionStats(metricName);
      if (!stats) continue;

      if (this.logger?.debug) {
        this.logger.debug(`Distribution: ${metricName}`, {
          service: "MetricsService",
          metric: {
            name: metricName,
            type: "distribution",
            stats,
          },
        });
      }
    }
  }

  /**
   * Register default metrics
   */
  private registerDefaultMetrics(): void {
    // HTTP metrics
    this.registerMetric({
      name: METRIC_NAMES.HTTP_REQUEST_DURATION,
      description: "HTTP request duration in milliseconds",
      category: MetricCategory.PERFORMANCE,
      valueType: MetricValueType.DISTRIBUTION,
      unit: "ms",
      labels: ["method", "path", "status"],
    });

    this.registerMetric({
      name: METRIC_NAMES.HTTP_REQUEST_COUNT,
      description: "HTTP request count",
      category: MetricCategory.TECHNICAL,
      valueType: MetricValueType.INT64,
      isCumulative: true,
      labels: ["method", "path", "status"],
    });

    this.registerMetric({
      name: METRIC_NAMES.HTTP_ERROR_COUNT,
      description: "HTTP error count",
      category: MetricCategory.TECHNICAL,
      valueType: MetricValueType.INT64,
      isCumulative: true,
      labels: ["method", "path", "status"],
    });

    // Database metrics
    this.registerMetric({
      name: METRIC_NAMES.DB_OPERATION_DURATION,
      description: "Database operation duration in milliseconds",
      category: MetricCategory.PERFORMANCE,
      valueType: MetricValueType.DISTRIBUTION,
      unit: "ms",
      labels: ["operation", "collection"],
    });

    this.registerMetric({
      name: METRIC_NAMES.DB_OPERATION_COUNT,
      description: "Database operation count",
      category: MetricCategory.TECHNICAL,
      valueType: MetricValueType.INT64,
      isCumulative: true,
      labels: ["operation", "collection"],
    });

    // Cache metrics
    this.registerMetric({
      name: METRIC_NAMES.CACHE_HIT_COUNT,
      description: "Cache hit count",
      category: MetricCategory.TECHNICAL,
      valueType: MetricValueType.INT64,
      isCumulative: true,
      labels: ["cache"],
    });

    this.registerMetric({
      name: METRIC_NAMES.CACHE_MISS_COUNT,
      description: "Cache miss count",
      category: MetricCategory.TECHNICAL,
      valueType: MetricValueType.INT64,
      isCumulative: true,
      labels: ["cache"],
    });

    // System metrics
    this.registerMetric({
      name: METRIC_NAMES.MEMORY_USAGE,
      description: "Memory usage in MB",
      category: MetricCategory.TECHNICAL,
      valueType: MetricValueType.DOUBLE,
      unit: "MB",
      labels: [],
    });

    this.registerMetric({
      name: METRIC_NAMES.CPU_USAGE,
      description: "CPU usage percentage",
      category: MetricCategory.TECHNICAL,
      valueType: MetricValueType.DOUBLE,
      unit: "%",
      labels: [],
    });

    // AI metrics
    this.registerMetric({
      name: METRIC_NAMES.AI_TOKEN_USAGE,
      description: "AI token usage count",
      category: MetricCategory.BUSINESS,
      valueType: MetricValueType.INT64,
      isCumulative: true,
      labels: ["model", "operation", "type"],
    });

    this.registerMetric({
      name: METRIC_NAMES.AI_REQUEST_DURATION,
      description: "AI request duration in milliseconds",
      category: MetricCategory.PERFORMANCE,
      valueType: MetricValueType.DISTRIBUTION,
      unit: "ms",
      labels: ["model", "operation"],
    });

    this.registerMetric({
      name: METRIC_NAMES.AI_CREDIT_USAGE,
      description: "AI credit usage count",
      category: MetricCategory.BUSINESS,
      valueType: MetricValueType.DOUBLE,
      isCumulative: true,
      labels: ["model", "operation", "organizationId"],
    });

    // Feature flag metrics
    this.registerMetric({
      name: METRIC_NAMES.FEATURE_FLAG_EVALUATION,
      description: "Feature flag evaluation count",
      category: MetricCategory.TECHNICAL,
      valueType: MetricValueType.INT64,
      isCumulative: true,
      labels: ["flag", "result"],
    });

    if (this.logger?.log) {
      this.logger.log("Default metrics registered", "MetricsService");
    }
  }
}
