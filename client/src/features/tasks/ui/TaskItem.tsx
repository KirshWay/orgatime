import React, { lazy, Suspense, useState } from 'react';

import { Subtask, TASK_COLOR_HEX, TaskColor, TaskImage } from '@/entities/task';
import { Checkbox } from '@/shared/ui/checkbox';

import { useUpdateTask } from '../hooks';

const EMPTY_IMAGES: TaskImage[] = [];

const TaskModal = lazy(() =>
  import('./TaskModal').then((module) => ({
    default: module.TaskModal,
  })),
);

type Props = {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  color?: TaskColor | null;
  dueDate: Date | string | null;
  subtasks?: Subtask[];
  images?: TaskImage[];
  isSomeday?: boolean;
  isDragging?: boolean;
  dragHandle?: React.ReactNode;
  onNavigateToWeek?: (date: Date) => void;
};

export const TaskItem: React.FC<Props> = ({
  id,
  title,
  description = '',
  completed,
  color = null,
  dueDate,
  subtasks,
  images = EMPTY_IMAGES,
  isSomeday,
  isDragging = false,
  dragHandle,
  onNavigateToWeek,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalGeneration, setModalGeneration] = useState(0);
  const updateTaskMutation = useUpdateTask();

  const parsedDueDate =
    dueDate && typeof dueDate === 'string' ? new Date(dueDate) : dueDate;

  const handleItemClick = () => {
    if (!isDragging) {
      setModalGeneration((prev) => prev + 1);
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="task-row flex min-h-10 items-center gap-2 border-b border-gray-200/80 dark:border-gray-700/70">
        {dragHandle}
        <button
          type="button"
          disabled={isDragging}
          tabIndex={isDragging ? -1 : undefined}
          style={
            color || completed
              ? {
                  textDecorationLine: [
                    color && 'underline',
                    completed && 'line-through',
                  ]
                    .filter(Boolean)
                    .join(' '),
                  textDecorationColor: color
                    ? TASK_COLOR_HEX[color]
                    : undefined,
                  textUnderlineOffset: '3px',
                }
              : undefined
          }
          className={`min-w-0 flex-1 cursor-pointer truncate rounded-sm py-2 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-default ${completed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}
          onClick={handleItemClick}
        >
          {title}
        </button>
        <Checkbox
          aria-label={`Mark ${title} as ${completed ? 'incomplete' : 'complete'}`}
          className="task-checkbox relative size-6 shrink-0 border-gray-400 data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
          checked={completed}
          disabled={isDragging}
          tabIndex={isDragging ? -1 : undefined}
          onCheckedChange={(checked) => {
            if (typeof checked === 'boolean') {
              updateTaskMutation.mutate({ id, data: { completed: checked } });
            }
          }}
        />
      </div>

      {!isDragging && (
        <Suspense fallback={null}>
          <TaskModal
            key={`${id}-${modalGeneration}`}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            taskId={id}
            initialTitle={title}
            initialDescription={description}
            initialCompleted={completed}
            initialColor={color}
            initialDueDate={parsedDueDate}
            initialSubtasks={subtasks}
            initialImages={images}
            isSomeday={isSomeday}
            onNavigateToWeek={
              onNavigateToWeek
                ? (date) => {
                    setIsModalOpen(false);
                    onNavigateToWeek(date);
                  }
                : undefined
            }
          />
        </Suspense>
      )}
    </>
  );
};
