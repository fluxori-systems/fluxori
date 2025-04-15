/**
 * Integration Test: South African Marketplace Specific Tests
 * 
 * These tests focus specifically on requirements and functionality for South African
 * e-commerce marketplaces, including VAT handling, shipping options, load shedding resilience,
 * and Takealot-specific integration.
 */

const config = require('../config');
const path = require('path');
const fs = require('fs-extra');

// South African specific constants
const SA_VAT_RATE = 0.15; // 15% VAT
const SA_CURRENCIES = ['ZAR']; 
const SA_MARKETPLACES = {
  TAKEALOT: 'takealot',
  WOOCOMMERCE_SA: 'woocommerce', // WooCommerce for South African stores
};

// Generate a test product for South African market
const generateSATestProduct = (marketplace = null) => {
  const baseProduct = {
    name: `SA Test Product ${testUtils.randomId()}`,
    sku: `SA-TP-${testUtils.randomId()}`,
    barcode: `6001${Math.floor(Math.random() * 10000000)}`, // SA barcode format
    description: 'This is a test product for South African marketplaces integration testing with VAT compliance.',
    shortDescription: 'SA test product for PIM-Marketplace integration',
    pricing: {
      basePrice: 299.99,
      currency: 'ZAR',
      costPrice: 150.00,
      vatIncluded: true, // South African VAT included (15%)
      vatRate: SA_VAT_RATE,
      discountPercentage: 0,
    },
    inventory: {
      sku: `SA-TP-${testUtils.randomId()}`,
      barcode: `6001${Math.floor(Math.random() * 10000000)}`,
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
      shippingClass: 'standard',
      saShippingRegions: ['gauteng', 'western-cape', 'kwazulu-natal', 'all'],
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
    customFields: {
      saMarketRestrictions: false,
      ecoFriendly: true,
      locallyMade: true,
    },
  };

  // Add marketplace-specific fields
  if (marketplace === SA_MARKETPLACES.TAKEALOT) {
    return {
      ...baseProduct,
      attributes: {
        ...baseProduct.attributes,
        takealotCategory: '8399', // Takealot-specific category ID
        takealotProductType: 'ELECTRONICS',
        takealotSupplierId: 'TESTSUPP001',
        takealotOfferSystem: 'LEAD_TIME_ORDERING', // Takealot-specific offer system
      },
      customFields: {
        ...baseProduct.customFields,
        leadTime: '3-5 business days',
        hazardous: false,
        repurchasable: true,
        takealotParcelDimensions: 'SMALL',
        takealotWarranty: '12 months',
      },
    };
  } else if (marketplace === SA_MARKETPLACES.WOOCOMMERCE_SA) {
    return {
      ...baseProduct,
      attributes: {
        ...baseProduct.attributes,
        wooCategory: 'electronics',
        wooTags: ['south-african', 'test', 'integration'],
      },
      customFields: {
        ...baseProduct.customFields,
        backorders: 'no',
        reviews_allowed: true,
        featured: false,
        wooCommerceZARRounding: 'round', // SA specific feature
        saFreightOptions: JSON.stringify(['standard', 'express', 'economy']),
      },
    };
  }

  return baseProduct;
};

describe('South African Marketplace Integration', () => {
  // Test data
  let testProductId;
  let testProductIds = {};
  let marketplaceCredentials = {};
  
  // Flag to track if tests should run
  let shouldRunTests = true;
  
  // Authenticate before running tests
  beforeAll(async () => {
    try {
      await testUtils.authenticate();
      
      // Fetch marketplace credentials
      const credentialsResponse = await testUtils.api.get('/connectors/credentials');
      
      if (credentialsResponse.status !== 200) {
        console.warn('Failed to fetch marketplace credentials - tests may be skipped');
        shouldRunTests = false;
        return;
      }
      
      // Store available marketplace credentials for SA marketplaces
      credentialsResponse.data.forEach(cred => {
        if (Object.values(SA_MARKETPLACES).includes(cred.connectorType)) {
          // Verify this connector is for a South African store
          if (cred.region === 'ZA' || cred.region === 'za' || 
              (cred.config && cred.config.currency === 'ZAR')) {
            marketplaceCredentials[cred.connectorType] = cred.id;
          }
        }
      });
      
      if (Object.keys(marketplaceCredentials).length === 0) {
        console.warn('No South African marketplace credentials available - tests may be skipped');
        shouldRunTests = false;
        return;
      }
      
      console.log('Available SA marketplace credentials:', Object.keys(marketplaceCredentials));
      
      // Create a general SA test product
      const productResponse = await testUtils.api.post('/pim/products', generateSATestProduct());
      testProductId = productResponse.data.id;
      console.log(`Created general SA test product: ${testProductId}`);
      
      // Create marketplace-specific test products
      for (const marketplace of Object.values(SA_MARKETPLACES)) {
        if (!marketplaceCredentials[marketplace]) {
          console.log(`Skipping ${marketplace} tests - no credentials available`);
          continue;
        }
        
        const marketplaceProduct = generateSATestProduct(marketplace);
        const response = await testUtils.api.post('/pim/products', marketplaceProduct);
        testProductIds[marketplace] = response.data.id;
        console.log(`Created ${marketplace} test product: ${testProductIds[marketplace]}`);
      }
    } catch (error) {
      console.error('Failed to prepare test data:', error);
      shouldRunTests = false;
    }
  });
  
  describe('VAT Handling', () => {
    it('should correctly calculate and display South African VAT (15%)', async () => {
      if (!shouldRunTests) {
        console.log('Skipping VAT test - credentials or setup issue');
        return;
      }
      
      // Create a product with specific price for VAT testing
      const productResponse = await testUtils.api.post('/pim/products', generateSATestProduct());
      const productId = productResponse.data.id;
      
      // Test VAT calculation from price including VAT
      const vatCalcResponse = await testUtils.api.post(`/pim/products/${productId}/calculate-vat`, {
        price: 230,
        vatIncluded: true,
      });
      
      expect(vatCalcResponse.status).toBe(200);
      expect(vatCalcResponse.data).toHaveProperty('vatAmount');
      expect(vatCalcResponse.data).toHaveProperty('priceExcludingVat');
      expect(vatCalcResponse.data).toHaveProperty('priceIncludingVat');
      
      // VAT amount should be 15% of price excluding VAT
      // For price including VAT of R230, the calculation is:
      // Price excluding VAT = 230 / 1.15 = R200
      // VAT amount = R30
      expect(vatCalcResponse.data.vatAmount).toBeCloseTo(30, 2);
      expect(vatCalcResponse.data.priceExcludingVat).toBeCloseTo(200, 2);
      expect(vatCalcResponse.data.priceIncludingVat).toBeCloseTo(230, 2);
      
      // Test VAT calculation from price excluding VAT
      const vatCalcResponse2 = await testUtils.api.post(`/pim/products/${productId}/calculate-vat`, {
        price: 200,
        vatIncluded: false,
      });
      
      expect(vatCalcResponse2.status).toBe(200);
      expect(vatCalcResponse2.data.vatAmount).toBeCloseTo(30, 2);
      expect(vatCalcResponse2.data.priceExcludingVat).toBeCloseTo(200, 2);
      expect(vatCalcResponse2.data.priceIncludingVat).toBeCloseTo(230, 2);
      
      // Clean up test product
      await testUtils.api.delete(`/pim/products/${productId}`);
    });
  });
  
  describe('South African Shipping Features', () => {
    it('should support SA-specific shipping regions', async () => {
      if (!shouldRunTests) {
        console.log('Skipping shipping regions test - credentials or setup issue');
        return;
      }
      
      // Get the product's shipping regions
      const response = await testUtils.api.get(`/pim/products/${testProductId}/shipping-options`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('regions');
      expect(Array.isArray(response.data.regions)).toBe(true);
      
      // Should include major SA regions
      const regions = response.data.regions;
      const majorRegions = ['gauteng', 'western-cape', 'kwazulu-natal'];
      
      majorRegions.forEach(region => {
        expect(regions).toContain(region);
      });
    });
    
    it('should calculate accurate shipping costs for SA regions', async () => {
      if (!shouldRunTests) {
        console.log('Skipping shipping costs test - credentials or setup issue');
        return;
      }
      
      // Test shipping cost calculation
      const shippingResponse = await testUtils.api.post(`/pim/products/${testProductId}/calculate-shipping`, {
        destination: {
          region: 'gauteng',
          postalCode: '2000', // Johannesburg
        },
        quantity: 1,
      });
      
      expect(shippingResponse.status).toBe(200);
      expect(shippingResponse.data).toHaveProperty('shippingCost');
      expect(shippingResponse.data).toHaveProperty('currency', 'ZAR');
      expect(shippingResponse.data).toHaveProperty('estimatedDeliveryDays');
      
      // Cost should be a positive number
      expect(typeof shippingResponse.data.shippingCost).toBe('number');
      expect(shippingResponse.data.shippingCost).toBeGreaterThan(0);
    });
  });
  
  describe('Load Shedding Resilience', () => {
    // Skip this test in CI environment unless explicitly enabled
    const shouldRunLoadSheddingTests = !process.env.CI || process.env.RUN_LOAD_SHEDDING_TESTS === 'true';
    
    beforeAll(() => {
      if (!shouldRunLoadSheddingTests) {
        console.log('Skipping load shedding tests in CI environment');
      }
    });
    
    // Function to simulate load shedding conditions
    const simulateLoadShedding = async (enabled) => {
      // This is a mock implementation that would be replaced with a real load shedding simulator
      console.log(`Simulating load shedding: ${enabled ? 'ON' : 'OFF'}`);
      
      // Here we would call a real load shedding simulator in a production environment
      await testUtils.api.post('/test/load-shedding', { enabled });
      
      // Give system time to adjust to load shedding condition
      await testUtils.sleep(2000);
    };
    
    it('should queue operations during load shedding', async () => {
      if (!shouldRunTests || !shouldRunLoadSheddingTests) {
        console.log('Skipping load shedding test - environment or setup issue');
        return;
      }
      
      // Find an available marketplace
      const availableMarketplaces = Object.keys(marketplaceCredentials);
      if (availableMarketplaces.length === 0) {
        console.log('Skipping load shedding test - no marketplace credentials available');
        return;
      }
      
      // Use first available marketplace
      const testMarketplace = availableMarketplaces[0];
      const productId = testProductIds[testMarketplace] || testProductId;
      
      // Simulate load shedding start
      await simulateLoadShedding(true);
      
      // Try to sync product during load shedding
      const syncResponse = await testUtils.api.post(`/pim/products/${productId}/sync`, {
        marketplaceType: testMarketplace,
        marketplaceCredentialId: marketplaceCredentials[testMarketplace],
      });
      
      // Should be queued for later processing
      expect(syncResponse.status).toBe(202);
      expect(syncResponse.data).toHaveProperty('queued', true);
      expect(syncResponse.data).toHaveProperty('message');
      expect(syncResponse.data.message).toContain('load shedding');
      
      // Check queue status
      const queueResponse = await testUtils.api.get('/pim/queue/status');
      expect(queueResponse.status).toBe(200);
      expect(queueResponse.data).toHaveProperty('queuedOperations');
      expect(queueResponse.data.queuedOperations).toBeGreaterThan(0);
      
      // Turn off load shedding
      await simulateLoadShedding(false);
      
      // Wait for queued operations to process
      await testUtils.sleep(5000);
      
      // Check if queue processed
      const queueStatusAfter = await testUtils.api.get('/pim/queue/status');
      expect(queueStatusAfter.data.queuedOperations).toBe(0);
      
      // Verify operation completed
      const syncStatus = await testUtils.api.get(`/pim/products/${productId}/sync-status`);
      expect(syncStatus.status).toBe(200);
      expect(syncStatus.data).toHaveProperty('lastSync');
      expect(syncStatus.data).toHaveProperty('lastSyncStatus');
      expect(['COMPLETED', 'PARTIAL_SUCCESS']).toContain(syncStatus.data.lastSyncStatus);
    });
    
    it('should provide low-bandwidth UI during load shedding', async () => {
      if (!shouldRunTests || !shouldRunLoadSheddingTests) {
        console.log('Skipping low-bandwidth UI test - environment or setup issue');
        return;
      }
      
      // This would normally be a frontend test, but we can test the API that provides UI configuration
      
      // Simulate load shedding start
      await simulateLoadShedding(true);
      
      // Get UI configuration during load shedding
      const uiConfigResponse = await testUtils.api.get('/pim/ui-config');
      
      expect(uiConfigResponse.status).toBe(200);
      expect(uiConfigResponse.data).toHaveProperty('lowBandwidthMode', true);
      expect(uiConfigResponse.data).toHaveProperty('loadSheddingDetected', true);
      expect(uiConfigResponse.data).toHaveProperty('imageQuality', 'low');
      
      // Turn off load shedding
      await simulateLoadShedding(false);
      
      // Wait for system to detect load shedding is off
      await testUtils.sleep(2000);
      
      // Get UI configuration after load shedding
      const uiConfigAfterResponse = await testUtils.api.get('/pim/ui-config');
      
      expect(uiConfigAfterResponse.status).toBe(200);
      expect(uiConfigAfterResponse.data).toHaveProperty('lowBandwidthMode', false);
      expect(uiConfigAfterResponse.data).toHaveProperty('loadSheddingDetected', false);
      expect(uiConfigAfterResponse.data).toHaveProperty('imageQuality', 'high');
    });
  });
  
  describe('Takealot-Specific Features', () => {
    it('should validate Takealot-specific requirements', async () => {
      if (!shouldRunTests || !marketplaceCredentials[SA_MARKETPLACES.TAKEALOT]) {
        console.log('Skipping Takealot validation test - no credentials available');
        return;
      }
      
      const takealotProductId = testProductIds[SA_MARKETPLACES.TAKEALOT];
      
      // Validate Takealot-specific requirements
      const validationResponse = await testUtils.api.post(`/pim/products/${takealotProductId}/validate`, {
        marketplaceType: SA_MARKETPLACES.TAKEALOT,
        marketplaceCredentialId: marketplaceCredentials[SA_MARKETPLACES.TAKEALOT],
      });
      
      expect(validationResponse.status).toBe(200);
      expect(validationResponse.data).toHaveProperty('valid');
      expect(validationResponse.data).toHaveProperty('issues');
      
      // Should have Takealot-specific validation rules
      expect(validationResponse.data).toHaveProperty('validationRules');
      expect(validationResponse.data.validationRules).toContain('takealotBarcode');
      expect(validationResponse.data.validationRules).toContain('takealotOfferSystem');
    });
    
    it('should format product data correctly for Takealot', async () => {
      if (!shouldRunTests || !marketplaceCredentials[SA_MARKETPLACES.TAKEALOT]) {
        console.log('Skipping Takealot format test - no credentials available');
        return;
      }
      
      const takealotProductId = testProductIds[SA_MARKETPLACES.TAKEALOT];
      
      // Get formatted data for Takealot
      const formatResponse = await testUtils.api.get(`/pim/products/${takealotProductId}/format`, {
        params: {
          marketplaceType: SA_MARKETPLACES.TAKEALOT,
        },
      });
      
      expect(formatResponse.status).toBe(200);
      
      // Should have Takealot-specific data format
      const formattedData = formatResponse.data;
      expect(formattedData).toHaveProperty('offer_system');
      expect(formattedData).toHaveProperty('product_type');
      expect(formattedData).toHaveProperty('barcode');
      expect(formattedData).toHaveProperty('sku');
      expect(formattedData).toHaveProperty('price', expect.any(String)); // Price as string
      
      // Check VAT format for Takealot
      expect(formattedData).toHaveProperty('price_incl_vat', true);
    });
  });
  
  describe('Multi-Warehouse Support', () => {
    let testWarehouseIds = [];
    
    beforeAll(async () => {
      if (!shouldRunTests) {
        return;
      }
      
      // Create test warehouses in different South African regions
      const regions = [
        { name: 'Johannesburg Warehouse', city: 'Johannesburg', province: 'Gauteng' },
        { name: 'Cape Town Warehouse', city: 'Cape Town', province: 'Western Cape' },
        { name: 'Durban Warehouse', city: 'Durban', province: 'KwaZulu-Natal' },
      ];
      
      for (const region of regions) {
        const warehouseResponse = await testUtils.api.post('/inventory/warehouses', {
          name: `Test ${region.name} ${testUtils.randomId()}`,
          location: {
            address: `123 Test Street, ${region.city}`,
            city: region.city,
            state: region.province,
            postalCode: '0000',
            country: 'ZA',
          },
          isActive: true,
        });
        
        testWarehouseIds.push(warehouseResponse.data.id);
        console.log(`Created test warehouse: ${warehouseResponse.data.id} (${region.name})`);
      }
      
      // Add stock to each warehouse
      for (const warehouseId of testWarehouseIds) {
        await testUtils.api.post('/inventory/stock', {
          productId: testProductId,
          warehouseId: warehouseId,
          quantity: 50,
          location: 'A-1-1',
        });
        
        console.log(`Added stock to warehouse: ${warehouseId}`);
      }
    });
    
    it('should distribute stock across multiple South African warehouses', async () => {
      if (!shouldRunTests) {
        console.log('Skipping multi-warehouse test - credentials or setup issue');
        return;
      }
      
      // Get stock across all warehouses
      const stockResponse = await testUtils.api.get(`/inventory/products/${testProductId}/stock`);
      
      expect(stockResponse.status).toBe(200);
      expect(Array.isArray(stockResponse.data)).toBe(true);
      expect(stockResponse.data.length).toBe(testWarehouseIds.length);
      
      // Verify stock distribution
      const totalStock = stockResponse.data.reduce((total, stock) => total + stock.quantity, 0);
      expect(totalStock).toBe(50 * testWarehouseIds.length);
    });
    
    it('should select optimal warehouse for order fulfillment based on region', async () => {
      if (!shouldRunTests) {
        console.log('Skipping warehouse optimization test - credentials or setup issue');
        return;
      }
      
      // Test warehouse selection algorithm
      const optimizationResponse = await testUtils.api.post('/inventory/warehouse-selection', {
        productId: testProductId,
        deliveryAddress: {
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          country: 'ZA',
        },
      });
      
      expect(optimizationResponse.status).toBe(200);
      expect(optimizationResponse.data).toHaveProperty('selectedWarehouseId');
      expect(optimizationResponse.data).toHaveProperty('selectionReason');
      
      // Should select a warehouse in Gauteng for Johannesburg delivery
      const selectedWarehouse = await testUtils.api.get(`/inventory/warehouses/${optimizationResponse.data.selectedWarehouseId}`);
      expect(selectedWarehouse.data.location.state.toLowerCase()).toBe('gauteng');
    });
    
    // Clean up warehouses
    afterAll(async () => {
      if (!shouldRunTests) {
        return;
      }
      
      console.log('Cleaning up test warehouses...');
      
      for (const warehouseId of testWarehouseIds) {
        try {
          await testUtils.api.delete(`/inventory/warehouses/${warehouseId}`);
          console.log(`Deleted test warehouse: ${warehouseId}`);
        } catch (error) {
          console.error(`Error deleting warehouse ${warehouseId}:`, error.message);
        }
      }
    });
  });
  
  // Clean up test data
  afterAll(async () => {
    if (!shouldRunTests) {
      return;
    }
    
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