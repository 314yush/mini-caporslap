import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

/**
 * POST /api/admin/clear-leaderboard
 * Clears all leaderboard data and user profile caches
 * 
 * Query params:
 *   - type: 'all' | 'global' | 'weekly' | 'profiles' (default: 'all')
 *   - confirm: 'true' (required for safety)
 * 
 * This will:
 * - Clear leaderboard sorted sets (global/weekly)
 * - Clear user profile caches
 * - Clear user best streaks
 * - Clear user ranks
 * - Clear weekly cumulative scores
 * 
 * ⚠️ WARNING: This will delete all leaderboard data!
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const confirm = searchParams.get('confirm');

    if (confirm !== 'true') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Safety confirmation required. Add ?confirm=true to proceed.',
          warning: 'This will delete all leaderboard data!'
        },
        { status: 400 }
      );
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json(
        { success: false, error: 'Redis not configured' },
        { status: 500 }
      );
    }

    const deleted: Record<string, number> = {};

    // Helper to get week key
    function getWeekKey(): string {
      const now = new Date();
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      return `${year}-${week.toString().padStart(2, '0')}`;
    }

    if (type === 'all' || type === 'global') {
      // Clear global leaderboard
      const globalKey = 'leaderboard:global';
      const count = await redis.zcard(globalKey);
      if (count > 0) {
        await redis.del(globalKey);
        deleted.globalLeaderboard = count;
      }
    }

    if (type === 'all' || type === 'weekly') {
      // Clear weekly leaderboard (current week)
      const weekKey = getWeekKey();
      const weeklyKey = `leaderboard:weekly:${weekKey}`;
      const count = await redis.zcard(weeklyKey);
      if (count > 0) {
        await redis.del(weeklyKey);
        deleted.weeklyLeaderboard = count;
      }

      // Clear weekly cumulative scores
      const cumulativeKey = `scores:weekly:${weekKey}:cumulative`;
      const cumulativeCount = await redis.zcard(cumulativeKey);
      if (cumulativeCount > 0) {
        await redis.del(cumulativeKey);
        deleted.weeklyCumulativeScores = cumulativeCount;
      }
    }

    if (type === 'all' || type === 'profiles') {
      // Clear user profiles - get all user IDs from leaderboards first
      const userIds = new Set<string>();

      // Get user IDs from global leaderboard (only if type is 'all', since 'profiles' doesn't need leaderboard data)
      if (type === 'all') {
        try {
          const globalEntries = await redis.zrange('leaderboard:global', 0, 1000, { rev: true });
          for (const entry of globalEntries) {
            if (typeof entry === 'string') {
              try {
                const parsed = JSON.parse(entry);
                if (parsed.userId) userIds.add(parsed.userId);
              } catch {
                if (entry && !entry.startsWith('{')) userIds.add(entry);
              }
            }
          }
        } catch {
          // Leaderboard might already be cleared
        }
      }

      // Get user IDs from weekly leaderboard (only if type is 'all')
      if (type === 'all') {
        try {
          const weekKey = getWeekKey();
          const weeklyKey = `leaderboard:weekly:${weekKey}`;
          const weeklyEntries = await redis.zrange(weeklyKey, 0, 1000, { rev: true });
          for (const entry of weeklyEntries) {
            if (typeof entry === 'string') {
              try {
                const parsed = JSON.parse(entry);
                if (parsed.userId) userIds.add(parsed.userId);
              } catch {
                if (entry && !entry.startsWith('{')) userIds.add(entry);
              }
            }
          }
        } catch {
          // Leaderboard might already be cleared
        }
      }

      // Delete profiles, best streaks, and ranks for all found users
      let profilesDeleted = 0;
      let bestStreaksDeleted = 0;
      let ranksDeleted = 0;

      for (const userId of userIds) {
        const profileKey = `user:${userId}:profile`;
        const bestKey = `user:${userId}:best`;
        const rankGlobalKey = `user:${userId}:rank:global`;
        const rankWeeklyKey = `user:${userId}:rank:weekly`;

        const results = await Promise.all([
          redis.del(profileKey),
          redis.del(bestKey),
          redis.del(rankGlobalKey),
          redis.del(rankWeeklyKey),
        ]);

        if (results[0]) profilesDeleted++;
        if (results[1]) bestStreaksDeleted++;
        if (results[2] || results[3]) ranksDeleted++;
      }

      deleted.userProfiles = profilesDeleted;
      deleted.userBestStreaks = bestStreaksDeleted;
      deleted.userRanks = ranksDeleted;
    }

    return NextResponse.json({
      success: true,
      message: 'Leaderboard cleared successfully',
      deleted,
      note: 'Users will need to play again to appear on the leaderboard. Their scores will use wallet addresses (if available) instead of Privy UUIDs.',
    });
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear leaderboard' },
      { status: 500 }
    );
  }
}

