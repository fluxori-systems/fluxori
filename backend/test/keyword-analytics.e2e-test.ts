import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { FirebaseAuthGuard } from "../src/common/guards/firebase-auth.guard";

/**
 * E2E tests for the Keyword Analytics Service
 */
describe("Keyword Analytics (e2e)", () => {
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

  // Test endpoints
  it("GET /credit-system/analytics/estimate - should return credit estimate", () => {
    return request(app.getHttpServer())
      .get("/credit-system/analytics/estimate")
      .query({
        keyword: "smartphone",
        marketplace: "takealot",
        includeMarketShare: "true",
        includeSeasonality: "true",
        includeCompetitionAnalysis: "true",
        includeTrendPrediction: "true",
        includeGrowthOpportunities: "true",
      })
      .expect(200)
      .expect((result: import("supertest").Response) => {
        expect(result.body).toHaveProperty("creditCost");
        expect(result.body.creditCost).toBeGreaterThan(0);
        expect(result.body).toHaveProperty("hasCredits");
      });
  });

  it("POST /credit-system/analytics - should generate analytics", () => {
    return request(app.getHttpServer())
      .post("/credit-system/analytics")
      .send({
        keyword: "smartphone",
        marketplace: "takealot",
        options: {
          includeMarketShare: true,
          includeSeasonality: true,
          includeCompetitionAnalysis: true,
          includeTrendPrediction: true,
          includeGrowthOpportunities: true,
        },
      })
      .expect(201)
      .expect((result: import("supertest").Response) => {
        expect(result.body).toHaveProperty("id");
        expect(result.body).toHaveProperty("keyword", "smartphone");
        expect(result.body).toHaveProperty("marketplace", "takealot");
        expect(result.body).toHaveProperty("searchVolume");
        expect(result.body).toHaveProperty("searchVolumeHistory");

        // Check if optional components exist based on options
        expect(result.body).toHaveProperty("seasonalityData");
        expect(result.body).toHaveProperty("marketShareData");
        expect(result.body).toHaveProperty("trendPrediction");
        expect(result.body).toHaveProperty("competitionAnalysis");
      });
  });

  it("GET /credit-system/analytics/:id - should return analytics by ID", async () => {
    // First create analytics to get an ID
    const createResponse = await request(app.getHttpServer())
      .post("/credit-system/analytics")
      .send({
        keyword: "laptop",
        marketplace: "takealot",
        options: {
          includeMarketShare: true,
          includeSeasonality: true,
        },
      });

    const analyticsId = createResponse.body.id;

    // Now get analytics by ID
    return request(app.getHttpServer())
      .get(`/credit-system/analytics/${analyticsId}`)
      .expect(200)
      .expect((result: import("supertest").Response) => {
        expect(result.body).toHaveProperty("id", analyticsId);
        expect(result.body).toHaveProperty("keyword", "laptop");
      });
  });

  it("POST /credit-system/analytics/batch - should generate batch analytics", () => {
    return request(app.getHttpServer())
      .post("/credit-system/analytics/batch")
      .send({
        keywords: ["headphones", "earbuds", "speakers"],
        marketplace: "takealot",
        options: {
          includeMarketShare: true,
          includeSeasonality: true,
        },
      })
      .expect(201)
      .expect((result: import("supertest").Response) => {
        expect(result.body).toHaveProperty("results");
        expect(result.body.results).toHaveLength(3);

        // Check each result
        result.body.results.forEach((result: any) => {
          expect(result).toHaveProperty("id");
          expect(result).toHaveProperty("keyword");
          expect(["headphones", "earbuds", "speakers"]).toContain(
            result.keyword,
          );
          expect(result).toHaveProperty("marketplace", "takealot");
        });
      });
  });

  it("GET /credit-system/analytics/popular - should return popular keywords", () => {
    return request(app.getHttpServer())
      .get("/credit-system/analytics/popular")
      .query({ marketplace: "takealot", limit: 5 })
      .expect(200)
      .expect((result: import("supertest").Response) => {
        expect(Array.isArray(result.body)).toBe(true);
        expect(result.body.length).toBeLessThanOrEqual(5);

        // Check results are sorted by search volume
        if (result.body.length > 1) {
          const firstVolume = result.body[0].searchVolume;
          const secondVolume = result.body[1].searchVolume;
          expect(firstVolume).toBeGreaterThanOrEqual(secondVolume);
        }
      });
  });

  it("GET /credit-system/analytics/trending - should return trending keywords", () => {
    return request(app.getHttpServer())
      .get("/credit-system/analytics/trending")
      .query({ marketplace: "takealot", limit: 5 })
      .expect(200)
      .expect((result: import("supertest").Response) => {
        expect(Array.isArray(result.body)).toBe(true);
        expect(result.body.length).toBeLessThanOrEqual(5);

        // All results should have trend prediction
        result.body.forEach((result: any) => {
          expect(result).toHaveProperty("trendPrediction");
        });
      });
  });

  it("GET /credit-system/analytics/seasonal - should return seasonal keywords", () => {
    return request(app.getHttpServer())
      .get("/credit-system/analytics/seasonal")
      .query({ marketplace: "takealot", limit: 5 })
      .expect(200)
      .expect((result: import("supertest").Response) => {
        expect(Array.isArray(result.body)).toBe(true);

        // All results should have seasonality data
        result.body.forEach((result: any) => {
          expect(result).toHaveProperty("seasonalityData");
          expect(result.seasonalityData).toHaveProperty("peakMonths");
        });
      });
  });
});
