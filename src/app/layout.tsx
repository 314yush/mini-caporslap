import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PrivyProvider } from '@/components/providers/PrivyProvider';
import { MiniAppProvider } from '@/components/providers/MiniAppProvider';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CapOrSlap - Higher or Lower for Crypto',
  description: 'Guess if the next token has a higher or lower market cap. Build streaks, compete globally.',
  keywords: ['crypto', 'game', 'market cap', 'higher lower', 'tokens', 'defi'],
  authors: [{ name: 'CapOrSlap' }],
  other: {
    'base:app_id': '694491c9d77c069a945be088',
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://mini.caporslap.fun/images/miniapp/hero-1200x630.png',
      button: {
        title: 'Play Now',
        action: {
          type: 'launch_miniapp',
          name: 'CapOrSlap',
          url: 'https://mini.caporslap.fun',
          splashImageUrl: 'https://mini.caporslap.fun/images/miniapp/splash-1200.png',
          splashBackgroundColor: '#09090b',
        },
      },
    }),
  },
  openGraph: {
    title: 'CapOrSlap',
    description: 'Can you guess the market cap? Play now!',
    type: 'website',
    images: ['https://mini.caporslap.fun/images/miniapp/hero-1200x630.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CapOrSlap',
    description: 'Can you guess the market cap? Play now!',
    images: ['https://mini.caporslap.fun/images/miniapp/hero-1200x630.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} font-sans antialiased bg-zinc-950 text-white`}
      >
        <MiniAppProvider>
          <PrivyProvider>{children}</PrivyProvider>
        </MiniAppProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
