import { addDays, format } from "date-fns";

import { Task } from "@/entities/task";

import { ContainerInfo } from "../model/dnd-types";

export const getTaskContainer = (
  taskId: string,
  tasks: Task[],
  weekStart: Date,
): ContainerInfo | null => {
  for (let i = 0; i < 7; i++) {
    const dayTasks = tasks.filter(
      (task) =>
        task.dueDate &&
        format(new Date(task.dueDate), "yyyy-MM-dd") ===
          format(addDays(weekStart, i), "yyyy-MM-dd"),
    );
    if (dayTasks.some((task) => task.id === taskId)) {
      return {
        id: `day-${i}`,
        type: "day",
        dayIndex: i,
      };
    }
  }

  if (tasks.some((task) => task.id === taskId && !task.dueDate)) {
    return {
      id: "someday",
      type: "someday",
    };
  }

  return null;
};

export const getContainerInfo = (containerId: string): ContainerInfo | null => {
  if (containerId === "someday") {
    return {
      id: "someday",
      type: "someday",
    };
  }

  if (containerId.startsWith("day-")) {
    const dayIndex = parseInt(containerId.split("-")[1], 10);
    if (!isNaN(dayIndex) && dayIndex >= 0 && dayIndex < 7) {
      return {
        id: containerId,
        type: "day",
        dayIndex,
      };
    }
  }

  console.warn("Unable to determine container info for:", containerId);
  return null;
};

export const getContainerTasks = (
  container: ContainerInfo,
  tasks: Task[],
  weekStart: Date,
): Task[] => {
  if (container.type === "someday") {
    return tasks.filter((task) => !task.dueDate);
  }

  if (container.type === "day" && typeof container.dayIndex === "number") {
    const targetDate = addDays(weekStart, container.dayIndex);
    return tasks.filter(
      (task) =>
        task.dueDate &&
        format(new Date(task.dueDate), "yyyy-MM-dd") ===
          format(targetDate, "yyyy-MM-dd"),
    );
  }

  return [];
};
