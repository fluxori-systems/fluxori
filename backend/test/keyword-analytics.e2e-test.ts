import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { FirebaseAuthGuard } from "../src/common/guards/firebase-auth.guard";
import { mockFirebaseUser } from "./mocks/auth.mock";

/**
 * E2E tests for the Keyword Analytics Service
 */
describe("Keyword Analytics (e2e)", () => {
  let app: INestApplication;
  let mockUser: any;

  beforeAll(async () => {
    // Mock user with organization ID
    mockUser = {
      uid: "test-user-123",
      organizationId: "test-org-123",
    };

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
    app.use((req, res, next) => {
      req.user = mockUser;
      next();
    });

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
      .expect((res) => {
        expect(res.body).toHaveProperty("creditCost");
        expect(res.body.creditCost).toBeGreaterThan(0);
        expect(res.body).toHaveProperty("hasCredits");
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
      .expect((res) => {
        expect(res.body).toHaveProperty("id");
        expect(res.body).toHaveProperty("keyword", "smartphone");
        expect(res.body).toHaveProperty("marketplace", "takealot");
        expect(res.body).toHaveProperty("searchVolume");
        expect(res.body).toHaveProperty("searchVolumeHistory");

        // Check if optional components exist based on options
        expect(res.body).toHaveProperty("seasonalityData");
        expect(res.body).toHaveProperty("marketShareData");
        expect(res.body).toHaveProperty("trendPrediction");
        expect(res.body).toHaveProperty("competitionAnalysis");
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
      .expect((res) => {
        expect(res.body).toHaveProperty("id", analyticsId);
        expect(res.body).toHaveProperty("keyword", "laptop");
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
      .expect((res) => {
        expect(res.body).toHaveProperty("results");
        expect(res.body.results).toHaveLength(3);

        // Check each result
        res.body.results.forEach((result) => {
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
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeLessThanOrEqual(5);

        // Check results are sorted by search volume
        if (res.body.length > 1) {
          const firstVolume = res.body[0].searchVolume;
          const secondVolume = res.body[1].searchVolume;
          expect(firstVolume).toBeGreaterThanOrEqual(secondVolume);
        }
      });
  });

  it("GET /credit-system/analytics/trending - should return trending keywords", () => {
    return request(app.getHttpServer())
      .get("/credit-system/analytics/trending")
      .query({ marketplace: "takealot", limit: 5 })
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeLessThanOrEqual(5);

        // All results should have trend prediction
        res.body.forEach((result) => {
          expect(result).toHaveProperty("trendPrediction");
        });
      });
  });

  it("GET /credit-system/analytics/seasonal - should return seasonal keywords", () => {
    return request(app.getHttpServer())
      .get("/credit-system/analytics/seasonal")
      .query({ marketplace: "takealot", limit: 5 })
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);

        // All results should have seasonality data
        res.body.forEach((result) => {
          expect(result).toHaveProperty("seasonalityData");
          expect(result.seasonalityData).toHaveProperty("peakMonths");
        });
      });
  });
});
