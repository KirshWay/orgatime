import { useMemo } from 'react';
import { format, isBefore, isToday, parseISO, startOfToday } from 'date-fns';

import { Task } from '@/entities/task';

export type TaskDateGroup = {
  key: string;
  label: string;
  isToday: boolean;
  isOverdue: boolean;
  tasks: Task[];
};

export type TaskFilter = 'all' | 'active' | 'completed';

export const useAllTasksGrouping = (
  tasks: Task[],
  filter: TaskFilter,
): TaskDateGroup[] => {
  return useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    });

    const dated: Task[] = [];
    const someday: Task[] = [];

    for (const task of filtered) {
      if (task.dueDate) {
        dated.push(task);
      } else {
        someday.push(task);
      }
    }

    const groupMap = new Map<string, Task[]>();

    for (const task of dated) {
      const key = format(parseISO(task.dueDate!), 'yyyy-MM-dd');
      const group = groupMap.get(key);
      if (group) {
        group.push(task);
      } else {
        groupMap.set(key, [task]);
      }
    }

    const today = startOfToday();

    const groups: TaskDateGroup[] = Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, groupTasks]) => {
        const date = parseISO(key);
        const todayFlag = isToday(date);
        const overdueFlag = isBefore(date, today);

        let label = format(date, 'dd MMM, EEE');
        if (todayFlag) {
          label = `Today, ${format(date, 'dd MMM')}`;
        }

        return {
          key,
          label,
          isToday: todayFlag,
          isOverdue: overdueFlag,
          tasks: groupTasks.sort((a, b) => (a.order || 0) - (b.order || 0)),
        };
      });

    if (someday.length > 0) {
      groups.push({
        key: 'someday',
        label: 'Someday',
        isToday: false,
        isOverdue: false,
        tasks: someday.sort((a, b) => (a.order || 0) - (b.order || 0)),
      });
    }

    return groups;
  }, [tasks, filter]);
};
