import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { FirebaseAuthGuard } from "@common/guards";
import { ProductReviewService } from "../services/product-review.service";
import {
  ProductReview,
  ProductReviewStatus,
  ReviewSource,
} from "../models/product-review.model";
import { NetworkAwareStorageService } from "../services/network-aware-storage.service";
import { LoadSheddingResilienceService } from "../services/load-shedding-resilience.service";

/**
 * Create review DTO
 */
class CreateReviewDto {
  /**
   * Product ID
   */
  productId: string;

  /**
   * Product variant ID (if applicable)
   */
  variantId?: string;

  /**
   * Rating (1-5 stars)
   */
  rating: number;

  /**
   * Review title
   */
  title: string;

  /**
   * Review content
   */
  content: string;

  /**
   * Pros/positive points (optional)
   */
  pros?: string[];

  /**
   * Cons/negative points (optional)
   */
  cons?: string[];

  /**
   * Whether the reviewer recommends the product
   */
  recommended?: boolean;

  /**
   * Reviewer name
   */
  reviewerName: string;

  /**
   * Reviewer email (optional)
   */
  reviewerEmail?: string;

  /**
   * Reviewer location (optional)
   */
  location?: string;

  /**
   * Order ID for verified purchases
   */
  orderId?: string;

  /**
   * Whether this is a verified purchase
   */
  isVerifiedPurchase?: boolean;

  /**
   * Feature-specific ratings
   */
  featureRatings?: Record<string, number>;

  /**
   * Tags
   */
  tags?: string[];
}

/**
 * Update review DTO
 */
class UpdateReviewDto {
  /**
   * Rating (1-5 stars)
   */
  rating?: number;

  /**
   * Review title
   */
  title?: string;

  /**
   * Review content
   */
  content?: string;

  /**
   * Pros/positive points
   */
  pros?: string[];

  /**
   * Cons/negative points
   */
  cons?: string[];

  /**
   * Whether the reviewer recommends the product
   */
  recommended?: boolean;

  /**
   * Reviewer name
   */
  reviewerName?: string;

  /**
   * Feature-specific ratings
   */
  featureRatings?: Record<string, number>;

  /**
   * Tags
   */
  tags?: string[];
}

/**
 * Moderation update DTO
 */
class ModerationUpdateDto {
  /**
   * New status
   */
  status: ProductReviewStatus;

  /**
   * Moderation notes
   */
  notes?: string;
}

/**
 * Merchant response DTO
 */
class MerchantResponseDto {
  /**
   * Response content
   */
  content: string;
}

/**
 * Import reviews DTO
 */
class ImportReviewsDto {
  /**
   * Reviews to import
   */
  reviews: Array<{
    productId: string;
    variantId?: string;
    rating: number;
    title: string;
    content: string;
    pros?: string[];
    cons?: string[];
    recommended?: boolean;
    reviewerName: string;
    reviewerEmail?: string;
    location?: string;
    isVerifiedPurchase: boolean;
    status?: ProductReviewStatus;
    source: ReviewSource;
    marketplaceSource?: {
      name: string;
      reviewId: string;
      url?: string;
      postedDate: Date;
      isVerified: boolean;
    };
    submittedDate?: Date;
    featureRatings?: Record<string, number>;
    tags?: string[];
  }>;
}

/**
 * Product review controller
 * Manages review operations for products
 */
@ApiTags("product-reviews")
@Controller("pim/reviews")
@UseGuards(FirebaseAuthGuard)
export class ProductReviewController {
  private readonly logger = new Logger(ProductReviewController.name);

  constructor(
    private readonly reviewService: ProductReviewService,
    private readonly storageService: NetworkAwareStorageService,
    private readonly loadSheddingService: LoadSheddingResilienceService,
  ) {}

  /**
   * Create a new product review
   * @param dto Review data
   * @param req Request
   */
  @Post()
  @ApiOperation({ summary: "Create a new product review" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Review created successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid review data",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Product not found",
  })
  async createReview(
    @Body() dto: CreateReviewDto,
    @Req() req: any,
  ): Promise<ProductReview> {
    try {
      const organizationId = req.user.organizationId;
      const userId = req.user.uid;

      // Map DTO to review model
      const reviewData: Omit<
        ProductReview,
        "id" | "createdAt" | "updatedAt" | "organizationId" | "status"
      > = {
        productId: dto.productId,
        variantId: dto.variantId,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        pros: dto.pros,
        cons: dto.cons,
        recommended: dto.recommended,
        reviewerName: dto.reviewerName,
        reviewerEmail: dto.reviewerEmail,
        userId: userId,
        location: dto.location,
        isVerifiedPurchase: dto.isVerifiedPurchase || false,
        orderId: dto.orderId,
        source: ReviewSource.INTERNAL,
        helpfulCount: 0,
        notHelpfulCount: 0,
        reportCount: 0,
        featureRatings: dto.featureRatings,
        tags: dto.tags,
        submittedDate: new Date(),
      };

      return await this.reviewService.createReview(
        reviewData,
        organizationId,
        userId,
      );
    } catch (error) {
      this.logger.error(`Error creating review: ${error.message}`, error.stack);

      if (error.message.includes("not found")) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Update a product review
   * @param id Review ID
   * @param dto Updated review data
   * @param req Request
   */
  @Put(":id")
  @ApiOperation({ summary: "Update a product review" })
  @ApiParam({ name: "id", description: "Review ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Review updated successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid review data",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Review not found",
  })
  async updateReview(
    @Param("id") id: string,
    @Body() dto: UpdateReviewDto,
    @Req() req: any,
  ): Promise<ProductReview> {
    try {
      const organizationId = req.user.organizationId;
      const userId = req.user.uid;

      return await this.reviewService.updateReview(
        id,
        dto,
        organizationId,
        userId,
      );
    } catch (error) {
      this.logger.error(`Error updating review: ${error.message}`, error.stack);

      if (error.message.includes("not found")) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Delete a product review
   * @param id Review ID
   * @param req Request
   */
  @Delete(":id")
  @ApiOperation({ summary: "Delete a product review" })
  @ApiParam({ name: "id", description: "Review ID" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Review deleted successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Review not found",
  })
  async deleteReview(@Param("id") id: string, @Req() req: any): Promise<void> {
    try {
      const organizationId = req.user.organizationId;

      await this.reviewService.deleteReview(id, organizationId);
    } catch (error) {
      this.logger.error(`Error deleting review: ${error.message}`, error.stack);

      if (error.message.includes("not found")) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get a review by ID
   * @param id Review ID
   * @param req Request
   */
  @Get(":id")
  @ApiOperation({ summary: "Get a review by ID" })
  @ApiParam({ name: "id", description: "Review ID" })
  @ApiResponse({ status: HttpStatus.OK, description: "Review found" })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Review not found",
  })
  async getReviewById(
    @Param("id") id: string,
    @Req() req: any,
  ): Promise<ProductReview> {
    const organizationId = req.user.organizationId;

    const review = await this.reviewService.getReviewById(id, organizationId);

    if (!review) {
      throw new HttpException(
        `Review with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return review;
  }

  /**
   * Get public reviews for a product
   * @param productId Product ID
   * @param limit Maximum number of reviews to return
   * @param offset Number of reviews to skip
   * @param req Request
   */
  @Get("product/:productId/public")
  @ApiOperation({ summary: "Get public reviews for a product" })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiQuery({
    name: "limit",
    description: "Maximum number of reviews to return",
    required: false,
  })
  @ApiQuery({
    name: "offset",
    description: "Number of reviews to skip",
    required: false,
  })
  @ApiResponse({ status: HttpStatus.OK, description: "Reviews found" })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Product not found",
  })
  async getPublicReviewsForProduct(
    @Param("productId") productId: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
    @Req() req?: any,
  ): Promise<ProductReview[]> {
    try {
      const organizationId = req.user.organizationId;

      // Get network quality to adapt response size
      const networkQuality = await this.storageService.assessNetworkQuality();
      const loadSheddingStatus =
        await this.loadSheddingService.getCurrentStatus();

      // Adjust limits based on network conditions
      let adjustedLimit = limit ? Number(limit) : 10;
      let adjustedOffset = offset ? Number(offset) : 0;

      // Reduce page size during load shedding or poor network
      if (
        loadSheddingStatus.currentStage > 2 ||
        networkQuality.quality === "low"
      ) {
        adjustedLimit = Math.min(adjustedLimit, 5);
      }

      return await this.reviewService.getPublicReviewsForProduct(
        productId,
        organizationId,
        adjustedLimit,
        adjustedOffset,
      );
    } catch (error) {
      this.logger.error(
        `Error getting public reviews: ${error.message}`,
        error.stack,
      );

      if (error.message.includes("not found")) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get all reviews for a product (admin view)
   * @param productId Product ID
   * @param status Optional status filter
   * @param limit Maximum number of reviews to return
   * @param offset Number of reviews to skip
   * @param req Request
   */
  @Get("product/:productId")
  @ApiOperation({ summary: "Get all reviews for a product (admin view)" })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiQuery({
    name: "status",
    description: "Filter by status",
    required: false,
  })
  @ApiQuery({
    name: "limit",
    description: "Maximum number of reviews to return",
    required: false,
  })
  @ApiQuery({
    name: "offset",
    description: "Number of reviews to skip",
    required: false,
  })
  @ApiResponse({ status: HttpStatus.OK, description: "Reviews found" })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Product not found",
  })
  async getAllReviewsForProduct(
    @Param("productId") productId: string,
    @Query("status") status?: ProductReviewStatus,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
    @Req() req?: any,
  ): Promise<ProductReview[]> {
    try {
      const organizationId = req.user.organizationId;

      return await this.reviewService.getAllReviewsForProduct(
        productId,
        organizationId,
        status,
        limit ? Number(limit) : 50,
        offset ? Number(offset) : 0,
      );
    } catch (error) {
      this.logger.error(
        `Error getting all reviews: ${error.message}`,
        error.stack,
      );

      if (error.message.includes("not found")) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get pending reviews for moderation
   * @param limit Maximum number of reviews to return
   * @param req Request
   */
  @Get("pending")
  @ApiOperation({ summary: "Get pending reviews for moderation" })
  @ApiQuery({
    name: "limit",
    description: "Maximum number of reviews to return",
    required: false,
  })
  @ApiResponse({ status: HttpStatus.OK, description: "Reviews found" })
  async getPendingReviews(
    @Query("limit") limit?: number,
    @Req() req?: any,
  ): Promise<ProductReview[]> {
    const organizationId = req.user.organizationId;

    return await this.reviewService.getPendingReviews(
      organizationId,
      limit ? Number(limit) : 50,
    );
  }

  /**
   * Add a merchant response to a review
   * @param id Review ID
   * @param dto Response data
   * @param req Request
   */
  @Post(":id/response")
  @ApiOperation({ summary: "Add a merchant response to a review" })
  @ApiParam({ name: "id", description: "Review ID" })
  @ApiBody({ type: MerchantResponseDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Response added successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Review not found",
  })
  async addMerchantResponse(
    @Param("id") id: string,
    @Body() dto: MerchantResponseDto,
    @Req() req: any,
  ): Promise<ProductReview> {
    try {
      const organizationId = req.user.organizationId;
      const userId = req.user.uid;

      return await this.reviewService.addMerchantResponse(
        id,
        dto.content,
        organizationId,
        userId,
      );
    } catch (error) {
      this.logger.error(
        `Error adding merchant response: ${error.message}`,
        error.stack,
      );

      if (error.message.includes("not found")) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Update review moderation status
   * @param id Review ID
   * @param dto Status update data
   * @param req Request
   */
  @Put(":id/moderation")
  @ApiOperation({ summary: "Update review moderation status" })
  @ApiParam({ name: "id", description: "Review ID" })
  @ApiBody({ type: ModerationUpdateDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Status updated successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Review not found",
  })
  async updateReviewStatus(
    @Param("id") id: string,
    @Body() dto: ModerationUpdateDto,
    @Req() req: any,
  ): Promise<ProductReview> {
    try {
      const organizationId = req.user.organizationId;
      const userId = req.user.uid;

      return await this.reviewService.updateReviewStatus(
        id,
        dto.status,
        organizationId,
        userId,
        dto.notes,
      );
    } catch (error) {
      this.logger.error(
        `Error updating review status: ${error.message}`,
        error.stack,
      );

      if (error.message.includes("not found")) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Record helpful vote for a review
   * @param id Review ID
   * @param helpful Whether the review was helpful
   * @param req Request
   */
  @Post(":id/helpful")
  @ApiOperation({ summary: "Record helpfulness vote for a review" })
  @ApiParam({ name: "id", description: "Review ID" })
  @ApiQuery({
    name: "helpful",
    description: "Whether the review was helpful",
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Vote recorded successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Review not found",
  })
  async recordHelpfulnessVote(
    @Param("id") id: string,
    @Query("helpful") helpful: string,
    @Req() req: any,
  ): Promise<void> {
    try {
      const organizationId = req.user.organizationId;
      const isHelpful = helpful === "true";

      await this.reviewService.recordHelpfulnessVote(
        id,
        isHelpful,
        organizationId,
      );
    } catch (error) {
      this.logger.error(
        `Error recording helpfulness vote: ${error.message}`,
        error.stack,
      );

      if (error.message.includes("not found")) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Report a review as inappropriate
   * @param id Review ID
   * @param req Request
   */
  @Post(":id/report")
  @ApiOperation({ summary: "Report a review as inappropriate" })
  @ApiParam({ name: "id", description: "Review ID" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Report recorded successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Review not found",
  })
  async reportReview(@Param("id") id: string, @Req() req: any): Promise<void> {
    try {
      const organizationId = req.user.organizationId;

      await this.reviewService.reportReview(id, organizationId);
    } catch (error) {
      this.logger.error(
        `Error reporting review: ${error.message}`,
        error.stack,
      );

      if (error.message.includes("not found")) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get review statistics for a product
   * @param productId Product ID
   * @param req Request
   */
  @Get("product/:productId/statistics")
  @ApiOperation({ summary: "Get review statistics for a product" })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiResponse({ status: HttpStatus.OK, description: "Statistics found" })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Product not found",
  })
  async getReviewStatistics(
    @Param("productId") productId: string,
    @Req() req: any,
  ): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
    recommendedPercentage: number;
  }> {
    try {
      const organizationId = req.user.organizationId;

      return await this.reviewService.getReviewStatistics(
        productId,
        organizationId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting review statistics: ${error.message}`,
        error.stack,
      );

      if (error.message.includes("not found")) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Import reviews from external source
   * @param dto Import data
   * @param req Request
   */
  @Post("import")
  @ApiOperation({ summary: "Import reviews from external source" })
  @ApiBody({ type: ImportReviewsDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Reviews imported successfully",
  })
  async importReviews(
    @Body() dto: ImportReviewsDto,
    @Req() req: any,
  ): Promise<{
    success: number;
    failed: number;
    productsMissingCount: number;
    errors: Record<string, string>;
  }> {
    try {
      const organizationId = req.user.organizationId;
      const userId = req.user.uid;

      // Execute with load shedding resilience awareness
      // This is a potentially heavy operation, so we should make sure we're not
      // in a severe load shedding stage
      const loadSheddingStatus =
        await this.loadSheddingService.getCurrentStatus();

      if (loadSheddingStatus.currentStage > 3) {
        throw new HttpException(
          "Import operation unavailable during severe load shedding (Stage 4+)",
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return await this.reviewService.importReviews(
        dto.reviews,
        organizationId,
        userId,
      );
    } catch (error) {
      this.logger.error(
        `Error importing reviews: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Search reviews
   * @param query Search text
   * @param status Optional status filter
   * @param limit Maximum number of reviews to return
   * @param offset Number of reviews to skip
   * @param req Request
   */
  @Get("search")
  @ApiOperation({ summary: "Search reviews" })
  @ApiQuery({ name: "query", description: "Search text", required: true })
  @ApiQuery({
    name: "status",
    description: "Filter by status",
    required: false,
  })
  @ApiQuery({
    name: "limit",
    description: "Maximum number of reviews to return",
    required: false,
  })
  @ApiQuery({
    name: "offset",
    description: "Number of reviews to skip",
    required: false,
  })
  @ApiResponse({ status: HttpStatus.OK, description: "Reviews found" })
  async searchReviews(
    @Query("query") query: string,
    @Query("status") status?: ProductReviewStatus,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
    @Req() req?: any,
  ): Promise<ProductReview[]> {
    const organizationId = req.user.organizationId;

    return await this.reviewService.searchReviews(
      organizationId,
      query,
      status,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0,
    );
  }

  /**
   * Get review dashboard statistics
   * @param req Request
   */
  @Get("dashboard/statistics")
  @ApiOperation({ summary: "Get review dashboard statistics" })
  @ApiResponse({ status: HttpStatus.OK, description: "Statistics found" })
  async getReviewDashboardStatistics(@Req() req: any): Promise<{
    reviewCountByStatus: Record<ProductReviewStatus, number>;
    pendingModeration: number;
    averageRating: number;
    recentReviewCount: number;
  }> {
    const organizationId = req.user.organizationId;

    return await this.reviewService.getReviewDashboardStatistics(
      organizationId,
    );
  }

  /**
   * Get sentiment insights for reviews
   * @param productId Product ID
   * @param req Request
   */
  @Get("product/:productId/sentiment")
  @ApiOperation({ summary: "Get sentiment insights for reviews" })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Sentiment insights found",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Product not found",
  })
  async getReviewSentimentInsights(
    @Param("productId") productId: string,
    @Req() req: any,
  ): Promise<{
    overallSentiment: number;
    positiveSentimentPercentage: number;
    negativeSentimentPercentage: number;
    neutralSentimentPercentage: number;
    keyPositiveAspects: string[];
    keyNegativeAspects: string[];
    topMentionedFeatures: string[];
  }> {
    try {
      const organizationId = req.user.organizationId;

      return await this.reviewService.getReviewSentimentInsights(
        productId,
        organizationId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting sentiment insights: ${error.message}`,
        error.stack,
      );

      if (error.message.includes("not found")) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      } else if (error.message.includes("not enabled")) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Process pending sentiment analysis batch
   * @param batchSize Number of reviews to process
   * @param req Request
   */
  @Post("sentiment/process-batch")
  @ApiOperation({ summary: "Process pending sentiment analysis batch" })
  @ApiQuery({
    name: "batchSize",
    description: "Number of reviews to process",
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Batch processed successfully",
  })
  async processSentimentAnalysisBatch(
    @Query("batchSize") batchSize?: number,
    @Req() req?: any,
  ): Promise<{ processedCount: number }> {
    try {
      const organizationId = req.user.organizationId;

      const processedCount =
        await this.reviewService.processPendingSentimentAnalysisBatch(
          organizationId,
          batchSize ? Number(batchSize) : 20,
        );

      return { processedCount };
    } catch (error) {
      this.logger.error(
        `Error processing sentiment analysis batch: ${error.message}`,
        error.stack,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
