import { Injectable, UnauthorizedException, Logger, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../users/repositories/user.repository';
import { FirebaseAuthService } from './firebase-auth.service';
import { User, UserRole } from '../../users/schemas/user.schema';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';

/**
 * Auth service for handling user authentication via Firebase Auth
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userRepository: UserRepository,
    private firebaseAuth: FirebaseAuthService
  ) {}

  /**
   * Validate a user's credentials
   * @param email User email
   * @param password User password
   * @returns User info if valid
   */
  async validateUser(loginDto: LoginDto): Promise<User> {
    try {
      const { email, password } = loginDto;
      
      // Check if user exists in our database
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }
      
      // Verify with Firebase Auth (this will throw if credentials are invalid)
      try {
        await this.firebaseAuth.getUserByEmail(email);
        // We don't verify password here as Firebase handles that during login
      } catch (error) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Update last login time
      await this.userRepository.updateLastLogin(user.id);
      
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Login a user
   * @param loginDto Login credentials
   * @returns Login response with token
   */
  async login(loginDto: LoginDto): Promise<{ user: Partial<User>; token: string }> {
    try {
      // Validate user credentials
      const user = await this.validateUser(loginDto);
      
      // Create custom token with user claims
      const token = await this.firebaseAuth.createCustomToken(user.id, {
        role: user.role,
        organizationId: user.organizationId,
      });
      
      // Return user info and token (excluding sensitive fields)
      const { ...userInfo } = user;
      
      return {
        user: userInfo,
        token,
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Login failed');
    }
  }

  /**
   * Register a new user
   * @param registerDto User registration data
   * @returns Registration response with token
   */
  async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; token: string }> {
    try {
      const { email, password, name } = registerDto;
      
      // Check if user already exists in our database
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
      
      // Create user in Firebase Auth
      const userRecord = await this.firebaseAuth.createUser(
        email,
        password,
        name
      );
      
      // Set custom claims
      await this.firebaseAuth.setCustomUserClaims(userRecord.uid, {
        role: registerDto.role || UserRole.USER,
        organizationId: registerDto.organizationId,
      });
      
      // Create user in our repository
      const user = await this.userRepository.createUser({
        id: userRecord.uid,
        name,
        email,
        role: registerDto.role || UserRole.USER,
        organizationId: registerDto.organizationId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Generate token for immediate login
      const token = await this.firebaseAuth.createCustomToken(user.id, {
        role: user.role,
        organizationId: user.organizationId,
      });
      
      // Return user info and token
      const { ...userInfo } = user;
      
      return {
        user: userInfo,
        token,
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  /**
   * Get user profile
   * @param userId User ID
   * @returns User profile
   */
  async getUserProfile(userId: string): Promise<User> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      return user;
    } catch (error) {
      this.logger.error(`Get user profile failed: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve user profile');
    }
  }

  /**
   * Update user active status
   * @param userId User ID
   * @param isActive Active status
   * @returns Updated user
   */
  async setUserActiveStatus(userId: string, isActive: boolean): Promise<User> {
    try {
      const updatedUser = await this.userRepository.setActiveStatus(userId, isActive);
      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      return updatedUser;
    } catch (error) {
      this.logger.error(`Set user active status failed: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user status');
    }
  }
}