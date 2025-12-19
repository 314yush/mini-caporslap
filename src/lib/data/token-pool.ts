import { Token } from '../game-core/types';
import { fetchCuratedTokens, fetchTrendingCoins, testCoinGeckoAPI } from './coingecko';
import { fetchTopTokens, fetchTrendingTokens, testDexScreenerAPI } from './dexscreener';
import { CURATED_TOKENS, findTokenInfoBySymbol } from './token-categories';

/**
 * Token pool management with aggressive caching
 * Designed for high traffic with multiple data source fallbacks
 */

// In-memory cache
let cachedTokens: Token[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const MIN_TOKENS_REQUIRED = 30;

// Data source status tracking
const dataSourceStatus = {
  coingecko: { available: true, lastCheck: 0, errorCount: 0 },
  dexscreener: { available: true, lastCheck: 0, errorCount: 0 },
};

/**
 * Gets the token pool, using cached data when available
 * Primary source: CoinGecko (curated list)
 * Secondary source: DexScreener (for trending/new tokens)
 */
export async function getTokenPool(): Promise<Token[]> {
  const now = Date.now();
  
  // Return cached tokens if still valid
  if (cachedTokens.length >= MIN_TOKENS_REQUIRED && now - lastFetchTime < CACHE_DURATION) {
    return cachedTokens;
  }

  console.log('[TokenPool] Refreshing token pool...');

  try {
    const tokenMap = new Map<string, Token>();

    // PRIMARY: Fetch curated tokens from CoinGecko
    if (dataSourceStatus.coingecko.available) {
      try {
        const curatedTokens = await fetchCuratedTokens();
        console.log(`[TokenPool] CoinGecko curated: ${curatedTokens.length} tokens`);
        
        for (const token of curatedTokens) {
          if (token.marketCap > 0) {
            tokenMap.set(token.symbol.toUpperCase(), token);
          }
        }

        // Also fetch trending for variety
        const trending = await fetchTrendingCoins();
        for (const token of trending) {
          const key = token.symbol.toUpperCase();
          if (!tokenMap.has(key) && token.marketCap > 1_000_000) {
            // Enrich with curated info if available
            const info = findTokenInfoBySymbol(token.symbol);
            if (info) {
              token.category = info.category;
              token.description = info.description;
            }
            tokenMap.set(key, token);
          }
        }
        
        dataSourceStatus.coingecko.errorCount = 0;
      } catch (error) {
        console.error('[TokenPool] CoinGecko error:', error);
        dataSourceStatus.coingecko.errorCount++;
        if (dataSourceStatus.coingecko.errorCount > 3) {
          dataSourceStatus.coingecko.available = false;
          dataSourceStatus.coingecko.lastCheck = now;
        }
      }
    }

    // SECONDARY: DexScreener for additional tokens
    if (dataSourceStatus.dexscreener.available && tokenMap.size < MIN_TOKENS_REQUIRED) {
      try {
        const dsTokens = await fetchTopTokens();
        console.log(`[TokenPool] DexScreener: ${dsTokens.length} tokens`);
        
        for (const token of dsTokens) {
          const key = token.symbol.toUpperCase();
          if (!tokenMap.has(key) && token.marketCap > 1_000_000) {
            const info = findTokenInfoBySymbol(token.symbol);
            if (info) {
              token.category = info.category;
              token.description = info.description;
            }
            tokenMap.set(key, token);
          }
        }

        const dsTrending = await fetchTrendingTokens();
        for (const token of dsTrending) {
          const key = token.symbol.toUpperCase();
          if (!tokenMap.has(key) && token.marketCap > 1_000_000) {
            tokenMap.set(key, token);
          }
        }
        
        dataSourceStatus.dexscreener.errorCount = 0;
      } catch (error) {
        console.error('[TokenPool] DexScreener error:', error);
        dataSourceStatus.dexscreener.errorCount++;
        if (dataSourceStatus.dexscreener.errorCount > 3) {
          dataSourceStatus.dexscreener.available = false;
          dataSourceStatus.dexscreener.lastCheck = now;
        }
      }
    }

    // Convert to array and filter
    let allTokens = Array.from(tokenMap.values());
    
    // Filter out stablecoins (no fun guessing USDT vs USDC)
    allTokens = allTokens.filter(t => {
      const symbol = t.symbol.toUpperCase();
      const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'GUSD', 'FRAX', 'LUSD'];
      return !stablecoins.includes(symbol);
    });

    console.log(`[TokenPool] After filtering: ${allTokens.length} tokens`);

    // Use fallback if we don't have enough tokens
    if (allTokens.length < MIN_TOKENS_REQUIRED) {
      console.warn('[TokenPool] Adding fallback tokens');
      const fallbacks = getFallbackTokens();
      for (const token of fallbacks) {
        const key = token.symbol.toUpperCase();
        if (!tokenMap.has(key)) {
          tokenMap.set(key, token);
        }
      }
      allTokens = Array.from(tokenMap.values());
    }

    // Sort by market cap
    allTokens.sort((a, b) => b.marketCap - a.marketCap);
    
    cachedTokens = allTokens;
    lastFetchTime = now;
    
    console.log(`[TokenPool] Final pool: ${cachedTokens.length} tokens`);
    return cachedTokens;
  } catch (error) {
    console.error('[TokenPool] Critical error:', error);
    
    if (cachedTokens.length > 0) {
      return cachedTokens;
    }
    
    return getFallbackTokens();
  }
}

/**
 * Force refresh the token pool
 */
export async function refreshTokenPool(): Promise<Token[]> {
  lastFetchTime = 0;
  dataSourceStatus.coingecko.available = true;
  dataSourceStatus.coingecko.errorCount = 0;
  dataSourceStatus.dexscreener.available = true;
  dataSourceStatus.dexscreener.errorCount = 0;
  return getTokenPool();
}

/**
 * Get random tokens from pool
 */
export async function getRandomTokens(count: number): Promise<Token[]> {
  const pool = await getTokenPool();
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get data source status
 */
export function getDataSourceStatus() {
  return {
    ...dataSourceStatus,
    cacheAge: Date.now() - lastFetchTime,
    cachedTokenCount: cachedTokens.length,
  };
}

/**
 * Test all data sources
 */
export async function testDataSources() {
  const [cgResult, dsResult] = await Promise.all([
    testCoinGeckoAPI(),
    testDexScreenerAPI(),
  ]);
  return { coingecko: cgResult, dexscreener: dsResult };
}

/**
 * Get cached tokens without refresh
 */
export function getCachedTokens(): Token[] {
  return cachedTokens;
}

/**
 * Fallback tokens with curated descriptions
 */
function getFallbackTokens(): Token[] {
  return CURATED_TOKENS.slice(0, 50).map(info => ({
    id: `fallback-${info.id}`,
    symbol: info.symbol,
    name: info.name,
    logoUrl: `https://assets.coingecko.com/coins/images/1/large/bitcoin.png`, // Placeholder
    marketCap: getEstimatedMarketCap(info.symbol),
    chain: info.chains?.[0] || 'ethereum',
    address: info.id,
    category: info.category,
    description: info.description,
  }));
}

/**
 * Estimated market caps for fallback (rough approximations)
 */
function getEstimatedMarketCap(symbol: string): number {
  const estimates: Record<string, number> = {
    'BTC': 1_700_000_000_000,
    'ETH': 350_000_000_000,
    'SOL': 70_000_000_000,
    'BNB': 90_000_000_000,
    'XRP': 110_000_000_000,
    'DOGE': 20_000_000_000,
    'ADA': 14_000_000_000,
    'AVAX': 15_000_000_000,
    'SHIB': 8_000_000_000,
    'LINK': 10_000_000_000,
    'DOT': 8_000_000_000,
    'PEPE': 5_000_000_000,
    'UNI': 6_000_000_000,
    'ARB': 3_000_000_000,
    'OP': 2_500_000_000,
  };
  return estimates[symbol] || 1_000_000_000;
}
