import { NextRequest, NextResponse } from 'next/server';
import { getDailyPoolCount, initializeDailyPool } from '@/lib/mystery-box/storage';

/**
 * GET /api/mystery-box/pool
 * Returns the current daily pool count (remaining mystery boxes for today)
 */
export async function GET(request: NextRequest) {
  try {
    // Check feature flag
    if (process.env.FEATURE_MYSTERY_BOX !== 'true') {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'Mystery boxes are currently disabled',
      });
    }

    // Get current pool count
    let poolCount = await getDailyPoolCount();
    
    // If pool is 0 or negative, check if it's a new day and initialize if needed
    if (poolCount <= 0) {
      poolCount = await initializeDailyPool();
    }

    return NextResponse.json({
      success: true,
      count: Math.max(0, poolCount),
    });
  } catch (error) {
    console.error('[MysteryBox] Error getting pool count:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get pool count' },
      { status: 500 }
    );
  }
}

