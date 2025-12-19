import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

// USDC on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_DECIMALS = 6;
const REPRIEVE_PRICE = 1_000_000; // $1 in USDC (6 decimals)

// ERC20 Transfer event signature
const ERC20_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

// Create public client for Base
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

/**
 * POST /api/reprieve/verify
 * Verifies that a USDC transaction was sent to the treasury
 * This prevents users from faking transactions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { txHash, userAddress, runId } = body;

    if (!txHash || !userAddress || !runId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
    if (!treasuryAddress) {
      // If no treasury set, allow in dev mode
      console.warn('[Reprieve] No treasury address set - allowing reprieve in dev mode');
      return NextResponse.json({ success: true, verified: true, devMode: true });
    }

    // Wait for transaction receipt
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

    // Parse logs to find the Transfer event
    const transferLogs = receipt.logs.filter(
      (log) => log.address.toLowerCase() === USDC_ADDRESS.toLowerCase()
    );

    // Check if any transfer was to our treasury with correct amount
    let validTransfer = false;
    for (const log of transferLogs) {
      try {
        // Decode the Transfer event
        // Transfer(from, to, value) - topics[1]=from, topics[2]=to, data=value
        const to = log.topics[2];
        if (!to) continue;

        // Extract address from topic (remove padding)
        const toAddress = '0x' + to.slice(26);
        
        // Check if it's to our treasury
        if (toAddress.toLowerCase() === treasuryAddress.toLowerCase()) {
          // Check amount (data contains the value)
          const value = BigInt(log.data);
          if (value >= BigInt(REPRIEVE_PRICE)) {
            validTransfer = true;
            break;
          }
        }
      } catch (e) {
        console.error('Error parsing log:', e);
        continue;
      }
    }

    if (!validTransfer) {
      return NextResponse.json(
        { success: false, error: 'No valid USDC transfer to treasury found' },
        { status: 400 }
      );
    }

    // Transaction verified! 
    // TODO: Mark this transaction as used in Redis to prevent replay attacks
    // await redis.set(`reprieve:tx:${txHash}`, runId, { ex: 86400 * 7 }); // 7 days

    return NextResponse.json({
      success: true,
      verified: true,
      txHash,
      message: 'Payment verified successfully',
    });

  } catch (error) {
    console.error('Error verifying reprieve payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify transaction' },
      { status: 500 }
    );
  }
}


