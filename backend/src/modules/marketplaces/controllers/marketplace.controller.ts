import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";

import { Request as ExpressRequest } from "express";

import {
  FirebaseAuthGuard,
  GetUser,
  DecodedFirebaseToken,
  AuthUtils,
} from "src/common/auth";

import { MarketplaceAdapterFactory } from "../services/marketplace-adapter.factory";

// Define the AuthenticatedRequest type for this controller
interface AuthenticatedRequest extends ExpressRequest {
  user: DecodedFirebaseToken;
}
import { MarketplaceCredentialsRepository } from "../repositories/marketplace-credentials.repository";
import { MarketplaceSyncService } from "../services/marketplace-sync.service";
import { MarketplaceCredentials } from "../interfaces/types";

/**
 * Controller for marketplace operations
 */
@ApiTags("marketplaces")
@Controller("marketplaces")
@UseGuards(FirebaseAuthGuard)
export class MarketplaceController {
  private readonly logger = new Logger(MarketplaceController.name);

  constructor(
    private readonly adapterFactory: MarketplaceAdapterFactory,
    private readonly credentialsRepository: MarketplaceCredentialsRepository,
    private readonly syncService: MarketplaceSyncService,
  ) {}

  /**
   * Get all available marketplaces
   */
  @Get()
  @ApiOperation({ summary: "Get all available marketplaces" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of available marketplaces",
  })
  async getMarketplaces() {
    const adapters = this.adapterFactory.getAllAdapters();

    return {
      marketplaces: adapters.map((adapter) => ({
        id: adapter.marketplaceId,
        name: adapter.marketplaceName,
      })),
    };
  }

  /**
   * Get all marketplace connections for the authenticated organization
   */
  @Get("connections")
  @ApiOperation({
    summary:
      "Get all marketplace connections for the authenticated organization",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of marketplace connections",
  })
  async getConnections(@GetUser() user: DecodedFirebaseToken) {
    const organizationId = user.organizationId;

    if (!organizationId) {
      throw new HttpException(
        "Organization ID not found in auth token",
        HttpStatus.BAD_REQUEST,
      );
    }

    const credentials =
      await this.credentialsRepository.findByOrganization(organizationId);
    const adapters = this.adapterFactory.getAllAdapters();

    // Format the response to include marketplace details and connection status
    const connections = credentials.map((credential) => {
      const adapter = adapters.find(
        (a) => a.marketplaceId === credential.marketplaceId,
      );

      return {
        id: credential.id,
        marketplaceId: credential.marketplaceId,
        marketplaceName: adapter?.marketplaceName || credential.marketplaceId,
        status: credential.lastConnectionStatus || {
          connected: false,
          message: "Connection status unknown",
          timestamp: new Date(),
        },
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
      };
    });

    return { connections };
  }

  /**
   * Create or update a marketplace connection
   */
  @Post("connections/:marketplaceId")
  @ApiOperation({ summary: "Create or update a marketplace connection" })
  @ApiParam({
    name: "marketplaceId",
    description: "ID of the marketplace to connect to",
  })
  @ApiBody({ description: "Marketplace credentials" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Connection created or updated successfully",
  })
  async createConnection(
    @Req() req: AuthenticatedRequest,
    @Param("marketplaceId") marketplaceId: string,
    @Body() credentials: Record<string, any>,
  ) {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      throw new HttpException(
        "Organization ID not found in auth token",
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Validate marketplace ID
      const adapter = this.adapterFactory.getAdapter(marketplaceId);

      // Test connection with provided credentials
      const connectionStatus = await this.adapterFactory.testConnection(
        marketplaceId,
        organizationId,
        {
          ...credentials,
          organizationId,
        } as MarketplaceCredentials,
      );

      if (!connectionStatus.connected) {
        throw new HttpException(
          `Connection test failed: ${connectionStatus.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Save credentials
      const savedCredential = await this.credentialsRepository.upsert(
        marketplaceId,
        organizationId,
        credentials as MarketplaceCredentials,
      );

      // Update connection status
      const updatedCredential =
        await this.credentialsRepository.updateConnectionStatus(
          savedCredential.id,
          connectionStatus.connected,
          connectionStatus.message,
        );

      if (!updatedCredential) {
        this.logger.warn(
          `Failed to update connection status for credential ${savedCredential.id}`,
        );
      }

      return {
        success: true,
        message: "Marketplace connection established successfully",
        connectionId: savedCredential.id,
        status: connectionStatus,
      };
    } catch (error) {
      this.logger.error(
        `Error creating marketplace connection: ${error.message}`,
        error.stack,
      );

      throw new HttpException(
        `Failed to create marketplace connection: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Test a marketplace connection
   */
  @Post("connections/:marketplaceId/test")
  @ApiOperation({ summary: "Test a marketplace connection" })
  @ApiParam({
    name: "marketplaceId",
    description: "ID of the marketplace to test",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Connection test result",
  })
  async testConnection(
    @Req() req: AuthenticatedRequest,
    @Param("marketplaceId") marketplaceId: string,
    @Body() credentials?: Record<string, any>,
  ) {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      throw new HttpException(
        "Organization ID not found in auth token",
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const connectionStatus = await this.adapterFactory.testConnection(
        marketplaceId,
        organizationId,
        credentials
          ? ({ ...credentials, organizationId } as MarketplaceCredentials)
          : undefined,
      );

      return {
        success: connectionStatus.connected,
        message: connectionStatus.message,
        details: connectionStatus.details,
      };
    } catch (error) {
      this.logger.error(
        `Error testing marketplace connection: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  /**
   * Sync product inventory to all connected marketplaces
   */
  @Post("sync/product/:productId/inventory")
  @ApiOperation({
    summary: "Sync product inventory to all connected marketplaces",
  })
  @ApiParam({ name: "productId", description: "ID of the product to sync" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Sync result",
  })
  async syncProductInventory(
    @Req() req: AuthenticatedRequest,
    @Param("productId") productId: string,
  ) {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      throw new HttpException(
        "Organization ID not found in auth token",
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.syncService.syncProductInventory(productId, organizationId);
  }

  /**
   * Sync product price to all connected marketplaces
   */
  @Post("sync/product/:productId/price")
  @ApiOperation({ summary: "Sync product price to all connected marketplaces" })
  @ApiParam({ name: "productId", description: "ID of the product to sync" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Sync result",
  })
  async syncProductPrice(
    @Req() req: AuthenticatedRequest,
    @Param("productId") productId: string,
  ) {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      throw new HttpException(
        "Organization ID not found in auth token",
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.syncService.syncProductPrice(productId, organizationId);
  }

  /**
   * Get products from a marketplace
   */
  @Get(":marketplaceId/products")
  @ApiOperation({ summary: "Get products from a marketplace" })
  @ApiParam({ name: "marketplaceId", description: "ID of the marketplace" })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number (0-based)",
  })
  @ApiQuery({
    name: "pageSize",
    required: false,
    description: "Number of items per page",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of products from the marketplace",
  })
  async getMarketplaceProducts(
    @Req() req: AuthenticatedRequest,
    @Param("marketplaceId") marketplaceId: string,
    @Query("page") page = 0,
    @Query("pageSize") pageSize = 20,
    @Query() filters: Record<string, any> = {},
  ) {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      throw new HttpException(
        "Organization ID not found in auth token",
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const adapter = await this.adapterFactory.getInitializedAdapter(
        marketplaceId,
        organizationId,
      );

      // Remove page and pageSize from filters
      const { page: _, pageSize: __, ...productFilters } = filters;

      // Convert page and pageSize to numbers if they are strings
      const pageNum = typeof page === "string" ? parseInt(page, 10) : page;
      const pageSizeNum =
        typeof pageSize === "string" ? parseInt(pageSize, 10) : pageSize;

      const response = await adapter.getProducts(
        pageNum,
        pageSizeNum,
        productFilters,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error getting products from marketplace: ${error.message}`,
        error.stack,
      );

      throw new HttpException(
        `Failed to get products: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Import a product from a marketplace
   */
  @Post("import/:marketplaceId/product/:productId")
  @ApiOperation({ summary: "Import a product from a marketplace" })
  @ApiParam({ name: "marketplaceId", description: "ID of the marketplace" })
  @ApiParam({
    name: "productId",
    description: "ID of the product in the marketplace",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Import result",
  })
  async importProduct(
    @Req() req: AuthenticatedRequest,
    @Param("marketplaceId") marketplaceId: string,
    @Param("productId") productId: string,
  ) {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      throw new HttpException(
        "Organization ID not found in auth token",
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.syncService.importProduct(
      marketplaceId,
      organizationId,
      productId,
    );
  }
}
