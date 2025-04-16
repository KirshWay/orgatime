import React, { memo, useMemo } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Task } from "@/entities/task";

import { SortableTaskItem } from "./SortableTaskItem";

type Props = {
  tasks: Task[];
  containerId: string;
  isSomeday?: boolean;
  onNavigateToWeek?: (date: Date) => void;
};

export const SortableTaskList: React.FC<Props> = memo(
  ({ tasks, containerId, isSomeday = false, onNavigateToWeek }) => {
    const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

    return (
      <SortableContext
        id={containerId}
        items={taskIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              isSomeday={isSomeday}
              onNavigateToWeek={onNavigateToWeek}
            />
          ))}
        </div>
      </SortableContext>
    );
  },
);
