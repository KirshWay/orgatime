import { lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

import { TaskFilter } from '@/features/tasks/hooks';
import { useTasks } from '@/features/tasks/hooks';
import { LazyWidget } from '@/shared/ui/lazy';
import { SEO } from '@/shared/ui/seo';
import { AllTasksFilter, AllTasksList } from '@/widgets/all-tasks';
import { Header } from '@/widgets/header';

const TaskModal = lazy(() =>
  import('@/features/tasks/ui/TaskModal').then((module) => ({
    default: module.TaskModal,
  })),
);

export const AllTasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<TaskFilter>('all');
  const navigate = useNavigate();

  const { data } = useTasks();
  const tasks = useMemo(() => data || [], [data]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const selectedTask = selectedTaskId
    ? tasks.find((task) => task.id === selectedTaskId)
    : null;

  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId) {
      setSelectedTaskId(taskId);
      setIsTaskModalOpen(true);
    }
  }, [searchParams, tasks]);

  const handleNavigateToWeek = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    navigate(`/?date=${dateStr}`);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTaskId(null);

    if (searchParams.has('task')) {
      setSearchParams({});
    }
  };

  const handleUpdateTask = () => {
    setIsTaskModalOpen(false);
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
        <AllTasksFilter filter={filter} setFilter={setFilter} tasks={tasks} />
        <AllTasksList
          tasks={tasks}
          filter={filter}
          onNavigateToWeek={handleNavigateToWeek}
        />
      </main>

      {selectedTask && (
        <LazyWidget>
          <TaskModal
            key={selectedTask.id}
            isOpen={isTaskModalOpen}
            onClose={handleCloseTaskModal}
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
            onSave={handleUpdateTask}
            onDelete={() => setIsTaskModalOpen(false)}
            onNavigateToWeek={handleNavigateToWeek}
          />
        </LazyWidget>
      )}
    </div>
  );
};
