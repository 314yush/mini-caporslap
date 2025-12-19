import { NextRequest, NextResponse } from 'next/server';
import { ResolvedIdentity, resolveIdentity } from '@/lib/auth/identity-resolver';
import { getGlobalLeaderboard, getRedis } from '@/lib/redis';

export interface LiveOvertake {
  overtakenUserId: string;
  overtakenUser: ResolvedIdentity;
  theirStreak: number;
  yourStreak: number;
}

/**
 * POST /api/leaderboard/check-overtakes
 * Checks if current streak overtakes anyone on the leaderboard
 * Called after each correct guess to show real-time notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentStreak, previousStreak } = body as {
      userId: string;
      currentStreak: number;
      previousStreak: number;
    };

    if (!userId || currentStreak === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or currentStreak' },
        { status: 400 }
      );
    }

    // Only check for overtakes if streak increased
    if (currentStreak <= previousStreak) {
      return NextResponse.json({ success: true, overtakes: [] });
    }

    // Get Redis client
    const redis = getRedis();

    const overtakes: LiveOvertake[] = [];

    if (redis) {
      // Get leaderboard entries from Redis
      const leaderboard = await getGlobalLeaderboard(50);
      
      // Find users whose streak is between previousStreak (exclusive) and currentStreak (exclusive)
      // These are the people we just overtook in this specific step
      // Only show meaningful overtakes (streak >= 1) to avoid spam from streak 0
      for (const entry of leaderboard) {
        if (entry.user.userId === userId) continue; // Skip self
        
        // Show overtakes if we actually passed them in this step:
        // - Their streak must be >= 1 (meaningful)
        // - Their streak must be < currentStreak (we passed them)
        // - Their streak must be > previousStreak (we just passed them now, not before)
        // This prevents showing the same overtake multiple times
        if (
          entry.bestStreak >= 1 && 
          entry.bestStreak < currentStreak && 
          entry.bestStreak > previousStreak
        ) {
          let identity: ResolvedIdentity;
          try {
            identity = await resolveIdentity(entry.user.userId);
          } catch {
            identity = {
              address: entry.user.userId,
              displayName: entry.user.displayName || `${entry.user.userId.slice(0, 6)}...${entry.user.userId.slice(-4)}`,
              avatarUrl: entry.user.avatarUrl,
              source: (entry.user.userType as 'ens' | 'farcaster' | 'basename' | 'address') || 'address',
            };
          }
          
          overtakes.push({
            overtakenUserId: entry.user.userId,
            overtakenUser: identity,
            theirStreak: entry.bestStreak,
            yourStreak: currentStreak,
          });
        }
      }
    }

    // Sort by streak descending (show highest overtaken first)
    overtakes.sort((a, b) => b.theirStreak - a.theirStreak);

    return NextResponse.json({
      success: true,
      overtakes: overtakes.slice(0, 3), // Max 3 notifications at once
    });
  } catch (error) {
    console.error('Error checking overtakes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check overtakes' },
      { status: 500 }
    );
  }
}

