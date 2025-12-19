'use client';

import { useState, useEffect, useCallback } from 'react';
import { detectEnvironment } from '@/lib/environment';
import { useAuthDev } from './useAuthDev';
import { FarcasterAuthHelpers, farcasterUserToPlatformUser } from '@/lib/auth/platforms/farcaster';
import type { PlatformUser } from '@/lib/auth/types';

// Re-export for backward compatibility
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
  
  // New unified interface (for future use)
  userId: string | null;
  platformUser: PlatformUser | null;
}

// Session storage keys are now managed by FarcasterAuthHelpers

export function useAuth(): AuthState {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fid, setFid] = useState<number | null>(null);
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);

  // Check if we're in development mode (not in Base App)
  const isDevelopment = typeof window !== 'undefined' && detectEnvironment() === 'web';
  const devAuth = useAuthDev();

  // Check for existing session on mount
  useEffect(() => {
    console.log('[useAuth] Checking for existing session...');
    console.log('[useAuth] Environment:', isDevelopment ? 'development (web)' : 'production (Base App)');
    
    const checkExistingSession = async () => {
      try {
        const session = await FarcasterAuthHelpers.checkExistingSession(isDevelopment, devAuth);
        
        if (session) {
          console.log('[useAuth] Restored session for FID:', session.fid);
          setToken(session.token);
          setUser(session.user);
          setFid(session.fid);
          setIsAuthenticated(true);
          
          // Also set platform user for unified interface
          const platform = farcasterUserToPlatformUser(session.user, session.token);
          setPlatformUser(platform);
        } else {
          console.log('[useAuth] No existing session found');
        }
      } catch (error) {
        console.error('[useAuth] Error checking existing session:', error);
        // Clear invalid session data
        FarcasterAuthHelpers.logout(isDevelopment, devAuth);
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
      const result = await FarcasterAuthHelpers.login(isDevelopment, devAuth);
      
      // Store auth state
      console.log('[useAuth] Setting auth state...');
      setToken(result.token);
      setUser(result.user);
      setFid(result.fid);
      setIsAuthenticated(true);
      
      // Also set platform user for unified interface
      const platform = farcasterUserToPlatformUser(result.user, result.token);
      setPlatformUser(platform);
      
      console.log('[useAuth] Authentication successful! FID:', result.fid);
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
    setPlatformUser(null);
    setIsAuthenticated(false);
    
    // Clear session using helper
    FarcasterAuthHelpers.logout(isDevelopment, devAuth);
    
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
    // Unified interface
    userId: fid ? String(fid) : null,
    platformUser,
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
