'use client';

/**
 * Firebase Context
 *
 * This context provides Firebase services to the application
 * and handles authentication state.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

import { firebaseAuth } from '../lib/firebase/config';
import { OrganizationStatus, SubscriptionPlan } from '../types/organization/organization.types';
import { User , UserRole, UserStatus } from '../types/user/user.types';

// Mock user repository
const userRepository = {
  getByEmail: async () => null,
  updateLastLogin: async () => {},
  update: async () => ({}),
  create: async () => ({}),
};

// Define context type
interface FirebaseContextType {
  user: User | null;
  firebaseUser: any | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  register: (email: string, password: string, name: string, organizationName?: string, inviteToken?: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  refreshAuthToken: () => Promise<string | null>;
  checkEmailExists: (email: string) => Promise<boolean>;
}

// Create the context
const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// Context provider component
interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Helper function to get default permissions for a role
  const getDefaultPermissionsForRole = (role: UserRole): string[] => {
    switch (role) {
      case UserRole.ADMIN:
        return [
          'users:read', 'users:write',
          'organization:read', 'organization:write',
          'settings:read', 'settings:write',
          'inventory:read', 'inventory:write',
          'orders:read', 'orders:write',
          'analytics:read', 'analytics:write',
          'marketplace:read', 'marketplace:write',
        ];
      case UserRole.MANAGER:
        return [
          'users:read',
          'organization:read',
          'settings:read',
          'inventory:read', 'inventory:write',
          'orders:read', 'orders:write',
          'analytics:read',
          'marketplace:read', 'marketplace:write',
        ];
      case UserRole.USER:
        return [
          'inventory:read',
          'orders:read',
          'analytics:read',
          'marketplace:read',
        ];
      default:
        return [];
    }
  };
  
  // Helper function to get default features for a role
  const getDefaultFeaturesForRole = (role: UserRole): string[] => {
    const baseFeatures = ['dashboard', 'inventory', 'orders', 'analytics'];
    
    switch (role) {
      case UserRole.ADMIN:
        return [
          ...baseFeatures,
          'settings',
          'users',
          'organization',
          'marketplace',
          'ai',
          'international',
        ];
      case UserRole.MANAGER:
        return [
          ...baseFeatures,
          'marketplace',
          'ai',
        ];
      case UserRole.USER:
        return baseFeatures;
      default:
        return [];
    }
  };

  // Login with email and password (mock implementation)
  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock successful login
      const mockUser: User = {
        id: 'mock-user-id',
        email: email.toLowerCase(),
        name: 'Mock User',
        role: UserRole.ADMIN,
        organizationId: 'mock-org-id',
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setUser(mockUser);
      return mockUser;
    } catch (err) {
      console.error('Login error:', err);
      const error = err instanceof Error ? err : new Error('Failed to login');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register a new user (mock implementation)
  const register = async (
    email: string, 
    password: string, 
    name: string, 
    organizationName?: string,
    inviteToken?: string
  ): Promise<User> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock successful registration
      const mockUser: User = {
        id: 'mock-user-id',
        email: email.toLowerCase(),
        name: name,
        role: UserRole.ADMIN,
        organizationId: organizationName ? 'new-org-id' : 'mock-org-id',
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setUser(mockUser);
      return mockUser;
    } catch (err) {
      console.error('Registration error:', err);
      const error = err instanceof Error ? err : new Error('Failed to register');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Login with Google (mock implementation)
  const loginWithGoogle = async (): Promise<User> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock successful Google login
      const mockUser: User = {
        id: 'mock-google-user-id',
        email: 'google-user@example.com',
        name: 'Google User',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        organizationId: 'mock-org-id',
      };
      
      setUser(mockUser);
      return mockUser;
    } catch (err) {
      console.error('Google login error:', err);
      const error = err instanceof Error ? err : new Error('Failed to login with Google');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if email already exists (mock implementation)
  const checkEmailExists = async (email: string): Promise<boolean> => {
    return false;
  };

  // Logout (mock implementation)
  const logout = async (): Promise<void> => {
    try {
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      const error = err instanceof Error ? err : new Error('Failed to logout');
      setError(error);
      throw error;
    }
  };
  
  // Refresh auth token (mock implementation)
  const refreshAuthToken = async (): Promise<string | null> => {
    try {
      return 'mock-refreshed-token';
    } catch (err) {
      console.error('Token refresh error:', err);
      const error = err instanceof Error ? err : new Error('Failed to refresh authentication');
      setError(error);
      return null;
    }
  };

  // Reset password (mock implementation)
  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock successful password reset
    } catch (err) {
      console.error('Password reset error:', err);
      const error = err instanceof Error ? err : new Error('Failed to send password reset email');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile (mock implementation)
  const updateUserProfile = async (displayName?: string, photoURL?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user) {
        throw new Error('No user is logged in');
      }
      
      // Update local user state with new values
      if (displayName || photoURL) {
        const updatedUser = { ...user };
        
        if (displayName) updatedUser.name = displayName;
        
        setUser(updatedUser);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    firebaseUser,
    isLoading,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    refreshAuthToken,
    checkEmailExists,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook to use the Firebase context
export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  
  return context;
};