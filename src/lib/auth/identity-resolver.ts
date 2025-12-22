/**
 * Identity Resolver
 * Resolves user IDs (FIDs, wallet addresses, etc.) to human-readable names
 * Priority: Farcaster Username > ENS > Basename > Truncated Address
 * 
 * For FIDs: Resolves to @username via Neynar API
 * For wallet addresses: Tries Farcaster username, then ENS, then Basename, then truncated
 * For Privy UUIDs: Shows truncated UUID (wallet addresses are preferred as userId)
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

/**
 * Clear cache for a specific identity (useful when we need to force re-resolution)
 */
export function clearIdentityCacheFor(userId: string): void {
  const normalized = String(userId).toLowerCase();
  identityCache.delete(normalized);
  cacheTimestamps.delete(normalized);
}

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
 * Handles short strings (like FIDs) by showing them in full if too short
 */
export function truncateAddress(address: string): string {
  if (!address) return '';
  
  // For very short strings (like FIDs), don't truncate
  if (address.length <= 10) {
    return address;
  }
  
  // For addresses, show first 6 and last 4 chars
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
 * Resolves a Farcaster FID to username via Neynar API
 */
async function resolveFarcasterByFID(fid: string): Promise<{ name: string; avatar?: string } | null> {
  const neynarKey = process.env.NEYNAR_API_KEY;
  if (!neynarKey) {
    return null;
  }
  
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user?fid=${fid}`,
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
    const user = data.result?.user;
    
    if (!user?.username) {
      return null;
    }
    
    return {
      name: `@${user.username}`,
      avatar: user.pfp_url,
    };
  } catch (error) {
    console.error('[Identity] Farcaster FID resolution error:', error);
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
 * Checks if a string is a UUID (Privy user ID format)
 */
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Main identity resolution function
 * Priority: Farcaster Username > ENS > Basename > Truncated Address
 * Handles: Ethereum addresses, Farcaster FIDs, Privy UUIDs, guest IDs
 */
export async function resolveIdentity(address: string | number | null | undefined): Promise<ResolvedIdentity> {
  // Convert to string and handle null/undefined
  const addressStr = address ? String(address) : '';
  
  if (!addressStr) {
    return {
      address: '',
      displayName: 'Unknown',
      source: 'address',
    };
  }
  
  // Handle guest IDs
  if (addressStr.startsWith('guest_')) {
    return {
      address: addressStr,
      displayName: 'Guest',
      source: 'address',
    };
  }
  
  // Handle Privy UUIDs (e.g., cfe0672c-ca44-40eb-9ba3-94a6680eb179)
  // Note: Privy users with wallets should use wallet address as userId, so this is rare
  if (isUUID(addressStr)) {
    return {
      address: addressStr,
      displayName: truncateAddress(addressStr), // Show truncated UUID (e.g., "cfe0672c...eb179")
      source: 'address',
    };
  }
  
  // Handle numeric FIDs (Farcaster IDs) - resolve username
  if (/^\d+$/.test(addressStr)) {
    const normalizedFid = addressStr;
    
    // Check cache first
    const cached = identityCache.get(normalizedFid);
    const cacheTime = cacheTimestamps.get(normalizedFid);
    if (cached && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
      return cached;
    }
    
    // Try to resolve Farcaster username
    const farcasterResult = await resolveFarcasterByFID(addressStr);
    if (farcasterResult?.name) {
      const identity: ResolvedIdentity = {
        address: addressStr,
        displayName: farcasterResult.name, // @username format
        avatarUrl: farcasterResult.avatar,
        source: 'farcaster',
      };
      identityCache.set(normalizedFid, identity);
      cacheTimestamps.set(normalizedFid, Date.now());
      return identity;
    }
    
    // If username resolution fails, show FID as-is (don't truncate short numbers)
    // This should be rare - most FIDs should resolve to usernames
    const identity: ResolvedIdentity = {
      address: addressStr,
      displayName: `FID ${addressStr}`, // Fallback: show as "FID 3626" instead of truncated
      source: 'farcaster',
    };
    identityCache.set(normalizedFid, identity);
    cacheTimestamps.set(normalizedFid, Date.now());
    return identity;
  }
  
  // If not a valid Ethereum address, return truncated version
  if (!isValidEthereumAddress(addressStr)) {
    return {
      address: addressStr,
      displayName: truncateAddress(addressStr),
      source: 'address',
    };
  }
  
  const normalizedAddress = addressStr.toLowerCase();
  
  // Check cache first
  const cached = identityCache.get(normalizedAddress);
  const cacheTime = cacheTimestamps.get(normalizedAddress);
  if (cached && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
    return cached;
  }
  
  // For wallet addresses, priority: Farcaster username > ENS > Basename > Truncated address
  // Try Farcaster first (username is most user-friendly)
  const farcasterResult = await resolveFarcaster(addressStr);
  if (farcasterResult?.name) {
    const identity: ResolvedIdentity = {
      address: addressStr,
      displayName: farcasterResult.name, // @username format
      avatarUrl: farcasterResult.avatar,
      source: 'farcaster',
    };
    identityCache.set(normalizedAddress, identity);
    cacheTimestamps.set(normalizedAddress, Date.now());
    return identity;
  }
  
  // Try ENS (second priority)
  const ensResult = await resolveENS(addressStr);
  if (ensResult?.name) {
    const identity: ResolvedIdentity = {
      address: addressStr,
      displayName: ensResult.name,
      avatarUrl: ensResult.avatar,
      source: 'ens',
    };
    identityCache.set(normalizedAddress, identity);
    cacheTimestamps.set(normalizedAddress, Date.now());
    return identity;
  }
  
  // Try Basename (for Base users)
  const basenameResult = await resolveBasename(addressStr);
  if (basenameResult?.name) {
    const identity: ResolvedIdentity = {
      address: addressStr,
      displayName: basenameResult.name,
      source: 'basename',
    };
    identityCache.set(normalizedAddress, identity);
    cacheTimestamps.set(normalizedAddress, Date.now());
    return identity;
  }
  
  // Fallback to truncated address
  const identity: ResolvedIdentity = {
    address: addressStr,
    displayName: truncateAddress(addressStr),
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
      const addrStr = String(addr || '');
      results.set(addrStr.toLowerCase(), batchResults[idx]);
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

