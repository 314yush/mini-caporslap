'use client';

import { useState, useEffect, useCallback } from 'react';
import { createWalletClient, custom, getAddress, type Address } from 'viem';
import { base } from 'viem/chains';
import type { FarcasterUser } from './useAuth';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

/**
 * Development mode authentication hook
 * Uses wallet connection (MetaMask, Rabby, etc.) for local testing
 * Only active when NOT in Base App environment
 */
export function useAuthDev() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [mockFid, setMockFid] = useState<number | null>(null);
  const [mockUser, setMockUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate a consistent mock FID from wallet address
  const generateMockFid = useCallback((addr: string): number => {
    // Convert address to a number between 1000-999999 (realistic FID range)
    const hash = addr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 1000 + (hash % 998000);
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    setIsLoading(true);
    try {
      // Check if wallet is available
      if (!window.ethereum) {
        throw new Error('No wallet found. Please install MetaMask, Rabby, or another Ethereum wallet.');
      }

      // Create wallet client
      const client = createWalletClient({
        chain: base,
        transport: custom(window.ethereum as never),
      });

      // Request account access
      const accounts = await client.requestAddresses();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }
      const address = getAddress(accounts[0] as Address);

      // Generate mock FID from address
      const fid = generateMockFid(address);

      // Create mock user
      const user: FarcasterUser = {
        fid,
        username: `dev_${address.slice(2, 8)}`,
        displayName: `Dev User ${address.slice(2, 8)}`,
      };

      setAddress(address);
      setMockFid(fid);
      setMockUser(user);
      setIsConnected(true);

      // Store in session storage
      sessionStorage.setItem('dev_auth_address', address);
      sessionStorage.setItem('dev_auth_fid', String(fid));
      sessionStorage.setItem('dev_auth_user', JSON.stringify(user));

      console.log('[Dev Auth] Connected:', { address, fid, user });
    } catch (error) {
      console.error('[Dev Auth] Connection failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [generateMockFid]);

  // Disconnect
  const disconnect = useCallback(() => {
    setAddress(null);
    setMockFid(null);
    setMockUser(null);
    setIsConnected(false);
    
    sessionStorage.removeItem('dev_auth_address');
    sessionStorage.removeItem('dev_auth_fid');
    sessionStorage.removeItem('dev_auth_user');
    
    console.log('[Dev Auth] Disconnected');
  }, []);

  // Restore session on mount
  useEffect(() => {
    const storedAddress = sessionStorage.getItem('dev_auth_address');
    const storedFid = sessionStorage.getItem('dev_auth_fid');
    const storedUser = sessionStorage.getItem('dev_auth_user');

    if (storedAddress && storedFid && storedUser) {
      setAddress(storedAddress);
      setMockFid(Number(storedFid));
      setMockUser(JSON.parse(storedUser));
      setIsConnected(true);
      console.log('[Dev Auth] Restored session:', { address: storedAddress, fid: storedFid });
    }
  }, []);

  return {
    isConnected,
    address,
    fid: mockFid,
    user: mockUser,
    isLoading,
    connect,
    disconnect,
  };
}
