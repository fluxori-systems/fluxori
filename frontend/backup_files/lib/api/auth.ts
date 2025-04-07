import { apiClient } from './client';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from './types/auth';

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Log in a user
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    
    // Store the token
    if (response.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },
  
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return await apiClient.post<RegisterResponse>('/auth/register', data);
  },
  
  /**
   * Get the current user's profile
   */
  getCurrentUser: async (): Promise<User> => {
    return await apiClient.get<User>('/auth/me');
  },
  
  /**
   * Log out the current user
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  },
};