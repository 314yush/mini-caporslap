/**
 * Identity Resolver
 * Resolves wallet addresses to human-readable names
 * Priority: ENS > Basename > Farcaster > Truncated Address
 */

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

export interface ResolvedIdentity {
  address: string;
  displayName: string;
  avatarUrl?: string;
  source: 'ens' | 'basename' | 'farcaster' | 'address';
}

// Cache resolved identities to avoid repeated lookups
const identityCache = new Map<string, ResolvedIdentity>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const CACHE_TTL_LEADERBOARD = 7 * 24 * 60 * 60 * 1000; // 7 days for leaderboard entries
const cacheTimestamps = new Map<string, number>();

// Mainnet client for ENS resolution
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_ID 
    ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`
    : 'https://eth.llamarpc.com'
  ),
});

/**
 * Truncates an address for display
 */
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Resolves an address to ENS name
 */
async function resolveENS(address: string): Promise<{ name: string; avatar?: string } | null> {
  try {
    const ensName = await mainnetClient.getEnsName({
      address: address as `0x${string}`,
    });
    
    if (!ensName) return null;
    
    // Try to get ENS avatar
    let avatar: string | undefined;
    try {
      const ensAvatar = await mainnetClient.getEnsAvatar({
        name: ensName,
      });
      avatar = ensAvatar || undefined;
    } catch {
      // Avatar fetch failed, continue without it
    }
    
    return { name: ensName, avatar };
  } catch (error) {
    console.error('[Identity] ENS resolution error:', error);
    return null;
  }
}

/**
 * Resolves an address to Basename (Base's name service)
 * Uses Base's L2 resolver
 */
async function resolveBasename(_address: string): Promise<{ name: string } | null> {
  try {
    // Base name service uses a different approach
    // For now, we'll use a simple API call to check
    // In production, you'd call the Basename contract directly
    
    // Placeholder - Basename resolution would go here
    // The contract is at 0x...on Base
    return null;
  } catch (error) {
    console.error('[Identity] Basename resolution error:', error);
    return null;
  }
}

/**
 * Resolves an address to Farcaster username via Neynar API
 */
async function resolveFarcaster(address: string): Promise<{ name: string; avatar?: string } | null> {
  const neynarKey = process.env.NEYNAR_API_KEY;
  if (!neynarKey) {
    return null;
  }
  
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': neynarKey,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const users = data[address.toLowerCase()];
    
    if (!users || users.length === 0) {
      return null;
    }
    
    const user = users[0];
    if (!user.username) {
      return null;
    }
    return {
      name: `@${user.username}`,
      avatar: user.pfp_url,
    };
  } catch (error) {
    console.error('[Identity] Farcaster resolution error:', error);
    return null;
  }
}

/**
 * Checks if a string is a valid Ethereum address
 */
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Main identity resolution function
 * Tries ENS -> Basename -> Farcaster -> Truncated address
 */
export async function resolveIdentity(address: string): Promise<ResolvedIdentity> {
  if (!address) {
    return {
      address: '',
      displayName: 'Unknown',
      source: 'address',
    };
  }
  
  // If not a valid Ethereum address (e.g., guest UUID), skip resolution
  if (!isValidEthereumAddress(address)) {
    return {
      address,
      displayName: address.startsWith('guest_') 
        ? 'Guest' 
        : truncateAddress(address),
      source: 'address',
    };
  }
  
  const normalizedAddress = address.toLowerCase();
  
  // Check cache first
  const cached = identityCache.get(normalizedAddress);
  const cacheTime = cacheTimestamps.get(normalizedAddress);
  if (cached && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
    return cached;
  }
  
  // Try ENS first (most common for Ethereum users)
  const ensResult = await resolveENS(address);
  if (ensResult?.name) {
    const identity: ResolvedIdentity = {
      address,
      displayName: ensResult.name,
      avatarUrl: ensResult.avatar,
      source: 'ens',
    };
    identityCache.set(normalizedAddress, identity);
    cacheTimestamps.set(normalizedAddress, Date.now());
    return identity;
  }
  
  // Try Basename (for Base users)
  const basenameResult = await resolveBasename(address);
  if (basenameResult?.name) {
    const identity: ResolvedIdentity = {
      address,
      displayName: basenameResult.name,
      source: 'basename',
    };
    identityCache.set(normalizedAddress, identity);
    cacheTimestamps.set(normalizedAddress, Date.now());
    return identity;
  }
  
  // Try Farcaster
  const farcasterResult = await resolveFarcaster(address);
  if (farcasterResult?.name) {
    const identity: ResolvedIdentity = {
      address,
      displayName: farcasterResult.name,
      avatarUrl: farcasterResult.avatar,
      source: 'farcaster',
    };
    identityCache.set(normalizedAddress, identity);
    cacheTimestamps.set(normalizedAddress, Date.now());
    return identity;
  }
  
  // Fallback to truncated address
  const identity: ResolvedIdentity = {
    address,
    displayName: truncateAddress(address),
    source: 'address',
  };
  identityCache.set(normalizedAddress, identity);
  cacheTimestamps.set(normalizedAddress, Date.now());
  return identity;
}

/**
 * Batch resolve multiple addresses
 * More efficient for leaderboards
 */
export async function resolveIdentities(addresses: string[]): Promise<Map<string, ResolvedIdentity>> {
  const results = new Map<string, ResolvedIdentity>();
  
  // Process in parallel with concurrency limit
  const batchSize = 5;
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(addr => resolveIdentity(addr))
    );
    
    batch.forEach((addr, idx) => {
      results.set(addr.toLowerCase(), batchResults[idx]);
    });
  }
  
  return results;
}

/**
 * Clear identity cache (useful for testing)
 */
export function clearIdentityCache(): void {
  identityCache.clear();
  cacheTimestamps.clear();
}

