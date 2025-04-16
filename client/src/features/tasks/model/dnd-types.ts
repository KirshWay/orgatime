import { Active, Over } from "@dnd-kit/core";

import { Task } from "@/entities/task";

export type DragContainerType = "day" | "someday";

export type TaskDragData = {
  task: Task;
  type: "task";
};

export type ContainerInfo = {
  id: string;
  type: DragContainerType;
  dayIndex?: number;
};

export type ContainerDragData = {
  type: "container";
  containerType: DragContainerType;
  accepts: string[];
  dayIndex?: number;
};

export type DragEndParams = {
  active: Active;
  over: Over;
  activeTask: Task | null;
  activeContainer: ContainerInfo | null;
  overContainer: ContainerInfo | null;
};
