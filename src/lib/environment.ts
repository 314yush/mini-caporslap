import { Environment } from './game-core/types';

/**
 * Environment detection for CapOrSlap
 * Determines if running as web app or Farcaster Mini-App
 */

/**
 * Detects the current runtime environment
 * @returns 'web' or 'miniapp'
 */
export function detectEnvironment(): Environment {
  if (typeof window === 'undefined') {
    // Server-side, assume web
    return 'web';
  }

  // Check for Farcaster Mini-App SDK
  // The SDK injects a global object when running in a Mini-App context
  if (
    typeof window !== 'undefined' &&
    // @ts-expect-error - Farcaster SDK global
    (window.farcaster || window.fc)
  ) {
    return 'miniapp';
  }

  // Check URL parameters (Mini-App embeds may include markers)
  const url = new URL(window.location.href);
  if (url.searchParams.has('fid') || url.searchParams.has('miniapp')) {
    return 'miniapp';
  }

  return 'web';
}

/**
 * Checks if running in Mini-App context
 * @returns Whether in Mini-App
 */
export function isMiniApp(): boolean {
  return detectEnvironment() === 'miniapp';
}

/**
 * Checks if running in web context
 * @returns Whether in web
 */
export function isWeb(): boolean {
  return detectEnvironment() === 'web';
}

/**
 * Gets environment-specific configuration
 * @returns Config object for current environment
 */
export function getEnvironmentConfig() {
  const env = detectEnvironment();
  
  return {
    environment: env,
    // Sharing behavior
    shareMethod: env === 'miniapp' ? 'cast' : 'clipboard',
    // Identity source
    identitySource: env === 'miniapp' ? 'farcaster' : 'local',
    // Leaderboard type
    defaultLeaderboard: env === 'miniapp' ? 'friends' : 'global',
    // Features
    features: {
      socialGraph: env === 'miniapp',
      castEmbed: env === 'miniapp',
      walletConnect: true, // Available in both
    },
  };
}

/**
 * Environment-aware logger
 * @param message - Message to log
 * @param data - Optional data
 */
export function envLog(message: string, data?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    const env = typeof window !== 'undefined' ? detectEnvironment() : 'server';
    console.log(`[${env}] ${message}`, data || '');
  }
}








