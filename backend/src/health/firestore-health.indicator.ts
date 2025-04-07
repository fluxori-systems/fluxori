import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { Timestamp } from '../types/google-cloud.types';
import { FirestoreConfigService } from '../config/firestore.config';

/**
 * GCP health check result format
 */
export interface HealthResult {
  status: 'UP' | 'DOWN';
  details?: Record<string, any>;
  error?: string;
}

/**
 * Firestore Health Indicator
 * 
 * Implements health checks for Firestore connection using GCP native patterns
 */
@Injectable()
export class FirestoreHealthIndicator {
  private readonly logger = new Logger(FirestoreHealthIndicator.name);
  private readonly testCollection = '_health_checks';
  
  constructor(private readonly firestoreConfigService: FirestoreConfigService) {}
  
  /**
   * Basic health check for Firestore
   * @param componentName Name of the component being checked
   * @returns Health check result
   * @throws InternalServerErrorException if health check fails
   */
  async isHealthy(componentName: string): Promise<HealthResult> {
    try {
      // Get Firestore instance
      const db = this.firestoreConfigService.getFirestore();
      
      // Ping Firestore with a trivial operation
      await db.collection(this.testCollection).doc('ping').set({
        timestamp: new Date(),
        ping: true,
      } as Record<string, any>);
      
      return {
        status: 'UP',
        details: {
          [componentName]: {
            status: 'UP'
          }
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(`Firestore health check failed: ${errorMessage}`, stackTrace);
      
      const result: HealthResult = {
        status: 'DOWN',
        details: {
          [componentName]: {
            status: 'DOWN',
            error: errorMessage
          }
        },
        error: errorMessage
      };
      
      throw new InternalServerErrorException(result);
    }
  }
  
  /**
   * Detailed health check for Firestore with additional metrics
   * @param componentName Name of the component being checked
   * @returns Health check result with details
   * @throws InternalServerErrorException if health check fails
   */
  async isHealthyWithDetails(componentName: string): Promise<HealthResult> {
    try {
      const startTime = process.hrtime();
      
      // Get Firestore instance
      const db = this.firestoreConfigService.getFirestore();
      
      // Use a health check collection for the test
      const healthCollection = db.collection(this.testCollection);
      const docRef = healthCollection.doc('ping');
      
      // Write a document
      await docRef.set({
        timestamp: new Date(),
        ping: true,
      } as Record<string, any>);
      
      // Read the document
      const doc = await docRef.get();
      const docData = doc.data();
      
      // Calculate operation time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = seconds * 1000 + nanoseconds / 1000000;
      
      // Format timestamp properly
      let timestampString = 'unknown';
      if (docData?.timestamp) {
        if (docData.timestamp instanceof Timestamp) {
          timestampString = docData.timestamp.toDate().toISOString();
        } else if (docData.timestamp instanceof Date) {
          timestampString = docData.timestamp.toISOString();
        } else {
          timestampString = String(docData.timestamp);
        }
      }
      
      return {
        status: 'UP',
        details: {
          [componentName]: {
            status: 'UP',
            responseTime: `${responseTime.toFixed(2)} ms`,
            documentExists: doc.exists,
            timestamp: timestampString,
            region: this.firestoreConfigService.getRegion() || 'default'
          }
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(`Firestore detailed health check failed: ${errorMessage}`, stackTrace);
      
      const result: HealthResult = {
        status: 'DOWN',
        details: {
          [componentName]: {
            status: 'DOWN',
            error: errorMessage
          }
        },
        error: errorMessage
      };
      
      throw new InternalServerErrorException(result);
    }
  }
}