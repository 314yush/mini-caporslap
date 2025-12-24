import { NextRequest, NextResponse } from 'next/server';
import { finalizeWeeklyPrizePool, initializeNextWeekPrizePool } from '@/lib/leaderboard/weekly-cycle';
import { getCurrentWeekKey } from '@/lib/leaderboard/prizepool';

/**
 * POST /api/prizepool/finalize
 * Admin endpoint to finalize current week and initialize next week
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin key
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.PRIZE_POOL_ADMIN_KEY;
    
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { weekKey, nextWeekPrizeAmount = 1000, nextWeekSponsor } = body;
    
    // Use provided weekKey or current week
    const finalizeWeekKey = weekKey || getCurrentWeekKey();
    
    // Finalize current week
    const result = await finalizeWeeklyPrizePool(finalizeWeekKey);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
    
    // Initialize next week
    const nextWeekInitialized = await initializeNextWeekPrizePool(
      nextWeekPrizeAmount,
      nextWeekSponsor
    );
    
    return NextResponse.json({
      success: true,
      finalized: {
        weekKey: finalizeWeekKey,
        distribution: result.distribution,
      },
      nextWeekInitialized,
    });
  } catch (error) {
    console.error('Error finalizing prize pool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to finalize prize pool' },
      { status: 500 }
    );
  }
}




