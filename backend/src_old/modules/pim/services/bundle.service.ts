import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class BundleService {
  private readonly logger = new Logger(BundleService.name);

  constructor() {}

  async createBundle(_dto: any, _organizationId: string): Promise<any> {
    this.logger.warn("createBundle not implemented");
    return {};
  }

  async getBundleById(_id: string, _organizationId: string): Promise<any> {
    this.logger.warn("getBundleById not implemented");
    return null;
  }

  async getAllBundles(_organizationId: string, _options?: any): Promise<any[]> {
    this.logger.warn("getAllBundles not implemented");
    return [];
  }

  async updateBundle(
    _id: string,
    _updateData: any,
    _organizationId: string,
  ): Promise<any> {
    this.logger.warn("updateBundle not implemented");
    return {};
  }

  async deleteBundle(_id: string, _organizationId: string): Promise<void> {
    this.logger.warn("deleteBundle not implemented");
  }
}
