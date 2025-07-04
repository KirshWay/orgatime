import React, { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";

import { Task } from "@/entities/task";
import { SortableTaskList } from "@/features/tasks/ui/SortableTaskList";
import { TaskCreator } from "@/features/tasks/ui/TaskCreator";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export type TaskContainerProps = {
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
        type: "container",
        containerType: isSomeday ? "someday" : "day",
        accepts: ["task"],
        dayIndex: !isSomeday
          ? parseInt(containerId.split("-")[1], 10)
          : undefined,
      },
    });

    return (
      <div
        ref={setNodeRef}
        className={cn(
          "transition-all duration-200 ease-in-out",
          containerClassName,
          isOver
            ? highlightClassName ||
                "bg-indigo-100 dark:bg-indigo-900/30 rounded-md shadow-md border-2 border-indigo-300 dark:border-indigo-700"
            : "border-2 border-transparent",
          isSomeday && "mb-4 md:mb-0",
        )}
      >
        {headerContent ||
          (containerTitle && (
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {containerTitle}
            </p>
          ))}

        <div className="flex flex-col gap-5 min-h-96">
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
            <Button onClick={onStartCreating} className="no-print">
              <Plus /> Add new task
            </Button>
          )}
        </div>
      </div>
    );
  },
);
