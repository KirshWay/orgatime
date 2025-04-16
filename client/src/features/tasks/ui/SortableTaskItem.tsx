import React, { memo, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Task } from "@/entities/task";

import { TaskItem } from "./TaskItem";

type Props = {
  task: Task;
  isSomeday?: boolean;
  onNavigateToWeek?: (date: Date) => void;
};

export const SortableTaskItem: React.FC<Props> = memo(
  ({ task, isSomeday = false, onNavigateToWeek }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: task.id,
      data: {
        task,
        type: "task",
      },
    });

    const style = useMemo(
      () => ({
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }),
      [transform, transition, isDragging],
    );

    const parsedDueDate = task.dueDate ? new Date(task.dueDate) : null;

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="touch-none"
      >
        <TaskItem
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
