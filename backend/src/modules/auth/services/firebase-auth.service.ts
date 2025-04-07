import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

/**
 * Firebase Authentication service
 * Provides integration with Firebase Auth for authentication and authorization
 */
@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {
    // Initialize Firebase Admin SDK
    const projectId = this.configService.get<string>('GCP_PROJECT_ID');
    
    if (!admin.apps.length) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
    } else {
      this.firebaseApp = admin.app();
    }
  }

  /**
   * Verify a Firebase ID token
   * @param idToken The Firebase ID token to verify
   * @returns The decoded token claims
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.firebaseApp.auth().verifyIdToken(idToken);
    } catch (error) {
      this.logger.error(`Invalid Firebase ID token: ${error.message}`);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  /**
   * Create a new user in Firebase Auth
   * @param email User's email address
   * @param password User's password
   * @param displayName User's display name
   * @returns The newly created user
   */
  async createUser(email: string, password: string, displayName?: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseApp.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a user by their UID
   * @param uid User's Firebase UID
   * @returns The user record
   */
  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseApp.auth().getUser(uid);
    } catch (error) {
      this.logger.error(`Failed to get user by UID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a user by their email address
   * @param email User's email address
   * @returns The user record
   */
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseApp.auth().getUserByEmail(email);
    } catch (error) {
      this.logger.error(`Failed to get user by email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a user's information
   * @param uid User's Firebase UID
   * @param updateData Data to update
   * @returns The updated user record
   */
  async updateUser(
    uid: string, 
    updateData: admin.auth.UpdateRequest
  ): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseApp.auth().updateUser(uid, updateData);
    } catch (error) {
      this.logger.error(`Failed to update user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a user
   * @param uid User's Firebase UID
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      await this.firebaseApp.auth().deleteUser(uid);
    } catch (error) {
      this.logger.error(`Failed to delete user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set custom claims for a user (used for roles, permissions, etc.)
   * @param uid User's Firebase UID
   * @param claims Custom claims to set
   */
  async setCustomUserClaims(uid: string, claims: object): Promise<void> {
    try {
      await this.firebaseApp.auth().setCustomUserClaims(uid, claims);
    } catch (error) {
      this.logger.error(`Failed to set custom claims: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a custom JWT token with claims
   * @param uid User's Firebase UID
   * @param additionalClaims Additional claims to include in the token
   * @returns The custom token
   */
  async createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
    try {
      return await this.firebaseApp.auth().createCustomToken(uid, additionalClaims);
    } catch (error) {
      this.logger.error(`Failed to create custom token: ${error.message}`);
      throw error;
    }
  }
}