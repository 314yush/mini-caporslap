import { NextRequest, NextResponse } from 'next/server';
import { getTokenPool } from '@/lib/data/token-pool';
import { selectNextToken } from '@/lib/game-core/sequencing';
import { Token } from '@/lib/game-core/types';

/**
 * POST /api/tokens/next
 * Gets the next token for comparison
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      currentTokenId, 
      recentTokenIds = [],
    } = body;

    // Get token pool
    const tokens = await getTokenPool();
    
    if (tokens.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Not enough tokens available' },
        { status: 500 }
      );
    }

    // Find current token
    const currentToken = tokens.find((t: Token) => t.id === currentTokenId) || null;

    // Select next token (ensuring it's different from current)
    const nextToken = selectNextToken(tokens, currentToken, recentTokenIds);

    return NextResponse.json({
      success: true,
      nextToken,
    });
  } catch (error) {
    console.error('Error getting next token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get next token' },
      { status: 500 }
    );
  }
}

