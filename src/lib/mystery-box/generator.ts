/**
 * Mystery Box Generator
 * Creates randomized mystery boxes with token rewards
 */

import { getAvailableTokens, MysteryBoxToken } from './tokens';

export interface MysteryBoxReward {
  address: string;
  symbol: string;
  name: string;
  amount: string; // Amount in token units (as string for precision)
  usdValue: number; // USD value of this reward
  decimals: number;
  logoUrl?: string; // Token logo URL
}

export interface MysteryBox {
  boxId: string;
  rewards: MysteryBoxReward[];
  totalValue: number; // Total USD value (should be ~$5)
  createdAt: number;
}

const MYSTERY_BOX_TOTAL_VALUE = 1; // $5 total value
const MIN_TOKEN_VALUE = 0.1; // Minimum $0.50 per token
const MAX_TOKENS = 4; // Maximum 4 tokens per box
const MIN_TOKENS = 1; // Minimum 2 tokens per box (or 1 if only one token available)

/**
 * Token selection weights for randomization
 * Higher weight = more likely to appear
 * USDC should appear more often as it's stable
 */
const TOKEN_WEIGHTS: Record<string, number> = {
  USDC: 30, // Most common (stable)
  JESSE: 20,
  AERO: 20,
  AVNT: 15,
  BANKR: 10,
  ZORA: 5, // Rarest (most valuable/exciting)
};

/**
 * Generate a random mystery box with randomized token selection and amounts
 * Uses weighted randomization to ensure variety and excitement
 */
export function generateMysteryBox(): MysteryBox {
  const availableTokens = getAvailableTokens();
  
  // Allow single token if that's all that's available (for testnet testing)
  const minTokensRequired = Math.min(MIN_TOKENS, availableTokens.length);
  if (availableTokens.length < 1) {
    throw new Error('No tokens available for mystery box');
  }

  // If only one token available, use it directly
  let selectedTokens: MysteryBoxToken[];
  if (availableTokens.length === 1) {
    selectedTokens = availableTokens;
  } else {
    // Weighted random selection of tokens
    selectedTokens = selectTokensWeighted(availableTokens);
  }

  // Generate random amounts that sum to $5
  const rewards = distributeRandomAmounts(selectedTokens, MYSTERY_BOX_TOTAL_VALUE);

  const boxId = `box_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    boxId,
    rewards,
    totalValue: rewards.reduce((sum, r) => sum + r.usdValue, 0),
    createdAt: Date.now(),
  };
}

/**
 * Select tokens using weighted randomization
 * Ensures variety: USDC common, rare tokens exciting
 */
function selectTokensWeighted(availableTokens: MysteryBoxToken[]): MysteryBoxToken[] {
  // Build weighted pool
  const weightedPool: MysteryBoxToken[] = [];
  
  for (const token of availableTokens) {
    const weight = TOKEN_WEIGHTS[token.symbol.toUpperCase()] || 10; // Default weight
    // Add token to pool multiple times based on weight
    for (let i = 0; i < weight; i++) {
      weightedPool.push(token);
    }
  }

  // Randomly select number of tokens (2-4)
  const numTokens = Math.floor(Math.random() * (MAX_TOKENS - MIN_TOKENS + 1)) + MIN_TOKENS;
  
  // Select unique tokens from weighted pool
  const selected: MysteryBoxToken[] = [];
  const usedSymbols = new Set<string>();
  
  // Ensure we always include at least one token (prefer USDC for stability)
  const usdcToken = availableTokens.find(t => t.symbol.toUpperCase() === 'USDC');
  if (usdcToken && Math.random() < 0.7) { // 70% chance to include USDC
    selected.push(usdcToken);
    usedSymbols.add(usdcToken.symbol.toUpperCase());
  }

  // Fill remaining slots with weighted random selection
  while (selected.length < numTokens && selected.length < availableTokens.length) {
    const randomToken = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    if (!usedSymbols.has(randomToken.symbol.toUpperCase())) {
      selected.push(randomToken);
      usedSymbols.add(randomToken.symbol.toUpperCase());
    }
    
    // Prevent infinite loop if we run out of unique tokens
    if (selected.length === usedSymbols.size && selected.length < numTokens) {
      break;
    }
  }

  // Shuffle the selected tokens for variety
  return selected.sort(() => Math.random() - 0.5);
}

/**
 * Distribute $5 randomly across selected tokens
 * Ensures each token gets at least $0.50
 */
function distributeRandomAmounts(
  tokens: MysteryBoxToken[],
  totalValue: number
): MysteryBoxReward[] {
  const numTokens = tokens.length;
  
  // Special case: single token gets the full amount
  if (numTokens === 1) {
    const token = tokens[0];
    const usdValue = totalValue;
    const amount = (usdValue * Math.pow(10, token.decimals)).toString(); // Placeholder
    
    return [{
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      amount,
      usdValue,
      decimals: token.decimals,
      logoUrl: token.logoUrl,
    }];
  }
  
  // Multiple tokens: distribute with minimums
  const minTotal = MIN_TOKEN_VALUE * numTokens;
  
  if (minTotal > totalValue) {
    throw new Error(`Total value (${totalValue}) is too small for ${numTokens} tokens (min ${minTotal})`);
  }

  // Generate random weights for each token
  const weights: number[] = [];
  for (let i = 0; i < numTokens; i++) {
    weights.push(Math.random());
  }
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Calculate amounts ensuring minimum per token
  const amounts: number[] = [];
  const remaining = totalValue - minTotal; // Amount left after minimums

  for (let i = 0; i < numTokens; i++) {
    const minAmount = MIN_TOKEN_VALUE;
    const extraAmount = (weights[i] / totalWeight) * remaining;
    amounts.push(minAmount + extraAmount);
  }

  // Normalize to ensure exact total (handle floating point errors)
  const currentTotal = amounts.reduce((sum, a) => sum + a, 0);
  const adjustment = totalValue - currentTotal;
  amounts[0] += adjustment; // Add any difference to first token

  // Convert to rewards
  return tokens.map((token, i) => {
    const usdValue = amounts[i];
    // For now, we'll use a placeholder amount calculation
    // In production, you'd fetch the token price and calculate: amount = usdValue / price
    // For simplicity, we'll store the USD value and calculate amount on the backend
    const amount = (usdValue * Math.pow(10, token.decimals)).toString(); // Placeholder

    return {
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      amount,
      usdValue,
      decimals: token.decimals,
      logoUrl: token.logoUrl,
    };
  });
}

/**
 * Calculate actual token amounts based on current prices
 * This should be called on the backend with real price data
 */
export async function calculateTokenAmounts(
  rewards: Omit<MysteryBoxReward, 'amount'>[]
): Promise<MysteryBoxReward[]> {
  // This function would fetch prices and calculate actual amounts
  // For now, return as-is (amounts will be calculated on backend)
  return rewards.map(r => ({
    ...r,
    amount: '0', // Will be calculated on backend with real prices
  }));
}


