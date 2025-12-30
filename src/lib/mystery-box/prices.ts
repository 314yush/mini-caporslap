/**
 * Price fetching for Mystery Box tokens
 * Uses DexScreener API (free) to get real-time prices on Base
 * For testnet, uses fallback prices since testnet tokens won't have real prices
 */

import { fetchTokenByAddress } from '@/lib/data/dexscreener';
import { getMysteryBoxTokens } from './tokens';
import { isTestnet, getNetworkConfig } from '@/lib/network-config';

const BASE_CHAIN_ID = 'base';
const BASE_SEPOLIA_CHAIN_ID = 'base-sepolia';

interface DexScreenerPair {
  chainId?: string;
  priceUsd?: string;
  liquidity?: {
    usd?: number;
  };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}

/**
 * Fetches USD prices for mystery box tokens
 * Returns a map of symbol -> price in USD
 * For testnet, returns fallback prices directly (testnet tokens won't have real prices)
 */
export async function fetchMysteryBoxTokenPrices(): Promise<Record<string, number>> {
  const priceMap: Record<string, number> = {};
  
  // For testnet, use fallback prices directly
  if (isTestnet()) {
    console.log('[MysteryBox] Using fallback prices for testnet');
    const tokens = getMysteryBoxTokens();
    for (const token of tokens) {
      priceMap[token.symbol.toUpperCase()] = getFallbackPrice(token.symbol);
    }
    // USDC is always $1
    priceMap['USDC'] = 1.0;
    return priceMap;
  }

  // For mainnet, fetch real prices from DexScreener
  // USDC is always $1
  priceMap['USDC'] = 1.0;

  const tokens = getMysteryBoxTokens();
  // Fetch prices for all other tokens in parallel
  const pricePromises = tokens
    .filter(token => token.symbol.toUpperCase() !== 'USDC')
    .map(async (token) => {
      try {
        const tokenData = await fetchTokenByAddress(BASE_CHAIN_ID, token.address);
        
        if (tokenData) {
          // Extract price from market cap and supply, or use a fallback
          // DexScreener returns pairs with priceUsd, but we need to get it from the pair
          // Let's fetch the pair data directly
          const price = await fetchTokenPriceFromDexScreener(token.address);
          
          if (price && price > 0) {
            priceMap[token.symbol.toUpperCase()] = price;
            console.log(`[MysteryBox] Fetched price for ${token.symbol}: $${price}`);
          } else {
            // Fallback: use a default price if fetch fails
            console.warn(`[MysteryBox] Could not fetch price for ${token.symbol}, using fallback`);
            priceMap[token.symbol.toUpperCase()] = getFallbackPrice(token.symbol);
          }
        } else {
          // Fallback if token not found
          console.warn(`[MysteryBox] Token ${token.symbol} not found on DexScreener, using fallback`);
          priceMap[token.symbol.toUpperCase()] = getFallbackPrice(token.symbol);
        }
      } catch (error) {
        console.error(`[MysteryBox] Error fetching price for ${token.symbol}:`, error);
        // Use fallback price on error
        priceMap[token.symbol.toUpperCase()] = getFallbackPrice(token.symbol);
      }
    });

  await Promise.all(pricePromises);

  return priceMap;
}

/**
 * Fetches token price directly from DexScreener API
 * Uses the token address endpoint which returns pairs with priceUsd
 * Only works for mainnet - testnet tokens won't have prices
 */
async function fetchTokenPriceFromDexScreener(address: string): Promise<number | null> {
  // Skip API call for testnet
  if (isTestnet()) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as DexScreenerResponse;

    if (!data.pairs || !Array.isArray(data.pairs) || data.pairs.length === 0) {
      return null;
    }

    // Find the best pair on Base (highest liquidity)
    const basePairs = data.pairs.filter((p) => p.chainId === BASE_CHAIN_ID);
    const bestPair = basePairs.length > 0
      ? basePairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
      : data.pairs[0];

    // Extract price from priceUsd field
    if (!bestPair.priceUsd) {
      return null;
    }
    const priceUsd = parseFloat(bestPair.priceUsd);
    
    if (isNaN(priceUsd) || priceUsd <= 0) {
      return null;
    }

    return priceUsd;
  } catch (error) {
    console.error(`[MysteryBox] Error fetching price from DexScreener for ${address}:`, error);
    return null;
  }
}

/**
 * Fallback prices if API fails
 * These are rough estimates - should be updated periodically
 */
function getFallbackPrice(symbol: string): number {
  const fallbackPrices: Record<string, number> = {
    JESSE: 0.006,   // Rough estimate
    AVNT: 0.38,   // Rough estimate
    AERO: 0.45,   // Rough estimate
    BANKR: 0.00014,  // Rough estimate
    ZORA: 0.039,   // Rough estimate
  };

  return fallbackPrices[symbol.toUpperCase()] || 0.01; // Default to $0.01 if unknown
}

/**
 * Fetches price for a single token by symbol
 * Useful for quick lookups
 * For testnet, returns fallback price directly
 */
export async function fetchTokenPrice(symbol: string): Promise<number> {
  // For testnet, use fallback prices
  if (isTestnet()) {
    return getFallbackPrice(symbol);
  }

  const tokens = getMysteryBoxTokens();
  const token = tokens.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
  
  if (!token) {
    return getFallbackPrice(symbol);
  }

  if (symbol.toUpperCase() === 'USDC') {
    return 1.0;
  }

  const price = await fetchTokenPriceFromDexScreener(token.address);
  return price || getFallbackPrice(symbol);
}

