/**
 * Network Configuration for Base Mainnet and Base Sepolia Testnet
 * Determines which network to use based on environment variable
 */

export type Network = 'mainnet' | 'testnet';

export interface NetworkConfig {
  network: Network;
  chainId: number;
  rpcUrl: string;
  blockExplorer: string;
  chainName: string;
}

/**
 * Gets the current network from environment variable
 * Defaults to 'mainnet' if not set
 */
export function getCurrentNetwork(): Network {
  const network = process.env.NEXT_PUBLIC_NETWORK;
  if (network === 'testnet') {
    return 'testnet';
  }
  return 'mainnet'; // Default to mainnet
}

/**
 * Gets network configuration based on current environment
 */
export function getNetworkConfig(): NetworkConfig {
  const network = getCurrentNetwork();
  
  if (network === 'testnet') {
    return {
      network: 'testnet',
      chainId: 84532,
      rpcUrl: 'https://sepolia.base.org',
      blockExplorer: 'https://sepolia-explorer.base.org',
      chainName: 'Base Sepolia',
    };
  }
  
  // Mainnet (default)
  return {
    network: 'mainnet',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    chainName: 'Base',
  };
}

/**
 * Checks if currently using testnet
 */
export function isTestnet(): boolean {
  return getCurrentNetwork() === 'testnet';
}

/**
 * Checks if currently using mainnet
 */
export function isMainnet(): boolean {
  return getCurrentNetwork() === 'mainnet';
}

