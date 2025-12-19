import { Token } from '../game-core/types';

/**
 * DexScreener API client for fetching token data
 * API Reference: https://docs.dexscreener.com/api
 */

const BASE_URL = 'https://api.dexscreener.com';

// DexScreener API response types
interface DexScreenerToken {
  address: string;
  name: string;
  symbol: string;
}

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: DexScreenerToken;
  quoteToken: DexScreenerToken;
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: { type: string; url: string }[];
  };
}

interface DexScreenerPairsResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

interface DexScreenerSearchResponse {
  pairs: DexScreenerPair[];
}

/**
 * Searches for tokens by symbol/name using DexScreener
 * @param query - Search query
 * @returns Array of Token objects
 */
export async function searchTokens(query: string): Promise<Token[]> {
  try {
    const response = await fetch(`${BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`DexScreener search error: ${response.status}`);
      return [];
    }

    const data: DexScreenerSearchResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return [];
    }

    // Filter and map to Token objects
    return data.pairs
      .filter((pair) => (pair.marketCap || pair.fdv) && pair.marketCap !== 0)
      .slice(0, 5)
      .map((pair) => pairToToken(pair));
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
}

/**
 * Fetches pairs for a specific token address
 * @param chainId - Chain identifier
 * @param address - Token contract address
 * @returns Token object or null
 */
export async function fetchTokenByAddress(
  chainId: string,
  address: string
): Promise<Token | null> {
  try {
    const response = await fetch(`${BASE_URL}/latest/dex/tokens/${address}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    const data: DexScreenerPairsResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }

    // Find the best pair (highest liquidity on the specified chain)
    const chainPairs = data.pairs.filter(p => p.chainId === chainId);
    const pair = chainPairs.length > 0 
      ? chainPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
      : data.pairs[0];

    if (!pair.marketCap && !pair.fdv) {
      return null;
    }

    return pairToToken(pair);
  } catch (error) {
    console.error(`Error fetching token ${address}:`, error);
    return null;
  }
}

/**
 * Fetches pairs by chain ID
 * @param chainId - Chain identifier (ethereum, solana, base, etc.)
 * @returns Array of tokens
 */
export async function fetchPairsByChain(chainId: string): Promise<Token[]> {
  try {
    // DexScreener doesn't have a direct endpoint for all pairs on a chain
    // We'll use search for popular tokens on each chain
    const searchQueries = chainId === 'solana' 
      ? ['SOL', 'BONK', 'WIF', 'JUP', 'PYTH']
      : chainId === 'base'
      ? ['BRETT', 'DEGEN', 'TOSHI', 'HIGHER']
      : chainId === 'ethereum'
      ? ['ETH', 'PEPE', 'SHIB', 'LINK', 'UNI']
      : ['BTC', 'ETH'];

    const results = await Promise.all(
      searchQueries.map(q => searchTokens(q))
    );

    const tokens: Token[] = [];
    const seen = new Set<string>();

    for (const tokenList of results) {
      for (const token of tokenList) {
        if (!seen.has(token.id) && token.chain === chainId) {
          seen.add(token.id);
          tokens.push(token);
        }
      }
    }

    return tokens;
  } catch (error) {
    console.error(`Error fetching pairs for chain ${chainId}:`, error);
    return [];
  }
}

/**
 * Fetches top tokens by searching for popular symbols
 * More reliable than the boosted endpoint
 */
export async function fetchTopTokens(): Promise<Token[]> {
  const popularSymbols = [
    'BTC', 'ETH', 'SOL', 'DOGE', 'SHIB', 'PEPE', 
    'LINK', 'UNI', 'AAVE', 'ARB', 'OP', 'MATIC',
    'AVAX', 'BONK', 'WIF', 'FLOKI', 'APE', 'MEME'
  ];

  const results = await Promise.all(
    popularSymbols.map(symbol => searchTokens(symbol))
  );

  const tokenMap = new Map<string, Token>();

  // Take the best result for each search (usually the first with highest liquidity)
  for (let i = 0; i < popularSymbols.length; i++) {
    const tokens = results[i];
    if (tokens.length > 0) {
      // Find the token that matches the symbol exactly
      const exactMatch = tokens.find(t => 
        t.symbol.toUpperCase() === popularSymbols[i].toUpperCase()
      );
      const token = exactMatch || tokens[0];
      
      // Deduplicate by symbol
      if (!tokenMap.has(token.symbol.toUpperCase())) {
        tokenMap.set(token.symbol.toUpperCase(), token);
      }
    }
  }

  console.log(`[DexScreener] Fetched ${tokenMap.size} unique tokens`);
  return Array.from(tokenMap.values());
}

/**
 * Fetches trending tokens from DexScreener
 */
export async function fetchTrendingTokens(): Promise<Token[]> {
  try {
    // Try the boosted/trending endpoint
    const response = await fetch(`${BASE_URL}/token-boosts/top/v1`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.log('[DexScreener] Boosted endpoint not available, skipping trending');
      return [];
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Fetch details for each boosted token
    const tokens: Token[] = [];
    
    for (const boost of data.slice(0, 10)) {
      if (boost.tokenAddress) {
        const token = await fetchTokenByAddress(boost.chainId || 'ethereum', boost.tokenAddress);
        if (token) {
          tokens.push(token);
        }
      }
    }

    console.log(`[DexScreener] Fetched ${tokens.length} trending tokens`);
    return tokens;
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return [];
  }
}

/**
 * Converts a DexScreener pair to our Token type
 */
function pairToToken(pair: DexScreenerPair): Token {
  const marketCap = pair.marketCap || pair.fdv || 0;
  
  return {
    id: `${pair.chainId}-${pair.baseToken.address}`,
    symbol: pair.baseToken.symbol,
    name: pair.baseToken.name,
    logoUrl: pair.info?.imageUrl || getDefaultLogoUrl(pair.chainId, pair.baseToken.address),
    marketCap,
    chain: pair.chainId,
    address: pair.baseToken.address,
  };
}

/**
 * Gets a default logo URL for a token
 */
function getDefaultLogoUrl(chainId: string, address: string): string {
  return `https://dd.dexscreener.com/ds-data/tokens/${chainId}/${address}.png`;
}

/**
 * Debug function to test API connectivity
 */
export async function testDexScreenerAPI(): Promise<{
  success: boolean;
  tokensFound: number;
  error?: string;
}> {
  try {
    const tokens = await searchTokens('ETH');
    return {
      success: true,
      tokensFound: tokens.length,
    };
  } catch (error) {
    return {
      success: false,
      tokensFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
