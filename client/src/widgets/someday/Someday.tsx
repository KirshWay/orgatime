import { memo } from "react";

import { useTasks } from "@/features/tasks/hooks";
import { useTaskCreation } from "@/widgets/shared";
import { TaskContainerBase } from "@/widgets/shared";

type Props = {
  onNavigateToWeek?: (date: Date) => void;
};

export const Someday: React.FC<Props> = memo(({ onNavigateToWeek }) => {
  const { data: tasks, isLoading } = useTasks();
  const { isCreating, setIsCreating, createSomedayTask } = useTaskCreation();

  const somedayTasks = tasks ? tasks.filter((task) => !task.dueDate) : [];

  if (isLoading) return <div>Loading tasks...</div>;

  return (
    <TaskContainerBase
      tasks={somedayTasks}
      containerId="someday"
      isCreating={isCreating}
      isSomeday={true}
      containerTitle="Someday"
      containerClassName="mt-4 p-4 bg-gray-200 dark:bg-gray-800 rounded-xl col-span-1 lg:col-span-5 lg:row-start-2 min-h-[400px]"
      highlightClassName="bg-indigo-200 dark:bg-indigo-900/30 shadow-lg border-2 border-indigo-300 dark:border-indigo-700 scale-[1.01]"
      onStartCreating={() => setIsCreating(true)}
      onStopCreating={() => setIsCreating(false)}
      onConfirmCreating={createSomedayTask}
      onNavigateToWeek={onNavigateToWeek}
    />
  );
});
