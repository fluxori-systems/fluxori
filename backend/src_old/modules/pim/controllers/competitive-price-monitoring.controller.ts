import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { FirebaseAuthGuard } from "@common/guards";
import { GetUser } from "@common/decorators";
import { CompetitivePriceMonitoringService } from "../services/competitive-price-monitoring.service";
import {
  CompetitorPrice,
  MarketPosition,
  PriceAlert,
  PriceMonitoringConfig,
  PriceSourceType,
  CompetitorPriceReport,
} from "../models/competitor-price.model";
import { User } from "../../../types/google-cloud.types";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";

/**
 * Competitive Price Monitoring Controller
 *
 * Manages competitive price monitoring, tracking, and alerting
 * With specific optimizations for South African e-commerce businesses.
 */
@ApiTags("competitive-price-monitoring")
@Controller("pim/competitive-price-monitoring")
@UseGuards(FirebaseAuthGuard)
export class CompetitivePriceMonitoringController {
  constructor(
    private readonly competitivePriceMonitoringService: CompetitivePriceMonitoringService,
  ) {}

  /**
   * Record a competitor price for a product
   *
   * @param data Competitor price data
   * @param user Authenticated user
   * @returns Recorded competitor price
   */
  @Post("competitor-prices")
  @ApiOperation({ summary: "Record a competitor price for a product" })
  @ApiResponse({
    status: 201,
    description: "Competitor price recorded successfully",
    type: CompetitorPrice,
  })
  @ApiBody({ description: "Competitor price data", type: Object })
  async recordCompetitorPrice(
    @Body()
    data: Omit<
      CompetitorPrice,
      "id" | "createdAt" | "updatedAt" | "organizationId"
    >,
    @GetUser() user: User,
  ): Promise<CompetitorPrice> {
    const organizationId = user.organizationId || "";
    return this.competitivePriceMonitoringService.recordCompetitorPrice(
      data,
      organizationId,
      user.uid,
    );
  }

  /**
   * Record our price for a product
   *
   * @param data Price data
   * @param user Authenticated user
   * @returns Recorded price history
   */
  @Post("our-prices")
  @ApiOperation({ summary: "Record our own price for a product" })
  @ApiResponse({ status: 201, description: "Price recorded successfully" })
  @ApiBody({ description: "Our price data", type: Object })
  async recordOurPrice(
    @Body()
    data: {
      productId: string;
      price: number;
      shipping: number;
      currency: string;
      variantId?: string;
      marketplaceId?: string;
      marketplaceName?: string;
      hasBuyBox?: boolean;
      sourceType?: PriceSourceType;
    },
    @GetUser() user: User,
  ) {
    const organizationId = user.organizationId || "";

    return this.competitivePriceMonitoringService.recordOurPrice(
      data.productId,
      organizationId,
      data.price,
      data.shipping,
      data.currency,
      {
        variantId: data.variantId,
        marketplaceId: data.marketplaceId,
        marketplaceName: data.marketplaceName,
        hasBuyBox: data.hasBuyBox,
        sourceType: data.sourceType,
      },
    );
  }

  /**
   * Get competitor prices for a product
   *
   * @param productId Product ID
   * @param marketplaceId Optional marketplace filter
   * @param includeOutOfStock Whether to include out of stock competitors
   * @param limit Maximum records to return
   * @param offset Starting offset
   * @param user Authenticated user
   * @returns List of competitor prices
   */
  @Get("competitor-prices/:productId")
  @ApiOperation({ summary: "Get competitor prices for a product" })
  @ApiResponse({
    status: 200,
    description: "Competitor prices retrieved successfully",
    type: [CompetitorPrice],
  })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiQuery({
    name: "marketplaceId",
    required: false,
    description: "Filter by marketplace ID",
  })
  @ApiQuery({
    name: "includeOutOfStock",
    required: false,
    description: "Include out of stock competitors",
    type: Boolean,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Maximum number of records to return",
    type: Number,
  })
  @ApiQuery({
    name: "offset",
    required: false,
    description: "Starting offset for pagination",
    type: Number,
  })
  async getCompetitorPrices(
    @Param("productId") productId: string,
    @Query("marketplaceId") marketplaceId?: string,
    @Query("includeOutOfStock") includeOutOfStockStr?: string,
    @Query("limit") limitStr?: string,
    @Query("offset") offsetStr?: string,
    @GetUser() user: User,
  ): Promise<CompetitorPrice[]> {
    const organizationId = user.organizationId || "";
    const includeOutOfStock = includeOutOfStockStr === "true";
    const limit = limitStr ? parseInt(limitStr) : undefined;
    const offset = offsetStr ? parseInt(offsetStr) : undefined;

    return this.competitivePriceMonitoringService.getCompetitorPrices(
      productId,
      organizationId,
      {
        marketplaceId,
        includeOutOfStock,
        limit,
        offset,
      },
    );
  }

  /**
   * Get current market position for a product
   *
   * @param productId Product ID
   * @param marketplaceId Optional marketplace filter
   * @param user Authenticated user
   * @returns Market position data
   */
  @Get("market-position/:productId")
  @ApiOperation({ summary: "Get market position for a product" })
  @ApiResponse({
    status: 200,
    description: "Market position retrieved successfully",
    type: MarketPosition,
  })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiQuery({
    name: "marketplaceId",
    required: false,
    description: "Filter by marketplace ID",
  })
  async getMarketPosition(
    @Param("productId") productId: string,
    @Query("marketplaceId") marketplaceId?: string,
    @GetUser() user: User,
  ): Promise<MarketPosition> {
    const organizationId = user.organizationId || "";

    return this.competitivePriceMonitoringService.getMarketPosition(
      productId,
      organizationId,
      marketplaceId,
    );
  }

  /**
   * Get price history for a product
   *
   * @param productId Product ID
   * @param days Number of days of history
   * @param marketplaceId Optional marketplace filter
   * @param includeCompetitors Whether to include competitor prices
   * @param user Authenticated user
   * @returns Price history data
   */
  @Get("price-history/:productId")
  @ApiOperation({ summary: "Get price history for a product" })
  @ApiResponse({
    status: 200,
    description: "Price history retrieved successfully",
  })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiQuery({
    name: "days",
    required: false,
    description: "Number of days of history",
    type: Number,
  })
  @ApiQuery({
    name: "marketplaceId",
    required: false,
    description: "Filter by marketplace ID",
  })
  @ApiQuery({
    name: "includeCompetitors",
    required: false,
    description: "Include competitor prices",
    type: Boolean,
  })
  async getPriceHistory(
    @Param("productId") productId: string,
    @Query("days") daysStr: string = "30",
    @Query("marketplaceId") marketplaceId?: string,
    @Query("includeCompetitors") includeCompetitorsStr?: string,
    @GetUser() user: User,
  ): Promise<{
    dates: string[];
    ourPrices: number[];
    competitorPrices: Record<string, number[]>;
  }> {
    const organizationId = user.organizationId || "";
    const days = parseInt(daysStr);
    const includeCompetitors = includeCompetitorsStr === "true";

    return this.competitivePriceMonitoringService.getPriceHistory(
      productId,
      organizationId,
      days,
      {
        marketplaceId,
        includeCompetitors,
      },
    );
  }

  /**
   * Configure price monitoring for a product
   *
   * @param productId Product ID
   * @param config Monitoring configuration
   * @param user Authenticated user
   * @returns Updated configuration
   */
  @Put("config/:productId")
  @ApiOperation({ summary: "Configure price monitoring for a product" })
  @ApiResponse({
    status: 200,
    description: "Price monitoring configured successfully",
    type: PriceMonitoringConfig,
  })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiBody({ description: "Monitoring configuration", type: Object })
  async configurePriceMonitoring(
    @Param("productId") productId: string,
    @Body() config: Partial<PriceMonitoringConfig>,
    @GetUser() user: User,
  ): Promise<PriceMonitoringConfig> {
    const organizationId = user.organizationId || "";

    return this.competitivePriceMonitoringService.configurePriceMonitoring(
      productId,
      organizationId,
      config,
      user.uid,
    );
  }

  /**
   * Get price monitoring configuration for a product
   *
   * @param productId Product ID
   * @param user Authenticated user
   * @returns Monitoring configuration
   */
  @Get("config/:productId")
  @ApiOperation({ summary: "Get price monitoring configuration for a product" })
  @ApiResponse({
    status: 200,
    description: "Price monitoring configuration retrieved successfully",
    type: PriceMonitoringConfig,
  })
  @ApiResponse({
    status: 404,
    description: "Price monitoring configuration not found",
  })
  @ApiParam({ name: "productId", description: "Product ID" })
  async getPriceMonitoringConfig(
    @Param("productId") productId: string,
    @GetUser() user: User,
  ): Promise<PriceMonitoringConfig> {
    const organizationId = user.organizationId || "";

    const config =
      await this.competitivePriceMonitoringService.getPriceMonitoringConfig(
        productId,
        organizationId,
      );

    if (!config) {
      throw new HttpException(
        "Price monitoring configuration not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return config;
  }

  /**
   * Get price alerts for a product
   *
   * @param productId Product ID
   * @param includeResolved Whether to include resolved alerts
   * @param alertType Optional alert type filter
   * @param limit Maximum records to return
   * @param offset Starting offset
   * @param user Authenticated user
   * @returns List of price alerts
   */
  @Get("alerts/:productId")
  @ApiOperation({ summary: "Get price alerts for a product" })
  @ApiResponse({
    status: 200,
    description: "Price alerts retrieved successfully",
    type: [PriceAlert],
  })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiQuery({
    name: "includeResolved",
    required: false,
    description: "Include resolved alerts",
    type: Boolean,
  })
  @ApiQuery({
    name: "alertType",
    required: false,
    description: "Filter by alert type",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Maximum number of records to return",
    type: Number,
  })
  @ApiQuery({
    name: "offset",
    required: false,
    description: "Starting offset for pagination",
    type: Number,
  })
  async getPriceAlerts(
    @Param("productId") productId: string,
    @Query("includeResolved") includeResolvedStr?: string,
    @Query("alertType") alertType?: string,
    @Query("limit") limitStr?: string,
    @Query("offset") offsetStr?: string,
    @GetUser() user: User,
  ): Promise<PriceAlert[]> {
    const organizationId = user.organizationId || "";
    const includeResolved = includeResolvedStr === "true";
    const limit = limitStr ? parseInt(limitStr) : undefined;
    const offset = offsetStr ? parseInt(offsetStr) : undefined;

    return this.competitivePriceMonitoringService.getPriceAlerts(
      productId,
      organizationId,
      {
        includeResolved,
        alertType,
        limit,
        offset,
      },
    );
  }

  /**
   * Mark a price alert as read
   *
   * @param alertId Alert ID
   * @param user Authenticated user
   * @returns Updated alert
   */
  @Put("alerts/:alertId/read")
  @ApiOperation({ summary: "Mark a price alert as read" })
  @ApiResponse({
    status: 200,
    description: "Price alert marked as read successfully",
    type: PriceAlert,
  })
  @ApiParam({ name: "alertId", description: "Alert ID" })
  async markAlertAsRead(
    @Param("alertId") alertId: string,
    @GetUser() user: User,
  ): Promise<PriceAlert> {
    const organizationId = user.organizationId || "";

    return this.competitivePriceMonitoringService.markAlertAsRead(
      alertId,
      organizationId,
      user.uid,
    );
  }

  /**
   * Mark a price alert as resolved
   *
   * @param alertId Alert ID
   * @param user Authenticated user
   * @returns Updated alert
   */
  @Put("alerts/:alertId/resolve")
  @ApiOperation({ summary: "Mark a price alert as resolved" })
  @ApiResponse({
    status: 200,
    description: "Price alert marked as resolved successfully",
    type: PriceAlert,
  })
  @ApiParam({ name: "alertId", description: "Alert ID" })
  async markAlertAsResolved(
    @Param("alertId") alertId: string,
    @GetUser() user: User,
  ): Promise<PriceAlert> {
    const organizationId = user.organizationId || "";

    return this.competitivePriceMonitoringService.markAlertAsResolved(
      alertId,
      organizationId,
      user.uid,
    );
  }

  /**
   * Generate a price report for a product
   *
   * @param productId Product ID
   * @param marketplaceId Optional marketplace filter
   * @param includeHistory Whether to include price history
   * @param daysOfHistory Number of days of history
   * @param includeRecommendations Whether to include price recommendations
   * @param user Authenticated user
   * @returns Price report
   */
  @Get("report/:productId")
  @ApiOperation({ summary: "Generate a price report for a product" })
  @ApiResponse({
    status: 200,
    description: "Price report generated successfully",
    type: CompetitorPriceReport,
  })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiQuery({
    name: "marketplaceId",
    required: false,
    description: "Filter by marketplace ID",
  })
  @ApiQuery({
    name: "includeHistory",
    required: false,
    description: "Include price history",
    type: Boolean,
  })
  @ApiQuery({
    name: "daysOfHistory",
    required: false,
    description: "Number of days of history",
    type: Number,
  })
  @ApiQuery({
    name: "includeRecommendations",
    required: false,
    description: "Include price recommendations",
    type: Boolean,
  })
  async generatePriceReport(
    @Param("productId") productId: string,
    @Query("marketplaceId") marketplaceId?: string,
    @Query("includeHistory") includeHistoryStr?: string,
    @Query("daysOfHistory") daysOfHistoryStr?: string,
    @Query("includeRecommendations") includeRecommendationsStr?: string,
    @GetUser() user: User,
  ): Promise<CompetitorPriceReport> {
    const organizationId = user.organizationId || "";
    const includeHistory = includeHistoryStr === "true";
    const daysOfHistory = daysOfHistoryStr
      ? parseInt(daysOfHistoryStr)
      : undefined;
    const includeRecommendations = includeRecommendationsStr === "true";

    return this.competitivePriceMonitoringService.generatePriceReport(
      productId,
      organizationId,
      {
        marketplaceId,
        includeHistory,
        daysOfHistory,
        includeRecommendations,
      },
    );
  }

  /**
   * Run batch monitoring for all products
   *
   * @param options Monitoring options
   * @param user Authenticated user
   * @returns Monitoring results
   */
  @Post("batch-monitoring")
  @ApiOperation({ summary: "Run batch monitoring for all products" })
  @ApiResponse({
    status: 200,
    description: "Batch monitoring executed successfully",
  })
  @ApiBody({ description: "Batch monitoring options", type: Object })
  async runBatchMonitoring(
    @Body()
    options: {
      limit?: number;
      autoAdjustPrices?: boolean;
    },
    @GetUser() user: User,
  ): Promise<{
    processingTime: number;
    productsChecked: number;
    pricesUpdated: number;
    skippedDueToLoadShedding: boolean;
  }> {
    const organizationId = user.organizationId || "";

    return this.competitivePriceMonitoringService.runBatchMonitoring(
      organizationId,
      options,
    );
  }

  /**
   * Verify competitor prices
   *
   * @param data Verification data
   * @param user Authenticated user
   * @returns Verification results
   */
  @Post("verify-prices")
  @ApiOperation({ summary: "Verify competitor prices" })
  @ApiResponse({
    status: 200,
    description: "Competitor prices verified successfully",
  })
  @ApiBody({ description: "Verification data", type: Object })
  async verifyCompetitorPrices(
    @Body()
    data: {
      competitorPriceIds: string[];
      verificationSource: PriceSourceType;
    },
    @GetUser() user: User,
  ): Promise<{
    verified: number;
    failed: number;
    skipped: number;
  }> {
    const organizationId = user.organizationId || "";

    return this.competitivePriceMonitoringService.verifyCompetitorPrices(
      data.competitorPriceIds,
      organizationId,
      data.verificationSource,
    );
  }

  /**
   * Generate AI-powered price analysis
   *
   * @param productId Product ID
   * @param user Authenticated user
   * @returns AI analysis results
   */
  @Get("ai-analysis/:productId")
  @ApiOperation({ summary: "Generate AI-powered price analysis" })
  @ApiResponse({
    status: 200,
    description: "AI analysis generated successfully",
  })
  @ApiResponse({
    status: 503,
    description: "AI analysis is not available or could not be generated",
  })
  @ApiParam({ name: "productId", description: "Product ID" })
  async generateAiPriceAnalysis(
    @Param("productId") productId: string,
    @GetUser() user: User,
  ): Promise<{
    analysis: string;
    recommendations: string[];
    marketInsights: string;
  } | null> {
    const organizationId = user.organizationId || "";

    const result =
      await this.competitivePriceMonitoringService.generateAiPriceAnalysis(
        productId,
        organizationId,
      );

    if (!result) {
      throw new HttpException(
        "AI analysis is not available or could not be generated",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return result;
  }

  /**
   * Attempt to automatically adjust price based on configured strategy
   *
   * @param productId Product ID
   * @param user Authenticated user
   * @returns Price adjustment result
   */
  @Post("auto-adjust/:productId")
  @ApiOperation({
    summary: "Automatically adjust price based on configuration",
  })
  @ApiResponse({
    status: 200,
    description: "Price adjustment executed successfully",
  })
  @ApiParam({ name: "productId", description: "Product ID" })
  async automaticallyAdjustPrice(
    @Param("productId") productId: string,
    @GetUser() user: User,
  ): Promise<{
    adjusted: boolean;
    oldPrice?: number;
    newPrice?: number;
    reason?: string;
  }> {
    const organizationId = user.organizationId || "";

    return this.competitivePriceMonitoringService.automaticallyAdjustPrice(
      productId,
      organizationId,
    );
  }
}
