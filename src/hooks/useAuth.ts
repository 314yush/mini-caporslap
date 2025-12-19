'use client';

import { useState, useEffect, useCallback } from 'react';

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

export interface AuthState {
  // Connection state
  isReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // User info
  fid: number | null;
  user: FarcasterUser | null;
  token: string | null;
  
  // Auth methods
  login: () => Promise<void>;
  logout: () => void;
}

// Session storage key for auth token
const AUTH_TOKEN_KEY = 'caporslap_auth_token';
const AUTH_USER_KEY = 'caporslap_auth_user';

export function useAuth(): AuthState {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fid, setFid] = useState<number | null>(null);
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const storedToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = sessionStorage.getItem(AUTH_USER_KEY);
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as FarcasterUser;
          setToken(storedToken);
          setUser(parsedUser);
          setFid(parsedUser.fid);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('[useAuth] Error checking existing session:', error);
        // Clear invalid session data
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        sessionStorage.removeItem(AUTH_USER_KEY);
      } finally {
        setIsReady(true);
      }
    };

    checkExistingSession();
  }, []);

  // Login using Quick Auth
  const login = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Dynamically import the SDK to avoid SSR issues
      const { sdk } = await import('@farcaster/miniapp-sdk');
      
      // Get JWT token from Quick Auth
      const result = await sdk.quickAuth.getToken();
      const authToken = result.token;
      
      // Verify the token with our backend and get user info
      const response = await fetch('/api/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify authentication');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.fid) {
        throw new Error('Authentication verification failed');
      }
      
      // Get user context from SDK if available
      let userData: FarcasterUser = { fid: data.fid };
      
      try {
        const context = await sdk.context;
        if (context?.user) {
          userData = {
            fid: data.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
          };
        }
      } catch {
        // Context might not be available, continue with just FID
        console.log('[useAuth] Could not get user context, using FID only');
      }
      
      // Store auth state
      setToken(authToken);
      setUser(userData);
      setFid(data.fid);
      setIsAuthenticated(true);
      
      // Persist to session storage
      sessionStorage.setItem(AUTH_TOKEN_KEY, authToken);
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      
      console.log('[useAuth] Authentication successful, FID:', data.fid);
      
    } catch (error) {
      console.error('[useAuth] Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setFid(null);
    setIsAuthenticated(false);
    
    // Clear session storage
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    
    console.log('[useAuth] Logged out');
  }, []);

  return {
    isReady,
    isAuthenticated,
    isLoading,
    fid,
    user,
    token,
    login,
    logout,
  };
}

/**
 * Hook to get just the user ID (FID as string)
 * Useful for API calls
 */
export function useUserId(): string {
  const { fid } = useAuth();
  return fid ? String(fid) : '';
}
