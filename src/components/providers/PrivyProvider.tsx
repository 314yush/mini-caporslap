'use client';

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';

interface PrivyProviderProps {
  children: React.ReactNode;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // If no Privy app ID, render children without provider (for Base App only usage)
  if (!appId) {
    console.warn('[PrivyProvider] NEXT_PUBLIC_PRIVY_APP_ID not set, Privy auth will not work');
    return <>{children}</>;
  }

  return (
    <PrivyProviderBase
      appId={appId}
      config={{
        loginMethods: ['wallet', 'email', 'google', 'twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#f59e0b', // amber-500 to match app theme
          logo: '/images/branding/logo-wordmark.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
