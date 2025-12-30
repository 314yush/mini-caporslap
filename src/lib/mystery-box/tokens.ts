/**
 * Token configuration for Mystery Box rewards on Base
 * Supports both Base Mainnet and Base Sepolia Testnet
 */

import { getCurrentNetwork } from '@/lib/network-config';

export interface MysteryBoxToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  coingeckoId?: string; // For price fetching
}

// Token addresses on Base Mainnet
const MAINNET_TOKENS: MysteryBoxToken[] = [
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    // Upload your icon to: public/images/tokens/USDC.png
    // Then use: logoUrl: '/images/tokens/USDC.png',
    logoUrl: '/images/tokens/USDC.png',
    coingeckoId: 'usd-coin',
  },
  {
    address: '0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59', // JESSE on Base
    symbol: 'JESSE',
    name: 'Jesse',
    decimals: 18,
    logoUrl: 'https://dd.dexscreener.com/ds-data/tokens/base/0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59.png',
    coingeckoId: 'jesse',
  },
  {
    address: '0x696f9436b67233384889472cd7cd58a6fb5df4f1', // AVNT on Base
    symbol: 'AVNT',
    name: 'Avantis',
    decimals: 18,
    logoUrl: 'https://dd.dexscreener.com/ds-data/tokens/base/0x696f9436b67233384889472cd7cd58a6fb5df4f1.png',
    coingeckoId: 'avantis',
  },
  {
    address: '0x940181a94a35a4569e4529a3cdfb74e38fd98631', // AERO on Base
    symbol: 'AERO',
    name: 'Aerodrome',
    decimals: 18,
    logoUrl: 'https://dd.dexscreener.com/ds-data/tokens/base/0x940181a94a35a4569e4529a3cdfb74e38fd98631.png',
    coingeckoId: 'aerodrome-finance',
  },
  {
    address: '0x22af33fe49fd1fa80c7149773dde5890d3c76f3b', // BANKR on Base
    symbol: 'BANKR',
    name: 'Bankroll',
    decimals: 18,
    logoUrl: 'https://dd.dexscreener.com/ds-data/tokens/base/0x22af33fe49fd1fa80c7149773dde5890d3c76f3b.png',
    coingeckoId: 'bankercoin-2', // May need to be updated
  },
  {
    address: '0x1111111111166b7fe7bd91427724b487980afc69', // ZORA on Base
    symbol: 'ZORA',
    name: 'Zora',
    decimals: 18,
    logoUrl: 'https://dd.dexscreener.com/ds-data/tokens/base/0x1111111111166b7fe7bd91427724b487980afc69.png',
    coingeckoId: 'zora-network', // May need to be updated
  },
];

// Token addresses on Base Sepolia Testnet
// For testing, only USDC is configured - update the address with your actual testnet USDC address
const TESTNET_TOKENS: MysteryBoxToken[] = [
  {
    // Base Sepolia USDC - verify this address matches your testnet USDC
    // Common testnet USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
    // If this doesn't match, update with your actual USDC address on Base Sepolia
    address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    symbol: 'USDC',
    name: 'USD Coin (Test)',
    decimals: 6,
    // For testnet, use placeholder or fallback to generated avatar
    logoUrl: 'https://dd.dexscreener.com/ds-data/tokens/base/0x036CbD53842c5426634e7929541eC2318f3dCF7e.png',
    coingeckoId: 'usd-coin',
  },
];

/**
 * Get tokens based on current network
 */
export function getMysteryBoxTokens(): MysteryBoxToken[] {
  const network = getCurrentNetwork();
  return network === 'testnet' ? TESTNET_TOKENS : MAINNET_TOKENS;
}

// Export for backward compatibility - uses current network
export const MYSTERY_BOX_TOKENS = getMysteryBoxTokens();

/**
 * Get token by symbol (uses current network)
 */
export function getTokenBySymbol(symbol: string): MysteryBoxToken | undefined {
  return getMysteryBoxTokens().find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
}

/**
 * Get token by address (uses current network)
 */
export function getTokenByAddress(address: string): MysteryBoxToken | undefined {
  return getMysteryBoxTokens().find(t => t.address.toLowerCase() === address.toLowerCase());
}

/**
 * Get all available tokens for mystery boxes (uses current network)
 */
export function getAvailableTokens(): MysteryBoxToken[] {
  return getMysteryBoxTokens().filter(t => t.address !== '0x0000000000000000000000000000000000000000');
}


