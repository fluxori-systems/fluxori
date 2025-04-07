import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RepricingEngineService } from './repricing-engine.service';
import { BuyBoxStatusRepository } from '../repositories/buybox-status.repository';
import { BuyBoxHistoryRepository } from '../repositories/buybox-history.repository';

/**
 * Service for scheduling repricing operations
 */
@Injectable()
export class RepricingSchedulerService {
  private readonly logger = new Logger(RepricingSchedulerService.name);
  private isRunning = false;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly repricingEngineService: RepricingEngineService,
    private readonly buyBoxStatusRepository: BuyBoxStatusRepository,
    private readonly buyBoxHistoryRepository: BuyBoxHistoryRepository
  ) {}
  
  /**
   * Initialize the scheduler
   */
  async onModuleInit() {
    // Check if auto-scheduling is enabled
    const autoSchedule = this.configService.get<boolean>('REPRICING_AUTO_SCHEDULE', false);
    
    if (autoSchedule) {
      this.logger.log('Auto-scheduling repricing jobs');
      
      // Schedule the first run after 1 minute
      setTimeout(() => {
        this.runScheduledRepricing();
      }, 60 * 1000);
    }
  }
  
  /**
   * Run scheduled repricing for all monitored products
   */
  async runScheduledRepricing() {
    if (this.isRunning) {
      this.logger.log('Repricing already running, skipping');
      return;
    }
    
    this.isRunning = true;
    
    try {
      this.logger.log('Running scheduled repricing');
      
      // Get all organizations
      const organizations = await this.getOrganizations();
      
      for (const orgId of organizations) {
        await this.runRepricingForOrganization(orgId);
      }
      
      // Schedule the next run
      setTimeout(() => {
        this.runScheduledRepricing();
      }, 15 * 60 * 1000); // Run every 15 minutes
    } catch (error) {
      this.logger.error(`Error running scheduled repricing: ${error.message}`, error.stack);
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Run repricing for a specific organization
   * @param organizationId Organization ID
   * @returns Count of processed products
   */
  async runRepricingForOrganization(organizationId: string): Promise<number> {
    this.logger.log(`Running repricing for organization ${organizationId}`);
    
    // Get all monitored products
    const statuses = await this.buyBoxStatusRepository.findMonitored(organizationId);
    
    this.logger.log(`Found ${statuses.length} monitored products for organization ${organizationId}`);
    
    let processedCount = 0;
    
    for (const status of statuses) {
      try {
        // Check if it's time to reprice this product
        const lastChecked = new Date(status.lastChecked).getTime();
        const now = Date.now();
        const interval = (status.monitoringInterval || 60) * 60 * 1000; // Convert minutes to ms
        
        if (now - lastChecked >= interval) {
          // Time to reprice
          await this.repricingEngineService.applyRules(
            organizationId,
            status.productId,
            status.marketplaceId
          );
          
          processedCount++;
        }
      } catch (error) {
        this.logger.error(
          `Error repricing product ${status.productId}: ${error.message}`,
          error.stack
        );
      }
    }
    
    this.logger.log(`Processed ${processedCount} products for organization ${organizationId}`);
    
    // Cleanup old history
    await this.cleanupOldHistory(organizationId);
    
    return processedCount;
  }
  
  /**
   * Get list of organization IDs
   * @returns Array of organization IDs
   */
  private async getOrganizations(): Promise<string[]> {
    // In a real implementation, get this from an organizations repository
    // For now, we'll extract unique organization IDs from the buybox statuses
    const allStatuses = await this.buyBoxStatusRepository.findAll({});
    
    // Extract unique organization IDs
    const orgIds = new Set<string>();
    allStatuses.forEach(status => {
      if (status.organizationId) {
        orgIds.add(status.organizationId);
      }
    });
    
    return Array.from(orgIds);
  }
  
  /**
   * Clean up old history entries
   * @param organizationId Organization ID
   * @returns Count of deleted entries
   */
  private async cleanupOldHistory(organizationId: string): Promise<number> {
    // Get history retention period from config (default 30 days)
    const retentionDays = this.configService.get<number>('BUYBOX_HISTORY_RETENTION_DAYS', 30);
    
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // Delete old history
    return this.buyBoxHistoryRepository.deleteOlderThan(organizationId, cutoffDate);
  }
}