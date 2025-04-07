/**
 * Performance Testing Configuration
 * 
 * This file contains configuration for the Fluxori performance tests
 * targeting the Google Cloud Platform infrastructure.
 */

module.exports = {
  // Base URLs for different environments
  environments: {
    dev: {
      apiBaseUrl: 'https://fluxori-backend-dev.run.app',
      frontendBaseUrl: 'https://fluxori-frontend-dev.run.app',
    },
    staging: {
      apiBaseUrl: 'https://fluxori-backend-staging.run.app',
      frontendBaseUrl: 'https://fluxori-frontend-staging.run.app',
    },
    production: {
      apiBaseUrl: 'https://api.fluxori.com',
      frontendBaseUrl: 'https://app.fluxori.com',
    },
  },

  // Default test environment
  defaultEnvironment: 'dev',

  // Test user credentials
  testUsers: {
    admin: {
      email: 'admin-test@fluxori.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'default-test-password',
    },
    standard: {
      email: 'user-test@fluxori.com',
      password: process.env.TEST_USER_PASSWORD || 'default-test-password',
    },
  },

  // Concurrency settings
  concurrency: {
    default: 5,
    high: 20,
    extreme: 50,
  },

  // Duration settings (in seconds)
  duration: {
    short: 30,
    default: 60,
    long: 300,
  },

  // Rate settings (requests per second)
  rate: {
    low: 5,
    default: 20,
    high: 50,
  },

  // Performance thresholds
  thresholds: {
    // Response time thresholds in milliseconds
    responseTime: {
      p50: 200,  // 50th percentile (median)
      p90: 500,  // 90th percentile
      p95: 800,  // 95th percentile
      p99: 2000, // 99th percentile
    },
    // Error rate thresholds in percentage
    errorRate: {
      max: 1.0,  // Maximum acceptable error rate (1%)
    },
  },

  // Test scenarios
  scenarios: {
    // Inventory operations
    inventory: [
      { name: 'List Products', weight: 30, endpoint: '/api/inventory/products' },
      { name: 'Get Product', weight: 20, endpoint: '/api/inventory/products/:id' },
      { name: 'Update Product', weight: 5, endpoint: '/api/inventory/products/:id', method: 'PUT' },
      { name: 'List Warehouses', weight: 10, endpoint: '/api/inventory/warehouses' },
      { name: 'Get Stock Levels', weight: 25, endpoint: '/api/inventory/stock-levels' },
      { name: 'Update Stock', weight: 10, endpoint: '/api/inventory/stock-levels/:id', method: 'PUT' },
    ],
    
    // Order operations
    orders: [
      { name: 'List Orders', weight: 40, endpoint: '/api/orders' },
      { name: 'Get Order', weight: 30, endpoint: '/api/orders/:id' },
      { name: 'Create Order', weight: 15, endpoint: '/api/orders', method: 'POST' },
      { name: 'Update Order', weight: 15, endpoint: '/api/orders/:id', method: 'PUT' },
    ],
    
    // Marketplace operations
    marketplaces: [
      { name: 'List Marketplaces', weight: 20, endpoint: '/api/marketplaces' },
      { name: 'Get Marketplace', weight: 15, endpoint: '/api/marketplaces/:id' },
      { name: 'Sync Marketplace', weight: 5, endpoint: '/api/marketplaces/:id/sync', method: 'POST' },
    ],
    
    // AI insights operations
    insights: [
      { name: 'List Insights', weight: 30, endpoint: '/api/ai-insights/insights' },
      { name: 'Get Insight', weight: 20, endpoint: '/api/ai-insights/insights/:id' },
      { name: 'Generate Insights', weight: 5, endpoint: '/api/ai-insights/generate-insights', method: 'POST' },
      { name: 'Get Credits', weight: 5, endpoint: '/api/ai-insights/credits' },
    ],
    
    // RAG retrieval operations
    ragRetrieval: [
      { name: 'Search Documents', weight: 40, endpoint: '/api/rag-retrieval/search', method: 'POST' },
      { name: 'Get Document', weight: 30, endpoint: '/api/rag-retrieval/documents/:id' },
      { name: 'List Documents', weight: 30, endpoint: '/api/rag-retrieval/documents' },
    ],
  },
  
  // Special test cases for data-intensive operations
  specialTests: {
    // Large data batch operations
    batchOperations: {
      createBulkProducts: { endpoint: '/api/inventory/products/batch', method: 'POST', batchSize: 100 },
      updateBulkStockLevels: { endpoint: '/api/inventory/stock-levels/batch', method: 'PUT', batchSize: 200 },
    },
    
    // Expensive AI operations
    aiOperations: {
      vectorSearch: { endpoint: '/api/rag-retrieval/vector-search', method: 'POST' },
      generateLargeInsight: { endpoint: '/api/ai-insights/generate-insights', method: 'POST', dataSize: 'large' },
    },
  },
};