import { NextResponse } from 'next/server';
import { getTokenPool, refreshTokenPool } from '@/lib/data/token-pool';

/**
 * GET /api/tokens
 * Returns the current token pool
 */
export async function GET() {
  try {
    const tokens = await getTokenPool();
    
    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length,
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tokens
 * Force refreshes the token pool
 */
export async function POST() {
  try {
    const tokens = await refreshTokenPool();
    
    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length,
      refreshed: true,
    });
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh tokens' },
      { status: 500 }
    );
  }
}








