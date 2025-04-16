import { useMemo } from "react";
import { isSameDay } from "date-fns";

import { Task } from "@/entities/task";

type DayInfo = {
  dateObj: Date;
  fullDate: string;
  dayOfWeek: string;
  isToday: boolean;
};

export const useTaskGrouping = (tasks: Task[], weekDays: DayInfo[]) => {
  return useMemo(() => {
    return weekDays.map((day) =>
      tasks
        .filter(
          (task) =>
            task.dueDate && isSameDay(new Date(task.dueDate), day.dateObj),
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0)),
    );
  }, [tasks, weekDays]);
};
