import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useReducedMotion } from 'motion/react';

import { Task } from '@/entities/task';

import { TaskItem } from './TaskItem';

type Props = {
  task: Task;
  isSomeday?: boolean;
  onNavigateToWeek?: (date: Date) => void;
};

export const SortableTaskItem: React.FC<Props> = memo(
  ({ task, isSomeday = false, onNavigateToWeek }) => {
    const reduceMotion = useReducedMotion();
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: task.id,
      transition: reduceMotion
        ? null
        : { duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      data: {
        task,
        type: 'task',
      },
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.35 : 1,
    };

    const parsedDueDate = task.dueDate ? new Date(task.dueDate) : null;

    return (
      <div ref={setNodeRef} style={style} className="min-w-0">
        <TaskItem
          dragHandle={
            <button
              ref={setActivatorNodeRef}
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`Move ${task.title}`}
              data-task-drag-handle={task.id}
              className="task-grip flex min-h-10 w-5 shrink-0 touch-none items-center justify-center rounded-sm text-gray-400 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-500 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="size-4" aria-hidden="true" />
            </button>
          }
          id={task.id}
          title={task.title}
          description={task.description}
          completed={task.completed}
          color={task.color}
          dueDate={parsedDueDate}
          subtasks={task.subtasks}
          images={task.images}
          isSomeday={isSomeday}
          isDragging={isDragging}
          onNavigateToWeek={onNavigateToWeek}
        />
      </div>
    );
  },
);
