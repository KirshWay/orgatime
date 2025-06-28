import { lazy, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { closestCenter, DndContext, DragOverlay } from "@dnd-kit/core";

import { useDragAndDrop, useTasks } from "@/features/tasks/hooks";
import { TaskItem } from "@/features/tasks/ui/TaskItem";
import { useWeekNavigation } from "@/shared/hooks";
import { LazyWidget } from "@/shared/ui/lazy";
import { SEO } from "@/shared/ui/seo";
import { Header } from "@/widgets/header";

const TaskModal = lazy(() =>
  import("@/features/tasks/ui/TaskModal").then((module) => ({
    default: module.TaskModal,
  })),
);

const Someday = lazy(() =>
  import("@/widgets/someday").then((module) => ({ default: module.Someday })),
);

const Week = lazy(() =>
  import("@/widgets/week").then((module) => ({ default: module.Week })),
);

export const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { weekStart, handleNavigateToWeek } = useWeekNavigation();

  const { data } = useTasks();
  const tasks = useMemo(() => data || [], [data]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const selectedTask = selectedTaskId
    ? tasks.find((task) => task.id === selectedTaskId)
    : null;

  const { sensors, activeTask, handleDragStart, handleDragEnd } =
    useDragAndDrop({
      tasks,
      weekStart,
    });

  useEffect(() => {
    const taskId = searchParams.get("task");
    if (taskId) {
      setSelectedTaskId(taskId);
      setIsTaskModalOpen(true);
    }
  }, [searchParams, tasks]);

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTaskId(null);

    if (searchParams.has("task") || searchParams.has("date")) {
      setSearchParams({});
    }
  };

  const handleUpdateTask = () => {
    setIsTaskModalOpen(false);
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-2 text-sm grid-cols-1 lg:grid-cols-6 items-start overflow-hidden">
            <LazyWidget>
              <Week
                weekStart={weekStart}
                onNavigateToWeek={handleNavigateToWeek}
              />
            </LazyWidget>
            <LazyWidget>
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
              <div className="w-full max-w-[300px] opacity-90 pointer-events-none shadow-xl rounded-md rotate-1 bg-white dark:bg-gray-800 border-2 border-indigo-300 dark:border-indigo-700">
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
        <LazyWidget>
          <TaskModal
            isOpen={isTaskModalOpen}
            onClose={handleCloseTaskModal}
            taskId={selectedTask.id}
            initialTitle={selectedTask.title}
            initialDescription={selectedTask.description || ""}
            initialCompleted={selectedTask.completed}
            initialColor={selectedTask.color}
            initialDueDate={selectedTask.dueDate}
            initialSubtasks={selectedTask.subtasks}
            initialImages={selectedTask.images}
            isSomeday={!selectedTask.dueDate}
            isFromSearch={true}
            currentWeekStart={weekStart}
            onSave={handleUpdateTask}
            onDelete={() => setIsTaskModalOpen(false)}
            onNavigateToWeek={handleNavigateToWeek}
          />
        </LazyWidget>
      )}
    </div>
  );
};
