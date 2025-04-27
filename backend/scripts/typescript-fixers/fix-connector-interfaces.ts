/**
 * TypeScript Fixer for Connector Interfaces
 *
 * This script fixes TypeScript errors in the connector interfaces by:
 * 1. Synchronizing interface methods between IConnector and BaseConnector implementations
 * 2. Ensuring consistent use of types between modules
 * 3. Fixing method naming discrepancies
 */

import * as fs from "fs";
import * as path from "path";

// Paths
const BASE_PATH = path.resolve(__dirname, "../../src");
const MODULES_PATH = path.join(BASE_PATH, "modules");
const CONNECTORS_PATH = path.join(MODULES_PATH, "connectors");
const INTERFACES_PATH = path.join(MODULES_PATH, "interfaces");

// Fix files
async function main() {
  console.log("Starting TypeScript fixes for connector interfaces...");

  try {
    // 1. Fix the connector interface files to match implementation
    await fixConnectorInterfaces();

    // 2. Synchronize connector types
    await synchronizeConnectorTypes();

    // 3. Fix NetworkStatus type
    await fixNetworkStatusType();

    // 4. Update BaseConnector implementation
    await fixBaseConnector();

    // 5. Update BaseMarketplaceConnector implementation
    await fixBaseMarketplaceConnector();

    console.log("Connector interface fixes completed successfully!");
  } catch (error) {
    console.error("Error fixing connector interfaces:", error);
    process.exit(1);
  }
}

/**
 * Fix connector interface files to match implementation
 */
async function fixConnectorInterfaces() {
  console.log("Fixing connector interfaces...");

  // Fix module-level interface
  const moduleLevelPath = path.join(INTERFACES_PATH, "connector.interface.ts");
  let content = fs.readFileSync(moduleLevelPath, "utf8");

  // Update imports
  content = content.replace(
    "import { ConnectorCredentials, ConnectionStatus } from './connector.types';",
    "import { ConnectorCredentials, ConnectionStatus, NetworkStatus } from './connector.types';",
  );

  // Update IConnector interface
  content = content.replace(
    /export interface IConnector \{[\s\S]*?\}/,
    `export interface IConnector {
  readonly connectorId: string;
  readonly connectorName: string;
  
  isInitialized: boolean;
  connectionStatus: ConnectionStatus;
  networkStatus: NetworkStatus;
  
  initialize(credentials: ConnectorCredentials): Promise<void>;
  testConnection(): Promise<ConnectionStatus>;
  
  // Other common connector methods
  getHealthStatus(): Promise<ConnectionStatus>;
  getRateLimitStatus(): Promise<{ remaining: number; reset: Date; limit: number; }>;
  close(): Promise<void>;
  checkNetworkStatus(): Promise<NetworkStatus>;
  refreshConnection(): Promise<ConnectionStatus>;
}`,
  );

  // Update IMarketplaceConnector interface
  content = content.replace(
    /export interface IMarketplaceConnector<[\s\S]*?\}/,
    `export interface IMarketplaceConnector<TProduct, TOrder, TAcknowledgment> extends IConnector {
  // Products
  getProducts(options?: any): Promise<any>;
  getProductById(productId: string): Promise<TProduct>;
  
  // Orders
  getOrders(options?: any): Promise<any>;
  getOrderById(orderId: string): Promise<any>;
  acknowledgeOrder(orderId: string): Promise<any>;
  
  // Stock and pricing
  updateStock(updates: Array<{
    sku: string;
    stockLevel: number;
    locationId?: string;
  }>): Promise<any>;
  
  updatePrices(updates: Array<{
    sku: string;
    price: number;
    compareAtPrice?: number;
    currency?: string;
  }>): Promise<any>;
}`,
  );

  // Remove EOF that causes syntax errors
  content = content.replace(/EOF < \/dev\/null\s*$/, "");

  fs.writeFileSync(moduleLevelPath, content);
  console.log(`Updated ${moduleLevelPath}`);

  // Fix connector-level interface
  const connectorLevelPath = path.join(
    CONNECTORS_PATH,
    "interfaces",
    "connector.interface.ts",
  );
  content = fs.readFileSync(connectorLevelPath, "utf8");

  // Update imports
  content = content.replace(
    "import { ConnectorCredentials, ConnectionStatus } from './connector.types';",
    "import { ConnectorCredentials, ConnectionStatus, NetworkStatus } from './types';",
  );

  // Update IConnector interface
  content = content.replace(
    /export interface IConnector \{[\s\S]*?\}/,
    `export interface IConnector {
  readonly connectorId: string;
  readonly connectorName: string;
  
  isInitialized: boolean;
  connectionStatus: ConnectionStatus;
  networkStatus: NetworkStatus;
  
  initialize(credentials: ConnectorCredentials): Promise<void>;
  testConnection(): Promise<ConnectionStatus>;
  
  // Other common connector methods
  getHealthStatus(): Promise<ConnectionStatus>;
  getRateLimitStatus(): Promise<{ remaining: number; reset: Date; limit: number; }>;
  close(): Promise<void>;
  checkNetworkStatus(): Promise<NetworkStatus>;
  refreshConnection(): Promise<ConnectionStatus>;
}`,
  );

  // Update IMarketplaceConnector interface
  content = content.replace(
    /export interface IMarketplaceConnector<[\s\S]*?\}/,
    `export interface IMarketplaceConnector<TProduct, TOrder, TAcknowledgment> extends IConnector {
  // Products
  getProducts(options?: any): Promise<any>;
  getProductById(productId: string): Promise<TProduct>;
  
  // Orders
  getOrders(options?: any): Promise<any>;
  getOrderById(orderId: string): Promise<any>;
  acknowledgeOrder(orderId: string): Promise<any>;
  
  // Stock and pricing
  updateStock(updates: Array<{
    sku: string;
    stockLevel: number;
    locationId?: string;
  }>): Promise<any>;
  
  updatePrices(updates: Array<{
    sku: string;
    price: number;
    compareAtPrice?: number;
    currency?: string;
  }>): Promise<any>;
}`,
  );

  // Remove EOF that causes syntax errors
  content = content.replace(/EOF < \/dev\/null\s*$/, "");

  fs.writeFileSync(connectorLevelPath, content);
  console.log(`Updated ${connectorLevelPath}`);
}

/**
 * Synchronize connector types between module-level and connector-level
 */
async function synchronizeConnectorTypes() {
  console.log("Synchronizing connector types...");

  // Read module-level types
  const moduleLevelPath = path.join(INTERFACES_PATH, "connector.types.ts");
  let content = fs.readFileSync(moduleLevelPath, "utf8");

  // Update ConnectionStatus interface
  content = content.replace(
    /export interface ConnectionStatus \{[\s\S]*?\}/,
    `export interface ConnectionStatus {
  connected: boolean;
  message: string;
  quality: ConnectionQuality;
  details?: Record<string, any>;
  lastChecked?: Date;
}`,
  );

  // Update ConnectionQuality enum
  content = content.replace(
    /export enum ConnectionQuality \{[\s\S]*?\}/,
    `export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}`,
  );

  // Add NetworkStatus interface if missing
  if (!content.includes("export interface NetworkStatus")) {
    // Find the position to insert after ConnectionQuality
    const indexAfterConnectionQuality =
      content.indexOf("export enum ConnectionQuality") +
      content
        .substring(content.indexOf("export enum ConnectionQuality"))
        .indexOf("}") +
      1;

    const networkStatusInterface = `

export interface NetworkStatus {
  quality: ConnectionQuality;
  connectionType?: 'fiber' | '4g' | '3g' | '2g' | 'unknown';
  provider?: 'Vodacom' | 'MTN' | 'CellC' | 'Telkom' | 'Rain' | 'other' | 'unknown';
  possibleLoadShedding?: boolean;
  averageLatencyMs?: number;
  packetLoss?: number;
  successRate?: number;
  costCategory?: 'low' | 'medium' | 'high' | 'unknown';
  downlinkSpeed?: number;
  [key: string]: any;
}`;

    content =
      content.substring(0, indexAfterConnectionQuality) +
      networkStatusInterface +
      content.substring(indexAfterConnectionQuality);
  }

  // Update PaginationOptions interface
  content = content.replace(
    /export interface PaginationOptions \{[\s\S]*?\}/,
    `export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC' | 'asc' | 'desc';
  filter?: Record<string, any>;
}`,
  );

  // Update PaginatedResponse interface
  content = content.replace(
    /export interface PaginatedResponse<T> \{[\s\S]*?\}/,
    `export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems?: number;
    totalPages?: number;
    hasNextPage: boolean;
    nextPageToken?: string;
  };
}`,
  );

  // Remove EOF that causes syntax errors
  content = content.replace(/EOF < \/dev\/null\s*$/, "");

  fs.writeFileSync(moduleLevelPath, content);
  console.log(`Updated ${moduleLevelPath}`);

  // Ensure connector-level types.ts exists or create it by copying from connector.types.ts
  const connectorTypesPath = path.join(
    CONNECTORS_PATH,
    "interfaces",
    "connector.types.ts",
  );
  const connectorLevelPath = path.join(
    CONNECTORS_PATH,
    "interfaces",
    "types.ts",
  );

  if (fs.existsSync(connectorTypesPath)) {
    // Rename the file if needed
    if (!fs.existsSync(connectorLevelPath)) {
      fs.renameSync(connectorTypesPath, connectorLevelPath);
      console.log(`Renamed ${connectorTypesPath} to ${connectorLevelPath}`);
    } else {
      // Update types.ts with content from connector.types.ts
      fs.writeFileSync(
        connectorLevelPath,
        fs.readFileSync(connectorTypesPath, "utf8"),
      );
      console.log(
        `Updated ${connectorLevelPath} with content from ${connectorTypesPath}`,
      );
    }
  }
}

/**
 * Fix NetworkStatus type
 */
async function fixNetworkStatusType() {
  console.log("Fixing NetworkStatus type...");

  // Fix BaseConnector if it uses 'online' | 'offline' | 'degraded' | 'unknown' instead of NetworkStatus
  const baseConnectorPath = path.join(
    CONNECTORS_PATH,
    "adapters",
    "base-connector.ts",
  );
  let content = fs.readFileSync(baseConnectorPath, "utf8");

  // Check if networkStatus is using the string union type
  if (
    content.includes(
      "networkStatus: 'online' | 'offline' | 'degraded' | 'unknown'",
    )
  ) {
    // Update the type
    content = content.replace(
      "networkStatus: 'online' | 'offline' | 'degraded' | 'unknown'",
      "networkStatus: NetworkStatus",
    );

    fs.writeFileSync(baseConnectorPath, content);
    console.log(`Updated NetworkStatus type in ${baseConnectorPath}`);
  }
}

/**
 * Fix BaseConnector implementation
 */
async function fixBaseConnector() {
  console.log("Fixing BaseConnector implementation...");

  const baseConnectorPath = path.join(
    CONNECTORS_PATH,
    "adapters",
    "base-connector.ts",
  );
  let content = fs.readFileSync(baseConnectorPath, "utf8");

  // Add checkNetworkStatus method if missing
  if (!content.includes("async checkNetworkStatus()")) {
    // Find the position after the networkStatus getter
    const networkStatusGetterMatch = content.match(
      /get networkStatus\(\)[^{]*{[\s\S]*?return[^;]*;[\s\S]*?}/,
    );

    if (networkStatusGetterMatch) {
      const indexAfterGetter =
        content.indexOf(networkStatusGetterMatch[0]) +
        networkStatusGetterMatch[0].length;

      const checkNetworkStatusMethod = `

  /**
   * Check and return current network status
   */
  async checkNetworkStatus(): Promise<NetworkStatus> {
    await this.updateNetworkStatus();
    return this._networkStatus;
  }`;

      content =
        content.substring(0, indexAfterGetter) +
        checkNetworkStatusMethod +
        content.substring(indexAfterGetter);

      fs.writeFileSync(baseConnectorPath, content);
      console.log(`Added checkNetworkStatus method to ${baseConnectorPath}`);
    }
  }

  // Add refreshConnection method if missing
  if (!content.includes("async refreshConnection()")) {
    // Find the position before getHealthStatus method
    const healthStatusMethodMatch = content.match(/async getHealthStatus\(\)/);

    if (healthStatusMethodMatch) {
      const indexBeforeMethod = content.indexOf(healthStatusMethodMatch[0]);

      const refreshConnectionMethod = `/**
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
          this.logger.warn(\`Error refreshing connection internals: \${error.message}\`);
        }
      }
      
      return status;
    } catch (error) {
      this.logger.error(\`Failed to refresh connection: \${error.message}\`, error.stack);
      
      this._connectionStatus = {
        connected: false,
        message: \`Connection refresh failed: \${error.message}\`,
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

  `;

      content =
        content.substring(0, indexBeforeMethod) +
        refreshConnectionMethod +
        content.substring(indexBeforeMethod);

      fs.writeFileSync(baseConnectorPath, content);
      console.log(`Added refreshConnection method to ${baseConnectorPath}`);
    }
  }
}

/**
 * Fix BaseMarketplaceConnector implementation
 */
async function fixBaseMarketplaceConnector() {
  console.log("Fixing BaseMarketplaceConnector implementation...");

  const baseMarketplaceConnectorPath = path.join(
    CONNECTORS_PATH,
    "adapters",
    "base-marketplace-connector.ts",
  );
  let content = fs.readFileSync(baseMarketplaceConnectorPath, "utf8");

  // Add getProductById and getOrders methods if missing
  let needsUpdate = false;

  // Check if getProductById is missing
  if (!content.includes("async getProductById(")) {
    // Find location after class declaration
    const classDeclarationMatch = content.match(
      /export abstract class BaseMarketplaceConnector[\s\S]*?{/,
    );

    if (classDeclarationMatch) {
      const indexAfterClassDeclaration =
        content.indexOf(classDeclarationMatch[0]) +
        classDeclarationMatch[0].length;

      const getProductByIdMethod = `
  
  /**
   * Fetch a product by its ID
   * @param productId The product ID
   * @returns Operation result containing the product if found
   */
  async getProductById(productId: string): Promise<OperationResult<MarketplaceProduct>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    try {
      return await this.executeWithRetry(
        () => this.getProductByIdInternal(productId),
        \`getProductById(\${productId})\`
      );
    } catch (error) {
      return this.createErrorResult(
        error.code || 'PRODUCT_FETCH_ERROR',
        \`Failed to fetch product with ID \${productId}: \${error.message}\`,
        error.details || error
      );
    }
  }
  
  /**
   * Internal implementation for fetching a product by ID
   */
  protected abstract getProductByIdInternal(productId: string): Promise<OperationResult<MarketplaceProduct>>;`;

      content =
        content.substring(0, indexAfterClassDeclaration) +
        getProductByIdMethod +
        content.substring(indexAfterClassDeclaration);

      needsUpdate = true;
    }

    // Check if getOrders is missing or needs update
    if (!content.includes("async getOrders(")) {
      const getProductByIdIndex = content.indexOf("async getProductById(");

      if (getProductByIdIndex !== -1) {
        // Find position after getProductById method and its internal abstract method
        const abstractMethodMatch = content.match(
          /protected abstract getProductByIdInternal[\s\S]*?;/,
        );

        if (abstractMethodMatch) {
          const indexAfterAbstractMethod =
            content.indexOf(abstractMethodMatch[0]) +
            abstractMethodMatch[0].length;

          const getOrdersMethod = `
  
  /**
   * Fetch orders with pagination
   * @param options Pagination options
   * @returns Paginated response of orders
   */
  async getOrders(options?: PaginationOptions): Promise<PaginatedResponse<MarketplaceOrder>> {
    this.checkInitialized();
    this.checkCircuitBreaker();

    const defaultOptions: PaginationOptions = {
      page: 0,
      pageSize: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      return await this.executeWithRetry(
        () => this.getOrdersInternal(mergedOptions),
        \`getOrders(page \${mergedOptions.page}, size \${mergedOptions.pageSize})\`
      );
    } catch (error) {
      // Return an empty paginated response on error
      return {
        data: [],
        pagination: {
          page: mergedOptions.page || 0,
          pageSize: mergedOptions.pageSize || 20,
          hasNextPage: false
        }
      };
    }
  }
  
  /**
   * Internal implementation for fetching orders with pagination
   */
  protected abstract getOrdersInternal(options: PaginationOptions): Promise<PaginatedResponse<MarketplaceOrder>>;`;

          content =
            content.substring(0, indexAfterAbstractMethod) +
            getOrdersMethod +
            content.substring(indexAfterAbstractMethod);

          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      fs.writeFileSync(baseMarketplaceConnectorPath, content);
      console.log(
        `Updated BaseMarketplaceConnector in ${baseMarketplaceConnectorPath}`,
      );
    }
  }
}

// Run the script
main().catch(console.error);
