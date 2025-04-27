import { Injectable, Logger } from "@nestjs/common";

/**
 * Stub service for regional warehouse operations
 */
@Injectable()
export class RegionalWarehouseService {
  private readonly logger = new Logger(RegionalWarehouseService.name);

  [key: string]: any;

  constructor() {
    this.logger.warn("RegionalWarehouseService stub initialized");
  }
}
