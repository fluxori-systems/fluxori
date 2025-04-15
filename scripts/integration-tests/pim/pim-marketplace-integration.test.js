/**
 * Integration Test: PIM - Marketplace Connector Integration
 * 
 * This test suite verifies the integration between the Product Information Management (PIM)
 * module and various marketplace connectors, with special focus on South African marketplace
 * requirements and network resilience.
 */

const config = require('../config');
const path = require('path');
const fs = require('fs-extra');

// Define marketplaces to test
const MARKETPLACES = {
  TAKEALOT: 'takealot', 
  WOOCOMMERCE: 'woocommerce',
  SHOPIFY: 'shopify',
  // Add other marketplaces as needed
};

// Test categories
const NETWORK_CONDITIONS = ['good', 'medium', 'poor', 'critical', 'offline'];

// Test product data
const generateTestProduct = (marketplaceSpecific = {}) => ({
  name: `Test Product ${testUtils.randomId()}`,
  sku: `TP-${testUtils.randomId()}`,
  barcode: `9781234567${Math.floor(Math.random() * 1000)}`,
  description: 'This is a test product for integration testing the PIM module with marketplace connectors. It includes South African specific attributes such as VAT compliance information.',
  shortDescription: 'Test product for PIM-Marketplace integration',
  pricing: {
    basePrice: 299.99,
    currency: 'ZAR',
    costPrice: 150.00,
    vatIncluded: true, // South African VAT included (15%)
    discountPercentage: 0,
  },
  inventory: {
    sku: `TP-${testUtils.randomId()}`,
    barcode: `9781234567${Math.floor(Math.random() * 1000)}`,
    stockLevel: 100,
    lowStockThreshold: 10,
  },
  shippingInfo: {
    weight: 1.5,
    weightUnit: 'kg',
    dimensions: {
      length: 20,
      width: 15,
      height: 10,
      unit: 'cm',
    },
  },
  attributes: {
    color: 'Blue',
    size: 'Medium',
    material: 'Cotton',
    manufacturer: 'Test Manufacturer',
    countryOfOrigin: 'ZA',
  },
  categories: ['Test Category', 'Electronics'],
  media: [],
  variants: [],
  isActive: true,
  ...marketplaceSpecific,
});

// Market-specific test data
const MARKETPLACE_SPECIFIC_DATA = {
  [MARKETPLACES.TAKEALOT]: {
    attributes: {
      takealotCategory: '8399', // Takealot-specific category ID
      takealotProductType: 'ELECTRONICS',
      takealotSupplierId: 'TESTSUPP001',
      takealotOfferSystem: 'LEAD_TIME_ORDERING', // Takealot-specific offer system
    },
    customFields: {
      leadTime: '3-5 business days',
      hazardous: false,
      repurchasable: true,
    },
  },
  [MARKETPLACES.WOOCOMMERCE]: {
    attributes: {
      wooCategory: 'electronics',
      wooTags: ['test', 'integration'],
    },
    customFields: {
      backorders: 'no',
      reviews_allowed: true,
      featured: false,
    },
  },
  [MARKETPLACES.SHOPIFY]: {
    attributes: {
      shopifyProductType: 'Electronics',
      shopifyTags: 'test,integration',
    },
    customFields: {
      requiresShipping: true,
      taxable: true,
      giftCard: false,
    },
  },
};

describe('PIM - Marketplace Integration', () => {
  // Test data
  let testProductId;
  let testProductIds = {};
  let marketplaceCredentials = {};
  
  // Authenticate before running tests
  beforeAll(async () => {
    await testUtils.authenticate();
    
    // Create marketplace-specific test products
    try {
      // Fetch marketplace credentials first
      const credentialsResponse = await testUtils.api.get('/connectors/credentials');
      expect(credentialsResponse.status).toBe(200);
      
      // Store available marketplace credentials for later use
      credentialsResponse.data.forEach(cred => {
        if (Object.values(MARKETPLACES).includes(cred.connectorType)) {
          marketplaceCredentials[cred.connectorType] = cred.id;
        }
      });
      
      console.log('Available marketplace credentials:', Object.keys(marketplaceCredentials));
      
      // Create a general test product
      const productResponse = await testUtils.api.post('/pim/products', generateTestProduct());
      testProductId = productResponse.data.id;
      console.log(`Created general test product: ${testProductId}`);
      
      // Create marketplace-specific test products
      for (const marketplace of Object.values(MARKETPLACES)) {
        if (!marketplaceCredentials[marketplace]) {
          console.log(`Skipping ${marketplace} tests - no credentials available`);
          continue;
        }
        
        const marketplaceProduct = generateTestProduct(MARKETPLACE_SPECIFIC_DATA[marketplace]);
        const response = await testUtils.api.post('/pim/products', marketplaceProduct);
        testProductIds[marketplace] = response.data.id;
        console.log(`Created ${marketplace} test product: ${testProductIds[marketplace]}`);
      }
    } catch (error) {
      console.error('Failed to prepare test data:', error);
      throw error;
    }
  });
  
  describe('Product Sync Operations', () => {
    const testMarketplaceSync = (marketplace) => {
      describe(`${marketplace} Integration`, () => {
        // Skip if no credentials for this marketplace
        beforeAll(() => {
          if (!marketplaceCredentials[marketplace]) {
            console.log(`Skipping ${marketplace} tests - no credentials available`);
          }
        });
        
        it(`should validate product for ${marketplace} marketplace`, async () => {
          if (!marketplaceCredentials[marketplace]) {
            return;
          }
          
          const response = await testUtils.api.post(`/pim/products/${testProductIds[marketplace]}/validate`, {
            marketplaceType: marketplace,
            marketplaceCredentialId: marketplaceCredentials[marketplace],
          });
          
          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('valid');
          expect(response.data).toHaveProperty('issues');
          
          // If not valid, log the issues for debugging
          if (!response.data.valid) {
            console.log(`Validation issues for ${marketplace}:`, response.data.issues);
          }
        });
        
        it(`should sync product to ${marketplace} marketplace`, async () => {
          if (!marketplaceCredentials[marketplace]) {
            return;
          }
          
          const response = await testUtils.api.post(`/pim/products/${testProductIds[marketplace]}/sync`, {
            marketplaceType: marketplace,
            marketplaceCredentialId: marketplaceCredentials[marketplace],
          });
          
          expect(response.status).toBe(202); // Accepted, async operation
          expect(response.data).toHaveProperty('syncId');
          
          // Store sync ID for future tests
          const syncId = response.data.syncId;
          console.log(`Started sync to ${marketplace}: ${syncId}`);
          
          // Wait for sync to complete
          let syncStatus;
          let attempts = 0;
          const maxAttempts = 10;
          
          do {
            await testUtils.sleep(2000); // Wait 2 seconds between checks
            const statusResponse = await testUtils.api.get(`/pim/sync/${syncId}/status`);
            syncStatus = statusResponse.data.status;
            attempts++;
            console.log(`Sync status (attempt ${attempts}): ${syncStatus}`);
          } while (syncStatus === 'PROCESSING' && attempts < maxAttempts);
          
          // Final status check
          const finalStatusResponse = await testUtils.api.get(`/pim/sync/${syncId}/status`);
          expect(finalStatusResponse.status).toBe(200);
          expect(['COMPLETED', 'PARTIAL_SUCCESS'].includes(finalStatusResponse.data.status)).toBe(true);
          
          // Check for marketplace ID in the product
          const productResponse = await testUtils.api.get(`/pim/products/${testProductIds[marketplace]}`);
          expect(productResponse.data.marketplaceIds).toHaveProperty(marketplace);
        });
        
        it(`should fetch product status from ${marketplace}`, async () => {
          if (!marketplaceCredentials[marketplace]) {
            return;
          }
          
          const response = await testUtils.api.get(`/pim/products/${testProductIds[marketplace]}/marketplace-status`, {
            params: {
              marketplaceType: marketplace,
              marketplaceCredentialId: marketplaceCredentials[marketplace],
            },
          });
          
          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('status');
          expect(['ACTIVE', 'PENDING', 'DRAFT'].includes(response.data.status)).toBe(true);
        });
        
        it(`should update product on ${marketplace}`, async () => {
          if (!marketplaceCredentials[marketplace]) {
            return;
          }
          
          // First update the local product
          const updateResponse = await testUtils.api.patch(`/pim/products/${testProductIds[marketplace]}`, {
            name: `Updated Test Product ${testUtils.randomId()}`,
            pricing: {
              basePrice: 349.99, // Price update
            },
          });
          
          expect(updateResponse.status).toBe(200);
          
          // Now sync the updated product
          const syncResponse = await testUtils.api.post(`/pim/products/${testProductIds[marketplace]}/sync`, {
            marketplaceType: marketplace,
            marketplaceCredentialId: marketplaceCredentials[marketplace],
          });
          
          expect(syncResponse.status).toBe(202);
          
          // Wait for sync to complete
          let syncStatus;
          let attempts = 0;
          const maxAttempts = 10;
          const syncId = syncResponse.data.syncId;
          
          do {
            await testUtils.sleep(2000); // Wait 2 seconds between checks
            const statusResponse = await testUtils.api.get(`/pim/sync/${syncId}/status`);
            syncStatus = statusResponse.data.status;
            attempts++;
          } while (syncStatus === 'PROCESSING' && attempts < maxAttempts);
          
          // Final status check
          const finalStatusResponse = await testUtils.api.get(`/pim/sync/${syncId}/status`);
          expect(['COMPLETED', 'PARTIAL_SUCCESS'].includes(finalStatusResponse.data.status)).toBe(true);
          
          // Verify the update was successful
          const statusResponse = await testUtils.api.get(`/pim/products/${testProductIds[marketplace]}/marketplace-status`, {
            params: {
              marketplaceType: marketplace,
              marketplaceCredentialId: marketplaceCredentials[marketplace],
            },
          });
          
          expect(statusResponse.status).toBe(200);
          expect(statusResponse.data).toHaveProperty('lastSyncResult', 'SUCCESS');
        });
      });
    };
    
    // Run tests for each marketplace
    Object.values(MARKETPLACES).forEach(marketplace => {
      testMarketplaceSync(marketplace);
    });
  });
  
  describe('Batch Product Operations', () => {
    it('should sync multiple products to marketplaces', async () => {
      // Get available marketplaces with credentials
      const availableMarketplaces = Object.keys(marketplaceCredentials);
      
      if (availableMarketplaces.length === 0) {
        console.log('Skipping batch sync test - no marketplace credentials available');
        return;
      }
      
      // Use the first available marketplace for batch test
      const testMarketplace = availableMarketplaces[0];
      
      // Create multiple test products
      const batchProductIds = [];
      
      for (let i = 0; i < 3; i++) {
        const productResponse = await testUtils.api.post('/pim/products', 
          generateTestProduct(MARKETPLACE_SPECIFIC_DATA[testMarketplace]));
        batchProductIds.push(productResponse.data.id);
      }
      
      console.log(`Created ${batchProductIds.length} batch test products`);
      
      // Batch sync request
      const batchSyncResponse = await testUtils.api.post('/pim/products/batch-sync', {
        productIds: batchProductIds,
        marketplaceType: testMarketplace,
        marketplaceCredentialId: marketplaceCredentials[testMarketplace],
      });
      
      expect(batchSyncResponse.status).toBe(202);
      expect(batchSyncResponse.data).toHaveProperty('batchId');
      expect(batchSyncResponse.data).toHaveProperty('totalProducts', batchProductIds.length);
      
      // Store batch ID for status check
      const batchId = batchSyncResponse.data.batchId;
      
      // Wait for batch sync to complete
      let batchStatus;
      let attempts = 0;
      const maxAttempts = 15; // More time for batch operations
      
      do {
        await testUtils.sleep(3000); // Wait 3 seconds between checks
        const statusResponse = await testUtils.api.get(`/pim/batch/${batchId}/status`);
        batchStatus = statusResponse.data.status;
        attempts++;
        console.log(`Batch status (attempt ${attempts}): ${batchStatus}`);
      } while (['QUEUED', 'PROCESSING'].includes(batchStatus) && attempts < maxAttempts);
      
      // Final status check
      const finalStatusResponse = await testUtils.api.get(`/pim/batch/${batchId}/status`);
      expect(finalStatusResponse.status).toBe(200);
      expect(['COMPLETED', 'PARTIAL_SUCCESS'].includes(finalStatusResponse.data.status)).toBe(true);
      
      // Check batch results
      const resultsResponse = await testUtils.api.get(`/pim/batch/${batchId}/results`);
      expect(resultsResponse.status).toBe(200);
      expect(resultsResponse.data).toHaveProperty('results');
      expect(Array.isArray(resultsResponse.data.results)).toBe(true);
      expect(resultsResponse.data.results.length).toBe(batchProductIds.length);
      
      // Clean up batch test products
      for (const productId of batchProductIds) {
        await testUtils.api.delete(`/pim/products/${productId}`);
      }
      
      console.log('Cleaned up batch test products');
    });
  });
  
  describe('South African Market Requirements', () => {
    it('should handle VAT calculation correctly (15%)', async () => {
      // Create product with specific price
      const productWithVAT = await testUtils.api.post('/pim/products', generateTestProduct({
        pricing: {
          basePrice: 115,  // 100 + 15% VAT
          currency: 'ZAR',
          vatIncluded: true,
        },
      }));
      
      const productId = productWithVAT.data.id;
      
      // Get VAT calculation
      const vatResponse = await testUtils.api.get(`/pim/products/${productId}/vat-calculation`);
      
      expect(vatResponse.status).toBe(200);
      expect(vatResponse.data).toHaveProperty('vatAmount');
      expect(vatResponse.data).toHaveProperty('priceExcludingVat');
      
      // 115 price including VAT should give ~15 VAT and ~100 excl VAT
      expect(vatResponse.data.vatAmount).toBeCloseTo(15, 1);
      expect(vatResponse.data.priceExcludingVat).toBeCloseTo(100, 1);
      
      // Clean up
      await testUtils.api.delete(`/pim/products/${productId}`);
    });
    
    it('should generate Takealot-specific attributes', async () => {
      if (!marketplaceCredentials[MARKETPLACES.TAKEALOT]) {
        console.log('Skipping Takealot attributes test - no credentials available');
        return;
      }
      
      const takealotProductId = testProductIds[MARKETPLACES.TAKEALOT];
      
      // Get Takealot-specific attributes
      const attributesResponse = await testUtils.api.get(`/pim/products/${takealotProductId}/marketplace-attributes`, {
        params: {
          marketplaceType: MARKETPLACES.TAKEALOT,
        },
      });
      
      expect(attributesResponse.status).toBe(200);
      expect(attributesResponse.data).toHaveProperty('attributes');
      
      // Should include Takealot-specific attributes
      const attrs = attributesResponse.data.attributes;
      expect(attrs).toHaveProperty('OFFER_SYSTEM');
      expect(attrs).toHaveProperty('SUPPLIER_ID');
      expect(attrs).toHaveProperty('PRODUCT_TYPE');
    });
  });
  
  describe('Network Resilience', () => {
    // Skip this test in CI environment unless explicitly enabled
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
    
    // Test with different network conditions
    NETWORK_CONDITIONS.forEach(condition => {
      it(`should sync product with ${condition} network condition`, async () => {
        if (!shouldRunNetworkTests) {
          return;
        }
        
        // Find an available marketplace
        const availableMarketplaces = Object.keys(marketplaceCredentials);
        if (availableMarketplaces.length === 0) {
          console.log('Skipping network test - no marketplace credentials available');
          return;
        }
        
        // Use first available marketplace
        const testMarketplace = availableMarketplaces[0];
        const productId = testProductIds[testMarketplace];
        
        // Simulate network condition
        await simulateNetworkCondition(condition);
        
        if (condition === 'offline') {
          // In offline mode, we expect the request to be queued
          const response = await testUtils.api.post(`/pim/products/${productId}/sync`, {
            marketplaceType: testMarketplace,
            marketplaceCredentialId: marketplaceCredentials[testMarketplace],
          });
          
          expect(response.status).toBe(202);
          expect(response.data).toHaveProperty('queued', true);
          
          // Restore network
          await simulateNetworkCondition('good');
          
          // Wait for queue processing
          await testUtils.sleep(5000);
          
          // Check if queued operation completed
          const syncStatus = await testUtils.api.get(`/pim/products/${productId}/sync-status`);
          expect(syncStatus.data.pendingOperations).toBe(0);
        } else {
          // In other network conditions, sync should still work but might take longer
          const response = await testUtils.api.post(`/pim/products/${productId}/sync`, {
            marketplaceType: testMarketplace,
            marketplaceCredentialId: marketplaceCredentials[testMarketplace],
          });
          
          expect(response.status).toBe(202);
          
          // Allow more time for poor connections
          const waitTime = condition === 'poor' || condition === 'critical' ? 10000 : 5000;
          await testUtils.sleep(waitTime);
          
          // Check sync completed
          const syncId = response.data.syncId;
          const statusResponse = await testUtils.api.get(`/pim/sync/${syncId}/status`);
          
          // For very poor connections, we might not get a successful sync
          if (condition === 'critical') {
            expect(['COMPLETED', 'PARTIAL_SUCCESS', 'FAILED', 'TIMEOUT']).toContain(statusResponse.data.status);
          } else {
            expect(['COMPLETED', 'PARTIAL_SUCCESS']).toContain(statusResponse.data.status);
          }
          
          // Restore network to good condition
          await simulateNetworkCondition('good');
        }
      });
    });
  });
  
  // Media handling tests
  describe('Product Media Management', () => {
    let testImagePath;
    
    beforeAll(async () => {
      // Prepare test image
      testImagePath = path.join(config.storage.testFilesDir, 'test-product-image.jpg');
      
      // Ensure the test image exists
      if (!fs.existsSync(testImagePath)) {
        console.log('Creating test image...');
        // Create a simple test image if it doesn't exist
        await testUtils.api.get('/test/generate-test-image');
      }
    });
    
    it('should upload and attach media to a product', async () => {
      // Skip if test image doesn't exist
      if (!fs.existsSync(testImagePath)) {
        console.log('Skipping media test - test image not available');
        return;
      }
      
      // First, get a signed URL for upload
      const urlResponse = await testUtils.api.post('/storage/signed-url', {
        fileName: 'test-product-image.jpg',
        contentType: 'image/jpeg',
        path: `products/${testProductId}/images/`,
      });
      
      expect(urlResponse.status).toBe(200);
      expect(urlResponse.data).toHaveProperty('signedUrl');
      expect(urlResponse.data).toHaveProperty('fileUrl');
      
      // Upload the image (normally would use the signed URL directly)
      const fileUrl = urlResponse.data.fileUrl;
      
      // Now attach the media to the product
      const attachResponse = await testUtils.api.post(`/pim/products/${testProductId}/media`, {
        url: fileUrl,
        type: 'IMAGE',
        title: 'Test Product Image',
        altText: 'A test product image for integration testing',
        isPrimary: true,
      });
      
      expect(attachResponse.status).toBe(201);
      expect(attachResponse.data).toHaveProperty('id');
      
      // Verify media was attached
      const productResponse = await testUtils.api.get(`/pim/products/${testProductId}`);
      expect(productResponse.data).toHaveProperty('media');
      expect(Array.isArray(productResponse.data.media)).toBe(true);
      expect(productResponse.data.media.length).toBeGreaterThan(0);
      
      const media = productResponse.data.media[0];
      expect(media).toHaveProperty('url', fileUrl);
      expect(media).toHaveProperty('isPrimary', true);
    });
    
    it('should sync product with media to marketplaces', async () => {
      // Find an available marketplace
      const availableMarketplaces = Object.keys(marketplaceCredentials);
      if (availableMarketplaces.length === 0) {
        console.log('Skipping media sync test - no marketplace credentials available');
        return;
      }
      
      // Use first available marketplace
      const testMarketplace = availableMarketplaces[0];
      
      // Sync the product with attached media
      const syncResponse = await testUtils.api.post(`/pim/products/${testProductId}/sync`, {
        marketplaceType: testMarketplace,
        marketplaceCredentialId: marketplaceCredentials[testMarketplace],
      });
      
      expect(syncResponse.status).toBe(202);
      
      // Wait for sync to complete
      await testUtils.sleep(5000);
      
      // Check sync status
      const syncId = syncResponse.data.syncId;
      const statusResponse = await testUtils.api.get(`/pim/sync/${syncId}/status`);
      
      expect(['COMPLETED', 'PARTIAL_SUCCESS']).toContain(statusResponse.data.status);
      
      // Verify media was synced (this API may vary)
      const mediaStatusResponse = await testUtils.api.get(`/pim/products/${testProductId}/marketplace-media-status`, {
        params: {
          marketplaceType: testMarketplace,
          marketplaceCredentialId: marketplaceCredentials[testMarketplace],
        },
      });
      
      expect(mediaStatusResponse.status).toBe(200);
      expect(mediaStatusResponse.data).toHaveProperty('mediaSynced', true);
    });
  });
  
  // Clean up test data
  afterAll(async () => {
    console.log('Cleaning up test data...');
    
    try {
      // Delete general test product
      if (testProductId) {
        await testUtils.api.delete(`/pim/products/${testProductId}`);
        console.log(`Deleted general test product: ${testProductId}`);
      }
      
      // Delete marketplace-specific test products
      for (const [marketplace, id] of Object.entries(testProductIds)) {
        if (id) {
          await testUtils.api.delete(`/pim/products/${id}`);
          console.log(`Deleted ${marketplace} test product: ${id}`);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });
});