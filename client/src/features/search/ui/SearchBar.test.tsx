import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import type { Task } from '@/entities/task';
import { searchTasks } from '@/features/tasks/api';

import { SearchBar } from './SearchBar';

vi.mock('@/features/tasks/api', () => ({ searchTasks: vi.fn() }));
const clients: QueryClient[] = [];
const task: Task = {
  id: 'target',
  title: 'Current result',
  description: '',
  color: 'RED',
  completed: true,
  dueDate: '2026-11-02T12:00:00Z',
  order: 0,
  subtasks: [],
  images: [],
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(searchTasks).mockResolvedValue([]);
});
afterEach(() => clients.splice(0).forEach((client) => client.clear()));
function Location() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}
function open(path = '/') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <SearchBar />
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
  return client;
}
function type(value: string) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Search tasks' }), {
    target: { value },
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

test('waits for a settled nonempty term and exposes idle, loading and empty states', async () => {
  open();
  expect(screen.getByRole('status')).toHaveTextContent('Type to search');
  type('   ');
  expect(searchTasks).not.toHaveBeenCalled();
  type(' missing ');
  expect(screen.getByRole('status')).toHaveTextContent('Searching');
  await waitFor(() => expect(searchTasks).toHaveBeenCalledWith('missing'));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('No tasks found'),
  );
});
test('hides previous results immediately and ignores older requests resolving last', async () => {
  const old = deferred<Task[]>();
  const current = deferred<Task[]>();
  vi.mocked(searchTasks)
    .mockReturnValueOnce(old.promise)
    .mockReturnValueOnce(current.promise);
  open();
  type('old');
  await waitFor(() => expect(searchTasks).toHaveBeenCalledWith('old'));
  type('current');
  expect(
    screen.queryByRole('button', { name: /Current result/ }),
  ).not.toBeInTheDocument();
  await waitFor(() => expect(searchTasks).toHaveBeenCalledWith('current'));
  await act(async () => current.resolve([task]));
  expect(
    await screen.findByRole('button', { name: /Current result/ }),
  ).toBeInTheDocument();
  await act(async () =>
    old.resolve([{ ...task, id: 'old', title: 'Outdated result' }]),
  );
  expect(screen.queryByText('Outdated result')).not.toBeInTheDocument();
  type('next');
  expect(
    screen.queryByRole('button', { name: /Current result/ }),
  ).not.toBeInTheDocument();
});
test('shows an actionable error and retries the current term', async () => {
  vi.mocked(searchTasks)
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValueOnce([task]);
  open();
  type('task');
  expect(
    await screen.findByRole('button', { name: 'Retry' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Search failed');
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(
    await screen.findByRole('button', { name: /Current result/ }),
  ).toBeInTheDocument();
  expect(searchTasks).toHaveBeenCalledTimes(2);
});
test('closing clears the term and an in-flight response does not appear after reopening', async () => {
  const pending = deferred<Task[]>();
  vi.mocked(searchTasks).mockReturnValue(pending.promise);
  open();
  type('task');
  await waitFor(() => expect(searchTasks).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button', { name: 'Close search' }));
  await act(async () => pending.resolve([task]));
  fireEvent.keyDown(window, { key: 'k', metaKey: true });
  expect(screen.getByRole('textbox', { name: 'Search tasks' })).toHaveValue('');
  expect(
    screen.queryByRole('button', { name: /Current result/ }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Type to search');
});
test.each([
  ['/', '/?task=target'],
  ['/tasks', '/tasks?task=target'],
  ['/other', '/?task=target'],
])(
  'selects a native result button from %s into %s',
  async (path, destination) => {
    vi.mocked(searchTasks).mockResolvedValue([task]);
    open(path);
    type('task');
    const result = await screen.findByRole('button', {
      name: /Current result/,
    });
    expect(result.tagName).toBe('BUTTON');
    expect(result).toHaveTextContent('02.11.2026');
    expect(screen.getByRole('status')).toHaveTextContent('1 task found');
    fireEvent.click(result);
    expect(screen.getByTestId('location')).toHaveTextContent(destination);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
);
