import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

import type { Task } from '@/entities/task';

const state = vi.hoisted(() => ({
  tasks: [] as Task[],
  drop: vi.fn(),
  keyboard: true,
}));
vi.mock('@/features/tasks/hooks', () => ({
  useTasks: () => ({ data: state.tasks }),
  useSearchTaskNavigation: () => ({}),
  useDragAndDrop: () => ({
    handleDragEnd: state.drop,
    handleDragStart: vi.fn(),
    handleDragCancel: vi.fn(),
  }),
}));
vi.mock('@/shared/hooks', () => ({
  useWeekNavigation: () => ({ weekStart: new Date(2026, 10, 2) }),
}));
vi.mock('@/shared/ui/seo', () => ({ SEO: () => null }));
vi.mock('@/widgets/header', () => ({ Header: () => null }));
vi.mock('@/shared/ui/lazy', () => ({
  LazyWidget: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/widgets/someday', () => ({ Someday: () => null }));
vi.mock('@/widgets/week', () => ({
  Week: () => (
    <button data-task-drag-handle="task" key={state.tasks[0]?.dueDate}>
      Move task
    </button>
  ),
}));
vi.mock('@dnd-kit/core', () => ({
  closestCenter: vi.fn(),
  DragOverlay: () => null,
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode;
    onDragEnd: (event: unknown) => void;
  }) => (
    <>
      {children}
      <button
        onClick={() =>
          onDragEnd({
            active: { id: 'task' },
            over: { id: 'day-1' },
            activatorEvent: state.keyboard
              ? new KeyboardEvent('keydown')
              : new MouseEvent('pointerdown'),
          })
        }
      >
        Drop
      </button>
      <button>Elsewhere</button>
    </>
  ),
}));

import { Home } from './index';

const task: Task = {
  id: 'task',
  title: 'Task',
  description: '',
  completed: false,
  color: null,
  dueDate: '2026-11-02',
  order: 0,
  subtasks: [],
};

async function setup(keyboard = true) {
  state.tasks = [{ ...task }];
  state.keyboard = keyboard;
  let resolve!: (result: boolean) => void;
  state.drop.mockImplementation(
    () =>
      new Promise<boolean>((done) => {
        resolve = done;
      }),
  );
  const view = render(<Home />);
  const grip = await screen.findByRole('button', { name: 'Move task' });
  grip.focus();
  fireEvent.click(screen.getByRole('button', { name: 'Drop' }));
  return { view, resolve };
}

function refresh(view: ReturnType<typeof render>) {
  state.tasks = [{ ...task, dueDate: '2026-11-03' }];
  view.rerender(<Home />);
}

test('keyboard cross-day drop restores the new grip after refresh before completion returns', async () => {
  const { view, resolve } = await setup();
  refresh(view);
  expect(screen.getByRole('button', { name: 'Move task' })).toHaveFocus();
  await act(async () => resolve(true));
});

test('failed drop does not refocus on a later refresh', async () => {
  const { view, resolve } = await setup();
  await act(async () => resolve(false));
  refresh(view);
  expect(screen.getByRole('button', { name: 'Move task' })).not.toHaveFocus();
});

test('pointer drop does not restore keyboard focus', async () => {
  const { view, resolve } = await setup(false);
  refresh(view);
  expect(screen.getByRole('button', { name: 'Move task' })).not.toHaveFocus();
  await act(async () => resolve(true));
});

test('deliberate focus change prevents delayed restoration', async () => {
  const { view, resolve } = await setup();
  screen.getByRole('button', { name: 'Elsewhere' }).focus();
  refresh(view);
  expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  await act(async () => resolve(true));
});

test('an earlier failed request cannot clear a newer keyboard drop', async () => {
  const { view, resolve: resolveEarlier } = await setup();
  let resolveLater!: (result: boolean) => void;
  state.drop.mockImplementation(
    () =>
      new Promise<boolean>((done) => {
        resolveLater = done;
      }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Drop' }));
  await act(async () => resolveEarlier(false));
  refresh(view);
  expect(screen.getByRole('button', { name: 'Move task' })).toHaveFocus();
  await act(async () => resolveLater(true));
});
