/**
 * Privy Auth Platform Implementation
 * Handles Privy authentication for desktop/web environment
 */

'use client';

import type { PlatformUser } from '../types';

// Privy user type (based on @privy-io/react-auth)
export interface PrivyUser {
  id: string;
  wallet?: {
    address: string;
    chainId?: string;
    walletClientType?: string;
    ens?: {
      domain?: string;
      avatar?: string;
    };
  };
  email?: {
    address: string;
  };
  google?: {
    email: string;
    name?: string;
    picture?: string;
  };
  twitter?: {
    username?: string;
    name?: string;
    profilePictureUrl?: string;
  };
  // Add other Privy user fields as needed
}

/**
 * Converts Privy user to PlatformUser
 */
export function privyUserToPlatformUser(privyUser: PrivyUser): PlatformUser {
  // Normalize userId: prefer wallet address, fallback to Privy ID
  const userId = privyUser.wallet?.address || privyUser.id;
  
  // Get display name
  let displayName = 'User';
  if (privyUser.wallet?.address) {
    // Use ENS domain if available, otherwise truncated address
    if (privyUser.wallet.ens?.domain) {
      displayName = privyUser.wallet.ens.domain;
    } else {
      displayName = `${privyUser.wallet.address.slice(0, 6)}...${privyUser.wallet.address.slice(-4)}`;
    }
  } else if (privyUser.google?.name) {
    displayName = privyUser.google.name;
  } else if (privyUser.twitter?.name) {
    displayName = privyUser.twitter.name;
  } else if (privyUser.email?.address) {
    displayName = privyUser.email.address.split('@')[0];
  }
  
  // Get avatar
  const avatarUrl = 
    privyUser.wallet?.ens?.avatar ||
    privyUser.google?.picture ||
    privyUser.twitter?.profilePictureUrl ||
    undefined;
  
  return {
    userId,
    displayName,
    avatarUrl,
    platform: 'privy',
    walletAddress: privyUser.wallet?.address,
  };
}

/**
 * Privy-specific auth logic helpers
 * Note: Privy manages sessions internally, so these are mainly wrappers
 */
export const PrivyAuthHelpers = {
  /**
   * Check for existing Privy session
   * Privy handles this internally via usePrivy hook
   * This is mainly for consistency with FarcasterAuthHelpers interface
   */
  checkExistingSession(privyReady: boolean, privyAuthenticated: boolean, privyUser: PrivyUser | null) {
    if (!privyReady) {
      return null;
    }

    if (privyAuthenticated && privyUser) {
      return {
        user: privyUser,
        token: null, // Privy doesn't use tokens in the same way
      };
    }

    return null;
  },

  /**
   * Login using Privy
   * Privy handles the UI and flow internally
   * Note: privyLogin may return void or Promise<void>
   */
  async login(privyLogin: () => void | Promise<void>) {
    const result = privyLogin();
    if (result instanceof Promise) {
      await result;
    }
  },

  /**
   * Logout using Privy
   */
  logout(privyLogout: () => void) {
    privyLogout();
  },
};
