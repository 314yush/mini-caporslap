/**
 * Auth Abstraction Layer Types
 * Unified interface for different authentication providers (Farcaster, Privy, etc.)
 */

export interface PlatformUser {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  platform: 'farcaster' | 'privy' | 'anonymous';
  // Platform-specific data
  fid?: number; // Farcaster ID (for Farcaster platform)
  username?: string; // Username (for Farcaster)
  walletAddress?: string; // Wallet address (for Privy/wallet-based auth)
}

export interface AuthProvider {
  isReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  user: PlatformUser | null;
  token: string | null;
  login: () => Promise<void>;
  logout: () => void;
}

/**
 * Platform-specific auth provider factory type
 */
export type AuthProviderFactory = () => AuthProvider;
