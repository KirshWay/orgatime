import { useState } from "react";
import {
  DragEndEvent,
  DragStartEvent,
  Over,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { addDays } from "date-fns";

import { Task } from "@/entities/task";

import { getContainerInfo, getTaskContainer } from "../lib/container-utils";
import { ContainerDragData, ContainerInfo, TaskDragData } from "../model";
import { useDragAndDropActions } from "./useDragAndDropActions";

export type Props = {
  tasks: Task[];
  weekStart: Date;
};

/**
 * Main hook for handling task drag and drop functionality
 */
export const useDragAndDrop = ({ tasks, weekStart }: Props) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const {
    handleMoveToSomeday,
    handleMoveFromSomeday,
    handleMoveBetweenDays,
    handleReorderTasks,
  } = useDragAndDropActions();

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  /**
   * Handler for drag start event
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current as TaskDragData | undefined;

    if (activeData?.type === "task") {
      setActiveTask(activeData.task);
    }
  };

  /**
   * Handler for drag end event
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);

    if (!over || !active.data.current) {
      return;
    }

    const activeData = active.data.current as TaskDragData | undefined;

    if (!activeData || activeData.type !== "task") {
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) {
      return;
    }

    // Determine source container
    const activeContainerInfo = getTaskContainer(
      activeId.toString(),
      tasks,
      weekStart,
    );

    if (!activeContainerInfo) {
      console.error("Could not determine the source container of the task");
      return;
    }

    // Determine target container
    const overContainerInfo = determineTargetContainer(
      overId,
      over,
      tasks,
      weekStart,
    );

    if (!overContainerInfo) {
      console.error("Could not determine the target container", over);
      return;
    }

    await handleDropAction(
      activeId.toString(),
      activeContainerInfo,
      overContainerInfo,
      overId.toString(),
    );
  };

  /**
   * Determine target container for dragging
   */
  const determineTargetContainer = (
    overId: unknown,
    over: Over,
    tasks: Task[],
    weekStart: Date,
  ) => {
    if (typeof overId === "string") {
      if (overId === "someday") {
        return getContainerInfo(overId);
      } else if (overId.startsWith("day-")) {
        return getContainerInfo(overId);
      } else {
        const overData = over.data.current as ContainerDragData | undefined;
        if (overData?.type === "container" && overData.containerType) {
          if (overData.containerType === "someday") {
            return getContainerInfo("someday");
          } else if (
            overData.containerType === "day" &&
            typeof overData.dayIndex === "number"
          ) {
            return getContainerInfo(`day-${overData.dayIndex}`);
          }
        } else {
          return getTaskContainer(overId.toString(), tasks, weekStart);
        }
      }
    }
    return null;
  };

  /**
   * Handle drop action based on source and target containers
   */
  const handleDropAction = async (
    taskId: string,
    activeContainer: ContainerInfo,
    overContainer: ContainerInfo,
    overItemId?: string,
  ) => {
    // Scenario 1: Moving from day to Someday
    if (overContainer.type === "someday" && activeContainer.type === "day") {
      return handleMoveToSomeday(taskId);
    }

    // Scenario 2: Moving from Someday to day
    if (
      activeContainer.type === "someday" &&
      overContainer.type === "day" &&
      typeof overContainer.dayIndex === "number"
    ) {
      const targetDate = addDays(weekStart, overContainer.dayIndex);
      return handleMoveFromSomeday(taskId, targetDate);
    }

    // Scenario 3: Moving between days
    if (
      activeContainer.type === "day" &&
      overContainer.type === "day" &&
      activeContainer.id !== overContainer.id &&
      typeof overContainer.dayIndex === "number"
    ) {
      const targetDate = addDays(weekStart, overContainer.dayIndex);
      return handleMoveBetweenDays(taskId, targetDate);
    }

    // Scenario 4: Reordering in the same container
    if (activeContainer.id === overContainer.id) {
      return handleReorderTasks(
        activeContainer,
        tasks,
        weekStart,
        taskId,
        overItemId,
      );
    }

    return false;
  };

  return {
    sensors,
    activeTask,
    handleDragStart,
    handleDragEnd,
  };
};
