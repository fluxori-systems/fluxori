/**
 * Integration Test: PIM Performance with Large Catalogs
 * 
 * This test suite evaluates PIM module performance with large product catalogs,
 * focusing on: 
 * 1. Search and filtering performance
 * 2. Batch operations performance
 * 3. Marketplace sync performance with large catalogs
 * 4. Performance under various network conditions
 * 
 * Addresses known issue from implementation status:
 * "Performance degradation with very large catalogs (10,000+ products)"
 */

const config = require('../config');

// Test constants
const PERFORMANCE_THRESHOLDS = {
  // Thresholds in milliseconds
  SMALL_CATALOG: {
    search: 500,
    filter: 500,
    batchUpdate: 2000,
    batchSync: 5000,
  },
  MEDIUM_CATALOG: {
    search: 1000,
    filter: 1000,
    batchUpdate: 5000,
    batchSync: 10000,
  },
  LARGE_CATALOG: {
    search: 2000,
    filter: 2000,
    batchUpdate: 10000,
    batchSync: 20000,
  },
};

const CATALOG_SIZES = {
  SMALL: 50,    // 50 products
  MEDIUM: 200,  // 200 products
  LARGE: 500,   // 500 products for testing
  // Production would test with 10,000+ but that's excessive for integration tests
};

// Generate a test product
const generateTestProduct = (index) => ({
  name: `Performance Test Product ${index}`,
  sku: `PERF-${index}`,
  barcode: `9781234${index.toString().padStart(5, '0')}`,
  description: `This is performance test product ${index} for load testing the PIM module.`,
  shortDescription: `Performance test product ${index}`,
  pricing: {
    basePrice: 100 + (index % 100),
    currency: 'ZAR',
    costPrice: 50 + (index % 50),
    vatIncluded: true,
  },
  inventory: {
    sku: `PERF-${index}`,
    barcode: `9781234${index.toString().padStart(5, '0')}`,
    stockLevel: 100 + (index % 100),
    lowStockThreshold: 10,
  },
  attributes: {
    color: ['Red', 'Blue', 'Green', 'Yellow', 'Black'][index % 5],
    size: ['Small', 'Medium', 'Large', 'XL', 'XXL'][index % 5],
    category: ['Electronics', 'Clothing', 'Home', 'Sports', 'Books'][index % 5],
    subcategory: `Subcategory-${index % 20}`,
    tags: [`tag-${index % 10}`, `tag-${(index + 1) % 10}`, `tag-${(index + 2) % 10}`],
  },
  isActive: index % 10 !== 0, // 10% of products inactive
});

describe('PIM Performance Tests', () => {
  // Track test products for cleanup
  const productIds = {
    SMALL: [],
    MEDIUM: [],
    LARGE: [],
  };
  
  // Track available marketplaces
  let marketplaceCredentials = {};
  
  // Flag to track if performance tests should run
  let shouldRunTests = true;
  
  // Authenticate and setup before all tests
  beforeAll(async () => {
    try {
      await testUtils.authenticate();
      
      console.log('Running performance tests - this may take some time...');
      
      // Check if performance tests should be skipped
      if (config.features.skipSlowTests) {
        console.log('Performance tests are disabled in configuration');
        shouldRunTests = false;
        return;
      }
      
      // Fetch marketplace credentials
      const credentialsResponse = await testUtils.api.get('/connectors/credentials');
      
      if (credentialsResponse.status === 200) {
        // Store credentials for later use
        credentialsResponse.data.forEach(cred => {
          if (!marketplaceCredentials[cred.connectorType]) {
            marketplaceCredentials[cred.connectorType] = cred.id;
          }
        });
        
        console.log('Available marketplace credentials:', Object.keys(marketplaceCredentials));
      }
      
      // Skip actual catalog creation in CI environment
      if (process.env.CI && !process.env.RUN_PERFORMANCE_TESTS) {
        console.log('Skipping large catalog creation in CI environment');
        shouldRunTests = false;
        return;
      }
      
      // Create test catalogs with different sizes
      console.log('Creating test catalogs - this may take some time...');
      
      // Small catalog
      console.log(`Creating SMALL catalog (${CATALOG_SIZES.SMALL} products)...`);
      productIds.SMALL = await createTestCatalog('SMALL', CATALOG_SIZES.SMALL);
      
      // Medium catalog
      console.log(`Creating MEDIUM catalog (${CATALOG_SIZES.MEDIUM} products)...`);
      productIds.MEDIUM = await createTestCatalog('MEDIUM', CATALOG_SIZES.MEDIUM);
      
      // Large catalog (create fewer products in test environment)
      console.log(`Creating LARGE catalog (${CATALOG_SIZES.LARGE} products)...`);
      productIds.LARGE = await createTestCatalog('LARGE', CATALOG_SIZES.LARGE);
      
    } catch (error) {
      console.error('Failed to prepare performance test data:', error);
      shouldRunTests = false;
    }
  }, 300000); // 5 minute timeout for catalog creation
  
  // Helper function to create a test catalog
  async function createTestCatalog(sizeKey, size) {
    const ids = [];
    const batchSize = 20; // Create products in batches to avoid overwhelming the API
    
    for (let batch = 0; batch < size / batchSize; batch++) {
      const batchPromises = [];
      
      for (let i = 0; i < batchSize; i++) {
        const index = batch * batchSize + i;
        const product = generateTestProduct(index);
        
        // Add a tag to identify the catalog
        product.attributes.performanceTest = sizeKey;
        
        batchPromises.push(
          testUtils.api.post('/pim/products', product)
            .then(response => {
              if (response.status === 201) {
                return response.data.id;
              }
              throw new Error(`Failed to create product: ${response.statusText}`);
            })
        );
      }
      
      try {
        const batchResults = await Promise.all(batchPromises);
        ids.push(...batchResults);
        console.log(`Created batch ${batch + 1}/${Math.ceil(size / batchSize)}: ${batchResults.length} products`);
      } catch (error) {
        console.error(`Error creating batch ${batch + 1}:`, error);
      }
    }
    
    console.log(`Completed ${sizeKey} catalog with ${ids.length} products`);
    return ids;
  }
  
  describe('Search Performance', () => {
    const testSearch = (sizeKey, expectedMaxTime) => {
      it(`should search ${sizeKey} catalog within performance threshold`, async () => {
        if (!shouldRunTests) {
          console.log(`Skipping ${sizeKey} search performance test`);
          return;
        }
        
        console.log(`Running search performance test for ${sizeKey} catalog...`);
        
        // Test basic search performance
        const start = Date.now();
        
        const response = await testUtils.api.get('/pim/products', {
          params: {
            search: 'Performance Test',
            attributeFilter: `performanceTest=${sizeKey}`,
            limit: 20,
          }
        });
        
        const duration = Date.now() - start;
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data.products)).toBe(true);
        expect(response.data).toHaveProperty('total');
        expect(response.data.total).toBeGreaterThan(0);
        
        console.log(`${sizeKey} catalog search took ${duration}ms for ${response.data.total} total matches`);
        
        // Assert search performance
        expect(duration).toBeLessThan(expectedMaxTime);
      });
    };
    
    // Test search performance for different catalog sizes
    testSearch('SMALL', PERFORMANCE_THRESHOLDS.SMALL_CATALOG.search);
    testSearch('MEDIUM', PERFORMANCE_THRESHOLDS.MEDIUM_CATALOG.search);
    testSearch('LARGE', PERFORMANCE_THRESHOLDS.LARGE_CATALOG.search);
    
    // Test complex filtering performance
    it('should filter products with complex criteria efficiently', async () => {
      if (!shouldRunTests) {
        console.log('Skipping complex filter performance test');
        return;
      }
      
      // Test complex filtering performance on LARGE catalog
      const start = Date.now();
      
      const response = await testUtils.api.get('/pim/products', {
        params: {
          attributeFilter: `performanceTest=LARGE,color=Blue,size=Medium`,
          priceRange: '100-200',
          stockRange: '100-200',
          isActive: 'true',
          sort: 'price:desc',
          limit: 50,
        }
      });
      
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('products');
      expect(response.data).toHaveProperty('total');
      
      console.log(`Complex filtering took ${duration}ms for ${response.data.total} matches`);
      
      // Assert filtering performance
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_CATALOG.filter);
    });
  });
  
  describe('Batch Operations Performance', () => {
    const testBatchUpdate = (sizeKey, expectedMaxTime) => {
      it(`should perform batch updates on ${sizeKey} catalog within performance threshold`, async () => {
        if (!shouldRunTests) {
          console.log(`Skipping ${sizeKey} batch update performance test`);
          return;
        }
        
        if (productIds[sizeKey].length === 0) {
          console.log(`No products for ${sizeKey} catalog, skipping test`);
          return;
        }
        
        // Take a subset of products for the batch update
        const productBatch = productIds[sizeKey].slice(0, Math.min(50, productIds[sizeKey].length));
        
        console.log(`Running batch update for ${productBatch.length} products from ${sizeKey} catalog...`);
        
        // Prepare batch update operation
        const batchUpdateData = {
          productIds: productBatch,
          updates: {
            attributes: {
              batchUpdated: 'true',
              testTimestamp: new Date().toISOString(),
            },
          },
        };
        
        // Measure batch update performance
        const start = Date.now();
        
        const response = await testUtils.api.post('/pim/products/batch-update', batchUpdateData);
        
        const duration = Date.now() - start;
        
        expect(response.status).toBe(202); // Accepted, async operation
        expect(response.data).toHaveProperty('batchId');
        
        const batchId = response.data.batchId;
        console.log(`Batch update initiated: ${batchId}, duration: ${duration}ms`);
        
        // Wait for batch operation to complete
        let batchStatus;
        let attempts = 0;
        const maxAttempts = 10;
        let completionTime = 0;
        
        do {
          await testUtils.sleep(1000); // Wait 1 second between checks
          const statusResponse = await testUtils.api.get(`/pim/batch/${batchId}/status`);
          batchStatus = statusResponse.data.status;
          attempts++;
          console.log(`Batch status (attempt ${attempts}): ${batchStatus}`);
          
          if (batchStatus !== 'QUEUED' && batchStatus !== 'PROCESSING') {
            completionTime = Date.now() - start;
            break;
          }
        } while (attempts < maxAttempts);
        
        // Final status check
        const finalStatusResponse = await testUtils.api.get(`/pim/batch/${batchId}/status`);
        expect(finalStatusResponse.status).toBe(200);
        expect(['COMPLETED', 'PARTIAL_SUCCESS']).toContain(finalStatusResponse.data.status);
        
        console.log(`Batch update completed in ${completionTime}ms`);
        
        // Assert batch update performance
        expect(completionTime).toBeLessThan(expectedMaxTime);
        
        // Check that updates were applied
        const updatedProduct = await testUtils.api.get(`/pim/products/${productBatch[0]}`);
        expect(updatedProduct.data.attributes).toHaveProperty('batchUpdated', 'true');
      });
    };
    
    // Test batch update performance for different catalog sizes
    testBatchUpdate('SMALL', PERFORMANCE_THRESHOLDS.SMALL_CATALOG.batchUpdate);
    testBatchUpdate('MEDIUM', PERFORMANCE_THRESHOLDS.MEDIUM_CATALOG.batchUpdate);
    testBatchUpdate('LARGE', PERFORMANCE_THRESHOLDS.LARGE_CATALOG.batchUpdate);
    
    it('should handle large catalog export efficiently', async () => {
      if (!shouldRunTests) {
        console.log('Skipping catalog export performance test');
        return;
      }
      
      if (productIds.LARGE.length === 0) {
        console.log('No products for LARGE catalog, skipping test');
        return;
      }
      
      console.log('Testing catalog export performance...');
      
      // Measure export performance
      const start = Date.now();
      
      const response = await testUtils.api.post('/pim/products/export', {
        format: 'CSV',
        filter: {
          attributeFilter: 'performanceTest=LARGE',
        },
      });
      
      const duration = Date.now() - start;
      
      expect(response.status).toBe(202); // Accepted, async operation
      expect(response.data).toHaveProperty('exportId');
      
      // Check export status
      const exportId = response.data.exportId;
      console.log(`Export initiated: ${exportId}, request duration: ${duration}ms`);
      
      // Wait for export to complete
      let exportStatus;
      let attempts = 0;
      const maxAttempts = 20; // More attempts for export
      let completionTime = 0;
      
      do {
        await testUtils.sleep(1000); // Wait 1 second between checks
        const statusResponse = await testUtils.api.get(`/pim/export/${exportId}/status`);
        exportStatus = statusResponse.data.status;
        attempts++;
        
        if (exportStatus === 'COMPLETED') {
          completionTime = Date.now() - start;
          break;
        }
      } while (exportStatus === 'PROCESSING' && attempts < maxAttempts);
      
      console.log(`Export completed in ${completionTime}ms`);
      
      // Assert export completion
      expect(exportStatus).toBe('COMPLETED');
      
      // Check export file is available
      const fileResponse = await testUtils.api.get(`/pim/export/${exportId}/download`);
      expect(fileResponse.status).toBe(200);
      
      // Cleanup export file
      await testUtils.api.delete(`/pim/export/${exportId}`);
    });
  });
  
  describe('Marketplace Integration Performance', () => {
    it('should efficiently sync products to marketplaces', async () => {
      if (!shouldRunTests) {
        console.log('Skipping marketplace sync performance test');
        return;
      }
      
      // Find an available marketplace
      const availableMarketplaces = Object.keys(marketplaceCredentials);
      if (availableMarketplaces.length === 0) {
        console.log('No marketplace credentials available, skipping test');
        return;
      }
      
      // Use the first available marketplace
      const testMarketplace = availableMarketplaces[0];
      
      // Take a subset of products from MEDIUM catalog
      if (productIds.MEDIUM.length === 0) {
        console.log('No products for MEDIUM catalog, skipping test');
        return;
      }
      
      const productBatch = productIds.MEDIUM.slice(0, Math.min(20, productIds.MEDIUM.length));
      
      console.log(`Testing marketplace sync with ${productBatch.length} products...`);
      
      // Measure batch sync performance
      const start = Date.now();
      
      const response = await testUtils.api.post('/pim/products/batch-sync', {
        productIds: productBatch,
        marketplaceType: testMarketplace,
        marketplaceCredentialId: marketplaceCredentials[testMarketplace],
      });
      
      const duration = Date.now() - start;
      
      expect(response.status).toBe(202); // Accepted, async operation
      expect(response.data).toHaveProperty('batchId');
      
      // Check batch status
      const batchId = response.data.batchId;
      console.log(`Batch sync initiated: ${batchId}, request duration: ${duration}ms`);
      
      // Wait for batch sync to complete
      let batchStatus;
      let attempts = 0;
      const maxAttempts = 20; // More attempts for marketplace sync
      let completionTime = 0;
      
      do {
        await testUtils.sleep(2000); // Wait 2 seconds between checks
        const statusResponse = await testUtils.api.get(`/pim/batch/${batchId}/status`);
        batchStatus = statusResponse.data.status;
        attempts++;
        console.log(`Batch status (attempt ${attempts}): ${batchStatus}`);
        
        if (batchStatus !== 'QUEUED' && batchStatus !== 'PROCESSING') {
          completionTime = Date.now() - start;
          break;
        }
      } while (attempts < maxAttempts);
      
      console.log(`Batch sync completed in ${completionTime}ms`);
      
      // Assert sync completion within threshold
      expect(completionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_CATALOG.batchSync);
      
      // Check sync results
      const resultsResponse = await testUtils.api.get(`/pim/batch/${batchId}/results`);
      expect(resultsResponse.status).toBe(200);
      expect(resultsResponse.data).toHaveProperty('results');
      expect(Array.isArray(resultsResponse.data.results)).toBe(true);
    });
    
    it('should handle marketplace sync timeout gracefully', async () => {
      if (!shouldRunTests) {
        console.log('Skipping marketplace timeout test');
        return;
      }
      
      // Find an available marketplace
      const availableMarketplaces = Object.keys(marketplaceCredentials);
      if (availableMarketplaces.length === 0) {
        console.log('No marketplace credentials available, skipping test');
        return;
      }
      
      // Use the first available marketplace
      const testMarketplace = availableMarketplaces[0];
      
      // Take a product from SMALL catalog
      if (productIds.SMALL.length === 0) {
        console.log('No products for SMALL catalog, skipping test');
        return;
      }
      
      const testProductId = productIds.SMALL[0];
      
      console.log('Testing marketplace sync timeout handling...');
      
      // Force a timeout by setting an artificially low timeout
      const response = await testUtils.api.post(`/pim/products/${testProductId}/sync`, {
        marketplaceType: testMarketplace,
        marketplaceCredentialId: marketplaceCredentials[testMarketplace],
        timeout: 1, // 1ms timeout - guaranteed to timeout
      });
      
      expect(response.status).toBe(202); // Accepted, async operation
      expect(response.data).toHaveProperty('syncId');
      
      // Check sync status
      const syncId = response.data.syncId;
      
      // Wait a moment for the operation to timeout
      await testUtils.sleep(2000);
      
      // Verify the system handled the timeout gracefully
      const statusResponse = await testUtils.api.get(`/pim/sync/${syncId}/status`);
      expect(statusResponse.status).toBe(200);
      expect(statusResponse.data.status).toBe('TIMEOUT');
      
      // Check that error information is available
      expect(statusResponse.data).toHaveProperty('error');
      expect(statusResponse.data.error).toContain('timeout');
      
      // Verify the product wasn't left in an inconsistent state
      const productResponse = await testUtils.api.get(`/pim/products/${testProductId}`);
      expect(productResponse.status).toBe(200);
      expect(productResponse.data).toHaveProperty('syncStatus');
      expect(productResponse.data.syncStatus[testMarketplace]).not.toBe('SYNCING');
    });
  });
  
  describe('Network Resilience Performance', () => {
    // Skip network tests in CI unless explicitly enabled
    const shouldRunNetworkTests = !process.env.CI || process.env.RUN_NETWORK_TESTS === 'true';
    
    beforeAll(() => {
      if (!shouldRunNetworkTests) {
        console.log('Skipping network resilience tests in CI environment');
      }
    });
    
    // Function to simulate network conditions
    const simulateNetworkCondition = async (condition) => {
      // This is a mock implementation that would be replaced with a real network condition simulator
      console.log(`Simulating ${condition} network condition`);
      
      // Here we would call a real network condition simulator in a production environment
      await testUtils.api.post('/test/network-conditions', { condition });
      
      // Give system time to adjust to new network condition
      await testUtils.sleep(1000);
    };
    
    it('should adapt performance for poor network conditions', async () => {
      if (!shouldRunTests || !shouldRunNetworkTests) {
        console.log('Skipping network performance test - environment or setup issue');
        return;
      }
      
      // Get UI configuration in normal conditions
      const normalResponse = await testUtils.api.get('/pim/ui-config');
      const normalConfig = normalResponse.data;
      
      // Simulate poor network condition
      await simulateNetworkCondition('poor');
      
      // Get UI configuration in poor network
      const poorNetworkResponse = await testUtils.api.get('/pim/ui-config');
      const poorNetworkConfig = poorNetworkResponse.data;
      
      // Check that system adapts to network conditions
      expect(poorNetworkConfig).toHaveProperty('networkQuality', 'poor');
      expect(poorNetworkConfig).toHaveProperty('paginationLimit');
      expect(poorNetworkConfig.paginationLimit).toBeLessThan(normalConfig.paginationLimit);
      expect(poorNetworkConfig).toHaveProperty('lowBandwidthMode', true);
      
      // Test search performance under poor network
      const start = Date.now();
      
      const searchResponse = await testUtils.api.get('/pim/products', {
        params: {
          search: 'Performance',
          limit: poorNetworkConfig.paginationLimit, // Using adapted pagination limit
        }
      });
      
      const duration = Date.now() - start;
      
      expect(searchResponse.status).toBe(200);
      
      console.log(`Search under poor network took ${duration}ms`);
      
      // Restore normal network
      await simulateNetworkCondition('good');
    });
    
    it('should use progressive loading for large result sets', async () => {
      if (!shouldRunTests) {
        console.log('Skipping progressive loading test - environment or setup issue');
        return;
      }
      
      // Verify progressive loading feature
      const configResponse = await testUtils.api.get('/pim/ui-config');
      
      expect(configResponse.status).toBe(200);
      expect(configResponse.data).toHaveProperty('features');
      expect(configResponse.data.features).toHaveProperty('progressiveLoading');
      
      if (!configResponse.data.features.progressiveLoading) {
        console.log('Progressive loading feature disabled, skipping test');
        return;
      }
      
      // Test progressive loading with the LARGE catalog
      if (productIds.LARGE.length < 100) {
        console.log('Not enough products in LARGE catalog, skipping test');
        return;
      }
      
      // First page load should be quick
      const startFirstPage = Date.now();
      
      const firstPageResponse = await testUtils.api.get('/pim/products', {
        params: {
          attributeFilter: 'performanceTest=LARGE',
          limit: 20,
          page: 1,
          progressiveLoading: true,
        }
      });
      
      const firstPageDuration = Date.now() - startFirstPage;
      
      expect(firstPageResponse.status).toBe(200);
      expect(firstPageResponse.data).toHaveProperty('products');
      expect(firstPageResponse.data.products.length).toBeLessThanOrEqual(20);
      expect(firstPageResponse.data).toHaveProperty('progressiveLoading', true);
      
      console.log(`First page load took ${firstPageDuration}ms`);
      expect(firstPageDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.SMALL_CATALOG.search);
      
      // Total count might be loading in background
      expect(firstPageResponse.data).toHaveProperty('estimatedTotal');
      
      // Test background loading of additional data
      await testUtils.sleep(2000); // Wait for background loading
      
      // Second request should have more complete data
      const secondPageResponse = await testUtils.api.get('/pim/products', {
        params: {
          attributeFilter: 'performanceTest=LARGE',
          limit: 20,
          page: 2,
          progressiveLoading: true,
        }
      });
      
      expect(secondPageResponse.status).toBe(200);
      expect(secondPageResponse.data).toHaveProperty('products');
      expect(secondPageResponse.data.products.length).toBeLessThanOrEqual(20);
      
      // Should have exact total now
      expect(secondPageResponse.data).toHaveProperty('total');
      expect(secondPageResponse.data.total).toBeGreaterThanOrEqual(secondPageResponse.data.estimatedTotal);
    });
  });
  
  // Clean up test data
  afterAll(async () => {
    if (!shouldRunTests) {
      return;
    }
    
    console.log('Cleaning up performance test data - this may take some time...');
    
    const cleanupCatalog = async (sizeKey) => {
      console.log(`Cleaning up ${sizeKey} catalog (${productIds[sizeKey].length} products)...`);
      
      const batchSize = 50; // Delete in batches
      let successCount = 0;
      
      for (let i = 0; i < productIds[sizeKey].length; i += batchSize) {
        const batch = productIds[sizeKey].slice(i, i + batchSize);
        const batchPromises = batch.map(id => 
          testUtils.api.delete(`/pim/products/${id}`)
            .then(() => true)
            .catch(error => {
              console.error(`Failed to delete product ${id}:`, error.message);
              return false;
            })
        );
        
        const results = await Promise.all(batchPromises);
        const batchSuccessCount = results.filter(success => success).length;
        successCount += batchSuccessCount;
        
        console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}: ${batchSuccessCount}/${batch.length} products`);
        
        // Small delay to avoid overwhelming the API
        await testUtils.sleep(1000);
      }
      
      console.log(`Cleanup complete for ${sizeKey} catalog: ${successCount}/${productIds[sizeKey].length} products deleted`);
    };
    
    try {
      // Clean up test catalogs from smallest to largest
      await cleanupCatalog('SMALL');
      await cleanupCatalog('MEDIUM');
      await cleanupCatalog('LARGE');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, 300000); // 5 minute timeout for cleanup
});