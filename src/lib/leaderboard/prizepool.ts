/**
 * Weekly Prizepool System
 * Manages prize pool distribution for weekly leaderboard (currently disabled)
 */

import { getFeatureFlags } from '@/lib/feature-flags';
import { getCurrentWeekStart, getNextSundayMidnightUTC } from './week-timer';

export interface PrizepoolConfig {
  enabled: boolean;
  totalAmount: number; // USDC amount
  distribution: Array<{ rank: number; percentage: number }>; // Top 25 distribution
}

// Prize pool config for weekly cycles (different from PrizepoolConfig above)
export interface PrizePoolConfig {
  weekKey: string;
  prizeAmount: number;
  sponsor?: SponsorInfo;
  status: 'active' | 'completed';
  startDate: number;
  endDate: number;
}

export interface SponsorInfo {
  address: string;
  symbol: string;
  name: string;
}

export interface PrizeAmount {
  rank: number;
  amount: number; // USDC amount
  percentage: number;
}

/**
 * Default prizepool configuration (disabled)
 * Top 25 players eligible for prizes
 * Percentage-based distribution
 */
const DEFAULT_PRIZEPOOL: PrizepoolConfig = {
  enabled: false, // Disabled for now
  totalAmount: 0,
  distribution: [
    { rank: 1, percentage: 0.30 },   // 30%
    { rank: 2, percentage: 0.20 },   // 20%
    { rank: 3, percentage: 0.15 },    // 15%
    { rank: 4, percentage: 0.08 },   // 8%
    { rank: 5, percentage: 0.05 },   // 5%
    { rank: 6, percentage: 0.04 },   // 4%
    { rank: 7, percentage: 0.03 },    // 3%
    { rank: 8, percentage: 0.03 },    // 3%
    { rank: 9, percentage: 0.02 },   // 2%
    { rank: 10, percentage: 0.02 },   // 2%
    { rank: 11, percentage: 0.015 }, // 1.5%
    { rank: 12, percentage: 0.015 }, // 1.5%
    { rank: 13, percentage: 0.015 }, // 1.5%
    { rank: 14, percentage: 0.015 }, // 1.5%
    { rank: 15, percentage: 0.01 },  // 1%
    { rank: 16, percentage: 0.01 },  // 1%
    { rank: 17, percentage: 0.01 },   // 1%
    { rank: 18, percentage: 0.01 },   // 1%
    { rank: 19, percentage: 0.01 },   // 1%
    { rank: 20, percentage: 0.01 },   // 1%
    { rank: 21, percentage: 0.005 },  // 0.5%
    { rank: 22, percentage: 0.005 },  // 0.5%
    { rank: 23, percentage: 0.005 },  // 0.5%
    { rank: 24, percentage: 0.005 },  // 0.5%
    { rank: 25, percentage: 0.005 },  // 0.5%
  ],
};

/**
 * Gets the current prizepool configuration
 * Checks feature flag to determine if enabled
 * @returns Prizepool configuration
 */
export function getPrizepoolConfig(): PrizepoolConfig {
  // Check feature flag (to be added to feature flags)
  // For now, always return disabled config
  const flags = getFeatureFlags();
  // Future: check flags.prizepool or similar
  
  return {
    ...DEFAULT_PRIZEPOOL,
    enabled: false, // Hardcoded to false for now
  };
}

/**
 * Calculates prize amount for a specific rank
 * @param rank - Player rank (1-25)
 * @param totalAmount - Total prizepool amount in USDC
 * @returns Prize amount in USDC, or null if rank not eligible
 */
export function calculatePrizeAmount(rank: number, totalAmount: number): number | null {
  const config = getPrizepoolConfig();
  
  if (!config.enabled || totalAmount <= 0) {
    return null;
  }
  
  if (rank < 1 || rank > 25) {
    return null;
  }
  
  const distribution = config.distribution.find(d => d.rank === rank);
  if (!distribution) {
    return null;
  }
  
  return totalAmount * distribution.percentage;
}

/**
 * Calculates all prize amounts for top 25
 * @param totalAmount - Total prizepool amount in USDC
 * @returns Array of prize amounts for ranks 1-25
 */
export function calculateAllPrizeAmounts(totalAmount: number): PrizeAmount[] {
  const config = getPrizepoolConfig();
  
  if (!config.enabled || totalAmount <= 0) {
    return [];
  }
  
  return config.distribution.map(({ rank, percentage }) => ({
    rank,
    amount: totalAmount * percentage,
    percentage,
  }));
}

/**
 * Checks if a rank is eligible for prizepool
 * @param rank - Player rank
 * @returns True if rank is in top 25
 */
export function isEligibleForPrizepool(rank: number): boolean {
  return rank >= 1 && rank <= 25;
}

/**
 * Gets prizepool summary for display
 * @param totalAmount - Total prizepool amount in USDC
 * @returns Summary object with total amount and eligible count
 */
export function getPrizepoolSummary(totalAmount: number): {
  enabled: boolean;
  totalAmount: number;
  eligibleRanks: number;
  topPrize: number | null;
} {
  const config = getPrizepoolConfig();
  
  return {
    enabled: config.enabled && totalAmount > 0,
    totalAmount,
    eligibleRanks: 25,
    topPrize: config.enabled && totalAmount > 0 
      ? calculatePrizeAmount(1, totalAmount) 
      : null,
  };
}

/**
 * Gets the current week key (YYYY-WW format)
 * Weeks start on Sunday at midnight UTC
 */
export function getCurrentWeekKey(): string {
  const now = new Date();
  const utcDate = new Date(now.toISOString());
  
  // Get the current day of week (0 = Sunday, 6 = Saturday)
  const day = utcDate.getUTCDay();
  
  // Calculate days to subtract to get to the most recent Sunday
  const daysToSunday = day === 0 ? 0 : day;
  const sunday = new Date(utcDate);
  sunday.setUTCDate(utcDate.getUTCDate() - daysToSunday);
  sunday.setUTCHours(0, 0, 0, 0);
  
  // Calculate week number from start of year
  const year = sunday.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  
  // Find the first Sunday of the year
  const firstSundayDay = startOfYear.getUTCDay();
  const daysToFirstSunday = firstSundayDay === 0 ? 0 : 7 - firstSundayDay;
  const firstSunday = new Date(startOfYear);
  firstSunday.setUTCDate(1 + daysToFirstSunday);
  firstSunday.setUTCHours(0, 0, 0, 0);
  
  // Calculate weeks since first Sunday
  const daysSinceFirstSunday = Math.floor((sunday.getTime() - firstSunday.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.floor(daysSinceFirstSunday / 7) + 1;
  
  return `${year}-${week.toString().padStart(2, '0')}`;
}

/**
 * Gets week bounds (start and end dates)
 */
export function getWeekBounds(weekKey?: string): { start: Date; end: Date } {
  const weekStart = getCurrentWeekStart();
  const weekEnd = getNextSundayMidnightUTC();
  
  return {
    start: weekStart,
    end: weekEnd,
  };
}

// Stub functions for incomplete features

// Stub functions - these need to be implemented properly
export async function getCurrentPrizePool(): Promise<PrizePoolConfig | null> {
  return null; // Feature not implemented
}

export async function getWeeklyScores(limit: number = 50): Promise<Array<{ userId: string; score: number }>> {
  return []; // Feature not implemented
}

export async function getUserWeeklyScore(userId: string): Promise<number> {
  return 0; // Feature not implemented
}

export function calculatePrizeDistribution(
  scores: Array<{ userId: string; score?: number; cumulativeScore?: number; bestStreak?: number; runCount?: number; lastUpdated?: number }>,
  prizeAmount: number
): Array<{ userId: string; prize: number; rank: number }> {
  if (!scores || scores.length === 0 || prizeAmount <= 0) {
    return [];
  }
  
  // Sort by cumulativeScore (descending) or score (descending)
  const sorted = [...scores].sort((a, b) => {
    const scoreA = a.cumulativeScore ?? a.score ?? 0;
    const scoreB = b.cumulativeScore ?? b.score ?? 0;
    return scoreB - scoreA;
  });
  
  // Calculate distribution using the default prizepool config
  const config = getPrizepoolConfig();
  if (!config.enabled) {
    return [];
  }
  
  const distribution: Array<{ userId: string; prize: number; rank: number }> = [];
  
  for (let i = 0; i < Math.min(sorted.length, 25); i++) {
    const rank = i + 1;
    const prize = calculatePrizeAmount(rank, prizeAmount);
    if (prize !== null) {
      distribution.push({
        userId: sorted[i].userId,
        prize,
        rank,
      });
    }
  }
  
  return distribution;
}

export async function getSponsor(): Promise<SponsorInfo | null> {
  return null; // Feature not implemented
}

export async function setSponsor(sponsor: SponsorInfo): Promise<boolean> {
  return false; // Feature not implemented
}

export async function initializeWeeklyPrizePool(
  prizeAmount: number,
  sponsor?: SponsorInfo
): Promise<boolean> {
  return false; // Feature not implemented
}

