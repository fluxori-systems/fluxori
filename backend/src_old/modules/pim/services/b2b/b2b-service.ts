import { Injectable, Logger } from "@nestjs/common";

/**
 * Stub service for B2B operations in PIM module
 * Supports any method dynamically
 */
@Injectable()
export class B2BService {
  private readonly logger = new Logger(B2BService.name);

  [key: string]: any;

  constructor() {
    this.logger.warn("B2BService stub initialized");
  }
}
