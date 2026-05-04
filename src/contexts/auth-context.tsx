'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { apiClient } from '../utils/api-client';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    organizationName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionCheckAttempted = useRef(false);

  // Admin status is owned entirely by user_metadata.isAdmin (no hardcoded emails).
  const isAdmin = user?.user_metadata?.isAdmin === true;

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('Current user:', {
        email: user.email,
        isAdmin,
        metadata: user.user_metadata
      });
    }
  }, [user, isAdmin]);

  useEffect(() => {
    // Only check session once on mount to avoid repeated checks
    if (!sessionCheckAttempted.current) {
      sessionCheckAttempted.current = true;
      checkSession();
    }
  }, []);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { user } = await apiClient.getSession();
        if (user) {
          setUser(user);
        } else {
          // User is null but request succeeded - token is invalid
          console.log('Session expired or invalid');
          localStorage.removeItem('access_token');
          setUser(null);
        }
      } catch (sessionError: any) {
        // Only remove token if it's a 401 (unauthorized) error
        // Network errors or server errors should keep the token
        if (sessionError.status === 401) {
          console.log('Token is invalid (401), removing');
          localStorage.removeItem('access_token');
          setUser(null);
        } else {
          // Keep token for other errors (network issues, server errors)
          console.log('Session check failed but keeping token:', sessionError.message);
          // Retry session on next page load, but don't block the app
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { user, session } = await apiClient.login(email, password);

      // Store both user and token
      if (session?.access_token) {
        localStorage.setItem('access_token', session.access_token);
      }

      setUser(user);
      console.log('Login successful, token stored');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    organizationName: string,
  ) => {
    try {
      await apiClient.signup(email, password, name, organizationName);
      await login(email, password);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
      localStorage.removeItem('access_token');
      setUser(null);
      console.log('Logout successful, token removed');
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear token even if logout request fails
      localStorage.removeItem('access_token');
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
