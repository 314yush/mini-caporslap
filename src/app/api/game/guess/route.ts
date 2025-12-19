import { NextRequest, NextResponse } from 'next/server';
import { getTokenPool } from '@/lib/data/token-pool';
import { selectNextTokenSeeded } from '@/lib/game-core/seeded-selection';
import { getTimerDuration } from '@/lib/game-core/timer';
import { checkRateLimit, GameGuess } from '@/lib/game-core/validator';
import { Guess, Token } from '@/lib/game-core/types';
import { getRedis } from '@/lib/redis';
import { selectNextToken } from '@/lib/game-core/sequencing';
import { getTierName } from '@/lib/game-core/difficulty';

interface GuessRouteGameState {
  runId: string;
  seed: string;
  userId: string;
  startedAt: number;
  guesses: GameGuess[];
  currentStreak: number;
  hasUsedReprieve: boolean;
  reprieveUsedAtRound?: number;
  currentTokenId: string;
  nextTokenId: string;
  roundNumber: number;
  tokenPoolIds: string[];
  lastGuessTimestamp?: number;
  difficultyTier?: string;  // Track current difficulty tier
}

/**
 * POST /api/game/guess
 * Submit a guess and get the result
 * Server validates timing and tracks game state
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      runId, 
      userId, 
      guess, // 'cap' | 'slap'
      currentTokenId,
      nextTokenId,
    } = body;

    if (!runId || !userId || !guess || !currentTokenId || !nextTokenId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (guess !== 'cap' && guess !== 'slap') {
      return NextResponse.json(
        { success: false, error: 'Invalid guess value' },
        { status: 400 }
      );
    }

    const redis = getRedis();
    const now = Date.now();
    
    // Get token pool for validation and next token selection
    const tokens = await getTokenPool();
    const tokenMap = new Map<string, Token>();
    tokens.forEach(t => tokenMap.set(t.id, t));
    
    const currentToken = tokenMap.get(currentTokenId);
    const nextToken = tokenMap.get(nextTokenId);
    
    if (!currentToken || !nextToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid token IDs' },
        { status: 400 }
      );
    }

    // Calculate if guess is correct
    const isCorrect = guess === 'cap'
      ? nextToken.marketCap >= currentToken.marketCap
      : nextToken.marketCap < currentToken.marketCap;

    let newStreak = 0;
    let roundNumber = 0;
    let seed = '';
    let usedTokenIds: string[] = [currentTokenId, nextTokenId];

    // If Redis is available, validate and update server state
    if (redis) {
      const stateData = await redis.get(`game:${runId}:state`);
      
      if (!stateData) {
        return NextResponse.json(
          { success: false, error: 'Game session not found or expired' },
          { status: 404 }
        );
      }
      
      // Handle both string (needs parsing) and object (already parsed) cases
      const state: GuessRouteGameState = typeof stateData === 'string' 
        ? JSON.parse(stateData) 
        : stateData as GuessRouteGameState;
      
      // Verify user owns this game
      if (state.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      // Verify token IDs match expected state
      if (state.currentTokenId !== currentTokenId || state.nextTokenId !== nextTokenId) {
        return NextResponse.json(
          { success: false, error: 'Token mismatch - possible tampering detected' },
          { status: 400 }
        );
      }
      
      // Rate limiting
      if (!checkRateLimit(state.lastGuessTimestamp, now)) {
        return NextResponse.json(
          { success: false, error: 'Too many requests' },
          { status: 429 }
        );
      }
      
      // Record the guess
      const guessRecord: GameGuess = {
        roundNumber: state.roundNumber,
        currentTokenId,
        nextTokenId,
        guess: guess as Guess,
        timestamp: now,
      };
      
      state.guesses.push(guessRecord);
      state.lastGuessTimestamp = now;
      seed = state.seed;
      roundNumber = state.roundNumber;
      
      // Collect used token IDs from all guesses
      usedTokenIds = state.guesses.flatMap(g => [g.currentTokenId, g.nextTokenId]);
      
      if (isCorrect) {
        // Increment streak and prepare next round
        state.currentStreak += 1;
        state.roundNumber += 1;
        newStreak = state.currentStreak;
        
        // Update state for next round
        state.currentTokenId = nextTokenId;
        
        // Update difficulty tier
        state.difficultyTier = getTierName(newStreak);
        
        // Pre-select next token server-side with difficulty awareness
        // Use difficulty-aware selection for better gameplay
        const nextNextToken = selectNextToken(tokens, nextToken, usedTokenIds, newStreak);
        if (nextNextToken) {
          state.nextTokenId = nextNextToken.id;
        } else {
          // Fallback to seeded selection if difficulty selection fails
          const seededToken = selectNextTokenSeeded(tokens, state.seed, state.roundNumber, usedTokenIds);
          if (seededToken) {
            state.nextTokenId = seededToken.id;
          }
        }
        
        // Save updated state
        await redis.set(`game:${runId}:state`, JSON.stringify(state), { ex: 3600 });
      } else {
        // Game over - save final state
        newStreak = state.currentStreak;
        await redis.set(`game:${runId}:state`, JSON.stringify(state), { ex: 3600 });
      }
    } else {
      // No Redis - basic response without server validation
      newStreak = isCorrect ? 1 : 0; // Can't track across requests without Redis
    }

    // Prepare response
    if (isCorrect) {
      // Select next token with difficulty awareness
      let nextNextToken: Token | null = selectNextToken(tokens, nextToken, usedTokenIds, newStreak);
      
      // Fallback to seeded selection if difficulty selection returns null
      if (!nextNextToken) {
        nextNextToken = selectNextTokenSeeded(
          tokens, 
          seed || `fallback_${runId}`, 
          roundNumber + 1, 
          usedTokenIds
        );
      }
      
      // Final fallback - just get a random token if all else fails
      if (!nextNextToken && tokens.length > 0) {
        nextNextToken = tokens[Math.floor(Math.random() * tokens.length)];
      }
      
      const newTimerDuration = getTimerDuration(newStreak);
      const difficulty = getTierName(newStreak);
      
      return NextResponse.json({
        success: true,
        correct: true,
        newStreak,
        currentToken: nextToken, // The guessed token becomes current
        nextToken: nextNextToken,
        revealedMarketCap: nextToken.marketCap,
        timerDuration: newTimerDuration,
        difficulty,
      });
    } else {
      // Game over
      return NextResponse.json({
        success: true,
        correct: false,
        finalStreak: newStreak,
        currentToken,
        nextToken,
        revealedMarketCap: nextToken.marketCap,
        correctAnswer: nextToken.marketCap >= currentToken.marketCap ? 'cap' : 'slap',
        difficulty: getTierName(newStreak),
      });
    }
  } catch (error) {
    console.error('Error processing guess:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process guess' },
      { status: 500 }
    );
  }
}

