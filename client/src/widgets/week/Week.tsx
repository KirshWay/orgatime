import { memo } from 'react';

import { useTasks } from '@/features/tasks/hooks';
import { useTaskGrouping } from '@/features/tasks/hooks/useTaskGrouping';
import { useTaskCreation } from '@/widgets/shared';
import { getWeekDays } from '@/widgets/utils';

import { DayColumn } from './DayColumn';
import { WeekPlaceholder } from './WeekPlaceholder';

type Props = {
  weekStart: Date;
  onNavigateToWeek?: (date: Date) => void;
};

export const Week: React.FC<Props> = memo(({ weekStart, onNavigateToWeek }) => {
  const weekDays = getWeekDays(weekStart);
  const { data: tasks, isPending } = useTasks();
  const tasksGrouped = useTaskGrouping(tasks || [], weekDays);
  const { creatingForDay, toggleCreatingForDay, createTaskForDay } =
    useTaskCreation();

  if (!tasks)
    return <WeekPlaceholder weekStart={weekStart} isLoading={isPending} />;

  return (
    <>
      {weekDays.map((day, dayIndex) => (
        <DayColumn
          key={day.dateObj.getTime()}
          day={day}
          tasks={tasksGrouped[dayIndex]}
          isCreating={creatingForDay[dayIndex]}
          onStartCreating={() => toggleCreatingForDay(dayIndex, true)}
          onStopCreating={() => toggleCreatingForDay(dayIndex, false)}
          onConfirmCreating={(title) =>
            createTaskForDay(dayIndex, title, day.dateObj)
          }
          containerId={`day-${dayIndex}`}
          onNavigateToWeek={onNavigateToWeek}
        />
      ))}
    </>
  );
});
