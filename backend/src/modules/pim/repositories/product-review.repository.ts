import { Injectable, Logger } from '@nestjs/common';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { ProductReview, ProductReviewStatus } from '../models/product-review.model';
import { v4 as uuidv4 } from 'uuid';
import { FirestoreAdvancedFilter } from '../../../common/repositories/base';
import { TransactionContext } from '../../../types/google-cloud.types';

/**
 * Enhanced model to ensure ProductReview matches FirestoreEntity requirements
 */
export interface ProductReviewEntity extends ProductReview {
  id: string; // Make id required instead of optional
  isDeleted?: boolean; // Add soft-delete flag for repository operations
  version?: number; // Add version for optimistic locking
}

/**
 * Repository for product reviews
 * Implements operations for storing and retrieving product reviews
 * with South African optimizations including load shedding resilience
 */
@Injectable()
export class ProductReviewRepository extends FirestoreBaseRepository<ProductReviewEntity> {
  protected readonly logger = new Logger(ProductReviewRepository.name);
  
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'product-reviews', {
      enableCache: true,
      cacheTTLMs: 1800000, // 30 minutes
      useSoftDeletes: true,
      useVersioning: true,
    });
  }
  
  /**
   * Create a new product review
   * @param review Review data
   */
  async create(review: Omit<ProductReviewEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductReviewEntity> {
    try {
      const newReview: Omit<ProductReviewEntity, 'id' | 'createdAt' | 'updatedAt'> = {
        ...review,
        // By default, reviews are in PENDING status unless explicitly set
        status: review.status || ProductReviewStatus.PENDING,
        // Initialize helpfulness counts
        helpfulCount: review.helpfulCount ?? 0,
        notHelpfulCount: review.notHelpfulCount ?? 0,
        reportCount: review.reportCount ?? 0,
      };
      
      return await super.create(newReview);
    } catch (error) {
      this.logger.error(`Error creating product review: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Update a product review
   * @param id Review ID
   * @param data Updated review data
   */
  async update(
    id: string,
    data: Partial<Omit<ProductReviewEntity, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ProductReviewEntity> {
    try {
      // Set updated date
      const updateData: Partial<Omit<ProductReviewEntity, 'id' | 'createdAt' | 'updatedAt'>> = { ...data };
      
      // If status is changing to APPROVED, set published date
      if (data.status === ProductReviewStatus.APPROVED) {
        const review = await this.findById(id);
        if (review && review.status !== ProductReviewStatus.APPROVED) {
          updateData.publishedDate = new Date();
        }
      }
      
      return await super.update(id, updateData);
    } catch (error) {
      this.logger.error(`Error updating product review: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Find reviews by product ID
   * @param productId Product ID
   * @param options Optional filter options
   */
  async findByProductId(
    productId: string,
    options?: {
      status?: ProductReviewStatus;
      limit?: number;
      offset?: number;
      sortField?: string;
      sortDirection?: 'asc' | 'desc';
    },
  ): Promise<ProductReviewEntity[]> {
    try {
      const defaultOptions = {
        limit: 50,
        offset: 0,
        sortField: 'submittedDate',
        sortDirection: 'desc' as 'asc' | 'desc',
      };
      
      const { status, limit, offset, sortField, sortDirection } = {
        ...defaultOptions,
        ...options,
      };
      
      // Construct advanced filters array
      const advancedFilters: FirestoreAdvancedFilter<ProductReviewEntity>[] = [
        { field: 'productId', operator: '==', value: productId },
      ];
      
      // Add status filter if provided
      if (status) {
        advancedFilters.push({ field: 'status', operator: '==', value: status });
      }
      
      return await this.find({
        advancedFilters,
        queryOptions: {
          limit,
          offset,
          orderBy: sortField,
          direction: sortDirection,
        },
      });
    } catch (error) {
      this.logger.error(`Error finding reviews by product ID: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Find reviews by organization ID
   * @param organizationId Organization ID
   * @param options Query options
   */
  async findByOrganizationId(
    organizationId: string,
    options?: {
      status?: ProductReviewStatus;
      limit?: number;
      offset?: number;
      sortField?: string;
      sortDirection?: 'asc' | 'desc';
    },
  ): Promise<ProductReviewEntity[]> {
    try {
      const defaultOptions = {
        limit: 50,
        offset: 0,
        sortField: 'submittedDate',
        sortDirection: 'desc' as 'asc' | 'desc',
      };
      
      const { status, limit, offset, sortField, sortDirection } = {
        ...defaultOptions,
        ...options,
      };
      
      // Construct filters
      const advancedFilters: FirestoreAdvancedFilter<ProductReviewEntity>[] = [
        { field: 'organizationId', operator: '==', value: organizationId },
      ];
      
      if (status) {
        advancedFilters.push({ field: 'status', operator: '==', value: status });
      }
      
      return await this.find({
        advancedFilters,
        queryOptions: {
          limit,
          offset,
          orderBy: sortField,
          direction: sortDirection,
        },
      });
    } catch (error) {
      this.logger.error(`Error finding reviews by organization ID: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Find pending reviews by organization ID
   * @param organizationId Organization ID
   * @param limit Max number of reviews to return
   */
  async findPendingReviews(organizationId: string, limit: number = 50): Promise<ProductReviewEntity[]> {
    return this.findByOrganizationId(organizationId, {
      status: ProductReviewStatus.PENDING,
      limit,
      sortField: 'submittedDate',
      sortDirection: 'asc',
    });
  }
  
  /**
   * Find approved reviews by multiple product IDs
   * @param productIds Array of product IDs
   * @param limit Max number of reviews to return per product
   */
  async findApprovedReviewsByProductIds(
    productIds: string[],
    limit: number = 5,
  ): Promise<Record<string, ProductReviewEntity[]>> {
    try {
      if (!productIds.length) {
        return {};
      }
      
      // Construct advanced filters
      const advancedFilters: FirestoreAdvancedFilter<ProductReviewEntity>[] = [
        { field: 'productId', operator: 'in', value: productIds },
        { field: 'status', operator: '==', value: ProductReviewStatus.APPROVED },
      ];
      
      const reviews = await this.find({
        advancedFilters,
        queryOptions: {
          limit: productIds.length * limit,
          orderBy: 'submittedDate',
          direction: 'desc',
        },
      });
      
      // Group reviews by product ID
      const reviewsByProduct: Record<string, ProductReviewEntity[]> = {};
      
      // Initialize with empty arrays for all product IDs
      productIds.forEach(id => {
        reviewsByProduct[id] = [];
      });
      
      // Group reviews by product ID
      reviews.forEach(review => {
        const productId = review.productId;
        
        if (reviewsByProduct[productId] && reviewsByProduct[productId].length < limit) {
          reviewsByProduct[productId].push(review);
        }
      });
      
      return reviewsByProduct;
    } catch (error) {
      this.logger.error(`Error finding reviews by product IDs: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Update review helpfulness counts
   * @param reviewId Review ID
   * @param helpful Whether the review was marked as helpful
   */
  async updateHelpfulCount(reviewId: string, helpful: boolean): Promise<void> {
    try {
      await this.runTransaction(async (transaction) => {
        // Get current review
        const review = await this.findById(reviewId, { transaction });
        
        if (!review) {
          throw new Error(`Review with ID ${reviewId} not found`);
        }
        
        // Update appropriate counter
        if (helpful) {
          await this.update(reviewId, {
            helpfulCount: (review.helpfulCount || 0) + 1,
          });
        } else {
          await this.update(reviewId, {
            notHelpfulCount: (review.notHelpfulCount || 0) + 1,
          });
        }
      });
    } catch (error) {
      this.logger.error(`Error updating helpfulness count: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Increment the report count for a review
   * @param reviewId Review ID
   */
  async incrementReportCount(reviewId: string): Promise<void> {
    try {
      await this.runTransaction(async (transaction) => {
        // Get current review
        const review = await this.findById(reviewId, { transaction });
        
        if (!review) {
          throw new Error(`Review with ID ${reviewId} not found`);
        }
        
        // Increment report count
        const newReportCount = (review.reportCount || 0) + 1;
        
        // Auto-flag if report count exceeds threshold
        const autoFlagThreshold = 5; // This could be configurable
        const newStatus = newReportCount >= autoFlagThreshold && 
          review.status === ProductReviewStatus.APPROVED
          ? ProductReviewStatus.FLAGGED
          : review.status;
        
        await this.update(reviewId, {
          reportCount: newReportCount,
          status: newStatus,
        });
      });
    } catch (error) {
      this.logger.error(`Error incrementing report count: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Calculate review statistics for a product
   * @param productId Product ID
   */
  async calculateReviewStatistics(productId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
    recommendedPercentage: number;
  }> {
    try {
      // Get all approved reviews for the product
      const reviews = await this.findByProductId(productId, {
        status: ProductReviewStatus.APPROVED,
        limit: 1000, // High limit to get all reviews
      });
      
      // Initialize statistics
      let totalRating = 0;
      const ratingDistribution: Record<number, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };
      
      let recommendedCount = 0;
      let recommendedTotal = 0;
      
      // Calculate statistics
      for (const review of reviews) {
        totalRating += review.rating;
        ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
        
        if (review.recommended !== undefined) {
          recommendedTotal++;
          if (review.recommended) {
            recommendedCount++;
          }
        }
      }
      
      // Calculate averages
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
      const recommendedPercentage = recommendedTotal > 0 
        ? (recommendedCount / recommendedTotal) * 100 
        : 0;
      
      return {
        averageRating,
        totalReviews,
        ratingDistribution,
        recommendedPercentage,
      };
    } catch (error) {
      this.logger.error(`Error calculating review statistics: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Find reviews that need AI sentiment analysis
   * @param organizationId Organization ID
   * @param limit Maximum number of reviews to return
   */
  async findReviewsForSentimentAnalysis(
    organizationId: string,
    limit: number = 50,
  ): Promise<ProductReviewEntity[]> {
    try {
      const advancedFilters: FirestoreAdvancedFilter<ProductReviewEntity>[] = [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'status', operator: '==', value: ProductReviewStatus.APPROVED },
        { field: 'sentiment', operator: '==', value: null },
      ];
      
      return this.find({
        advancedFilters,
        queryOptions: {
          limit,
          orderBy: 'submittedDate',
          direction: 'asc',
        },
      });
    } catch (error) {
      this.logger.error(`Error finding reviews for sentiment analysis: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Count reviews by status for an organization
   * @param organizationId Organization ID
   */
  async countReviewsByStatus(
    organizationId: string
  ): Promise<Record<ProductReviewStatus, number>> {
    try {
      // Initialize counts for all statuses
      const statusCounts: Record<ProductReviewStatus, number> = {
        [ProductReviewStatus.PENDING]: 0,
        [ProductReviewStatus.APPROVED]: 0,
        [ProductReviewStatus.REJECTED]: 0,
        [ProductReviewStatus.FLAGGED]: 0,
        [ProductReviewStatus.FEATURED]: 0,
      };
      
      // Query for counts by status
      const promises = Object.values(ProductReviewStatus).map(async (status) => {
        const count = await this.count({
          advancedFilters: [
            { field: 'organizationId', operator: '==', value: organizationId },
            { field: 'status', operator: '==', value: status },
          ],
        });
        statusCounts[status] = count;
      });
      
      await Promise.all(promises);
      
      return statusCounts;
    } catch (error) {
      this.logger.error(`Error counting reviews by status: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Search reviews by text content
   * @param organizationId Organization ID
   * @param searchText Text to search for
   * @param options Additional search options
   */
  async searchReviews(
    organizationId: string,
    searchText: string,
    options?: {
      status?: ProductReviewStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<ProductReviewEntity[]> {
    try {
      // Note: This is a simplified implementation that searches in title and content
      // In a real-world scenario, you would use a dedicated search service like Elasticsearch
      
      const defaultOptions = {
        limit: 50,
        offset: 0,
      };
      
      const { status, limit, offset } = {
        ...defaultOptions,
        ...options,
      };
      
      // Construct advanced filters
      const advancedFilters: FirestoreAdvancedFilter<ProductReviewEntity>[] = [
        { field: 'organizationId', operator: '==', value: organizationId },
      ];
      
      // Add status filter if provided
      if (status) {
        advancedFilters.push({ field: 'status', operator: '==', value: status });
      }
      
      // First get all reviews matching the organization and status
      const reviews = await this.find({
        advancedFilters,
        queryOptions: {
          limit: 1000, // Higher limit for text search
          orderBy: 'submittedDate',
          direction: 'desc',
        },
      });
      
      // Then filter by text content client-side
      const filteredReviews = reviews.filter((review) => {
        const titleMatch = review.title?.toLowerCase().includes(searchText.toLowerCase());
        const contentMatch = review.content?.toLowerCase().includes(searchText.toLowerCase());
        return titleMatch || contentMatch;
      });
      
      // Apply pagination
      return filteredReviews.slice(offset, offset + limit);
    } catch (error) {
      this.logger.error(`Error searching reviews: ${error.message}`, error.stack);
      throw error;
    }
  }
}