import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { Task } from "@/entities/task";

import { updateTasksOrder } from "../api";
import { getContainerTasks } from "../lib/container-utils";
import { ContainerInfo, UpdateTasksOrderDto } from "../model";

/**
 * Hook for handling drag and drop actions
 */
export const useDragAndDropActions = () => {
  const queryClient = useQueryClient();

  const updateTasksOrderMutation = useMutation({
    mutationFn: updateTasksOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error("Failed to update tasks order:", error);
      toast.error("Failed to update tasks order");
    },
  });

  /**
   * Handler for moving a task to Someday container
   */
  const handleMoveToSomeday = async (taskId: string) => {
    try {
      const payload: UpdateTasksOrderDto = {
        tasks: [
          {
            id: taskId,
            order: 0,
            dueDate: null,
          },
        ],
      };

      await updateTasksOrderMutation.mutateAsync(payload);
      return true;
    } catch (error) {
      console.error("Failed to move task to Someday:", error);
      toast.error("Failed to move task to Someday");
      return false;
    }
  };

  /**
   * Handler for moving a task from Someday to a specific day
   */
  const handleMoveFromSomeday = async (taskId: string, targetDate: Date) => {
    try {
      const payload: UpdateTasksOrderDto = {
        tasks: [
          {
            id: taskId,
            order: 0,
            dueDate: format(targetDate, "yyyy-MM-dd"),
          },
        ],
      };

      await updateTasksOrderMutation.mutateAsync(payload);
      return true;
    } catch (error) {
      console.error("Failed to move task from Someday:", error);
      toast.error("Failed to move task to day");
      return false;
    }
  };

  /**
   * Handler for moving a task between days
   */
  const handleMoveBetweenDays = async (taskId: string, targetDate: Date) => {
    try {
      const payload: UpdateTasksOrderDto = {
        tasks: [
          {
            id: taskId,
            order: 0,
            dueDate: format(targetDate, "yyyy-MM-dd"),
          },
        ],
      };

      await updateTasksOrderMutation.mutateAsync(payload);
      return true;
    } catch (error) {
      console.error("Failed to move task between days:", error);
      toast.error("Failed to move task between days");
      return false;
    }
  };

  /**
   * Handler for reordering tasks within the same container
   */
  const handleReorderTasks = async (
    activeContainer: ContainerInfo,
    tasks: Task[],
    weekStart: Date,
    taskId: string,
    overItemId?: string,
  ) => {
    const containerTasks = getContainerTasks(activeContainer, tasks, weekStart);

    const activeTaskIndex = containerTasks.findIndex(
      (task) => task.id === taskId,
    );
    const overTaskIndex = containerTasks.findIndex(
      (task) => task.id === overItemId,
    );

    if (activeTaskIndex === -1 || overTaskIndex === -1) {
      console.error("Could not find task indexes for reordering");
      return false;
    }

    const newOrder = [...containerTasks];
    const [movedTask] = newOrder.splice(activeTaskIndex, 1);
    newOrder.splice(overTaskIndex, 0, movedTask);

    try {
      const payload: UpdateTasksOrderDto = {
        tasks: newOrder.map((task, index) => ({
          id: task.id,
          order: index,
        })),
      };

      await updateTasksOrderMutation.mutateAsync(payload);
      return true;
    } catch (error) {
      console.error("Failed to update task order:", error);
      toast.error("Failed to reorder tasks");
      return false;
    }
  };

  return {
    handleMoveToSomeday,
    handleMoveFromSomeday,
    handleMoveBetweenDays,
    handleReorderTasks,
  };
};
