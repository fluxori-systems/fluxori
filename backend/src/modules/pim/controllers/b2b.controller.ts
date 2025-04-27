/**
 * B2B Controller
 *
 * API endpoints for B2B functionality including customer management,
 * tiering, pricing, contracts, and purchase orders.
 */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  ClassSerializerInterceptor,
  ValidationPipe,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { FirebaseAuthGuard } from '../../auth';
import { CustomerContract, ContractStatus } from '../models/b2b/contract.model';
import {
  CustomerTier,
  CustomerTierType,
  CustomerGroup,
} from '../models/b2b/customer-tier.model';
import {
  B2BCustomer,
  B2BCustomerStatus,
  B2BAccountType,
  CreditStatus,
} from '../models/b2b/customer.model';
import {
  B2BPriceList,
  PriceListType,
  PriceListEntry,
} from '../models/b2b/price-list.model';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  ApprovalWorkflow,
} from '../models/b2b/purchase-order.model';
import { B2BService } from '../services/b2b/b2b-service';

/**
 * B2B API controller
 */
@Controller('pim/b2b')
@UseGuards(FirebaseAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class B2BController {
  private readonly logger = new Logger(B2BController.name);

  constructor(private readonly b2bService: B2BService) {}

  /*
   * Customer Management Endpoints
   */

  /**
   * Create a new B2B customer
   * @param customer The customer data
   * @returns The created customer
   */
  @Post('customers')
  async createCustomer(
    @Body(new ValidationPipe({ transform: true })) customer: B2BCustomer,
    @Request() req: any,
  ): Promise<B2BCustomer> {
    try {
      // Set organization ID from authenticated user if not provided
      if (!customer.organizationId) {
        customer.organizationId = req.user.organizationId;
      }

      return await this.b2bService.createCustomer(customer);
    } catch (error) {
      this.logger.error(
        `Failed to create B2B customer: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create B2B customer: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get B2B customer by ID
   * @param id The customer ID
   * @returns The customer
   */
  @Get('customers/:id')
  async getCustomer(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<B2BCustomer> {
    try {
      return await this.b2bService.findCustomerById(id);
    } catch (error) {
      this.logger.error(
        `Failed to get B2B customer: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get B2B customer: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Update B2B customer
   * @param id The customer ID
   * @param updates The updates to apply
   * @returns The updated customer
   */
  @Patch('customers/:id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() updates: Partial<B2BCustomer>,
    @Request() req: any,
  ): Promise<B2BCustomer> {
    try {
      // Ensure we can't update the organization ID
      if (updates.organizationId) {
        delete updates.organizationId;
      }

      return await this.b2bService.updateCustomer(id, updates);
    } catch (error) {
      this.logger.error(
        `Failed to update B2B customer: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to update B2B customer: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Find customers by various criteria
   * @param query Query parameters
   * @returns Array of matching customers
   */
  @Get('customers')
  async findCustomers(
    @Request() req: any,
    @Query('tierId') tierId?: string,
    @Query('groupId') groupId?: string,
    @Query('status') status?: B2BCustomerStatus,
    @Query('accountType') accountType?: B2BAccountType,
    @Query('creditStatus') creditStatus?: CreditStatus,
    @Query('marketRegion') marketRegion?: string,
  ): Promise<B2BCustomer[]> {
    try {
      const organizationId = req.user.organizationId;

      return await this.b2bService.findCustomers(
        {
          tierId,
          groupId,
          status,
          accountType,
          creditStatus,
          marketRegion,
        },
        organizationId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to find B2B customers: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to find B2B customers: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /*
   * Customer Tier Endpoints
   */

  /**
   * Create a customer tier
   * @param tier The tier data
   * @returns The created tier
   */
  @Post('tiers')
  async createTier(
    @Body(new ValidationPipe({ transform: true })) tier: CustomerTier,
    @Request() req: any,
  ): Promise<CustomerTier> {
    try {
      // Set organization ID from authenticated user if not provided
      if (!tier.organizationId) {
        tier.organizationId = req.user.organizationId;
      }

      return await this.b2bService.createCustomerTier(tier);
    } catch (error) {
      this.logger.error(
        `Failed to create customer tier: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create customer tier: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Assign customer to tier
   * @param customerId The customer ID
   * @param tierId The tier ID
   * @returns The updated customer
   */
  @Post('customers/:customerId/tiers/:tierId')
  async assignCustomerToTier(
    @Param('customerId') customerId: string,
    @Param('tierId') tierId: string,
  ): Promise<B2BCustomer> {
    try {
      return await this.b2bService.assignCustomerToTier(customerId, tierId);
    } catch (error) {
      this.logger.error(
        `Failed to assign customer to tier: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to assign customer to tier: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Create a customer group
   * @param group The group data
   * @returns The created group
   */
  @Post('groups')
  async createGroup(
    @Body(new ValidationPipe({ transform: true })) group: CustomerGroup,
    @Request() req: any,
  ): Promise<CustomerGroup> {
    try {
      // Set organization ID from authenticated user if not provided
      if (!group.organizationId) {
        group.organizationId = req.user.organizationId;
      }

      return await this.b2bService.createCustomerGroup(group);
    } catch (error) {
      this.logger.error(
        `Failed to create customer group: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create customer group: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Add customer to group
   * @param customerId The customer ID
   * @param groupId The group ID
   * @returns The updated group
   */
  @Post('customers/:customerId/groups/:groupId')
  async addCustomerToGroup(
    @Param('customerId') customerId: string,
    @Param('groupId') groupId: string,
  ): Promise<CustomerGroup> {
    try {
      return await this.b2bService.addCustomerToGroup(customerId, groupId);
    } catch (error) {
      this.logger.error(
        `Failed to add customer to group: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to add customer to group: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /*
   * Price List Endpoints
   */

  /**
   * Create a B2B price list
   * @param priceList The price list data
   * @returns The created price list
   */
  @Post('price-lists')
  async createPriceList(
    @Body(new ValidationPipe({ transform: true })) priceList: B2BPriceList,
    @Request() req: any,
  ): Promise<B2BPriceList> {
    try {
      // Set organization ID from authenticated user if not provided
      if (!priceList.organizationId) {
        priceList.organizationId = req.user.organizationId;
      }

      return await this.b2bService.createPriceList(priceList);
    } catch (error) {
      this.logger.error(
        `Failed to create price list: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create price list: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Add product to price list
   * @param priceListId The price list ID
   * @param productEntry The product price entry
   * @returns The updated price list
   */
  @Post('price-lists/:priceListId/products')
  async addProductToPriceList(
    @Param('priceListId') priceListId: string,
    @Body() productEntry: PriceListEntry,
  ): Promise<B2BPriceList> {
    try {
      return await this.b2bService.addProductToPriceList(
        priceListId,
        productEntry,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add product to price list: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to add product to price list: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get price lists for a customer
   * @param customerId The customer ID
   * @returns Array of applicable price lists
   */
  @Get('customers/:customerId/price-lists')
  async getCustomerPriceLists(
    @Param('customerId') customerId: string,
    @Request() req: any,
  ): Promise<B2BPriceList[]> {
    try {
      const organizationId = req.user.organizationId;
      return await this.b2bService.findPriceListsForCustomer(
        customerId,
        organizationId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get customer price lists: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get customer price lists: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /*
   * Contract Endpoints
   */

  /**
   * Create a B2B contract
   * @param contract The contract data
   * @returns The created contract
   */
  @Post('contracts')
  async createContract(
    @Body(new ValidationPipe({ transform: true })) contract: CustomerContract,
    @Request() req: any,
  ): Promise<CustomerContract> {
    try {
      // Set organization ID from authenticated user if not provided
      if (!contract.organizationId) {
        contract.organizationId = req.user.organizationId;
      }

      return await this.b2bService.createContract(contract);
    } catch (error) {
      this.logger.error(
        `Failed to create contract: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create contract: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Update contract status
   * @param contractId The contract ID
   * @param body The update data
   * @returns The updated contract
   */
  @Patch('contracts/:contractId/status')
  async updateContractStatus(
    @Param('contractId') contractId: string,
    @Body() body: { status: ContractStatus; reason?: string },
  ): Promise<CustomerContract> {
    try {
      return await this.b2bService.updateContractStatus(
        contractId,
        body.status,
        body.reason,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update contract status: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to update contract status: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get active contracts for a customer
   * @param customerId The customer ID
   * @returns Array of active contracts
   */
  @Get('customers/:customerId/contracts')
  async getCustomerContracts(
    @Param('customerId') customerId: string,
    @Request() req: any,
  ): Promise<CustomerContract[]> {
    try {
      const organizationId = req.user.organizationId;
      return await this.b2bService.findActiveContractsForCustomer(
        customerId,
        organizationId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get customer contracts: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get customer contracts: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Find contracts expiring soon
   * @param days Number of days in the future
   * @returns Array of contracts expiring soon
   */
  @Get('contracts/expiring')
  async getContractsExpiringSoon(
    @Query('days') days: number = 30,
    @Request() req: any,
  ): Promise<CustomerContract[]> {
    try {
      const organizationId = req.user.organizationId;
      return await this.b2bService.findContractsExpiringSoon(
        days,
        organizationId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get expiring contracts: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get expiring contracts: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /*
   * B2B Pricing Endpoints
   */

  /**
   * Calculate B2B price for a product
   * @param productId The product ID
   * @param customerId The customer ID
   * @param quantity Optional quantity
   * @param contractId Optional specific contract ID
   * @returns The calculated price
   */
  @Get('pricing/:productId/:customerId')
  async calculateB2BPrice(
    @Param('productId') productId: string,
    @Param('customerId') customerId: string,
    @Query('quantity') quantity?: number,
    @Query('contractId') contractId?: string,
    @Query('currencyCode') currencyCode?: string,
    @Query('market') market?: string,
  ): Promise<any> {
    try {
      return await this.b2bService.calculateB2BPrice(productId, customerId, {
        quantity: quantity ? parseInt(quantity.toString(), 10) : undefined,
        contractId,
        currencyCode,
        market,
      });
    } catch (error) {
      this.logger.error(
        `Failed to calculate B2B price: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to calculate B2B price: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /*
   * Purchase Order Endpoints
   */

  /**
   * Create a purchase order
   * @param order The purchase order data
   * @returns The created order
   */
  @Post('orders')
  async createPurchaseOrder(
    @Body(new ValidationPipe({ transform: true })) order: PurchaseOrder,
    @Request() req: any,
  ): Promise<PurchaseOrder> {
    try {
      // Set organization ID and user ID from authenticated user if not provided
      if (!order.organizationId) {
        order.organizationId = req.user.organizationId;
      }

      if (!order.createdBy) {
        order.createdBy = req.user.uid;
      }

      return await this.b2bService.createPurchaseOrder(order);
    } catch (error) {
      this.logger.error(
        `Failed to create purchase order: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create purchase order: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Submit a purchase order for approval
   * @param orderId The order ID
   * @returns The updated order
   */
  @Post('orders/:orderId/submit')
  async submitOrderForApproval(
    @Param('orderId') orderId: string,
    @Request() req: any,
  ): Promise<PurchaseOrder> {
    try {
      const userId = req.user.uid;
      const userName = req.user.name || req.user.email || 'Unknown User';

      return await this.b2bService.submitPurchaseOrderForApproval(
        orderId,
        userId,
        userName,
      );
    } catch (error) {
      this.logger.error(
        `Failed to submit order for approval: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to submit order for approval: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Approve a purchase order
   * @param orderId The order ID
   * @param body The approval data
   * @returns The updated order
   */
  @Post('orders/:orderId/approve')
  async approveOrder(
    @Param('orderId') orderId: string,
    @Body() body: { comments?: string },
    @Request() req: any,
  ): Promise<PurchaseOrder> {
    try {
      const userId = req.user.uid;
      const userName = req.user.name || req.user.email || 'Unknown User';

      return await this.b2bService.approvePurchaseOrder(
        orderId,
        userId,
        userName,
        body.comments,
      );
    } catch (error) {
      this.logger.error(
        `Failed to approve order: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to approve order: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get orders pending approval
   * @returns Array of orders pending approval
   */
  @Get('orders/pending-approval')
  async getOrdersPendingApproval(
    @Request() req: any,
  ): Promise<PurchaseOrder[]> {
    try {
      const organizationId = req.user.organizationId;
      return await this.b2bService.findOrdersPendingApproval(organizationId);
    } catch (error) {
      this.logger.error(
        `Failed to get orders pending approval: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get orders pending approval: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get orders pending approval by a specific approver
   * @returns Array of orders pending approval by the approver
   */
  @Get('orders/pending-my-approval')
  async getOrdersPendingMyApproval(
    @Request() req: any,
  ): Promise<PurchaseOrder[]> {
    try {
      const organizationId = req.user.organizationId;
      const userId = req.user.uid;

      return await this.b2bService.findOrdersPendingApprovalByApprover(
        userId,
        organizationId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get orders pending my approval: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get orders pending my approval: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get orders for a customer
   * @param customerId The customer ID
   * @param status Optional status filter
   * @returns Array of orders for the customer
   */
  @Get('customers/:customerId/orders')
  async getCustomerOrders(
    @Param('customerId') customerId: string,
    @Request() req: any,
    @Query('status') status?: PurchaseOrderStatus,
  ): Promise<PurchaseOrder[]> {
    try {
      const organizationId = req.user.organizationId;

      return await this.b2bService.findCustomerOrders(
        customerId,
        organizationId,
        status,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get customer orders: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get customer orders: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
