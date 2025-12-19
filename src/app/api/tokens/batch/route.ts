import { NextRequest, NextResponse } from 'next/server';
import { getTokenPool } from '@/lib/data/token-pool';
import { selectNextToken } from '@/lib/game-core/sequencing';
import { Token } from '@/lib/game-core/types';

/**
 * POST /api/tokens/batch
 * Preloads a batch of tokens for smooth gameplay
 * Returns multiple tokens in sequence, ensuring each is different from the previous
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      currentTokenId, 
      recentTokenIds = [],
      count = 5, // Default to 5 tokens
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

    // Generate a sequence of tokens
    const preloadedTokens: Token[] = [];
    let lastToken = currentToken;
    const usedIds = new Set([...recentTokenIds, currentTokenId].filter(Boolean));

    for (let i = 0; i < count; i++) {
      // Select next token based on the last one in sequence
      const nextToken = selectNextToken(
        tokens, 
        lastToken, 
        Array.from(usedIds)
      );
      
      if (!nextToken) {
        // If we can't find more tokens, break early
        break;
      }

      preloadedTokens.push(nextToken);
      usedIds.add(nextToken.id);
      lastToken = nextToken;
    }

    return NextResponse.json({
      success: true,
      tokens: preloadedTokens,
      count: preloadedTokens.length,
    });
  } catch (error) {
    console.error('Error getting token batch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get token batch' },
      { status: 500 }
    );
  }
}
