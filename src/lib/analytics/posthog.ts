/**
 * PostHog Analytics integration
 * Free tier: 1M events/month
 * Alternative to Vercel Analytics for custom events
 */

import posthog from 'posthog-js';

let isInitialized = false;

/**
 * Initialize PostHog
 * Call this once in your app (e.g., in layout.tsx or _app.tsx)
 */
export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!posthogKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY not set, analytics disabled');
    }
    return;
  }

  try {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      loaded: (ph) => {
        isInitialized = true;
        // Expose PostHog on window for debugging (optional)
        if (typeof window !== 'undefined') {
          (window as any).posthog = ph;
        }
      },
      // Privacy settings
      capture_pageview: false, // We'll track pageviews manually
      capture_pageleave: true,
      // Session replay (optional, uses quota)
      session_recording: {
        maskAllInputs: true, // Privacy: mask all inputs
        maskTextSelector: '.text-mask', // Custom class for masking
      },
    });

    // Expose the posthog instance on window
    if (typeof window !== 'undefined' && posthog) {
      (window as any).posthog = posthog;
    }

    // Set flag immediately (PostHog initializes asynchronously)
    isInitialized = true;
  } catch (error) {
    console.error('[PostHog] Initialization failed:', error);
    isInitialized = false;
  }
}

/**
 * Track a custom event
 * Compatible with Vercel Analytics API
 */
export function trackPostHog(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!isInitialized) return;

  posthog.capture(event, properties);
}

/**
 * Identify a user
 */
export function identifyPostHog(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!isInitialized) return;

  posthog.identify(userId, properties);
}

/**
 * Track page view
 */
export function trackPageViewPostHog(path: string) {
  if (typeof window === 'undefined') return;
  if (!isInitialized) return;

  posthog.capture('$pageview', {
    $current_url: window.location.href,
    path,
  });
}

/**
 * Reset user (on logout)
 */
export function resetPostHog() {
  if (typeof window === 'undefined') return;
  if (!isInitialized) return;

  posthog.reset();
}

/**
 * Check if PostHog is available
 */
export function isPostHogReady(): boolean {
  if (typeof window === 'undefined') return false;
  // Check both our flag and PostHog's actual presence
  return isInitialized && (!!posthog || !!(window as any).posthog);
}
