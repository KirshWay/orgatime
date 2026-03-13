import React from 'react';

import { Task } from '@/entities/task';
import { TaskFilter, useAllTasksGrouping } from '@/features/tasks/hooks';

import { DateGroup } from './DateGroup';

type Props = {
  tasks: Task[];
  filter: TaskFilter;
  onNavigateToWeek?: (date: Date) => void;
};

export const AllTasksList: React.FC<Props> = ({
  tasks,
  filter,
  onNavigateToWeek,
}) => {
  const groups = useAllTasksGrouping(tasks, filter);

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <p className="text-sm">
          {filter === 'active'
            ? 'No active tasks'
            : filter === 'completed'
              ? 'No completed tasks'
              : 'No tasks yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      {groups.map((group) => (
        <DateGroup
          key={group.key}
          label={group.label}
          isToday={group.isToday}
          isOverdue={group.isOverdue}
          tasks={group.tasks}
          onNavigateToWeek={onNavigateToWeek}
        />
      ))}
    </div>
  );
};
