import { Redis } from '@upstash/redis';
import { LeaderboardEntry, Run, User } from './game-core/types';
import { truncateAddress } from './auth/identity-resolver';

/**
 * Upstash Redis integration for CapOrSlap
 * Handles leaderboard storage and user best streaks
 */

// Initialize Redis client (lazy - only when env vars are present)
let redis: Redis | null = null;
let redisInitialized = false;
let redisError: string | null = null;

/**
 * Validates Redis URL format
 */
function isValidRedisUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Upstash URLs should be https://*.upstash.io or similar
    return urlObj.protocol === 'https:' && urlObj.hostname.includes('upstash');
  } catch {
    return false;
  }
}

/**
 * Validates Redis token format (should be a non-empty string)
 */
function isValidRedisToken(token: string): boolean {
  return typeof token === 'string' && token.length > 0 && token.trim().length > 0;
}

/**
 * Gets or initializes the Redis client
 * Returns null if Redis is not configured or invalid
 */
export function getRedis(): Redis | null {
  // Return cached client if already initialized
  if (redisInitialized) {
    return redis;
  }
  
  redisInitialized = true;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  // Check if env vars are present
  if (!url || !token) {
    console.warn('[Redis] Upstash Redis not configured - leaderboard disabled');
    console.warn('[Redis] Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env');
    redisError = 'Redis environment variables not set';
    return null;
  }
  
  // Validate URL format
  if (!isValidRedisUrl(url)) {
    console.error('[Redis] Invalid Redis URL format:', url);
    console.error('[Redis] Expected format: https://*.upstash.io');
    redisError = `Invalid Redis URL format: ${url}`;
    return null;
  }
  
  // Validate token format
  if (!isValidRedisToken(token)) {
    console.error('[Redis] Invalid Redis token format');
    redisError = 'Invalid Redis token format';
    return null;
  }
  
  try {
    redis = new Redis({ url, token });
    console.log('[Redis] Redis client initialized successfully');
    return redis;
  } catch (error) {
    console.error('[Redis] Failed to initialize Redis client:', error);
    redisError = error instanceof Error ? error.message : 'Unknown error';
    return null;
  }
}

/**
 * Tests Redis connection by performing a simple ping operation
 * Returns true if connection is working, false otherwise
 */
export async function testRedisConnection(): Promise<boolean> {
  const client = getRedis();
  if (!client) {
    return false;
  }
  
  try {
    // Try a simple operation to test connection
    await client.ping();
    console.log('[Redis] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Redis] Connection test failed:', error);
    redisError = error instanceof Error ? error.message : 'Connection test failed';
    return false;
  }
}

/**
 * Gets the last Redis error message, if any
 */
export function getRedisError(): string | null {
  return redisError;
}

/**
 * Resets the Redis client (useful for testing or reconnection)
 */
export function resetRedis(): void {
  redis = null;
  redisInitialized = false;
  redisError = null;
}

// Redis key patterns
const KEYS = {
  weeklyLeaderboard: () => `leaderboard:weekly:${getWeekKey()}`,
  globalLeaderboard: () => 'leaderboard:global',
  userBestStreak: (userId: string) => `user:${userId}:best`,
  userProfile: (userId: string) => `user:${userId}:profile`,
  runData: (runId: string) => `run:${runId}`,
  // Weekly cumulative score tracking
  weeklyCumulativeScores: () => `scores:weekly:${getWeekKey()}:cumulative`,
  userWeeklyStats: (userId: string) => `user:${userId}:weekly:${getWeekKey()}`,
};

/**
 * Gets the current week key (YYYY-WW format)
 */
function getWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-${week.toString().padStart(2, '0')}`;
}

/**
 * Submits a run to the leaderboard
 * @param run - Completed run data
 * @param user - User who completed the run
 * @returns Whether submission was successful
 */
export async function submitToLeaderboard(run: Run, user: User): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  
  try {
    // Store run data
    await client.set(KEYS.runData(run.runId), JSON.stringify(run), { ex: 60 * 60 * 24 * 7 }); // 7 days
    
    // Store user profile for display
    await client.set(KEYS.userProfile(user.userId), JSON.stringify(user));
    
    // Get user's current best streak
    const currentBest = await client.get<number>(KEYS.userBestStreak(user.userId)) || 0;
    
    // Only update leaderboard if this is a new best
    if (run.streak > currentBest) {
      // Update user's best streak
      await client.set(KEYS.userBestStreak(user.userId), run.streak);
      
      // Add to weekly leaderboard (sorted set, score = streak)
      await client.zadd(KEYS.weeklyLeaderboard(), {
        score: run.streak,
        member: JSON.stringify({
          usedReprieve: run.usedReprieve,
          timestamp: run.timestamp,
          userId: user.userId,
        }),
      });
      
      // Add to global leaderboard
      await client.zadd(KEYS.globalLeaderboard(), {
        score: run.streak,
        member: JSON.stringify({
          usedReprieve: run.usedReprieve,
          timestamp: run.timestamp,
          userId: user.userId,
        }),
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting to leaderboard:', error);
    return false;
  }
}

/**
 * Gets the weekly leaderboard
 * @param limit - Max entries to return
 * @returns Array of leaderboard entries
 */
export async function getWeeklyLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const client = getRedis();
  if (!client) return [];
  
  try {
    // Get top scores (descending)
    const results = await client.zrange<string[]>(KEYS.weeklyLeaderboard(), 0, limit - 1, {
      rev: true,
      withScores: true,
    });
    
    return await formatLeaderboardResults(results);
  } catch (error) {
    console.error('Error fetching weekly leaderboard:', error);
    return [];
  }
}

/**
 * Gets the global (all-time) leaderboard
 * @param limit - Max entries to return
 * @returns Array of leaderboard entries
 */
export async function getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const client = getRedis();
  if (!client) return [];
  
  try {
    const results = await client.zrange<string[]>(KEYS.globalLeaderboard(), 0, limit - 1, {
      rev: true,
      withScores: true,
    });
    
    return await formatLeaderboardResults(results);
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    return [];
  }
}

/**
 * Gets a user's rank in the weekly leaderboard
 * @param userId - User ID
 * @returns Rank (1-indexed) or null if not found
 */
export async function getUserWeeklyRank(userId: string): Promise<number | null> {
  const client = getRedis();
  if (!client) return null;
  
  try {
    // Use zrevrank to directly look up userId (works for both JSON and plain string formats)
    // First try direct lookup (for plain userId strings stored by submitScoreWithOvertakes)
    const rank = await client.zrevrank(KEYS.weeklyLeaderboard(), userId);
    
    if (rank !== null) {
      return rank + 1; // Convert 0-indexed to 1-indexed
    }
    
    // If not found, try searching through JSON-encoded members (legacy format)
    // This handles old data stored as JSON objects
    const results = await client.zrange<string[]>(KEYS.weeklyLeaderboard(), 0, -1, {
      rev: true,
    });
    
    for (let i = 0; i < results.length; i++) {
      try {
        const member = JSON.parse(results[i]);
        if (member.userId === userId) {
          return i + 1;
        }
      } catch {
        // Skip non-JSON entries (already handled by zrevrank above)
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user rank:', error);
    return null;
  }
}

/**
 * Gets a user's best streak
 * @param userId - User ID
 * @returns Best streak or 0
 */
export async function getUserBestStreak(userId: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;
  
  try {
    const best = await client.get<number>(KEYS.userBestStreak(userId));
    return best || 0;
  } catch (error) {
    console.error('Error fetching user best streak:', error);
    return 0;
  }
}

/**
 * Tracks cumulative weekly score (sum of all streaks in the week)
 * @param userId - User ID
 * @param streak - Streak to add to cumulative score
 * @returns Updated cumulative score
 */
export async function trackWeeklyScore(userId: string, streak: number): Promise<number> {
  const client = getRedis();
  if (!client) return 0;
  
  // Reject guest users - they should not be tracked
  if (userId.startsWith('guest_')) {
    return 0;
  }
  
  try {
    const statsKey = KEYS.userWeeklyStats(userId);
    const scoresKey = KEYS.weeklyCumulativeScores();
    
    // Get current stats
    const statsJson = await client.get(statsKey);
    let stats: {
      cumulativeScore: number;
      bestStreak: number;
      runCount: number;
      lastUpdated: number;
    };
    
    if (statsJson) {
      stats = typeof statsJson === 'string' ? JSON.parse(statsJson) : statsJson;
    } else {
      stats = {
        cumulativeScore: 0,
        bestStreak: 0,
        runCount: 0,
        lastUpdated: Date.now(),
      };
    }
    
    // Update stats
    stats.cumulativeScore += streak;
    stats.bestStreak = Math.max(stats.bestStreak, streak);
    stats.runCount += 1;
    stats.lastUpdated = Date.now();
    
    // Store updated stats
    await client.set(statsKey, JSON.stringify(stats), { ex: 60 * 60 * 24 * 8 }); // 8 days TTL
    
    // Update sorted set for leaderboard (score = cumulative score)
    await client.zadd(scoresKey, {
      score: stats.cumulativeScore,
      member: userId,
    });
    
    // Set TTL on sorted set (8 days)
    await client.expire(scoresKey, 60 * 60 * 24 * 8);
    
    return stats.cumulativeScore;
  } catch (error) {
    console.error('Error tracking weekly score:', error);
    return 0;
  }
}

/**
 * Gets a user's weekly cumulative score
 * @param userId - User ID
 * @returns Cumulative score for current week
 */
export async function getUserWeeklyScore(userId: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;
  
  try {
    const statsKey = KEYS.userWeeklyStats(userId);
    const statsJson = await client.get(statsKey);
    
    if (!statsJson) return 0;
    
    const stats = typeof statsJson === 'string' ? JSON.parse(statsJson) : statsJson;
    return stats.cumulativeScore || 0;
  } catch (error) {
    console.error('Error fetching user weekly score:', error);
    return 0;
  }
}

/**
 * Gets weekly cumulative scores leaderboard
 * @param limit - Max entries to return
 * @returns Array of entries with cumulative scores
 */
export async function getWeeklyCumulativeScores(limit: number = 100): Promise<Array<{
  userId: string;
  cumulativeScore: number;
  bestStreak: number;
  runCount: number;
}>> {
  const client = getRedis();
  if (!client) return [];
  
  try {
    const scoresKey = KEYS.weeklyCumulativeScores();
    
    // Get top scores (descending)
    const results = await client.zrange<string[]>(scoresKey, 0, limit - 1, {
      rev: true,
      withScores: true,
    });
    
    const entries: Array<{
      userId: string;
      cumulativeScore: number;
      bestStreak: number;
      runCount: number;
    }> = [];
    
    // Results come in pairs: [member, score, member, score, ...]
    for (let i = 0; i < results.length; i += 2) {
      const userId = results[i];
      const cumulativeScore = parseInt(results[i + 1], 10);
      
      // Get detailed stats
      const statsKey = KEYS.userWeeklyStats(userId);
      const statsJson = await client.get(statsKey);
      
      let bestStreak = 0;
      let runCount = 0;
      
      if (statsJson) {
        const stats = typeof statsJson === 'string' ? JSON.parse(statsJson) : statsJson;
        bestStreak = stats.bestStreak || 0;
        runCount = stats.runCount || 0;
      }
      
      entries.push({
        userId,
        cumulativeScore,
        bestStreak,
        runCount,
      });
    }
    
    return entries;
  } catch (error) {
    console.error('Error fetching weekly cumulative scores:', error);
    return [];
  }
}

/**
 * Formats raw Redis results into LeaderboardEntry array
 * 
 * Ensures all wallet addresses get their ENS/Farcaster names resolved:
 * - For wallet addresses (0x...), always attempts to resolve ENS/Farcaster names
 * - Re-resolves cached entries if they have truncated addresses or if source is 'address'
 * - Falls back to truncated address only if ENS/Farcaster resolution fails
 * - For FIDs (numeric), resolves to Farcaster usernames
 */
async function formatLeaderboardResults(results: string[]): Promise<LeaderboardEntry[]> {
  const client = getRedis();
  if (!client || results.length === 0) return [];
  
  const entries: LeaderboardEntry[] = [];
  
  // First pass: collect all user IDs and check cache
  for (let i = 0; i < results.length; i += 2) {
    const memberStr = results[i];
    const score = parseInt(results[i + 1], 10);
    
    try {
      let member: { userId: string; usedReprieve?: boolean; timestamp?: number };
      let userId: string;
      
      try {
        member = JSON.parse(memberStr);
        userId = member.userId;
      } catch {
        // Handle plain userId string (not JSON)
        userId = memberStr;
        member = { userId };
      }
      
      // Fetch user profile (might be ResolvedIdentity or User format)
      const userJson = await client.get(KEYS.userProfile(userId));
      let user: User;
      
      if (userJson) {
        const parsed = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
        // Check if it's ResolvedIdentity format (has 'address' and 'source')
        if (parsed.address && parsed.source) {
          // If source is 'address', it means resolution failed before - try again
          if (parsed.source === 'address' && /^0x[a-fA-F0-9]{40}$/.test(parsed.address)) {
            try {
              const { resolveIdentity } = await import('@/lib/auth/identity-resolver');
              const identity = await resolveIdentity(parsed.address);
              // Determine user type
              let userType: 'farcaster' | 'wallet' | 'privy' | 'anon' = 'anon';
              if (identity.source === 'farcaster') {
                userType = 'farcaster';
              } else if (/^0x[a-fA-F0-9]{40}$/i.test(identity.address)) {
                userType = 'wallet';
              } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identity.address)) {
                userType = 'privy';
              }
              // Only update if we got a better resolution (not just address fallback)
              if (identity.source !== 'address') {
                user = {
                  userId: identity.address,
                  userType,
                  displayName: identity.displayName,
                  avatarUrl: identity.avatarUrl,
                };
                // Cache the resolved identity
                await client.set(KEYS.userProfile(userId), JSON.stringify(identity), { ex: 86400 * 7 });
              } else {
                // Still couldn't resolve, use stored data
                user = {
                  userId: parsed.address,
                  userType: 'wallet',
                  displayName: parsed.displayName,
                  avatarUrl: parsed.avatarUrl,
                };
              }
            } catch {
              // Keep stored data if resolution fails
              user = {
                userId: parsed.address,
                userType: 'wallet',
                displayName: parsed.displayName,
                avatarUrl: parsed.avatarUrl,
              };
            }
          } else {
            // Already resolved (ENS, Farcaster, etc.) - use stored data
            // But for wallet addresses, always re-check in case ENS/Farcaster was added
            const isWalletAddress = /^0x[a-fA-F0-9]{40}$/i.test(parsed.address);
            const hasTruncatedName = parsed.displayName && (
              parsed.displayName.includes('...') || 
              parsed.displayName.length < 10 ||
              /^0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}$/i.test(parsed.displayName) // Matches "0x1234...5678" pattern
            );
            
            // Always re-resolve wallet addresses if:
            // 1. They have truncated names (includes "..." pattern)
            // 2. Source is 'address' (means previous resolution failed)
            // 3. Source is 'wallet' (might have ENS/Farcaster now)
            // 4. Display name looks like a truncated address
            if (isWalletAddress && (hasTruncatedName || parsed.source === 'wallet' || parsed.source === 'address')) {
              try {
                const { resolveIdentity, clearIdentityCacheFor } = await import('@/lib/auth/identity-resolver');
                // Clear in-memory cache to force fresh resolution
                clearIdentityCacheFor(parsed.address);
                const identity = await resolveIdentity(parsed.address);
                // Only update if we got a better resolution (ENS, Farcaster, or Basename)
                if (identity.source !== 'address' && identity.displayName !== parsed.displayName) {
                  let userType: 'farcaster' | 'wallet' | 'privy' | 'anon' = 'anon';
                  if (identity.source === 'farcaster') {
                    userType = 'farcaster';
                  } else if (/^0x[a-fA-F0-9]{40}$/i.test(identity.address)) {
                    userType = 'wallet';
                  } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identity.address)) {
                    userType = 'privy';
                  }
                  user = {
                    userId: identity.address,
                    userType,
                    displayName: identity.displayName,
                    avatarUrl: identity.avatarUrl || parsed.avatarUrl,
                  };
                  // Update cache with better resolution
                  await client.set(KEYS.userProfile(userId), JSON.stringify(identity), { ex: 86400 * 7 });
                } else {
                  // Use existing cached data
                  let userType: 'farcaster' | 'wallet' | 'privy' | 'anon' = 'anon';
                  if (parsed.source === 'farcaster') {
                    userType = 'farcaster';
                  } else if (/^0x[a-fA-F0-9]{40}$/i.test(parsed.address)) {
                    userType = 'wallet';
                  } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.address)) {
                    userType = 'privy';
                  }
                  user = {
                    userId: parsed.address,
                    userType,
                    displayName: parsed.displayName,
                    avatarUrl: parsed.avatarUrl,
                  };
                }
              } catch {
                // If resolution fails, use cached data
                let userType: 'farcaster' | 'wallet' | 'privy' | 'anon' = 'anon';
                if (parsed.source === 'farcaster') {
                  userType = 'farcaster';
                } else if (/^0x[a-fA-F0-9]{40}$/i.test(parsed.address)) {
                  userType = 'wallet';
                } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.address)) {
                  userType = 'privy';
                }
                user = {
                  userId: parsed.address,
                  userType,
                  displayName: parsed.displayName,
                  avatarUrl: parsed.avatarUrl,
                };
              }
            } else {
              // Already has good resolution (ENS, Farcaster, etc.) - use stored data
              let userType: 'farcaster' | 'wallet' | 'privy' | 'anon' = 'anon';
              if (parsed.source === 'farcaster') {
                userType = 'farcaster';
              } else if (/^0x[a-fA-F0-9]{40}$/i.test(parsed.address)) {
                userType = 'wallet';
              } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.address)) {
                userType = 'privy';
              }
              user = {
                userId: parsed.address,
                userType,
                displayName: parsed.displayName,
                avatarUrl: parsed.avatarUrl,
              };
            }
          }
        } else {
          // It's already in User format
          user = parsed as User;
          // If userId is an Ethereum address but displayName is truncated, try to resolve ENS
          if (/^0x[a-fA-F0-9]{40}$/.test(user.userId) && 
              (user.displayName.includes('...') || user.displayName.length < 10 || /^0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}$/i.test(user.displayName))) {
            try {
              const { resolveIdentity, clearIdentityCacheFor } = await import('@/lib/auth/identity-resolver');
              // Clear in-memory cache to force fresh resolution
              clearIdentityCacheFor(user.userId);
              const identity = await resolveIdentity(user.userId);
              // Determine user type
              let userType: 'farcaster' | 'wallet' | 'privy' | 'anon' = 'anon';
              if (identity.source === 'farcaster') {
                userType = 'farcaster';
              } else if (/^0x[a-fA-F0-9]{40}$/i.test(identity.address)) {
                userType = 'wallet';
              } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identity.address)) {
                userType = 'privy';
              }
              // Only update if we got a better resolution
              if (identity.source !== 'address') {
                user = {
                  userId: identity.address,
                  userType,
                  displayName: identity.displayName,
                  avatarUrl: identity.avatarUrl || user.avatarUrl,
                };
                // Cache the resolved identity
                await client.set(KEYS.userProfile(userId), JSON.stringify(identity), { ex: 86400 * 7 });
              }
            } catch {
              // Keep existing user if resolution fails
            }
          }
        }
      } else {
        // No profile found - try to resolve identity
        // Check if it's an Ethereum address, FID (numeric), Privy UUID, or other format
        const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(userId);
        const isFID = /^\d+$/.test(userId);
        const isPrivyUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
        
        if (isEthereumAddress || isFID) {
          // Import resolveIdentity dynamically to avoid circular dependency
          const { resolveIdentity, clearIdentityCacheFor } = await import('@/lib/auth/identity-resolver');
          try {
            // For wallet addresses, clear cache to ensure fresh resolution
            if (isEthereumAddress) {
              clearIdentityCacheFor(userId);
            }
            const identity = await resolveIdentity(userId);
            // Determine user type
            let userType: 'farcaster' | 'wallet' | 'privy' | 'anon' = 'anon';
            if (identity.source === 'farcaster') {
              userType = 'farcaster';
            } else if (/^0x[a-fA-F0-9]{40}$/i.test(identity.address)) {
              userType = 'wallet';
            } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identity.address)) {
              userType = 'privy';
            }
            user = {
              userId: identity.address,
              userType,
              displayName: identity.displayName,
              avatarUrl: identity.avatarUrl,
            };
            // Cache the resolved identity
            await client.set(KEYS.userProfile(userId), JSON.stringify(identity), { ex: 86400 * 7 });
          } catch {
            // Fallback: for FIDs, show as "FID X", for addresses, truncate
            if (isFID) {
              user = { userId, userType: 'farcaster', displayName: `FID ${userId}` };
            } else {
              user = { userId, userType: 'anon', displayName: truncateAddress(userId) };
            }
          }
        } else if (isPrivyUUID) {
          // For Privy UUIDs, we can't resolve to ENS/Farcaster, but we can show a better format
          // Note: Ideally, Privy users should use wallet addresses as userId when available
          user = {
            userId,
            userType: 'privy',
            displayName: truncateAddress(userId), // Show as "31406d56...c4aa"
          };
        } else {
          user = { userId, userType: 'anon', displayName: 'Guest' };
        }
      }
      
      // Filter out guest/anonymous users from leaderboard
      // Skip entries where userId starts with 'guest_' or userType is 'anon'
      if (userId.startsWith('guest_') || user.userType === 'anon') {
        continue; // Skip this entry
      }
      
      // Detect and fix bad truncation patterns (e.g., "3626...3626" for FIDs)
      // This happens when truncateAddress is called on short numeric strings
      // Also check for truncated wallet addresses (0x1234...5678 pattern)
      const isTruncatedAddress = /^0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}$/i.test(user.displayName || '');
      if (user.displayName && (/^(\d+\.\.\.\1)$/.test(user.displayName) || isTruncatedAddress)) {
        // Bad pattern detected - re-resolve it
        const { resolveIdentity, clearIdentityCacheFor } = await import('@/lib/auth/identity-resolver');
        try {
          // Clear cache to force fresh resolution
          clearIdentityCacheFor(user.userId);
          const identity = await resolveIdentity(user.userId);
          user.displayName = identity.displayName;
          user.avatarUrl = identity.avatarUrl;
          // Update cache with correct format
          await client.set(KEYS.userProfile(user.userId), JSON.stringify(identity), { ex: 86400 * 7 });
        } catch {
          // If re-resolution fails, show FID format
          if (/^\d+$/.test(user.userId)) {
            user.displayName = `FID ${user.userId}`;
          }
        }
      }
      
      // Ensure displayName is properly formatted (never show "Guest" or full address)
      // Also check for truncated addresses that should be re-resolved
      const isTruncatedWallet = /^0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}$/i.test(user.displayName || '');
      if (user.displayName === 'Guest' || 
          (!user.displayName.includes('.') && user.displayName.length === 42 && user.displayName.startsWith('0x')) ||
          (isTruncatedWallet && /^0x[a-fA-F0-9]{40}$/.test(user.userId))) {
        // If still showing as Guest, full address, or truncated address, try to resolve
        if (/^0x[a-fA-F0-9]{40}$/.test(user.userId)) {
          // For wallet addresses, try to resolve ENS/Farcaster one more time
          const { resolveIdentity, clearIdentityCacheFor } = await import('@/lib/auth/identity-resolver');
          try {
            clearIdentityCacheFor(user.userId);
            const identity = await resolveIdentity(user.userId);
            // Only update if we got a better resolution
            if (identity.source !== 'address') {
              user.displayName = identity.displayName;
              user.avatarUrl = identity.avatarUrl || user.avatarUrl;
              // Update cache
              await client.set(KEYS.userProfile(user.userId), JSON.stringify(identity), { ex: 86400 * 7 });
            } else {
              // Fallback to truncated if resolution still fails
              user.displayName = truncateAddress(user.userId);
            }
          } catch {
            user.displayName = truncateAddress(user.userId);
          }
        } else if (/^\d+$/.test(user.userId)) {
          // For FIDs, try to resolve username
          const { resolveIdentity, clearIdentityCacheFor } = await import('@/lib/auth/identity-resolver');
          try {
            clearIdentityCacheFor(user.userId);
            const identity = await resolveIdentity(user.userId);
            user.displayName = identity.displayName;
            user.avatarUrl = identity.avatarUrl;
          } catch {
            user.displayName = `FID ${user.userId}`;
          }
        } else {
          // Skip if we can't properly display
          continue;
        }
      }
      
      entries.push({
        rank: Math.floor(i / 2) + 1,
        user,
        bestStreak: score,
        usedReprieve: member.usedReprieve || false,
        timestamp: member.timestamp || Date.now(),
      });
      } catch {
        // Skip malformed entries
        continue;
      }
  }
  
  return entries;
}

/**
 * Cleans up old weekly leaderboards
 * Should be called periodically
 */
export async function cleanupOldLeaderboards(): Promise<void> {
  const client = getRedis();
  if (!client) return;
  
  // This would be called from a cron job
  // For now, we rely on Redis TTL
  console.log('Leaderboard cleanup would run here');
}

/**
 * Health check function - validates Redis configuration and connection
 * Call this during app startup or in a health check endpoint
 */
export async function checkRedisHealth(): Promise<{
  configured: boolean;
  connected: boolean;
  error?: string;
}> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  // Check if configured
  if (!url || !token) {
    return {
      configured: false,
      connected: false,
      error: 'Redis environment variables not set',
    };
  }
  
  // Validate format
  if (!isValidRedisUrl(url)) {
    return {
      configured: true,
      connected: false,
      error: `Invalid Redis URL format: ${url}. Expected format: https://*.upstash.io`,
    };
  }
  
  if (!isValidRedisToken(token)) {
    return {
      configured: true,
      connected: false,
      error: 'Invalid Redis token format',
    };
  }
  
  // Test connection
  const connected = await testRedisConnection();
  return {
    configured: true,
    connected,
    error: connected ? undefined : getRedisError() || 'Connection test failed',
  };
}

