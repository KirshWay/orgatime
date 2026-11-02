import clsx from 'clsx';

import type { DayInfo } from '@/widgets/types';

export const DayHeader = ({ day }: { day: DayInfo }) => (
  <div
    className={clsx(
      'flex items-center justify-between w-full border-b-2 mb-2 pb-2 pt-1',
      day.isToday
        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
        : 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-400',
    )}
  >
    <h2 className="text-lg font-semibold tracking-tight">{day.fullDate}</h2>
    <p className="text-xs font-medium">{day.dayOfWeek}</p>
  </div>
);
