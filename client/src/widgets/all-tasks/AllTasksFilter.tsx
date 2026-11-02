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
    <div className="flex flex-wrap items-center justify-between gap-3 py-4 max-w-2xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          All Tasks
        </h2>
        <p className="text-xs text-gray-500">
          {tasks.length} tasks ({completedCount} completed)
        </p>
      </div>
      <div
        role="group"
        aria-label="Filter tasks"
        className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800"
      >
        <Button
          aria-pressed={filter === 'all'}
          className={
            filter === 'all'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'text-gray-600 dark:text-gray-300'
          }
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          aria-pressed={filter === 'active'}
          className={
            filter === 'active'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'text-gray-600 dark:text-gray-300'
          }
          variant={filter === 'active' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active
        </Button>
        <Button
          aria-pressed={filter === 'completed'}
          className={
            filter === 'completed'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'text-gray-600 dark:text-gray-300'
          }
          variant={filter === 'completed' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
      </div>
    </div>
  );
};
