import { Injectable, Logger } from '@nestjs/common';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { PriceAlert } from '../models/competitor-price.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Repository for price alerts
 * Handles persistence of price alert data
 */
@Injectable()
export class PriceAlertRepository extends FirestoreBaseRepository<PriceAlert> {
  private readonly logger = new Logger(PriceAlertRepository.name);
  
  constructor() {
    super('price-alerts', {
      enableDataValidation: true,
      enableQueryCache: true,
      cacheExpirationMinutes: 15,
      enableTransactionality: true,
    });
  }
  
  /**
   * Create a new price alert
   * @param data Alert data
   */
  async create(data: Omit<PriceAlert, 'id' | 'createdAt'>): Promise<PriceAlert> {
    try {
      const now = new Date();
      
      const newAlert: PriceAlert = {
        ...data,
        id: uuidv4(),
        createdAt: now,
      };
      
      return super.create(newAlert);
    } catch (error) {
      this.logger.error(`Error creating price alert: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Mark alert as read
   * @param id Alert ID
   * @param userId User ID
   */
  async markAsRead(id: string, userId: string): Promise<PriceAlert> {
    try {
      const now = new Date();
      
      const updateData = {
        isRead: true,
        readAt: now,
      };
      
      return super.update(id, updateData);
    } catch (error) {
      this.logger.error(`Error marking alert as read: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Mark alert as resolved
   * @param id Alert ID
   * @param userId User ID
   */
  async markAsResolved(id: string, userId: string): Promise<PriceAlert> {
    try {
      const now = new Date();
      
      const updateData = {
        isResolved: true,
        resolvedAt: now,
      };
      
      return super.update(id, updateData);
    } catch (error) {
      this.logger.error(`Error marking alert as resolved: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Find alerts for a product
   * @param productId Product ID
   * @param organizationId Organization ID
   * @param options Query options
   */
  async findByProductId(
    productId: string,
    organizationId: string,
    options?: {
      includeResolved?: boolean;
      alertType?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<PriceAlert[]> {
    try {
      const whereConditions: any[] = [
        { field: 'productId', operator: '==', value: productId },
        { field: 'organizationId', operator: '==', value: organizationId },
      ];
      
      if (!options?.includeResolved) {
        whereConditions.push({
          field: 'isResolved',
          operator: '==',
          value: false,
        });
      }
      
      if (options?.alertType) {
        whereConditions.push({
          field: 'alertType',
          operator: '==',
          value: options.alertType,
        });
      }
      
      const query = {
        where: whereConditions,
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit: options?.limit || 50,
        offset: options?.offset || 0,
      };
      
      return this.query(query);
    } catch (error) {
      this.logger.error(`Error finding alerts by product: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Find all unresolved alerts for an organization
   * @param organizationId Organization ID
   * @param options Query options
   */
  async findUnresolved(
    organizationId: string,
    options?: {
      severity?: 'LOW' | 'MEDIUM' | 'HIGH';
      alertType?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<PriceAlert[]> {
    try {
      const whereConditions: any[] = [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'isResolved', operator: '==', value: false },
      ];
      
      if (options?.severity) {
        whereConditions.push({
          field: 'severity',
          operator: '==',
          value: options.severity,
        });
      }
      
      if (options?.alertType) {
        whereConditions.push({
          field: 'alertType',
          operator: '==',
          value: options.alertType,
        });
      }
      
      const query = {
        where: whereConditions,
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit: options?.limit || 100,
        offset: options?.offset || 0,
      };
      
      return this.query(query);
    } catch (error) {
      this.logger.error(`Error finding unresolved alerts: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Count unresolved alerts by type
   * @param organizationId Organization ID
   */
  async countUnresolvedByType(
    organizationId: string,
  ): Promise<Record<string, number>> {
    try {
      const query = {
        where: [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'isResolved', operator: '==', value: false },
        ],
        limit: 1000, // High limit to count all alerts
      };
      
      const alerts = await this.query(query);
      
      // Count by type
      const counts: Record<string, number> = {};
      
      alerts.forEach(alert => {
        if (!counts[alert.alertType]) {
          counts[alert.alertType] = 0;
        }
        counts[alert.alertType]++;
      });
      
      return counts;
    } catch (error) {
      this.logger.error(`Error counting unresolved alerts: ${error.message}`, error.stack);
      throw error;
    }
  }
}