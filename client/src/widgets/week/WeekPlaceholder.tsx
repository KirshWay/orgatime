import { LoadingStatus } from '@/shared/ui/loading/LoadingStatus';
import { getWeekDays } from '@/widgets/utils';

import { DayHeader } from './DayHeader';

export const WeekPlaceholder = ({
  weekStart,
  isLoading = true,
}: {
  weekStart: Date;
  isLoading?: boolean;
}) => (
  <>
    {getWeekDays(weekStart).map((day, index) => (
      <div
        key={day.dateObj.getTime()}
        className="flex flex-col p-2 rounded-lg border border-gray-200 bg-white/60 dark:border-gray-700 dark:bg-gray-800/30"
      >
        <DayHeader day={day} />
        <div className="min-h-16 md:min-h-96">
          {index === 0 &&
            (isLoading ? (
              <LoadingStatus>Loading tasks...</LoadingStatus>
            ) : (
              <p className="p-2 text-sm text-gray-500 dark:text-gray-400">
                Tasks unavailable
              </p>
            ))}
        </div>
      </div>
    ))}
  </>
);
