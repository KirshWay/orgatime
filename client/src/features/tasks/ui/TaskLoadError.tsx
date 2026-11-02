import { Button } from '@/shared/ui/button';

type Props = {
  hasCachedTasks: boolean;
  isRetrying: boolean;
  onRetry: () => void;
};

export const TaskLoadError = ({
  hasCachedTasks,
  isRetrying,
  onRetry,
}: Props) => (
  <div
    role="alert"
    className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-red-300 p-3 text-sm text-red-700 dark:border-red-800 dark:text-red-300"
  >
    <p>
      {hasCachedTasks
        ? 'Could not refresh tasks. Showing saved tasks.'
        : 'Could not load tasks. Please try again.'}
    </p>
    <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
      {isRetrying ? 'Retrying...' : 'Retry'}
    </Button>
  </div>
);
