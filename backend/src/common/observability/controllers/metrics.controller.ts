import { Controller, Get, Query, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

// Import services
import { METRIC_NAMES } from '../constants/observability.constants';
import { MetricsService } from '../services/metrics.service';
import { ObservabilityService } from '../services/observability.service';

// Import constants

/**
 * Controller for metrics endpoints
 */
@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly observability: ObservabilityService,
  ) {}

  /**
   * Get all metrics
   */
  @Get()
  @ApiOperation({ summary: 'Get all metrics' })
  @ApiResponse({
    status: 200,
    description: 'All metrics',
    schema: {
      type: 'object',
    },
  })
  getAllMetrics(): Record<string, Record<string, number>> {
    return this.metricsService.getAllMetrics();
  }

  /**
   * Get a specific metric
   */
  @Get(':name')
  @ApiOperation({ summary: 'Get a specific metric' })
  @ApiParam({
    name: 'name',
    description: 'Metric name',
    example: 'http.request.count',
  })
  @ApiResponse({
    status: 200,
    description: 'Metric values',
    schema: {
      type: 'object',
    },
  })
  @ApiResponse({ status: 404, description: 'Metric not found' })
  getMetric(@Param('name') name: string): Record<string, number> {
    const metricValues = this.metricsService.getMetricValues(name);

    if (!metricValues) {
      return {};
    }

    return Object.fromEntries(metricValues);
  }

  /**
   * Get distribution statistics for a metric
   */
  @Get(':name/stats')
  @ApiOperation({ summary: 'Get distribution statistics for a metric' })
  @ApiParam({
    name: 'name',
    description: 'Metric name',
    example: 'http.request.duration',
  })
  @ApiResponse({
    status: 200,
    description: 'Distribution statistics',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
        min: { type: 'number' },
        max: { type: 'number' },
        mean: { type: 'number' },
        p50: { type: 'number' },
        p90: { type: 'number' },
        p95: { type: 'number' },
        p99: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Metric not found or not a distribution',
  })
  getDistributionStats(
    @Param('name') name: string,
  ): Record<string, number> | { error: string } {
    const stats = this.metricsService.getDistributionStats(name);

    if (!stats) {
      return { error: 'Metric not found or not a distribution' };
    }

    return stats;
  }

  /**
   * Get HTTP request metrics
   */
  @Get('http/requests')
  @ApiOperation({ summary: 'Get HTTP request metrics' })
  @ApiResponse({
    status: 200,
    description: 'HTTP request metrics',
    schema: {
      type: 'object',
      properties: {
        counts: { type: 'object' },
        durations: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            p50: { type: 'number' },
            p90: { type: 'number' },
            p95: { type: 'number' },
            p99: { type: 'number' },
          },
        },
        errors: { type: 'object' },
      },
    },
  })
  getHttpMetrics(): Record<string, any> {
    const requestCounts = this.metricsService.getMetricValues(
      METRIC_NAMES.HTTP_REQUEST_COUNT,
    );
    const errorCounts = this.metricsService.getMetricValues(
      METRIC_NAMES.HTTP_ERROR_COUNT,
    );
    const durationStats = this.metricsService.getDistributionStats(
      METRIC_NAMES.HTTP_REQUEST_DURATION,
    );

    return {
      counts: requestCounts ? Object.fromEntries(requestCounts) : {},
      durations: durationStats || {},
      errors: errorCounts ? Object.fromEntries(errorCounts) : {},
    };
  }

  /**
   * Get database metrics
   */
  @Get('database/operations')
  @ApiOperation({ summary: 'Get database operation metrics' })
  @ApiResponse({
    status: 200,
    description: 'Database operation metrics',
    schema: {
      type: 'object',
      properties: {
        counts: { type: 'object' },
        durations: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            p50: { type: 'number' },
            p90: { type: 'number' },
            p95: { type: 'number' },
            p99: { type: 'number' },
          },
        },
        errors: { type: 'object' },
      },
    },
  })
  getDatabaseMetrics(): Record<string, any> {
    const operationCounts = this.metricsService.getMetricValues(
      METRIC_NAMES.DB_OPERATION_COUNT,
    );
    const errorCounts = this.metricsService.getMetricValues(
      METRIC_NAMES.DB_ERROR_COUNT,
    );
    const durationStats = this.metricsService.getDistributionStats(
      METRIC_NAMES.DB_OPERATION_DURATION,
    );

    return {
      counts: operationCounts ? Object.fromEntries(operationCounts) : {},
      durations: durationStats || {},
      errors: errorCounts ? Object.fromEntries(errorCounts) : {},
    };
  }

  /**
   * Get AI metrics
   */
  @Get('ai/usage')
  @ApiOperation({ summary: 'Get AI usage metrics' })
  @ApiResponse({
    status: 200,
    description: 'AI usage metrics',
    schema: {
      type: 'object',
      properties: {
        tokens: { type: 'object' },
        durations: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            p50: { type: 'number' },
            p90: { type: 'number' },
            p95: { type: 'number' },
            p99: { type: 'number' },
          },
        },
        credits: { type: 'object' },
      },
    },
  })
  getAIMetrics(): Record<string, any> {
    const tokenUsage = this.metricsService.getMetricValues(
      METRIC_NAMES.AI_TOKEN_USAGE,
    );
    const creditUsage = this.metricsService.getMetricValues(
      METRIC_NAMES.AI_CREDIT_USAGE,
    );
    const durationStats = this.metricsService.getDistributionStats(
      METRIC_NAMES.AI_REQUEST_DURATION,
    );

    return {
      tokens: tokenUsage ? Object.fromEntries(tokenUsage) : {},
      durations: durationStats || {},
      credits: creditUsage ? Object.fromEntries(creditUsage) : {},
    };
  }

  /**
   * Get system metrics
   */
  @Get('system/resources')
  @ApiOperation({ summary: 'Get system resource metrics' })
  @ApiResponse({
    status: 200,
    description: 'System resource metrics',
    schema: {
      type: 'object',
      properties: {
        memory: { type: 'object' },
        cpu: { type: 'object' },
      },
    },
  })
  getSystemMetrics(): Record<string, any> {
    const memoryUsage = this.metricsService.getMetricValues(
      METRIC_NAMES.MEMORY_USAGE,
    );
    const cpuUsage = this.metricsService.getMetricValues(
      METRIC_NAMES.CPU_USAGE,
    );

    return {
      memory: memoryUsage
        ? Object.fromEntries(memoryUsage as Iterable<readonly [string, number]>)
        : {},
      cpu: cpuUsage
        ? Object.fromEntries(cpuUsage as Iterable<readonly [string, number]>)
        : {},
      connections: this.metricsService.getMetricValues(
        METRIC_NAMES.ACTIVE_CONNECTIONS,
      )
        ? Object.fromEntries(
            this.metricsService.getMetricValues(
              METRIC_NAMES.ACTIVE_CONNECTIONS,
            ) as Iterable<readonly [string, number]>,
          )
        : {},
    };
  }
}
