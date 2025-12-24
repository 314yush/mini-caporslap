import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

function getWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-${week.toString().padStart(2, '0')}`;
}

/**
 * POST /api/admin/clear-cache
 * Clears Redis cache for user profiles (to force identity re-resolution)
 * 
 * Query params:
 *   - type: 'profiles' | 'all' | 'user' (default: 'profiles')
 *   - userId: string (required if type is 'user')
 * 
 * This endpoint helps refresh ENS/Farcaster name resolution by clearing cached profiles
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'profiles';
    const userId = searchParams.get('userId');

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json(
        { success: false, error: 'Redis not configured' },
        { status: 500 }
      );
    }

    let deleted = 0;

    if (type === 'user' && userId) {
      // Clear cache for specific user
      const keys = [
        `user:${userId}:profile`,
        `user:${userId}:best`,
        `user:${userId}:rank:global`,
        `user:${userId}:rank:weekly`,
      ];

      // Get current week for weekly stats
      const now = new Date();
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      const weekKey = `${year}-${week.toString().padStart(2, '0')}`;
      keys.push(`user:${userId}:weekly:${weekKey}`);

      // Delete all keys for this user
      const deletePromises = keys.map(key => redis.del(key));
      const results = await Promise.all(deletePromises);
      deleted = results.filter(r => r === 1).length;

      return NextResponse.json({
        success: true,
        message: `Cleared ${deleted} keys for user ${userId}`,
        deleted,
      });
    } else if (type === 'profiles') {
      // Clear all user profiles (for identity resolution)
      // Note: Upstash Redis REST API doesn't support SCAN, so we'll need to track keys differently
      // For now, we'll use a pattern-based approach if possible, or require manual key listing
      
      // Since Upstash REST API has limitations, we'll use a workaround:
      // Delete profiles for users currently on leaderboard
      const globalLeaderboard = await redis.zrange('leaderboard:global', 0, 100, { rev: true });
      const weeklyKey = `leaderboard:weekly:${getWeekKey()}`;
      const weeklyLeaderboard = await redis.zrange(weeklyKey, 0, 100, { rev: true });
      
      const userIds = new Set<string>();
      
      // Extract user IDs from leaderboard entries
      for (const entry of globalLeaderboard) {
        if (typeof entry === 'string') {
          try {
            const parsed = JSON.parse(entry);
            if (parsed.userId) userIds.add(parsed.userId);
          } catch {
            // If it's a plain string, it's the userId
            if (entry && !entry.startsWith('{')) userIds.add(entry);
          }
        }
      }
      
      for (const entry of weeklyLeaderboard) {
        if (typeof entry === 'string') {
          try {
            const parsed = JSON.parse(entry);
            if (parsed.userId) userIds.add(parsed.userId);
          } catch {
            if (entry && !entry.startsWith('{')) userIds.add(entry);
          }
        }
      }

      // Delete profiles for all found user IDs
      const deletePromises = Array.from(userIds).map(userId => 
        redis.del(`user:${userId}:profile`)
      );
      const results = await Promise.all(deletePromises);
      deleted = results.filter(r => r === 1).length;

      return NextResponse.json({
        success: true,
        message: `Cleared ${deleted} user profile caches from leaderboard users`,
        deleted,
        note: 'Only cleared profiles for users currently on leaderboard. For full cache clear, use Redis CLI or Upstash dashboard.',
      });
    } else if (type === 'all') {
      // Clear everything (use with caution!)
      // Upstash REST API doesn't support FLUSHDB directly
      // This would need to be done via Upstash dashboard or CLI
      return NextResponse.json(
        { 
          success: false, 
          error: 'Full cache clear not supported via REST API. Use Upstash dashboard or Redis CLI.' 
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Use: profiles, all, or user (with userId param)' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

