/**
 * CapOrSlap Brand Assets
 * 
 * Centralized asset paths for branding, mini-app, and social images
 */

// Base URL for assets (will be replaced with production URL)
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://caporslap.com';

// Logo assets
export const logos = {
  wordmark: '/images/branding/logo-wordmark.png',
  icon: '/images/branding/logo-icon.png',
  monogram: '/images/branding/logo-monogram.png',
} as const;

// Character illustrations (token-faced characters in army poses)
export const characters = {
  // Base-focused tokens
  avnt: '/images/branding/characters/avnt-character.png',
  hyper: '/images/branding/characters/hyper-character.png',
  aero: '/images/branding/characters/aero-character.png',
  well: '/images/branding/characters/well-character.png',
  // EVM-focused tokens
  eth: '/images/branding/characters/eth-character.png',
  morpho: '/images/branding/characters/morpho-character.png',
  // Other major tokens
  sol: '/images/branding/characters/sol-character.png',
  btc: '/images/branding/characters/btc-character.png',
} as const;

// All character keys for iteration
export const characterTokens = [
  'avnt', 'hyper', 'aero', 'well',  // Base-focused
  'eth', 'morpho',                    // EVM-focused
  'sol', 'btc',                       // Major tokens
] as const;

// Mini-app assets (for Base app integration)
export const miniapp = {
  icon: '/images/miniapp/icon-512.png',
  splash: '/images/miniapp/splash-1200.png',
  hero: '/images/miniapp/hero-1200x630.png',
  screenshots: {
    landing: '/images/miniapp/screenshots/screenshot-1-landing.png',
    gameplay: '/images/miniapp/screenshots/screenshot-2-gameplay.png',
    leaderboard: '/images/miniapp/screenshots/screenshot-3-leaderboard.png',
    loss: '/images/miniapp/screenshots/screenshot-4-loss.png',
    streak: '/images/miniapp/screenshots/screenshot-5-streak.png',
  },
} as const;

// Social media assets
export const social = {
  twitterHeader: '/images/social/twitter-header.png',
  ogDefault: '/images/social/og-default.png',
} as const;

// Marketing assets
export const marketing = {
  poster: '/images/branding/poster.png',
} as const;

// Full URLs for external use (manifest, social sharing)
export const fullUrls = {
  icon: `${BASE_URL}${miniapp.icon}`,
  splash: `${BASE_URL}${miniapp.splash}`,
  hero: `${BASE_URL}${miniapp.hero}`,
  ogDefault: `${BASE_URL}${social.ogDefault}`,
  screenshots: Object.entries(miniapp.screenshots).reduce(
    (acc, [key, path]) => ({ ...acc, [key]: `${BASE_URL}${path}` }),
    {} as Record<string, string>
  ),
} as const;

// Asset dimensions (for reference)
export const dimensions = {
  icon: { width: 512, height: 512 },
  splash: { width: 1200, height: 1200 },
  hero: { width: 1200, height: 630 },
  screenshot: { width: 1200, height: 800 },
  favicon: { width: 32, height: 32 },
  appleTouchIcon: { width: 180, height: 180 },
  androidIcon: { width: 192, height: 192 },
  twitterHeader: { width: 1500, height: 500 },
  poster: { width: 3300, height: 5100 },
} as const;

export const assets = {
  logos,
  characters,
  characterTokens,
  miniapp,
  social,
  marketing,
  fullUrls,
  dimensions,
} as const;

export default assets;
