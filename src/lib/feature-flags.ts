import { FeatureFlags } from './game-core/types';

/**
 * Feature flags system
 * Reads from environment variables
 */

/**
 * Gets current feature flags from environment
 * @returns FeatureFlags object
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    reprieve: process.env.FEATURE_REPRIEVE === 'true',
    walletConnect: process.env.FEATURE_WALLET_CONNECT === 'true',
    mysteryBox: process.env.FEATURE_MYSTERY_BOX === 'true',
  };
}

/**
 * Checks if a specific feature is enabled
 * @param feature - Feature key
 * @returns Whether feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

/**
 * Client-safe feature flags (only NEXT_PUBLIC_ vars)
 * Use this in client components
 */
export function getClientFeatureFlags(): FeatureFlags {
  // In client components, we need to use NEXT_PUBLIC_ prefix
  return {
    reprieve: process.env.NEXT_PUBLIC_FEATURE_REPRIEVE === 'true',
    walletConnect: process.env.NEXT_PUBLIC_FEATURE_WALLET_CONNECT === 'true',
    mysteryBox: process.env.NEXT_PUBLIC_FEATURE_MYSTERY_BOX === 'true',
  };
}








