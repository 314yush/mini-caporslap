'use client';

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import { privyConfig, getPrivyAppId } from '@/lib/auth/privy-config';

interface PrivyProviderProps {
  children: React.ReactNode;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  const appId = getPrivyAppId();
  
  // If no Privy app ID, render children without auth
  if (!appId) {
    return <>{children}</>;
  }
  
  return (
    <PrivyProviderBase
      appId={appId}
      config={privyConfig}
    >
      {children}
    </PrivyProviderBase>
  );
}


