/**
 * Storage Module Integration Tests
 */

const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

describe('Storage Module', () => {
  // Authenticate before running tests
  beforeAll(async () => {
    await testUtils.authenticate();
  });
  
  // Create test file directory if it doesn't exist
  beforeAll(() => {
    if (!fs.existsSync(config.storage.testFilesDir)) {
      fs.mkdirSync(config.storage.testFilesDir, { recursive: true });
    }
    
    // Create a test text file if it doesn't exist
    const testTextFile = path.join(config.storage.testFilesDir, 'test.txt');
    if (!fs.existsSync(testTextFile)) {
      fs.writeFileSync(testTextFile, 'This is a test file for integration tests.');
    }
    
    // Create a test image file if it doesn't exist
    const testImageFile = path.join(config.storage.testFilesDir, 'test.png');
    if (!fs.existsSync(testImageFile)) {
      // Create a simple 1x1 pixel PNG file
      const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==', 'base64');
      fs.writeFileSync(testImageFile, buffer);
    }
  });
  
  describe('Signed URL Generation', () => {
    it('should generate a signed upload URL', async () => {
      const fileName = 'test-file.txt';
      const contentType = 'text/plain';
      
      const response = await testUtils.api.post('/files/signed-url', {
        fileName,
        contentType,
        sizeBytes: 1024,
        folder: 'test',
      });
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('url');
      expect(response.data).toHaveProperty('fileId');
      expect(response.data).toHaveProperty('fields');
      expect(response.data.url).toContain('.storage.googleapis.com');
    });
    
    it('should validate file size limits', async () => {
      try {
        await testUtils.api.post('/files/signed-url', {
          fileName: 'large-file.txt',
          contentType: 'text/plain',
          sizeBytes: 5 * 1024 * 1024 * 1024, // 5GB (should be too large)
          folder: 'test',
        });
        
        fail('Should reject files that are too large');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('size');
      }
    });
    
    it('should validate file types', async () => {
      try {
        await testUtils.api.post('/files/signed-url', {
          fileName: 'suspicious.exe',
          contentType: 'application/x-msdownload',
          sizeBytes: 1024,
          folder: 'test',
        });
        
        fail('Should reject suspicious file types');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('file type');
      }
    });
  });
  
  describe('File Management', () => {
    let testFileId;
    
    // Upload a test file before tests
    beforeAll(async () => {
      try {
        // Get a signed URL
        const response = await testUtils.api.post('/files/signed-url', {
          fileName: 'integration-test.txt',
          contentType: 'text/plain',
          sizeBytes: 100,
          folder: 'test',
        });
        
        testFileId = response.data.fileId;
        
        // Upload the file directly to GCS (would normally be done by frontend)
        // For testing, we'll use the Cloud Storage Node.js client
        const bucket = testUtils.bucket();
        const file = bucket.file(`test/${testFileId}-integration-test.txt`);
        
        // Upload a simple text file
        await file.save('This is an integration test file.');
        
        // Add file metadata record (normally done by the file-manager service)
        await testUtils.createTestDocument('file_metadata', {
          id: testFileId,
          fileName: 'integration-test.txt',
          contentType: 'text/plain',
          sizeBytes: 100,
          bucketPath: `test/${testFileId}-integration-test.txt`,
          organizationId: config.testData.organizationId || 'test-org',
          uploadedBy: config.testData.userId || 'test-user',
          isPublic: false,
          isActive: true,
        });
      } catch (error) {
        console.error('Failed to prepare test file:', error);
        throw error;
      }
    });
    
    it('should list files', async () => {
      const response = await testUtils.api.get('/files');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // The test file should be in the response
      const foundFile = response.data.find(file => file.id === testFileId);
      expect(foundFile).toBeDefined();
      expect(foundFile).toHaveProperty('fileName', 'integration-test.txt');
    });
    
    it('should filter files by entity', async () => {
      // First attach the file to an entity
      await testUtils.api.post(`/files/${testFileId}/attach`, {
        entityType: 'test',
        entityId: 'test-entity',
      });
      
      // Now query for files by entity
      const response = await testUtils.api.get('/files', {
        params: {
          entityType: 'test',
          entityId: 'test-entity',
        },
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // The test file should be in the response
      const foundFile = response.data.find(file => file.id === testFileId);
      expect(foundFile).toBeDefined();
    });
    
    it('should generate a download URL', async () => {
      const response = await testUtils.api.get(`/files/${testFileId}/download-url`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('url');
      expect(response.data).toHaveProperty('fileName', 'integration-test.txt');
      expect(response.data.url).toContain('storage.googleapis.com');
      
      // Verify the URL works (we should be able to download the file)
      const fileContent = await fetch(response.data.url).then(res => res.text());
      expect(fileContent).toContain('This is an integration test file.');
    });
    
    it('should delete a file', async () => {
      // We'll create another test file specifically for deletion
      const response = await testUtils.api.post('/files/signed-url', {
        fileName: 'delete-test.txt',
        contentType: 'text/plain',
        sizeBytes: 100,
        folder: 'test',
      });
      
      const fileId = response.data.fileId;
      
      // Upload the file
      const bucket = testUtils.bucket();
      const file = bucket.file(`test/${fileId}-delete-test.txt`);
      await file.save('This file will be deleted.');
      
      // Add file metadata record
      await testUtils.createTestDocument('file_metadata', {
        id: fileId,
        fileName: 'delete-test.txt',
        contentType: 'text/plain',
        sizeBytes: 100,
        bucketPath: `test/${fileId}-delete-test.txt`,
        organizationId: config.testData.organizationId || 'test-org',
        uploadedBy: config.testData.userId || 'test-user',
        isPublic: false,
        isActive: true,
      });
      
      // Now delete the file
      const deleteResponse = await testUtils.api.delete(`/files/${fileId}`);
      expect(deleteResponse.status).toBe(200);
      
      // Verify the file is no longer listed
      const listResponse = await testUtils.api.get('/files');
      const foundFile = listResponse.data.find(file => file.id === fileId);
      expect(foundFile).toBeUndefined();
      
      // Verify the file no longer exists in GCS (or is marked as deleted)
      // This might be a soft delete, depending on implementation
      const [exists] = await file.exists();
      // If using soft delete, the file might still exist but metadata would show as inactive
      if (exists) {
        const metadataResponse = await testUtils.api.get(`/files/${fileId}/metadata`);
        expect(metadataResponse.data).toHaveProperty('isActive', false);
      }
    });
  });
});