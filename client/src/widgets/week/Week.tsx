import { memo } from "react";
import { AnimatePresence, motion as m } from "motion/react";

import { useTasks } from "@/features/tasks/hooks";
import { useTaskGrouping } from "@/features/tasks/hooks/useTaskGrouping";
import { useTaskCreation } from "@/widgets/shared";
import { getWeekDays } from "@/widgets/utils";

import { DayColumn } from "./DayColumn";

type Props = {
  weekStart: Date;
  onNavigateToWeek?: (date: Date) => void;
};

export const Week: React.FC<Props> = memo(({ weekStart, onNavigateToWeek }) => {
  const weekDays = getWeekDays(weekStart);
  const { data: tasks, isLoading } = useTasks();
  const tasksGrouped = useTaskGrouping(tasks || [], weekDays);
  const { creatingForDay, toggleCreatingForDay, createTaskForDay } =
    useTaskCreation();

  if (isLoading) return <div>Loading tasks...</div>;

  return (
    <AnimatePresence mode="wait">
      {weekDays.map((day, dayIndex) => (
        <m.div
          key={`${dayIndex}_${weekStart.getTime()}`}
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 60, opacity: 0 }}
          transition={{ duration: 0.3, delay: dayIndex * 0.05 }}
        >
          <DayColumn
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
        </m.div>
      ))}
    </AnimatePresence>
  );
});
