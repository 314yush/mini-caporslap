import { NextRequest, NextResponse } from 'next/server';
import { getTokenPool, getDataSourceStatus } from '@/lib/data/token-pool';
import { fetchTop500Tokens } from '@/lib/data/coingecko';
import { CURATED_TOKENS } from '@/lib/data/token-categories';

/**
 * GET /api/test/tokens
 * Test endpoint to verify token pool expansion to 500 tokens
 * Returns detailed information about token fetching and enrichment
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Get query params
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    
    // Force refresh if requested
    if (refresh) {
      const { refreshTokenPool } = await import('@/lib/data/token-pool');
      await refreshTokenPool();
    }
    
    // Fetch tokens
    const tokens = await getTokenPool();
    const fetchDuration = Date.now() - startTime;
    
    // Get data source status
    const dataSourceStatus = getDataSourceStatus();
    
    // Analyze tokens
    const totalTokens = tokens.length;
    const tokensWithDescription = tokens.filter(t => t.description).length;
    const tokensWithCategory = tokens.filter(t => t.category && t.category !== 'unknown').length;
    const curatedMatches = tokens.filter(t => {
      const curatedId = t.address; // CoinGecko ID
      return CURATED_TOKENS.some(ct => ct.id === curatedId);
    }).length;
    
    // Get top 10 tokens for sample
    const top10 = tokens.slice(0, 10).map(t => ({
      symbol: t.symbol,
      name: t.name,
      marketCap: t.marketCap,
      hasDescription: !!t.description,
      category: t.category,
      isCurated: CURATED_TOKENS.some(ct => ct.id === t.address),
    }));
    
    // Test direct CoinGecko fetch
    let directFetchTest = null;
    try {
      const directStart = Date.now();
      const directTokens = await fetchTop500Tokens();
      const directDuration = Date.now() - directStart;
      directFetchTest = {
        success: true,
        tokenCount: directTokens.length,
        duration: directDuration,
      };
    } catch (error) {
      directFetchTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        totalTokens,
        tokensWithDescription,
        tokensWithCategory,
        curatedMatches,
        fetchDuration,
        targetCount: 500,
        meetsTarget: totalTokens >= 400, // Allow some variance
      },
      enrichment: {
        descriptionCoverage: `${((tokensWithDescription / totalTokens) * 100).toFixed(1)}%`,
        categoryCoverage: `${((tokensWithCategory / totalTokens) * 100).toFixed(1)}%`,
        curatedCoverage: `${((curatedMatches / totalTokens) * 100).toFixed(1)}%`,
      },
      dataSource: dataSourceStatus,
      directFetchTest,
      sample: {
        top10,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[TestTokens] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

