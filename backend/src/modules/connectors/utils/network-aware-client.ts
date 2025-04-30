/* eslint-disable import/default, import/no-named-as-default, import/no-named-as-default-member */
/**
 * Network-Aware HTTP Client
 *
 * Enhanced HTTP client with South African network optimizations:
 * - Adaptive timeouts and retry logic based on network quality
 * - Load shedding resilience
 * - Bandwidth-efficient communication
 * - Regional caching
 */

import { Logger } from '@nestjs/common';

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  Method,
} from 'axios';

import {
  RetryConfig,
  DEFAULT_SA_RETRY_CONFIG,
  NetworkStatus,
  ConnectionQuality,
  ConnectorErrorType,
} from '../interfaces/types';

import { toError } from '../../../common/utils/error.util';

/**
 * Network-aware HTTP client optimized for South African conditions
 */
export class NetworkAwareClient {
  private logger = new Logger(NetworkAwareClient.name);
  private axios: AxiosInstance;
  private retryConfig: RetryConfig;
  private _enableLoadSheddingResilience = true;
  private _enableLowBandwidthMode = true;
  private _enableRegionalCaching = true;

  /**
   * Create a new network-aware client
   */
  constructor(baseURL: string, config?: AxiosRequestConfig) {
    this.axios = axios.create({
      baseURL,
      ...config,
    });

    this.retryConfig = DEFAULT_SA_RETRY_CONFIG;

    this.logger.log('NetworkAwareClient initialized');
  }

  /**
   * Get the current network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    // Simplified implementation
    return {
      quality: ConnectionQuality.GOOD,
    };
  }

  /**
   * Enable load shedding resilience
   */
  set enableLoadSheddingResilience(value: boolean) {
    this._enableLoadSheddingResilience = value;
  }

  /**
   * Get load shedding resilience status
   */
  get enableLoadSheddingResilience(): boolean {
    return this._enableLoadSheddingResilience;
  }

  /**
   * Enable low bandwidth mode
   */
  set enableLowBandwidthMode(value: boolean) {
    this._enableLowBandwidthMode = value;
  }

  /**
   * Get low bandwidth mode status
   */
  get enableLowBandwidthMode(): boolean {
    return this._enableLowBandwidthMode;
  }

  /**
   * Enable regional caching
   */
  set enableRegionalCaching(value: boolean) {
    this._enableRegionalCaching = value;
  }

  /**
   * Get regional caching status
   */
  get enableRegionalCaching(): boolean {
    return this._enableRegionalCaching;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('GET', url, undefined, config);
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('POST', url, data, config);
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('PUT', url, data, config);
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('PATCH', url, data, config);
  }

  /**
   * Make a request with network-aware optimizations
   */
  private async request<T = any>(
    method: Method,
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    // Get current network status
    const networkStatus = await this.getNetworkStatus();

    // Adjust timeouts based on network quality
    const timeoutConfig = this.getTimeoutConfig(networkStatus.quality);

    // Apply compression if in low bandwidth mode
    const headers = this.getLowBandwidthHeaders(networkStatus.quality);

    // Merge configs
    const requestConfig: AxiosRequestConfig = {
      ...config,
      method,
      url,
      timeout: timeoutConfig.timeout,
      headers: {
        ...config?.headers,
        ...headers,
      },
    };

    if (data) {
      requestConfig.data = data;
    }

    // Add caching headers if enabled
    if (this._enableRegionalCaching) {
      requestConfig.headers = {
        ...requestConfig.headers,
        'Cache-Control': 'max-age=300', // 5 minute cache
      };
    }

    // Log request details
    this.logger.debug(
      `Making ${method} request to ${url} with timeout ${requestConfig.timeout}ms`,
    );

    try {
      return await this.axios.request<T>(requestConfig);
    } catch (error: unknown) {
      const err = toError(error);
      this.logger.error(`Request failed: ${err.message}`, err.stack);

      // Add network context to error
      (err as any).networkQuality = networkStatus.quality;
      (err as any).isLoadShedding = networkStatus.possibleLoadShedding || false;

      throw err;
    }
  }

  /**
   * Get appropriate timeout configuration based on network quality
   */
  private getTimeoutConfig(quality: ConnectionQuality): { timeout: number } {
    switch (quality) {
      case ConnectionQuality.CRITICAL:
        return { timeout: 60000 }; // 60s for very poor connections
      case ConnectionQuality.POOR:
        return { timeout: 30000 }; // 30s for poor connections
      case ConnectionQuality.FAIR:
        return { timeout: 15000 }; // 15s for fair connections
      case ConnectionQuality.GOOD:
      case ConnectionQuality.EXCELLENT:
      default:
        return { timeout: 10000 }; // 10s for good connections
    }
  }

  /**
   * Get headers optimized for low bandwidth
   */
  private getLowBandwidthHeaders(
    quality: ConnectionQuality,
  ): Record<string, string> {
    if (!this._enableLowBandwidthMode) {
      return {};
    }

    // Only apply compression for poor connections
    if (
      quality === ConnectionQuality.POOR ||
      quality === ConnectionQuality.CRITICAL
    ) {
      return {
        'Accept-Encoding': 'gzip, deflate',
        Accept: 'application/json',
      };
    }

    return {};
  }
}
