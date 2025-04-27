import { Injectable, Logger } from "@nestjs/common";

/**
 * Stub repository for B2B customers
 */
@Injectable()
export class B2BCustomerRepository {
  private readonly logger = new Logger(B2BCustomerRepository.name);

  constructor() {}

  async findByCustomerNumber(
    _customerNumber: string,
    _organizationId: string,
  ): Promise<any | null> {
    this.logger.warn("findByCustomerNumber not implemented");
    return null;
  }

  async findByTierId(
    _customerTierId: string,
    _organizationId: string,
  ): Promise<any[]> {
    this.logger.warn("findByTierId not implemented");
    return [];
  }

  async findByGroupId(
    _customerGroupId: string,
    _organizationId: string,
  ): Promise<any[]> {
    this.logger.warn("findByGroupId not implemented");
    return [];
  }

  async findByAccountType(
    _accountType: string,
    _organizationId: string,
  ): Promise<any[]> {
    this.logger.warn("findByAccountType not implemented");
    return [];
  }

  async findByStatus(_status: string, _organizationId: string): Promise<any[]> {
    this.logger.warn("findByStatus not implemented");
    return [];
  }

  async findByCreditStatus(
    _creditStatus: string,
    _organizationId: string,
  ): Promise<any[]> {
    this.logger.warn("findByCreditStatus not implemented");
    return [];
  }

  async findByMarketRegion(
    _marketRegion: string,
    _organizationId: string,
  ): Promise<any[]> {
    this.logger.warn("findByMarketRegion not implemented");
    return [];
  }

  async findByParentCompany(
    _parentCompanyId: string,
    _organizationId: string,
  ): Promise<any[]> {
    this.logger.warn("findByParentCompany not implemented");
    return [];
  }
}
