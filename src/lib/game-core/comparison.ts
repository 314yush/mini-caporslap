import { Token, Guess, GuessResult } from './types';

/**
 * Compares two tokens and determines if the guess was correct
 * @param currentToken - The token shown to the user
 * @param nextToken - The token being compared
 * @param guess - User's guess: 'cap' (higher) or 'slap' (lower)
 * @returns GuessResult with correctness and details
 */
export function compareMarketCaps(
  currentToken: Token,
  nextToken: Token,
  guess: Guess
): GuessResult {
  const nextIsHigher = nextToken.marketCap > currentToken.marketCap;
  const correctAnswer: Guess = nextIsHigher ? 'cap' : 'slap';
  const correct = guess === correctAnswer;

  return {
    correct,
    guess,
    currentToken,
    nextToken,
    correctAnswer,
  };
}

/**
 * Formats market cap for display
 * @param marketCap - Raw market cap number
 * @returns Formatted string like "$2.4B" or "$156M"
 */
export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1_000_000_000_000) {
    return `$${(marketCap / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (marketCap >= 1_000_000_000) {
    return `$${(marketCap / 1_000_000_000).toFixed(1)}B`;
  }
  if (marketCap >= 1_000_000) {
    return `$${(marketCap / 1_000_000).toFixed(1)}M`;
  }
  if (marketCap >= 1_000) {
    return `$${(marketCap / 1_000).toFixed(1)}K`;
  }
  return `$${marketCap.toFixed(0)}`;
}

/**
 * Generates explanation text for a loss
 * @param result - The guess result
 * @returns Human readable explanation of the mistake
 */
export function generateLossExplanation(result: GuessResult): string {
  const currentCap = formatMarketCap(result.currentToken.marketCap);
  const nextCap = formatMarketCap(result.nextToken.marketCap);
  
  const guessedDirection = result.guess === 'cap' ? 'higher' : 'lower';
  const actualDirection = result.correctAnswer === 'cap' ? 'higher' : 'lower';

  return `You guessed ${result.nextToken.symbol} was ${guessedDirection} than ${result.currentToken.symbol}, but ${result.nextToken.symbol} (${nextCap}) is actually ${actualDirection} than ${result.currentToken.symbol} (${currentCap}).`;
}






