/**
 * Firestore Health Indicator for NestJS
 *
 * Implements health check indicator for Firestore database connections
 */

import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicator } from '@nestjs/terminus';

import { Timestamp } from '@google-cloud/firestore';

import { FirestoreConfigService } from '../config/firestore.config';
import { isFirestoreTimestamp } from '../types/google-cloud.types';

/**
 * For backwards compatibility with GCP health checks
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
 * Extends NestJS Terminus HealthIndicator for compatibility
 */
@Injectable()
export class FirestoreHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(FirestoreHealthIndicator.name);
  private readonly testCollection = '_health_checks';

  constructor(private readonly firestoreConfigService: FirestoreConfigService) {
    super();
  }

  /**
   * Basic health check for Firestore
   * @param componentName Name of the component being checked
   * @returns Health check result in Terminus format
   */
  async isHealthy(componentName: string): Promise<HealthIndicatorResult> {
    try {
      // Get Firestore instance
      const db = this.firestoreConfigService.getFirestore();

      // Ping Firestore with a trivial operation
      await db.collection(this.testCollection).doc('ping').set({
        timestamp: new Date(),
        ping: true,
      });

      // Return result in NestJS Terminus format
      return this.getStatus(componentName, true, {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Firestore health check failed: ${errorMessage}`,
        stackTrace,
      );

      // Return result in NestJS Terminus format
      return this.getStatus(componentName, false, {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Detailed health check for Firestore with additional metrics
   * @param componentName Name of the component being checked
   * @returns Health check result with details in Terminus format
   */
  async isHealthyWithDetails(
    componentName: string,
  ): Promise<HealthIndicatorResult> {
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
      });

      // Read the document
      const doc = await docRef.get();
      const docData = doc.data();

      // Calculate operation time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = seconds * 1000 + nanoseconds / 1000000;

      // Format timestamp properly
      let timestampString = 'unknown';
      if (docData?.timestamp) {
        if (isFirestoreTimestamp(docData.timestamp)) {
          timestampString = docData.timestamp.toDate().toISOString();
        } else if (docData.timestamp instanceof Date) {
          timestampString = docData.timestamp.toISOString();
        } else {
          timestampString = String(docData.timestamp);
        }
      }

      // Return result in NestJS Terminus format
      return this.getStatus(componentName, true, {
        responseTime: `${responseTime.toFixed(2)} ms`,
        documentExists: doc.exists,
        timestamp: timestampString,
        region: this.firestoreConfigService.getRegion() || 'default',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Firestore detailed health check failed: ${errorMessage}`,
        stackTrace,
      );

      // Return result in NestJS Terminus format
      return this.getStatus(componentName, false, {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
