import { Suspense } from 'react';

import { LoadingStatus } from '@/shared/ui/loading/LoadingStatus';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export const LazyWidget = ({ children, fallback }: Props) => {
  return (
    <Suspense fallback={fallback === undefined ? <LoadingStatus /> : fallback}>
      {children}
    </Suspense>
  );
};
