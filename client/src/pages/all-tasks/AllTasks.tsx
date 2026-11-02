import { lazy, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import { TaskFilter } from '@/features/tasks/hooks';
import { useSearchTaskNavigation, useTasks } from '@/features/tasks/hooks';
import { TaskLoadError } from '@/features/tasks/ui/TaskLoadError';
import { LazyWidget } from '@/shared/ui/lazy';
import { LoadingStatus } from '@/shared/ui/loading/LoadingStatus';
import { SEO } from '@/shared/ui/seo';
import { AllTasksFilter, AllTasksList } from '@/widgets/all-tasks';
import { Header } from '@/widgets/header';

const TaskModal = lazy(() =>
  import('@/features/tasks/ui/TaskModal').then((module) => ({
    default: module.TaskModal,
  })),
);

export const AllTasks = () => {
  const { searchParams, selectedTaskId, closeTaskModal, navigateFromTask } =
    useSearchTaskNavigation();
  const [filter, setFilter] = useState<TaskFilter>('all');
  const navigate = useNavigate();

  const { data, isError, isPending, isFetching, refetch } = useTasks();
  const tasks = useMemo(() => data || [], [data]);

  const selectedTask = selectedTaskId
    ? tasks.find((task) => task.id === selectedTaskId)
    : null;

  const handleNavigateToWeek = (date: Date) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('task');
    nextParams.set('date', format(date, 'yyyy-MM-dd'));
    navigate({ pathname: '/', search: `?${nextParams}` });
  };

  const handleNavigateFromTask = (date: Date) => {
    navigateFromTask(date, '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEO
        title="All Tasks"
        description="View and manage all your tasks in one place. Filter by status, see overdue tasks, and stay organized."
        keywords="all tasks, task list, task overview, productivity"
        canonicalUrl={`${import.meta.env.VITE_SITE_DOMAIN}/tasks`}
      />

      <Header />

      <main className="m-4">
        {isError && (
          <TaskLoadError
            hasCachedTasks={data !== undefined}
            isRetrying={isFetching}
            onRetry={() => {
              void refetch();
            }}
          />
        )}
        <AllTasksFilter filter={filter} setFilter={setFilter} tasks={tasks} />
        <div className="min-h-96">
          {data !== undefined ? (
            <AllTasksList
              tasks={tasks}
              filter={filter}
              onNavigateToWeek={handleNavigateToWeek}
            />
          ) : (
            <div className="py-8">
              {isPending && <LoadingStatus>Loading tasks...</LoadingStatus>}
            </div>
          )}
        </div>
      </main>

      {selectedTask && (
        <LazyWidget fallback={null}>
          <TaskModal
            key={selectedTask.id}
            isOpen={true}
            onClose={closeTaskModal}
            taskId={selectedTask.id}
            initialTitle={selectedTask.title}
            initialDescription={selectedTask.description || ''}
            initialCompleted={selectedTask.completed}
            initialColor={selectedTask.color}
            initialDueDate={selectedTask.dueDate}
            initialSubtasks={selectedTask.subtasks}
            initialImages={selectedTask.images}
            isSomeday={!selectedTask.dueDate}
            isFromSearch={true}
            onNavigateToWeek={handleNavigateFromTask}
          />
        </LazyWidget>
      )}
    </div>
  );
};
