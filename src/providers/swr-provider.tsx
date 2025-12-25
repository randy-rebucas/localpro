'use client';

/**
 * SWR Provider
 * 
 * This provider wraps the application with SWR configuration.
 * While SWR doesn't require a provider (it works with hooks),
 * this component can be used to provide global configuration
 * and error boundaries if needed.
 */

import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { swrConfig, swrFetcher } from '@/lib/swr-config';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        ...swrConfig,
      }}
    >
      {children}
    </SWRConfig>
  );
}

