/**
 * TypeScript Fixer for Marketplace Connectors
 * 
 * This script fixes TypeScript errors in the marketplace connectors by adding
 * missing method implementations required by the BaseMarketplaceConnector class.
 */

import * as fs from 'fs';
import * as path from 'path';

// Paths
const BASE_PATH = path.resolve(__dirname, '../../src');
const MODULES_PATH = path.join(BASE_PATH, 'modules');
const CONNECTORS_PATH = path.join(MODULES_PATH, 'connectors');
const ADAPTERS_PATH = path.join(CONNECTORS_PATH, 'adapters');

// Connector files to fix
const CONNECTOR_FILES = [
  path.join(ADAPTERS_PATH, 'amazon-sp', 'amazon-sp-connector.ts'),
  path.join(ADAPTERS_PATH, 'takealot-connector.ts'),
  path.join(ADAPTERS_PATH, 'woocommerce-connector.ts'),
  path.join(ADAPTERS_PATH, 'shopify', 'shopify-connector.ts')
];

// Method implementations to add
const METHOD_IMPLEMENTATIONS = `

  /**
   * Get products by ID (required by BaseMarketplaceConnector)
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
  }

  /**
   * Get orders with pagination (required by BaseMarketplaceConnector)
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
  }
`;

// Fix files
async function main() {
  console.log('Starting TypeScript fixes for marketplace connectors...');

  for (const filePath of CONNECTOR_FILES) {
    try {
      if (fs.existsSync(filePath)) {
        console.log(`Fixing ${filePath}...`);
        fixConnectorFile(filePath);
      } else {
        console.log(`File not found: ${filePath}, skipping...`);
      }
    } catch (error) {
      console.error(`Error fixing ${filePath}:`, error);
    }
  }

  console.log('Marketplace connector fixes completed!');
}

/**
 * Fix a marketplace connector file by adding missing method implementations
 */
function fixConnectorFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the methods already exist
  const hasGetProductByIdInternal = content.includes('getProductByIdInternal');
  const hasGetOrdersInternal = content.includes('getOrdersInternal');
  
  if (hasGetProductByIdInternal && hasGetOrdersInternal) {
    console.log(`  - ${path.basename(filePath)} already has the required methods, skipping...`);
    return;
  }
  
  // Find the position to insert the methods
  // Look for the last method or the class closing bracket
  const lastMethodMatch = content.match(/protected async \w+\([^)]*\)[^{]*{[\s\S]*?}\s*$/);
  const classEndMatch = content.match(/}\s*$/);
  
  let insertPosition;
  
  if (lastMethodMatch) {
    // Insert after the last method
    insertPosition = content.lastIndexOf(lastMethodMatch[0]) + lastMethodMatch[0].length;
  } else if (classEndMatch) {
    // Insert before the class closing bracket
    insertPosition = content.lastIndexOf(classEndMatch[0]);
  } else {
    console.error(`  - Could not find insertion point in ${path.basename(filePath)}, skipping...`);
    return;
  }
  
  // Insert the methods
  const updatedContent = 
    content.substring(0, insertPosition) + 
    METHOD_IMPLEMENTATIONS + 
    content.substring(insertPosition);
  
  // Write the updated file
  fs.writeFileSync(filePath, updatedContent);
  console.log(`  - Successfully added missing methods to ${path.basename(filePath)}`);
}

// Run the script
main().catch(console.error);