import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { FirebaseAuthGuard } from "@common/guards";
import { GetUser } from "@common/decorators";

import { KeywordResearchService } from "../services/keyword-research.service";
import {
  KeywordResearchRequestDto,
  KeywordResearchCreditEstimateDto,
} from "../interfaces/types";

/**
 * Controller for keyword research operations in the credit system
 */
@ApiTags("keyword-research")
@Controller("credit-system/keyword-research")
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class KeywordResearchController {
  constructor(
    private readonly keywordResearchService: KeywordResearchService,
  ) {}

  /**
   * Estimate credits required for keyword research
   */
  @Post("estimate")
  @ApiOperation({ summary: "Estimate credits required for keyword research" })
  @ApiBody({ type: Object, description: "Keyword research parameters" })
  @ApiResponse({
    status: 200,
    description: "Credit estimate calculated successfully",
  })
  async estimateCredits(@Body() estimateDto: KeywordResearchCreditEstimateDto) {
    try {
      return await this.keywordResearchService.estimateCreditCost(estimateDto);
    } catch (error) {
      throw new BadRequestException(
        `Failed to estimate credit cost: ${error.message}`,
      );
    }
  }

  /**
   * Request keyword research
   */
  @Post("request")
  @ApiOperation({ summary: "Request keyword research" })
  @ApiBody({ type: Object, description: "Keyword research request" })
  @ApiResponse({
    status: 201,
    description: "Keyword research request created successfully",
  })
  async requestKeywordResearch(
    @Body() requestDto: KeywordResearchRequestDto,
    @GetUser() user: { uid: string; organizationId: string },
  ) {
    try {
      // Validate the request
      if (!requestDto.organizationId) {
        requestDto.organizationId = user.organizationId;
      }

      if (!requestDto.userId) {
        requestDto.userId = user.uid;
      }

      if (!requestDto.keywords || requestDto.keywords.length === 0) {
        throw new BadRequestException("Keywords are required");
      }

      if (!requestDto.marketplaces || requestDto.marketplaces.length === 0) {
        throw new BadRequestException(
          "At least one marketplace must be specified",
        );
      }

      // Create the request
      const request =
        await this.keywordResearchService.requestKeywordResearch(requestDto);

      return {
        id: request.id,
        status: request.status,
        creditCost: request.creditCost,
        keywords: request.keywords.length,
        marketplaces: request.marketplaces,
        queuePosition: await this.keywordResearchService.getQueueStatus(
          requestDto.organizationId,
          request.id,
        ),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to request keyword research: ${error.message}`,
      );
    }
  }

  /**
   * Get keyword research queue status
   */
  @Get("queue-status")
  @ApiOperation({ summary: "Get keyword research queue status" })
  @ApiResponse({
    status: 200,
    description: "Queue status retrieved successfully",
  })
  async getQueueStatus(
    @GetUser() user: { uid: string; organizationId: string },
    @Query("organizationId") organizationId?: string,
    @Query("requestId") requestId?: string,
  ) {
    try {
      const finalOrgId = organizationId || user.organizationId;
      return await this.keywordResearchService.getQueueStatus(
        finalOrgId,
        requestId,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to get queue status: ${error.message}`,
      );
    }
  }

  /**
   * Get recent keyword research requests
   */
  @Get("requests")
  @ApiOperation({ summary: "Get recent keyword research requests" })
  @ApiResponse({
    status: 200,
    description: "Recent requests retrieved successfully",
  })
  async getRecentRequests(
    @GetUser() user: { uid: string; organizationId: string },
    @Query("organizationId") organizationId?: string,
    @Query("limit") limitStr?: string,
  ) {
    try {
      const finalOrgId = organizationId || user.organizationId;
      const limit = limitStr ? parseInt(limitStr, 10) : 10;

      if (isNaN(limit)) {
        throw new BadRequestException("Limit must be a valid number");
      }

      return await this.keywordResearchService.getRecentRequests(
        finalOrgId,
        limit,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to get recent requests: ${error.message}`,
      );
    }
  }

  /**
   * Get keyword research results for a specific request
   */
  @Get("results/:requestId")
  @ApiOperation({ summary: "Get keyword research results" })
  @ApiResponse({ status: 200, description: "Results retrieved successfully" })
  async getResults(@Param("requestId") requestId: string) {
    try {
      const results = await this.keywordResearchService.getResults(requestId);

      if (results.length === 0) {
        throw new NotFoundException(
          `No results found for request ${requestId}`,
        );
      }

      return results;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get results: ${error.message}`);
    }
  }

  /**
   * Get keyword research service status
   */
  @Get("status")
  @ApiOperation({ summary: "Get keyword research service status" })
  @ApiResponse({
    status: 200,
    description: "Service status retrieved successfully",
  })
  async getServiceStatus() {
    try {
      return this.keywordResearchService.getServiceStatus();
    } catch (error) {
      throw new BadRequestException(
        `Failed to get service status: ${error.message}`,
      );
    }
  }

  /**
   * Get keyword research cache statistics
   */
  @Get("cache-stats")
  @ApiOperation({ summary: "Get keyword research cache statistics" })
  @ApiResponse({
    status: 200,
    description: "Cache statistics retrieved successfully",
  })
  async getCacheStats() {
    try {
      return await this.keywordResearchService.getCacheStats();
    } catch (error) {
      throw new BadRequestException(
        `Failed to get cache statistics: ${error.message}`,
      );
    }
  }

  /**
   * Get available marketplaces for keyword research
   */
  @Get("marketplaces")
  @ApiOperation({ summary: "Get available marketplaces" })
  @ApiResponse({
    status: 200,
    description: "Available marketplaces retrieved successfully",
  })
  async getAvailableMarketplaces() {
    try {
      // Hardcoded for now, would come from scraper integration in real implementation
      return {
        availableMarketplaces: [
          {
            id: "takealot",
            name: "Takealot",
            country: "South Africa",
            region: "Africa",
            isPrimary: true,
            logo: "https://www.takealot.com/static/images/takealot-logo.svg",
          },
          {
            id: "loot",
            name: "Loot",
            country: "South Africa",
            region: "Africa",
            isPrimary: true,
            logo: "https://www.loot.co.za/images/logo.svg",
          },
          {
            id: "makro",
            name: "Makro",
            country: "South Africa",
            region: "Africa",
            isPrimary: true,
            logo: "https://www.makro.co.za/static/images/makro-logo.svg",
          },
          {
            id: "buck_cheap",
            name: "Buck Cheap",
            country: "South Africa",
            region: "Africa",
            isPrimary: false,
            logo: "https://www.buckcheap.co.za/images/logo.png",
          },
          {
            id: "bob_shop",
            name: "Bob Shop",
            country: "South Africa",
            region: "Africa",
            isPrimary: false,
            logo: "https://www.bobshop.co.za/images/logo.svg",
          },
          {
            id: "amazon",
            name: "Amazon",
            country: "Global",
            region: "Global",
            isPrimary: false,
            logo: "https://www.amazon.com/favicon.ico",
          },
        ],
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get available marketplaces: ${error.message}`,
      );
    }
  }
}
