import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Firestore } from '@google-cloud/firestore';

import { 
  SecurityAuditService as ISecurityAuditService,
  SecurityAuditRecord
} from '../interfaces/security.interfaces';
import { ObservabilityService } from '../../../common/observability';

/**
 * Service for recording and querying security audit events
 */
@Injectable()
export class SecurityAuditService implements ISecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);
  private readonly firestore: Firestore;
  private readonly projectId: string;
  private readonly collectionName: string;
  private readonly batchSize = 500; // Maximum number of records to retrieve in a query
  
  constructor(
    @Inject('SECURITY_MODULE_OPTIONS') private readonly options: any,
    private readonly configService: ConfigService,
    private readonly observability: ObservabilityService,
  ) {
    this.projectId = this.configService.get<string>('GCP_PROJECT_ID');
    this.collectionName = 'security-audit-logs';
    
    // Initialize Firestore client
    this.firestore = new Firestore();
    
    this.logger.log('Security Audit service initialized');
  }
  
  /**
   * Record a security audit event
   * @param record The audit record to store
   */
  async recordAudit(record: Omit<SecurityAuditRecord, 'id' | 'timestamp'>): Promise<void> {
    const span = this.observability.startTrace('security.recordAudit', {
      action: record.action,
      outcome: record.outcome,
    });
    
    try {
      // Generate a unique ID for the audit record
      const id = uuidv4();
      
      // Create the full audit record with ID and timestamp
      const auditRecord: SecurityAuditRecord = {
        id,
        timestamp: new Date(),
        ...record,
      };
      
      // Store the audit record in Firestore
      await this.firestore.collection(this.collectionName).doc(id).set(auditRecord);
      
      // Increment audit event counter
      this.observability.incrementCounter('security.audit.record');
      
      // For denied actions, increment a specific counter
      if (record.outcome === 'denied') {
        this.observability.incrementCounter('security.audit.denied');
      }
      
      span.end();
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`Failed to record audit event: ${error.message}`, error.stack);
      this.observability.error('Audit record failed', error, SecurityAuditService.name);
      
      // Continue execution even if audit recording fails
      // This prevents security events from blocking application flow
    }
  }
  
  /**
   * Query audit logs based on various criteria
   * @param query Query parameters
   * @returns Matching audit records
   */
  async queryAuditLogs(query: {
    startTime?: Date;
    endTime?: Date;
    actorId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    outcome?: 'allowed' | 'denied';
    limit?: number;
    offset?: number;
  }): Promise<SecurityAuditRecord[]> {
    const span = this.observability.startTrace('security.queryAuditLogs', {
      hasTimeRange: !!(query.startTime || query.endTime),
      hasActorFilter: !!query.actorId,
      hasActionFilter: !!query.action,
      hasResourceFilter: !!(query.resourceType || query.resourceId),
      hasOutcomeFilter: !!query.outcome,
    });
    
    try {
      // Start with the base collection
      let firestoreQuery = this.firestore.collection(this.collectionName);
      
      // Apply filters
      if (query.startTime) {
        firestoreQuery = firestoreQuery.where('timestamp', '>=', query.startTime);
      }
      
      if (query.endTime) {
        firestoreQuery = firestoreQuery.where('timestamp', '<=', query.endTime);
      }
      
      if (query.actorId) {
        firestoreQuery = firestoreQuery.where('actor.id', '==', query.actorId);
      }
      
      if (query.action) {
        firestoreQuery = firestoreQuery.where('action', '==', query.action);
      }
      
      if (query.resourceType) {
        firestoreQuery = firestoreQuery.where('resource.type', '==', query.resourceType);
      }
      
      if (query.resourceId) {
        firestoreQuery = firestoreQuery.where('resource.id', '==', query.resourceId);
      }
      
      if (query.outcome) {
        firestoreQuery = firestoreQuery.where('outcome', '==', query.outcome);
      }
      
      // Order by timestamp descending (newest first)
      firestoreQuery = firestoreQuery.orderBy('timestamp', 'desc');
      
      // Apply limit
      const limit = query.limit || this.batchSize;
      firestoreQuery = firestoreQuery.limit(limit);
      
      // Apply offset if specified
      if (query.offset) {
        firestoreQuery = firestoreQuery.offset(query.offset);
      }
      
      // Execute the query
      const snapshot = await firestoreQuery.get();
      
      // Process the results
      const records: SecurityAuditRecord[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as SecurityAuditRecord;
        
        // Convert Firestore timestamps to JavaScript Dates
        if (data.timestamp && typeof data.timestamp !== 'string') {
          data.timestamp = (data.timestamp as any).toDate();
        }
        
        records.push(data);
      });
      
      // Record metrics
      this.observability.incrementCounter('security.audit.query');
      
      span.setAttribute('audit.records.count', records.length);
      span.end();
      
      return records;
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`Failed to query audit logs: ${error.message}`, error.stack);
      this.observability.error('Audit query failed', error, SecurityAuditService.name);
      
      throw error;
    }
  }
  
  /**
   * Get audit statistics by dimension
   * @param dimension The dimension to group by
   * @param timeWindow Time window to analyze
   * @returns Audit statistics
   */
  async getAuditStats(
    dimension: 'action' | 'actorId' | 'resourceType' | 'outcome',
    timeWindow: { start: Date; end: Date }
  ): Promise<Record<string, number>> {
    const span = this.observability.startTrace('security.getAuditStats', {
      dimension,
      timeWindowDays: Math.ceil((timeWindow.end.getTime() - timeWindow.start.getTime()) / (1000 * 60 * 60 * 24)),
    });
    
    try {
      // Query matching records
      const records = await this.queryAuditLogs({
        startTime: timeWindow.start,
        endTime: timeWindow.end,
        limit: 10000, // Use a large limit to get comprehensive stats
      });
      
      // Group by the specified dimension
      const stats: Record<string, number> = {};
      
      for (const record of records) {
        let key: string;
        
        switch (dimension) {
          case 'action':
            key = record.action;
            break;
          
          case 'actorId':
            key = record.actor.id;
            break;
          
          case 'resourceType':
            key = record.resource.type;
            break;
          
          case 'outcome':
            key = record.outcome;
            break;
          
          default:
            key = 'unknown';
        }
        
        // Increment the count for this key
        stats[key] = (stats[key] || 0) + 1;
      }
      
      span.end();
      return stats;
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`Failed to get audit stats: ${error.message}`, error.stack);
      this.observability.error('Audit stats failed', error, SecurityAuditService.name);
      
      throw error;
    }
  }
  
  /**
   * Export audit logs to a file
   * @param query Query parameters for the logs to export
   * @param format Export format (json or csv)
   * @returns URL to download the exported file
   */
  async exportAuditLogs(
    query: {
      startTime?: Date;
      endTime?: Date;
      actorId?: string;
      action?: string;
      resourceType?: string;
      resourceId?: string;
      outcome?: 'allowed' | 'denied';
    },
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const span = this.observability.startTrace('security.exportAuditLogs', {
      format,
    });
    
    try {
      // Set a high limit to export all matching records
      const records = await this.queryAuditLogs({
        ...query,
        limit: 100000,
      });
      
      // In a real implementation, this would:
      // 1. Create a file in Cloud Storage
      // 2. Write the records in the specified format
      // 3. Generate a signed URL for download
      
      // For this example, we'll just log the action
      this.logger.log(`Would export ${records.length} audit records in ${format} format`);
      
      // Record metrics
      this.observability.incrementCounter('security.audit.export');
      
      span.setAttribute('audit.export.records', records.length);
      span.end();
      
      // Return a placeholder URL
      return `https://storage.googleapis.com/${this.projectId}-audit-exports/export-${Date.now()}.${format}`;
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`Failed to export audit logs: ${error.message}`, error.stack);
      this.observability.error('Audit export failed', error, SecurityAuditService.name);
      
      throw error;
    }
  }
  
  /**
   * Purge audit logs older than a specified date
   * @param olderThan Date before which to purge logs
   * @returns Number of records purged
   */
  async purgeAuditLogs(olderThan: Date): Promise<number> {
    const span = this.observability.startTrace('security.purgeAuditLogs', {
      purgeDate: olderThan.toISOString(),
    });
    
    try {
      // Query records older than the specified date
      const snapshot = await this.firestore.collection(this.collectionName)
        .where('timestamp', '<', olderThan)
        .get();
      
      if (snapshot.empty) {
        span.end();
        return 0;
      }
      
      // Delete records in batches
      const batch = this.firestore.batch();
      let batchCount = 0;
      let totalDeleted = 0;
      
      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;
        
        // Firestore batches are limited to 500 operations
        if (batchCount >= 500) {
          await batch.commit();
          totalDeleted += batchCount;
          batchCount = 0;
        }
      }
      
      // Commit any remaining batch operations
      if (batchCount > 0) {
        await batch.commit();
        totalDeleted += batchCount;
      }
      
      // Record metrics
      this.observability.incrementCounter('security.audit.purge');
      this.observability.recordGauge('security.audit.purged.count', totalDeleted);
      
      span.setAttribute('audit.purged.count', totalDeleted);
      span.end();
      
      this.logger.log(`Purged ${totalDeleted} audit records older than ${olderThan.toISOString()}`);
      
      return totalDeleted;
    } catch (error) {
      span.recordException(error);
      span.end();
      
      this.logger.error(`Failed to purge audit logs: ${error.message}`, error.stack);
      this.observability.error('Audit purge failed', error, SecurityAuditService.name);
      
      throw error;
    }
  }
}