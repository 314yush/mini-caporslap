import { NextRequest, NextResponse } from 'next/server';
import { Run } from '@/lib/game-core/types';
import { requiresVerification, validateGameState, ServerGameState } from '@/lib/game-core/validator';
import { submitScoreWithOvertakes, OvertakeEvent } from '@/lib/leaderboard/overtake';
import { resolveIdentity, ResolvedIdentity } from '@/lib/auth/identity-resolver';
import { getRedis } from '@/lib/redis';

/**
 * POST /api/leaderboard/submit
 * Submits a completed run to the leaderboard
 * High scores (10+) are validated server-side
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { run, userId } = body as { run: Run; userId: string };

    if (!run || !run.runId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid run data' },
        { status: 400 }
      );
    }

    const redis = getRedis();
    
    // For high scores, validate against server state
    if (requiresVerification(run.streak) && redis) {
      const stateData = await redis.get(`game:${run.runId}:state`);
      
      if (!stateData) {
        return NextResponse.json(
          { success: false, error: 'Game session not found - score cannot be verified' },
          { status: 400 }
        );
      }
      
      // Handle both string (needs parsing) and object (already parsed) cases
      const gameState: ServerGameState = typeof stateData === 'string' 
        ? JSON.parse(stateData) 
        : stateData as ServerGameState;
      
      // Verify user owns this game
      if (gameState.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - user mismatch' },
          { status: 403 }
        );
      }
      
      // Verify streak matches server state
      if (gameState.currentStreak !== run.streak) {
        return NextResponse.json(
          { success: false, error: `Streak mismatch: reported ${run.streak}, server has ${gameState.currentStreak}` },
          { status: 400 }
        );
      }
      
      // Validate the game state
      const validation = validateGameState(gameState);
      if (!validation.valid) {
        console.warn(`[Leaderboard] Validation failed for run ${run.runId}: ${validation.reason}`);
        return NextResponse.json(
          { success: false, error: 'Score validation failed', reason: validation.reason },
          { status: 400 }
        );
      }
    }
    
    // Resolve user identity
    let userIdentity: ResolvedIdentity;
    try {
      userIdentity = await resolveIdentity(userId);
    } catch {
      userIdentity = {
        address: userId,
        displayName: userId.startsWith('guest_') 
          ? 'Guest' 
          : `${userId.slice(0, 6)}...${userId.slice(-4)}`,
        source: 'address',
      };
    }
    
    // Submit to leaderboard with overtake detection
    let result: {
      success: boolean;
      isNewBest: boolean;
      previousRank: number | null;
      newRank: number;
      overtakes: OvertakeEvent[];
    };
    
    if (redis) {
      // Use real Redis
      result = await submitScoreWithOvertakes(redis, userId, run.streak, userIdentity);
    } else {
      // Redis not configured - return empty result
      result = {
        success: true,
        isNewBest: false,
        previousRank: null,
        newRank: 0,
        overtakes: [],
      };
    }

    return NextResponse.json({
      success: result.success,
      isNewBest: result.isNewBest,
      previousRank: result.previousRank,
      newRank: result.newRank,
      overtakes: result.overtakes,
      streak: run.streak,
    });
  } catch (error) {
    console.error('Error submitting to leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit to leaderboard' },
      { status: 500 }
    );
  }
}
