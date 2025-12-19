/**
 * Difficulty System for CapOrSlap
 * Progressive difficulty that adjusts token selection based on streak
 */

import { Token } from './types';

/**
 * Difficulty tier configuration
 */
export interface DifficultyTier {
  name: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Insane';
  minStreak: number;
  maxStreak: number;
  minMcapRatio: number;  // Minimum ratio between tokens (e.g., 1.5 = 50% difference)
  maxMcapRatio: number;  // Maximum ratio between tokens
  tokenPoolSize: number; // How many top tokens to include in pool
}

/**
 * Difficulty tiers - progressively harder as streak increases
 */
export const DIFFICULTY_TIERS: DifficultyTier[] = [
  { 
    name: 'Easy',    
    minStreak: 0,  
    maxStreak: 4,  
    minMcapRatio: 3,    // At least 3x difference
    maxMcapRatio: 100,  // Up to 100x difference
    tokenPoolSize: 40   // Top 40 tokens only
  },
  { 
    name: 'Medium',  
    minStreak: 5,  
    maxStreak: 9,  
    minMcapRatio: 2,    // At least 2x difference
    maxMcapRatio: 10,   // Up to 10x difference
    tokenPoolSize: 60   // Top 60 tokens
  },
  { 
    name: 'Hard',    
    minStreak: 10, 
    maxStreak: 14, 
    minMcapRatio: 1.5,  // At least 1.5x difference
    maxMcapRatio: 4,    // Up to 4x difference
    tokenPoolSize: 200   // Top 200 tokens
  },
  { 
    name: 'Expert',  
    minStreak: 15, 
    maxStreak: 19, 
    minMcapRatio: 1.2,  // At least 1.2x difference
    maxMcapRatio: 2.5,  // Up to 2.5x difference
    tokenPoolSize: 350  // Top 350 tokens
  },
  { 
    name: 'Insane',  
    minStreak: 20, 
    maxStreak: 999, 
    minMcapRatio: 1.1,  // Very close - at least 1.1x difference
    maxMcapRatio: 1.8,  // Up to 1.8x difference
    tokenPoolSize: 500  // All tokens
  },
];

/**
 * Get the difficulty tier for a given streak
 */
export function getTierForStreak(streak: number): DifficultyTier {
  for (const tier of DIFFICULTY_TIERS) {
    if (streak >= tier.minStreak && streak <= tier.maxStreak) {
      return tier;
    }
  }
  // Fallback to Insane for any streak beyond defined tiers
  return DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1];
}

/**
 * Get tier name for display
 */
export function getTierName(streak: number): string {
  return getTierForStreak(streak).name;
}

/**
 * Filter token pool by tier (returns top N tokens by market cap)
 */
export function filterTokenPoolByTier(tokens: Token[], tier: DifficultyTier): Token[] {
  // Sort by market cap (descending)
  const sorted = [...tokens].sort((a, b) => b.marketCap - a.marketCap);
  // Take top N tokens based on tier
  return sorted.slice(0, tier.tokenPoolSize);
}

/**
 * Calculate market cap ratio between two tokens
 * Always returns ratio >= 1 (larger / smaller)
 */
export function getMcapRatio(tokenA: Token, tokenB: Token): number {
  const larger = Math.max(tokenA.marketCap, tokenB.marketCap);
  const smaller = Math.min(tokenA.marketCap, tokenB.marketCap);
  if (smaller === 0) return Infinity;
  return larger / smaller;
}

/**
 * Check if a token pair is valid for a given difficulty tier
 */
export function isValidPairForTier(
  currentToken: Token, 
  candidateToken: Token, 
  tier: DifficultyTier
): boolean {
  const ratio = getMcapRatio(currentToken, candidateToken);
  return ratio >= tier.minMcapRatio && ratio <= tier.maxMcapRatio;
}

/**
 * Find valid candidate tokens for the current difficulty
 */
export function findValidCandidates(
  tokens: Token[],
  currentToken: Token,
  tier: DifficultyTier,
  excludeIds: string[] = []
): Token[] {
  return tokens.filter(token => {
    // Exclude current token and recently used tokens
    if (token.id === currentToken.id || excludeIds.includes(token.id)) {
      return false;
    }
    // Check if within mcap ratio constraints
    return isValidPairForTier(currentToken, token, tier);
  });
}

/**
 * Select a token pair based on difficulty
 * Returns a valid next token given the current token and streak
 */
export function selectNextTokenByDifficulty(
  allTokens: Token[],
  currentToken: Token,
  streak: number,
  recentTokenIds: string[] = []
): Token | null {
  const tier = getTierForStreak(streak);
  
  // First, filter pool by tier size
  const tierPool = filterTokenPoolByTier(allTokens, tier);
  
  // Find candidates within mcap ratio constraints
  let candidates = findValidCandidates(tierPool, currentToken, tier, recentTokenIds);
  
  // If no valid candidates found, gradually relax constraints
  if (candidates.length === 0) {
    // Try with full pool but keep ratio constraints
    candidates = findValidCandidates(allTokens, currentToken, tier, recentTokenIds);
  }
  
  // If still no candidates, relax ratio constraints
  if (candidates.length === 0) {
    // Use Easy tier constraints as fallback
    const easyTier = DIFFICULTY_TIERS[0];
    candidates = findValidCandidates(allTokens, currentToken, easyTier, recentTokenIds);
  }
  
  // Final fallback: any token except current and recent
  if (candidates.length === 0) {
    candidates = allTokens.filter(t => 
      t.id !== currentToken.id && !recentTokenIds.includes(t.id)
    );
  }
  
  // Absolute fallback: any token except current
  if (candidates.length === 0) {
    candidates = allTokens.filter(t => t.id !== currentToken.id);
  }
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Weight selection to prefer tokens closer to middle of ratio range
  // This creates more interesting guesses
  const weightedCandidates = candidates.map(candidate => {
    const ratio = getMcapRatio(currentToken, candidate);
    const midRatio = (tier.minMcapRatio + tier.maxMcapRatio) / 2;
    // Higher weight for ratios closer to middle
    const distance = Math.abs(ratio - midRatio);
    const weight = 1 / (1 + distance * 0.5);
    return { token: candidate, weight };
  });
  
  // Weighted random selection
  const totalWeight = weightedCandidates.reduce((sum, c) => sum + c.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const { token, weight } of weightedCandidates) {
    random -= weight;
    if (random <= 0) {
      return token;
    }
  }
  
  // Fallback to first candidate
  return candidates[0];
}

/**
 * Select initial pair with appropriate difficulty for streak 0
 */
export function selectInitialPairByDifficulty(
  allTokens: Token[]
): { currentToken: Token; nextToken: Token } | null {
  if (allTokens.length < 2) {
    return null;
  }
  
  const tier = getTierForStreak(0); // Easy tier for initial
  const tierPool = filterTokenPoolByTier(allTokens, tier);
  
  if (tierPool.length < 2) {
    return null;
  }
  
  // Pick a random token from the pool as current
  const currentIndex = Math.floor(Math.random() * tierPool.length);
  const currentToken = tierPool[currentIndex];
  
  // Find a valid next token
  const nextToken = selectNextTokenByDifficulty(tierPool, currentToken, 0, []);
  
  if (!nextToken) {
    return null;
  }
  
  return { currentToken, nextToken };
}

/**
 * Get difficulty info for display
 */
export function getDifficultyInfo(streak: number): {
  tier: DifficultyTier;
  name: string;
  color: string;
  nextTierAt: number | null;
} {
  const tier = getTierForStreak(streak);
  
  // Find next tier
  const currentIndex = DIFFICULTY_TIERS.findIndex(t => t.name === tier.name);
  const nextTier = currentIndex < DIFFICULTY_TIERS.length - 1 
    ? DIFFICULTY_TIERS[currentIndex + 1] 
    : null;
  
  // Color coding for tiers
  const colors: Record<string, string> = {
    'Easy': 'text-emerald-400',
    'Medium': 'text-blue-400',
    'Hard': 'text-amber-400',
    'Expert': 'text-orange-400',
    'Insane': 'text-rose-400',
  };
  
  return {
    tier,
    name: tier.name,
    color: colors[tier.name] || 'text-white',
    nextTierAt: nextTier ? nextTier.minStreak : null,
  };
}


