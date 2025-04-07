/**
 * AI Insights Module Integration Tests
 */

const config = require('../config');

describe('AI Insights Module', () => {
  // Authenticate before running tests
  beforeAll(async () => {
    await testUtils.authenticate();
  });
  
  describe('AI Model Configurations', () => {
    it('should list available AI models', async () => {
      const response = await testUtils.api.get('/ai-model-configs');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // We should have at least one model available
      expect(response.data.length).toBeGreaterThan(0);
      
      // Each model should have required properties
      response.data.forEach(model => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('provider');
        expect(model).toHaveProperty('endpoint');
        expect(model).toHaveProperty('creditsPerRequest');
      });
    });
    
    it('should retrieve a specific model by ID', async () => {
      // First get all models
      const listResponse = await testUtils.api.get('/ai-model-configs');
      const firstModel = listResponse.data[0];
      
      // Now get the specific model
      const response = await testUtils.api.get(`/ai-model-configs/${firstModel.id}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', firstModel.id);
      expect(response.data).toHaveProperty('name', firstModel.name);
    });
  });
  
  describe('Credit System', () => {
    it('should retrieve credit usage information', async () => {
      const response = await testUtils.api.get('/ai-credits/info');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('available');
      expect(response.data).toHaveProperty('usedThisMonth');
      expect(response.data).toHaveProperty('monthlyLimit');
    });
    
    it('should retrieve usage history', async () => {
      const response = await testUtils.api.get('/ai-credits/usage-history');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Each entry should have required properties
      if (response.data.length > 0) {
        const firstEntry = response.data[0];
        expect(firstEntry).toHaveProperty('id');
        expect(firstEntry).toHaveProperty('timestamp');
        expect(firstEntry).toHaveProperty('modelName');
        expect(firstEntry).toHaveProperty('creditsUsed');
      }
    });
    
    it('should retrieve usage by day', async () => {
      const response = await testUtils.api.get('/ai-credits/usage-by-day', {
        params: { days: 30 },
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Each entry should have a date and a value
      response.data.forEach(entry => {
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('credits');
      });
    });
  });
  
  describe('Insight Generation', () => {
    // This test will use credits, so we skip in production
    const testOrSkip = config.environment === 'production' 
      ? it.skip : it;
    
    testOrSkip('should generate an insight', async () => {
      // Create a test insight request
      const insightRequest = {
        type: 'inventory_analysis',
        input: {
          productIds: ['test-product-1', 'test-product-2'],
          timeRange: 'last_30_days',
        },
        aiModelId: '', // We'll fill this in dynamically
      };
      
      // Get an available model for testing
      const modelsResponse = await testUtils.api.get('/ai-model-configs');
      const analysisModel = modelsResponse.data.find(m => 
        m.supportedTypes.includes('inventory_analysis')
      );
      
      if (!analysisModel) {
        console.warn('No suitable AI model found for testing');
        return;
      }
      
      insightRequest.aiModelId = analysisModel.id;
      
      // Submit the insight request
      const response = await testUtils.api.post('/insights', insightRequest);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('status');
      
      // The insight might be in "PENDING" or "PROCESSING" status initially
      expect(['PENDING', 'PROCESSING', 'COMPLETED']).toContain(response.data.status);
      
      // Store the insight ID for checking later
      const insightId = response.data.id;
      
      // Wait for the insight to complete (max 30 seconds)
      let insightCompleted = false;
      let insightResult = null;
      
      for (let i = 0; i < 10; i++) {
        await testUtils.sleep(3000); // Wait 3 seconds between checks
        
        const checkResponse = await testUtils.api.get(`/insights/${insightId}`);
        
        if (checkResponse.data.status === 'COMPLETED') {
          insightCompleted = true;
          insightResult = checkResponse.data;
          break;
        }
        
        if (checkResponse.data.status === 'FAILED') {
          throw new Error(`Insight generation failed: ${checkResponse.data.error}`);
        }
      }
      
      // Verify the insight completed
      expect(insightCompleted).toBe(true);
      expect(insightResult).toHaveProperty('result');
      expect(insightResult.result).toHaveProperty('content');
      
      // Verify credits were deducted
      const creditResponse = await testUtils.api.get('/ai-credits/usage-history', {
        params: { limit: 1 },
      });
      
      if (creditResponse.data.length > 0) {
        const latestUsage = creditResponse.data[0];
        expect(latestUsage).toHaveProperty('insightId', insightId);
        expect(latestUsage).toHaveProperty('creditsUsed');
        expect(latestUsage.creditsUsed).toBeGreaterThan(0);
      }
    }, 60000); // Increase timeout to 60 seconds for this test
    
    it('should list insights', async () => {
      const response = await testUtils.api.get('/insights');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Each insight should have basic properties
      if (response.data.length > 0) {
        const insight = response.data[0];
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('status');
        expect(insight).toHaveProperty('createdAt');
      }
    });
  });
});