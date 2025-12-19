/**
 * Score Validation for CapOrSlap
 * Hybrid approach: client plays freely, high scores verified server-side
 */

import { Token, Guess } from './types';
import { getTimerDuration } from './timer';

// Threshold for requiring server verification
export const VERIFICATION_THRESHOLD = 10;

// Maximum time between guesses (with buffer for network latency)
export const MAX_GUESS_INTERVAL_BUFFER = 5000; // 5 seconds buffer

export interface GameGuess {
  roundNumber: number;
  currentTokenId: string;
  nextTokenId: string;
  guess: Guess;
  timestamp: number;
  clientTimerRemaining?: number;
}

export interface ServerGameState {
  runId: string;
  seed: string;
  userId: string;
  startedAt: number;
  guesses: GameGuess[];
  currentStreak: number;
  hasUsedReprieve: boolean;
  reprieveUsedAtRound?: number;
  tokenPool?: Token[]; // Snapshot of token pool at game start
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  failedAtRound?: number;
}

/**
 * Check if a score requires server verification
 */
export function requiresVerification(streak: number): boolean {
  return streak >= VERIFICATION_THRESHOLD;
}

/**
 * Validate timing between guesses
 * Ensures player couldn't have cheated by taking too long
 */
export function validateGuessTiming(
  guesses: GameGuess[],
  startedAt: number
): ValidationResult {
  if (guesses.length === 0) {
    return { valid: true };
  }
  
  let lastTimestamp = startedAt;
  
  for (let i = 0; i < guesses.length; i++) {
    const guess = guesses[i];
    const expectedMaxTime = getTimerDuration(i) * 1000 + MAX_GUESS_INTERVAL_BUFFER;
    const actualTime = guess.timestamp - lastTimestamp;
    
    if (actualTime > expectedMaxTime) {
      return {
        valid: false,
        reason: `Round ${i}: Guess took ${actualTime}ms, max allowed ${expectedMaxTime}ms`,
        failedAtRound: i,
      };
    }
    
    // Also check for impossibly fast guesses (bot detection)
    if (actualTime < 100) { // Less than 100ms is suspicious
      return {
        valid: false,
        reason: `Round ${i}: Guess was suspiciously fast (${actualTime}ms)`,
        failedAtRound: i,
      };
    }
    
    lastTimestamp = guess.timestamp;
  }
  
  return { valid: true };
}

/**
 * Validate that guesses match expected market cap comparisons
 */
export function validateGuessCorrectness(
  guesses: GameGuess[],
  tokenPool: Token[]
): ValidationResult {
  // Create a map for quick token lookup
  const tokenMap = new Map<string, Token>();
  for (const token of tokenPool) {
    tokenMap.set(token.id, token);
  }
  
  for (let i = 0; i < guesses.length - 1; i++) { // All but last guess must be correct
    const guess = guesses[i];
    const currentToken = tokenMap.get(guess.currentTokenId);
    const nextToken = tokenMap.get(guess.nextTokenId);
    
    if (!currentToken || !nextToken) {
      return {
        valid: false,
        reason: `Round ${i}: Token not found in pool`,
        failedAtRound: i,
      };
    }
    
    const isCorrect = guess.guess === 'cap'
      ? nextToken.marketCap >= currentToken.marketCap
      : nextToken.marketCap < currentToken.marketCap;
    
    if (!isCorrect) {
      return {
        valid: false,
        reason: `Round ${i}: Recorded guess was incorrect but game continued`,
        failedAtRound: i,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Full validation of a completed game
 */
export function validateGameState(state: ServerGameState): ValidationResult {
  // 1. Validate timing
  const timingResult = validateGuessTiming(state.guesses, state.startedAt);
  if (!timingResult.valid) {
    return timingResult;
  }
  
  // 2. If we have token pool, validate guess correctness
  if (state.tokenPool && state.tokenPool.length > 0) {
    const correctnessResult = validateGuessCorrectness(state.guesses, state.tokenPool);
    if (!correctnessResult.valid) {
      return correctnessResult;
    }
  }
  
  // 3. Validate streak matches guess count
  // (accounting for reprieve if used)
  const expectedStreak = state.guesses.length - 1; // Last guess is the loss
  if (state.currentStreak !== expectedStreak && state.currentStreak !== state.guesses.length) {
    return {
      valid: false,
      reason: `Streak mismatch: reported ${state.currentStreak}, expected ${expectedStreak}`,
    };
  }
  
  return { valid: true };
}

/**
 * Rate limiting check
 * Returns true if request should be allowed
 */
export function checkRateLimit(
  lastGuessTimestamp: number | undefined,
  now: number = Date.now()
): boolean {
  if (!lastGuessTimestamp) return true;
  
  // Minimum 500ms between guesses
  return now - lastGuessTimestamp >= 500;
}

/**
 * Generate anti-cheat hash for client
 * Client must include this in submissions
 */
export function generateClientHash(
  runId: string,
  roundNumber: number,
  timestamp: number
): string {
  // Simple hash - in production, use HMAC with server secret
  const data = `${runId}:${roundNumber}:${timestamp}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Verify client hash
 */
export function verifyClientHash(
  hash: string,
  runId: string,
  roundNumber: number,
  timestamp: number
): boolean {
  const expected = generateClientHash(runId, roundNumber, timestamp);
  return hash === expected;
}

