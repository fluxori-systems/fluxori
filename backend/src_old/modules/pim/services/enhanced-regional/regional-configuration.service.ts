import { Injectable, Logger } from "@nestjs/common";

/**
 * Stub service for regional configuration operations
 */
@Injectable()
export class RegionalConfigurationService {
  private readonly logger = new Logger(RegionalConfigurationService.name);

  [key: string]: any;

  constructor() {
    this.logger.warn("RegionalConfigurationService stub initialized");
  }
}
