import { Test } from "@nestjs/testing";
import { KeywordAnalyticsService } from "../src/modules/credit-system/services/keyword-analytics.service";
import { KeywordResearchService } from "../src/modules/credit-system/services/keyword-research.service";
import { CreditSystemService } from "../src/modules/credit-system/services/credit-system.service";
import {
  KeywordAnalyticsRepository,
  KeywordResearchResultRepository,
  KeywordResearchRequestRepository,
} from "../src/modules/credit-system/repositories";
import {
  KeywordAnalyticsResult,
  AnalyticsRequestOptions,
  KeywordResearchResult,
} from "../src/modules/credit-system/interfaces/types";

// Mock repositories and services
const mockKeywordAnalyticsRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByKeywordAndMarketplace: jest.fn(),
  findByKeywords: jest.fn(),
  findPopularKeywords: jest.fn(),
  findTrendingKeywords: jest.fn(),
  findSeasonalKeywords: jest.fn(),
};

const mockKeywordResearchResultRepository = {
  findByKeywordAndMarketplace: jest.fn(),
};

const mockKeywordResearchRequestRepository = {
  findById: jest.fn(),
};

const mockCreditSystemService = {
  checkCredits: jest.fn(),
  checkAndReserveCredits: jest.fn(),
  confirmCreditReservation: jest.fn(),
  recordUsage: jest.fn(),
};

const mockKeywordResearchService = {
  requestKeywordResearch: jest.fn(),
};

describe("KeywordAnalyticsService", () => {
  let keywordAnalyticsService: KeywordAnalyticsService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        KeywordAnalyticsService,
        {
          provide: KeywordAnalyticsRepository,
          useValue: mockKeywordAnalyticsRepository,
        },
        {
          provide: KeywordResearchResultRepository,
          useValue: mockKeywordResearchResultRepository,
        },
        {
          provide: KeywordResearchRequestRepository,
          useValue: mockKeywordResearchRequestRepository,
        },
        { provide: CreditSystemService, useValue: mockCreditSystemService },
        {
          provide: KeywordResearchService,
          useValue: mockKeywordResearchService,
        },
      ],
    }).compile();

    keywordAnalyticsService = moduleRef.get<KeywordAnalyticsService>(
      KeywordAnalyticsService,
    );
  });

  describe("generateAnalytics", () => {
    it("should return existing analytics if available", async () => {
      // Setup mock for existing analytics
      const existingAnalytics: KeywordAnalyticsResult = {
        id: "analytics123",
        organizationId: "org123",
        userId: "user456",
        requestId: "req123",
        keyword: "smartphone",
        marketplace: "takealot",
        searchVolume: 10000,
        searchVolumeHistory: [],
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      mockKeywordAnalyticsRepository.findByKeywordAndMarketplace.mockResolvedValue(
        existingAnalytics,
      );

      const options: AnalyticsRequestOptions = {
        includeMarketShare: true,
        includeSeasonality: true,
        includeCompetitionAnalysis: true,
        includeTrendPrediction: true,
        includeGrowthOpportunities: true,
      };

      const result = await keywordAnalyticsService.generateAnalytics(
        "org123",
        "user456",
        "smartphone",
        "takealot",
        options,
      );

      expect(result).toBe(existingAnalytics);
      expect(
        mockKeywordAnalyticsRepository.findByKeywordAndMarketplace,
      ).toHaveBeenCalledWith("org123", "smartphone", "takealot");
      expect(mockCreditSystemService.checkCredits).not.toHaveBeenCalled(); // No credit check needed
    });

    it("should generate new analytics if none exist", async () => {
      // Setup mocks for credit check and results
      mockKeywordAnalyticsRepository.findByKeywordAndMarketplace.mockResolvedValue(
        null,
      );

      mockCreditSystemService.checkCredits.mockResolvedValue({
        hasCredits: true,
        availableCredits: 100,
        estimatedCost: 30,
        reservationId: "res123",
      });

      // Mock research results
      const researchResult: KeywordResearchResult = {
        id: "result123",
        requestId: "req123",
        organizationId: "org123",
        keyword: "smartphone",
        marketplace: "takealot",
        rankingData: [
          {
            position: 1,
            productId: "prod123",
            productTitle: "Samsung Galaxy S21",
            productUrl: "https://takealot.com/samsung-galaxy-s21",
            price: 15000,
            currency: "ZAR",
            brand: "Samsung",
          },
        ],
        searchVolume: 10000,
        lastUpdated: new Date(),
        resultSource: "fresh",
      };

      mockKeywordResearchResultRepository.findByKeywordAndMarketplace.mockResolvedValue(
        researchResult,
      );

      // Mock that analytics creation was successful
      const newAnalytics: KeywordAnalyticsResult = {
        id: "analytics123",
        organizationId: "org123",
        userId: "user456",
        requestId: "req123",
        keyword: "smartphone",
        marketplace: "takealot",
        searchVolume: 10000,
        searchVolumeHistory: [],
        seasonalityData: {
          quarterlyTrends: {},
          monthlyTrends: {},
          seasonalKeywords: [],
          peakMonths: [],
          peakScore: 0,
        },
        marketShareData: {
          totalProductCount: 1,
          dominantBrands: [],
          priceDistribution: {
            minPrice: 0,
            maxPrice: 0,
            averagePrice: 0,
            medianPrice: 0,
            priceRanges: [],
          },
        },
        trendPrediction: {
          predictedVolume: [],
          predictedGrowth: 0,
          confidence: 0,
          nextThreeMonths: [],
          trendDirection: "stable",
        },
        competitionAnalysis: {
          difficulty: 0,
          topCompetitors: [],
          saturationLevel: 0,
          entryBarrier: "medium",
          opportunityScore: 0,
        },
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      mockKeywordAnalyticsRepository.create.mockResolvedValue(newAnalytics);

      // Spy on the processAnalytics method
      const processAnalyticsSpy = jest
        .spyOn<any, any>(keywordAnalyticsService, "processAnalytics")
        .mockResolvedValue(newAnalytics);

      const options: AnalyticsRequestOptions = {
        includeMarketShare: true,
        includeSeasonality: true,
        includeCompetitionAnalysis: true,
        includeTrendPrediction: true,
        includeGrowthOpportunities: true,
      };

      const result = await keywordAnalyticsService.generateAnalytics(
        "org123",
        "user456",
        "smartphone",
        "takealot",
        options,
      );

      expect(result).toBeDefined();
      expect(mockCreditSystemService.checkCredits).toHaveBeenCalled();
      expect(processAnalyticsSpy).toHaveBeenCalled();
      expect(mockCreditSystemService.recordUsage).toHaveBeenCalled();
    });

    it("should throw error if credit check fails", async () => {
      // Setup mocks
      mockKeywordAnalyticsRepository.findByKeywordAndMarketplace.mockResolvedValue(
        null,
      );

      mockCreditSystemService.checkCredits.mockResolvedValue({
        hasCredits: false,
        availableCredits: 10,
        estimatedCost: 50,
        reason: "Insufficient credits",
      });

      const options: AnalyticsRequestOptions = {
        includeMarketShare: true,
        includeSeasonality: true,
        includeCompetitionAnalysis: true,
        includeTrendPrediction: true,
        includeGrowthOpportunities: true,
      };

      await expect(
        keywordAnalyticsService.generateAnalytics(
          "org123",
          "user456",
          "smartphone",
          "takealot",
          options,
        ),
      ).rejects.toThrow("Insufficient credits");
    });
  });

  describe("calculateAnalyticsCost", () => {
    it("should calculate cost based on selected options", () => {
      // Test with all options enabled
      const allOptionsResult = (
        keywordAnalyticsService as any
      ).calculateAnalyticsCost({
        includeMarketShare: true,
        includeSeasonality: true,
        includeCompetitionAnalysis: true,
        includeTrendPrediction: true,
        includeGrowthOpportunities: true,
      });

      // Base cost (15) + all options (45) = 60
      expect(allOptionsResult).toBe(60);

      // Test with some options enabled
      const someOptionsResult = (
        keywordAnalyticsService as any
      ).calculateAnalyticsCost({
        includeMarketShare: true,
        includeSeasonality: true,
        includeCompetitionAnalysis: false,
        includeTrendPrediction: false,
        includeGrowthOpportunities: false,
      });

      // Base cost (15) + market share (5) + seasonality (5) = 25
      expect(someOptionsResult).toBe(25);

      // Test with no options enabled
      const noOptionsResult = (
        keywordAnalyticsService as any
      ).calculateAnalyticsCost({
        includeMarketShare: false,
        includeSeasonality: false,
        includeCompetitionAnalysis: false,
        includeTrendPrediction: false,
        includeGrowthOpportunities: false,
      });

      // Base cost only (15)
      expect(noOptionsResult).toBe(15);
    });
  });

  describe("getAnalyticsForKeywords", () => {
    it("should process multiple keywords and return results", async () => {
      // Setup mocks for existing analytics
      const existingAnalytics = new Map<string, KeywordAnalyticsResult>();
      existingAnalytics.set("smartphone", {
        id: "analytics123",
        organizationId: "org123",
        userId: "user456",
        requestId: "req123",
        keyword: "smartphone",
        marketplace: "takealot",
        searchVolume: 10000,
        searchVolumeHistory: [],
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      mockKeywordAnalyticsRepository.findByKeywords.mockResolvedValue(
        existingAnalytics,
      );

      // Mock generateAnalytics for new keyword
      jest
        .spyOn(keywordAnalyticsService, "generateAnalytics")
        .mockResolvedValue({
          id: "analytics124",
          organizationId: "org123",
          userId: "user456",
          requestId: "req124",
          keyword: "laptop",
          marketplace: "takealot",
          searchVolume: 8000,
          searchVolumeHistory: [],
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

      const options: AnalyticsRequestOptions = {
        includeMarketShare: true,
        includeSeasonality: true,
        includeCompetitionAnalysis: false,
        includeTrendPrediction: false,
        includeGrowthOpportunities: false,
      };

      const keywords = ["smartphone", "laptop"];

      const result = await keywordAnalyticsService.getAnalyticsForKeywords(
        "org123",
        "user456",
        keywords,
        "takealot",
        options,
      );

      expect(result.size).toBe(2);
      expect(result.has("smartphone")).toBeTruthy();
      expect(result.has("laptop")).toBeTruthy();
      expect(mockKeywordAnalyticsRepository.findByKeywords).toHaveBeenCalled();
      expect(keywordAnalyticsService.generateAnalytics).toHaveBeenCalledTimes(
        1,
      ); // Only for the new keyword
    });
  });

  describe("getPopularKeywords", () => {
    it("should return popular keywords for a marketplace", async () => {
      const popularKeywords = [
        {
          id: "analytics123",
          keyword: "smartphone",
          marketplace: "takealot",
          searchVolume: 10000,
        },
        {
          id: "analytics124",
          keyword: "laptop",
          marketplace: "takealot",
          searchVolume: 8000,
        },
      ];

      mockKeywordAnalyticsRepository.findPopularKeywords.mockResolvedValue(
        popularKeywords,
      );

      const result = await keywordAnalyticsService.getPopularKeywords(
        "takealot",
        5,
      );

      expect(result).toEqual(popularKeywords);
      expect(
        mockKeywordAnalyticsRepository.findPopularKeywords,
      ).toHaveBeenCalledWith("takealot", 5);
    });
  });

  describe("getTrendingKeywords", () => {
    it("should return trending keywords for a marketplace", async () => {
      const trendingKeywords = [
        {
          id: "analytics123",
          keyword: "smartphone",
          marketplace: "takealot",
          trendPrediction: {
            predictedGrowth: 15,
          },
        },
        {
          id: "analytics124",
          keyword: "laptop",
          marketplace: "takealot",
          trendPrediction: {
            predictedGrowth: 10,
          },
        },
      ];

      mockKeywordAnalyticsRepository.findTrendingKeywords.mockResolvedValue(
        trendingKeywords,
      );

      const result = await keywordAnalyticsService.getTrendingKeywords(
        "takealot",
        5,
      );

      expect(result).toEqual(trendingKeywords);
      expect(
        mockKeywordAnalyticsRepository.findTrendingKeywords,
      ).toHaveBeenCalledWith("takealot", 5);
    });
  });

  describe("getSeasonalKeywordsForUpcomingMonth", () => {
    it("should return seasonal keywords for a marketplace", async () => {
      const seasonalKeywords = [
        {
          id: "analytics123",
          keyword: "christmas gifts",
          marketplace: "takealot",
          seasonalityData: {
            peakMonths: ["December"],
            peakScore: 90,
          },
        },
        {
          id: "analytics124",
          keyword: "back to school",
          marketplace: "takealot",
          seasonalityData: {
            peakMonths: ["January"],
            peakScore: 85,
          },
        },
      ];

      mockKeywordAnalyticsRepository.findSeasonalKeywords.mockResolvedValue(
        seasonalKeywords,
      );

      const result =
        await keywordAnalyticsService.getSeasonalKeywordsForUpcomingMonth(
          "takealot",
          5,
        );

      expect(result).toEqual(seasonalKeywords);
      expect(
        mockKeywordAnalyticsRepository.findSeasonalKeywords,
      ).toHaveBeenCalledWith("takealot", 5);
    });
  });

  // Additional tests for private methods could be added if needed
});
