import { Token } from './types';

/**
 * Check if two tokens are truly different (by ID, symbol, and name)
 * This prevents showing the same token with different IDs or similar tokens
 */
function areTokensDifferent(a: Token, b: Token): boolean {
  if (a.id === b.id) return false;
  if (a.symbol.toUpperCase() === b.symbol.toUpperCase()) return false;
  if (a.name.toLowerCase() === b.name.toLowerCase()) return false;
  // Also check for similar logos (same URL = likely same token)
  if (a.logoUrl === b.logoUrl) return false;
  return true;
}

/**
 * Selects the next token to show
 * Simple random selection with strong uniqueness guarantees
 * @param tokens - Pool of available tokens
 * @param currentToken - Current token to avoid
 * @param recentTokenIds - IDs of recently shown tokens to deprioritize
 * @returns Selected next token
 */
export function selectNextToken(
  tokens: Token[],
  currentToken: Token | null,
  recentTokenIds: string[] = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _streak: number = 0 // Kept for API compatibility but not used
): Token {
  if (tokens.length === 0) {
    throw new Error('No tokens available');
  }

  // Filter out current token and any tokens that might be duplicates
  const availableTokens = tokens.filter((t) => {
    // Must be different from current token
    if (currentToken && !areTokensDifferent(t, currentToken)) {
      return false;
    }
    return true;
  });

  if (availableTokens.length === 0) {
    throw new Error('No available tokens to select');
  }

  // Create a list of candidates, excluding recent tokens when possible
  const recentSet = new Set(recentTokenIds);
  const freshTokens = availableTokens.filter((t) => !recentSet.has(t.id));
  
  // Prefer fresh tokens, but fall back to all available if needed
  const candidates = freshTokens.length > 0 ? freshTokens : availableTokens;

  // Simple random selection
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Selects an initial pair of tokens to start the game
 * Ensures tokens are meaningfully different
 * @param tokens - Pool of available tokens
 * @returns Tuple of [currentToken, nextToken]
 */
export function selectInitialPair(tokens: Token[]): [Token, Token] {
  if (tokens.length < 2) {
    throw new Error('Need at least 2 tokens to start game');
  }

  // Shuffle the tokens for randomness
  const shuffled = shuffleTokens([...tokens]);
  
  // Pick first token
  const current = shuffled[0];
  
  // Find a different token
  let next: Token | null = null;
  for (let i = 1; i < shuffled.length; i++) {
    if (areTokensDifferent(current, shuffled[i])) {
      next = shuffled[i];
      break;
    }
  }
  
  // If somehow we couldn't find a different token, use the second one anyway
  if (!next) {
    next = shuffled[1];
    console.warn('[selectInitialPair] Could not find truly different token, using fallback');
  }

  return [current, next];
}

/**
 * Updates the recent tokens list, keeping only last N
 * @param recentIds - Current recent IDs
 * @param newId - New ID to add
 * @param maxRecent - Maximum recent tokens to track
 * @returns Updated recent IDs array
 */
export function updateRecentTokens(
  recentIds: string[],
  newId: string,
  maxRecent: number = 10
): string[] {
  const updated = [newId, ...recentIds.filter((id) => id !== newId)];
  return updated.slice(0, maxRecent);
}

/**
 * Shuffles array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export function shuffleTokens<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Check if two tokens are the same (for external use)
 */
export function areTokensSame(a: Token, b: Token): boolean {
  return !areTokensDifferent(a, b);
}

