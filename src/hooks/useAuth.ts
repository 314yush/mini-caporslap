'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect, useCallback } from 'react';
import { resolveIdentity, ResolvedIdentity } from '@/lib/auth/identity-resolver';

export interface AuthState {
  // Connection state
  isReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // User info
  address: string | null;
  identity: ResolvedIdentity | null;
  
  // Auth methods
  login: () => void;
  logout: () => Promise<void>;
  
  // Guest mode (for playing without wallet)
  isGuest: boolean;
  playAsGuest: () => void;
}

// Generate anonymous user ID for guests
function getGuestId(): string {
  if (typeof window === 'undefined') return '';
  
  let guestId = localStorage.getItem('caporslap_guest_id');
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('caporslap_guest_id', guestId);
  }
  return guestId;
}

export function useAuth(): AuthState {
  const { ready, authenticated, login, logout: privyLogout, user } = usePrivy();
  const { wallets } = useWallets();
  
  const [identity, setIdentity] = useState<ResolvedIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  
  // Get the primary wallet address
  const primaryWallet = wallets?.[0];
  const address = primaryWallet?.address || user?.wallet?.address || null;
  
  // Resolve identity when address changes
  useEffect(() => {
    async function resolve() {
      if (!address) {
        setIdentity(null);
        return;
      }
      
      setIsLoading(true);
      try {
        const resolved = await resolveIdentity(address);
        setIdentity(resolved);
      } catch (error) {
        console.error('[useAuth] Identity resolution failed:', error);
        setIdentity({
          address,
          displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
          source: 'address',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    resolve();
  }, [address]);
  
  // Handle logout
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      await privyLogout();
      setIdentity(null);
      setIsGuest(false);
    } finally {
      setIsLoading(false);
    }
  }, [privyLogout]);
  
  // Play as guest (no wallet)
  const playAsGuest = useCallback(() => {
    const guestId = getGuestId();
    setIsGuest(true);
    setIdentity({
      address: guestId,
      displayName: 'Guest',
      source: 'address',
    });
  }, []);
  
  return {
    isReady: ready,
    isAuthenticated: authenticated || isGuest,
    isLoading,
    address: isGuest ? getGuestId() : address,
    identity,
    login,
    logout: handleLogout,
    isGuest,
    playAsGuest,
  };
}

/**
 * Hook to get just the user ID (address or guest ID)
 * Useful for API calls
 */
export function useUserId(): string {
  const { address, isGuest } = useAuth();
  
  if (isGuest) {
    return getGuestId();
  }
  
  return address || getGuestId();
}


