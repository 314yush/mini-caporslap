/**
 * Airdrop Transaction Builder
 * Creates transactions to send tokens from treasury to user
 */

import { parseUnits, encodeFunctionData, Address } from 'viem';
import { getTreasuryAddress } from '@/lib/payments/usdc-payment';
import { MysteryBoxReward } from './generator';

// ERC20 Transfer ABI
const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * Build a single ERC20 transfer transaction
 */
function buildSingleTransfer(
  tokenAddress: string,
  recipient: string,
  amount: bigint
): { to: Address; data: `0x${string}` } {
  return {
    to: tokenAddress as Address,
    data: encodeFunctionData({
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [recipient as Address, amount],
    }),
  };
}

/**
 * Build airdrop transaction data for multiple tokens
 * Returns array of transactions that need to be executed
 */
export function buildAirdropTransactions(
  rewards: MysteryBoxReward[],
  recipient: string
): Array<{ to: Address; data: `0x${string}`; value?: bigint }> {
  const transactions: Array<{ to: Address; data: `0x${string}`; value?: bigint }> = [];

  for (const reward of rewards) {
    // Parse amount string to bigint
    const amount = BigInt(reward.amount);
    
    if (amount === BigInt(0)) {
      console.warn(`[Airdrop] Skipping ${reward.symbol} - amount is 0`);
      continue;
    }

    const tx = buildSingleTransfer(reward.address, recipient, amount);
    transactions.push(tx);
  }

  return transactions;
}

/**
 * Calculate token amounts from USD values
 * This should be called with current token prices
 */
export function calculateTokenAmountsFromUSD(
  rewards: Omit<MysteryBoxReward, 'amount'>[],
  prices: Record<string, number> // symbol -> price in USD
): MysteryBoxReward[] {
  return rewards.map(reward => {
    const price = prices[reward.symbol.toUpperCase()];
    if (!price || price <= 0) {
      throw new Error(`Price not available for ${reward.symbol}`);
    }

    // Calculate amount: usdValue / price, then convert to token units
    const tokenAmount = reward.usdValue / price;
    const amount = parseUnits(tokenAmount.toFixed(reward.decimals), reward.decimals);

    return {
      ...reward,
      amount: amount.toString(),
    };
  });
}

/**
 * Get treasury address (must be able to send tokens)
 */
export function getAirdropTreasuryAddress(): string {
  return getTreasuryAddress();
}

export { ERC20_TRANSFER_ABI };



