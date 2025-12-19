'use client';

type ComposeCastParams = {
  text: string;
  embeds?: string[];
};

type MiniAppSdk = {
  actions?: {
    ready?: () => Promise<void>;
    composeCast?: (args: { text: string; embeds?: string[] }) => Promise<void>;
    openUrl?: (url: string) => Promise<void>;
  };
  context?: unknown | (() => Promise<unknown>);
};

let sdkPromise: Promise<MiniAppSdk> | null = null;

async function getSdk(): Promise<MiniAppSdk> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = import('@farcaster/miniapp-sdk')
    .then(mod => (mod as { sdk: MiniAppSdk }).sdk)
    .catch(err => {
      sdkPromise = null;
      throw err;
    });
  return sdkPromise;
}

/**
 * Calls Farcaster Mini App `actions.ready()` when available.
 * Safe no-op in web.
 */
export async function miniAppReady(): Promise<boolean> {
  try {
    const sdk = await getSdk();
    await sdk?.actions?.ready?.();
    return true;
  } catch {
    return false;
  }
}

/**
 * Compose a cast via the Mini App SDK.
 * Returns false if the SDK/action isn't available.
 */
export async function miniAppComposeCast(params: ComposeCastParams): Promise<boolean> {
  try {
    const sdk = await getSdk();

    const action = sdk?.actions?.composeCast;
    if (typeof action !== 'function') return false;

    await action({
      text: params.text,
      embeds: params.embeds ?? [],
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Open a URL via the Mini App SDK if supported.
 */
export async function miniAppOpenUrl(url: string): Promise<boolean> {
  try {
    const sdk = await getSdk();

    const action = sdk?.actions?.openUrl;
    if (typeof action !== 'function') return false;

    await action(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Best-effort fetch of the Mini App context.
 */
export async function miniAppGetContext<T = unknown>(): Promise<T | null> {
  try {
    const sdk = await getSdk();
    const maybe = sdk?.context;
    const ctx = typeof maybe === 'function' ? await maybe() : await Promise.resolve(maybe);
    return (ctx as T) ?? null;
  } catch {
    return null;
  }
}

