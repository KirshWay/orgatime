import { LoadingStatus } from '@/shared/ui/loading/LoadingStatus';

export const SomedayPlaceholder = ({
  isLoading = true,
}: {
  isLoading?: boolean;
}) => (
  <div className="mt-2 mb-4 md:mb-0 p-3 bg-gray-100/70 dark:bg-gray-800/50 rounded-lg col-span-1 lg:col-span-5 lg:row-start-2 min-h-[400px] border border-gray-200 dark:border-gray-700">
    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
      Someday
    </p>
    <div className="min-h-96">
      {isLoading ? (
        <LoadingStatus>Loading tasks...</LoadingStatus>
      ) : (
        <p className="p-2 text-sm text-gray-500 dark:text-gray-400">
          Tasks unavailable
        </p>
      )}
    </div>
  </div>
);
