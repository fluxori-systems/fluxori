import { Injectable, Logger } from '@nestjs/common';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { FirestoreEntity } from '../../../types/google-cloud.types';

/**
 * Credit Transaction entity for Firestore
 */
interface CreditTransaction extends FirestoreEntity {
  organizationId: string;
  userId: string;
  amount: number;
  balance: number;
  type: 'purchase' | 'usage' | 'refund' | 'expiration' | 'bonus';
  description: string;
  metadata?: Record<string, any>;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

/**
 * Credit Balance entity for Firestore
 */
interface CreditBalance extends FirestoreEntity {
  organizationId: string;
  currentBalance: number;
  lifetimeCredits: number;
  lifetimeUsage: number;
  lastUpdated: Date;
}

/**
 * Repository for credit transactions
 */
@Injectable()
class CreditTransactionRepository extends FirestoreBaseRepository<CreditTransaction> {
  protected readonly collectionName = 'credit_transactions';
  
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, {
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000,
      requiredFields: ['organizationId', 'userId', 'amount', 'type'],
    });
  }
  
  /**
   * Find transactions by organization
   * @param organizationId Organization ID
   * @returns Array of transactions
   */
  async findByOrganization(organizationId: string): Promise<CreditTransaction[]> {
    return this.findAll({ organizationId }, {
      orderBy: 'createdAt',
      direction: 'desc'
    });
  }
  
  /**
   * Find transactions by user
   * @param userId User ID
   * @returns Array of transactions
   */
  async findByUser(userId: string): Promise<CreditTransaction[]> {
    return this.findAll({ userId }, {
      orderBy: 'createdAt',
      direction: 'desc'
    });
  }
}

/**
 * Repository for credit balances
 */
@Injectable()
class CreditBalanceRepository extends FirestoreBaseRepository<CreditBalance> {
  protected readonly collectionName = 'credit_balances';
  
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, {
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 2 * 60 * 1000,
      requiredFields: ['organizationId', 'currentBalance'],
    });
  }
  
  /**
   * Find balance by organization
   * @param organizationId Organization ID
   * @returns Credit balance or null if not found
   */
  async findByOrganization(organizationId: string): Promise<CreditBalance | null> {
    const results = await this.findAll({ organizationId });
    return results.length > 0 ? results[0] : null;
  }
}

/**
 * DTO for adding credits
 */
export interface AddCreditsDto {
  organizationId: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'bonus';
  description: string;
  metadata?: Record<string, any>;
}

/**
 * DTO for using credits
 */
export interface UseCreditsDto {
  organizationId: string;
  userId: string;
  amount: number;
  description: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for AI credit system operations
 */
@Injectable()
export class CreditSystemService {
  private readonly logger = new Logger(CreditSystemService.name);
  private readonly transactionRepository: CreditTransactionRepository;
  private readonly balanceRepository: CreditBalanceRepository;
  
  constructor(private readonly firestoreConfigService: FirestoreConfigService) {
    this.transactionRepository = new CreditTransactionRepository(firestoreConfigService);
    this.balanceRepository = new CreditBalanceRepository(firestoreConfigService);
  }
  
  /**
   * Add credits to an organization
   * @param addCreditsDto Credit addition data
   * @returns Updated balance
   */
  async addCredits(addCreditsDto: AddCreditsDto): Promise<number> {
    this.logger.log(`Adding ${addCreditsDto.amount} credits for organization ${addCreditsDto.organizationId}`);
    
    return this.firestoreConfigService.getFirestore().runTransaction(async (transaction) => {
      // Get or create balance document
      let balance = await this.balanceRepository.findByOrganization(addCreditsDto.organizationId);
      
      if (!balance) {
        // Create a new balance record
        balance = await this.balanceRepository.create({
          organizationId: addCreditsDto.organizationId,
          currentBalance: 0,
          lifetimeCredits: 0,
          lifetimeUsage: 0,
          lastUpdated: new Date()
        });
      }
      
      // Update the balance
      const newBalance = balance.currentBalance + addCreditsDto.amount;
      const newLifetimeCredits = balance.lifetimeCredits + addCreditsDto.amount;
      
      // Update balance in database
      const balanceCollectionName = this.balanceRepository['collectionName'];
      const balanceRef = this.firestoreConfigService.getDocument(balanceCollectionName, balance.id);
      transaction.update(balanceRef, {
        currentBalance: newBalance,
        lifetimeCredits: newLifetimeCredits,
        lastUpdated: new Date()
      });
      
      // Create transaction record
      const transactionData: Omit<CreditTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
        organizationId: addCreditsDto.organizationId,
        userId: addCreditsDto.userId,
        amount: addCreditsDto.amount,
        balance: newBalance,
        type: addCreditsDto.type,
        description: addCreditsDto.description,
        metadata: addCreditsDto.metadata
      };
      
      const transactionCollectionName = this.transactionRepository['collectionName'];
      const transactionRef = this.firestoreConfigService.getCollection(transactionCollectionName).doc();
      transaction.set(transactionRef, {
        ...transactionData,
        id: transactionRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return newBalance;
    });
  }
  
  /**
   * Use credits for an AI operation
   * @param useCreditsDto Credit usage data
   * @returns Remaining balance
   * @throws Error if insufficient credits
   */
  async useCredits(useCreditsDto: UseCreditsDto): Promise<number> {
    this.logger.log(`Using ${useCreditsDto.amount} credits for organization ${useCreditsDto.organizationId}`);
    
    return this.firestoreConfigService.getFirestore().runTransaction(async (transaction) => {
      // Get balance document
      const balance = await this.balanceRepository.findByOrganization(useCreditsDto.organizationId);
      
      if (!balance) {
        throw new Error(`No credit balance found for organization ${useCreditsDto.organizationId}`);
      }
      
      // Check if enough credits
      if (balance.currentBalance < useCreditsDto.amount) {
        throw new Error(`Insufficient credits. Required: ${useCreditsDto.amount}, Available: ${balance.currentBalance}`);
      }
      
      // Update the balance
      const newBalance = balance.currentBalance - useCreditsDto.amount;
      const newLifetimeUsage = balance.lifetimeUsage + useCreditsDto.amount;
      
      // Update balance in database
      const balanceCollectionName = this.balanceRepository['collectionName'];
      const balanceRef = this.firestoreConfigService.getDocument(balanceCollectionName, balance.id);
      transaction.update(balanceRef, {
        currentBalance: newBalance,
        lifetimeUsage: newLifetimeUsage,
        lastUpdated: new Date()
      });
      
      // Create transaction record
      const transactionData: Omit<CreditTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
        organizationId: useCreditsDto.organizationId,
        userId: useCreditsDto.userId,
        amount: -useCreditsDto.amount, // Negative amount for usage
        balance: newBalance,
        type: 'usage',
        description: useCreditsDto.description,
        relatedEntityId: useCreditsDto.relatedEntityId,
        relatedEntityType: useCreditsDto.relatedEntityType,
        metadata: useCreditsDto.metadata
      };
      
      const transactionCollectionName = this.transactionRepository['collectionName'];
      const transactionRef = this.firestoreConfigService.getCollection(transactionCollectionName).doc();
      transaction.set(transactionRef, {
        ...transactionData,
        id: transactionRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return newBalance;
    });
  }
  
  /**
   * Get an organization's current credit balance
   * @param organizationId Organization ID
   * @returns Current balance or 0 if not found
   */
  async getBalance(organizationId: string): Promise<number> {
    const balance = await this.balanceRepository.findByOrganization(organizationId);
    return balance ? balance.currentBalance : 0;
  }
  
  /**
   * Get detailed balance information
   * @param organizationId Organization ID
   * @returns Balance details or null if not found
   */
  async getBalanceDetails(organizationId: string): Promise<CreditBalance | null> {
    return this.balanceRepository.findByOrganization(organizationId);
  }
  
  /**
   * Get recent transactions for an organization
   * @param organizationId Organization ID
   * @param limit Maximum number of transactions to return
   * @returns Array of transactions
   */
  async getRecentTransactions(
    organizationId: string,
    limit: number = 10
  ): Promise<CreditTransaction[]> {
    const transactions = await this.transactionRepository.findByOrganization(organizationId);
    return transactions.slice(0, limit);
  }
  
  /**
   * Calculate estimated cost for an AI operation
   * @param modelName AI model name
   * @param inputTokens Number of input tokens
   * @param outputTokens Number of output tokens
   * @returns Estimated cost in credits
   */
  calculateCost(
    modelName: string,
    inputTokens: number,
    outputTokens: number = 0
  ): number {
    // This is a simplified implementation
    // Real implementation would have a pricing table for different models
    
    let inputTokenRate = 0;
    let outputTokenRate = 0;
    
    // Set rates based on model
    if (modelName.includes('gpt-4')) {
      inputTokenRate = 0.03;
      outputTokenRate = 0.06;
    } else if (modelName.includes('gpt-3.5')) {
      inputTokenRate = 0.0015;
      outputTokenRate = 0.002;
    } else if (modelName.includes('text-embedding')) {
      inputTokenRate = 0.0001;
      outputTokenRate = 0;
    } else if (modelName.includes('vertex')) {
      // Example for Google Vertex AI models
      inputTokenRate = 0.002;
      outputTokenRate = 0.01;
    } else {
      // Default rates
      inputTokenRate = 0.01;
      outputTokenRate = 0.02;
    }
    
    // Calculate cost - convert from dollars to credits (1:1 ratio in this example)
    const inputCost = inputTokens * inputTokenRate / 1000;
    const outputCost = outputTokens * outputTokenRate / 1000;
    
    // Convert to credits with minimum cost of 1 credit
    return Math.max(1, Math.ceil((inputCost + outputCost) * 100));
  }
}