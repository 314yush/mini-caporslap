/**
 * Prize Pool System
 * Manages weekly prize pools, scoring, and distribution
 */

import { getRedis } from '../redis';

// Redis key patterns
const KEYS = {
  prizePoolConfig: (weekKey: string) => `prizepool:weekly:${weekKey}`,
  prizePoolScores: (weekKey: string) => `prizepool:weekly:${weekKey}:scores`,
  prizePoolSponsor: (weekKey: string) => `prizepool:weekly:${weekKey}:sponsor`,
  prizePoolHistory: (weekKey: string) => `prizepool:history:${weekKey}`,
};

/**
 * Gets the current week key (YYYY-WW format)
 */
export function getCurrentWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-${week.toString().padStart(2, '0')}`;
}

/**
 * Gets week bounds (start and end timestamps)
 */
export function getWeekBounds(weekKey: string): { startDate: number; endDate: number } {
  const [year, week] = weekKey.split('-').map(Number);
  const startOfYear = new Date(year, 0, 1);
  const daysToAdd = (week - 1) * 7 - startOfYear.getDay();
  const weekStart = new Date(startOfYear);
  weekStart.setDate(startOfYear.getDate() + daysToAdd);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  weekEnd.setMilliseconds(weekEnd.getMilliseconds() - 1);
  
  return {
    startDate: weekStart.getTime(),
    endDate: weekEnd.getTime(),
  };
}

// Types
export interface PrizePoolConfig {
  weekKey: string;
  prizeAmount: number;
  startDate: number;
  endDate: number;
  sponsor?: SponsorInfo;
  status: 'active' | 'completed' | 'pending';
}

export interface SponsorInfo {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  logoUrl?: string;
  companyName: string;
  reprievePrice: number;
}

export interface WeeklyScore {
  userId: string;
  cumulativeScore: number;
  bestStreak: number;
  runCount: number;
  lastUpdated: number;
}

/**
 * Gets current prize pool config
 */
export async function getCurrentPrizePool(): Promise<PrizePoolConfig | null> {
  const redis = getRedis();
  if (!redis) return null;
  
  try {
    const weekKey = getCurrentWeekKey();
    const configJson = await redis.get(KEYS.prizePoolConfig(weekKey));
    
    if (!configJson) {
      // Return default config if none exists
      const bounds = getWeekBounds(weekKey);
      return {
        weekKey,
        prizeAmount: parseFloat(process.env.PRIZE_POOL_DEFAULT_AMOUNT || '1000'),
        startDate: bounds.startDate,
        endDate: bounds.endDate,
        status: 'active',
      };
    }
    
    return typeof configJson === 'string' ? JSON.parse(configJson) as PrizePoolConfig : configJson as PrizePoolConfig;
  } catch (error) {
    console.error('Error fetching prize pool config:', error);
    return null;
  }
}

/**
 * Initializes weekly prize pool
 */
export async function initializeWeeklyPrizePool(
  prizeAmount: number = 1000,
  sponsor?: SponsorInfo
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  
  try {
    const weekKey = getCurrentWeekKey();
    const bounds = getWeekBounds(weekKey);
    
    const config: PrizePoolConfig = {
      weekKey,
      prizeAmount,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      sponsor,
      status: 'active',
    };
    
    await redis.set(KEYS.prizePoolConfig(weekKey), JSON.stringify(config), { ex: 60 * 60 * 24 * 8 });
    
    if (sponsor) {
      await redis.set(KEYS.prizePoolSponsor(weekKey), JSON.stringify(sponsor), { ex: 60 * 60 * 24 * 8 });
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing prize pool:', error);
    return false;
  }
}

/**
 * Gets sponsor for current week
 */
export async function getSponsor(): Promise<SponsorInfo | null> {
  const redis = getRedis();
  if (!redis) return null;
  
  try {
    const weekKey = getCurrentWeekKey();
    const sponsorJson = await redis.get(KEYS.prizePoolSponsor(weekKey));
    
    if (!sponsorJson) return null;
    
    return typeof sponsorJson === 'string' ? JSON.parse(sponsorJson) as SponsorInfo : sponsorJson as SponsorInfo;
  } catch (error) {
    console.error('Error fetching sponsor:', error);
    return null;
  }
}

/**
 * Gets sponsor token info (for first token feature)
 */
export async function getSponsorToken(): Promise<{
  address: string;
  symbol: string;
  name: string;
  logoUrl?: string;
} | null> {
  const sponsor = await getSponsor();
  if (!sponsor) return null;
  
  return {
    address: sponsor.tokenAddress,
    symbol: sponsor.tokenSymbol,
    name: sponsor.tokenName,
    logoUrl: sponsor.logoUrl,
  };
}

/**
 * Sets sponsor for current week
 */
export async function setSponsor(sponsor: SponsorInfo): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  
  try {
    const weekKey = getCurrentWeekKey();
    await redis.set(KEYS.prizePoolSponsor(weekKey), JSON.stringify(sponsor), { ex: 60 * 60 * 24 * 8 });
    
    // Update prize pool config to include sponsor
    const config = await getCurrentPrizePool();
    if (config) {
      config.sponsor = sponsor;
      await redis.set(KEYS.prizePoolConfig(weekKey), JSON.stringify(config), { ex: 60 * 60 * 24 * 8 });
    }
    
    return true;
  } catch (error) {
    console.error('Error setting sponsor:', error);
    return false;
  }
}

/**
 * Gets weekly scores (top N)
 */
export async function getWeeklyScores(limit: number = 50): Promise<WeeklyScore[]> {
  const redis = getRedis();
  if (!redis) return [];
  
  try {
    const { getWeeklyCumulativeScores } = await import('../redis');
    const scores = await getWeeklyCumulativeScores(limit);
    
    return scores.map(score => ({
      userId: score.userId,
      cumulativeScore: score.cumulativeScore,
      bestStreak: score.bestStreak,
      runCount: score.runCount,
      lastUpdated: Date.now(), // Could be improved to track actual last updated
    }));
  } catch (error) {
    console.error('Error fetching weekly scores:', error);
    return [];
  }
}

/**
 * Gets user's weekly score
 */
export async function getUserWeeklyScore(userId: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  
  try {
    const { getUserWeeklyScore: getScore } = await import('../redis');
    return await getScore(userId);
  } catch (error) {
    console.error('Error fetching user weekly score:', error);
    return 0;
  }
}

/**
 * Calculates prize distribution for top N users
 */
export function calculatePrizeDistribution(
  scores: WeeklyScore[],
  prizeAmount: number
): Array<{ userId: string; prize: number; rank: number }> {
  if (scores.length === 0 || prizeAmount <= 0) {
    return [];
  }
  
  // Filter to top 50 only
  const top50 = scores.slice(0, 50);
  
  // Calculate total score of top 50
  const totalScore = top50.reduce((sum, score) => sum + score.cumulativeScore, 0);
  
  if (totalScore === 0) {
    return [];
  }
  
  // Calculate proportional distribution
  const distribution = top50.map((score, index) => {
    const prize = (score.cumulativeScore / totalScore) * prizeAmount;
    return {
      userId: score.userId,
      prize: Math.round(prize * 100) / 100, // Round to 2 decimal places
      rank: index + 1,
    };
  });
  
  return distribution;
}

/**
 * Tracks weekly score (wrapper around redis function)
 */
export async function trackWeeklyScore(userId: string, streak: number): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  
  try {
    const { trackWeeklyScore: trackScore } = await import('../redis');
    return await trackScore(userId, streak);
  } catch (error) {
    console.error('Error tracking weekly score:', error);
    return 0;
  }
}


