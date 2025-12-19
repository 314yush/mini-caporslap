import { NextRequest, NextResponse } from 'next/server';
import { getTokenPool } from '@/lib/data/token-pool';
import { selectNextToken } from '@/lib/game-core/sequencing';
import { getTierName } from '@/lib/game-core/difficulty';
import { Token } from '@/lib/game-core/types';

/**
 * POST /api/tokens/next
 * Gets the next token for comparison with difficulty-aware selection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      currentTokenId, 
      recentTokenIds = [],
      streak = 0,  // Current streak for difficulty calculation
    } = body;

    // Get token pool
    const tokens = await getTokenPool();
    
    if (tokens.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Not enough tokens available' },
        { status: 500 }
      );
    }

    // Find current token for difficulty-aware selection
    const currentToken = tokens.find((t: Token) => t.id === currentTokenId) || null;

    // Select next token with difficulty awareness
    const nextToken = selectNextToken(tokens, currentToken, recentTokenIds, streak);

    return NextResponse.json({
      success: true,
      nextToken,
      difficulty: getTierName(streak),
    });
  } catch (error) {
    console.error('Error getting next token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get next token' },
      { status: 500 }
    );
  }
}

