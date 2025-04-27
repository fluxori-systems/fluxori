/**
 * Authentication Module Integration Tests
 */

const config = require("../config");

// Check if we can run auth tests
const canRunAuthTests = config.auth.email && config.auth.password;

// Skip tests if credentials are not available
const testOrSkip = canRunAuthTests ? describe : describe.skip;

testOrSkip("Authentication Module", () => {
  // Clear auth token before each test to start fresh
  beforeEach(() => {
    testUtils.clearAuthToken();
  });

  describe("Login", () => {
    it("should successfully login with valid credentials", async () => {
      const response = await testUtils.api.post("/auth/login", {
        email: config.auth.email,
        password: config.auth.password,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("token");
      expect(response.data).toHaveProperty("user");
      expect(response.data.user).toHaveProperty("email", config.auth.email);

      // Save token for future tests
      testUtils.setAuthToken(response.data.token);
    });

    it("should reject login with invalid credentials", async () => {
      try {
        await testUtils.api.post("/auth/login", {
          email: config.auth.email,
          password: "wrongpassword123",
        });

        // Should not reach here
        fail("Login should have failed");
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty("message");
        expect(error.response.data.message).toContain("Invalid credentials");
      }
    });

    it("should validate input fields", async () => {
      try {
        await testUtils.api.post("/auth/login", {
          email: "not-an-email",
          password: "123", // too short
        });

        fail("Validation should have failed");
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty("errors");
        expect(error.response.data.errors).toHaveLength(2);
      }
    });
  });

  describe("Token Validation", () => {
    let token;

    beforeEach(async () => {
      // Login to get a token
      const response = await testUtils.api.post("/auth/login", {
        email: config.auth.email,
        password: config.auth.password,
      });

      token = response.data.token;
      testUtils.setAuthToken(token);
    });

    it("should access protected endpoint with valid token", async () => {
      const response = await testUtils.api.get("/auth/profile");

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("user");
      expect(response.data.user).toHaveProperty("email", config.auth.email);
    });

    it("should reject access to protected endpoint without token", async () => {
      testUtils.clearAuthToken();

      try {
        await testUtils.api.get("/auth/profile");
        fail("Request should have been rejected");
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it("should reject access with invalid token", async () => {
      testUtils.setAuthToken("invalid.token.format");

      try {
        await testUtils.api.get("/auth/profile");
        fail("Request should have been rejected");
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe("User Profile", () => {
    beforeEach(async () => {
      await testUtils.authenticate();
    });

    it("should retrieve user profile", async () => {
      const response = await testUtils.api.get("/auth/profile");

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("user");
      expect(response.data.user).toHaveProperty("email");
      expect(response.data.user).toHaveProperty("id");
      expect(response.data.user).toHaveProperty("firstName");
      expect(response.data.user).toHaveProperty("lastName");
    });

    it("should update user profile", async () => {
      // Generate random suffix to avoid conflicts
      const testSuffix = testUtils.randomId();

      const updates = {
        firstName: `Test${testSuffix}`,
        lastName: `User${testSuffix}`,
      };

      const response = await testUtils.api.patch("/auth/profile", updates);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("user");
      expect(response.data.user).toHaveProperty("firstName", updates.firstName);
      expect(response.data.user).toHaveProperty("lastName", updates.lastName);

      // Verify changes persisted
      const verifyResponse = await testUtils.api.get("/auth/profile");
      expect(verifyResponse.data.user).toHaveProperty(
        "firstName",
        updates.firstName,
      );
      expect(verifyResponse.data.user).toHaveProperty(
        "lastName",
        updates.lastName,
      );
    });
  });
});
