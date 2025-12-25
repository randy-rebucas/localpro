/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/marketplace/components/providers' instead.
 */
export * from '@/features/marketplace/components/providers';

import ErrorBoundary from './error-boundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
