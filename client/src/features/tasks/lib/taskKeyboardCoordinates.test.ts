import type { ClientRect, KeyboardCoordinateGetter } from '@dnd-kit/core';
import { closestCenter } from '@dnd-kit/core';
import { expect, test } from 'vitest';

import { taskKeyboardCoordinates } from './taskKeyboardCoordinates';

type Options = Parameters<KeyboardCoordinateGetter>[1];
type Entry = {
  id: string;
  rect: ClientRect;
  data: Record<string, unknown>;
  disabled?: boolean;
};

function rect(left: number, top: number, width = 180, height = 80): ClientRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

function task(id: string, bounds: ClientRect, containerId = 'day-0'): Entry {
  return {
    id,
    rect: bounds,
    data: { type: 'task', sortable: { containerId } },
  };
}

function container(id: string, bounds: ClientRect): Entry {
  return {
    id,
    rect: bounds,
    data: {
      type: 'container',
      containerType: id === 'someday' ? 'someday' : 'day',
    },
  };
}

function setup(entries: Entry[], overId = entries[0].id): Options {
  const nodes = entries.map((entry) => ({
    id: entry.id,
    key: entry.id,
    data: { current: entry.data },
    disabled: entry.disabled ?? false,
    node: { current: null },
    rect: { current: entry.rect },
  }));
  const droppableContainers = Object.assign(
    new Map(nodes.map((node) => [node.id, node])),
    {
      getEnabled: () => nodes.filter((node) => !node.disabled),
      toArray: () => nodes,
      getNodeFor: () => undefined,
    },
  );
  const active = nodes[0];
  const bounds = entries[0].rect;
  const over = nodes.find((node) => node.id === overId)!;
  return {
    active: active.id,
    currentCoordinates: { x: bounds.left, y: bounds.top },
    context: {
      active: {
        id: active.id,
        data: active.data,
        rect: { current: { initial: bounds, translated: bounds } },
      },
      collisionRect: bounds,
      droppableContainers,
      droppableRects: new Map(entries.map((entry) => [entry.id, entry.rect])),
      over: { ...over, rect: over.rect.current },
      activatorEvent: null,
      activeNode: null,
      collisions: null,
      draggableNodes: new Map(),
      draggingNode: null,
      draggingNodeRect: null,
      scrollableAncestors: [],
      scrollAdjustedTranslate: null,
    },
  };
}

function expectDestination(
  options: Options,
  code: string,
  destinationId: string,
) {
  const coordinates = taskKeyboardCoordinates(
    new KeyboardEvent('keydown', { code }),
    options,
  );
  expect(coordinates).toBeDefined();
  const source = options.context.collisionRect!;
  const moved = rect(
    source.left + coordinates!.x - options.currentCoordinates.x,
    source.top + coordinates!.y - options.currentCoordinates.y,
    source.width,
    source.height,
  );
  const target = options.context.droppableRects.get(destinationId)!;
  expect(moved.left + moved.width / 2).toBe(target.left + target.width / 2);
  expect(moved.top + moved.height / 2).toBe(target.top + target.height / 2);
  expect(
    closestCenter({
      active: options.context.active!,
      collisionRect: moved,
      droppableContainers: options.context.droppableContainers.getEnabled(),
      droppableRects: options.context.droppableRects,
      pointerCoordinates: null,
    })[0]?.id,
  ).toBe(destinationId);
}

test('down selects the next same-day task instead of its populated parent', () => {
  const options = setup([
    task('first', rect(10, 20)),
    task('next', rect(10, 120)),
    task('last', rect(10, 220)),
    container('day-0', rect(0, 0, 200, 400)),
  ]);
  expectDestination(options, 'ArrowDown', 'next');
});

test('up leaves the first wide Someday task for a dated task', () => {
  const options = setup([
    task('someday-task', rect(10, 500, 1000), 'someday'),
    task('dated-task', rect(400, 100), 'day-2'),
    container('someday', rect(0, 460, 1020, 400)),
    container('day-2', rect(390, 0, 200, 400)),
  ]);
  expectDestination(options, 'ArrowUp', 'dated-task');
});

test('down centers a narrow dated task on a wide Someday task', () => {
  const options = setup([
    task('dated-task', rect(400, 100), 'day-2'),
    task('someday-task', rect(10, 500, 1000), 'someday'),
    container('day-2', rect(390, 0, 200, 400)),
    container('someday', rect(0, 460, 1020, 400)),
  ]);
  expectDestination(options, 'ArrowDown', 'someday-task');
});

test('right can target an empty day', () => {
  const options = setup([
    task('first', rect(10, 20)),
    container('day-0', rect(0, 0, 200, 400)),
    container('day-1', rect(220, 0, 200, 400)),
  ]);
  expectDestination(options, 'ArrowRight', 'day-1');
});

test('down ignores an adjacent column with a fractional vertical offset', () => {
  const options = setup([
    task('first', rect(600, 100), 'day-3'),
    task('adjacent', rect(400, 100.5), 'day-2'),
    task('below', rect(10, 500, 1000), 'someday'),
  ]);
  expectDestination(options, 'ArrowDown', 'below');
});

test('left can target an empty Someday container', () => {
  const options = setup([
    task('first', rect(300, 20)),
    container('day-0', rect(290, 0, 200, 400)),
    container('someday', rect(0, 0, 200, 400)),
  ]);
  expectDestination(options, 'ArrowLeft', 'someday');
});

test('skips the current over item and disabled destinations', () => {
  const options = setup(
    [
      task('first', rect(10, 20)),
      task('over', rect(10, 120)),
      { ...task('disabled', rect(10, 160)), disabled: true },
      task('next', rect(10, 220)),
    ],
    'over',
  );
  expectDestination(options, 'ArrowDown', 'next');
});

test('an opposite arrow can return to the original position before dropping', () => {
  const options = setup(
    [task('first', rect(10, 20)), task('next', rect(10, 120))],
    'next',
  );
  options.currentCoordinates = { x: 10, y: 120 };
  options.context.collisionRect = rect(10, 120);
  expectDestination(options, 'ArrowUp', 'first');
});

test('unknown keys and arrows without a destination return no coordinates', () => {
  const options = setup([task('only', rect(10, 20))]);
  expect(
    taskKeyboardCoordinates(
      new KeyboardEvent('keydown', { code: 'KeyA' }),
      options,
    ),
  ).toBeUndefined();
  expect(
    taskKeyboardCoordinates(
      new KeyboardEvent('keydown', { code: 'ArrowUp' }),
      options,
    ),
  ).toBeUndefined();
});
