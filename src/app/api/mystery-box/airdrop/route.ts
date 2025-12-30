import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { isBoxClaimed, markBoxAsClaimed } from '@/lib/mystery-box/storage';
import { getAirdropTreasuryAddress } from '@/lib/mystery-box/airdrop';
import { getNetworkConfig } from '@/lib/network-config';

// Create public client based on network configuration
function getPublicClient() {
  const networkConfig = getNetworkConfig();
  const chain = networkConfig.network === 'testnet' ? baseSepolia : base;
  
  return createPublicClient({
    chain,
    transport: http(networkConfig.rpcUrl),
  });
}

/**
 * POST /api/mystery-box/airdrop
 * Verifies that airdrop transaction was executed
 * Checks that tokens were sent from treasury to user
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
    const { boxId, txHash, userAddress, tokenAddresses } = body;

    if (!boxId || !txHash || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if box was already claimed
    const alreadyClaimed = await isBoxClaimed(boxId);
    if (alreadyClaimed) {
      return NextResponse.json(
        { success: false, error: 'Mystery box already claimed' },
        { status: 400 }
      );
    }

    const treasuryAddress = getAirdropTreasuryAddress();
    if (!treasuryAddress) {
      return NextResponse.json(
        { success: false, error: 'Treasury address not configured' },
        { status: 500 }
      );
    }

    // Wait for transaction receipt
    const publicClient = getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      timeout: 60_000, // 60 second timeout
    });

    if (receipt.status !== 'success') {
      return NextResponse.json(
        { success: false, error: 'Transaction failed' },
        { status: 400 }
      );
    }

    // Verify transfers from treasury to user
    const tokenAddressesSet = new Set(
      (tokenAddresses || []).map((addr: string) => addr.toLowerCase())
    );

    let verifiedTransfers = 0;
    for (const log of receipt.logs) {
      // Check if this is a Transfer event from our tokens
      if (tokenAddressesSet.has(log.address.toLowerCase())) {
        try {
          // Decode Transfer event
          // Transfer(from, to, value) - topics[1]=from, topics[2]=to, data=value
          const from = log.topics[1];
          const to = log.topics[2];
          
          if (!from || !to) continue;

          // Extract addresses from topics
          const fromAddress = '0x' + from.slice(26);
          const toAddress = '0x' + to.slice(26);

          // Check if transfer is from treasury to user
          if (
            fromAddress.toLowerCase() === treasuryAddress.toLowerCase() &&
            toAddress.toLowerCase() === userAddress.toLowerCase()
          ) {
            verifiedTransfers++;
          }
        } catch (e) {
          console.error('Error parsing transfer log:', e);
          continue;
        }
      }
    }

    if (verifiedTransfers === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid transfers from treasury to user found',
        },
        { status: 400 }
      );
    }

    // Mark box as claimed
    await markBoxAsClaimed(boxId, userAddress);

    return NextResponse.json({
      success: true,
      verified: true,
      transfersVerified: verifiedTransfers,
      txHash,
      message: 'Airdrop verified successfully',
    });
  } catch (error) {
    console.error('[MysteryBox] Error verifying airdrop:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify airdrop' },
      { status: 500 }
    );
  }
}


