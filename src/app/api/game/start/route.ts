import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getTokenPool } from '@/lib/data/token-pool';
import { 
  generateGameSeed, 
  selectInitialPairSeeded
} from '@/lib/game-core/seeded-selection';
import { selectInitialPair, selectNextToken } from '@/lib/game-core/sequencing';
import { getTimerDuration } from '@/lib/game-core/timer';
import { getRedis } from '@/lib/redis';
import { Token } from '@/lib/game-core/types';

/**
 * POST /api/game/start
 * Starts a new game run with server-side state tracking
 * Returns initial token pair, run ID, and timer info
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get token pool
    const tokens = await getTokenPool();
    
    if (tokens.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Not enough tokens available' },
        { status: 500 }
      );
    }

    // Generate run ID and seed
    const runId = uuidv4();
    const seed = generateGameSeed();

    // Select initial pair
    let currentToken, nextToken;
    try {
      [currentToken, nextToken] = selectInitialPair(tokens);
    } catch {
      // Fallback to seeded selection if selection fails
      const pair = selectInitialPairSeeded(tokens, seed);
      if (!pair) {
        return NextResponse.json(
          { success: false, error: 'Failed to select initial tokens' },
          { status: 500 }
        );
      }
      currentToken = pair.currentToken;
      nextToken = pair.nextToken;
    }

    const startedAt = Date.now();
    const timerDuration = getTimerDuration(0);

    // Preload a batch of tokens for smooth gameplay (5 tokens ahead)
    const PRELOAD_COUNT = 5;
    const preloadedTokens: Token[] = [];
    let lastToken = nextToken;
    const usedIds = new Set([currentToken.id, nextToken.id]);

    for (let i = 0; i < PRELOAD_COUNT; i++) {
      const nextPreloaded = selectNextToken(tokens, lastToken, Array.from(usedIds));
      if (!nextPreloaded) break;
      
      preloadedTokens.push(nextPreloaded);
      usedIds.add(nextPreloaded.id);
      lastToken = nextPreloaded;
    }

    // Store game state in Redis for validation
    const redis = getRedis();
    if (redis) {
      const gameState = {
        runId,
        seed,
        userId,
        startedAt,
        guesses: [],
        currentStreak: 0,
        hasUsedReprieve: false,
        currentTokenId: currentToken.id,
        nextTokenId: nextToken.id,
        roundNumber: 0,
        // Store token IDs for this game session
        tokenPoolIds: tokens.map(t => t.id),
      };
      
      // Store with 1 hour TTL (games shouldn't last longer)
      await redis.set(`game:${runId}:state`, JSON.stringify(gameState), { ex: 3600 });
      await redis.set(`game:${runId}:seed`, seed, { ex: 3600 });
    }

    return NextResponse.json({
      success: true,
      runId,
      seed, // Client needs seed for verification
      currentToken,
      nextToken,
      timerDuration,
      startedAt,
      preloadedTokens, // Preloaded tokens for smooth gameplay
    });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start game' },
      { status: 500 }
    );
  }
}
