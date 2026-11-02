import { lazy, useEffect, useMemo, useRef } from 'react';
import { DndContext, type DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { startOfWeek } from 'date-fns';

import {
  useDragAndDrop,
  useSearchTaskNavigation,
  useTasks,
} from '@/features/tasks/hooks';
import { getTaskContainer } from '@/features/tasks/lib/container-utils';
import { taskCollisionDetection } from '@/features/tasks/lib/taskCollisionDetection';
import { TaskItem } from '@/features/tasks/ui/TaskItem';
import { TaskLoadError } from '@/features/tasks/ui/TaskLoadError';
import { useWeekNavigation } from '@/shared/hooks';
import { LazyWidget } from '@/shared/ui/lazy';
import { SEO } from '@/shared/ui/seo';
import { Header } from '@/widgets/header';
import { SomedayPlaceholder } from '@/widgets/someday/SomedayPlaceholder';
import { WeekPlaceholder } from '@/widgets/week/WeekPlaceholder';

const TaskModal = lazy(() =>
  import('@/features/tasks/ui/TaskModal').then((module) => ({
    default: module.TaskModal,
  })),
);

const Someday = lazy(() =>
  import('@/widgets/someday').then((module) => ({ default: module.Someday })),
);

const Week = lazy(() =>
  import('@/widgets/week').then((module) => ({ default: module.Week })),
);

export const Home = () => {
  const { selectedTaskId, closeTaskModal, navigateFromTask } =
    useSearchTaskNavigation();
  const { weekStart, handleNavigateToWeek } = useWeekNavigation();

  const { data, isError, isFetching, refetch } = useTasks();
  const tasks = useMemo(() => data || [], [data]);

  const selectedTask = selectedTaskId
    ? tasks.find((task) => task.id === selectedTaskId)
    : null;

  const {
    sensors,
    activeTask,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  } = useDragAndDrop({
    tasks,
    weekStart,
  });

  const pendingDragFocus = useRef<{
    taskId: string;
    sourceDueDate: string | null;
  } | null>(null);

  useEffect(() => {
    const clearOnFocusChange = (event: FocusEvent) => {
      const pending = pendingDragFocus.current;
      if (
        pending &&
        event.target instanceof HTMLElement &&
        event.target !== document.body &&
        event.target.dataset.taskDragHandle !== pending.taskId
      ) {
        pendingDragFocus.current = null;
      }
    };
    document.addEventListener('focusin', clearOnFocusChange);
    return () => document.removeEventListener('focusin', clearOnFocusChange);
  }, []);

  useEffect(() => {
    const pending = pendingDragFocus.current;
    if (!pending) return;
    const movedTask = tasks.find((task) => task.id === pending.taskId);
    if (!movedTask || movedTask.dueDate === pending.sourceDueDate) return;
    const grip = Array.from(
      document.querySelectorAll<HTMLElement>('[data-task-drag-handle]'),
    ).find((element) => element.dataset.taskDragHandle === pending.taskId);
    if (grip) {
      pendingDragFocus.current = null;
      grip.focus({ preventScroll: true });
    }
  }, [tasks]);

  const handleDrop = async (event: DragEndEvent) => {
    pendingDragFocus.current = null;
    const task = tasks.find((item) => item.id === event.active.id);
    const source = task && getTaskContainer(task.id, tasks, weekStart);
    const overId = event.over?.id.toString();
    const targetId =
      overId === 'someday' || overId?.startsWith('day-')
        ? overId
        : overId && getTaskContainer(overId, tasks, weekStart)?.id;
    const pending =
      event.activatorEvent instanceof KeyboardEvent &&
      task &&
      source &&
      targetId &&
      source.id !== targetId
        ? { taskId: task.id, sourceDueDate: task.dueDate }
        : null;
    pendingDragFocus.current = pending;
    const didMove = await handleDragEnd(event);
    if (!didMove && pendingDragFocus.current === pending) {
      pendingDragFocus.current = null;
    }
  };

  const handleNavigateFromTask = (date: Date) => {
    navigateFromTask(startOfWeek(date, { weekStartsOn: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEO
        title="Organize Your Week"
        description="OrgaTime helps you organize your week efficiently with an intuitive task management system. Track your tasks, set due dates, and boost productivity."
        keywords="task management, weekly planner, productivity app, time management, task organizer"
        canonicalUrl={`${import.meta.env.VITE_SITE_DOMAIN}/`}
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
        <DndContext
          sensors={sensors}
          collisionDetection={taskCollisionDetection}
          onDragStart={(event) => {
            pendingDragFocus.current = null;
            handleDragStart(event);
          }}
          onDragEnd={handleDrop}
          onDragCancel={() => {
            pendingDragFocus.current = null;
            handleDragCancel();
          }}
        >
          <div className="grid gap-2 text-sm grid-cols-1 lg:grid-cols-6 items-start overflow-hidden">
            <LazyWidget fallback={<WeekPlaceholder weekStart={weekStart} />}>
              <Week
                weekStart={weekStart}
                onNavigateToWeek={handleNavigateToWeek}
              />
            </LazyWidget>
            <LazyWidget fallback={<SomedayPlaceholder />}>
              <Someday onNavigateToWeek={handleNavigateToWeek} />
            </LazyWidget>
          </div>

          <DragOverlay
            adjustScale={false}
            dropAnimation={null}
            modifiers={[]}
            zIndex={1000}
          >
            {activeTask ? (
              <div
                aria-hidden="true"
                className="w-full pointer-events-none shadow-lg rounded-md bg-white dark:bg-gray-800 ring-2 ring-indigo-400 px-2"
              >
                <TaskItem
                  id={activeTask.id}
                  title={activeTask.title}
                  description={activeTask.description}
                  completed={activeTask.completed}
                  color={activeTask.color}
                  dueDate={activeTask.dueDate}
                  subtasks={activeTask.subtasks}
                  isDragging={true}
                  onNavigateToWeek={handleNavigateToWeek}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
            currentWeekStart={weekStart}
            onNavigateToWeek={handleNavigateFromTask}
          />
        </LazyWidget>
      )}
    </div>
  );
};
