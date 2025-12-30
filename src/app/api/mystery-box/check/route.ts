import { NextRequest, NextResponse } from 'next/server';
import { checkEligibility } from '@/lib/mystery-box';

/**
 * POST /api/mystery-box/check
 * Checks if user is eligible for a mystery box
 * Does NOT consume a box - just checks eligibility
 */
export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (process.env.FEATURE_MYSTERY_BOX !== 'true') {
      return NextResponse.json({
        success: true,
        eligible: false,
        reason: 'Mystery boxes are currently disabled',
      });
    }

    // Handle empty or malformed request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      // Handle empty body or invalid JSON
      if (parseError instanceof SyntaxError) {
        return NextResponse.json(
          { success: false, error: 'Invalid or empty request body' },
          { status: 400 }
        );
      }
      throw parseError;
    }

    const { userId, streak } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    if (typeof streak !== 'number') {
      return NextResponse.json(
        { success: false, error: 'streak is required' },
        { status: 400 }
      );
    }

    const result = await checkEligibility(userId, streak);

    return NextResponse.json({
      success: true,
      eligible: result.eligible,
      reason: result.reason,
    });
  } catch (error) {
    console.error('[MysteryBox] Error checking eligibility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}


