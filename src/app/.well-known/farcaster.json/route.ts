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
      // Search queries the 'name' field - "CapOrSlap" is searchable
      // Category browsing uses primaryCategory - appears in "games" category
      // Tags help with filtering and discovery (max 5, lowercase, no spaces/special chars)
      primaryCategory: 'games',
      tags: [
        'crypto',        // Main category
        'game',          // Game type
        'trading',       // Trading/guessing aspect
        'leaderboard',   // Competitive feature
        'defi',          // DeFi/crypto focus
      ],
      
      // Required: Display Information
      // Tagline appears in search results (max 30 chars)
      tagline: 'Higher or lower crypto game',
      heroImageUrl: `${appUrl}/images/miniapp/hero-1200x630.png`,
      // Screenshots help with discovery - showing gameplay, features
      screenshotUrls: [
        `${appUrl}/images/miniapp/screenshots/screenshot-1-landing.png`,
        `${appUrl}/images/miniapp/screenshots/screenshot-2-gameplay.png`,
        `${appUrl}/images/miniapp/screenshots/screenshot-3-leaderboard.png`,
        // Add loss screen if available for more context
        `${appUrl}/images/miniapp/screenshots/screenshot-4-loss.png`,
      ],
      
      // Optional: Display Information
      // These help with search and discovery
      subtitle: 'Higher or lower for crypto',
      // Description should be keyword-rich for search indexing
      description: 'Guess if crypto tokens have higher or lower market caps. Build streaks, compete on leaderboards, and test your crypto knowledge. Play the ultimate higher or lower game for cryptocurrency market caps.',
      
      // Optional: Embeds & Social Sharing
      // These appear when sharing the app URL in DMs or feeds
      // Better descriptions = better click-through rates
      ogTitle: 'CapOrSlap - Higher or Lower Crypto Game',
      ogDescription: 'Guess if crypto tokens have higher or lower market caps. Build streaks and compete on leaderboards. Play the ultimate crypto market cap guessing game on Base.',
      ogImageUrl: `${appUrl}/images/miniapp/hero-1200x630.png`,
      
      // Optional: Search indexing (false = include in search)
      noindex: false,
      
      // Notifications webhook endpoint
      webhookUrl: `${appUrl}/api/webhook`,
    }),
  };

  return Response.json(manifest);
}
