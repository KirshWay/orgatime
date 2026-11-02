import { memo } from 'react';

import { useTasks } from '@/features/tasks/hooks';
import { useTaskCreation } from '@/widgets/shared';
import { TaskContainerBase } from '@/widgets/shared';

import { SomedayPlaceholder } from './SomedayPlaceholder';

type Props = {
  onNavigateToWeek?: (date: Date) => void;
};

export const Someday: React.FC<Props> = memo(({ onNavigateToWeek }) => {
  const { data: tasks, isPending } = useTasks();
  const { isCreating, setIsCreating, createSomedayTask } = useTaskCreation();

  const somedayTasks = tasks ? tasks.filter((task) => !task.dueDate) : [];

  if (!tasks) return <SomedayPlaceholder isLoading={isPending} />;

  return (
    <TaskContainerBase
      tasks={somedayTasks}
      containerId="someday"
      isCreating={isCreating}
      isSomeday={true}
      containerTitle="Someday"
      containerClassName="mt-2 p-3 bg-gray-100/70 dark:bg-gray-800/50 rounded-lg col-span-1 lg:col-span-5 lg:row-start-2 min-h-[400px]"
      highlightClassName="ring-2 ring-inset ring-indigo-400 bg-indigo-50 dark:bg-indigo-950/40"
      onStartCreating={() => setIsCreating(true)}
      onStopCreating={() => setIsCreating(false)}
      onConfirmCreating={createSomedayTask}
      onNavigateToWeek={onNavigateToWeek}
    />
  );
});
