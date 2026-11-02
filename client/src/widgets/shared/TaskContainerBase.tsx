import React, { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';

import { Task } from '@/entities/task';
import { SortableTaskList } from '@/features/tasks/ui/SortableTaskList';
import { TaskCreator } from '@/features/tasks/ui/TaskCreator';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type TaskContainerProps = {
  tasks: Task[];
  containerId: string;
  isCreating: boolean;
  isSomeday?: boolean;
  containerTitle?: string;
  headerContent?: React.ReactNode;
  containerClassName?: string;
  highlightClassName?: string;
  onStartCreating: () => void;
  onStopCreating: () => void;
  onConfirmCreating: (title: string) => void;
  onNavigateToWeek?: (date: Date) => void;
};

export const TaskContainerBase: React.FC<TaskContainerProps> = memo(
  ({
    tasks,
    containerId,
    isCreating,
    isSomeday = false,
    containerTitle,
    headerContent,
    containerClassName,
    highlightClassName,
    onStartCreating,
    onStopCreating,
    onConfirmCreating,
    onNavigateToWeek,
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: containerId,
      data: {
        type: 'container',
        containerType: isSomeday ? 'someday' : 'day',
        accepts: ['task'],
        dayIndex: !isSomeday
          ? parseInt(containerId.split('-')[1], 10)
          : undefined,
      },
    });

    return (
      <div
        ref={setNodeRef}
        className={cn(
          'min-w-0 rounded-lg border border-gray-200 bg-white/60 dark:border-gray-700 dark:bg-gray-800/30',
          containerClassName,
          isOver
            ? highlightClassName ||
                'ring-2 ring-inset ring-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
            : '',
          isSomeday && 'mb-4 md:mb-0',
        )}
      >
        {headerContent ||
          (containerTitle && (
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {containerTitle}
            </h2>
          ))}

        <div className="flex min-h-16 flex-col gap-3 md:min-h-96">
          <SortableTaskList
            tasks={tasks}
            containerId={containerId}
            isSomeday={isSomeday}
            onNavigateToWeek={onNavigateToWeek}
          />

          {isCreating ? (
            <TaskCreator
              onConfirm={onConfirmCreating}
              onCancel={onStopCreating}
            />
          ) : (
            <Button
              variant="outline"
              onClick={onStartCreating}
              className="no-print w-full border-dashed bg-transparent text-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300"
            >
              <Plus /> Add new task
            </Button>
          )}
        </div>
      </div>
    );
  },
);
