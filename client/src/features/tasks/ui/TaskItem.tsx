import React, { lazy, Suspense, useState } from "react";

import { Subtask, TASK_COLOR_HEX, TaskColor, TaskImage } from "@/entities/task";
import { Checkbox } from "@/shared/ui/checkbox";
import { Separator } from "@/shared/ui/separator";

import { useDeleteTask, useUpdateTask } from "../hooks";

const TaskModal = lazy(() =>
  import("./TaskModal").then((module) => ({
    default: module.TaskModal,
  })),
);

export type Props = {
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
  onNavigateToWeek?: (date: Date) => void;
};

export const TaskItem: React.FC<Props> = ({
  id,
  title,
  description = "",
  completed,
  color = null,
  dueDate,
  subtasks,
  images = [],
  isSomeday,
  isDragging = false,
  onNavigateToWeek,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const parsedDueDate =
    dueDate && typeof dueDate === "string" ? new Date(dueDate) : dueDate;

  const handleSave = (updatedData: {
    title: string;
    description: string;
    completed: boolean;
    color: TaskColor | null;
  }) => {
    updateTaskMutation.mutate({
      id,
      data: updatedData,
    });
  };

  const handleDelete = () => {
    deleteTaskMutation.mutate(id);
  };

  const handleItemClick = () => {
    if (!isDragging) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p
          style={
            color
              ? {
                  textDecoration: "underline",
                  textDecorationColor: TASK_COLOR_HEX[color],
                }
              : {}
          }
          className="h-8 text-sm content-center font-medium text-gray-700 dark:text-gray-300 w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
          onClick={handleItemClick}
        >
          {title}
        </p>
        <Checkbox
          className="w-6 h-6"
          checked={completed}
          onCheckedChange={(checked) => {
            if (typeof checked === "boolean") {
              updateTaskMutation.mutate({ id, data: { completed: checked } });
            }
          }}
        />
      </div>

      <Separator />

      {!isDragging && (
        <Suspense fallback={null}>
          <TaskModal
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
            onSave={handleSave}
            onDelete={handleDelete}
            onNavigateToWeek={onNavigateToWeek}
          />
        </Suspense>
      )}
    </>
  );
};
