import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyLeaderboard, getGlobalLeaderboard, getUserWeeklyRank } from '@/lib/redis';

/**
 * GET /api/leaderboard
 * Returns leaderboard entries
 * Query params:
 *   - type: 'weekly' | 'global' (default: weekly)
 *   - limit: number (default: 100)
 *   - userId: string (optional, to get user's rank)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'weekly') as 'weekly' | 'global';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const userId = searchParams.get('userId');

    // Use Redis for leaderboard
    const entries = type === 'global'
      ? await getGlobalLeaderboard(limit)
      : await getWeeklyLeaderboard(limit);

    // Get user's rank if requested
    let userRank: number | null = null;
    if (userId) {
      userRank = await getUserWeeklyRank(userId);
    }

    return NextResponse.json({
      success: true,
      type,
      entries,
      userRank,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
