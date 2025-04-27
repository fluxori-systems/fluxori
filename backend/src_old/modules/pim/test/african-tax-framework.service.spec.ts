import { Test, TestingModule } from "@nestjs/testing";
import { AfricanTaxFrameworkService } from "../services/african-tax-framework.service";
import { TaxRateService } from "../services/tax-rate.service";
import { TaxRateRepository } from "../repositories/tax-rate.repository";
import {
  TaxRateRequest,
  TaxRateResult,
  TaxJurisdiction,
  TaxType,
} from "../interfaces/tax-rate.interface";

describe("AfricanTaxFrameworkService", () => {
  let service: AfricanTaxFrameworkService;
  let taxRateService: jest.Mocked<TaxRateService>;
  let taxRateRepository: jest.Mocked<TaxRateRepository>;

  beforeEach(async () => {
    const taxRateServiceMock = {
      getCurrentRate: jest.fn(),
      getRateAtDate: jest.fn(),
      getAllRatesForJurisdiction: jest.fn(),
      getRateChanges: jest.fn(),
      isExempt: jest.fn(),
      createTaxRateSchedule: jest.fn(),
      updateTaxRateSchedule: jest.fn(),
      deleteTaxRateSchedule: jest.fn(),
      getSpecialRateProductTypes: jest.fn(),
    };

    const taxRateRepositoryMock = {
      findAllRatesForJurisdiction: jest.fn(),
      findRateChanges: jest.fn(),
      findSpecialRatesByJurisdiction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AfricanTaxFrameworkService,
        { provide: TaxRateService, useValue: taxRateServiceMock },
        { provide: TaxRateRepository, useValue: taxRateRepositoryMock },
      ],
    }).compile();

    service = module.get<AfricanTaxFrameworkService>(
      AfricanTaxFrameworkService,
    );
    taxRateService = module.get(TaxRateService) as jest.Mocked<TaxRateService>;
    taxRateRepository = module.get(
      TaxRateRepository,
    ) as jest.Mocked<TaxRateRepository>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getSupportedCountries", () => {
    it("should return a list of supported African countries", () => {
      const countries = service.getSupportedCountries();
      expect(countries).toContain("ZA");
      expect(countries).toContain("NG");
      expect(countries).toContain("KE");
      expect(countries.length).toBeGreaterThan(5);
    });
  });

  describe("getCountryTaxRules", () => {
    it("should return tax rules for South Africa", () => {
      const zaRules = service.getCountryTaxRules("ZA");
      expect(zaRules).toBeDefined();
      expect(zaRules?.country).toBe("ZA");
      expect(zaRules?.defaultTaxType).toBe(TaxType.VAT);
      expect(zaRules?.standardRate).toBe(0.15);
    });

    it("should return tax rules for Nigeria", () => {
      const ngRules = service.getCountryTaxRules("NG");
      expect(ngRules).toBeDefined();
      expect(ngRules?.country).toBe("NG");
      expect(ngRules?.defaultTaxType).toBe(TaxType.VAT);
      expect(ngRules?.standardRate).toBe(0.075);
      expect(ngRules?.hasRegionalRates).toBe(true);
    });

    it("should return undefined for unsupported countries", () => {
      const usRules = service.getCountryTaxRules("US");
      expect(usRules).toBeUndefined();
    });
  });

  describe("isCountrySupported", () => {
    it("should return true for supported countries", () => {
      expect(service.isCountrySupported("ZA")).toBe(true);
      expect(service.isCountrySupported("NG")).toBe(true);
      expect(service.isCountrySupported("KE")).toBe(true);
    });

    it("should return false for unsupported countries", () => {
      expect(service.isCountrySupported("US")).toBe(false);
      expect(service.isCountrySupported("GB")).toBe(false);
      expect(service.isCountrySupported("JP")).toBe(false);
    });
  });

  describe("calculateAfricanTax", () => {
    it("should use central tax service for unsupported countries", async () => {
      const request: TaxRateRequest = {
        country: "US",
        taxType: TaxType.SALES,
      };

      const mockResult: TaxRateResult = {
        rate: 0.08,
        ratePercentage: 8,
        name: "Sales Tax",
        taxType: TaxType.SALES,
        jurisdiction: { country: "US", level: "country" },
        validFrom: new Date(),
        validTo: null,
        scheduleId: "test-id",
        isSpecialRate: false,
      };

      taxRateService.getCurrentRate.mockResolvedValue(mockResult);

      const result = await service.calculateAfricanTax(request);
      expect(taxRateService.getCurrentRate).toHaveBeenCalledWith(request);
      expect(result).toEqual(mockResult);
    });

    it("should apply South African VAT future rates for future dates", async () => {
      const request: TaxRateRequest = {
        country: "ZA",
        taxType: TaxType.VAT,
        transactionDate: new Date("2025-05-15"),
      };

      const mockResult: TaxRateResult = {
        rate: 0.15,
        ratePercentage: 15,
        name: "Standard Rate",
        taxType: TaxType.VAT,
        jurisdiction: { country: "ZA", level: "country" },
        validFrom: new Date("1991-09-30"),
        validTo: null,
        scheduleId: "za-vat-1",
        isSpecialRate: false,
      };

      taxRateService.getCurrentRate.mockResolvedValue(mockResult);

      const result = await service.calculateAfricanTax(request);
      expect(taxRateService.getCurrentRate).toHaveBeenCalledWith(request);
      expect(result.rate).toBe(0.155);
      expect(result.ratePercentage).toBe(15.5);
      expect(result.name).toContain("15.5%");
    });

    it("should handle Ghana VAT with levies", async () => {
      const request: TaxRateRequest = {
        country: "GH",
        taxType: TaxType.VAT,
      };

      const mockResult: TaxRateResult = {
        rate: 0.125,
        ratePercentage: 12.5,
        name: "Standard Rate",
        taxType: TaxType.VAT,
        jurisdiction: { country: "GH", level: "country" },
        validFrom: new Date("1998-01-01"),
        validTo: null,
        scheduleId: "gh-vat-1",
        isSpecialRate: false,
      };

      taxRateService.getCurrentRate.mockResolvedValue(mockResult);

      const result = await service.calculateAfricanTax(request);
      expect(taxRateService.getCurrentRate).toHaveBeenCalledWith(request);
      expect(result.rate).toBe(0.175); // 12.5% VAT + 5% levies
      expect(result.name).toBe("VAT + Levies");
      expect(result.description).toContain("NHIL");
      expect(result.description).toContain("GETFund");
    });

    it("should handle Kenya digital services tax", async () => {
      const request: TaxRateRequest = {
        country: "KE",
        taxType: TaxType.VAT,
        context: { isDigitalService: true },
      };

      const mockResult: TaxRateResult = {
        rate: 0.16,
        ratePercentage: 16,
        name: "Standard Rate",
        taxType: TaxType.VAT,
        jurisdiction: { country: "KE", level: "country" },
        validFrom: new Date("1990-01-01"),
        validTo: null,
        scheduleId: "ke-vat-1",
        isSpecialRate: false,
      };

      taxRateService.getCurrentRate.mockResolvedValue(mockResult);

      const result = await service.calculateAfricanTax(request);
      expect(taxRateService.getCurrentRate).toHaveBeenCalledWith(request);
      expect(result.rate).toBe(0.015); // 1.5% digital services tax
      expect(result.name).toBe("Digital Services Tax");
    });

    it("should handle Nigeria regional taxes", async () => {
      const request: TaxRateRequest = {
        country: "NG",
        region: "Lagos",
        taxType: TaxType.VAT,
      };

      const mockResult: TaxRateResult = {
        rate: 0.075,
        ratePercentage: 7.5,
        name: "Federal VAT",
        taxType: TaxType.VAT,
        jurisdiction: { country: "NG", level: "country" },
        validFrom: new Date("1994-01-01"),
        validTo: null,
        scheduleId: "ng-vat-1",
        isSpecialRate: false,
      };

      taxRateService.getCurrentRate.mockResolvedValue(mockResult);

      const regionalRate = {
        id: "lagos-vat-1",
        jurisdiction: {
          country: "NG",
          region: "Lagos",
          level: "province" as const,
        },
        taxType: TaxType.VAT,
        rate: 0.025,
        name: "Lagos State VAT",
        validFrom: new Date("2020-01-01"),
        validTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      taxRateRepository.findAllRatesForJurisdiction.mockResolvedValue([
        regionalRate,
      ]);

      const result = await service.calculateAfricanTax(request);
      expect(taxRateService.getCurrentRate).toHaveBeenCalledWith(request);
      expect(taxRateRepository.findAllRatesForJurisdiction).toHaveBeenCalled();
      expect(result.rate).toBe(0.1); // 7.5% federal + 2.5% state
      expect(result.name).toContain("Combined");
    });
  });

  describe("isProductTaxExempt", () => {
    it("should check base tax service for unsupported countries", async () => {
      const request: TaxRateRequest = {
        country: "US",
        taxType: TaxType.SALES,
      };

      taxRateService.isExempt.mockResolvedValue(false);

      const result = await service.isProductTaxExempt(request);
      expect(taxRateService.isExempt).toHaveBeenCalledWith(request);
      expect(result.exempt).toBe(false);
    });

    it("should identify South African zero-rated foodstuffs", async () => {
      const request: TaxRateRequest = {
        country: "ZA",
        taxType: TaxType.VAT,
        productType: "BasicFoodstuffs",
      };

      taxRateService.isExempt.mockResolvedValue(false);

      const result = await service.isProductTaxExempt(request);
      expect(taxRateService.isExempt).toHaveBeenCalledWith(request);
      expect(result.exempt).toBe(true);
      expect(result.reason).toContain("zero-rated");
      expect(result.exemptionCategory).toBe("Zero-Rated Foodstuffs");
    });

    it("should identify exported goods as exempt", async () => {
      const request: TaxRateRequest = {
        country: "ZA",
        taxType: TaxType.VAT,
        context: { isExport: true },
      };

      taxRateService.isExempt.mockResolvedValue(false);

      const result = await service.isProductTaxExempt(request);
      expect(taxRateService.isExempt).toHaveBeenCalledWith(request);
      expect(result.exempt).toBe(true);
      expect(result.exemptionCategory).toBe("Export");
    });
  });

  describe("getUpcomingRateChanges", () => {
    it("should return empty array for unsupported countries", async () => {
      const result = await service.getUpcomingRateChanges("US");
      expect(result).toEqual([]);
    });

    it("should return South African upcoming VAT increases", async () => {
      const mockCurrentRate: TaxRateResult = {
        rate: 0.15,
        ratePercentage: 15,
        name: "Standard Rate",
        taxType: TaxType.VAT,
        jurisdiction: { country: "ZA", level: "country" },
        validFrom: new Date("2018-04-01"),
        validTo: null,
        scheduleId: "za-vat-1",
        isSpecialRate: false,
      };

      taxRateService.getCurrentRate.mockResolvedValue(mockCurrentRate);
      taxRateRepository.findRateChanges.mockResolvedValue([]);

      const result = await service.getUpcomingRateChanges("ZA");
      expect(result.length).toBe(2);
      expect(result[0].oldRate).toBe(0.15);
      expect(result[0].newRate).toBe(0.155);
      expect(result[0].taxType).toBe("VAT");
      expect(result[1].oldRate).toBe(0.155);
      expect(result[1].newRate).toBe(0.16);
    });

    it("should handle database values as priority", async () => {
      const mockCurrentRate: TaxRateResult = {
        rate: 0.15,
        ratePercentage: 15,
        name: "Standard Rate",
        taxType: TaxType.VAT,
        jurisdiction: { country: "ZA", level: "country" },
        validFrom: new Date("2018-04-01"),
        validTo: null,
        scheduleId: "za-vat-1",
        isSpecialRate: false,
      };

      const futureRate = {
        id: "za-vat-2",
        jurisdiction: { country: "ZA", level: "country" as const },
        taxType: TaxType.VAT,
        rate: 0.155,
        name: "VAT Increase 2025",
        validFrom: new Date("2025-05-01"),
        validTo: null,
        description: "South African VAT increase to 15.5%",
        legalReference: "Budget 2025",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      taxRateService.getCurrentRate.mockResolvedValue(mockCurrentRate);
      taxRateRepository.findRateChanges.mockResolvedValue([futureRate]);

      const result = await service.getUpcomingRateChanges("ZA");
      expect(result.length).toBe(1);
      expect(result[0].oldRate).toBe(0.15);
      expect(result[0].newRate).toBe(0.155);
      expect(result[0].taxType).toBe(TaxType.VAT);
      expect(result[0].description).toBe("South African VAT increase to 15.5%");
      expect(result[0].legalReference).toBe("Budget 2025");
    });
  });

  describe("getSpecialProductTaxCategories", () => {
    it("should return empty array for unsupported countries", async () => {
      const result = await service.getSpecialProductTaxCategories("US");
      expect(result).toEqual([]);
    });

    it("should return hardcoded SA exemptions if not in database", async () => {
      taxRateRepository.findSpecialRatesByJurisdiction.mockResolvedValue([]);

      const result = await service.getSpecialProductTaxCategories("ZA");
      expect(result.length).toBe(3);
      expect(result[0].productType).toBe("BasicFoodstuffs");
      expect(result[0].rate).toBe(0);
      expect(result[0].category).toBe("Zero-Rated");
    });

    it("should return database exemptions when available", async () => {
      const specialRates = [
        {
          id: "za-spec-1",
          jurisdiction: { country: "ZA", level: "country" as const },
          taxType: TaxType.VAT,
          rate: 0,
          name: "Zero-Rated Books",
          validFrom: new Date("2020-01-01"),
          validTo: null,
          metadata: {
            isSpecialRate: true,
            productType: "EducationalBooks",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "za-spec-2",
          jurisdiction: { country: "ZA", level: "country" as const },
          taxType: TaxType.VAT,
          rate: 0,
          name: "Zero-Rated Medical",
          validFrom: new Date("2020-01-01"),
          validTo: null,
          metadata: {
            isSpecialRate: true,
            productType: "MedicalSupplies",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      taxRateRepository.findSpecialRatesByJurisdiction.mockResolvedValue(
        specialRates,
      );

      const result = await service.getSpecialProductTaxCategories("ZA");
      expect(result.length).toBe(2);
      expect(result[0].productType).toBe("EducationalBooks");
      expect(result[0].category).toBe("Zero-Rated Books");
      expect(result[1].productType).toBe("MedicalSupplies");
    });
  });
});
