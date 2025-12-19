/**
 * Farcaster Mini-App Manifest Route
 * Serves the manifest at /.well-known/farcaster.json
 */

function withValidProperties(properties: Record<string, undefined | string | string[] | boolean>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ''
    )
  );
}

function getAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_URL ||
    'https://mini.caporslap.fun';
  return raw.replace(/\/$/, '');
}

export async function GET() {
  const appUrl = getAppUrl();

  // Account association credentials from environment
  // Generate these at https://www.base.dev/preview?tab=account after deployment
  const accountAssociation = {
    header: process.env.ACCOUNT_ASSOCIATION_HEADER ?? '',
    payload: process.env.ACCOUNT_ASSOCIATION_PAYLOAD ?? '',
    signature: process.env.ACCOUNT_ASSOCIATION_SIGNATURE ?? '',
  };

  // Base Mini Apps manifest schema
  // See: https://docs.base.org/mini-apps/core-concepts/manifest
  const manifest = {
    accountAssociation,
    miniapp: withValidProperties({
      // Required: Identity & Launch
      version: '1',
      name: 'CapOrSlap',
      homeUrl: appUrl,
      iconUrl: `${appUrl}/android-chrome-512x512.png`,
      
      // Required: Loading Experience
      splashImageUrl: `${appUrl}/images/miniapp/splash-1200.png`,
      splashBackgroundColor: '#09090b',
      
      // Required: Discovery & Search
      primaryCategory: 'games',
      tags: ['crypto', 'game', 'base', 'marketcap'],
      
      // Required: Display Information
      tagline: 'Beat your streak.',
      heroImageUrl: `${appUrl}/images/miniapp/hero-1200x630.png`,
      screenshotUrls: [
        `${appUrl}/images/miniapp/screenshots/screenshot-1-landing.png`,
        `${appUrl}/images/miniapp/screenshots/screenshot-2-gameplay.png`,
        `${appUrl}/images/miniapp/screenshots/screenshot-3-leaderboard.png`,
      ],
      
      // Optional: Display Information
      subtitle: 'Higher or lower for crypto',
      description: 'Guess if the next token has a higher or lower market cap. Build streaks, compete globally.',
      
      // Optional: Embeds & Social Sharing
      ogTitle: 'CapOrSlap',
      ogDescription: 'Higher or lower for crypto market caps.',
      ogImageUrl: `${appUrl}/images/miniapp/hero-1200x630.png`,
      
      // Optional: Search indexing (false = include in search)
      noindex: false,
    }),
  };

  return Response.json(manifest);
}
