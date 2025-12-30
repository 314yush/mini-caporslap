import { NextRequest, NextResponse } from 'next/server';
import { generateMysteryBox, MysteryBox } from '@/lib/mystery-box/generator';
import {
  canClaimMysteryBox,
  checkEligibility,
} from '@/lib/mystery-box';
import {
  decrementDailyPool,
  incrementUserDailyClaims,
  markBoxAsClaimed,
  getUserDailyClaims,
  getDailyPoolCount,
} from '@/lib/mystery-box/storage';
import {
  calculateTokenAmountsFromUSD,
} from '@/lib/mystery-box/airdrop';
import { fetchMysteryBoxTokenPrices } from '@/lib/mystery-box/prices';

/**
 * POST /api/mystery-box/claim
 * Claims a mystery box for the user
 * Generates the box, decrements daily pool, records claim
 * Returns box data and transaction data for signing
 */
export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (process.env.FEATURE_MYSTERY_BOX !== 'true') {
      return NextResponse.json({
        success: false,
        error: 'Mystery boxes are currently disabled',
      });
    }

    const body = await request.json();
    const { userId, streak, bypassEligibility } = body;

    if (!userId || typeof streak !== 'number') {
      return NextResponse.json(
        { success: false, error: 'userId and streak are required' },
        { status: 400 }
      );
    }

    // Skip eligibility checks if bypass is enabled (for testing)
    if (!bypassEligibility) {
      // Check eligibility with actual streak
      const eligibility = await checkEligibility(userId, streak);
      if (!eligibility.eligible) {
        return NextResponse.json({
          success: false,
          eligible: false,
          reason: eligibility.reason,
        });
      }

      // Final check before claiming
      const canClaim = await canClaimMysteryBox(userId);
      if (!canClaim.eligible) {
        return NextResponse.json({
          success: false,
          eligible: false,
          reason: canClaim.reason,
        });
      }
    } else {
      // In bypass mode, still check daily limits but skip other checks
      const dailyClaims = await getUserDailyClaims(userId);
      if (dailyClaims >= 2) {
        return NextResponse.json({
          success: false,
          eligible: false,
          reason: 'Daily claim limit reached (bypass mode still respects daily limits)',
        });
      }

      const poolCount = await getDailyPoolCount();
      if (poolCount <= 0) {
        return NextResponse.json({
          success: false,
          eligible: false,
          reason: 'Daily pool exhausted',
        });
      }
    }

    // Generate mystery box
    let box: MysteryBox;
    try {
      box = generateMysteryBox();
    } catch (error) {
      console.error('[MysteryBox] Error generating box:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to generate mystery box' },
        { status: 500 }
      );
    }

    // Fetch token prices from DexScreener to calculate actual amounts
    try {
      const priceMap = await fetchMysteryBoxTokenPrices();

      // Calculate actual token amounts based on real prices
      const rewardsWithAmounts = calculateTokenAmountsFromUSD(
        box.rewards.map(r => ({
          address: r.address,
          symbol: r.symbol,
          name: r.name,
          usdValue: r.usdValue,
          decimals: r.decimals,
          logoUrl: r.logoUrl,
        })),
        priceMap
      );

      box.rewards = rewardsWithAmounts;
      console.log('[MysteryBox] Calculated token amounts with prices:', priceMap);
    } catch (error) {
      console.error('[MysteryBox] Error fetching prices or calculating amounts:', error);
      // Continue with placeholder amounts - will use fallback prices
      // This ensures the box can still be claimed even if price API fails
      const fallbackPrices: Record<string, number> = {
        USDC: 1.0,
        JESSE: 0.006,
        AVNT: 0.38,
        AERO: 0.45,
        BANKR: 0.00014,
        ZORA: 0.039,
      };
      
      const rewardsWithAmounts = calculateTokenAmountsFromUSD(
        box.rewards.map(r => ({
          address: r.address,
          symbol: r.symbol,
          name: r.name,
          usdValue: r.usdValue,
          decimals: r.decimals,
          logoUrl: r.logoUrl,
        })),
        fallbackPrices
      );
      
      box.rewards = rewardsWithAmounts;
      console.warn('[MysteryBox] Using fallback prices due to API error');
    }

    // Decrement daily pool
    const poolDecremented = await decrementDailyPool();
    if (!poolDecremented) {
      return NextResponse.json({
        success: false,
        error: 'Failed to claim - daily pool exhausted',
      });
    }

    // Increment user's daily claims
    await incrementUserDailyClaims(userId);

    // Mark box as claimed (prevent double claiming)
    await markBoxAsClaimed(box.boxId, userId);

    // Note: Transactions will be built on the frontend with the user's actual address
    // We return the box with rewards, and the frontend will build transactions when user claims
    // This is because we need the user's wallet address which is only available on the frontend

    return NextResponse.json({
      success: true,
      box,
      message: 'Mystery box claimed successfully',
    });
  } catch (error) {
    console.error('[MysteryBox] Error claiming mystery box:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to claim mystery box' },
      { status: 500 }
    );
  }
}

