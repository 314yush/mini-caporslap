/**
 * Sponsor Token Payment
 * Handles payments in sponsor tokens for reprieve
 */

import { parseUnits } from 'viem';

export interface SponsorPaymentRequest {
  userId: string;
  runId: string;
  sponsorTokenAddress: string;
  sponsorTokenSymbol: string;
  usdAmount: number; // Amount in USD
  reprieveCount: number; // For exponential pricing
}

/**
 * Calculates the amount of sponsor token needed for a given USD amount
 * Uses CoinGecko or DexScreener to get current token price
 */
export async function calculateSponsorTokenAmount(
  tokenAddress: string,
  usdAmount: number
): Promise<{
  tokenAmount: bigint;
  decimals: number;
  pricePerToken: number;
} | null> {
  try {
    // Try to get token price from CoinGecko or DexScreener
    // For now, we'll use a placeholder - in production, integrate with price API
    // This is a simplified version - you'd want to cache prices and handle errors
    
    // Default to 18 decimals (most ERC20 tokens)
    const decimals = 18;
    
    // Placeholder: assume $1 per token (in production, fetch real price)
    // TODO: Integrate with CoinGecko API or DexScreener API
    const pricePerToken = 1.0; // USD per token
    
    const tokenAmount = parseUnits((usdAmount / pricePerToken).toFixed(decimals), decimals);
    
    return {
      tokenAmount,
      decimals,
      pricePerToken,
    };
  } catch (error) {
    console.error('Error calculating sponsor token amount:', error);
    return null;
  }
}

/**
 * Builds transaction data for sponsor token payment
 */
export async function buildSponsorTokenTransaction(
  request: SponsorPaymentRequest
): Promise<{
  to: `0x${string}`;
  data: `0x${string}`;
  chainId: number;
  tokenAmount: bigint;
} | null> {
  try {
    const treasury = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
    if (!treasury) {
      throw new Error('NEXT_PUBLIC_TREASURY_ADDRESS not set');
    }
    
    const calculation = await calculateSponsorTokenAmount(
      request.sponsorTokenAddress,
      request.usdAmount
    );
    
    if (!calculation) {
      return null;
    }
    
    // ERC20 Transfer ABI
    const { encodeFunctionData } = await import('viem');
    const data = encodeFunctionData({
      abi: [
        {
          name: 'transfer',
          type: 'function',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ],
      functionName: 'transfer',
      args: [treasury as `0x${string}`, calculation.tokenAmount],
    });
    
    return {
      to: request.sponsorTokenAddress as `0x${string}`,
      data,
      chainId: 8453, // Base mainnet
      tokenAmount: calculation.tokenAmount,
    };
  } catch (error) {
    console.error('Error building sponsor token transaction:', error);
    return null;
  }
}


