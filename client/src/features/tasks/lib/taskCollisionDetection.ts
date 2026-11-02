import {
  closestCenter,
  type CollisionDetection,
  pointerWithin,
} from '@dnd-kit/core';

import type { ContainerDragData, TaskDragData } from '../model';

type PlannerDragData = (TaskDragData | ContainerDragData) & {
  sortable?: { containerId: string };
};

export const taskCollisionDetection: CollisionDetection = (args) => {
  const pointer = args.pointerCoordinates;
  if (!pointer) return closestCenter(args);

  const containers = args.droppableContainers.filter(
    (entry) =>
      (entry.data.current as PlannerDragData | undefined)?.type === 'container',
  );
  const containing = pointerWithin({
    ...args,
    droppableContainers: containers,
  });
  const target = containing[0];
  if (!target) return [];

  const tasks = args.droppableContainers.filter((entry) => {
    const data = entry.data.current as PlannerDragData | undefined;
    return data?.type === 'task' && data.sortable?.containerId === target.id;
  });
  if (!tasks.length) return [target];

  const direct = pointerWithin({ ...args, droppableContainers: tasks });
  if (direct.length) return direct;

  return closestCenter({
    ...args,
    droppableContainers: tasks,
    collisionRect: {
      left: pointer.x,
      right: pointer.x,
      top: pointer.y,
      bottom: pointer.y,
      width: 0,
      height: 0,
    },
  });
};
