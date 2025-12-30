import { NextRequest, NextResponse } from 'next/server';
import { getPrizepoolConfig, calculateAllPrizeAmounts, getPrizepoolSummary } from '@/lib/leaderboard/prizepool';

/**
 * GET /api/leaderboard/prizepool
 * Returns current week's prizepool information
 * Query params:
 *   - totalAmount: number (optional, for calculating prize amounts)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const totalAmountParam = searchParams.get('totalAmount');
    const totalAmount = totalAmountParam ? parseFloat(totalAmountParam) : 0;

    const config = getPrizepoolConfig();
    const summary = getPrizepoolSummary(totalAmount);
    
    // Only calculate prize amounts if prizepool is enabled and totalAmount is provided
    const prizeAmounts = config.enabled && totalAmount > 0
      ? calculateAllPrizeAmounts(totalAmount)
      : [];

    return NextResponse.json({
      success: true,
      config: {
        enabled: config.enabled,
        totalAmount: config.totalAmount,
        eligibleRanks: 25,
      },
      summary,
      prizeAmounts,
      message: config.enabled 
        ? 'Prizepool is active' 
        : 'Prizepool is currently disabled',
    });
  } catch (error) {
    console.error('Error fetching prizepool info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prizepool information' },
      { status: 500 }
    );
  }
}

