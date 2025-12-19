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
    console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY not set, analytics disabled');
    return;
  }

  posthog.init(posthogKey, {
    api_host: posthogHost,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PostHog] Initialized');
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

  isInitialized = true;
}

/**
 * Track a custom event
 * Compatible with Vercel Analytics API
 */
export function trackPostHog(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!isInitialized) {
    console.warn('[PostHog] Not initialized, call initPostHog() first');
    return;
  }

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
  return isInitialized && typeof window !== 'undefined';
}
