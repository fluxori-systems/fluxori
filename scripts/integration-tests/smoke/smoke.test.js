/**
 * Smoke Tests for Fluxori Platform
 *
 * These tests verify that the basic functionality of the platform is working.
 * They are meant to be run after a deployment to ensure that the core features
 * are operational.
 */

const config = require("../config");

// These tests are critical and should always run in any environment
describe("Smoke Tests", () => {
  /**
   * API Health Checks
   */
  describe("API Health", () => {
    it("API health endpoint responds with status 200", async () => {
      const response = await testUtils.api.get("/health");
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("status", "ok");
    });

    it("API version endpoint responds with correct environment", async () => {
      const response = await testUtils.api.get("/version");
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("version");
      expect(response.data).toHaveProperty("environment", config.environment);
    });
  });

  /**
   * Authentication
   */
  describe("Authentication", () => {
    // Skip if no auth credentials are provided
    if (!config.auth.email || !config.auth.password) {
      it.skip("Authentication tests skipped - no credentials provided", () => {});
      return;
    }

    it("can log in with valid credentials", async () => {
      const response = await testUtils.api.post("/auth/login", {
        email: config.auth.email,
        password: config.auth.password,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("token");
      expect(response.data).toHaveProperty("user");

      // Save token for subsequent tests
      testUtils.setAuthToken(response.data.token);
    });

    it("can access a protected endpoint with valid token", async () => {
      const response = await testUtils.api.get("/auth/profile");

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("user");
      expect(response.data.user).toHaveProperty("email", config.auth.email);
    });
  });

  /**
   * Database
   */
  describe("Database", () => {
    // Authenticate if not already done
    beforeAll(async () => {
      if (
        config.auth.email &&
        config.auth.password &&
        !testUtils.api.defaults.headers.common["Authorization"]
      ) {
        await testUtils.authenticate();
      }
    });

    it("can read from a public collection", async () => {
      const response = await testUtils.api.get("/marketplace/configs");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it("can write and read a test document", async () => {
      // Skip in production
      if (config.environment === "production") {
        return;
      }

      const testData = {
        name: `Smoke Test ${Date.now()}`,
        description: "Created by smoke test",
        timestamp: new Date().toISOString(),
      };

      // Create a test document
      const createResponse = await testUtils.api.post("/test-data", testData);
      expect(createResponse.status).toBe(201);
      expect(createResponse.data).toHaveProperty("id");

      const id = createResponse.data.id;

      // Read the document back
      const readResponse = await testUtils.api.get(`/test-data/${id}`);
      expect(readResponse.status).toBe(200);
      expect(readResponse.data).toHaveProperty("name", testData.name);
      expect(readResponse.data).toHaveProperty(
        "description",
        testData.description,
      );

      // Clean up
      await testUtils.api.delete(`/test-data/${id}`);
    });
  });

  /**
   * Storage
   */
  describe("Storage", () => {
    // Authenticate if not already done
    beforeAll(async () => {
      if (
        config.auth.email &&
        config.auth.password &&
        !testUtils.api.defaults.headers.common["Authorization"]
      ) {
        await testUtils.authenticate();
      }
    });

    it("can generate a signed URL for file upload", async () => {
      const response = await testUtils.api.post("/files/signed-url", {
        fileName: "smoke-test.txt",
        contentType: "text/plain",
        sizeBytes: 100,
        folder: "test",
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty("url");
      expect(response.data).toHaveProperty("fileId");
      expect(response.data).toHaveProperty("fields");
      expect(response.data.url).toContain(".storage.googleapis.com");
    });

    it("can list files", async () => {
      const response = await testUtils.api.get("/files");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  /**
   * Core Business Logic
   */
  describe("Core Business Logic", () => {
    // Authenticate if not already done
    beforeAll(async () => {
      if (
        config.auth.email &&
        config.auth.password &&
        !testUtils.api.defaults.headers.common["Authorization"]
      ) {
        await testUtils.authenticate();
      }
    });

    it("can list organization inventory", async () => {
      const response = await testUtils.api.get("/inventory/products");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it("can list warehouses", async () => {
      const response = await testUtils.api.get("/inventory/warehouses");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it("can view marketplace configurations", async () => {
      const response = await testUtils.api.get("/marketplaces/configs");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });
});
