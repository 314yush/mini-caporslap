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

  const manifest = {
    accountAssociation,
    miniapp: withValidProperties({
      version: '1',
      name: 'CapOrSlap',
      homeUrl: appUrl,
      iconUrl: `${appUrl}/images/miniapp/icon-512.png`,
      splashImageUrl: `${appUrl}/images/miniapp/splash-1200.png`,
      splashBackgroundColor: '#09090b',
      subtitle: 'Higher or lower for crypto',
      description:
        'Guess if the next token has a higher or lower market cap. Build streaks, compete globally.',
      screenshotUrls: [
        `${appUrl}/images/miniapp/screenshots/screenshot-1-landing.png`,
        `${appUrl}/images/miniapp/screenshots/screenshot-2-gameplay.png`,
        `${appUrl}/images/miniapp/screenshots/screenshot-3-leaderboard.png`,
        `${appUrl}/images/miniapp/screenshots/screenshot-4-loss.png`,
        `${appUrl}/images/miniapp/screenshots/screenshot-5-streak.png`,
      ],
      primaryCategory: 'social',
      tags: ['crypto', 'game', 'base', 'miniapp', 'marketcap'],
      heroImageUrl: `${appUrl}/images/miniapp/hero-1200x630.png`,
      tagline: 'Beat your streak.',
      ogTitle: 'CapOrSlap',
      ogDescription: 'Higher or lower for crypto market caps.',
      ogImageUrl: `${appUrl}/images/miniapp/hero-1200x630.png`,
      noindex: false,
    }),
  };

  return Response.json(manifest);
}
