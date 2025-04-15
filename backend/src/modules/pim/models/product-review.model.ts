/**
 * Product review status enum
 * Defines the current status of a product review
 */
export enum ProductReviewStatus {
  /**
   * Review is pending moderation
   */
  PENDING = 'PENDING',
  
  /**
   * Review has been approved and is publicly visible
   */
  APPROVED = 'APPROVED',
  
  /**
   * Review has been rejected and is not publicly visible
   */
  REJECTED = 'REJECTED',
  
  /**
   * Review has been flagged for further review
   */
  FLAGGED = 'FLAGGED',
  
  /**
   * Review is featured (highlighted in listings)
   */
  FEATURED = 'FEATURED',
}

/**
 * Review source enum
 * Defines where the review originated from
 */
export enum ReviewSource {
  /**
   * Review created directly in Fluxori
   */
  INTERNAL = 'INTERNAL',
  
  /**
   * Review imported from a marketplace
   */
  MARKETPLACE = 'MARKETPLACE',
  
  /**
   * Review imported from a third-party review platform
   */
  THIRD_PARTY = 'THIRD_PARTY',
  
  /**
   * Review aggregated from multiple sources
   */
  AGGREGATED = 'AGGREGATED',
}

/**
 * Marketplace source for imported reviews
 */
export interface MarketplaceSource {
  /**
   * Marketplace name (e.g., "Takealot", "Amazon")
   */
  name: string;
  
  /**
   * External review ID in the source marketplace
   */
  reviewId: string;
  
  /**
   * URL of the review on the marketplace
   */
  url?: string;
  
  /**
   * Date the review was posted on the marketplace
   */
  postedDate: Date;
  
  /**
   * Whether the review is verified in the source platform
   */
  isVerified: boolean;
}

/**
 * Product review media (photos or videos)
 */
export interface ReviewMedia {
  /**
   * Media type (photo, video, etc.)
   */
  type: 'photo' | 'video';
  
  /**
   * URL to the media file
   */
  url: string;
  
  /**
   * Media thumbnail URL (if available)
   */
  thumbnailUrl?: string;
  
  /**
   * Caption or description of the media
   */
  caption?: string;
  
  /**
   * Original file name (if uploaded)
   */
  fileName?: string;
  
  /**
   * Content moderation status
   */
  moderationStatus?: 'approved' | 'pending' | 'rejected';
}

/**
 * Review sentiment analysis result
 */
export interface ReviewSentiment {
  /**
   * Overall sentiment score (-1.0 to 1.0, negative to positive)
   */
  score: number;
  
  /**
   * Confidence level of the sentiment analysis (0.0 to 1.0)
   */
  confidence: number;
  
  /**
   * Key positive aspects identified in the review
   */
  positiveAspects?: string[];
  
  /**
   * Key negative aspects identified in the review
   */
  negativeAspects?: string[];
  
  /**
   * Review topics/categories identified
   */
  topics?: string[];
  
  /**
   * Product features mentioned in the review
   */
  features?: string[];
}

/**
 * Review moderation result
 */
export interface ModerationResult {
  /**
   * Whether the review passed moderation
   */
  passed: boolean;
  
  /**
   * List of moderation issues
   */
  issues?: {
    /**
     * Type of issue (profanity, spam, etc.)
     */
    type: string;
    
    /**
     * Severity of the issue (low, medium, high)
     */
    severity: 'low' | 'medium' | 'high';
    
    /**
     * Description of the issue
     */
    description: string;
  }[];
  
  /**
   * Moderation action taken
   */
  action?: 'none' | 'flag' | 'reject' | 'edit';
  
  /**
   * Moderator user ID
   */
  moderatorId?: string;
  
  /**
   * Date of moderation
   */
  moderationDate?: Date;
  
  /**
   * Moderator notes
   */
  notes?: string;
}

/**
 * Product review model
 * Represents a customer review for a product
 */
export interface ProductReview {
  /**
   * Review ID (auto-generated)
   */
  id?: string;
  
  /**
   * Organization ID
   */
  organizationId: string;
  
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
   * Review media (photos/videos)
   */
  media?: ReviewMedia[];
  
  /**
   * Whether the reviewer recommends the product
   */
  recommended?: boolean;
  
  /**
   * Submitted by (customer name/handle)
   */
  reviewerName: string;
  
  /**
   * Reviewer email (optional, may be hashed for privacy)
   */
  reviewerEmail?: string;
  
  /**
   * User ID if the reviewer is a registered user
   */
  userId?: string;
  
  /**
   * Location of the reviewer (optional)
   */
  location?: string;
  
  /**
   * Whether the reviewer has verified purchase of the product
   */
  isVerifiedPurchase: boolean;
  
  /**
   * Order ID associated with the review (if verified purchase)
   */
  orderId?: string;
  
  /**
   * Review status
   */
  status: ProductReviewStatus;
  
  /**
   * Review source
   */
  source: ReviewSource;
  
  /**
   * Marketplace source details (for imported reviews)
   */
  marketplaceSource?: MarketplaceSource;
  
  /**
   * Sentiment analysis result
   */
  sentiment?: ReviewSentiment;
  
  /**
   * Helpfulness votes count (user found this review helpful)
   */
  helpfulCount: number;
  
  /**
   * Unhelpful votes count
   */
  notHelpfulCount: number;
  
  /**
   * Report/flag count (community reports)
   */
  reportCount: number;
  
  /**
   * Review moderation result
   */
  moderation?: ModerationResult;
  
  /**
   * Response from merchant/seller
   */
  merchantResponse?: {
    /**
     * Response content
     */
    content: string;
    
    /**
     * User who created the response
     */
    respondedBy: string;
    
    /**
     * Response date
     */
    respondedDate: Date;
    
    /**
     * Last updated date
     */
    updatedDate?: Date;
  };
  
  /**
   * Network awareness metadata
   */
  networkMetadata?: {
    /**
     * Whether the review was submitted during load shedding
     */
    submittedDuringLoadShedding?: boolean;
    
    /**
     * Network quality during submission
     */
    networkQuality?: 'low' | 'medium' | 'high';
    
    /**
     * Whether media was compressed during upload
     */
    mediaCompressed?: boolean;
  };
  
  /**
   * Feature-specific ratings (optional)
   */
  featureRatings?: Record<string, number>;
  
  /**
   * Tags applied to the review
   */
  tags?: string[];
  
  /**
   * Submission date
   */
  submittedDate: Date;
  
  /**
   * Publication date (when status became APPROVED)
   */
  publishedDate?: Date;
  
  /**
   * Last updated date
   */
  updatedDate?: Date;
  
  /**
   * Creation date
   */
  createdAt: Date;
  
  /**
   * Last update date
   */
  updatedAt: Date;
  
  /**
   * Created by user ID
   */
  createdBy?: string;
  
  /**
   * Last updated by user ID
   */
  updatedBy?: string;
}