import { NextRequest, NextResponse } from 'next/server';
import { finalizeWeeklyPrizePool } from '@/lib/leaderboard/weekly-cycle';
import { getCurrentWeekKey } from '@/lib/leaderboard/prizepool';

/**
 * POST /api/prizepool/distribute
 * Admin endpoint to distribute prizes (calculates distribution, does not send actual USDC)
 * For actual USDC transfers, this would need to be enhanced with wallet integration
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
    const { weekKey } = body;
    
    // Use provided weekKey or current week
    const finalizeWeekKey = weekKey || getCurrentWeekKey();
    
    // Finalize and calculate distribution
    const result = await finalizeWeeklyPrizePool(finalizeWeekKey);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
    
    // TODO: In production, this would:
    // 1. Send USDC transfers to each winner
    // 2. Track transaction hashes
    // 3. Store distribution records
    // 4. Send notifications to winners
    
    return NextResponse.json({
      success: true,
      weekKey: finalizeWeekKey,
      distribution: result.distribution,
      message: 'Distribution calculated. Actual USDC transfers would be sent here in production.',
    });
  } catch (error) {
    console.error('Error distributing prizes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to distribute prizes' },
      { status: 500 }
    );
  }
}




