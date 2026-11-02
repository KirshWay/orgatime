import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { domAnimation, LazyMotion } from 'motion/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { Task } from '@/entities/task';
import { apiClient } from '@/shared/api';

import { AllTasks } from './all-tasks/AllTasks';
import { Home } from './home';

vi.mock('@/shared/api', () => ({
  apiClient: { get: vi.fn() },
  isApiError: () => false,
}));
vi.mock('@/shared/ui/seo', () => ({ SEO: () => null }));
vi.mock('@/widgets/header', () => ({
  Header: () => <header>Planner navigation</header>,
}));

const task: Task = {
  id: 'local-loading-task',
  title: 'Cached task',
  description: '',
  completed: false,
  color: null,
  dueDate: null,
  order: 0,
  subtasks: [],
  images: [],
};
const clients: QueryClient[] = [];

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

function openPage(Page: typeof Home | typeof AllTasks, cached?: Task[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  if (cached) client.setQueryData(['tasks'], cached);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <LazyMotion features={domAnimation}>
          <Page />
        </LazyMotion>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

describe.each([
  ['Home', Home],
  ['All tasks', AllTasks],
] as const)('%s task data', (_name, Page) => {
  test('distinguishes initial loading, failure, retry and successful empty data', async () => {
    const pending = deferred<Awaited<ReturnType<typeof apiClient.get>>>();
    vi.mocked(apiClient.get).mockReturnValueOnce(pending.promise);
    openPage(Page);
    expect(screen.getByRole('banner')).toBeVisible();
    expect(await screen.findAllByText(/Loading tasks/)).not.toHaveLength(0);
    expect(screen.queryByText('No tasks yet')).toBeNull();
    expect(screen.queryByRole('button', { name: /Add new task/ })).toBeNull();
    await act(() => pending.reject(new Error('Network unavailable')));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Could not load tasks/,
    );
    expect(screen.queryByText('No tasks yet')).toBeNull();
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [],
      status: 200,
      headers: {},
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    if (Page === AllTasks)
      expect(await screen.findByText('No tasks yet')).toBeVisible();
    else
      await waitFor(() =>
        expect(
          screen.getAllByRole('button', { name: /Add new task/ }),
        ).toHaveLength(8),
      );
  });

  test('keeps cached tasks and navigation visible during a failed background refresh', async () => {
    const pending = deferred<Awaited<ReturnType<typeof apiClient.get>>>();
    vi.mocked(apiClient.get).mockReturnValueOnce(pending.promise);
    openPage(Page, [task]);
    expect(await screen.findByText(task.title)).toBeVisible();
    expect(screen.getByRole('banner')).toBeVisible();
    expect(screen.queryByText(/Loading tasks/)).toBeNull();
    await act(() => pending.reject(new Error('Network unavailable')));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /showing saved tasks/i,
    );
    expect(screen.getByText(task.title)).toBeVisible();
    expect(screen.getByRole('banner')).toBeVisible();
  });
});
