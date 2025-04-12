/**
 * TypeScript Fixer for Connector System
 * 
 * This script addresses TypeScript errors in the connector module by:
 * 1. Fixing the connector interfaces to ensure they align with implementations
 * 2. Updating the connector implementation files to implement the missing abstract methods
 * 3. Ensuring consistent module interface boundaries are respected
 * 
 * This approach follows ADR-001 Module Boundary Enforcement principles
 */

import * as fs from 'fs';
import * as path from 'path';

// Paths
const BASE_PATH = path.resolve(__dirname, '../../src');
const MODULES_PATH = path.join(BASE_PATH, 'modules');
const INTERFACE_PATH = path.join(MODULES_PATH, 'interfaces');
const CONNECTORS_PATH = path.join(MODULES_PATH, 'connectors');
const ADAPTERS_PATH = path.join(CONNECTORS_PATH, 'adapters');

// Helper for creating backup file
function createBackup(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf8');
  const bakPath = `${filePath}.bak`;
  fs.writeFileSync(bakPath, content);
  console.log(`Created backup at ${bakPath}`);
}

// Helper to read a file with error handling
function readFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return '';
  }
}

/**
 * Fix inconsistencies in the connector interface
 */
function fixConnectorInterfaces(): void {
  console.log('Fixing connector interfaces...');
  
  // Fix module-level interface file first (master interface)
  const moduleInterfacePath = path.join(INTERFACE_PATH, 'connector.interface.ts');
  if (fs.existsSync(moduleInterfacePath)) {
    createBackup(moduleInterfacePath);
    
    let content = readFileContent(moduleInterfacePath);
    
    // Make sure import includes PaginatedResponse and OperationResult
    content = content.replace(
      /import {([^}]+)} from '.\/connector.types';/,
      `import { 
  ConnectorCredentials, 
  ConnectionStatus, 
  NetworkStatus, 
  OperationResult,
  PaginatedResponse
} from './connector.types';`
    );
    
    fs.writeFileSync(moduleInterfacePath, content);
    console.log(`Updated ${moduleInterfacePath}`);
  }
  
  // Now fix connector-specific interface with same definitions
  const connectorInterfacePath = path.join(CONNECTORS_PATH, 'interfaces', 'connector.interface.ts');
  if (fs.existsSync(connectorInterfacePath)) {
    createBackup(connectorInterfacePath);
    
    let content = readFileContent(connectorInterfacePath);
    
    // Make sure import includes PaginatedResponse and OperationResult
    content = content.replace(
      /import {([^}]+)} from '.\/types';/,
      `import { 
  ConnectorCredentials,
  ConnectionStatus, 
  NetworkStatus, 
  OperationResult,
  PaginatedResponse
} from './types';`
    );
    
    fs.writeFileSync(connectorInterfacePath, content);
    console.log(`Updated ${connectorInterfacePath}`);
  }
}

/**
 * Fix the implementation of abstract methods in BaseMarketplaceConnector
 */
function fixBaseMarketplaceConnector(): void {
  console.log('Fixing BaseMarketplaceConnector implementation...');
  
  const baseMarketplacePath = path.join(ADAPTERS_PATH, 'base-marketplace-connector.ts');
  if (fs.existsSync(baseMarketplacePath)) {
    createBackup(baseMarketplacePath);
    
    let content = readFileContent(baseMarketplacePath);
    
    // Make sure the getProductById method has correct return type
    const getProductByIdImpl = `  /**
   * Get a product by ID
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
  }`;
    
    // Add this method if it doesn't exist (with proper placement)
    if (!content.includes('getProductByIdInternal')) {
      // Find a place to insert - look for the class declaration
      const classEndMatch = content.match(/export abstract class BaseMarketplaceConnector[^{]*{/);
      if (classEndMatch) {
        const insertPosition = content.indexOf(classEndMatch[0]) + classEndMatch[0].length;
        content = content.substring(0, insertPosition) + 
                  '\n' + getProductByIdImpl + '\n' + 
                  content.substring(insertPosition);
      }
    }
    
    // Make sure getProductByIdInternal is declared
    if (!content.includes('getProductByIdInternal')) {
      const insertPosition = content.lastIndexOf('}');
      content = content.substring(0, insertPosition) + 
                `
  /**
   * Internal implementation for getting a product by ID
   * @param productId Product ID
   * @returns Operation result with product
   */
  protected abstract getProductByIdInternal(productId: string): Promise<OperationResult<MarketplaceProduct>>;
` + 
                content.substring(insertPosition);
    }
    
    // Make sure getOrders method correctly returns PaginatedResponse
    const getOrdersImpl = `  /**
   * Get orders with pagination
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
  }`;
    
    // Add getOrders method if it doesn't exist
    if (!content.includes('getOrdersInternal')) {
      // Find insertPosition after the getProductById method
      const insertPosition = content.lastIndexOf('}');
      content = content.substring(0, insertPosition) + 
                '\n' + getOrdersImpl + '\n' + 
                `
  /**
   * Internal implementation for fetching orders with pagination
   * @param options Pagination options
   * @returns Paginated response with orders
   */
  protected abstract getOrdersInternal(options: PaginationOptions): Promise<PaginatedResponse<MarketplaceOrder>>;
` + 
                content.substring(insertPosition);
    }
    
    fs.writeFileSync(baseMarketplacePath, content);
    console.log(`Updated ${baseMarketplacePath}`);
  }
}

/**
 * Fix concrete marketplace connector implementations
 */
function fixMarketplaceConnectors(): void {
  console.log('Fixing marketplace connector implementations...');
  
  // Find all marketplace connector files
  const connectorFiles = [
    path.join(ADAPTERS_PATH, 'amazon-sp', 'amazon-sp-connector.ts'),
    path.join(ADAPTERS_PATH, 'takealot-connector.ts'),
    path.join(ADAPTERS_PATH, 'woocommerce-connector.ts'),
    path.join(ADAPTERS_PATH, 'shopify', 'shopify-connector.ts')
  ];
  
  // Implementation templates
  const productByIdTemplate = `
  /**
   * Internal implementation for getting a product by ID
   */
  protected async getProductByIdInternal(productId: string): Promise<OperationResult<MarketplaceProduct>> {
    this.logger.warn(\`getProductByIdInternal not fully implemented for \${this.connectorName}\`);
    
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: \`Get product by ID is not yet fully implemented for \${this.connectorName}\`
      }
    };
  }`;
  
  const getOrdersTemplate = `
  /**
   * Internal implementation for fetching orders with pagination
   */
  protected async getOrdersInternal(options: PaginationOptions): Promise<PaginatedResponse<MarketplaceOrder>> {
    this.logger.warn(\`getOrdersInternal not fully implemented for \${this.connectorName}\`);
    
    return {
      data: [],
      pagination: {
        page: options.page || 0,
        pageSize: options.pageSize || 20,
        hasNextPage: false
      }
    };
  }`;
  
  // Fix each connector file
  for (const filePath of connectorFiles) {
    if (fs.existsSync(filePath)) {
      createBackup(filePath);
      
      let content = readFileContent(filePath);
      let updated = false;
      
      // Add getProductByIdInternal if missing
      if (!content.includes('getProductByIdInternal(')) {
        console.log(`Adding getProductByIdInternal to ${path.basename(filePath)}`);
        
        // Find a good insertion point - before the last }
        const insertPosition = content.lastIndexOf('}');
        content = content.substring(0, insertPosition) + 
                  productByIdTemplate + '\n' + 
                  content.substring(insertPosition);
        updated = true;
      }
      
      // Add getOrdersInternal if missing
      if (!content.includes('getOrdersInternal(')) {
        console.log(`Adding getOrdersInternal to ${path.basename(filePath)}`);
        
        // Find a good insertion point - before the last }
        const insertPosition = content.lastIndexOf('}');
        content = content.substring(0, insertPosition) + 
                  getOrdersTemplate + '\n' + 
                  content.substring(insertPosition);
        updated = true;
      }
      
      if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
      } else {
        console.log(`No changes needed for ${path.basename(filePath)}`);
      }
    } else {
      console.log(`File not found: ${filePath}`);
    }
  }
}

/**
 * Fix controller to handle optional methods properly
 */
function fixConnectorController(): void {
  console.log('Fixing connector controller...');
  
  const controllerPath = path.join(CONNECTORS_PATH, 'controllers', 'connector.controller.ts');
  if (fs.existsSync(controllerPath)) {
    createBackup(controllerPath);
    
    let content = readFileContent(controllerPath);
    
    // Fix getProductBySku usage
    if (content.includes('connector.getProductBySku(')) {
      content = content.replace(
        /return connector.getProductBySku\(([^)]+)\);/,
        `if (!connector.getProductBySku) {
      throw new BadRequestException(\`Connector \${connectorId} does not support getting products by SKU\`);
    }
    return connector.getProductBySku($1);`
      );
    }
    
    // Fix getRecentOrders usage
    if (content.includes('connector.getRecentOrders(')) {
      content = content.replace(
        /return connector.getRecentOrders\(([^)]+)\);/,
        `if (!connector.getRecentOrders) {
      // Fall back to standard getOrders if getRecentOrders is not available
      return connector.getOrders(paginationOptions);
    }
    return connector.getRecentOrders($1);`
      );
    }
    
    // Make sure BadRequestException is imported
    if (content.includes('BadRequestException') && !content.includes('import {')) {
      content = content.replace(
        /import {([^}]+)} from '@nestjs\/common';/,
        `import {$1, BadRequestException} from '@nestjs/common';`
      );
    }
    
    fs.writeFileSync(controllerPath, content);
    console.log(`Updated ${controllerPath}`);
  }
}

/**
 * Fix connector factory service
 */
function fixConnectorFactory(): void {
  console.log('Fixing connector factory service...');
  
  const factoryPath = path.join(CONNECTORS_PATH, 'services', 'connector-factory.service.ts');
  if (fs.existsSync(factoryPath)) {
    createBackup(factoryPath);
    
    let content = readFileContent(factoryPath);
    
    // Fix method name from disconnect to close
    content = content.replace(/await connector.disconnect\(\);/g, 'await connector.close();');
    
    // Fix method name from getHealth to getHealthStatus
    content = content.replace(/await connector.getHealth\(\);/g, 'await connector.getHealthStatus();');
    
    fs.writeFileSync(factoryPath, content);
    console.log(`Updated ${factoryPath}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting connector system TypeScript fixes...');
  
  try {
    // Create backup directory
    const backupDir = path.join(CONNECTORS_PATH, 'backups', new Date().toISOString().replace(/:/g, '-'));
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Fix interfaces first
    fixConnectorInterfaces();
    
    // Fix base implementations
    fixBaseMarketplaceConnector();
    
    // Fix concrete implementations
    fixMarketplaceConnectors();
    
    // Fix consumer components
    fixConnectorController();
    fixConnectorFactory();
    
    console.log('Connector system fixes completed.');
  } catch (error) {
    console.error('Error fixing connector system:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);