import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  ForbiddenException,
} from "@nestjs/common";

import { BuyBoxStatus as BuyBoxStatusEnum } from "../interfaces/types";
import { BuyBoxStatus } from "../models/buybox-status.schema";
import {
  BuyBoxMonitoringService,
  BuyBoxListing,
  CompetitorListing,
} from "../services/buybox-monitoring.service";

/**
 * DTO for updating BuyBox status
 */
interface UpdateBuyBoxStatusDto {
  organizationId: string;
  productId: string;
  productSku: string;
  productName: string;
  marketplaceId: string;
  marketplaceName: string;
  myListing: BuyBoxListing;
  competitorListings: CompetitorListing[];
}

/**
 * Controller for BuyBox monitoring endpoints
 */
@Controller("api/buybox")
export class BuyBoxController {
  private readonly logger = new Logger(BuyBoxController.name);

  constructor(
    private readonly buyBoxMonitoringService: BuyBoxMonitoringService,
  ) {}

  /**
   * Update BuyBox status for a product
   * @param updateDto Update data
   * @returns Updated BuyBox status
   */
  @Post("status")
  async updateBuyBoxStatus(
    @Body() updateDto: UpdateBuyBoxStatusDto,
  ): Promise<BuyBoxStatus> {
    this.logger.log(
      `Updating BuyBox status for product ${updateDto.productId}`,
    );

    return this.buyBoxMonitoringService.updateBuyBoxStatus(
      updateDto.organizationId,
      updateDto.productId,
      updateDto.productSku,
      updateDto.productName,
      updateDto.marketplaceId,
      updateDto.marketplaceName,
      updateDto.myListing,
      updateDto.competitorListings,
    );
  }

  /**
   * Get BuyBox status for a product
   * @param productId Product ID
   * @param marketplaceId Marketplace ID
   * @returns BuyBox status
   */
  @Get("status/:productId/:marketplaceId")
  async getBuyBoxStatus(
    @Param("productId") productId: string,
    @Param("marketplaceId") marketplaceId: string,
  ): Promise<BuyBoxStatus> {
    const status = await this.buyBoxMonitoringService.getBuyBoxStatus(
      productId,
      marketplaceId,
    );

    if (!status) {
      throw new ForbiddenException(
        `No BuyBox status found for product ${productId} on marketplace ${marketplaceId}`,
      );
    }

    return status;
  }

  /**
   * Get BuyBox statuses for an organization
   * @param organizationId Organization ID
   * @param productId Optional product ID filter
   * @param marketplaceId Optional marketplace ID filter
   * @param status Optional status filter
   * @param isMonitored Optional monitoring filter
   * @returns Array of BuyBox statuses
   */
  @Get("status/organization/:organizationId")
  async getBuyBoxStatuses(
    @Param("organizationId") organizationId: string,
    @Query("productId") productId?: string,
    @Query("marketplaceId") marketplaceId?: string,
    @Query("status") status?: BuyBoxStatusEnum,
    @Query("isMonitored") isMonitored?: string,
  ): Promise<BuyBoxStatus[]> {
    // Parse isMonitored
    const parsedIsMonitored =
      isMonitored !== undefined
        ? String(isMonitored).toLowerCase() === "true"
        : undefined;

    return this.buyBoxMonitoringService.getBuyBoxStatuses(organizationId, {
      productId,
      marketplaceId,
      status,
      isMonitored: parsedIsMonitored,
    });
  }

  /**
   * Get BuyBox history for a product
   * @param productId Product ID
   * @param marketplaceId Marketplace ID
   * @param limit Maximum items to return
   * @returns BuyBox history
   */
  @Get("history/:productId/:marketplaceId")
  async getBuyBoxHistory(
    @Param("productId") productId: string,
    @Param("marketplaceId") marketplaceId: string,
    @Query("limit") limit?: number,
  ): Promise<any[]> {
    const parsedLimit = limit ? parseInt(limit.toString(), 10) : 100;

    return this.buyBoxMonitoringService.getBuyBoxHistory(
      productId,
      marketplaceId,
      parsedLimit,
    );
  }
}
