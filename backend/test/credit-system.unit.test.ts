import { Test } from "@nestjs/testing";
import { CreditSystemService } from "../src/modules/credit-system/services/credit-system.service";
import { TokenTrackingService } from "../src/modules/credit-system/services/token-tracking.service";
import {
  CreditAllocationRepository,
  CreditTransactionRepository,
  CreditReservationRepository,
  CreditUsageLogRepository,
  CreditPricingTierRepository,
} from "../src/modules/credit-system/repositories";
import {
  CreditUsageType,
  CreditModelType,
  CreditCheckRequest,
  CreditUsageRequest,
} from "../src/modules/credit-system/interfaces/types";

// Mock repositories
const mockCreditAllocationRepository = {
  findActiveByOrganization: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  incrementCredits: jest.fn(),
  decrementCredits: jest.fn(),
};

const mockCreditTransactionRepository = {
  create: jest.fn(),
  findByOrganization: jest.fn(),
  findRecentByOrganization: jest.fn(),
};

const mockCreditReservationRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn(),
  findByOrganizationAndStatus: jest.fn(),
  findByOperationId: jest.fn(),
};

const mockCreditUsageLogRepository = {
  create: jest.fn(),
  findByOrganization: jest.fn(),
  findByResourceId: jest.fn(),
};

const mockCreditPricingTierRepository = {
  findActiveByModel: jest.fn(),
  findAll: jest.fn(),
};

describe("CreditSystemService", () => {
  let creditSystemService: CreditSystemService;
  let tokenTrackingService: TokenTrackingService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreditSystemService,
        TokenTrackingService,
        {
          provide: CreditAllocationRepository,
          useValue: mockCreditAllocationRepository,
        },
        {
          provide: CreditTransactionRepository,
          useValue: mockCreditTransactionRepository,
        },
        {
          provide: CreditReservationRepository,
          useValue: mockCreditReservationRepository,
        },
        {
          provide: CreditUsageLogRepository,
          useValue: mockCreditUsageLogRepository,
        },
        {
          provide: CreditPricingTierRepository,
          useValue: mockCreditPricingTierRepository,
        },
      ],
    }).compile();

    creditSystemService =
      moduleRef.get<CreditSystemService>(CreditSystemService);
    tokenTrackingService =
      moduleRef.get<TokenTrackingService>(TokenTrackingService);
  });

  describe("checkCredits", () => {
    it("should return false if no active allocation is found", async () => {
      // Setup mock to return no allocations
      mockCreditAllocationRepository.findActiveByOrganization.mockResolvedValue(
        [],
      );

      const request: CreditCheckRequest = {
        organizationId: "org123",
        userId: "user456",
        expectedInputTokens: 100,
        expectedOutputTokens: 20,
        modelId: "gpt-4",
        usageType: CreditUsageType.MODEL_CALL,
      };

      const result = await creditSystemService.checkCredits(request);

      expect(result.hasCredits).toBe(false);
      expect(result.availableCredits).toBe(0);
      expect(result.reason).toContain("No active credit allocation");
      expect(
        mockCreditAllocationRepository.findActiveByOrganization,
      ).toHaveBeenCalledWith("org123");
    });

    it("should return true if sufficient credits are available", async () => {
      // Setup mock to return allocation with sufficient credits
      mockCreditAllocationRepository.findActiveByOrganization.mockResolvedValue(
        [
          {
            id: "alloc123",
            organizationId: "org123",
            modelType: CreditModelType.SUBSCRIPTION,
            totalCredits: 1000,
            remainingCredits: 500,
            isActive: true,
          },
        ],
      );

      // Setup pricing tier mock
      mockCreditPricingTierRepository.findActiveByModel.mockResolvedValue({
        modelId: "gpt-4",
        modelProvider: "openai",
        displayName: "GPT-4",
        inputTokenCost: 0.03, // Cost per 1000 tokens
        outputTokenCost: 0.06, // Cost per 1000 tokens
        isActive: true,
      });

      const request: CreditCheckRequest = {
        organizationId: "org123",
        userId: "user456",
        expectedInputTokens: 100,
        expectedOutputTokens: 20,
        modelId: "gpt-4",
        usageType: CreditUsageType.MODEL_CALL,
      };

      const result = await creditSystemService.checkCredits(request);

      expect(result.hasCredits).toBe(true);
      expect(result.availableCredits).toBe(500);
      expect(result.estimatedCost).toBeDefined();
      expect(
        mockCreditAllocationRepository.findActiveByOrganization,
      ).toHaveBeenCalledWith("org123");
      expect(
        mockCreditPricingTierRepository.findActiveByModel,
      ).toHaveBeenCalledWith("gpt-4");
    });

    it("should return false if insufficient credits are available", async () => {
      // Setup mock to return allocation with insufficient credits
      mockCreditAllocationRepository.findActiveByOrganization.mockResolvedValue(
        [
          {
            id: "alloc123",
            organizationId: "org123",
            modelType: CreditModelType.SUBSCRIPTION,
            totalCredits: 1000,
            remainingCredits: 1,
            isActive: true,
          },
        ],
      );

      // Setup pricing tier mock
      mockCreditPricingTierRepository.findActiveByModel.mockResolvedValue({
        modelId: "gpt-4",
        modelProvider: "openai",
        displayName: "GPT-4",
        inputTokenCost: 0.03, // Cost per 1000 tokens
        outputTokenCost: 0.06, // Cost per 1000 tokens
        isActive: true,
      });

      const request: CreditCheckRequest = {
        organizationId: "org123",
        userId: "user456",
        expectedInputTokens: 1000,
        expectedOutputTokens: 500,
        modelId: "gpt-4",
        usageType: CreditUsageType.MODEL_CALL,
      };

      const result = await creditSystemService.checkCredits(request);

      expect(result.hasCredits).toBe(false);
      expect(result.availableCredits).toBe(1);
      expect(result.estimatedCost).toBeGreaterThan(1);
      expect(result.reason).toContain("Insufficient credits");
    });
  });

  describe("checkAndReserveCredits", () => {
    it("should reserve credits if sufficient credits are available", async () => {
      // Setup mock to return allocation with sufficient credits
      mockCreditAllocationRepository.findActiveByOrganization.mockResolvedValue(
        [
          {
            id: "alloc123",
            organizationId: "org123",
            modelType: CreditModelType.SUBSCRIPTION,
            totalCredits: 1000,
            remainingCredits: 500,
            isActive: true,
          },
        ],
      );

      // Setup pricing tier mock
      mockCreditPricingTierRepository.findActiveByModel.mockResolvedValue({
        modelId: "gpt-4",
        modelProvider: "openai",
        displayName: "GPT-4",
        inputTokenCost: 0.03, // Cost per 1000 tokens
        outputTokenCost: 0.06, // Cost per 1000 tokens
        isActive: true,
      });

      // Setup reservation mock
      mockCreditReservationRepository.create.mockResolvedValue("res123");

      const request: CreditCheckRequest = {
        organizationId: "org123",
        userId: "user456",
        expectedInputTokens: 100,
        expectedOutputTokens: 20,
        modelId: "gpt-4",
        usageType: CreditUsageType.MODEL_CALL,
        operationId: "op123",
      };

      const result = await creditSystemService.checkAndReserveCredits(request);

      expect(result.hasCredits).toBe(true);
      expect(result.reservationId).toBe("res123");
      expect(mockCreditReservationRepository.create).toHaveBeenCalled();
      expect(
        mockCreditAllocationRepository.decrementCredits,
      ).toHaveBeenCalled();
    });

    it("should not reserve credits if insufficient credits are available", async () => {
      // Setup mock to return allocation with insufficient credits
      mockCreditAllocationRepository.findActiveByOrganization.mockResolvedValue(
        [
          {
            id: "alloc123",
            organizationId: "org123",
            modelType: CreditModelType.SUBSCRIPTION,
            totalCredits: 1000,
            remainingCredits: 1,
            isActive: true,
          },
        ],
      );

      // Setup pricing tier mock
      mockCreditPricingTierRepository.findActiveByModel.mockResolvedValue({
        modelId: "gpt-4",
        modelProvider: "openai",
        displayName: "GPT-4",
        inputTokenCost: 0.03, // Cost per 1000 tokens
        outputTokenCost: 0.06, // Cost per 1000 tokens
        isActive: true,
      });

      const request: CreditCheckRequest = {
        organizationId: "org123",
        userId: "user456",
        expectedInputTokens: 1000,
        expectedOutputTokens: 500,
        modelId: "gpt-4",
        usageType: CreditUsageType.MODEL_CALL,
      };

      const result = await creditSystemService.checkAndReserveCredits(request);

      expect(result.hasCredits).toBe(false);
      expect(result.reservationId).toBeUndefined();
      expect(mockCreditReservationRepository.create).not.toHaveBeenCalled();
      expect(
        mockCreditAllocationRepository.decrementCredits,
      ).not.toHaveBeenCalled();
    });
  });

  describe("recordUsage", () => {
    it("should record usage and create transaction when reservation exists", async () => {
      // Setup reservation mock
      mockCreditReservationRepository.findById.mockResolvedValue({
        id: "res123",
        organizationId: "org123",
        userId: "user456",
        operationId: "op123",
        reservationAmount: 5,
        usageType: CreditUsageType.MODEL_CALL,
        status: "pending",
      });

      // Setup allocation mock
      mockCreditAllocationRepository.findActiveByOrganization.mockResolvedValue(
        [
          {
            id: "alloc123",
            organizationId: "org123",
            modelType: CreditModelType.SUBSCRIPTION,
            totalCredits: 1000,
            remainingCredits: 500,
            isActive: true,
          },
        ],
      );

      const request: CreditUsageRequest = {
        organizationId: "org123",
        userId: "user456",
        usageType: CreditUsageType.MODEL_CALL,
        modelId: "gpt-4",
        modelProvider: "openai",
        inputTokens: 100,
        outputTokens: 20,
        reservationId: "res123",
        success: true,
      };

      await creditSystemService.recordUsage(request);

      expect(mockCreditReservationRepository.updateStatus).toHaveBeenCalledWith(
        "res123",
        "confirmed",
      );
      expect(mockCreditUsageLogRepository.create).toHaveBeenCalled();
      expect(mockCreditTransactionRepository.create).toHaveBeenCalled();
    });

    it("should calculate and deduct credits when no reservation exists", async () => {
      // Setup allocation mock
      mockCreditAllocationRepository.findActiveByOrganization.mockResolvedValue(
        [
          {
            id: "alloc123",
            organizationId: "org123",
            modelType: CreditModelType.SUBSCRIPTION,
            totalCredits: 1000,
            remainingCredits: 500,
            isActive: true,
          },
        ],
      );

      // Setup pricing tier mock
      mockCreditPricingTierRepository.findActiveByModel.mockResolvedValue({
        modelId: "gpt-4",
        modelProvider: "openai",
        displayName: "GPT-4",
        inputTokenCost: 0.03, // Cost per 1000 tokens
        outputTokenCost: 0.06, // Cost per 1000 tokens
        isActive: true,
      });

      const request: CreditUsageRequest = {
        organizationId: "org123",
        userId: "user456",
        usageType: CreditUsageType.MODEL_CALL,
        modelId: "gpt-4",
        modelProvider: "openai",
        inputTokens: 100,
        outputTokens: 20,
        success: true,
      };

      await creditSystemService.recordUsage(request);

      expect(mockCreditUsageLogRepository.create).toHaveBeenCalled();
      expect(mockCreditTransactionRepository.create).toHaveBeenCalled();
      expect(
        mockCreditAllocationRepository.decrementCredits,
      ).toHaveBeenCalled();
    });
  });

  describe("confirmCreditReservation", () => {
    it("should confirm a credit reservation", async () => {
      // Setup reservation mock
      mockCreditReservationRepository.findById.mockResolvedValue({
        id: "res123",
        organizationId: "org123",
        userId: "user456",
        operationId: "op123",
        reservationAmount: 5,
        usageType: CreditUsageType.MODEL_CALL,
        status: "pending",
      });

      await creditSystemService.confirmCreditReservation("res123");

      expect(mockCreditReservationRepository.updateStatus).toHaveBeenCalledWith(
        "res123",
        "confirmed",
      );
    });

    it("should throw error if reservation not found", async () => {
      // Setup reservation mock to return null
      mockCreditReservationRepository.findById.mockResolvedValue(null);

      await expect(
        creditSystemService.confirmCreditReservation("res123"),
      ).rejects.toThrow("Reservation not found");
    });

    it("should throw error if reservation already confirmed", async () => {
      // Setup reservation mock to return already confirmed
      mockCreditReservationRepository.findById.mockResolvedValue({
        id: "res123",
        organizationId: "org123",
        userId: "user456",
        operationId: "op123",
        reservationAmount: 5,
        usageType: CreditUsageType.MODEL_CALL,
        status: "confirmed",
      });

      await expect(
        creditSystemService.confirmCreditReservation("res123"),
      ).rejects.toThrow("Reservation already confirmed");
    });
  });

  describe("releaseCreditReservation", () => {
    it("should release a credit reservation", async () => {
      // Setup reservation mock
      mockCreditReservationRepository.findById.mockResolvedValue({
        id: "res123",
        organizationId: "org123",
        userId: "user456",
        operationId: "op123",
        reservationAmount: 5,
        usageType: CreditUsageType.MODEL_CALL,
        status: "pending",
      });

      // Setup allocation mock
      mockCreditAllocationRepository.findActiveByOrganization.mockResolvedValue(
        [
          {
            id: "alloc123",
            organizationId: "org123",
            modelType: CreditModelType.SUBSCRIPTION,
            totalCredits: 1000,
            remainingCredits: 500,
            isActive: true,
          },
        ],
      );

      await creditSystemService.releaseCreditReservation("res123");

      expect(mockCreditReservationRepository.updateStatus).toHaveBeenCalledWith(
        "res123",
        "released",
      );
      expect(
        mockCreditAllocationRepository.incrementCredits,
      ).toHaveBeenCalled();
    });

    it("should throw error if reservation not found", async () => {
      // Setup reservation mock to return null
      mockCreditReservationRepository.findById.mockResolvedValue(null);

      await expect(
        creditSystemService.releaseCreditReservation("res123"),
      ).rejects.toThrow("Reservation not found");
    });
  });

  describe("addCredits", () => {
    it("should add credits to an existing allocation", async () => {
      // Setup allocation mock
      mockCreditAllocationRepository.findActiveByOrganization.mockResolvedValue(
        [
          {
            id: "alloc123",
            organizationId: "org123",
            modelType: CreditModelType.SUBSCRIPTION,
            totalCredits: 1000,
            remainingCredits: 500,
            isActive: true,
          },
        ],
      );

      await creditSystemService.addCredits(
        "org123",
        100,
        CreditModelType.SUBSCRIPTION,
      );

      expect(
        mockCreditAllocationRepository.incrementCredits,
      ).toHaveBeenCalledWith("alloc123", 100, expect.any(Object));
      expect(mockCreditTransactionRepository.create).toHaveBeenCalled();
    });

    it("should create a new allocation if none exists", async () => {
      // Setup allocation mock to return no allocations
      mockCreditAllocationRepository.findActiveByOrganization.mockResolvedValue(
        [],
      );

      // Setup create allocation mock
      mockCreditAllocationRepository.create.mockResolvedValue("alloc123");

      await creditSystemService.addCredits(
        "org123",
        100,
        CreditModelType.SUBSCRIPTION,
      );

      expect(mockCreditAllocationRepository.create).toHaveBeenCalled();
      expect(mockCreditTransactionRepository.create).toHaveBeenCalled();
    });
  });
});

describe("TokenTrackingService", () => {
  let tokenTrackingService: TokenTrackingService;
  let creditSystemService: CreditSystemService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreditSystemService,
        TokenTrackingService,
        {
          provide: CreditAllocationRepository,
          useValue: mockCreditAllocationRepository,
        },
        {
          provide: CreditTransactionRepository,
          useValue: mockCreditTransactionRepository,
        },
        {
          provide: CreditReservationRepository,
          useValue: mockCreditReservationRepository,
        },
        {
          provide: CreditUsageLogRepository,
          useValue: mockCreditUsageLogRepository,
        },
        {
          provide: CreditPricingTierRepository,
          useValue: mockCreditPricingTierRepository,
        },
      ],
    }).compile();

    tokenTrackingService =
      moduleRef.get<TokenTrackingService>(TokenTrackingService);
    creditSystemService =
      moduleRef.get<CreditSystemService>(CreditSystemService);
  });

  describe("estimateTokens", () => {
    it("should estimate tokens for a text input", () => {
      const result = tokenTrackingService.estimateTokens(
        "This is a test text.",
      );

      expect(result).toBeGreaterThan(0);
    });
  });

  describe("optimizeModelSelection", () => {
    it("should select a model based on requirements", async () => {
      // Setup pricing tier mock to return multiple models
      mockCreditPricingTierRepository.findAll.mockResolvedValue([
        {
          modelId: "gpt-3.5-turbo",
          modelProvider: "openai",
          displayName: "GPT-3.5 Turbo",
          inputTokenCost: 0.0015, // Cost per 1000 tokens
          outputTokenCost: 0.002, // Cost per 1000 tokens
          isActive: true,
        },
        {
          modelId: "gpt-4",
          modelProvider: "openai",
          displayName: "GPT-4",
          inputTokenCost: 0.03, // Cost per 1000 tokens
          outputTokenCost: 0.06, // Cost per 1000 tokens
          isActive: true,
        },
      ]);

      // Mock credit check
      jest.spyOn(creditSystemService, "checkCredits").mockResolvedValue({
        hasCredits: true,
        availableCredits: 500,
        estimatedCost: 1,
      });

      const result = await tokenTrackingService.optimizeModelSelection(
        "org123",
        "This is a test prompt.",
        "standard",
      );

      expect(result.model).toBeDefined();
      expect(mockCreditPricingTierRepository.findAll).toHaveBeenCalled();
    });

    it("should return null if no suitable model is found", async () => {
      // Setup pricing tier mock to return no models
      mockCreditPricingTierRepository.findAll.mockResolvedValue([]);

      const result = await tokenTrackingService.optimizeModelSelection(
        "org123",
        "This is a test prompt.",
        "standard",
      );

      expect(result.model).toBeNull();
      expect(result.reason).toContain("No suitable model found");
    });
  });
});
