import { NextRequest, NextResponse } from 'next/server';
import { checkPositionChange } from '@/lib/leaderboard/position-tracker';

/**
 * POST /api/leaderboard/position-change
 * Checks if user's rank changed
 * Returns: { changed: boolean, previousRank: number, currentRank: number, direction: 'up' | 'down' | null }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, board = 'weekly' } = body as {
      userId: string;
      board?: 'weekly' | 'global';
    };

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const result = await checkPositionChange(userId, board);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error checking position change:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check position change' },
      { status: 500 }
    );
  }
}




