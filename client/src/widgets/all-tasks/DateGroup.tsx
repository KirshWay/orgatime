import React from 'react';

import { Task } from '@/entities/task';
import { TaskItem } from '@/features/tasks/ui/TaskItem';
import { cn } from '@/shared/lib/utils';

type Props = {
  label: string;
  isToday: boolean;
  isOverdue: boolean;
  tasks: Task[];
  onNavigateToWeek?: (date: Date) => void;
};

export const DateGroup: React.FC<Props> = ({
  label,
  isToday,
  isOverdue,
  tasks,
  onNavigateToWeek,
}) => {
  return (
    <div>
      <div
        className={cn(
          'sticky top-0 z-10 flex items-end justify-between border-b-2 mb-2 pb-1 bg-gray-50 dark:bg-gray-900',
          isToday && 'border-indigo-600 text-indigo-600 dark:text-indigo-400',
          isOverdue &&
            !isToday &&
            'border-red-400 text-red-500 dark:text-red-400',
          !isToday &&
            !isOverdue &&
            'border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-400',
        )}
      >
        <p className="text-sm font-medium">{label}</p>
        <span className="text-xs opacity-60">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      <div className="space-y-1 px-1">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            id={task.id}
            title={task.title}
            description={task.description}
            completed={task.completed}
            color={task.color}
            dueDate={task.dueDate}
            subtasks={task.subtasks}
            images={task.images}
            isSomeday={!task.dueDate}
            onNavigateToWeek={onNavigateToWeek}
          />
        ))}
      </div>
    </div>
  );
};
