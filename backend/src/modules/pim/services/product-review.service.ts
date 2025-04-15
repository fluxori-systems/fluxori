import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ProductReviewRepository } from '../repositories/product-review.repository';
import { ProductRepository } from '../repositories/product.repository';
import { ProductReview, ProductReviewStatus, ReviewSentiment, ReviewSource } from '../models/product-review.model';
import { ProductService } from './product.service';
import { LoadSheddingResilienceService } from './load-shedding-resilience.service';
import { NetworkAwareStorageService } from './network-aware-storage.service';
import { AgentService } from '../../agent-framework/services/agent.service';
import { CreditSystemService } from '../../credit-system/services/credit-system.service';
import { FeatureFlagService } from '../../feature-flags/services/feature-flag.service';

/**
 * Interface for review analysis result
 */
interface ReviewAnalysisResult {
  sentiment: ReviewSentiment;
  moderationIssues: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  isProfane: boolean;
  isSpam: boolean;
}

/**
 * Product review service
 * Manages operations for product reviews
 */
@Injectable()
export class ProductReviewService {
  private readonly logger = new Logger(ProductReviewService.name);
  private readonly aiEnabled: boolean;
  private readonly autoModerationEnabled: boolean;
  
  constructor(
    private readonly productReviewRepository: ProductReviewRepository,
    private readonly productRepository: ProductRepository,
    private readonly productService: ProductService,
    private readonly loadSheddingService: LoadSheddingResilienceService,
    private readonly storageService: NetworkAwareStorageService,
    @Optional() @Inject('AGENT_SERVICE') private readonly agentService?: AgentService,
    @Optional() @Inject('CREDIT_SYSTEM_SERVICE') private readonly creditService?: CreditSystemService,
    @Optional() private readonly featureFlagService?: FeatureFlagService,
  ) {
    this.aiEnabled = !!this.agentService && !!this.creditService;
    this.autoModerationEnabled = !!this.agentService;
  }
  
  /**
   * Create a new product review
   * @param review Review data
   * @param organizationId Organization ID
   * @param userId User ID
   */
  async createReview(
    review: Omit<ProductReview, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'status'>,
    organizationId: string,
    userId?: string,
  ): Promise<ProductReview> {
    try {
      this.logger.log(`Creating review for product ${review.productId}`);
      
      // Verify product exists
      const product = await this.productService.findById(review.productId, organizationId);
      if (!product) {
        throw new Error(`Product with ID ${review.productId} not found`);
      }
      
      // Network aware handling
      let networkMetadata;
      if (review.media && review.media.length > 0) {
        const networkQuality = await this.storageService.assessNetworkQuality();
        const loadSheddingStatus = await this.loadSheddingService.getCurrentStatus();
        
        networkMetadata = {
          submittedDuringLoadShedding: loadSheddingStatus.currentStage > 0,
          networkQuality: networkQuality.quality,
          mediaCompressed: networkQuality.quality !== 'high',
        };
      }
      
      // Adjust initial status based on auto-moderation if enabled
      let initialStatus = ProductReviewStatus.PENDING;
      let sentiment;
      let moderation;
      
      // Perform auto-moderation if enabled and not in load shedding
      const loadSheddingStatus = await this.loadSheddingService.getCurrentStatus();
      const isFeatureEnabled = this.featureFlagService?.isEnabled('pim.reviews.autoModeration', organizationId) ?? true;
      
      if (this.autoModerationEnabled && isFeatureEnabled && loadSheddingStatus.currentStage < 3) {
        try {
          // Queue analysis as a non-critical operation during load shedding
          await this.loadSheddingService.queueOperation(async () => {
            const analysisResult = await this.analyzeReview(review.title, review.content);
            
            sentiment = analysisResult.sentiment;
            
            // Set moderation result
            const hasSeriousIssues = analysisResult.moderationIssues.some(
              issue => issue.severity === 'high'
            );
            
            moderation = {
              passed: !hasSeriousIssues,
              issues: analysisResult.moderationIssues,
              action: hasSeriousIssues ? 'flag' : 'none',
              moderationDate: new Date(),
            };
            
            // Auto-approve or flag based on moderation
            if (hasSeriousIssues) {
              initialStatus = ProductReviewStatus.FLAGGED;
            } else if (analysisResult.sentiment.score > 0 || analysisResult.sentiment.score < 0) {
              // Only auto-approve if sentiment analysis was successful
              initialStatus = ProductReviewStatus.APPROVED;
            }
          }, {
            priority: 'low',
            retryCount: 2,
            retryDelay: 5000,
          });
        } catch (error) {
          this.logger.warn(`Auto-moderation failed, defaulting to PENDING: ${error.message}`);
          // If auto-moderation fails, fall back to manual moderation
          initialStatus = ProductReviewStatus.PENDING;
        }
      }
      
      // Create the review with network awareness metadata
      const newReview = await this.productReviewRepository.create({
        ...review,
        organizationId,
        createdBy: userId,
        updatedBy: userId,
        status: initialStatus,
        source: review.source || ReviewSource.INTERNAL,
        networkMetadata,
        sentiment,
        moderation,
        submittedDate: new Date(),
        publishedDate: initialStatus === ProductReviewStatus.APPROVED ? new Date() : undefined,
      });
      
      // Schedule deferred processing for sentiment analysis if not already done
      if (this.aiEnabled && !sentiment && loadSheddingStatus.currentStage < 4) {
        this.loadSheddingService.queueOperation(async () => {
          await this.processDeferredSentimentAnalysis(newReview.id);
        }, {
          priority: 'low',
          retryCount: 3,
          retryDelay: 10000,
        });
      }
      
      return newReview;
    } catch (error) {
      this.logger.error(`Error creating review: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Update a product review
   * @param reviewId Review ID
   * @param data Updated review data
   * @param organizationId Organization ID
   * @param userId User ID
   */
  async updateReview(
    reviewId: string,
    data: Partial<ProductReview>,
    organizationId: string,
    userId: string,
  ): Promise<ProductReview> {
    try {
      this.logger.log(`Updating review ${reviewId}`);
      
      // Get existing review
      const review = await this.productReviewRepository.findById(reviewId);
      if (!review) {
        throw new Error(`Review with ID ${reviewId} not found`);
      }
      
      // Check organization ID
      if (review.organizationId !== organizationId) {
        throw new Error(`Review with ID ${reviewId} does not belong to this organization`);
      }
      
      // Update review
      const updateData: Partial<ProductReview> = {
        ...data,
        updatedBy: userId,
      };
      
      const updatedReview = await this.productReviewRepository.update(reviewId, updateData);
      
      // If status changed to APPROVED and no sentiment analysis has been done
      if (
        data.status === ProductReviewStatus.APPROVED && 
        !updatedReview.sentiment &&
        this.aiEnabled
      ) {
        // Queue sentiment analysis as a background task
        this.loadSheddingService.queueOperation(async () => {
          await this.processDeferredSentimentAnalysis(reviewId);
        }, {
          priority: 'low',
          retryCount: 3,
          retryDelay: 10000,
        });
      }
      
      return updatedReview;
    } catch (error) {
      this.logger.error(`Error updating review: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Delete a product review
   * @param reviewId Review ID
   * @param organizationId Organization ID
   */
  async deleteReview(reviewId: string, organizationId: string): Promise<void> {
    try {
      this.logger.log(`Deleting review ${reviewId}`);
      
      // Get existing review
      const review = await this.productReviewRepository.findById(reviewId);
      if (!review) {
        throw new Error(`Review with ID ${reviewId} not found`);
      }
      
      // Check organization ID
      if (review.organizationId !== organizationId) {
        throw new Error(`Review with ID ${reviewId} does not belong to this organization`);
      }
      
      // Delete review
      await this.productReviewRepository.delete(reviewId);
    } catch (error) {
      this.logger.error(`Error deleting review: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get a product review by ID
   * @param reviewId Review ID
   * @param organizationId Organization ID
   */
  async getReviewById(reviewId: string, organizationId: string): Promise<ProductReview | null> {
    try {
      const review = await this.productReviewRepository.findById(reviewId);
      
      if (!review || review.organizationId !== organizationId) {
        return null;
      }
      
      return review;
    } catch (error) {
      this.logger.error(`Error getting review: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get public reviews for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param limit Maximum number of reviews to return
   * @param offset Number of reviews to skip
   */
  async getPublicReviewsForProduct(
    productId: string,
    organizationId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<ProductReview[]> {
    try {
      // Verify product exists and belongs to organization
      const product = await this.productService.findById(productId, organizationId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      // Get approved reviews
      return await this.productReviewRepository.findByProductId(productId, {
        status: ProductReviewStatus.APPROVED,
        limit,
        offset,
        sortField: 'submittedDate',
        sortDirection: 'desc',
      });
    } catch (error) {
      this.logger.error(`Error getting public reviews: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get all reviews for a product (admin view)
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param status Optional status filter
   * @param limit Maximum number of reviews to return
   * @param offset Number of reviews to skip
   */
  async getAllReviewsForProduct(
    productId: string,
    organizationId: string,
    status?: ProductReviewStatus,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ProductReview[]> {
    try {
      // Verify product exists and belongs to organization
      const product = await this.productService.findById(productId, organizationId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      // Get reviews
      return await this.productReviewRepository.findByProductId(productId, {
        status,
        limit,
        offset,
        sortField: 'submittedDate',
        sortDirection: 'desc',
      });
    } catch (error) {
      this.logger.error(`Error getting all reviews: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get pending reviews for moderation
   * @param organizationId Organization ID
   * @param limit Maximum number of reviews to return
   */
  async getPendingReviews(organizationId: string, limit: number = 50): Promise<ProductReview[]> {
    try {
      return await this.productReviewRepository.findPendingReviews(organizationId, limit);
    } catch (error) {
      this.logger.error(`Error getting pending reviews: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Add a merchant response to a review
   * @param reviewId Review ID
   * @param responseContent Response content
   * @param organizationId Organization ID
   * @param userId User ID who is responding
   */
  async addMerchantResponse(
    reviewId: string,
    responseContent: string,
    organizationId: string,
    userId: string,
  ): Promise<ProductReview> {
    try {
      this.logger.log(`Adding merchant response to review ${reviewId}`);
      
      // Get existing review
      const review = await this.productReviewRepository.findById(reviewId);
      if (!review) {
        throw new Error(`Review with ID ${reviewId} not found`);
      }
      
      // Check organization ID
      if (review.organizationId !== organizationId) {
        throw new Error(`Review with ID ${reviewId} does not belong to this organization`);
      }
      
      // Add merchant response
      const updateData: Partial<ProductReview> = {
        merchantResponse: {
          content: responseContent,
          respondedBy: userId,
          respondedDate: new Date(),
        },
        updatedBy: userId,
      };
      
      return await this.productReviewRepository.update(reviewId, updateData);
    } catch (error) {
      this.logger.error(`Error adding merchant response: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Update review status (approve, reject, flag, feature)
   * @param reviewId Review ID
   * @param status New status
   * @param organizationId Organization ID
   * @param userId User ID
   * @param moderationNotes Optional moderation notes
   */
  async updateReviewStatus(
    reviewId: string,
    status: ProductReviewStatus,
    organizationId: string,
    userId: string,
    moderationNotes?: string,
  ): Promise<ProductReview> {
    try {
      this.logger.log(`Updating review ${reviewId} status to ${status}`);
      
      // Get existing review
      const review = await this.productReviewRepository.findById(reviewId);
      if (!review) {
        throw new Error(`Review with ID ${reviewId} not found`);
      }
      
      // Check organization ID
      if (review.organizationId !== organizationId) {
        throw new Error(`Review with ID ${reviewId} does not belong to this organization`);
      }
      
      // Update moderation info
      let moderation = review.moderation || {
        passed: status === ProductReviewStatus.APPROVED,
        issues: [],
      };
      
      moderation = {
        ...moderation,
        moderatorId: userId,
        moderationDate: new Date(),
        action: status === ProductReviewStatus.APPROVED ? 'none' : 
                status === ProductReviewStatus.REJECTED ? 'reject' : 
                status === ProductReviewStatus.FLAGGED ? 'flag' : 'none',
      };
      
      if (moderationNotes) {
        moderation.notes = moderationNotes;
      }
      
      // Update review status
      const updateData: Partial<ProductReview> = {
        status,
        moderation,
        updatedBy: userId,
      };
      
      return await this.productReviewRepository.update(reviewId, updateData);
    } catch (error) {
      this.logger.error(`Error updating review status: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Record helpfulness vote for a review
   * @param reviewId Review ID
   * @param helpful Whether the user found the review helpful
   * @param organizationId Organization ID
   */
  async recordHelpfulnessVote(
    reviewId: string,
    helpful: boolean,
    organizationId: string,
  ): Promise<void> {
    try {
      // Get existing review
      const review = await this.productReviewRepository.findById(reviewId);
      if (!review) {
        throw new Error(`Review with ID ${reviewId} not found`);
      }
      
      // Check organization ID
      if (review.organizationId !== organizationId) {
        throw new Error(`Review with ID ${reviewId} does not belong to this organization`);
      }
      
      // Update helpfulness count
      await this.productReviewRepository.updateHelpfulCount(reviewId, helpful);
    } catch (error) {
      this.logger.error(`Error recording helpfulness vote: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Report a review as inappropriate
   * @param reviewId Review ID
   * @param organizationId Organization ID
   */
  async reportReview(reviewId: string, organizationId: string): Promise<void> {
    try {
      // Get existing review
      const review = await this.productReviewRepository.findById(reviewId);
      if (!review) {
        throw new Error(`Review with ID ${reviewId} not found`);
      }
      
      // Check organization ID
      if (review.organizationId !== organizationId) {
        throw new Error(`Review with ID ${reviewId} does not belong to this organization`);
      }
      
      // Increment report count
      await this.productReviewRepository.incrementReportCount(reviewId);
    } catch (error) {
      this.logger.error(`Error reporting review: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get review statistics for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   */
  async getReviewStatistics(
    productId: string,
    organizationId: string,
  ): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
    recommendedPercentage: number;
  }> {
    try {
      // Verify product exists and belongs to organization
      const product = await this.productService.findById(productId, organizationId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      // Get review statistics
      return await this.productReviewRepository.calculateReviewStatistics(productId);
    } catch (error) {
      this.logger.error(`Error getting review statistics: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Import reviews from external source
   * @param reviews Reviews to import
   * @param organizationId Organization ID
   * @param userId User ID
   */
  async importReviews(
    reviews: Omit<ProductReview, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>[],
    organizationId: string,
    userId: string,
  ): Promise<{
    success: number;
    failed: number;
    productsMissingCount: number;
    errors: Record<string, string>;
  }> {
    try {
      this.logger.log(`Importing ${reviews.length} reviews`);
      
      let success = 0;
      let failed = 0;
      const productsMissing = new Set<string>();
      const errors: Record<string, string> = {};
      
      // Process using load shedding resilience for bulk operation
      await this.loadSheddingService.executeBatchWithResilience(
        reviews,
        async (review) => {
          try {
            // Verify product exists
            const product = await this.productService.findById(review.productId, organizationId);
            if (!product) {
              productsMissing.add(review.productId);
              errors[review.productId] = `Product not found`;
              failed++;
              return;
            }
            
            // Create review
            await this.productReviewRepository.create({
              ...review,
              organizationId,
              createdBy: userId,
              updatedBy: userId,
              status: review.status || ProductReviewStatus.PENDING,
              submittedDate: review.submittedDate || new Date(),
            });
            
            success++;
          } catch (error) {
            errors[review.productId] = error.message;
            failed++;
          }
        },
        {
          batchSize: 10,
          pauseAfterBatch: 1000,
          retryCount: 3,
          retryDelay: 5000,
        }
      );
      
      return {
        success,
        failed,
        productsMissingCount: productsMissing.size,
        errors,
      };
    } catch (error) {
      this.logger.error(`Error importing reviews: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Search reviews
   * @param organizationId Organization ID
   * @param searchText Text to search for
   * @param status Optional status filter
   * @param limit Maximum number of reviews to return
   * @param offset Number of reviews to skip
   */
  async searchReviews(
    organizationId: string,
    searchText: string,
    status?: ProductReviewStatus,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ProductReview[]> {
    try {
      return await this.productReviewRepository.searchReviews(
        organizationId,
        searchText,
        {
          status,
          limit,
          offset,
        }
      );
    } catch (error) {
      this.logger.error(`Error searching reviews: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get review dashboard statistics
   * @param organizationId Organization ID
   */
  async getReviewDashboardStatistics(
    organizationId: string,
  ): Promise<{
    reviewCountByStatus: Record<ProductReviewStatus, number>;
    pendingModeration: number;
    averageRating: number;
    recentReviewCount: number;
  }> {
    try {
      // Get counts by status
      const reviewCountByStatus = await this.productReviewRepository.countReviewsByStatus(organizationId);
      
      // Get pending moderation count
      const pendingModeration = reviewCountByStatus[ProductReviewStatus.PENDING];
      
      // Calculate overall average rating
      const query: any = {
        where: [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'status', operator: '==', value: ProductReviewStatus.APPROVED },
        ],
        limit: 1000,
      };
      
      const approvedReviews = await this.productReviewRepository.query(query);
      
      let totalRating = 0;
      approvedReviews.forEach(review => {
        totalRating += review.rating;
      });
      
      const averageRating = approvedReviews.length > 0 
        ? totalRating / approvedReviews.length 
        : 0;
      
      // Count recent reviews (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentQuery: any = {
        where: [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'submittedDate', operator: '>=', value: sevenDaysAgo },
        ],
        countOnly: true,
      };
      
      const recentReviewCount = await this.productReviewRepository.count(recentQuery);
      
      return {
        reviewCountByStatus,
        pendingModeration,
        averageRating,
        recentReviewCount,
      };
    } catch (error) {
      this.logger.error(`Error getting dashboard statistics: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get sentiment insights for reviews
   * @param productId Product ID
   * @param organizationId Organization ID
   */
  async getReviewSentimentInsights(
    productId: string,
    organizationId: string,
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
      // Check if AI features are enabled
      if (!this.aiEnabled) {
        throw new Error('AI sentiment analysis features are not enabled');
      }
      
      // Verify product exists and belongs to organization
      const product = await this.productService.findById(productId, organizationId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      // Get approved reviews with sentiment analysis
      const reviews = await this.productReviewRepository.findByProductId(productId, {
        status: ProductReviewStatus.APPROVED,
        limit: 1000,
      });
      
      // Filter reviews that have sentiment data
      const reviewsWithSentiment = reviews.filter(review => review.sentiment);
      
      if (reviewsWithSentiment.length === 0) {
        return {
          overallSentiment: 0,
          positiveSentimentPercentage: 0,
          negativeSentimentPercentage: 0,
          neutralSentimentPercentage: 0,
          keyPositiveAspects: [],
          keyNegativeAspects: [],
          topMentionedFeatures: [],
        };
      }
      
      // Calculate overall sentiment
      let totalSentiment = 0;
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;
      
      // Track aspects and features
      const positiveAspectsMap = new Map<string, number>();
      const negativeAspectsMap = new Map<string, number>();
      const featuresMap = new Map<string, number>();
      
      reviewsWithSentiment.forEach(review => {
        const sentiment = review.sentiment;
        totalSentiment += sentiment.score;
        
        // Count sentiment categories
        if (sentiment.score > 0.1) {
          positiveCount++;
        } else if (sentiment.score < -0.1) {
          negativeCount++;
        } else {
          neutralCount++;
        }
        
        // Track positive aspects
        if (sentiment.positiveAspects) {
          sentiment.positiveAspects.forEach(aspect => {
            positiveAspectsMap.set(aspect, (positiveAspectsMap.get(aspect) || 0) + 1);
          });
        }
        
        // Track negative aspects
        if (sentiment.negativeAspects) {
          sentiment.negativeAspects.forEach(aspect => {
            negativeAspectsMap.set(aspect, (negativeAspectsMap.get(aspect) || 0) + 1);
          });
        }
        
        // Track features
        if (sentiment.features) {
          sentiment.features.forEach(feature => {
            featuresMap.set(feature, (featuresMap.get(feature) || 0) + 1);
          });
        }
      });
      
      // Calculate averages and percentages
      const totalReviews = reviewsWithSentiment.length;
      const overallSentiment = totalSentiment / totalReviews;
      
      const positiveSentimentPercentage = (positiveCount / totalReviews) * 100;
      const negativeSentimentPercentage = (negativeCount / totalReviews) * 100;
      const neutralSentimentPercentage = (neutralCount / totalReviews) * 100;
      
      // Get top aspects and features
      const keyPositiveAspects = [...positiveAspectsMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([aspect]) => aspect);
        
      const keyNegativeAspects = [...negativeAspectsMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([aspect]) => aspect);
        
      const topMentionedFeatures = [...featuresMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([feature]) => feature);
      
      return {
        overallSentiment,
        positiveSentimentPercentage,
        negativeSentimentPercentage,
        neutralSentimentPercentage,
        keyPositiveAspects,
        keyNegativeAspects,
        topMentionedFeatures,
      };
    } catch (error) {
      this.logger.error(`Error getting sentiment insights: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Process deferred sentiment analysis for a review
   * @param reviewId Review ID
   * @private
   */
  private async processDeferredSentimentAnalysis(reviewId: string): Promise<void> {
    try {
      // Skip if AI is not enabled
      if (!this.aiEnabled || !this.agentService || !this.creditService) {
        this.logger.warn('Skipping sentiment analysis - AI features not enabled');
        return;
      }
      
      // Get review
      const review = await this.productReviewRepository.findById(reviewId);
      if (!review) {
        throw new Error(`Review not found with ID ${reviewId}`);
      }
      
      // Skip if already analyzed
      if (review.sentiment) {
        this.logger.log(`Review ${reviewId} already has sentiment analysis`);
        return;
      }
      
      // Check credit availability
      const hasCredits = await this.creditService.checkCredits({
        organizationId: review.organizationId,
        feature: 'review-sentiment',
        modelType: 'text',
        estimatedTokens: 1000,
      });
      
      if (!hasCredits) {
        this.logger.warn(`Organization ${review.organizationId} has insufficient credits for sentiment analysis`);
        return;
      }
      
      // Perform sentiment analysis
      const analysisResult = await this.analyzeReview(review.title, review.content);
      
      // Record credit usage
      await this.creditService.recordUsage({
        organizationId: review.organizationId,
        feature: 'review-sentiment',
        modelType: 'text',
        tokensUsed: 1000, // Estimated token usage
        userId: review.createdBy,
      });
      
      // Update review with sentiment
      await this.productReviewRepository.update(reviewId, {
        sentiment: analysisResult.sentiment,
      });
      
      this.logger.log(`Sentiment analysis completed for review ${reviewId}`);
    } catch (error) {
      this.logger.error(`Error processing sentiment analysis: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Analyze review for sentiment and moderation issues
   * @param title Review title
   * @param content Review content
   * @private
   */
  private async analyzeReview(title: string, content: string): Promise<ReviewAnalysisResult> {
    try {
      if (!this.agentService) {
        throw new Error('Agent service not available for review analysis');
      }
      
      // Create a combined prompt with review title and content
      const reviewText = `Title: ${title}\n\nContent: ${content}`;
      
      // Create prompt for agent
      const prompt = `
        Analyze the following product review for sentiment and content moderation.
        Review: ${reviewText}
        
        Please provide a structured analysis in the following JSON format:
        {
          "sentiment": {
            "score": <float between -1.0 and 1.0, where negative is negative sentiment and positive is positive sentiment>,
            "confidence": <float between 0.0 and 1.0>,
            "positiveAspects": [<list of positive aspects mentioned>],
            "negativeAspects": [<list of negative aspects mentioned>],
            "topics": [<list of main topics discussed>],
            "features": [<list of product features mentioned>]
          },
          "moderationIssues": [
            // Include only if issues are found
            {
              "type": <string - one of "profanity", "spam", "offensive", "personal_info", "other">,
              "severity": <string - one of "low", "medium", "high">,
              "description": <string describing the issue>
            }
          ],
          "isProfane": <boolean - true if review contains profanity>,
          "isSpam": <boolean - true if review appears to be spam>
        }
        
        Return only the JSON output without any explanations.
      `;
      
      // Call the agent
      const response = await this.agentService.generateText({
        prompt,
        modelId: 'text-moderation', // Use appropriate model for content analysis
        maxTokens: 1000,
      });
      
      // Parse the response as JSON
      try {
        const result = JSON.parse(response.text);
        
        // Ensure consistent data structure
        if (!result.moderationIssues) {
          result.moderationIssues = [];
        }
        
        return result as ReviewAnalysisResult;
      } catch (parseError) {
        this.logger.error(`Error parsing AI response: ${parseError.message}`);
        
        // Return a default result if parsing fails
        return {
          sentiment: {
            score: 0,
            confidence: 0,
            positiveAspects: [],
            negativeAspects: [],
            topics: [],
            features: [],
          },
          moderationIssues: [],
          isProfane: false,
          isSpam: false,
        };
      }
    } catch (error) {
      this.logger.error(`Error analyzing review: ${error.message}`, error.stack);
      
      // Return a default result if analysis fails
      return {
        sentiment: {
          score: 0,
          confidence: 0,
          positiveAspects: [],
          negativeAspects: [],
          topics: [],
          features: [],
        },
        moderationIssues: [],
        isProfane: false,
        isSpam: false,
      };
    }
  }
  
  /**
   * Run sentiment analysis batch processing for pending reviews
   * @param organizationId Organization ID
   * @param batchSize Number of reviews to process
   */
  async processPendingSentimentAnalysisBatch(
    organizationId: string,
    batchSize: number = 20,
  ): Promise<number> {
    try {
      // Skip if AI is not enabled
      if (!this.aiEnabled || !this.agentService || !this.creditService) {
        this.logger.warn('Skipping batch sentiment analysis - AI features not enabled');
        return 0;
      }
      
      // Check if we're in a severe load shedding stage
      const loadSheddingStatus = await this.loadSheddingService.getCurrentStatus();
      if (loadSheddingStatus.currentStage > 4) {
        this.logger.warn('Skipping batch sentiment analysis due to severe load shedding');
        return 0;
      }
      
      // Find reviews needing sentiment analysis
      const reviews = await this.productReviewRepository.findReviewsForSentimentAnalysis(
        organizationId,
        batchSize
      );
      
      if (reviews.length === 0) {
        return 0;
      }
      
      // Check credit availability for the batch
      const hasCredits = await this.creditService.checkCredits({
        organizationId,
        feature: 'review-sentiment-batch',
        modelType: 'text',
        estimatedTokens: reviews.length * 1000,
      });
      
      if (!hasCredits) {
        this.logger.warn(`Organization ${organizationId} has insufficient credits for batch sentiment analysis`);
        return 0;
      }
      
      // Process reviews with load shedding resilience
      let processedCount = 0;
      
      await this.loadSheddingService.executeBatchWithResilience(
        reviews,
        async (review) => {
          try {
            // Analyze review
            const analysisResult = await this.analyzeReview(review.title, review.content);
            
            // Update review with sentiment
            await this.productReviewRepository.update(review.id, {
              sentiment: analysisResult.sentiment,
            });
            
            processedCount++;
          } catch (error) {
            this.logger.error(`Error processing review ${review.id}: ${error.message}`);
          }
        },
        {
          batchSize: 5,
          pauseAfterBatch: 2000,
          retryCount: 2,
          retryDelay: 5000,
        }
      );
      
      // Record credit usage if any reviews were processed
      if (processedCount > 0) {
        await this.creditService.recordUsage({
          organizationId,
          feature: 'review-sentiment-batch',
          modelType: 'text',
          tokensUsed: processedCount * 1000, // Estimated token usage
        });
      }
      
      return processedCount;
    } catch (error) {
      this.logger.error(`Error processing sentiment analysis batch: ${error.message}`, error.stack);
      return 0;
    }
  }
}