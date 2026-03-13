import React from 'react';

import { Task } from '@/entities/task';
import { TaskFilter } from '@/features/tasks/hooks';
import { Button } from '@/shared/ui/button';

type Props = {
  filter: TaskFilter;
  setFilter: (filter: TaskFilter) => void;
  tasks: Task[];
};

export const AllTasksFilter: React.FC<Props> = ({
  filter,
  setFilter,
  tasks,
}) => {
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="flex items-center justify-between py-3 max-w-2xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          All Tasks
        </h2>
        <p className="text-xs text-gray-500">
          {tasks.length} tasks ({completedCount} completed)
        </p>
      </div>
      <div className="flex gap-1">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
      </div>
    </div>
  );
};
