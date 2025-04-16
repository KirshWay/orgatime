import React, { memo } from "react";
import clsx from "clsx";

import { Task } from "@/entities/task";
import { TaskContainerBase } from "@/widgets/shared";
import { DayInfo } from "@/widgets/types";

type Props = {
  day: DayInfo;
  tasks: Task[];
  isCreating: boolean;
  containerId: string;
  onStartCreating: () => void;
  onStopCreating: () => void;
  onConfirmCreating: (title: string) => void;
  onNavigateToWeek?: (date: Date) => void;
};

export const DayColumn: React.FC<Props> = memo(
  ({
    day,
    tasks,
    isCreating,
    containerId,
    onStartCreating,
    onStopCreating,
    onConfirmCreating,
    onNavigateToWeek,
  }) => {
    const dayHeader = (
      <div
        className={clsx(
          "flex items-end justify-between w-full border-b-2 mb-2 pb-1",
          day.isToday
            ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
            : "border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-400",
        )}
      >
        <p className="text-xl">{day.fullDate}</p>
        <p className="text-sm">{day.dayOfWeek}</p>
      </div>
    );

    return (
      <TaskContainerBase
        tasks={tasks}
        containerId={containerId}
        isCreating={isCreating}
        headerContent={dayHeader}
        containerClassName="flex flex-col p-2"
        onStartCreating={onStartCreating}
        onStopCreating={onStopCreating}
        onConfirmCreating={onConfirmCreating}
        onNavigateToWeek={onNavigateToWeek}
      />
    );
  },
);
