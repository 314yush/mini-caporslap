'use client';

import { useState, useEffect, useCallback } from 'react';
import { detectEnvironment } from '@/lib/environment';
import { FarcasterAuthHelpers, farcasterUserToPlatformUser } from '@/lib/auth/platforms/farcaster';
import { PrivyAuthHelpers, privyUserToPlatformUser, type PrivyUser } from '@/lib/auth/platforms/privy';
import type { PlatformUser } from '@/lib/auth/types';
import { usePrivy } from '@privy-io/react-auth';

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
  const [authPlatform, setAuthPlatform] = useState<'farcaster' | 'privy' | null>(null);

  // Environment detection
  const isMiniApp = typeof window !== 'undefined' && detectEnvironment() === 'miniapp';
  const isWeb = typeof window !== 'undefined' && detectEnvironment() === 'web';

  // Privy hook (always available, safe to call)
  const {
    ready: privyReady,
    authenticated: privyAuthenticated,
    user: privyUser,
    login: privyLogin,
    logout: privyLogout,
  } = usePrivy();

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      // Try Farcaster Quick Auth first if in miniapp
      if (isMiniApp) {
        try {
          const session = await FarcasterAuthHelpers.checkExistingSession(false);
          
          if (session) {
            setToken(session.token);
            setUser(session.user);
            setFid(session.fid);
            setIsAuthenticated(true);
            setAuthPlatform('farcaster');
            
            // Also set platform user for unified interface
            const platform = farcasterUserToPlatformUser(session.user, session.token);
            setPlatformUser(platform);
            setIsReady(true);
            return;
          }
        } catch (error) {
          console.warn('[useAuth] Farcaster session check failed, will try Privy:', error);
        }
      }

      // Check Privy session (for web or as fallback)
      if (privyReady) {
        const privySession = PrivyAuthHelpers.checkExistingSession(
          privyReady,
          privyAuthenticated,
          privyUser as PrivyUser | null
        );
        
        if (privySession && privyUser) {
          const platform = privyUserToPlatformUser(privyUser as PrivyUser);
          setPlatformUser(platform);
          setIsAuthenticated(true);
          setAuthPlatform('privy');
          // Privy doesn't use tokens or FID
          setToken(null);
          setFid(null);
          setUser(null);
          setIsReady(true);
          return;
        }
      }

      setIsReady(privyReady || !isMiniApp); // Ready if Privy is ready or we're not in miniapp
    };

    checkExistingSession();
  }, [isMiniApp, privyReady, privyAuthenticated, privyUser]);

  // Login using Quick Auth (Base App) or Privy (web/fallback)
  const login = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Try Farcaster Quick Auth first if in miniapp
      if (isMiniApp) {
        try {
          const result = await FarcasterAuthHelpers.login(false);
          
          // Store auth state
          setToken(result.token);
          setUser(result.user);
          setFid(result.fid);
          setIsAuthenticated(true);
          setAuthPlatform('farcaster');
          
          // Also set platform user for unified interface
          const platform = farcasterUserToPlatformUser(result.user, result.token);
          setPlatformUser(platform);
          setIsLoading(false);
          return;
        } catch (error) {
          console.warn('[useAuth] Quick Auth failed, falling back to Privy:', error);
          // Fall through to Privy fallback
        }
      }

      // Use Privy for web or as fallback
      await PrivyAuthHelpers.login(privyLogin);
      // Privy state is managed by usePrivy hook, will be updated in useEffect
      setAuthPlatform('privy');
    } catch (error) {
      console.error('[useAuth] Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isMiniApp, privyLogin]);

  // Logout
  const logout = useCallback(() => {
    // Clear state
    setToken(null);
    setUser(null);
    setFid(null);
    setPlatformUser(null);
    setIsAuthenticated(false);
    setAuthPlatform(null);
    
    // Logout from appropriate platform
    if (authPlatform === 'farcaster') {
      FarcasterAuthHelpers.logout(false);
    } else if (authPlatform === 'privy') {
      PrivyAuthHelpers.logout(privyLogout);
    }
  }, [authPlatform, privyLogout]);

  // Update Privy state when it changes (for login/logout events)
  useEffect(() => {
    // Only update if we're using Privy (either set as platform or in web environment)
    if ((authPlatform === 'privy' || (!authPlatform && isWeb)) && privyReady) {
      if (privyAuthenticated && privyUser) {
        const platform = privyUserToPlatformUser(privyUser as PrivyUser);
        setPlatformUser(platform);
        setIsAuthenticated(true);
        setAuthPlatform('privy');
        // Privy doesn't use tokens or FID
        setToken(null);
        setFid(null);
        setUser(null);
      } else if (!privyAuthenticated && authPlatform === 'privy') {
        // User logged out via Privy
        setIsAuthenticated(false);
        setPlatformUser(null);
        setAuthPlatform(null);
      }
    }
  }, [authPlatform, isWeb, privyReady, privyAuthenticated, privyUser]);

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
    userId: platformUser?.userId || (fid ? String(fid) : null),
    platformUser,
  };
}

/**
 * Hook to get just the user ID (FID as string for Farcaster, wallet/ID for Privy)
 * Useful for API calls
 */
export function useUserId(): string {
  const { userId } = useAuth();
  return userId || '';
}
