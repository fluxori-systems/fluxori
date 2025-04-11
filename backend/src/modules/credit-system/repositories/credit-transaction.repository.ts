import { Injectable } from "@nestjs/common";

import { FirestoreBaseRepository } from "../../../common/repositories/firestore-base.repository";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { CreditTransaction, CreditUsageType } from "../interfaces/types";

/**
 * Repository for credit transactions
 */
@Injectable()
export class CreditTransactionRepository extends FirestoreBaseRepository<CreditTransaction> {
  protected readonly collectionName = "credit_transactions";

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "credit_transactions", {
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 2 * 60 * 1000, // 2 minutes
      requiredFields: ["organizationId", "amount", "transactionType", "usageType"],
    });
  }

  /**
   * Find transactions by organization
   * @param organizationId Organization ID
   * @param limit Maximum number of transactions to return
   * @returns Array of transactions
   */
  async findByOrganization(
    organizationId: string,
    limit?: number,
  ): Promise<CreditTransaction[]> {
    return this.find({
      filter: { organizationId } as Partial<CreditTransaction>,
      queryOptions: {
        orderBy: "createdAt",
        direction: "desc",
        limit: limit || 100,
      },
    });
  }

  /**
   * Find transactions by user
   * @param organizationId Organization ID
   * @param userId User ID
   * @param limit Maximum number of transactions to return
   * @returns Array of transactions
   */
  async findByUser(
    organizationId: string,
    userId: string,
    limit?: number,
  ): Promise<CreditTransaction[]> {
    return this.find({
      filter: { 
        organizationId,
        userId,
      } as Partial<CreditTransaction>,
      queryOptions: {
        orderBy: "createdAt",
        direction: "desc",
        limit: limit || 50,
      },
    });
  }

  /**
   * Find transactions by usage type
   * @param organizationId Organization ID
   * @param usageType Usage type
   * @param limit Maximum number of transactions to return
   * @returns Array of transactions
   */
  async findByUsageType(
    organizationId: string,
    usageType: CreditUsageType,
    limit?: number,
  ): Promise<CreditTransaction[]> {
    return this.find({
      filter: { 
        organizationId,
        usageType,
      } as Partial<CreditTransaction>,
      queryOptions: {
        orderBy: "createdAt",
        direction: "desc",
        limit: limit || 50,
      },
    });
  }

  /**
   * Find transactions by model
   * @param organizationId Organization ID
   * @param modelId Model ID
   * @param limit Maximum number of transactions to return
   * @returns Array of transactions
   */
  async findByModel(
    organizationId: string,
    modelId: string,
    limit?: number,
  ): Promise<CreditTransaction[]> {
    return this.find({
      filter: { 
        organizationId,
        modelId,
      } as Partial<CreditTransaction>,
      queryOptions: {
        orderBy: "createdAt",
        direction: "desc",
        limit: limit || 50,
      },
    });
  }

  /**
   * Get sum of transactions by type
   * @param organizationId Organization ID
   * @param transactionType Transaction type (credit or debit)
   * @param usageType Optional usage type filter
   * @param startDate Optional start date for range
   * @param endDate Optional end date for range
   * @returns Sum of transaction amounts
   */
  async getSumByType(
    organizationId: string,
    transactionType: "credit" | "debit",
    usageType?: CreditUsageType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const filter: Record<string, any> = {
      organizationId,
      transactionType,
    };

    if (usageType) {
      filter.usageType = usageType;
    }

    const transactions = await this.find({
      filter: filter as Partial<CreditTransaction>,
    });

    // Filter by date range if provided
    let filteredTransactions = transactions;
    if (startDate || endDate) {
      filteredTransactions = transactions.filter((transaction) => {
        // Handle different date types, including Firestore Timestamp
      let createdAt: Date;
      if (transaction.createdAt instanceof Date) {
        createdAt = transaction.createdAt;
      } else if (typeof transaction.createdAt === 'string' || typeof transaction.createdAt === 'number') {
        createdAt = new Date(transaction.createdAt);
      } else if (transaction.createdAt && typeof transaction.createdAt.toDate === 'function') {
        // Handle Firestore Timestamp
        createdAt = transaction.createdAt.toDate();
      } else {
        createdAt = new Date(); // Fallback
      }
        
        if (startDate && createdAt < startDate) {
          return false;
        }
        
        if (endDate && createdAt > endDate) {
          return false;
        }
        
        return true;
      });
    }

    // Sum the amounts
    return filteredTransactions.reduce((sum, transaction) => {
      return sum + transaction.amount;
    }, 0);
  }
}