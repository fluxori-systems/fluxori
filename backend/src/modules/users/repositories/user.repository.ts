import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { User } from '../schemas/user.schema';
import { FirestoreConfigService } from '../../../config/firestore.config';

/**
 * Repository for managing user entities in Firestore
 */
@Injectable()
export class UserRepository extends FirestoreBaseRepository<User> {
  protected readonly logger = new Logger(UserRepository.name);
  protected readonly collectionName = 'users';

  constructor(protected readonly firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 30 * 60 * 1000, // 30 minutes
      requiredFields: ['email', 'name', 'role'] as Array<keyof User>,
    });
  }

  /**
   * Find a user by email
   * @param email User email
   * @returns User document or null
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const querySnapshot = await this.collection
        .where('email', '==', email)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.converter.fromFirestore(doc);
    } catch (error) {
      this.logger.error(`Error finding user by email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param userData User data
   * @returns Created user
   */
  async createUser(userData: Partial<User>): Promise<User> {
    try {
      // Check if user with email already exists
      // Make sure email is provided
      if (!userData.email) {
        throw new Error('Email is required to create a user');
      }
      
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error(`User with email ${userData.email} already exists`);
      }

      // Create user in Firestore with proper initialization
      // Make sure we have required fields initialized
      const userWithRequiredFields = {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: userData.isActive ?? true,
      };
      
      return this.create(userWithRequiredFields as Omit<User, 'id'>);
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   * @param userId User ID
   * @returns Updated user
   */
  async updateLastLogin(userId: string): Promise<User | null> {
    try {
      return this.update(userId, { lastLogin: new Date() });
    } catch (error) {
      this.logger.error(`Error updating last login: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find users by organization ID
   * @param organizationId Organization ID
   * @returns Array of users
   */
  async findByOrganization(organizationId: string): Promise<User[]> {
    try {
      const querySnapshot = await this.collection
        .where('organizationId', '==', organizationId)
        .where('isDeleted', '==', false)
        .get();

      return querySnapshot.docs.map(doc => this.converter.fromFirestore(doc));
    } catch (error) {
      this.logger.error(`Error finding users by organization: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update user active status
   * @param userId User ID
   * @param isActive Active status
   * @returns Updated user
   */
  async setActiveStatus(userId: string, isActive: boolean): Promise<User | null> {
    try {
      return this.update(userId, { isActive });
    } catch (error) {
      this.logger.error(`Error setting active status: ${error.message}`, error.stack);
      throw error;
    }
  }
}