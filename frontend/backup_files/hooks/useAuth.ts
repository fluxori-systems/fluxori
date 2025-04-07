import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Hook for managing authentication state and operations
 */
export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from local storage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');

    if (token && user) {
      try {
        setState({
          user: JSON.parse(user),
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        // If storage is corrupted, clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      // In a real app, this would be an API call
      // Simulating an API call for now
      const user: User = {
        id: '1',
        email: credentials.email,
        name: 'Demo User',
        role: 'admin',
      };
      const token = 'demo_token';

      // Store auth data in local storage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      // Update state
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Redirect to dashboard
      router.push('/dashboard');

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }, [router]);

  // Logout function
  const logout = useCallback(() => {
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    // Update state
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Redirect to login
    router.push('/login');
  }, [router]);

  return {
    ...state,
    login,
    logout,
  };
}
