'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { Environment } from '@/lib/game-core/types';
import { detectEnvironment, getEnvironmentConfig } from '@/lib/environment';

// Simple store for environment detection
let cachedEnvironment: Environment | null = null;
const listeners = new Set<() => void>();

function getEnvironmentSnapshot(): Environment {
  if (typeof window === 'undefined') return 'web';
  if (cachedEnvironment === null) {
    cachedEnvironment = detectEnvironment();
  }
  return cachedEnvironment;
}

function getServerSnapshot(): Environment {
  return 'web';
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Hook for accessing the current runtime environment
 * Detects if running as web app or Farcaster Mini-App
 */
export function useEnvironment() {
  const environment = useSyncExternalStore(
    subscribe,
    getEnvironmentSnapshot,
    getServerSnapshot
  );

  const config = useMemo(() => getEnvironmentConfig(), []);

  return {
    environment,
    isLoaded: true,
    isMiniApp: environment === 'miniapp',
    isWeb: environment === 'web',
    config,
  };
}
