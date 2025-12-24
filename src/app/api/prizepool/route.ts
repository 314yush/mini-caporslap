import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentPrizePool,
  getWeeklyScores,
  getUserWeeklyScore,
  calculatePrizeDistribution,
  getSponsor,
} from '@/lib/leaderboard/prizepool';
import { getRedis } from '@/lib/redis';

/**
 * GET /api/prizepool
 * Get current prize pool info, top scores, user's rank
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const prizePool = await getCurrentPrizePool();
    const scores = await getWeeklyScores(50);
    const sponsor = await getSponsor();
    
    // Calculate prize distribution (for display)
    const distribution = prizePool
      ? calculatePrizeDistribution(scores, prizePool.prizeAmount)
      : [];
    
    // Get user's score and rank if userId provided
    let userScore = 0;
    let userRank: number | null = null;
    let userPrizeEstimate = 0;
    
    if (userId) {
      userScore = await getUserWeeklyScore(userId);
      
      // Find user's rank
      const userIndex = scores.findIndex(s => s.userId === userId);
      if (userIndex >= 0) {
        userRank = userIndex + 1;
        // Get prize estimate
        const userDistribution = distribution.find(d => d.userId === userId);
        if (userDistribution) {
          userPrizeEstimate = userDistribution.prize;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      prizePool,
      sponsor,
      topScores: scores.slice(0, 50),
      distribution,
      userScore,
      userRank,
      userPrizeEstimate,
    });
  } catch (error) {
    console.error('Error fetching prize pool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prize pool' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prizepool
 * Admin endpoint to set prize pool amount or sponsor (protected)
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
    const { action, prizeAmount, sponsor } = body;
    
    if (action === 'setPrizeAmount' && prizeAmount) {
      const { initializeWeeklyPrizePool } = await import('@/lib/leaderboard/prizepool');
      const success = await initializeWeeklyPrizePool(prizeAmount);
      return NextResponse.json({ success });
    }
    
    if (action === 'setSponsor' && sponsor) {
      const { setSponsor } = await import('@/lib/leaderboard/prizepool');
      const success = await setSponsor(sponsor);
      return NextResponse.json({ success });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating prize pool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update prize pool' },
      { status: 500 }
    );
  }
}




