import toast from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import type { Task } from '@/entities/task';

import { updateTasksOrder } from '../api';
import { useDragAndDropActions } from './useDragAndDropActions';

vi.mock('../api', () => ({ updateTasksOrder: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));
afterEach(() => vi.resetAllMocks());
const someday = { id: 'someday', type: 'someday' } as const;
function tasks(count: number): Task[] {
  return Array.from({ length: count }, (_, order) => ({
    id: String(order),
    title: String(order),
    completed: false,
    description: '',
    color: null,
    dueDate: null,
    subtasks: [],
    order,
  }));
}
function setup() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return {
    ...renderHook(() => useDragAndDropActions(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }),
    client,
  };
}

test('large containers can reorder nearby tasks by sending only changed orders', async () => {
  const { result, client } = setup();
  const original = tasks(1500);
  let outcome: boolean | undefined;
  await act(async () => {
    outcome = await result.current.handleReorderTasks(
      someday,
      original,
      new Date(),
      '0',
      '1',
    );
  });
  expect(outcome).toBe(true);
  expect(updateTasksOrder).toHaveBeenCalledTimes(1);
  expect(vi.mocked(updateTasksOrder).mock.calls[0][0]).toEqual({
    tasks: [
      { id: '1', order: 0 },
      { id: '0', order: 1 },
    ],
  });
  expect(original[0].id).toBe('0');
  client.clear();
});

test('rejects moves that exceed 1000 changed tasks without changing order or sending a request', async () => {
  const { result, client } = setup();
  const original = tasks(1001);
  let outcome: boolean | undefined;
  await act(async () => {
    outcome = await result.current.handleReorderTasks(
      someday,
      original,
      new Date(),
      '0',
      '1000',
    );
  });
  expect(outcome).toBe(false);
  expect(updateTasksOrder).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith(
    expect.stringContaining('shorter distance'),
  );
  expect(original.map((task) => task.id)).toEqual(
    Array.from({ length: 1001 }, (_, i) => String(i)),
  );
  client.clear();
});

test('allows exactly 1000 changed tasks and reports mutation failure', async () => {
  const { result, client } = setup();
  vi.mocked(updateTasksOrder).mockRejectedValueOnce(new Error('offline'));
  let outcome: boolean | undefined;
  await act(async () => {
    outcome = await result.current.handleReorderTasks(
      someday,
      tasks(1000),
      new Date(),
      '0',
      '999',
    );
  });
  expect(outcome).toBe(false);
  expect(vi.mocked(updateTasksOrder).mock.calls[0][0].tasks).toHaveLength(1000);
  expect(toast.error).toHaveBeenCalled();
  client.clear();
});
