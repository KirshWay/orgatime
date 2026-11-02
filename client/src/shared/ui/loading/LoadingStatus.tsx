import { Loader2 } from 'lucide-react';

export const LoadingStatus = ({
  children = 'Loading...',
}: {
  children?: React.ReactNode;
}) => (
  <div
    role="status"
    className="flex items-center gap-2 p-2 text-sm text-gray-500 dark:text-gray-400"
  >
    <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
    {children}
  </div>
);
