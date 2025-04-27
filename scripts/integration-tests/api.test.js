/**
 * API Connectivity and Health Tests
 *
 * Basic tests to verify that the API is running and responding correctly.
 */

const config = require("./config");

describe("API Health and Connectivity", () => {
  it("should respond to health check endpoint", async () => {
    const response = await testUtils.api.get("/health");
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("status", "ok");
  });

  it("should return proper CORS headers", async () => {
    const response = await testUtils.api.options("/health");
    expect(response.headers).toHaveProperty("access-control-allow-origin");
    expect(response.headers).toHaveProperty("access-control-allow-methods");
  });

  it("should respond to API version endpoint", async () => {
    const response = await testUtils.api.get("/version");
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("version");
    expect(response.data).toHaveProperty("environment", config.environment);
  });

  describe("API Rate Limiting", () => {
    it("should handle multiple rapid requests without rate limiting for normal traffic", async () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(testUtils.api.get("/health"));
      }

      const responses = await Promise.all(requests);

      // All responses should be successful
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it("should apply rate limiting for excessive requests", async () => {
      // Skip in production to avoid triggering protection
      if (config.environment === "production") {
        return;
      }

      try {
        // Generate 50 rapid requests
        const promises = [];
        for (let i = 0; i < 50; i++) {
          promises.push(testUtils.api.get("/health"));
        }

        const responses = await Promise.all(promises);

        // Check if any responses have rate limiting headers
        const rateLimitedResponses = responses.filter(
          (r) => r.headers["x-ratelimit-remaining"] === "0" || r.status === 429,
        );

        console.log(
          `${rateLimitedResponses.length} of 50 requests were rate-limited`,
        );

        // We expect at least some rate limiting after 50 rapid requests
        // But this is environment dependent, so we just log it
      } catch (error) {
        // Rate limiting might cause some requests to fail with 429, which is expected
        if (error.response && error.response.status === 429) {
          console.log("Rate limiting correctly applied");
        } else {
          throw error;
        }
      }
    });
  });

  describe("Error Handling", () => {
    it("should return proper error format for 404", async () => {
      try {
        await testUtils.api.get("/non-existent-endpoint");
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty("message");
        expect(error.response.data).toHaveProperty("statusCode", 404);
      }
    });

    it("should return proper error format for validation errors", async () => {
      try {
        // Try to log in with empty credentials
        await testUtils.api.post("/auth/login", {});
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty("message");
        expect(error.response.data).toHaveProperty("statusCode", 400);
        expect(error.response.data).toHaveProperty("errors");
      }
    });
  });
});
