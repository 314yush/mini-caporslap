import { Token, TokenCategory } from '../game-core/types';
import { findTokenInfoById, getAllCuratedIds } from './token-categories';
import { trackCoinGeckoFetch, trackCoinGeckoRateLimit } from '../analytics';

/**
 * CoinGecko API client for fetching token market data
 * Uses the free public API (rate limited to ~10-50 calls/min)
 * 
 * For production scale, consider:
 * 1. CoinGecko Pro API ($129/mo) - 500 calls/min
 * 2. Server-side caching with Redis
 * 3. Background refresh jobs
 */

const BASE_URL = 'https://api.coingecko.com/api/v3';

// CoinGecko response types
interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

interface CoinGeckoDetailedCoin {
  id: string;
  symbol: string;
  name: string;
  description: { en: string };
  image: { large: string; small: string; thumb: string };
  links: {
    homepage: string[];
    twitter_screen_name: string;
  };
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
  };
}

// Chain mapping for CoinGecko coins
const CHAIN_MAP: Record<string, string> = {
  'bitcoin': 'bitcoin',
  'ethereum': 'ethereum',
  'solana': 'solana',
  'binancecoin': 'bsc',
  'dogecoin': 'dogecoin',
  'cardano': 'cardano',
  'avalanche-2': 'avalanche',
  'polkadot': 'polkadot',
  'matic-network': 'polygon',
  'arbitrum': 'arbitrum',
  'optimism': 'optimism',
  'near': 'near',
  'cosmos': 'cosmos',
  'toncoin': 'ton',
  'sui': 'sui',
  'aptos': 'aptos',
};

/**
 * Fetches all curated tokens from CoinGecko
 * This is the main function for getting game tokens
 */
export async function fetchCuratedTokens(): Promise<Token[]> {
  const ids = getAllCuratedIds();
  
  // CoinGecko allows up to 250 IDs per request
  const batchSize = 100;
  const allTokens: Token[] = [];
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);
    const tokens = await fetchCoinsByIds(batchIds);
    allTokens.push(...tokens);
    
    // Small delay to avoid rate limiting
    if (i + batchSize < ids.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  
  console.log(`[CoinGecko] Fetched ${allTokens.length} curated tokens`);
  return allTokens;
}

/**
 * Fetches top coins by market cap from CoinGecko
 * @param limit - Number of coins to fetch (max 250)
 */
export async function fetchTopCoinsByMarketCap(limit: number = 100): Promise<Token[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[CoinGecko] Rate limited');
        return [];
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoCoin[] = await response.json();
    console.log(`[CoinGecko] Fetched ${data.length} top coins`);

    return data.map((coin) => coinToToken(coin));
  } catch (error) {
    console.error('[CoinGecko] Error fetching top coins:', error);
    return [];
  }
}

/**
 * Fetches top 500 tokens by market cap from CoinGecko
 * This is the primary source for the expanded token pool
 * Automatically enriched with curated metadata where available
 */
export async function fetchTop500Tokens(): Promise<Token[]> {
  const startTime = Date.now();
  try {
    // CoinGecko allows up to 250 per page, so we need 2 pages for 500 tokens
    const [page1, page2] = await Promise.all([
      fetch(
        `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`,
        {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 300 }, // 5 minutes cache
        }
      ),
      fetch(
        `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=2&sparkline=false`,
        {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 300 },
        }
      ),
    ]);

    if (!page1.ok) {
      if (page1.status === 429) {
        console.warn('[CoinGecko] Rate limited on top 500 fetch');
        trackCoinGeckoRateLimit('top_500');
        trackCoinGeckoFetch('top_500', 0, Date.now() - startTime, false, 'Rate limited');
        return [];
      }
      throw new Error(`CoinGecko API error: ${page1.status}`);
    }

    const data1: CoinGeckoCoin[] = await page1.json();
    const data2: CoinGeckoCoin[] = page2.ok ? await page2.json() : [];
    
    console.log(`[CoinGecko] Page 1: ${data1.length} tokens, Page 2: ${data2.length} tokens`);
    
    const allCoins = [...data1, ...data2];
    const duration = Date.now() - startTime;
    console.log(`[CoinGecko] Fetched ${allCoins.length} top tokens (target: 500) in ${duration}ms`);

    // Convert to tokens - coinToToken automatically enriches with curated metadata
    const tokens = allCoins.map((coin) => coinToToken(coin));
    
    // Track successful fetch
    trackCoinGeckoFetch('top_500', tokens.length, duration, true);
    
    return tokens;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CoinGecko] Error fetching top 500 tokens:', error);
    trackCoinGeckoFetch('top_500', 0, duration, false, errorMessage);
    return [];
  }
}

/**
 * Fetches specific coins by their CoinGecko IDs
 */
export async function fetchCoinsByIds(ids: string[]): Promise<Token[]> {
  if (ids.length === 0) return [];
  
  try {
    const idsParam = ids.join(',');
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&sparkline=false`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[CoinGecko] Rate limited on batch fetch');
        return [];
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoCoin[] = await response.json();
    return data.map((coin) => coinToToken(coin));
  } catch (error) {
    console.error('[CoinGecko] Error fetching coins by IDs:', error);
    return [];
  }
}

/**
 * Fetches detailed info for a single coin (includes description)
 * Use sparingly due to rate limits
 */
export async function fetchCoinDetails(id: string): Promise<{
  description: string;
  website?: string;
  twitter?: string;
} | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/coins/${id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: CoinGeckoDetailedCoin = await response.json();
    
    // Get first paragraph of description
    const description = data.description?.en?.split('\n')[0]?.slice(0, 200) || '';
    
    return {
      description: description.replace(/<[^>]*>/g, ''), // Strip HTML
      website: data.links?.homepage?.[0],
      twitter: data.links?.twitter_screen_name 
        ? `https://twitter.com/${data.links.twitter_screen_name}` 
        : undefined,
    };
  } catch (error) {
    console.error(`[CoinGecko] Error fetching details for ${id}:`, error);
    return null;
  }
}

/**
 * Fetches trending coins from CoinGecko
 */
export async function fetchTrendingCoins(): Promise<Token[]> {
  try {
    const response = await fetch(`${BASE_URL}/search/trending`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (!data.coins || !Array.isArray(data.coins)) {
      return [];
    }

    const coinIds = data.coins
      .map((item: { item: { id: string } }) => item.item.id)
      .slice(0, 15);

    if (coinIds.length === 0) {
      return [];
    }

    return fetchCoinsByIds(coinIds);
  } catch (error) {
    console.error('[CoinGecko] Error fetching trending:', error);
    return [];
  }
}

/**
 * Converts CoinGecko coin to our Token type
 * Enriches with curated metadata if available
 */
function coinToToken(coin: CoinGeckoCoin): Token {
  // Check if we have curated info for this token
  const curatedInfo = findTokenInfoById(coin.id);
  
  return {
    id: `cg-${coin.id}`,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    logoUrl: coin.image,
    marketCap: coin.market_cap || 0,
    chain: CHAIN_MAP[coin.id] || curatedInfo?.chains?.[0] || 'ethereum',
    address: coin.id,
    // Add curated metadata
    category: curatedInfo?.category as TokenCategory || 'unknown',
    description: curatedInfo?.description,
    website: curatedInfo?.website,
    twitter: curatedInfo?.twitter,
  };
}

/**
 * Test CoinGecko API connectivity
 */
export async function testCoinGeckoAPI(): Promise<{
  success: boolean;
  coinsFound: number;
  error?: string;
}> {
  try {
    const response = await fetch(`${BASE_URL}/ping`);
    if (!response.ok) {
      throw new Error(`Ping failed: ${response.status}`);
    }
    
    const coins = await fetchTopCoinsByMarketCap(5);
    return { success: true, coinsFound: coins.length };
  } catch (error) {
    return {
      success: false,
      coinsFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
