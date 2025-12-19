import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { MiniAppProvider } from '@/components/providers/MiniAppProvider';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
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
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
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
        <PostHogProvider>
          <MiniAppProvider>
            {children}
          </MiniAppProvider>
        </PostHogProvider>
        <ConsoleLogger enabled={true} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
