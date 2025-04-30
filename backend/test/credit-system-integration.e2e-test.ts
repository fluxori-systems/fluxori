import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { FirebaseAuthGuard } from "../src/common/guards/firebase-auth.guard";

/**
 * E2E tests for the Credit System integration
 */
describe("Credit System Integration (e2e)", () => {
  let app: INestApplication;
  let mockUser: { uid: string; organizationId: string };

  beforeAll(async () => {
    // Inline mock user (was previously imported)
    mockUser = {
      uid: "test-user-123",
      organizationId: "test-org-123",
    };
    // No import needed

    // Create testing module with mocked auth guard
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    app = moduleFixture.createNestApplication();

    // Mock the user extraction from request
    app.use(
      (
        req: import("express").Request & {
          user?: { uid: string; organizationId: string };
        },
        res: import("express").Response,
        next: import("express").NextFunction,
      ) => {
        req.user = mockUser;
        next();
      },
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Keyword Research Credit Flow", () => {
    it("GET /credit-system/estimate - should estimate credit costs for keyword research", () => {
      return request(app.getHttpServer())
        .get("/credit-system/estimate")
        .query({
          keywords: ["smartphone", "laptop"],
          marketplaces: ["takealot", "makro"],
          usageType: "KEYWORD_RESEARCH",
        })
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty("creditCost");
          expect(res.body.creditCost).toBeGreaterThan(0);
          expect(res.body).toHaveProperty("hasCredits");
        });
    });

    it("POST /credit-system/research/keywords - should submit keyword research request with credit check", () => {
      return request(app.getHttpServer())
        .post("/credit-system/research/keywords")
        .send({
          keywords: ["smartphone", "tablet"],
          marketplaces: ["takealot"],
          priority: 5,
          includeSEOMetrics: true,
          notificationEnabled: true,
        })
        .expect(201)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body).toHaveProperty("creditCost");
          expect(res.body).toHaveProperty("reservationId");
          expect(res.body).toHaveProperty("status", "pending");
        });
    });

    it("GET /credit-system/research/status/:id - should check research request status", async () => {
      // First create a request
      const createResponse = await request(app.getHttpServer())
        .post("/credit-system/research/keywords")
        .send({
          keywords: ["laptop"],
          marketplaces: ["takealot"],
          priority: 5,
        });

      const requestId = createResponse.body.id;

      // Now check its status
      return request(app.getHttpServer())
        .get(`/credit-system/research/status/${requestId}`)
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty("totalPendingRequests");
          expect(res.body).toHaveProperty("queuePosition");
          expect(res.body).toHaveProperty("estimatedCompletionTime");
        });
    });
  });

  describe("Marketplace Scraper Integration", () => {
    it("POST /credit-system/integration/marketplace - should register scraper activity", () => {
      return request(app.getHttpServer())
        .post("/credit-system/integration/marketplace")
        .send({
          organizationId: "test-org-123",
          operation: "KEYWORD_RESEARCH",
          operationId: "test-operation-123",
          marketplaces: ["takealot"],
          keywords: ["smartphone"],
          status: "completed",
          results: {
            count: 25,
            cached: false,
            executionTimeMs: 1500,
          },
        })
        .expect(201)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty("success", true);
          expect(res.body).toHaveProperty("creditUsage");
          expect(res.body.creditUsage).toHaveProperty("recorded", true);
        });
    });
  });

  describe("Advanced Analytics Features", () => {
    it("POST /credit-system/analytics - should generate analytics with credit charge", () => {
      return request(app.getHttpServer())
        .post("/credit-system/analytics")
        .send({
          keyword: "smartphone",
          marketplace: "takealot",
          options: {
            includeMarketShare: true,
            includeSeasonality: true,
            includeCompetitionAnalysis: true,
            includeTrendPrediction: false,
            includeGrowthOpportunities: false,
          },
        })
        .expect(201)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body).toHaveProperty("searchVolume");
          expect(res.body).toHaveProperty("keyword", "smartphone");
        });
    });

    it("POST /credit-system/competitor-alerts/watches - should create a competitor watch", () => {
      return request(app.getHttpServer())
        .post("/credit-system/competitor-alerts/watches")
        .send({
          keyword: "smartphone",
          marketplaces: ["takealot"],
          alertTypes: ["PRICE_CHANGE", "RANKING_CHANGE"],
          thresholds: {
            priceChangePercent: 5,
            rankingChangePositions: 3,
          },
          frequency: "daily",
          notificationChannels: ["email"],
          isActive: true,
        })
        .expect(201)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body).toHaveProperty("creditCost");
          expect(res.body).toHaveProperty("keyword", "smartphone");
        });
    });

    it("POST /credit-system/pim-integration - should connect PIM with keywords", () => {
      return request(app.getHttpServer())
        .post("/credit-system/pim-integration")
        .send({
          productIds: ["product-123"],
          keywords: ["smartphone", "android"],
          marketplaces: ["takealot"],
          mapToProducts: true,
          generateProductDescriptions: true,
          optimizeAttributeValues: false,
          optimizeListingTitles: false,
        })
        .expect(201)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty("keywordResearchResult");
          expect(res.body).toHaveProperty("mappingsCreated");
        });
    });

    it("POST /credit-system/strategy - should generate marketplace strategy", () => {
      return request(app.getHttpServer())
        .post("/credit-system/strategy")
        .send({
          marketplace: "takealot",
          productId: "product-123",
          keywords: ["smartphone", "android", "wireless"],
          includeAiSummary: true,
          includeActionPlan: true,
          includeCompetitiveAnalysis: true,
          includeSouthAfricanInsights: true,
        })
        .expect(201)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body).toHaveProperty("aiGeneratedSummary");
          expect(res.body).toHaveProperty("recommendedActions");
          expect(res.body).toHaveProperty("southAfricanMarketInsights");
        });
    });
  });

  describe("Credit System Core", () => {
    it("GET /credit-system/balance - should show credit balance", () => {
      return request(app.getHttpServer())
        .get("/credit-system/balance")
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty("totalCredits");
          expect(res.body).toHaveProperty("remainingCredits");
          expect(res.body).toHaveProperty("usageStats");
        });
    });

    it("POST /credit-system/add-credits - should add credits to account", () => {
      return request(app.getHttpServer())
        .post("/credit-system/add-credits")
        .send({
          amount: 100,
          type: "subscription",
        })
        .expect(201)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty("success", true);
          expect(res.body).toHaveProperty("updatedBalance");
          expect(res.body.updatedBalance).toBeGreaterThanOrEqual(100);
        });
    });
  });
});
