'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { detectEnvironment } from '@/lib/environment';

declare global {
  interface Window {
    __caporslapMiniAppState?: MiniAppState;
  }
}

type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

// Keep this intentionally loose so we don't couple to SDK types.
export type FarcasterMiniAppContext = {
  user?: {
    fid?: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  client?: {
    safeAreaInsets?: SafeAreaInsets;
  };
};

export type MiniAppState = {
  isMiniApp: boolean;
  isReady: boolean;
  context: FarcasterMiniAppContext | null;
  error: string | null;
};

const MiniAppContext = createContext<MiniAppState>({
  isMiniApp: false,
  isReady: true,
  context: null,
  error: null,
});

export function MiniAppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MiniAppState>({
    isMiniApp: false,
    isReady: false,
    context: null,
    error: null,
  });

  useEffect(() => {
    const isMiniApp = detectEnvironment() === 'miniapp';
    const debug =
      typeof window !== 'undefined' &&
      new URL(window.location.href).searchParams.has('debugMiniApp');

    // Web: no SDK, no blocking.
    if (!isMiniApp) {
      const nextState: MiniAppState = { isMiniApp: false, isReady: true, context: null, error: null };
      if (debug) {
        window.__caporslapMiniAppState = nextState;
        console.info('[MiniApp]', nextState);
      }
      setState(nextState);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const mod = await import('@farcaster/miniapp-sdk');
        const sdk = mod.sdk as {
          actions?: { ready?: () => Promise<void> };
          context?: unknown | (() => Promise<unknown>);
        };

        // Fetch context if available (some clients may not provide it).
        let context: unknown = null;
        try {
          const maybeContext = sdk.context;
          context =
            typeof maybeContext === 'function'
              ? await maybeContext()
              : await Promise.resolve(maybeContext);
        } catch {
          context = null;
        }

        // Signal ready to hide the Farcaster splash.
        try {
          await sdk.actions?.ready?.();
        } catch {
          // Ignore; we still want the app usable.
        }

        if (cancelled) return;

        const nextState: MiniAppState = {
          isMiniApp: true,
          isReady: true,
          context: (context as FarcasterMiniAppContext) ?? null,
          error: null,
        };
        if (debug) {
          window.__caporslapMiniAppState = nextState;
          console.info('[MiniApp]', nextState);
        }
        setState(nextState);
      } catch (e) {
        if (cancelled) return;
        const nextState: MiniAppState = {
          isMiniApp: true,
          isReady: true,
          context: null,
          error: e instanceof Error ? e.message : 'Failed to initialize Mini App SDK',
        };
        if (debug) {
          window.__caporslapMiniAppState = nextState;
          console.info('[MiniApp]', nextState);
        }
        setState(nextState);
      }
    }

    const loadingState: MiniAppState = { isMiniApp: true, isReady: false, context: null, error: null };
    if (debug) {
      window.__caporslapMiniAppState = loadingState;
      console.info('[MiniApp]', loadingState);
    }
    setState(loadingState);
    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return <MiniAppContext.Provider value={value}>{children}</MiniAppContext.Provider>;
}

export function useMiniApp(): MiniAppState {
  return useContext(MiniAppContext);
}






