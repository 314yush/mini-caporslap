/**
 * Position Tracker
 * Tracks user's previous rank for comparison and position change detection
 */

import { getRedis } from '../redis';

// Redis key patterns
const KEYS = {
  userPreviousRankWeekly: (userId: string) => `user:${userId}:rank:weekly:previous`,
  userPreviousRankGlobal: (userId: string) => `user:${userId}:rank:global:previous`,
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
 * Gets user's current rank in weekly leaderboard
 */
async function getUserWeeklyRank(userId: string): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;
  
  try {
    const weekKey = getWeekKey();
    const weeklyKey = `leaderboard:weekly:${weekKey}`;
    const rank = await redis.zrevrank(weeklyKey, userId);
    return rank !== null ? rank + 1 : null; // Convert 0-indexed to 1-indexed
  } catch (error) {
    console.error('Error fetching user weekly rank:', error);
    return null;
  }
}

/**
 * Gets user's current rank in global leaderboard
 */
async function getUserGlobalRank(userId: string): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;
  
  try {
    const globalKey = 'leaderboard:global';
    const rank = await redis.zrevrank(globalKey, userId);
    return rank !== null ? rank + 1 : null; // Convert 0-indexed to 1-indexed
  } catch (error) {
    console.error('Error fetching user global rank:', error);
    return null;
  }
}

/**
 * Updates user's previous rank (called after rank changes)
 */
export async function updatePreviousRank(
  userId: string,
  board: 'weekly' | 'global',
  currentRank: number | null
): Promise<void> {
  const redis = getRedis();
  if (!redis || currentRank === null) return;
  
  try {
    const key = board === 'weekly' 
      ? KEYS.userPreviousRankWeekly(userId)
      : KEYS.userPreviousRankGlobal(userId);
    
    await redis.set(key, currentRank.toString(), { ex: 60 * 60 * 24 * 8 }); // 8 days TTL
  } catch (error) {
    console.error('Error updating previous rank:', error);
  }
}

/**
 * Gets user's previous rank
 */
export async function getPreviousRank(
  userId: string,
  board: 'weekly' | 'global'
): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;
  
  try {
    const key = board === 'weekly' 
      ? KEYS.userPreviousRankWeekly(userId)
      : KEYS.userPreviousRankGlobal(userId);
    
    const rankStr = await redis.get<string>(key);
    return rankStr ? parseInt(rankStr, 10) : null;
  } catch (error) {
    console.error('Error fetching previous rank:', error);
    return null;
  }
}

/**
 * Checks if user's rank changed and returns the change info
 */
export async function checkPositionChange(
  userId: string,
  board: 'weekly' | 'global' = 'weekly'
): Promise<{
  changed: boolean;
  previousRank: number | null;
  currentRank: number | null;
  direction: 'up' | 'down' | null;
  rankChange: number;
}> {
  const previousRank = await getPreviousRank(userId, board);
  const currentRank = board === 'weekly' 
    ? await getUserWeeklyRank(userId)
    : await getUserGlobalRank(userId);
  
  if (currentRank === null) {
    return {
      changed: false,
      previousRank,
      currentRank: null,
      direction: null,
      rankChange: 0,
    };
  }
  
  // If no previous rank, this is first time tracking
  if (previousRank === null) {
    // Update to current rank for next check
    await updatePreviousRank(userId, board, currentRank);
    return {
      changed: false,
      previousRank: null,
      currentRank,
      direction: null,
      rankChange: 0,
    };
  }
  
  // Check if rank changed
  const changed = previousRank !== currentRank;
  const direction = changed 
    ? (currentRank < previousRank ? 'up' : 'down')
    : null;
  const rankChange = changed 
    ? Math.abs(currentRank - previousRank)
    : 0;
  
  // Update previous rank if changed
  if (changed) {
    await updatePreviousRank(userId, board, currentRank);
  }
  
  return {
    changed,
    previousRank,
    currentRank,
    direction,
    rankChange,
  };
}




