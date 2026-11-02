import {
  type ClientRect,
  closestCenter,
  type CollisionDetection,
} from '@dnd-kit/core';
import { expect, test } from 'vitest';

import { taskCollisionDetection } from './taskCollisionDetection';

type Entry = { id: string; bounds: ClientRect; data: Record<string, unknown> };
function rect(
  left: number,
  top: number,
  width: number,
  height: number,
): ClientRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}
function container(id: string, bounds: ClientRect): Entry {
  return { id, bounds, data: { type: 'container' } };
}
function task(id: string, bounds: ClientRect, containerId: string): Entry {
  return { id, bounds, data: { type: 'task', sortable: { containerId } } };
}
function setup(
  entries: Entry[],
  pointerCoordinates: { x: number; y: number } | null,
  collisionRect = entries[0].bounds,
): Parameters<CollisionDetection>[0] {
  const droppableContainers = entries.map((entry) => ({
    id: entry.id,
    key: entry.id,
    data: { current: entry.data },
    rect: { current: entry.bounds },
    disabled: false,
    node: { current: null },
  }));
  return {
    active: {
      id: entries[0].id,
      data: droppableContainers[0].data,
      rect: {
        current: { initial: entries[0].bounds, translated: collisionRect },
      },
    },
    collisionRect,
    pointerCoordinates,
    droppableContainers,
    droppableRects: new Map(entries.map((entry) => [entry.id, entry.bounds])),
  };
}
const planner = [
  task('wide', rect(20, 550, 1100, 70), 'someday'),
  task('monday', rect(20, 180, 140, 60), 'day-0'),
  task('wednesday', rect(350, 180, 140, 60), 'day-2'),
  container('someday', rect(10, 510, 1120, 300)),
  container('day-0', rect(10, 100, 160, 350)),
  container('day-2', rect(340, 100, 160, 350)),
];

test('a wide Someday task follows the pointer into Monday rather than its translated center into Wednesday', () => {
  const args = setup(planner, { x: 100, y: 200 }, rect(82, 143, 1100, 70));
  expect(closestCenter(args)[0].id).not.toBe('monday');
  expect(taskCollisionDetection(args)[0].id).toBe('monday');
});
test('directly touching a tall task wins over a nearer center in the same day', () => {
  const entries = [
    task('active', rect(0, 500, 500, 60), 'someday'),
    task('tall', rect(10, 100, 180, 240), 'day-0'),
    task('short', rect(10, 350, 180, 40), 'day-0'),
    container('day-0', rect(0, 90, 200, 350)),
  ];
  expect(taskCollisionDetection(setup(entries, { x: 50, y: 335 }))[0].id).toBe(
    'tall',
  );
});
test('blank column space selects the nearest task only inside that column', () => {
  expect(taskCollisionDetection(setup(planner, { x: 150, y: 400 }))[0].id).toBe(
    'monday',
  );
});
test('empty days and Someday return their container', () => {
  const entries = [
    planner[0],
    container('day-1', rect(200, 100, 160, 350)),
    container('someday', rect(10, 510, 1120, 300)),
  ];
  expect(taskCollisionDetection(setup(entries, { x: 250, y: 250 }))[0].id).toBe(
    'day-1',
  );
  expect(
    taskCollisionDetection(
      setup([entries[1], entries[2]], { x: 250, y: 600 }),
    )[0].id,
  ).toBe('someday');
});
test('outside the planner has no drop destination', () => {
  expect(taskCollisionDetection(setup(planner, { x: 180, y: 200 }))).toEqual(
    [],
  );
});
test('hovering the active task leaves it as the no-op destination', () => {
  expect(taskCollisionDetection(setup(planner, { x: 100, y: 580 }))[0].id).toBe(
    'wide',
  );
});
test('keyboard collisions retain the existing closest-center behavior', () => {
  const args = setup(planner, null, rect(350, 180, 140, 60));
  expect(taskCollisionDetection(args)).toEqual(closestCenter(args));
});
