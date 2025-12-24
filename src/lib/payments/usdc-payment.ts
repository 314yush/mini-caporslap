/**
 * USDC Payment on Base for Reprieve
 * Simple $1 USDC transfer to treasury wallet
 */

import { parseUnits, encodeFunctionData } from 'viem';

// USDC on Base - 6 decimals
export const USDC_ADDRESS_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
export const USDC_DECIMALS = 6;

// Reprieve price in USDC
export const REPRIEVE_PRICE_USDC = 1; // $1

// Treasury wallet (set in env)
export function getTreasuryAddress(): string {
  const treasury = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
  if (!treasury) {
    throw new Error('NEXT_PUBLIC_TREASURY_ADDRESS not set');
  }
  return treasury;
}

// ERC20 Transfer ABI (minimal)
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
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * Get the amount in USDC units (6 decimals)
 */
export function getReprievePriceUnits(): bigint {
  return parseUnits(REPRIEVE_PRICE_USDC.toString(), USDC_DECIMALS);
}

/**
 * Encode the transfer call data
 */
export function encodeTransferData(to: string, amount: bigint): `0x${string}` {
  return encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: 'transfer',
    args: [to as `0x${string}`, amount],
  });
}

/**
 * Build the transaction request for USDC transfer
 */
export function buildReprieveTransaction(): {
  to: `0x${string}`;
  data: `0x${string}`;
  chainId: number;
} {
  const treasury = getTreasuryAddress();
  const amount = getReprievePriceUnits();
  
  return {
    to: USDC_ADDRESS_BASE,
    data: encodeTransferData(treasury, amount),
    chainId: 8453, // Base mainnet
  };
}

export { ERC20_TRANSFER_ABI };








