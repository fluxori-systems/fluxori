/**
 * Test Data Generator for Fluxori Performance Tests
 * 
 * This script generates realistic test data for performance testing
 * the Fluxori platform on Google Cloud.
 */

const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');

// Configure faker to use South African locale when appropriate
faker.locale = 'en_ZA';

// Parse command line arguments
const args = process.argv.slice(2);
const dataSize = args.find(arg => arg.startsWith('--size='))?.split('=')[1] || 'medium';
const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || path.join(__dirname, 'data');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Configure data size
const SIZE_CONFIG = {
  small: {
    organizations: 2,
    usersPerOrg: 5,
    productsPerOrg: 50,
    warehousesPerOrg: 2,
    ordersPerOrg: 100,
    marketplacesPerOrg: 2,
    insightsPerOrg: 20,
    documentsPerOrg: 30,
  },
  medium: {
    organizations: 5,
    usersPerOrg: 20,
    productsPerOrg: 500,
    warehousesPerOrg: 5,
    ordersPerOrg: 1000,
    marketplacesPerOrg: 5,
    insightsPerOrg: 100,
    documentsPerOrg: 200,
  },
  large: {
    organizations: 20,
    usersPerOrg: 50,
    productsPerOrg: 5000,
    warehousesPerOrg: 20,
    ordersPerOrg: 10000,
    marketplacesPerOrg: 10,
    insightsPerOrg: 500,
    documentsPerOrg: 1000,
  },
};

// Get configuration for the requested data size
const config = SIZE_CONFIG[dataSize] || SIZE_CONFIG.medium;

console.log(`=== Generating Test Data (${dataSize} size) ===`);
console.log(`Organizations: ${config.organizations}`);
console.log(`Users per organization: ${config.usersPerOrg}`);
console.log(`Products per organization: ${config.productsPerOrg}`);
console.log(`Warehouses per organization: ${config.warehousesPerOrg}`);
console.log(`Orders per organization: ${config.ordersPerOrg}`);
console.log(`Marketplaces per organization: ${config.marketplacesPerOrg}`);
console.log(`Insights per organization: ${config.insightsPerOrg}`);
console.log(`Documents per organization: ${config.documentsPerOrg}`);
console.log('==========================================');

// Generate organizations
function generateOrganizations() {
  const organizations = [];
  
  for (let i = 0; i < config.organizations; i++) {
    const orgId = `org_${faker.datatype.uuid()}`;
    organizations.push({
      id: orgId,
      name: faker.company.name(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zip: faker.location.zipCode(),
        country: 'South Africa',
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    });
  }
  
  return organizations;
}

// Generate users for organizations
function generateUsers(organizations) {
  const users = [];
  
  organizations.forEach(org => {
    for (let i = 0; i < config.usersPerOrg; i++) {
      const isAdmin = i === 0; // First user is admin
      
      users.push({
        id: `user_${faker.datatype.uuid()}`,
        organizationId: org.id,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email({ firstName: faker.person.firstName(), lastName: faker.person.lastName(), provider: org.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com' }),
        role: isAdmin ? 'ADMIN' : 'USER',
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      });
    }
  });
  
  return users;
}

// Generate warehouses for organizations
function generateWarehouses(organizations) {
  const warehouses = [];
  
  organizations.forEach(org => {
    for (let i = 0; i < config.warehousesPerOrg; i++) {
      warehouses.push({
        id: `wh_${faker.datatype.uuid()}`,
        organizationId: org.id,
        name: `${faker.location.city()} Warehouse`,
        code: faker.airline.recordLocator(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zip: faker.location.zipCode(),
          country: 'South Africa',
        },
        isActive: faker.datatype.boolean(0.9), // 90% are active
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      });
    }
  });
  
  return warehouses;
}

// Generate products for organizations
function generateProducts(organizations, warehouses) {
  const products = [];
  const warehousesByOrg = {};
  
  // Group warehouses by organization
  warehouses.forEach(warehouse => {
    if (!warehousesByOrg[warehouse.organizationId]) {
      warehousesByOrg[warehouse.organizationId] = [];
    }
    warehousesByOrg[warehouse.organizationId].push(warehouse);
  });
  
  organizations.forEach(org => {
    const orgWarehouses = warehousesByOrg[org.id] || [];
    
    for (let i = 0; i < config.productsPerOrg; i++) {
      const productId = `prod_${faker.datatype.uuid()}`;
      
      // Create product
      products.push({
        id: productId,
        organizationId: org.id,
        sku: faker.airline.recordLocator() + faker.number.int(999),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        category: faker.commerce.department(),
        price: parseFloat(faker.commerce.price({ min: 50, max: 5000 })),
        cost: parseFloat(faker.commerce.price({ min: 20, max: 2500 })),
        weight: parseFloat(faker.number.float({ min: 0.1, max: 20, precision: 0.01 })),
        dimensions: {
          length: parseFloat(faker.number.float({ min: 1, max: 100, precision: 0.1 })),
          width: parseFloat(faker.number.float({ min: 1, max: 100, precision: 0.1 })),
          height: parseFloat(faker.number.float({ min: 1, max: 100, precision: 0.1 })),
        },
        isActive: faker.datatype.boolean(0.9), // 90% are active
        attributes: {
          color: faker.color.human(),
          material: faker.commerce.productMaterial(),
          brand: faker.company.name(),
        },
        images: [
          faker.image.url(),
          faker.image.url(),
        ],
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      });
      
      // Create stock levels for this product in each warehouse
      orgWarehouses.forEach(warehouse => {
        if (warehouse.isActive) {
          products.push({
            id: `stock_${faker.datatype.uuid()}`,
            type: 'STOCK_LEVEL',
            productId,
            organizationId: org.id,
            warehouseId: warehouse.id,
            quantity: faker.number.int({ min: 0, max: 1000 }),
            reservedQuantity: faker.number.int({ min: 0, max: 20 }),
            reorderThreshold: faker.number.int({ min: 5, max: 50 }),
            reorderQuantity: faker.number.int({ min: 10, max: 100 }),
            lastStockCheck: faker.date.recent(),
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
          });
        }
      });
    }
  });
  
  return products;
}

// Generate orders for organizations
function generateOrders(organizations, products) {
  const orders = [];
  const productsByOrg = {};
  
  // Group products by organization
  products
    .filter(p => !p.type || p.type !== 'STOCK_LEVEL') // Filter out stock levels
    .forEach(product => {
      if (!productsByOrg[product.organizationId]) {
        productsByOrg[product.organizationId] = [];
      }
      productsByOrg[product.organizationId].push(product);
    });
  
  organizations.forEach(org => {
    const orgProducts = productsByOrg[org.id] || [];
    
    for (let i = 0; i < config.ordersPerOrg; i++) {
      // Select random products for this order
      const numOrderItems = faker.number.int({ min: 1, max: 5 });
      const orderItems = [];
      
      for (let j = 0; j < numOrderItems; j++) {
        const product = faker.helpers.arrayElement(orgProducts);
        const quantity = faker.number.int({ min: 1, max: 10 });
        
        orderItems.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity,
          price: product.price,
          total: product.price * quantity,
        });
      }
      
      const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
      const shippingCost = parseFloat(faker.commerce.price({ min: 30, max: 150 }));
      const total = subtotal + shippingCost;
      
      // Random order status
      const possibleStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      const weights = [0.1, 0.2, 0.3, 0.3, 0.1]; // Probability distribution
      
      let status;
      const random = Math.random();
      let cumulativeWeight = 0;
      
      for (let k = 0; k < possibleStatuses.length; k++) {
        cumulativeWeight += weights[k];
        if (random <= cumulativeWeight) {
          status = possibleStatuses[k];
          break;
        }
      }
      
      orders.push({
        id: `order_${faker.datatype.uuid()}`,
        organizationId: org.id,
        orderNumber: `ORD-${faker.airline.recordLocator()}${faker.number.int(999)}`,
        status,
        customer: {
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          email: faker.internet.email(),
          phone: faker.phone.number(),
          address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zip: faker.location.zipCode(),
            country: 'South Africa',
          },
        },
        items: orderItems,
        subtotal,
        shippingCost,
        total,
        paymentMethod: faker.helpers.arrayElement(['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'COD']),
        shippingMethod: faker.helpers.arrayElement(['STANDARD', 'EXPRESS', 'OVERNIGHT']),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      });
    }
  });
  
  return orders;
}

// Generate marketplace configs for organizations
function generateMarketplaces(organizations) {
  const marketplaces = [];
  const marketplaceTypes = ['SHOPIFY', 'WOOCOMMERCE', 'AMAZON', 'TAKEALOT', 'BIDORBUY'];
  
  organizations.forEach(org => {
    // Randomly select marketplace types for this organization
    const numMarketplaces = Math.min(config.marketplacesPerOrg, marketplaceTypes.length);
    const selectedTypes = faker.helpers.arrayElements(marketplaceTypes, numMarketplaces);
    
    selectedTypes.forEach(type => {
      marketplaces.push({
        id: `mp_${faker.datatype.uuid()}`,
        organizationId: org.id,
        name: `${org.name} ${type}`,
        type,
        isActive: faker.datatype.boolean(0.8), // 80% are active
        credentials: {
          apiKey: `api_${faker.string.alphanumeric(20)}`,
          apiSecret: `secret_${faker.string.alphanumeric(32)}`,
          storeUrl: type === 'SHOPIFY' ? `https://${org.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.myshopify.com` : 
                    type === 'WOOCOMMERCE' ? `https://${org.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.za` :
                    'https://example.com',
        },
        syncSettings: {
          syncProducts: faker.datatype.boolean(0.9),
          syncInventory: faker.datatype.boolean(0.8),
          syncOrders: faker.datatype.boolean(0.95),
          syncInterval: faker.helpers.arrayElement([15, 30, 60, 120, 240]),
        },
        lastSyncedAt: faker.date.recent(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      });
    });
  });
  
  return marketplaces;
}

// Generate AI insights for organizations
function generateInsights(organizations) {
  const insights = [];
  const insightTypes = ['INVENTORY_ALERT', 'SALES_TREND', 'MARKET_OPPORTUNITY', 'PRICING_RECOMMENDATION', 'LOGISTICS_OPTIMIZATION'];
  const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  
  organizations.forEach(org => {
    for (let i = 0; i < config.insightsPerOrg; i++) {
      const type = faker.helpers.arrayElement(insightTypes);
      const severity = faker.helpers.arrayElement(severities);
      
      let title, description, data;
      
      switch (type) {
        case 'INVENTORY_ALERT':
          title = 'Low stock inventory detected';
          description = 'Several products are below their reorder threshold and may need restocking.';
          data = {
            products: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
              id: `prod_${faker.string.alphanumeric(8)}`,
              name: faker.commerce.productName(),
              currentStock: faker.number.int({ min: 0, max: 5 }),
              reorderThreshold: faker.number.int({ min: 10, max: 20 }),
            })),
          };
          break;
          
        case 'SALES_TREND':
          title = 'Increasing sales trend detected';
          description = 'Several products are showing increasing sales over the past 30 days.';
          data = {
            periodStart: faker.date.past({ days: 30 }).toISOString(),
            periodEnd: new Date().toISOString(),
            overallGrowth: faker.number.float({ min: 5, max: 25, precision: 0.1 }),
            products: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
              id: `prod_${faker.string.alphanumeric(8)}`,
              name: faker.commerce.productName(),
              growthRate: faker.number.float({ min: 5, max: 50, precision: 0.1 }),
            })),
          };
          break;
          
        case 'MARKET_OPPORTUNITY':
          title = 'Market opportunity identified';
          description = 'Based on search trends and competitor analysis, new market opportunities were identified.';
          data = {
            marketSegment: faker.commerce.department(),
            potentialRevenue: parseFloat(faker.commerce.price({ min: 10000, max: 100000 })),
            confidenceScore: faker.number.float({ min: 0.6, max: 0.95, precision: 0.01 }),
            recommendedProducts: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
              name: faker.commerce.productName(),
              estimatedDemand: faker.number.int({ min: 100, max: 1000 }),
            })),
          };
          break;
          
        case 'PRICING_RECOMMENDATION':
          title = 'Pricing optimization recommendations';
          description = 'AI analysis suggests optimal price adjustments for maximum revenue.';
          data = {
            analysisDate: new Date().toISOString(),
            recommendations: Array.from({ length: faker.number.int({ min: 3, max: 10 }) }, () => ({
              productId: `prod_${faker.string.alphanumeric(8)}`,
              productName: faker.commerce.productName(),
              currentPrice: parseFloat(faker.commerce.price({ min: 100, max: 2000 })),
              recommendedPrice: parseFloat(faker.commerce.price({ min: 100, max: 2000 })),
              estimatedImpact: faker.number.float({ min: -10, max: 30, precision: 0.1 }),
            })),
          };
          break;
          
        case 'LOGISTICS_OPTIMIZATION':
          title = 'Warehouse optimization opportunities';
          description = 'Analysis of order patterns suggests logistics optimizations.';
          data = {
            potentialSaving: parseFloat(faker.commerce.price({ min: 5000, max: 20000 })),
            recommendations: [
              'Reorganize warehouse layout based on product affinity',
              'Adjust inventory levels in regional warehouses',
              'Optimize shipping carrier selection for specific routes',
            ],
            impactAreas: {
              shippingCost: faker.number.float({ min: 5, max: 15, precision: 0.1 }),
              fulfillmentSpeed: faker.number.float({ min: 10, max: 30, precision: 0.1 }),
              inventoryCost: faker.number.float({ min: 5, max: 20, precision: 0.1 }),
            },
          };
          break;
          
        default:
          title = 'General insight';
          description = 'General business insight based on data analysis.';
          data = { message: 'Generic insight data' };
      }
      
      insights.push({
        id: `insight_${faker.datatype.uuid()}`,
        organizationId: org.id,
        type,
        title,
        description,
        data,
        severity,
        confidence: faker.number.float({ min: 0.5, max: 0.98, precision: 0.01 }),
        status: faker.helpers.arrayElement(['NEW', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        expiresAt: faker.date.future(),
      });
    }
  });
  
  return insights;
}

// Generate documents for RAG system
function generateDocuments(organizations) {
  const documents = [];
  const documentTypes = ['PRODUCT_SPEC', 'SUPPLIER_INFO', 'LOGISTICS_GUIDE', 'MARKET_REPORT', 'TRAINING_MATERIAL'];
  
  organizations.forEach(org => {
    for (let i = 0; i < config.documentsPerOrg; i++) {
      const type = faker.helpers.arrayElement(documentTypes);
      
      let title, content;
      
      switch (type) {
        case 'PRODUCT_SPEC':
          title = `Product Specification: ${faker.commerce.productName()}`;
          content = `# ${title}\n\n` +
            `## Overview\n\n${faker.commerce.productDescription()}\n\n` +
            `## Technical Specifications\n\n` +
            `- Material: ${faker.commerce.productMaterial()}\n` +
            `- Dimensions: ${faker.number.int(100)}cm x ${faker.number.int(100)}cm x ${faker.number.int(100)}cm\n` +
            `- Weight: ${faker.number.float({ min: 0.1, max: 20 })}kg\n\n` +
            `## Features\n\n` +
            `- ${faker.commerce.productAdjective()} design\n` +
            `- High durability\n` +
            `- Easy maintenance\n\n` +
            `## Warranty\n\n` +
            `This product comes with a ${faker.number.int({ min: 1, max: 5 })}-year warranty.`;
          break;
          
        case 'SUPPLIER_INFO':
          title = `Supplier Information: ${faker.company.name()}`;
          content = `# ${title}\n\n` +
            `## Company Profile\n\n` +
            `${faker.company.name()} is a leading supplier of ${faker.commerce.department()} products. Founded in ${faker.date.past().getFullYear()}, they have established a reputation for quality and reliability.\n\n` +
            `## Contact Information\n\n` +
            `- Address: ${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.country()}\n` +
            `- Phone: ${faker.phone.number()}\n` +
            `- Email: ${faker.internet.email()}\n` +
            `- Website: ${faker.internet.url()}\n\n` +
            `## Products\n\n` +
            `They specialize in providing the following products:\n\n` +
            `- ${faker.commerce.productName()}\n` +
            `- ${faker.commerce.productName()}\n` +
            `- ${faker.commerce.productName()}\n\n` +
            `## Terms\n\n` +
            `- Payment Terms: Net ${faker.helpers.arrayElement([15, 30, 45, 60])} days\n` +
            `- Minimum Order: ${faker.number.int({ min: 5, max: 100 })} units\n` +
            `- Lead Time: ${faker.number.int({ min: 1, max: 8 })} weeks`;
          break;
          
        case 'LOGISTICS_GUIDE':
          title = 'Logistics and Shipping Guide';
          content = `# ${title}\n\n` +
            `## Shipping Methods\n\n` +
            `### Standard Shipping\n\n` +
            `- Delivery Time: ${faker.number.int({ min: 3, max: 7 })} business days\n` +
            `- Cost: R${faker.number.int({ min: 50, max: 150 })}\n\n` +
            `### Express Shipping\n\n` +
            `- Delivery Time: ${faker.number.int({ min: 1, max: 2 })} business days\n` +
            `- Cost: R${faker.number.int({ min: 150, max: 350 })}\n\n` +
            `## Warehousing Guidelines\n\n` +
            `- Store products in a cool, dry place\n` +
            `- Maintain inventory accuracy with regular stock checks\n` +
            `- Follow FIFO (First In, First Out) principles\n\n` +
            `## Return Policy\n\n` +
            `- Returns accepted within ${faker.number.int({ min: 7, max: 30 })} days of purchase\n` +
            `- Product must be in original packaging\n` +
            `- Return shipping costs covered by ${faker.helpers.arrayElement(['buyer', 'seller'])}`;
          break;
          
        case 'MARKET_REPORT':
          title = `Market Analysis: ${faker.commerce.department()} Sector`;
          content = `# ${title}\n\n` +
            `## Executive Summary\n\n` +
            `This report provides an analysis of the current state of the ${faker.commerce.department()} market in South Africa and identifies key trends and opportunities.\n\n` +
            `## Market Overview\n\n` +
            `The ${faker.commerce.department()} sector has shown a ${faker.number.float({ min: 1, max: 15 })}% growth over the past year, with projected continued expansion of ${faker.number.float({ min: 2, max: 10 })}% annually over the next three years.\n\n` +
            `## Key Trends\n\n` +
            `1. Increasing demand for ${faker.commerce.productAdjective()} products\n` +
            `2. Shift toward online purchasing\n` +
            `3. Growing importance of sustainability\n\n` +
            `## Competitive Landscape\n\n` +
            `The market is currently dominated by the following players:\n\n` +
            `- ${faker.company.name()}: ${faker.number.int({ min: 20, max: 40 })}% market share\n` +
            `- ${faker.company.name()}: ${faker.number.int({ min: 10, max: 30 })}% market share\n` +
            `- ${faker.company.name()}: ${faker.number.int({ min: 5, max: 20 })}% market share\n\n` +
            `## Recommendations\n\n` +
            `Based on our analysis, we recommend focusing on the following strategies:\n\n` +
            `- Expand online presence\n` +
            `- Develop eco-friendly product lines\n` +
            `- Target the growing ${faker.commerce.productAdjective()} market segment`;
          break;
          
        case 'TRAINING_MATERIAL':
          title = `Training Guide: ${faker.helpers.arrayElement(['Inventory Management', 'Order Processing', 'Customer Service', 'Marketing Strategies'])}`;
          content = `# ${title}\n\n` +
            `## Introduction\n\n` +
            `This training guide provides essential information on ${title.split(':')[1].trim()} for Fluxori platform users.\n\n` +
            `## Key Concepts\n\n` +
            `- ${faker.lorem.sentence()}\n` +
            `- ${faker.lorem.sentence()}\n` +
            `- ${faker.lorem.sentence()}\n\n` +
            `## Step-by-Step Procedures\n\n` +
            `### 1. ${faker.lorem.words(3)}\n\n` +
            `${faker.lorem.paragraph()}\n\n` +
            `### 2. ${faker.lorem.words(3)}\n\n` +
            `${faker.lorem.paragraph()}\n\n` +
            `### 3. ${faker.lorem.words(3)}\n\n` +
            `${faker.lorem.paragraph()}\n\n` +
            `## Best Practices\n\n` +
            `- ${faker.lorem.sentence()}\n` +
            `- ${faker.lorem.sentence()}\n` +
            `- ${faker.lorem.sentence()}\n\n` +
            `## Further Resources\n\n` +
            `- Internal Knowledge Base\n` +
            `- Support Team Contact: support@fluxori.com`;
          break;
          
        default:
          title = `Document: ${faker.lorem.words(3)}`;
          content = faker.lorem.paragraphs(5);
      }
      
      documents.push({
        id: `doc_${faker.datatype.uuid()}`,
        organizationId: org.id,
        type,
        title,
        content,
        fileUrl: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.3 }),
        metadata: {
          author: `${faker.person.firstName()} ${faker.person.lastName()}`,
          createdDate: faker.date.past().toISOString(),
          tags: faker.helpers.arrayElements(['important', 'reference', 'guide', 'technical', 'business'], faker.number.int({ min: 1, max: 3 })),
          version: `${faker.number.int({ min: 1, max: 5 })}.${faker.number.int({ min: 0, max: 9 })}`,
        },
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      });
    }
  });
  
  return documents;
}

// Generate all data
const organizations = generateOrganizations();
const users = generateUsers(organizations);
const warehouses = generateWarehouses(organizations);
const products = generateProducts(organizations, warehouses);
const orders = generateOrders(organizations, products);
const marketplaces = generateMarketplaces(organizations);
const insights = generateInsights(organizations);
const documents = generateDocuments(organizations);

// Save data to files
const saveData = (filename, data) => {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved ${data.length} records to ${filePath}`);
};

saveData('organizations.json', organizations);
saveData('users.json', users);
saveData('warehouses.json', warehouses);
saveData('products.json', products);
saveData('orders.json', orders);
saveData('marketplaces.json', marketplaces);
saveData('insights.json', insights);
saveData('documents.json', documents);

// Create a manifest file with data counts
const manifest = {
  dataSize,
  generatedAt: new Date().toISOString(),
  counts: {
    organizations: organizations.length,
    users: users.length,
    warehouses: warehouses.length,
    products: products.filter(p => !p.type || p.type !== 'STOCK_LEVEL').length,
    stockLevels: products.filter(p => p.type === 'STOCK_LEVEL').length,
    orders: orders.length,
    marketplaces: marketplaces.length,
    insights: insights.length,
    documents: documents.length,
  },
  totalRecords: organizations.length + users.length + warehouses.length + 
    products.length + orders.length + marketplaces.length + 
    insights.length + documents.length,
};

fs.writeFileSync(
  path.join(outputDir, 'manifest.json'), 
  JSON.stringify(manifest, null, 2)
);

console.log('\n=== Test Data Generation Complete ===');
console.log(`Total records generated: ${manifest.totalRecords}`);
console.log(`Data saved to: ${outputDir}`);
console.log('======================================');