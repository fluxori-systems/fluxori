/**
 * End-to-End Test: Order Processing Workflow
 *
 * This test verifies the complete order processing flow, from ingestion to
 * inventory updates, notifications, and reporting.
 */

const config = require("../config");

// This is a critical business flow, so we test it carefully
describe("Order Processing Workflow", () => {
  // Authenticate before running tests
  beforeAll(async () => {
    await testUtils.authenticate();
  });

  // Test data
  let testProductId;
  let testOrderId;
  let testWarehouseId;

  // Create test product, order, and warehouse
  beforeAll(async () => {
    try {
      // Create a test product for inventory tracking
      const productResponse = await testUtils.api.post("/inventory/products", {
        name: `Test Product ${testUtils.randomId()}`,
        sku: `TP-${testUtils.randomId()}`,
        barcode: `9781234567${Math.floor(Math.random() * 1000)}`,
        description: "Test product for integration testing",
        weight: 1.5,
        weightUnit: "kg",
        attributes: {
          color: "Blue",
          size: "Medium",
        },
        isActive: true,
      });

      testProductId = productResponse.data.id;
      console.log(`Created test product: ${testProductId}`);

      // Create a test warehouse
      const warehouseResponse = await testUtils.api.post(
        "/inventory/warehouses",
        {
          name: `Test Warehouse ${testUtils.randomId()}`,
          location: {
            address: "123 Test Street",
            city: "Johannesburg",
            state: "Gauteng",
            postalCode: "2000",
            country: "ZA",
          },
          isActive: true,
        },
      );

      testWarehouseId = warehouseResponse.data.id;
      console.log(`Created test warehouse: ${testWarehouseId}`);

      // Add initial stock to the warehouse
      await testUtils.api.post("/inventory/stock", {
        productId: testProductId,
        warehouseId: testWarehouseId,
        quantity: 100,
        location: "A-1-1",
      });

      console.log("Added test stock to warehouse");
    } catch (error) {
      console.error("Failed to prepare test data:", error);
      throw error;
    }
  });

  describe("Order Ingestion", () => {
    it("should ingest a new order from JSON payload", async () => {
      // Create a test order
      const orderPayload = {
        source: "integration_test",
        externalId: `test-order-${testUtils.randomId()}`,
        customer: {
          email: "test@example.com",
          firstName: "Test",
          lastName: "Customer",
          phone: "+27123456789",
        },
        shippingAddress: {
          address1: "123 Test Street",
          city: "Johannesburg",
          state: "Gauteng",
          postalCode: "2000",
          country: "ZA",
        },
        lineItems: [
          {
            productId: testProductId,
            quantity: 2,
            price: 100,
            currency: "ZAR",
          },
        ],
        totals: {
          subtotal: 200,
          shipping: 50,
          tax: 30,
          discount: 0,
          total: 280,
        },
        paymentStatus: "PAID",
        fulfillmentStatus: "UNFULFILLED",
      };

      const response = await testUtils.api.post("/orders/ingest", orderPayload);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty("id");
      expect(response.data).toHaveProperty(
        "externalId",
        orderPayload.externalId,
      );
      expect(response.data).toHaveProperty("customer");
      expect(response.data).toHaveProperty("status", "PROCESSING");

      // Save the order ID for future tests
      testOrderId = response.data.id;
      console.log(`Created test order: ${testOrderId}`);
    });

    it("should process the order and update inventory", async () => {
      // Wait for order processing (may take a moment)
      await testUtils.sleep(2000);

      // Check the order status
      const orderResponse = await testUtils.api.get(`/orders/${testOrderId}`);

      expect(orderResponse.status).toBe(200);
      expect(orderResponse.data).toHaveProperty("status", "PROCESSED");

      // Verify inventory has been updated
      const stockResponse = await testUtils.api.get("/inventory/stock", {
        params: {
          productId: testProductId,
          warehouseId: testWarehouseId,
        },
      });

      expect(stockResponse.status).toBe(200);
      expect(Array.isArray(stockResponse.data)).toBe(true);
      expect(stockResponse.data.length).toBeGreaterThan(0);

      const stock = stockResponse.data[0];
      expect(stock).toHaveProperty("quantity", 98); // Was 100, 2 were ordered
      expect(stock).toHaveProperty("allocatedQuantity", 2);
    });

    it("should create a notification for the new order", async () => {
      // Check if a notification was created for the order
      const notificationsResponse = await testUtils.api.get("/notifications", {
        params: {
          entityType: "order",
          entityId: testOrderId,
        },
      });

      expect(notificationsResponse.status).toBe(200);
      expect(Array.isArray(notificationsResponse.data)).toBe(true);
      expect(notificationsResponse.data.length).toBeGreaterThan(0);

      const notification = notificationsResponse.data[0];
      expect(notification).toHaveProperty("type", "NEW_ORDER");
      expect(notification).toHaveProperty("entityId", testOrderId);
    });
  });

  describe("Order Fulfillment", () => {
    it("should create a fulfillment for the order", async () => {
      const fulfillmentPayload = {
        orderId: testOrderId,
        warehouseId: testWarehouseId,
        lineItems: [
          {
            productId: testProductId,
            quantity: 2,
          },
        ],
        trackingNumber: "TS123456789ZA",
        shippingCarrier: "Test Courier",
      };

      const response = await testUtils.api.post(
        "/orders/fulfillments",
        fulfillmentPayload,
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty("id");
      expect(response.data).toHaveProperty("orderId", testOrderId);
      expect(response.data).toHaveProperty("status", "CREATED");

      // Save fulfillment ID
      const fulfillmentId = response.data.id;
      console.log(`Created test fulfillment: ${fulfillmentId}`);

      // Verify the order status was updated
      const orderResponse = await testUtils.api.get(`/orders/${testOrderId}`);
      expect(orderResponse.data).toHaveProperty(
        "fulfillmentStatus",
        "FULFILLED",
      );
    });

    it("should update inventory after fulfillment", async () => {
      // Wait for inventory updates to process
      await testUtils.sleep(2000);

      // Verify inventory has been updated
      const stockResponse = await testUtils.api.get("/inventory/stock", {
        params: {
          productId: testProductId,
          warehouseId: testWarehouseId,
        },
      });

      expect(stockResponse.status).toBe(200);

      const stock = stockResponse.data[0];
      expect(stock).toHaveProperty("quantity", 98); // Still 98 total
      expect(stock).toHaveProperty("allocatedQuantity", 0); // No longer allocated
      expect(stock).toHaveProperty("committedQuantity", 2); // Now committed instead
    });

    it("should mark fulfillment as shipped", async () => {
      // First get the fulfillment ID
      const orderResponse = await testUtils.api.get(`/orders/${testOrderId}`);
      const fulfillmentId = orderResponse.data.fulfillments[0].id;

      // Mark as shipped
      const response = await testUtils.api.patch(
        `/orders/fulfillments/${fulfillmentId}/ship`,
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("status", "SHIPPED");

      // Verify the order was updated
      const updatedOrderResponse = await testUtils.api.get(
        `/orders/${testOrderId}`,
      );
      expect(updatedOrderResponse.data).toHaveProperty(
        "fulfillmentStatus",
        "SHIPPED",
      );

      // Wait for inventory to update
      await testUtils.sleep(2000);

      // Verify inventory has been updated
      const stockResponse = await testUtils.api.get("/inventory/stock", {
        params: {
          productId: testProductId,
          warehouseId: testWarehouseId,
        },
      });

      const stock = stockResponse.data[0];
      expect(stock).toHaveProperty("quantity", 98);
      expect(stock).toHaveProperty("allocatedQuantity", 0);
      expect(stock).toHaveProperty("committedQuantity", 0); // No longer committed
      expect(stock).toHaveProperty("shippedQuantity", 2); // Now shipped
    });
  });

  describe("Order Delivery", () => {
    it("should mark the order as delivered", async () => {
      // First get the fulfillment ID
      const orderResponse = await testUtils.api.get(`/orders/${testOrderId}`);
      const fulfillmentId = orderResponse.data.fulfillments[0].id;

      // Mark as delivered
      const response = await testUtils.api.patch(
        `/orders/fulfillments/${fulfillmentId}/deliver`,
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("status", "DELIVERED");

      // Verify the order was updated
      const updatedOrderResponse = await testUtils.api.get(
        `/orders/${testOrderId}`,
      );
      expect(updatedOrderResponse.data).toHaveProperty(
        "fulfillmentStatus",
        "DELIVERED",
      );

      // Order should be complete
      expect(updatedOrderResponse.data).toHaveProperty("status", "COMPLETED");

      // Verify inventory impact - should reduce available by 2
      const stockResponse = await testUtils.api.get("/inventory/stock", {
        params: {
          productId: testProductId,
          warehouseId: testWarehouseId,
        },
      });

      const stock = stockResponse.data[0];
      expect(stock).toHaveProperty("availableQuantity", 98); // Available now reduced
    });
  });

  // Clean up test data
  afterAll(async () => {
    console.log("Cleaning up test data...");

    try {
      // Archive the order rather than delete
      if (testOrderId) {
        await testUtils.api.patch(`/orders/${testOrderId}/archive`);
        console.log(`Archived test order: ${testOrderId}`);
      }

      // Delete the product
      if (testProductId) {
        await testUtils.api.delete(`/inventory/products/${testProductId}`);
        console.log(`Deleted test product: ${testProductId}`);
      }

      // Delete the warehouse
      if (testWarehouseId) {
        await testUtils.api.delete(`/inventory/warehouses/${testWarehouseId}`);
        console.log(`Deleted test warehouse: ${testWarehouseId}`);
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  });
});
