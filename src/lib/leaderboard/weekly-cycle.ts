/**
 * Weekly Cycle Management
 * Handles weekly prize pool cycles, initialization, and finalization
 */

import { getCurrentWeekKey, getWeekBounds, PrizePoolConfig } from './prizepool';
import { getRedis } from '../redis';

const KEYS = {
  prizePoolConfig: (weekKey: string) => `prizepool:weekly:${weekKey}`,
  prizePoolHistory: (weekKey: string) => `prizepool:history:${weekKey}`,
};

/**
 * Finalizes a weekly prize pool
 * Calculates payouts and archives results
 */
export async function finalizeWeeklyPrizePool(weekKey: string): Promise<{
  success: boolean;
  distribution?: Array<{ userId: string; prize: number; rank: number }>;
  error?: string;
}> {
  const redis = getRedis();
  if (!redis) {
    return { success: false, error: 'Redis not configured' };
  }
  
  try {
    // Get prize pool config
    const configJson = await redis.get(KEYS.prizePoolConfig(weekKey));
    if (!configJson) {
      return { success: false, error: 'Prize pool config not found' };
    }
    
    const config: PrizePoolConfig = typeof configJson === 'string' 
      ? JSON.parse(configJson) 
      : configJson;
    
    // Get weekly scores
    const { getWeeklyCumulativeScores } = await import('../redis');
    const scores = await getWeeklyCumulativeScores(50);
    
    // Calculate distribution
    const { calculatePrizeDistribution } = await import('./prizepool');
    const distribution = calculatePrizeDistribution(
      scores.map(s => ({
        userId: s.userId,
        cumulativeScore: s.cumulativeScore,
        bestStreak: s.bestStreak,
        runCount: s.runCount,
        lastUpdated: Date.now(),
      })),
      config.prizeAmount
    );
    
    // Archive results
    const history = {
      weekKey: config.weekKey,
      prizeAmount: config.prizeAmount,
      sponsor: config.sponsor,
      distribution,
      finalizedAt: Date.now(),
      startDate: config.startDate,
      endDate: config.endDate,
    };
    
    await redis.set(KEYS.prizePoolHistory(weekKey), JSON.stringify(history), { ex: 60 * 60 * 24 * 365 }); // 1 year
    
    // Mark config as completed
    config.status = 'completed';
    await redis.set(KEYS.prizePoolConfig(weekKey), JSON.stringify(config), { ex: 60 * 60 * 24 * 8 });
    
    return {
      success: true,
      distribution,
    };
  } catch (error) {
    console.error('Error finalizing prize pool:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Initializes next week's prize pool
 */
export async function initializeNextWeekPrizePool(
  prizeAmount: number = 1000,
  sponsor?: import('./prizepool').SponsorInfo
): Promise<boolean> {
  const { initializeWeeklyPrizePool } = await import('./prizepool');
  return await initializeWeeklyPrizePool(prizeAmount, sponsor);
}


