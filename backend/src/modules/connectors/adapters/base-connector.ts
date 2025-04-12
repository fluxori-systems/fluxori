/**
 * Base connector implementation with common functionality
 * 
 * This abstract class implements common functionality for API connectors,
 * including retry logic, error handling, circuit breaking, and network-aware optimizations.
 * Specific marketplace connectors should extend this class.
 */

import { Logger } from '@nestjs/common';

import {
  IConnector,
  IErrorHandlingConnector
} from '../interfaces/connector.interface';

import {
  ConnectorCredentials,
  ConnectionStatus,
  ConnectorErrorType,
  ConnectorError,
  RetryConfig,
  DEFAULT_SA_RETRY_CONFIG,
  CircuitBreakerConfig,
  DEFAULT_SA_CIRCUIT_BREAKER,
  CircuitStatus,
  NetworkStatus,
  ConnectionQuality,
  OperationResult
} from '../interfaces/types';

/**
 * Abstract base connector class with common functionality
 */
export abstract class BaseConnector implements IConnector, IErrorHandlingConnector {
  protected logger: Logger;
  protected credentials: ConnectorCredentials;
  protected _isInitialized = false;
  protected _connectionStatus: ConnectionStatus = {
    connected: false,
    quality: ConnectionQuality.UNKNOWN,
    lastChecked: new Date()
  };
  protected _networkStatus: NetworkStatus = {
    quality: ConnectionQuality.UNKNOWN
  };
  protected _recentErrors: ConnectorError[] = [];
  protected retryConfig: RetryConfig = DEFAULT_SA_RETRY_CONFIG;
  protected circuitBreakerConfig: CircuitBreakerConfig = DEFAULT_SA_CIRCUIT_BREAKER;
  protected circuitStatus: CircuitStatus = CircuitStatus.CLOSED;
  protected failureCount = 0;
  protected lastFailureTime: Date | null = null;
  protected lastSuccessTime: Date | null = null;
  protected halfOpenAttempts = 0;

  // Abstract properties that must be implemented by subclasses
  abstract readonly connectorId: string;
  abstract readonly connectorName: string;

  /**
   * Constructor for BaseConnector
   * @param loggerName Name to use for the logger
   */
  constructor(loggerName: string) {
    this.logger = new Logger(loggerName);
  }

  /**
   * Get current initialization state
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Get current connection status
   */
  get connectionStatus(): ConnectionStatus {
    return this._connectionStatus;
  }

  /**
   * Get current network status information
   */
  get networkStatus(): NetworkStatus {
    return this._networkStatus;
  }
  
  /**
   * Check and return current network status
   */
  async checkNetworkStatus(): Promise<NetworkStatus> {
    await this.updateNetworkStatus();
    return this._networkStatus;
  }

  /**
   * Get recent errors
   */
  get recentErrors(): Error[] {
    return [...this._recentErrors];
  }

  /**
   * Initialize the connector with API credentials
   * @param credentials API credentials
   */
  async initialize(credentials: ConnectorCredentials): Promise<void> {
    this.logger.log(`Initializing ${this.connectorName} connector`);

    if (!credentials) {
      throw new Error(`${this.connectorName} credentials are required`);
    }

    if (!credentials.organizationId) {
      throw new Error(`Organization ID is required for ${this.connectorName} connector`);
    }

    this.credentials = credentials;

    try {
      // Custom initialization logic from the subclass
      await this.initializeInternal(credentials);
      
      // Set the initialized flag
      this._isInitialized = true;
      
      // Update connection status
      this._connectionStatus = {
        connected: true,
        message: `${this.connectorName} connector initialized successfully`,
        quality: ConnectionQuality.GOOD,
        lastChecked: new Date()
      };
      
      this.logger.log(`${this.connectorName} connector initialized successfully`);
    } catch (error) {
      this._connectionStatus = {
        connected: false,
        message: `Failed to initialize ${this.connectorName}: ${error.message}`,
        quality: ConnectionQuality.CRITICAL,
        lastChecked: new Date(),
        details: {
          error: {
            code: 'INITIALIZATION_FAILED',
            message: error.message,
            details: error
          }
        }
      };
      
      this.logger.error(
        `Failed to initialize ${this.connectorName} connector: ${error.message}`,
        error.stack
      );
      
      this.recordError(error);
      throw this.enhanceError(error, ConnectorErrorType.AUTHENTICATION);
    }
  }

  /**
   * Internal initialization logic to be implemented by subclasses
   * @param credentials API credentials
   */
  protected abstract initializeInternal(credentials: ConnectorCredentials): Promise<void>;

  /**
   * Test the connection to the API
   */
  async testConnection(): Promise<ConnectionStatus> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    try {
      // Delegate to subclass implementation
      const status = await this.testConnectionInternal();
      
      // Reset circuit breaker on success
      this.onRequestSuccess();
      
      // Update and return the connection status
      this._connectionStatus = {
        ...status,
        lastChecked: new Date()
      };
      
      return this._connectionStatus;
    } catch (error) {
      // Handle connection failure
      this.onRequestFailure(error);
      
      const status: ConnectionStatus = {
        connected: false,
        message: `Connection test failed: ${error.message}`,
        quality: ConnectionQuality.POOR,
        lastChecked: new Date(),
        details: {
          error: {
            code: error.code || 'CONNECTION_ERROR',
            message: error.message,
            details: error
          }
        }
      };
      
      this._connectionStatus = status;
      return status;
    }
  }

  /**
   * Internal connection test implementation for subclasses
   */
  protected abstract testConnectionInternal(): Promise<ConnectionStatus>;

  /**
   * Get the current API rate limit status
   */
  abstract getRateLimitStatus(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  }>;

  /**
   * Refresh the connection to the API
   */
  async refreshConnection(): Promise<ConnectionStatus> {
    this.checkInitialized();
    
    try {
      // Test the connection
      const status = await this.testConnection();
      
      // If connected, try to refresh any tokens or session data
      if (status.connected) {
        try {
          await this.refreshConnectionInternal();
        } catch (error) {
          this.logger.warn(`Error refreshing connection internals: ${error.message}`);
        }
      }
      
      return status;
    } catch (error) {
      this.logger.error(`Failed to refresh connection: ${error.message}`, error.stack);
      
      this._connectionStatus = {
        connected: false,
        message: `Connection refresh failed: ${error.message}`,
        quality: ConnectionQuality.POOR,
        lastChecked: new Date()
      };
      
      return this._connectionStatus;
    }
  }
  
  /**
   * Internal method for refreshing connection internals (like tokens)
   * Subclasses can override this to implement specific refresh logic
   */
  protected async refreshConnectionInternal(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Get detailed health status information for the API connection
   */
  async getHealthStatus(): Promise<ConnectionStatus> {
    try {
      this.checkInitialized();
      
      // Test connection if it hasn't been checked recently (5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (!this._connectionStatus.lastChecked || this._connectionStatus.lastChecked < fiveMinutesAgo) {
        await this.testConnection();
      }
      
      if (!this._connectionStatus.connected) {
        return this._connectionStatus;
      }
      
      // Add rate limit info if available
      try {
        const rateLimits = await this.getRateLimitStatus();
        const currentStatus = { ...this._connectionStatus };
        if (!currentStatus.details) {
          currentStatus.details = {};
        }
        currentStatus.details.rateLimits = rateLimits;
        
        // Update quality based on rate limits
        if (rateLimits.remaining < rateLimits.limit * 0.1) {
          currentStatus.quality = ConnectionQuality.POOR;
          currentStatus.message = `${this.connectorName} API rate limit nearly exhausted`;
        }
        
        this._connectionStatus = currentStatus;
      } catch (e) {
        // Just log the error but don't fail the health check
        this.logger.warn(`Unable to fetch rate limits: ${e.message}`);
      }
      
      // Get detailed health from subclass if available
      try {
        const detailedHealth = await this.getDetailedHealthStatus();
        if (detailedHealth) {
          this._connectionStatus = {
            ...this._connectionStatus,
            ...detailedHealth,
            lastChecked: new Date()
          };
        }
      } catch (e) {
        this.logger.warn(`Error getting detailed health status: ${e.message}`);
      }
      
      return this._connectionStatus;
    } catch (error) {
      this.logger.error(
        `${this.connectorName} health check failed: ${error.message}`,
        error.stack
      );
      
      this.recordError(error);
      
      return {
        connected: false,
        message: `${this.connectorName} services unavailable: ${error.message}`,
        quality: ConnectionQuality.CRITICAL,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Optional detailed health status implementation for subclasses
   */
  protected async getDetailedHealthStatus(): Promise<Partial<ConnectionStatus> | null> {
    // Default implementation returns null
    // Subclasses can override to provide API-specific health information
    return null;
  }

  /**
   * Configure retry behavior for API requests
   * @param config Retry configuration options
   */
  configureRetry(config: RetryConfig): void {
    this.retryConfig = {
      ...this.retryConfig,
      ...config
    };
    
    this.logger.log(`Retry configuration updated for ${this.connectorName} connector`);
  }

  /**
   * Configure circuit breaker behavior
   * @param config Circuit breaker configuration options
   */
  configureCircuitBreaker(config: CircuitBreakerConfig): void {
    this.circuitBreakerConfig = {
      ...this.circuitBreakerConfig,
      ...config
    };
    
    this.logger.log(`Circuit breaker configuration updated for ${this.connectorName} connector`);
  }

  /**
   * Close the connector and clean up resources
   */
  async close(): Promise<void> {
    this.logger.log(`Closing ${this.connectorName} connector`);
    this._isInitialized = false;

    try {
      await this.closeInternal();
      this.logger.log(`${this.connectorName} connector closed successfully`);
    } catch (error) {
      this.logger.error(
        `Error closing ${this.connectorName} connector: ${error.message}`,
        error.stack
      );
      
      this.recordError(error);
    }
  }

  /**
   * Internal close method to be implemented by subclasses if needed
   */
  protected async closeInternal(): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override to release resources
  }

  /**
   * Clear recent error history
   */
  clearErrorHistory(): void {
    this._recentErrors = [];
  }

  /**
   * Update the network status based on API performance
   * This should be called periodically to assess network conditions
   */
  protected async updateNetworkStatus(): Promise<void> {
    // Default implementation uses recent errors and connection status to assess network quality
    const now = Date.now();
    const recentErrorsTimeWindow = 5 * 60 * 1000; // 5 minutes
    
    // Count recent errors - filter to only include errors with timestamp
    const recentErrors = this._recentErrors.filter(
      e => e?.timestamp instanceof Date && now - e.timestamp.getTime() < recentErrorsTimeWindow
    ) as ConnectorError[];
    
    const recentErrorCount = recentErrors.length;
    const networkErrors = recentErrors.filter(
      e => e?.type === ConnectorErrorType.NETWORK || e?.type === ConnectorErrorType.TIMEOUT
    ).length;
    
    // Calculate quality
    let quality = ConnectionQuality.GOOD;
    
    if (!this._connectionStatus.connected) {
      quality = ConnectionQuality.CRITICAL;
    } else if (this.circuitStatus === CircuitStatus.OPEN) {
      quality = ConnectionQuality.CRITICAL;
    } else if (this.circuitStatus === CircuitStatus.HALF_OPEN) {
      quality = ConnectionQuality.POOR;
    } else if (networkErrors > 5) {
      quality = ConnectionQuality.POOR;
    } else if (networkErrors > 2) {
      quality = ConnectionQuality.FAIR;
    } else if (recentErrorCount > 10) {
      quality = ConnectionQuality.FAIR;
    }
    
    // Update the network status
    this._networkStatus = {
      ...this._networkStatus,
      quality,
      successRate: this._recentErrors.length > 0 
        ? 100 - (networkErrors / this._recentErrors.length * 100) 
        : 100
    };
    
    // Try to detect load shedding in South Africa
    if (networkErrors > 0) {
      const timePattern = this.detectLoadSheddingPattern();
      if (timePattern) {
        this._networkStatus.possibleLoadShedding = true;
      }
    }
  }

  /**
   * Detect if error patterns suggest load shedding in South Africa
   * Load shedding typically occurs at predictable times
   */
  private detectLoadSheddingPattern(): boolean {
    // Implementation based on typical load shedding schedules
    // This is a simplified version - a real implementation would be more sophisticated
    const now = new Date();
    const hour = now.getHours();
    
    // Common load shedding times in South Africa
    const loadSheddingHours = [6, 7, 8, 12, 13, 18, 19, 20];
    
    if (loadSheddingHours.includes(hour) && this._recentErrors.length > 3) {
      // Check if we have network errors clustering in these hours
      const timeWindowErrorCount = this._recentErrors.filter(e => {
        if (!(e?.timestamp instanceof Date)) return false;
        const errorHour = e.timestamp.getHours();
        return Math.abs(errorHour - hour) <= 1;
      }).length;
      
      if (timeWindowErrorCount >= 3) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Execute a function with retry logic
   * @param operation Function to execute
   * @param context Context for logging
   * @param customConfig Optional custom retry configuration
   * @returns The result of the operation
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customConfig };
    this.checkCircuitBreaker();
    
    let attempt = 0;
    let lastError: any;
    
    while (attempt <= config.maxRetries) {
      try {
        // If not the first attempt, apply delay
        if (attempt > 0) {
          const delay = Math.min(
            config.initialDelayMs * Math.pow(config.backoffFactor, attempt - 1),
            config.maxDelayMs
          );
          
          if (config.verboseLogging) {
            this.logger.log(`Retry ${attempt}/${config.maxRetries} for ${context} after ${delay}ms delay`);
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        attempt++;
        const result = await operation();
        
        // Record success
        this.onRequestSuccess();
        return result;
      } catch (error) {
        lastError = error;
        
        // Record error
        this.onRequestFailure(error);
        
        // Check if we should retry
        const isRetryableError = this.isRetryableError(error, config);
        
        if (!isRetryableError || attempt >= config.maxRetries) {
          break;
        }
        
        if (config.verboseLogging) {
          this.logger.warn(
            `Operation ${context} failed with retryable error: ${error.message}. Retry ${attempt}/${config.maxRetries}`
          );
        }
      }
    }
    
    // If we get here, all retries failed
    this.logger.error(
      `Operation ${context} failed after ${attempt} attempts: ${lastError.message}`,
      lastError.stack
    );
    
    throw this.enhanceError(
      lastError,
      lastError.type || ConnectorErrorType.UNKNOWN,
      `Failed after ${attempt} attempts: ${lastError.message}`
    );
  }

  /**
   * Determine if an error should trigger a retry
   * @param error Error that occurred
   * @param config Retry configuration
   * @returns Whether the error is retryable
   */
  protected isRetryableError(error: any, config: RetryConfig): boolean {
    // If the error is already a ConnectorError with retryable property
    if (error.retryable !== undefined) {
      return error.retryable;
    }
    
    // If a custom isRetryable function is provided, use it
    if (config.isRetryable) {
      return config.isRetryable(error);
    }
    
    // Check status code against retryable status codes
    if (error.statusCode && config.retryableStatusCodes.includes(error.statusCode)) {
      return true;
    }
    
    // Check error types that are generally retryable
    const retryableTypes = [
      ConnectorErrorType.NETWORK,
      ConnectorErrorType.TIMEOUT,
      ConnectorErrorType.SERVER_ERROR,
      ConnectorErrorType.RATE_LIMIT,
    ];
    
    if (error.type && retryableTypes.includes(error.type)) {
      return true;
    }
    
    // Check for load shedding if configured to continue during load shedding
    if (
      config.continueOnLoadShedding && 
      error.type === ConnectorErrorType.LOAD_SHEDDING
    ) {
      return true;
    }
    
    return false;
  }

  /**
   * Record an error in the error history
   * @param error Error that occurred
   */
  protected recordError(error: any): void {
    // Always convert to a proper ConnectorError
    let connectorError: ConnectorError;
    
    if (error instanceof Error) {
      connectorError = this.enhanceError(
        error, 
        (error as any).type || ConnectorErrorType.UNKNOWN
      );
    } else {
      connectorError = this.enhanceError(
        new Error(typeof error === 'string' ? error : 'Unknown error'),
        ConnectorErrorType.UNKNOWN
      );
    }
    
    // Keep last 20 errors
    this._recentErrors.unshift(connectorError);
    if (this._recentErrors.length > 20) {
      this._recentErrors.pop();
    }
  }

  /**
   * Enhance an error with connector-specific information
   * @param error Original error
   * @param type Error type
   * @param message Optional custom message
   * @returns Enhanced error
   */
  protected enhanceError(
    error: any,
    type: ConnectorErrorType,
    message?: string
  ): ConnectorError {
    const statusCode = error.statusCode || error.status || error.code;
    
    // Determine if error is retryable
    const retryable = this.isRetryableForErrorType(type, statusCode);
    
    // Create enhanced error with all required properties
    class ConnectorErrorImpl extends Error implements ConnectorError {
      type: ConnectorErrorType;
      statusCode?: number;
      retryable: boolean;
      originalError?: any;
      details?: any;
      timestamp: Date;
      
      constructor(message: string, connectorName: string) {
        super(message);
        this.name = `${connectorName}Error`;
        this.timestamp = new Date();
      }
    }
    
    const enhancedError = new ConnectorErrorImpl(
      message || error.message || `${this.connectorName} error`,
      this.connectorName
    );
    
    enhancedError.name = `${this.connectorName}Error`;
    enhancedError.type = type;
    enhancedError.statusCode = statusCode;
    enhancedError.retryable = retryable;
    enhancedError.originalError = error;
    enhancedError.stack = error.stack;
    
    // Include additional details if available
    if (error.details) {
      enhancedError.details = error.details;
    }
    
    return enhancedError;
  }

  /**
   * Determine if an error type is generally retryable
   * @param type Error type
   * @param statusCode HTTP status code if available
   * @returns Whether the error type is retryable
   */
  protected isRetryableForErrorType(
    type: ConnectorErrorType,
    statusCode?: number
  ): boolean {
    switch (type) {
      case ConnectorErrorType.NETWORK:
      case ConnectorErrorType.TIMEOUT:
      case ConnectorErrorType.SERVER_ERROR:
      case ConnectorErrorType.LOAD_SHEDDING:
        return true;
      
      case ConnectorErrorType.RATE_LIMIT:
        return true;
      
      case ConnectorErrorType.AUTHENTICATION:
      case ConnectorErrorType.AUTHORIZATION:
      case ConnectorErrorType.VALIDATION:
      case ConnectorErrorType.NOT_FOUND:
      case ConnectorErrorType.UNSUPPORTED:
        return false;
      
      default:
        // For unknown errors, try to determine by status code
        if (statusCode) {
          return [408, 429, 500, 502, 503, 504].includes(statusCode);
        }
        return false;
    }
  }

  /**
   * Check if the connector is initialized
   * @throws Error if not initialized
   */
  protected checkInitialized(): void {
    if (!this._isInitialized) {
      throw new Error(
        `${this.connectorName} connector is not initialized. Call initialize() first.`
      );
    }
  }

  /**
   * Check if circuit breaker is open
   * @throws Error if circuit is open
   */
  protected checkCircuitBreaker(): void {
    if (this.circuitStatus === CircuitStatus.OPEN) {
      throw this.enhanceError(
        new Error(`Circuit breaker is open for ${this.connectorName} connector`),
        ConnectorErrorType.SERVER_ERROR,
        `Service unavailable: Circuit breaker is open for ${this.connectorName} connector`
      );
    }
  }

  /**
   * Record a successful request for circuit breaker
   */
  protected onRequestSuccess(): void {
    if (this.circuitStatus === CircuitStatus.HALF_OPEN) {
      this.halfOpenAttempts++;
      
      if (this.halfOpenAttempts >= this.circuitBreakerConfig.halfOpenSuccessThreshold) {
        // Reset circuit breaker
        this.circuitStatus = CircuitStatus.CLOSED;
        this.failureCount = 0;
        this.halfOpenAttempts = 0;
        this.logger.log(`Circuit breaker closed for ${this.connectorName} connector after successful recovery`);
      }
    }
    
    this.lastSuccessTime = new Date();
  }

  /**
   * Record a failed request for circuit breaker
   * @param error Error that occurred
   */
  protected onRequestFailure(error: any): void {
    this.recordError(error);
    this.lastFailureTime = new Date();
    
    // In half-open state, a single failure trips the circuit back to open
    if (this.circuitStatus === CircuitStatus.HALF_OPEN) {
      this.circuitStatus = CircuitStatus.OPEN;
      this.halfOpenAttempts = 0;
      this.logger.warn(`Circuit breaker re-opened for ${this.connectorName} connector after failed recovery attempt`);
      return;
    }
    
    // Track failures within the time window
    const now = Date.now();
    const windowStart = now - this.circuitBreakerConfig.failureWindowMs;
    
    // Only count failures in current window
    this.failureCount = this._recentErrors.filter(e => 
      e?.timestamp instanceof Date && e.timestamp.getTime() > windowStart
    ).length;
    
    // Check if we should open the circuit
    if (
      this.circuitStatus === CircuitStatus.CLOSED &&
      this.failureCount >= this.circuitBreakerConfig.failureThreshold
    ) {
      this.circuitStatus = CircuitStatus.OPEN;
      this.logger.warn(`Circuit breaker opened for ${this.connectorName} connector after ${this.failureCount} failures`);
      
      // Schedule closing of circuit after reset timeout
      setTimeout(() => {
        if (this.circuitStatus === CircuitStatus.OPEN) {
          this.circuitStatus = CircuitStatus.HALF_OPEN;
          this.halfOpenAttempts = 0;
          this.logger.log(`Circuit breaker half-open for ${this.connectorName} connector after timeout`);
        }
      }, this.circuitBreakerConfig.resetTimeoutMs);
    }
  }

  /**
   * Create a successful operation result
   * @param data The data to include in the result
   * @returns A successful operation result
   */
  protected createSuccessResult<T>(data: T): OperationResult<T> {
    return {
      success: true,
      data
    };
  }

  /**
   * Create a failed operation result
   * @param code Error code
   * @param message Error message
   * @param details Optional additional details
   * @returns A failed operation result
   */
  protected createErrorResult<T>(
    code: string,
    message: string,
    details?: any
  ): OperationResult<T> {
    return {
      success: false,
      error: {
        code,
        message,
        details
      }
    };
  }
}

/**
 * Error class for enhanced connector errors
 */
export class ConnectorErrorImpl extends Error implements ConnectorError {
  type: ConnectorErrorType;
  statusCode?: number;
  retryable: boolean;
  originalError?: any;
  details?: any;
  timestamp: Date;

  constructor(
    message: string,
    type: ConnectorErrorType,
    retryable: boolean,
    statusCode?: number,
    originalError?: any,
    details?: any
  ) {
    super(message);
    this.name = 'ConnectorError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.originalError = originalError;
    this.details = details;
    this.timestamp = new Date();
  }
}