import { Injectable, Logger } from "@nestjs/common";

/**
 * Stub service for product reviews
 * Provides dynamic method support to satisfy all calls
 */
@Injectable()
export class ProductReviewService {
  private readonly logger = new Logger(ProductReviewService.name);

  // Index signature to allow any method
  [key: string]: any;

  constructor() {
    this.logger.warn("ProductReviewService stub initialized");
  }
}
