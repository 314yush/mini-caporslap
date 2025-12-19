/**
 * Seeded Token Selection
 * Deterministic token selection based on seed for replay verification
 */

import { Token } from './types';

/**
 * Generate a game seed
 */
export function generateGameSeed(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Simple seeded random number generator (Mulberry32)
 * Deterministic - same seed always produces same sequence
 */
function seededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Convert string seed to numeric seed
 */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Select tokens deterministically based on seed
 * Same seed + same token pool = same sequence
 */
export function selectTokensWithSeed(
  pool: Token[],
  seed: string,
  count: number,
  excludeIds: string[] = []
): Token[] {
  if (pool.length === 0) return [];
  
  // Filter out excluded tokens
  const available = pool.filter(t => !excludeIds.includes(t.id));
  if (available.length === 0) return [];
  
  const numericSeed = hashSeed(seed);
  const random = seededRandom(numericSeed);
  
  const selected: Token[] = [];
  const usedIndices = new Set<number>();
  
  while (selected.length < count && usedIndices.size < available.length) {
    const index = Math.floor(random() * available.length);
    if (!usedIndices.has(index)) {
      usedIndices.add(index);
      selected.push(available[index]);
    }
  }
  
  return selected;
}

/**
 * Select a single next token based on seed and round number
 * Deterministic per round
 */
export function selectNextTokenSeeded(
  pool: Token[],
  gameSeed: string,
  roundNumber: number,
  excludeIds: string[] = []
): Token | null {
  // Combine seed with round number for unique per-round selection
  const roundSeed = `${gameSeed}_round_${roundNumber}`;
  const tokens = selectTokensWithSeed(pool, roundSeed, 1, excludeIds);
  return tokens[0] || null;
}

/**
 * Select initial token pair for a game
 */
export function selectInitialPairSeeded(
  pool: Token[],
  gameSeed: string
): { currentToken: Token; nextToken: Token } | null {
  const initialSeed = `${gameSeed}_initial`;
  const tokens = selectTokensWithSeed(pool, initialSeed, 2);
  
  if (tokens.length < 2) {
    return null;
  }
  
  return {
    currentToken: tokens[0],
    nextToken: tokens[1],
  };
}

/**
 * Replay and verify a game sequence
 * Returns true if the recorded guesses match expected outcomes
 */
export function verifyGameSequence(
  pool: Token[],
  gameSeed: string,
  guesses: Array<{
    currentTokenId: string;
    nextTokenId: string;
    guess: 'cap' | 'slap';
    timestamp: number;
  }>
): {
  valid: boolean;
  failedAtRound?: number;
  reason?: string;
} {
  // Get the expected initial pair
  const initialPair = selectInitialPairSeeded(pool, gameSeed);
  if (!initialPair) {
    return { valid: false, reason: 'Could not generate initial pair' };
  }
  
  let currentToken = initialPair.currentToken;
  let nextToken = initialPair.nextToken;
  const usedTokenIds: string[] = [currentToken.id, nextToken.id];
  
  for (let i = 0; i < guesses.length; i++) {
    const guess = guesses[i];
    
    // Verify token IDs match expected
    if (guess.currentTokenId !== currentToken.id) {
      return { 
        valid: false, 
        failedAtRound: i,
        reason: `Round ${i}: Expected current token ${currentToken.id}, got ${guess.currentTokenId}`,
      };
    }
    
    if (guess.nextTokenId !== nextToken.id) {
      return { 
        valid: false, 
        failedAtRound: i,
        reason: `Round ${i}: Expected next token ${nextToken.id}, got ${guess.nextTokenId}`,
      };
    }
    
    // Verify the guess was correct (they continued playing)
    const isCorrect = guess.guess === 'cap' 
      ? nextToken.marketCap >= currentToken.marketCap
      : nextToken.marketCap < currentToken.marketCap;
    
    // If this is not the last guess, it must have been correct
    if (i < guesses.length - 1 && !isCorrect) {
      return {
        valid: false,
        failedAtRound: i,
        reason: `Round ${i}: Guess was incorrect but game continued`,
      };
    }
    
    // Move to next round
    currentToken = nextToken;
    usedTokenIds.push(currentToken.id);
    
    // Select next token for next round
    const next = selectNextTokenSeeded(pool, gameSeed, i + 1, usedTokenIds);
    if (next) {
      nextToken = next;
      usedTokenIds.push(nextToken.id);
    }
  }
  
  return { valid: true };
}

