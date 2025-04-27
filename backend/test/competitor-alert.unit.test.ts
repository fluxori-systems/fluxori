import { Test } from "@nestjs/testing";
import { CompetitorAlertService } from "../src/modules/credit-system/services/competitor-alert.service";
import { CreditSystemService } from "../src/modules/credit-system/services/credit-system.service";
import {
  CompetitorWatchRepository,
  CompetitorAlertRepository,
} from "../src/modules/credit-system/repositories/competitor-alert.repository";
import {
  CompetitorWatch,
  CompetitorAlert,
  CompetitorAlertType,
  KeywordResearchResult,
  KeywordRankingData,
} from "../src/modules/credit-system/interfaces/types";

// Mock repositories
const mockCompetitorWatchRepository = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  findByOrganization: jest.fn(),
  findByUser: jest.fn(),
  findByKeyword: jest.fn(),
  findActiveWatches: jest.fn(),
  updateNextCheckAt: jest.fn(),
};

const mockCompetitorAlertRepository = {
  create: jest.fn(),
  findByOrganization: jest.fn(),
  findByUser: jest.fn(),
  findNewAlerts: jest.fn(),
  findByStatus: jest.fn(),
  findByImportance: jest.fn(),
  updateStatus: jest.fn(),
  markAsSent: jest.fn(),
};

const mockCreditSystemService = {
  checkAndReserveCredits: jest.fn(),
  confirmCreditReservation: jest.fn(),
  recordCreditUsage: jest.fn(),
};

describe("CompetitorAlertService", () => {
  let competitorAlertService: CompetitorAlertService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CompetitorAlertService,
        {
          provide: CompetitorWatchRepository,
          useValue: mockCompetitorWatchRepository,
        },
        {
          provide: CompetitorAlertRepository,
          useValue: mockCompetitorAlertRepository,
        },
        { provide: CreditSystemService, useValue: mockCreditSystemService },
      ],
    }).compile();

    competitorAlertService = moduleRef.get<CompetitorAlertService>(
      CompetitorAlertService,
    );
  });

  describe("createWatch", () => {
    it("should create a competitor watch", async () => {
      // Setup mock for competitor watch creation
      mockCompetitorWatchRepository.create.mockResolvedValue("watch123");
      mockCompetitorWatchRepository.findById.mockResolvedValue({
        id: "watch123",
        organizationId: "org123",
        userId: "user456",
        keyword: "smartphone",
        marketplaces: ["takealot"],
        alertTypes: [
          CompetitorAlertType.PRICE_CHANGE,
          CompetitorAlertType.RANKING_CHANGE,
        ],
        thresholds: {
          priceChangePercent: 5,
          rankingChangePositions: 3,
        },
        frequency: "daily",
        notificationChannels: ["email"],
        isActive: true,
        lastCheckedAt: new Date(),
        nextCheckAt: new Date(),
        createdAt: new Date(),
        creditCost: 10,
      });

      const watchData = {
        organizationId: "org123",
        userId: "user456",
        keyword: "smartphone",
        marketplaces: ["takealot"],
        alertTypes: [
          CompetitorAlertType.PRICE_CHANGE,
          CompetitorAlertType.RANKING_CHANGE,
        ],
        thresholds: {
          priceChangePercent: 5,
          rankingChangePositions: 3,
        },
        frequency: "daily",
        notificationChannels: ["email"],
        isActive: true,
        creditCost: 10,
        creditReservationId: "res123",
      };

      const result = await competitorAlertService.createWatch(watchData);

      expect(result).toBeDefined();
      expect(result.id).toBe("watch123");
      expect(mockCompetitorWatchRepository.create).toHaveBeenCalled();
      expect(
        mockCreditSystemService.confirmCreditReservation,
      ).toHaveBeenCalledWith("res123");
    });

    it("should throw error if credit reservation is not provided", async () => {
      const watchData = {
        organizationId: "org123",
        userId: "user456",
        keyword: "smartphone",
        marketplaces: ["takealot"],
        alertTypes: [CompetitorAlertType.PRICE_CHANGE],
        thresholds: {
          priceChangePercent: 5,
        },
        frequency: "daily",
        notificationChannels: ["email"],
        isActive: true,
        creditCost: 10,
      };

      await expect(
        competitorAlertService.createWatch(watchData),
      ).rejects.toThrow("Credit reservation is required");
    });
  });

  describe("updateWatch", () => {
    it("should update a competitor watch", async () => {
      // Setup mock for watch update
      mockCompetitorWatchRepository.update.mockResolvedValue(undefined);
      mockCompetitorWatchRepository.findById.mockResolvedValue({
        id: "watch123",
        organizationId: "org123",
        userId: "user456",
        keyword: "smartphone",
        marketplaces: ["takealot"],
        alertTypes: [CompetitorAlertType.PRICE_CHANGE],
        thresholds: {
          priceChangePercent: 10, // Updated value
        },
        frequency: "daily",
        notificationChannels: ["email"],
        isActive: true,
        lastCheckedAt: new Date(),
        nextCheckAt: new Date(),
        createdAt: new Date(),
        creditCost: 10,
      });

      const updateData = {
        thresholds: {
          priceChangePercent: 10,
        },
        isActive: true,
      };

      const result = await competitorAlertService.updateWatch(
        "watch123",
        updateData,
      );

      expect(result).toBeDefined();
      expect(result.thresholds.priceChangePercent).toBe(10);
      expect(mockCompetitorWatchRepository.update).toHaveBeenCalled();
    });
  });

  describe("deleteWatch", () => {
    it("should delete a competitor watch", async () => {
      // Setup mock for watch delete
      mockCompetitorWatchRepository.delete.mockResolvedValue(undefined);

      await competitorAlertService.deleteWatch("watch123");

      expect(mockCompetitorWatchRepository.delete).toHaveBeenCalledWith(
        "watch123",
      );
    });
  });

  describe("getWatchesByOrganization", () => {
    it("should return watches for an organization", async () => {
      // Setup mock for finding watches by organization
      mockCompetitorWatchRepository.findByOrganization.mockResolvedValue([
        {
          id: "watch123",
          organizationId: "org123",
          userId: "user456",
          keyword: "smartphone",
          marketplaces: ["takealot"],
          alertTypes: [CompetitorAlertType.PRICE_CHANGE],
          frequency: "daily",
          isActive: true,
        },
        {
          id: "watch124",
          organizationId: "org123",
          userId: "user789",
          keyword: "laptop",
          marketplaces: ["takealot"],
          alertTypes: [CompetitorAlertType.RANKING_CHANGE],
          frequency: "weekly",
          isActive: true,
        },
      ]);

      const result =
        await competitorAlertService.getWatchesByOrganization("org123");

      expect(result).toHaveLength(2);
      expect(
        mockCompetitorWatchRepository.findByOrganization,
      ).toHaveBeenCalledWith("org123");
    });
  });

  describe("estimateWatchCreditCost", () => {
    it("should calculate cost based on alert types, frequency, and marketplaces", () => {
      const alertTypes = [
        CompetitorAlertType.PRICE_CHANGE,
        CompetitorAlertType.RANKING_CHANGE,
      ];
      const frequency = "daily";
      const marketplaces = ["takealot", "makro"];

      const result = competitorAlertService.estimateWatchCreditCost(
        alertTypes,
        frequency,
        marketplaces,
      );

      // Expected cost calculation:
      // Base cost (daily) = 10
      // Alert type cost = 2 types * 2 = 4
      // Marketplace cost = 2 marketplaces * 3 = 6
      // Total = 10 + 4 + 6 = 20
      expect(result).toBe(20);

      // Test different frequency
      const hourlyResult = competitorAlertService.estimateWatchCreditCost(
        alertTypes,
        "hourly",
        marketplaces,
      );
      expect(hourlyResult).toBe(35); // 25 (hourly base) + 4 + 6 = 35
    });
  });

  describe("processKeywordResult", () => {
    it("should process a keyword result and check for alerts", async () => {
      // Setup mocks
      mockCompetitorWatchRepository.findByKeyword.mockResolvedValue([
        {
          id: "watch123",
          organizationId: "org123",
          userId: "user456",
          keyword: "smartphone",
          marketplaces: ["takealot"],
          alertTypes: [CompetitorAlertType.PRICE_CHANGE],
          thresholds: {
            priceChangePercent: 5,
          },
          frequency: "daily",
          notificationChannels: ["email"],
          isActive: true,
        },
      ]);

      // Create mock keyword research results
      const currentResult: KeywordResearchResult = {
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
        lastUpdated: new Date(),
        resultSource: "fresh",
      };

      const previousResult: KeywordResearchResult = {
        id: "result122",
        requestId: "req122",
        organizationId: "org123",
        keyword: "smartphone",
        marketplace: "takealot",
        rankingData: [
          {
            position: 1,
            productId: "prod123",
            productTitle: "Samsung Galaxy S21",
            productUrl: "https://takealot.com/samsung-galaxy-s21",
            price: 12000, // Lower price in previous result
            currency: "ZAR",
            brand: "Samsung",
          },
        ],
        lastUpdated: new Date(Date.now() - 86400000), // 1 day ago
        resultSource: "fresh",
      };

      // Spy on the private methods
      const checkPriceChangesSpy = jest.spyOn<any, any>(
        competitorAlertService,
        "checkPriceChanges",
      );

      await competitorAlertService.processKeywordResult(
        currentResult,
        previousResult,
      );

      expect(mockCompetitorWatchRepository.findByKeyword).toHaveBeenCalledWith(
        "org123",
        "smartphone",
      );
      expect(checkPriceChangesSpy).toHaveBeenCalled();
    });
  });

  describe("calculateNextCheckTime", () => {
    it("should calculate next check time based on frequency", () => {
      const now = new Date("2023-01-01T12:00:00Z");

      // Test hourly frequency
      const hourlyResult = (
        competitorAlertService as any
      ).calculateNextCheckTime(now, "hourly");
      expect(hourlyResult.getHours()).toBe(13); // 1 hour later

      // Test daily frequency
      const dailyResult = (
        competitorAlertService as any
      ).calculateNextCheckTime(now, "daily");
      expect(dailyResult.getDate()).toBe(2); // Next day

      // Test weekly frequency
      const weeklyResult = (
        competitorAlertService as any
      ).calculateNextCheckTime(now, "weekly");
      expect(weeklyResult.getDate()).toBe(8); // 7 days later
    });
  });
});
