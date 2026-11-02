import type { KeyboardCoordinateGetter, UniqueIdentifier } from '@dnd-kit/core';

import type { ContainerDragData, TaskDragData } from '../model';

type PlannerDragData = (TaskDragData | ContainerDragData) & {
  sortable?: { containerId: UniqueIdentifier };
};

const directions: Record<string, { x: number; y: number } | undefined> = {
  ArrowDown: { x: 0, y: 1 },
  ArrowUp: { x: 0, y: -1 },
  ArrowRight: { x: 1, y: 0 },
  ArrowLeft: { x: -1, y: 0 },
};

export const taskKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  { active, currentCoordinates, context },
) => {
  const direction = directions[event.code];

  if (!direction) return;
  event.preventDefault();

  const { collisionRect, droppableContainers, droppableRects, over } = context;
  if (!collisionRect) return;

  const entries = droppableContainers.getEnabled();
  const occupiedContainers = new Set<UniqueIdentifier>();
  for (const entry of entries) {
    const data = entry.data.current as PlannerDragData | undefined;
    if (
      data?.type === 'task' &&
      data.sortable &&
      droppableRects.has(entry.id)
    ) {
      occupiedContainers.add(data.sortable.containerId);
    }
  }

  const center = {
    x: collisionRect.left + collisionRect.width / 2,
    y: collisionRect.top + collisionRect.height / 2,
  };
  let destination: { x: number; y: number } | undefined;
  let nearestDistance = Infinity;

  for (const entry of entries) {
    if (entry.id === (over?.id ?? active)) continue;
    const data = entry.data.current as PlannerDragData | undefined;
    if (
      !data ||
      (data.type !== 'task' && data.type !== 'container') ||
      (data.type === 'container' && occupiedContainers.has(entry.id))
    ) {
      continue;
    }

    const rect = droppableRects.get(entry.id);
    if (!rect) continue;
    const candidate = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    const dx = candidate.x - center.x;
    const dy = candidate.y - center.y;
    const forwardDistance = dx * direction.x + dy * direction.y;
    const sidewaysDistance = Math.abs(dx * direction.y - dy * direction.x);
    if (forwardDistance <= 0 || forwardDistance < sidewaysDistance) continue;

    const distance = dx * dx + dy * dy;
    if (distance < nearestDistance) {
      destination = candidate;
      nearestDistance = distance;
    }
  }

  if (destination) {
    return {
      x: currentCoordinates.x + destination.x - center.x,
      y: currentCoordinates.y + destination.y - center.y,
    };
  }
};
