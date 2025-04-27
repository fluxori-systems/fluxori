import { Injectable, Logger } from "@nestjs/common";

/**
 * Service stub for import/export operations in PIM module
 */
@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor() {}

  /**
   * Import data (stub)
   */
  async importData(_params: any): Promise<any> {
    this.logger.warn("importData not implemented");
    return {};
  }

  /**
   * Export data (stub)
   */
  async exportData(_params: any): Promise<any> {
    this.logger.warn("exportData not implemented");
    return {};
  }
}
