/**
 * Farcaster Auth Platform Implementation
 * Handles Farcaster Quick Auth for mini-app environment
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { detectEnvironment } from '@/lib/environment';
import { useAuthDev } from '@/hooks/useAuthDev';
import type { AuthProvider, PlatformUser } from '../types';

// Session storage keys
const AUTH_TOKEN_KEY = 'caporslap_auth_token';
const AUTH_USER_KEY = 'caporslap_auth_user';

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

/**
 * Creates a Farcaster auth provider
 * Uses Quick Auth in production, dev wallet auth in development
 */
export function createFarcasterAuthProvider(): AuthProvider {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fid, setFid] = useState<number | null>(null);
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check if we're in development mode (not in Base App)
  const isDevelopment = typeof window !== 'undefined' && detectEnvironment() === 'web';
  
  // Note: useAuthDev is a hook, so we need to handle this differently
  // For now, we'll keep the logic in useAuth and call this from there
  // This is a factory function that will be used by the hook

  // This will be implemented as a hook wrapper in useAuth.ts
  // The actual implementation stays there for now to maintain hook rules
  return {
    isReady: false,
    isAuthenticated: false,
    isLoading: false,
    userId: null,
    user: null,
    token: null,
    login: async () => {},
    logout: () => {},
  };
}

/**
 * Converts Farcaster user to PlatformUser
 */
export function farcasterUserToPlatformUser(farcasterUser: FarcasterUser, token: string | null): PlatformUser {
  return {
    userId: String(farcasterUser.fid),
    displayName: farcasterUser.displayName || farcasterUser.username || `User ${farcasterUser.fid}`,
    avatarUrl: farcasterUser.pfpUrl,
    platform: 'farcaster',
    fid: farcasterUser.fid,
    username: farcasterUser.username,
  };
}

/**
 * Farcaster-specific auth logic helpers
 */
export const FarcasterAuthHelpers = {
  /**
   * Check for existing Farcaster session
   */
  async checkExistingSession(isDevelopment: boolean, devAuth: ReturnType<typeof useAuthDev>) {
    if (isDevelopment) {
      if (devAuth.isConnected && devAuth.fid && devAuth.user) {
        return {
          token: 'dev_token',
          user: devAuth.user,
          fid: devAuth.fid,
        };
      }
      return null;
    }

    // Production mode: check for Quick Auth token
    const storedToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = sessionStorage.getItem(AUTH_USER_KEY);
    
    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser) as FarcasterUser;
      return {
        token: storedToken,
        user: parsedUser,
        fid: parsedUser.fid,
      };
    }

    return null;
  },

  /**
   * Login using Farcaster Quick Auth or dev wallet
   */
  async login(isDevelopment: boolean, devAuth: ReturnType<typeof useAuthDev>): Promise<{
    token: string;
    user: FarcasterUser;
    fid: number;
  }> {
    if (isDevelopment) {
      await devAuth.connect();
      if (devAuth.fid && devAuth.user) {
        return {
          token: 'dev_token',
          user: devAuth.user,
          fid: devAuth.fid,
        };
      }
      throw new Error('Dev auth connection failed');
    }

    // Production mode: use Quick Auth
    const { sdk } = await import('@farcaster/miniapp-sdk');
    const result = await sdk.quickAuth.getToken();
    const authToken = result.token;

    // Verify the token with our backend
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
    }

    // Persist to session storage
    sessionStorage.setItem(AUTH_TOKEN_KEY, authToken);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));

    return {
      token: authToken,
      user: userData,
      fid: data.fid,
    };
  },

  /**
   * Logout and clear session
   */
  logout(isDevelopment: boolean, devAuth: ReturnType<typeof useAuthDev>) {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    
    if (isDevelopment) {
      devAuth.disconnect();
    }
  },
};
