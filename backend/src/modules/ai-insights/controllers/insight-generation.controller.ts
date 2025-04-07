import {
  Controller,
  Post,
  Body,
  Logger,
  ForbiddenException
} from '@nestjs/common';
import { 
  InsightGenerationService, 
  GenerateInsightsRequest 
} from '../services/insight-generation.service';
import { AIAnalysisResult } from '../interfaces/types';
import { CreditSystemService } from '../services/credit-system.service';

/**
 * DTO for checking credit balance
 */
interface CheckBalanceDto {
  organizationId: string;
}

/**
 * Controller for insight generation endpoints
 */
@Controller('api/insight-generation')
export class InsightGenerationController {
  private readonly logger = new Logger(InsightGenerationController.name);
  
  constructor(
    private readonly insightGenerationService: InsightGenerationService,
    private readonly creditService: CreditSystemService
  ) {}
  
  /**
   * Generate insights from data
   * @param request Generation request
   * @returns Analysis result
   */
  @Post('generate')
  async generateInsights(
    @Body() request: GenerateInsightsRequest
  ): Promise<AIAnalysisResult> {
    if (!request.organizationId || !request.userId) {
      throw new ForbiddenException('Organization ID and User ID are required');
    }
    
    return this.insightGenerationService.generateInsights(request);
  }
  
  /**
   * Check credit balance
   * @param checkBalanceDto Organization ID
   * @returns Current balance
   */
  @Post('check-credits')
  async checkBalance(
    @Body() checkBalanceDto: CheckBalanceDto
  ): Promise<{ balance: number }> {
    if (!checkBalanceDto.organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }
    
    const balance = await this.creditService.getBalance(
      checkBalanceDto.organizationId
    );
    
    return { balance };
  }
  
  /**
   * Get detailed credit information
   * @param checkBalanceDto Organization ID
   * @returns Credit details
   */
  @Post('credit-details')
  async getCreditDetails(
    @Body() checkBalanceDto: CheckBalanceDto
  ): Promise<{ 
    balance: number; 
    lifetimeCredits: number;
    lifetimeUsage: number;
    lastUpdated: Date;
  }> {
    if (!checkBalanceDto.organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }
    
    const details = await this.creditService.getBalanceDetails(
      checkBalanceDto.organizationId
    );
    
    if (!details) {
      return {
        balance: 0,
        lifetimeCredits: 0,
        lifetimeUsage: 0,
        lastUpdated: new Date()
      };
    }
    
    return {
      balance: details.currentBalance,
      lifetimeCredits: details.lifetimeCredits,
      lifetimeUsage: details.lifetimeUsage,
      lastUpdated: details.lastUpdated instanceof Date 
        ? details.lastUpdated 
        : new Date(details.lastUpdated)
    };
  }
  
  /**
   * Get recent credit transactions
   * @param checkBalanceDto Organization ID
   * @returns Recent transactions
   */
  @Post('recent-transactions')
  async getRecentTransactions(
    @Body() checkBalanceDto: CheckBalanceDto
  ): Promise<{ transactions: any[] }> {
    if (!checkBalanceDto.organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }
    
    const transactions = await this.creditService.getRecentTransactions(
      checkBalanceDto.organizationId
    );
    
    return { transactions };
  }
}