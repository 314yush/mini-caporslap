/**
 * Privy Configuration for CapOrSlap
 * Supports wallet connect, email, and social login
 */

import type { PrivyClientConfig } from '@privy-io/react-auth';

export const privyConfig: PrivyClientConfig = {
  // Appearance
  appearance: {
    theme: 'dark',
    accentColor: '#f59e0b', // Amber to match game theme
    logo: '/images/branding/logo-wordmark.png',
    showWalletLoginFirst: true,
  },
  
  // Login methods - wallet first, then social options
  loginMethods: ['wallet', 'email', 'google', 'twitter', 'farcaster'],
  
  // Embedded wallet config (for users without existing wallet)
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
  },
  
  // Supported chains
  supportedChains: [
    {
      id: 1,
      name: 'Ethereum',
      network: 'mainnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['https://eth.llamarpc.com'] },
        public: { http: ['https://eth.llamarpc.com'] },
      },
      blockExplorers: {
        default: { name: 'Etherscan', url: 'https://etherscan.io' },
      },
    },
    {
      id: 8453,
      name: 'Base',
      network: 'base',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['https://mainnet.base.org'] },
        public: { http: ['https://mainnet.base.org'] },
      },
      blockExplorers: {
        default: { name: 'Basescan', url: 'https://basescan.org' },
      },
    },
  ],
  
  // Default chain
  defaultChain: {
    id: 8453,
    name: 'Base',
    network: 'base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://mainnet.base.org'] },
      public: { http: ['https://mainnet.base.org'] },
    },
    blockExplorers: {
      default: { name: 'Basescan', url: 'https://basescan.org' },
    },
  },
};

// Get Privy App ID from environment
export function getPrivyAppId(): string {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) {
    console.warn('[Privy] NEXT_PUBLIC_PRIVY_APP_ID not set - auth will be disabled');
    return '';
  }
  return appId;
}
