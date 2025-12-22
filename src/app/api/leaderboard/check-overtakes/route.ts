import { NextRequest, NextResponse } from 'next/server';
import { ResolvedIdentity, resolveIdentity } from '@/lib/auth/identity-resolver';
import { getRedis } from '@/lib/redis';

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
      // Use Redis sorted set operations for better performance
      // Check both global and weekly leaderboards
      const globalKey = 'leaderboard:global';
      
      // Get current week key for weekly leaderboard
      const now = new Date();
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      const weekKey = `${year}-${week.toString().padStart(2, '0')}`;
      const weeklyKey = `leaderboard:weekly:${weekKey}`;
      
      // Get users in the range we just overtook (between previousStreak and currentStreak)
      // Use zrangebyscore to efficiently find users in this range
      const minScore = previousStreak + 0.1; // Slightly above previous to exclude it
      const maxScore = currentStreak - 0.1; // Slightly below current to exclude it
      
      // Only check if there's a meaningful range
      if (minScore < maxScore && currentStreak >= 1) {
        // Get top leaderboard entries and filter by score range
        // Upstash Redis doesn't have zrangebyscore, so we'll get top entries and filter
        const globalTop = await redis.zrange<string[]>(globalKey, 0, 49, { rev: true, withScores: true });
        const weeklyTop = await redis.zrange<string[]>(weeklyKey, 0, 49, { rev: true, withScores: true });
        
        // Process global leaderboard (pairs: [member, score, member, score, ...])
        const globalOvertaken: string[] = [];
        for (let i = 0; i < globalTop.length; i += 2) {
          const member = globalTop[i];
          const score = parseFloat(globalTop[i + 1] || '0');
          if (score > previousStreak && score < currentStreak) {
            globalOvertaken.push(member);
          }
        }
        
        // Process weekly leaderboard
        const weeklyOvertaken: string[] = [];
        for (let i = 0; i < weeklyTop.length; i += 2) {
          const member = weeklyTop[i];
          const score = parseFloat(weeklyTop[i + 1] || '0');
          if (score > previousStreak && score < currentStreak) {
            weeklyOvertaken.push(member);
          }
        }
        
        // Combine and deduplicate
        const allOvertaken = Array.from(new Set([...globalOvertaken, ...weeklyOvertaken]));
        
        // Filter out self and guest users
        const validOvertaken = allOvertaken.filter(
          (id) => id !== userId && !id.startsWith('guest_')
        );
        
        // Resolve identities and build overtake list
        for (const overtakenId of validOvertaken.slice(0, 5)) { // Limit to 5 for performance
          try {
            // Get their score
            const globalScore = await redis.zscore(globalKey, overtakenId);
            const weeklyScore = await redis.zscore(weeklyKey, overtakenId);
            const theirStreak = Math.max(
              globalScore ? Number(globalScore) : 0,
              weeklyScore ? Number(weeklyScore) : 0
            );
            
            // Only include if streak is meaningful (>= 1)
            if (theirStreak >= 1) {
              let identity: ResolvedIdentity;
              try {
                identity = await resolveIdentity(overtakenId);
              } catch {
                // Fallback to truncated address
                identity = {
                  address: overtakenId,
                  displayName: `${overtakenId.slice(0, 6)}...${overtakenId.slice(-4)}`,
                  source: 'address',
                };
              }
              
              overtakes.push({
                overtakenUserId: overtakenId,
                overtakenUser: identity,
                theirStreak: Math.floor(theirStreak),
                yourStreak: currentStreak,
              });
            }
          } catch (err) {
            // Skip if we can't resolve this user
            console.warn('Error processing overtake for user:', overtakenId, err);
            continue;
          }
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

