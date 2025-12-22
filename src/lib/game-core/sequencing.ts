import { Token } from './types';
import { isFamousToken } from '../data/token-categories';
import { getMcapRatio } from './difficulty';

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
 * @param sponsorToken - Optional sponsor token to use as first token
 * @returns Tuple of [currentToken, nextToken]
 */
export function selectInitialPair(tokens: Token[], sponsorToken?: Token | null): [Token, Token] {
  if (tokens.length < 2) {
    throw new Error('Need at least 2 tokens to start game');
  }

  let current: Token;
  let availableTokens = [...tokens];
  
  // If sponsor token is provided and exists in token pool, use it as first token
  if (sponsorToken) {
    const sponsorInPool = tokens.find(
      t => t.address?.toLowerCase() === sponsorToken.address?.toLowerCase() ||
           t.id === sponsorToken.id ||
           t.symbol.toUpperCase() === sponsorToken.symbol.toUpperCase()
    );
    
    if (sponsorInPool) {
      current = sponsorInPool;
      // Remove sponsor token from available tokens for next token selection
      availableTokens = tokens.filter(t => !areTokensSame(t, sponsorInPool));
    } else {
      console.warn('[selectInitialPair] Sponsor token not found in pool, using normal selection');
      // Fallback to normal selection
      const shuffled = shuffleTokens([...tokens]);
      current = shuffled[0];
      availableTokens = shuffled.slice(1);
    }
  } else {
    // Normal selection - shuffle the tokens for randomness
    const shuffled = shuffleTokens([...tokens]);
    current = shuffled[0];
    availableTokens = shuffled.slice(1);
  }
  
  // Find a different token for next
  let next: Token | null = null;
  for (const token of availableTokens) {
    if (areTokensDifferent(current, token)) {
      next = token;
      break;
    }
  }
  
  // If somehow we couldn't find a different token, use any available token
  if (!next) {
    next = availableTokens[0] || tokens.find(t => !areTokensSame(t, current)) || tokens[0];
    console.warn('[selectInitialPair] Could not find truly different token, using fallback');
  }

  return [current, next];
}

/**
 * Selects initial pair with sponsor token support (alias for selectInitialPair with sponsor)
 */
export function selectInitialPairWithSponsor(
  tokens: Token[],
  sponsorToken?: Token | null
): [Token, Token] {
  return selectInitialPair(tokens, sponsorToken);
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

/**
 * Selects a pair of famous tokens for easy initial gameplay
 * Ensures tokens are famous and have meaningful market cap difference (3x-100x ratio)
 * @param tokens - Pool of available tokens
 * @param sponsorToken - Optional sponsor token to use as first token
 * @returns Tuple of [currentToken, nextToken] or null if no valid pair found
 */
export function selectFamousTokenPair(
  tokens: Token[],
  sponsorToken?: Token | null
): [Token, Token] | null {
  if (tokens.length < 2) {
    return null;
  }

  // Filter to only famous tokens
  const famousTokens = tokens.filter(token => isFamousToken(token, tokens));
  
  if (famousTokens.length < 2) {
    // Fallback: if we don't have enough famous tokens, use top tokens by market cap
    const sortedByMcap = [...tokens].sort((a, b) => b.marketCap - a.marketCap);
    const topTokens = sortedByMcap.slice(0, Math.max(20, famousTokens.length + 10));
    
    if (topTokens.length < 2) {
      return null;
    }
    
    // Use top tokens as fallback
    const shuffled = shuffleTokens([...topTokens]);
    const current = shuffled[0];
    const next = shuffled.find(t => areTokensDifferent(t, current) && getMcapRatio(current, t) >= 3 && getMcapRatio(current, t) <= 100);
    
    if (!next) {
      // Final fallback: any different token
      const fallback = topTokens.find(t => areTokensDifferent(t, current));
      if (!fallback) return null;
      return [current, fallback];
    }
    
    return [current, next];
  }

  let current: Token;
  let availableTokens = [...famousTokens];
  
  // If sponsor token is provided and is famous, use it as first token
  if (sponsorToken && isFamousToken(sponsorToken, tokens)) {
    const sponsorInPool = famousTokens.find(
      t => t.address?.toLowerCase() === sponsorToken.address?.toLowerCase() ||
           t.id === sponsorToken.id ||
           t.symbol.toUpperCase() === sponsorToken.symbol.toUpperCase()
    );
    
    if (sponsorInPool) {
      current = sponsorInPool;
      availableTokens = famousTokens.filter(t => !areTokensSame(t, sponsorInPool));
    } else {
      // Sponsor not in famous list, use random famous token
      const shuffled = shuffleTokens([...famousTokens]);
      current = shuffled[0];
      availableTokens = shuffled.slice(1);
    }
  } else {
    // Random selection from famous tokens
    const shuffled = shuffleTokens([...famousTokens]);
    current = shuffled[0];
    availableTokens = shuffled.slice(1);
  }
  
  // Find a different token with meaningful market cap difference (3x-100x ratio)
  let next: Token | null = null;
  for (const token of availableTokens) {
    if (areTokensDifferent(current, token)) {
      const ratio = getMcapRatio(current, token);
      if (ratio >= 3 && ratio <= 100) {
        next = token;
        break;
      }
    }
  }
  
  // If no token with ideal ratio, find any different token
  if (!next) {
    for (const token of availableTokens) {
      if (areTokensDifferent(current, token)) {
        next = token;
        break;
      }
    }
  }
  
  // Final fallback
  if (!next) {
    next = availableTokens[0] || famousTokens.find(t => !areTokensSame(t, current)) || null;
    if (!next) return null;
  }

  return [current, next];
}

