'use client';

import { useState, useEffect, useCallback } from 'react';
import { detectEnvironment } from '@/lib/environment';
import { useAuthDev } from './useAuthDev';

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

  // Check if we're in development mode (not in Base App)
  const isDevelopment = typeof window !== 'undefined' && detectEnvironment() === 'web';
  const devAuth = useAuthDev();

  // Check for existing session on mount
  useEffect(() => {
    console.log('[useAuth] Checking for existing session...');
    console.log('[useAuth] Environment:', isDevelopment ? 'development (web)' : 'production (Base App)');
    
    const checkExistingSession = async () => {
      try {
        // In development mode, use dev auth
        if (isDevelopment) {
          if (devAuth.isConnected && devAuth.fid && devAuth.user) {
            console.log('[useAuth] Using dev auth session, FID:', devAuth.fid);
            setFid(devAuth.fid);
            setUser(devAuth.user);
            setIsAuthenticated(true);
            // Dev mode doesn't use tokens
            setToken('dev_token');
          } else {
            console.log('[useAuth] No dev auth session found');
          }
          setIsReady(true);
          return;
        }

        // Production mode: check for Quick Auth token
        const storedToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = sessionStorage.getItem(AUTH_USER_KEY);
        
        console.log('[useAuth] Stored token exists:', !!storedToken);
        console.log('[useAuth] Stored user exists:', !!storedUser);
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as FarcasterUser;
          console.log('[useAuth] Restored session for FID:', parsedUser.fid);
          setToken(storedToken);
          setUser(parsedUser);
          setFid(parsedUser.fid);
          setIsAuthenticated(true);
        } else {
          console.log('[useAuth] No existing session found');
        }
      } catch (error) {
        console.error('[useAuth] Error checking existing session:', error);
        // Clear invalid session data
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        sessionStorage.removeItem(AUTH_USER_KEY);
      } finally {
        console.log('[useAuth] Setting isReady=true');
        setIsReady(true);
      }
    };

    checkExistingSession();
  }, [isDevelopment, devAuth.isConnected, devAuth.fid, devAuth.user]);

  // Login using Quick Auth (production) or Wallet (development)
  const login = useCallback(async () => {
    console.log('[useAuth] Login started...');
    setIsLoading(true);
    
    try {
      // Development mode: use wallet connection
      if (isDevelopment) {
        console.log('[useAuth] Using development mode (wallet connection)');
        await devAuth.connect();
        
        if (devAuth.fid && devAuth.user) {
          setFid(devAuth.fid);
          setUser(devAuth.user);
          setToken('dev_token');
          setIsAuthenticated(true);
          console.log('[useAuth] Dev authentication successful! FID:', devAuth.fid);
        }
        setIsLoading(false);
        return;
      }

      // Production mode: use Quick Auth
      console.log('[useAuth] Using production mode (Quick Auth)');
      
      // Dynamically import the SDK to avoid SSR issues
      console.log('[useAuth] Importing Farcaster SDK...');
      const { sdk } = await import('@farcaster/miniapp-sdk');
      console.log('[useAuth] SDK imported successfully');
      
      // Get JWT token from Quick Auth
      console.log('[useAuth] Calling sdk.quickAuth.getToken()...');
      const result = await sdk.quickAuth.getToken();
      const authToken = result.token;
      console.log('[useAuth] Got token, length:', authToken?.length);
      
      // Verify the token with our backend and get user info
      console.log('[useAuth] Verifying token with /api/auth...');
      const response = await fetch('/api/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      console.log('[useAuth] /api/auth response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useAuth] Auth verification failed:', errorText);
        throw new Error('Failed to verify authentication');
      }
      
      const data = await response.json();
      console.log('[useAuth] /api/auth response:', data);
      
      if (!data.success || !data.fid) {
        console.error('[useAuth] Invalid auth response:', data);
        throw new Error('Authentication verification failed');
      }
      
      // Get user context from SDK if available
      let userData: FarcasterUser = { fid: data.fid };
      
      try {
        console.log('[useAuth] Getting user context from SDK...');
        const context = await sdk.context;
        console.log('[useAuth] SDK context:', context);
        if (context?.user) {
          userData = {
            fid: data.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
          };
          console.log('[useAuth] Got user data from context:', userData);
        }
      } catch (contextError) {
        // Context might not be available, continue with just FID
        console.log('[useAuth] Could not get user context:', contextError);
      }
      
      // Store auth state
      console.log('[useAuth] Setting auth state...');
      setToken(authToken);
      setUser(userData);
      setFid(data.fid);
      setIsAuthenticated(true);
      
      // Persist to session storage
      sessionStorage.setItem(AUTH_TOKEN_KEY, authToken);
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      
      console.log('[useAuth] Authentication successful! FID:', data.fid, 'isAuthenticated will be true');
      
    } catch (error) {
      console.error('[useAuth] Login failed:', error);
      throw error;
    } finally {
      console.log('[useAuth] Login complete, setting isLoading=false');
      setIsLoading(false);
    }
  }, [isDevelopment, devAuth]);

  // Logout
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setFid(null);
    setIsAuthenticated(false);
    
    // Clear session storage
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    
    // Also clear dev auth if in development
    if (isDevelopment) {
      devAuth.disconnect();
    }
    
    console.log('[useAuth] Logged out');
  }, [isDevelopment, devAuth]);

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
