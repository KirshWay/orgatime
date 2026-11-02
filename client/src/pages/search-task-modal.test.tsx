import { toast, Toaster } from 'react-hot-toast';
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { domAnimation, LazyMotion } from 'motion/react';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';

import type { Task } from '@/entities/task';
import { useTasks } from '@/features/tasks/hooks';
import type { UpdateTaskDto } from '@/features/tasks/model';
import { TaskItem } from '@/features/tasks/ui/TaskItem';
import { apiClient } from '@/shared/api';

import { AllTasks } from './all-tasks/AllTasks';
import { Home } from './home';

vi.mock('@/shared/api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    post: vi.fn(),
  },
  isApiError: () => false,
}));
vi.mock('@/shared/ui/seo', () => ({ SEO: () => null }));
vi.mock('@/widgets/header', () => ({ Header: () => null }));
vi.mock('@/widgets/week', () => ({ Week: () => null }));
vi.mock('@/widgets/someday', () => ({ Someday: () => null }));
vi.mock('@/widgets/all-tasks', () => ({
  AllTasksFilter: () => null,
  AllTasksList: () => null,
}));

const selectedTask: Task = {
  id: 'search-target',
  title: 'Original task',
  description: 'Original description',
  completed: false,
  color: null,
  dueDate: null,
  order: 1,
  subtasks: [],
  images: [],
};
const otherTask: Task = {
  ...selectedTask,
  id: 'untouched-task',
  title: 'Another task',
  order: 0,
};
const draft = {
  title: 'Edited task',
  description: 'Edited description',
  completed: false,
  color: 'RED',
  dueDate: null,
} satisfies UpdateTaskDto;
const entryPoints = ['Home search', 'AllTasks search', 'TaskItem'] as const;
type EntryPoint = (typeof entryPoints)[number];
let serverTasks: Task[];
const clients: QueryClient[] = [];

beforeAll(async () => {
  await import('@/features/tasks/ui/TaskModal');
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('matchMedia', (media: string) =>
    Object.assign(new EventTarget(), {
      matches: false,
      media,
      onchange: null,
      addListener() {},
      removeListener() {},
    }),
  );
  serverTasks = [{ ...otherTask }, { ...selectedTask }];
  vi.mocked(apiClient.get).mockImplementation(async () => ({
    data: serverTasks.map((task) => ({ ...task })),
    status: 200,
    headers: {},
  }));
  vi.mocked(apiClient.patch).mockImplementation(async (_path, data) => {
    const updated = { ...selectedTask, ...(data as UpdateTaskDto) };
    serverTasks = [otherTask, updated];
    return { data: updated, status: 200, headers: {} };
  });
  vi.mocked(apiClient.delete).mockImplementation(async () => {
    serverTasks = [otherTask];
    return {
      data: { message: 'Deleted' },
      status: 200,
      headers: {},
    };
  });
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  toast.remove();
});

function TaskCard() {
  const { data = [] } = useTasks();
  return data.map((task) => <TaskItem key={task.id} {...task} />);
}

function Page({ entryPoint }: { entryPoint: EntryPoint }) {
  const location = useLocation();
  return (
    <>
      <output data-testid="location">{location.search}</output>
      <output data-testid="pathname">{location.pathname}</output>
      {location.pathname === '/away' ? (
        <p>Away from tasks</p>
      ) : entryPoint === 'Home search' ? (
        <Home />
      ) : entryPoint === 'AllTasks search' ? (
        <AllTasks />
      ) : (
        <TaskCard />
      )}
    </>
  );
}

async function openTask(entryPoint: EntryPoint) {
  const path = entryPoint === 'AllTasks search' ? '/tasks' : '/';
  const url = `${path}?task=${selectedTask.id}&view=compact&date=2026-11-02`;
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  clients.push(client);
  const router = createMemoryRouter(
    [{ path: '*', element: <Page entryPoint={entryPoint} /> }],
    { initialEntries: [entryPoint === 'TaskItem' ? '/' : url] },
  );
  render(
    <QueryClientProvider client={client}>
      <LazyMotion features={domAnimation}>
        <RouterProvider router={router} />
        <Toaster />
      </LazyMotion>
    </QueryClientProvider>,
  );
  if (entryPoint === 'TaskItem') {
    fireEvent.click(
      await screen.findByRole('button', { name: selectedTask.title }),
    );
  }
  await screen.findByPlaceholderText('Task title');
  return { client, router, url };
}

async function editDraft() {
  fireEvent.change(screen.getByPlaceholderText('Task title'), {
    target: { value: draft.title },
  });
  fireEvent.change(screen.getByPlaceholderText('Task description'), {
    target: { value: draft.description },
  });
  fireEvent.keyDown(screen.getByTitle('Change color'), { key: 'Enter' });
  const colors = await screen.findAllByRole('menuitem');
  fireEvent.click(colors[2]);
  await waitFor(() =>
    expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
  );
}

function expectSearchParamsPreserved(entryPoint: EntryPoint) {
  if (entryPoint === 'TaskItem') return;
  const params = new URLSearchParams(
    screen.getByTestId('location').textContent ?? '',
  );
  expect(params.has('task')).toBe(false);
  expect(params.get('view')).toBe('compact');
  expect(params.get('date')).toBe('2026-11-02');
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe.each(entryPoints)('%s task modal', (entryPoint) => {
  test('saves the selected ID and draft once, refreshes tasks and reopens with saved values', async () => {
    const { client, router, url } = await openTask(entryPoint);
    await editDraft();
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));
    expect(apiClient.patch).toHaveBeenCalledWith('/tasks/search-target', draft);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expectSearchParamsPreserved(entryPoint);
    await waitFor(() =>
      expect(client.getQueryData<Task[]>(['tasks'])?.[1]).toMatchObject(draft),
    );
    expect(screen.queryByRole('dialog')).toBeNull();

    if (entryPoint === 'TaskItem') {
      fireEvent.click(screen.getByRole('button', { name: draft.title }));
    } else {
      await act(() => router.navigate(url));
    }
    expect(await screen.findByPlaceholderText('Task title')).toHaveValue(
      draft.title,
    );
    expect(screen.getByPlaceholderText('Task description')).toHaveValue(
      draft.description,
    );
    expect(apiClient.delete).not.toHaveBeenCalled();
  });

  test('deletes the selected ID once, refreshes tasks and does not reopen after a refetch', async () => {
    const { client } = await openTask(entryPoint);
    fireEvent.click(screen.getByTitle('Delete task'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete permanently' }),
    );

    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledTimes(1));
    expect(apiClient.delete).toHaveBeenCalledWith('/tasks/search-target');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expectSearchParamsPreserved(entryPoint);
    await waitFor(() =>
      expect(client.getQueryData<Task[]>(['tasks'])).toEqual([otherTask]),
    );
    await act(() => client.refetchQueries({ queryKey: ['tasks'] }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(apiClient.patch).not.toHaveBeenCalled();
  });

  test('keeps the modal open and blocks repeat save and delete while saving', async () => {
    const pending = deferred<Awaited<ReturnType<typeof apiClient.patch>>>();
    vi.mocked(apiClient.patch).mockReturnValueOnce(pending.promise);
    await openTask(entryPoint);
    await editDraft();
    const update = screen.getByRole('button', { name: 'Update' });
    fireEvent.click(update);
    fireEvent.click(update);

    await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(update).toBeDisabled();
    const remove = screen.getByTitle('Delete task');
    expect(remove).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(remove);
    expect(apiClient.delete).not.toHaveBeenCalled();
    await act(() =>
      pending.resolve({
        data: { ...selectedTask, ...draft },
        status: 200,
        headers: {},
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  test('keeps the modal open and blocks repeat delete while deleting', async () => {
    const pending = deferred<Awaited<ReturnType<typeof apiClient.delete>>>();
    vi.mocked(apiClient.delete).mockReturnValueOnce(pending.promise);
    await openTask(entryPoint);
    const remove = screen.getByTitle('Delete task');
    fireEvent.click(remove);
    const confirm = await screen.findByRole('button', {
      name: 'Delete permanently',
    });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole('dialog', { name: 'Delete task?' }),
    ).toBeInTheDocument();
    expect(confirm).toBeDisabled();
    expect(apiClient.patch).not.toHaveBeenCalled();
    await act(() =>
      pending.resolve({
        data: { message: 'Deleted' },
        status: 200,
        headers: {},
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  test('retains the draft on save error, shows the error and allows retry', async () => {
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('Save failed'));
    const { router } = await openTask(entryPoint);
    const originalSearch = router.state.location.search;
    await editDraft();
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Task title')).toHaveValue(draft.title);
    expect(screen.getByPlaceholderText('Task description')).toHaveValue(
      draft.description,
    );
    expect(router.state.location.search).toBe(originalSearch);
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(2));
    expect(apiClient.patch).toHaveBeenLastCalledWith(
      '/tasks/search-target',
      draft,
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  test('retains the draft on delete error, shows the error and allows retry', async () => {
    vi.mocked(apiClient.delete).mockRejectedValueOnce(
      new Error('Delete failed'),
    );
    await openTask(entryPoint);
    await editDraft();
    fireEvent.click(screen.getByTitle('Delete task'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete permanently' }),
    );

    expect(await screen.findByText('Delete failed')).toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: 'Delete task?' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByPlaceholderText('Task title')).toHaveValue(draft.title);
    expect(screen.getByPlaceholderText('Task description')).toHaveValue(
      draft.description,
    );
    fireEvent.click(screen.getByTitle('Delete task'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete permanently' }),
    );
    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledTimes(2));
    expect(apiClient.delete).toHaveBeenLastCalledWith('/tasks/search-target');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  test('keeps every metadata field in the draft until Update', async () => {
    await openTask(entryPoint);
    await editDraft();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('checkbox'));
    expect(apiClient.patch).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('Task title')).toHaveValue(draft.title);
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));
    expect(apiClient.patch).toHaveBeenCalledWith('/tasks/search-target', {
      ...draft,
      completed: true,
    });
  });

  test('dirty close can keep editing or discard without a request', async () => {
    await openTask(entryPoint);
    await editDraft();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(
      await screen.findByRole('dialog', { name: 'Discard unsaved changes?' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByPlaceholderText('Task title')).toHaveValue(draft.title);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Discard changes' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(apiClient.patch).not.toHaveBeenCalled();
  });

  test('Someday can choose a calendar date without saving until Update', async () => {
    await openTask(entryPoint);
    fireEvent.click(screen.getByRole('button', { name: /Choose a date/ }));
    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    const cell = screen
      .getAllByRole('gridcell')
      .find(
        (element) =>
          element.getAttribute('data-outside') !== 'true' &&
          element.querySelector('button'),
      )!;
    fireEvent.click(within(cell).getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: /^Use / }));
    expect(apiClient.patch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/tasks/search-target',
      expect.objectContaining({ dueDate: expect.any(String) }),
    );
  });

  test('date shortcuts use the current draft and Someday clears the date in the final update', async () => {
    serverTasks[1].dueDate = '2026-12-16T12:00:00.000Z';
    await openTask(entryPoint);
    fireEvent.click(screen.getByRole('button', { name: /\+1 day/ }));
    expect(screen.getByText('Thu, 17 Dec 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /\+7 days/ }));
    expect(screen.getByText('Thu, 24 Dec 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Someday' }));
    expect(apiClient.patch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/tasks/search-target',
      expect.objectContaining({ dueDate: null }),
    );
  });

  test('duplicate protects unsaved text and supports retry after a failed request', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(
      new Error('Duplicate failed'),
    );
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: selectedTask,
      status: 200,
      headers: {},
    });
    await openTask(entryPoint);
    await editDraft();
    fireEvent.click(screen.getByRole('button', { name: /Duplicate/ }));
    expect(apiClient.post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByPlaceholderText('Task title')).toHaveValue(draft.title);
    fireEvent.click(screen.getByRole('button', { name: /Duplicate/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(await screen.findByText('Duplicate failed')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Task title')).toHaveValue(draft.title);
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(apiClient.patch).not.toHaveBeenCalled();
  });

  test('outside dismissal protects a dirty task and canceling the confirmation keeps the editor open', async () => {
    await openTask(entryPoint);
    await editDraft();
    const title = screen.getByPlaceholderText('Task title');
    fireEvent(
      title,
      new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
    );
    fireEvent.click(title);
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    fireEvent(
      document.body,
      new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
    );
    fireEvent.click(document.body);
    expect(
      await screen.findByRole('dialog', { name: 'Discard unsaved changes?' }),
    ).toBeInTheDocument();
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    fireEvent(
      document.body,
      new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
    );
    fireEvent.click(document.body);
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Discard unsaved changes?' }),
      ).toBeNull(),
    );
    expect(
      screen.getByRole('dialog', { name: 'Task details' }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Task title')).toHaveValue(draft.title);
    expect(apiClient.patch).not.toHaveBeenCalled();
  });

  test('pending duplicate blocks repeated confirmation and dismissal', async () => {
    const pending = deferred<Awaited<ReturnType<typeof apiClient.post>>>();
    vi.mocked(apiClient.post).mockReturnValueOnce(pending.promise);
    await openTask(entryPoint);
    await editDraft();
    fireEvent.click(screen.getByRole('button', { name: /Duplicate/ }));
    const confirm = screen.getByRole('button', { name: 'Discard changes' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1));
    expect(confirm).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Keep editing' })).toBeDisabled();
    fireEvent.keyDown(
      screen.getByRole('dialog', { name: 'Discard unsaved changes?' }),
      { key: 'Escape' },
    );
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    fireEvent(
      document.body,
      new MouseEvent('pointerdown', { bubbles: true, button: 0 }),
    );
    fireEvent.click(document.body);
    expect(
      screen.getByRole('dialog', { name: 'Discard unsaved changes?' }),
    ).toBeInTheDocument();
    await act(() =>
      pending.resolve({ data: selectedTask, status: 200, headers: {} }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(apiClient.post).toHaveBeenCalledTimes(1);
  });

  test('task deletion cancellation leaves the task and draft intact', async () => {
    await openTask(entryPoint);
    await editDraft();
    fireEvent.click(screen.getByTitle('Delete task'));
    expect(apiClient.delete).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(screen.getByPlaceholderText('Task title')).toHaveValue(draft.title);
    expect(apiClient.delete).not.toHaveBeenCalled();
  });
});

describe.each(entryPoints.slice(0, 2))('%s navigation', (entryPoint) => {
  beforeEach(() => {
    serverTasks[1].dueDate = '2026-12-16T12:00:00.000Z';
  });

  test('goes to the task week and closes in one navigation preserving unrelated parameters', async () => {
    const { client } = await openTask(entryPoint);
    fireEvent.click(
      screen.getByRole('button', { name: /Go to the week of this task/ }),
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/$/);
    const params = new URLSearchParams(
      screen.getByTestId('location').textContent ?? '',
    );
    expect(params.has('task')).toBe(false);
    expect(params.get('view')).toBe('compact');
    expect(params.get('date')).toBe(
      entryPoint === 'Home search' ? '2026-12-14' : '2026-12-16',
    );
    await act(() => client.refetchQueries({ queryKey: ['tasks'] }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(apiClient.patch).not.toHaveBeenCalled();
  });

  test('navigation discards the draft date and goes to the persisted task week', async () => {
    const { router } = await openTask(entryPoint);
    const originalLocation = router.state.location;
    await editDraft();
    fireEvent.click(screen.getByRole('button', { name: /\+7 days/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Go to the week of this task/ }),
    );
    expect(router.state.location).toBe(originalLocation);
    fireEvent.keyDown(
      screen.getByRole('dialog', { name: 'Discard unsaved changes?' }),
      { key: 'Escape' },
    );
    expect(
      screen.getByRole('dialog', { name: 'Task details' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Discard unsaved changes?' }),
    ).toBeNull();
    expect(screen.getByPlaceholderText('Task title')).toHaveValue(draft.title);
    fireEvent.click(
      screen.getByRole('button', { name: /Go to the week of this task/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(new URLSearchParams(router.state.location.search).get('date')).toBe(
      entryPoint === 'Home search' ? '2026-12-14' : '2026-12-16',
    );
    expect(apiClient.patch).not.toHaveBeenCalled();
  });

  test('stages a custom date then saves every field before navigating, retaining the draft on failure', async () => {
    const pending = deferred<Awaited<ReturnType<typeof apiClient.patch>>>();
    vi.mocked(apiClient.patch).mockReturnValueOnce(pending.promise);
    const { router } = await openTask(entryPoint);
    const originalLocation = router.state.location;
    await editDraft();
    fireEvent.click(screen.getByRole('button', { name: /Choose a date/ }));
    expect(screen.getByRole('gridcell', { selected: true })).toHaveTextContent(
      '16',
    );
    fireEvent.click(
      screen.getByRole('button', { name: /December 17th, 2026/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: /^Use / }));
    expect(apiClient.patch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));
    expect(apiClient.patch).toHaveBeenCalledWith('/tasks/search-target', {
      ...draft,
      dueDate: new Date(2026, 11, 17).toISOString(),
    });
    expect(router.state.location).toBe(originalLocation);
    await act(() => pending.reject(new Error('Date failed')));
    expect(await screen.findByText('Date failed')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Task title')).toHaveValue(draft.title);
    expect(router.state.location).toBe(originalLocation);
    fireEvent.click(screen.getByRole('button', { name: /Choose a date/ }));
    expect(screen.getByRole('gridcell', { selected: true })).toHaveTextContent(
      '17',
    );
    expect(screen.queryByRole('button', { name: /^Use / })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/$/);
    const params = new URLSearchParams(router.state.location.search);
    expect(params.has('task')).toBe(false);
    expect(params.get('view')).toBe('compact');
  });
});

test.each(entryPoints.slice(0, 2))(
  '%s close preserves unrelated URL parameters and stays closed after cache updates',
  async (entryPoint) => {
    const { client } = await openTask(entryPoint);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expectSearchParamsPreserved(entryPoint);
    await act(() => client.refetchQueries({ queryKey: ['tasks'] }));
    expect(screen.queryByRole('dialog')).toBeNull();
  },
);

describe.each(entryPoints.slice(0, 2))(
  '%s pending navigation',
  (entryPoint) => {
    test('keeps a fresh draft when an earlier save for the same task finishes', async () => {
      const pending = deferred<Awaited<ReturnType<typeof apiClient.patch>>>();
      vi.mocked(apiClient.patch).mockReturnValueOnce(pending.promise);
      const { router, url } = await openTask(entryPoint);
      await editDraft();
      fireEvent.click(screen.getByRole('button', { name: 'Update' }));
      await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));

      await act(async () =>
        router.navigate(
          `${router.state.location.pathname}?task=${otherTask.id}`,
        ),
      );
      expect(await screen.findByPlaceholderText('Task title')).toHaveValue(
        otherTask.title,
      );
      await act(async () => router.navigate(url));
      expect(await screen.findByPlaceholderText('Task title')).toHaveValue(
        selectedTask.title,
      );
      fireEvent.change(screen.getByPlaceholderText('Task title'), {
        target: { value: 'Fresh draft after returning' },
      });
      fireEvent.change(screen.getByPlaceholderText('Task description'), {
        target: { value: 'Fresh description after returning' },
      });

      await act(async () =>
        pending.resolve({ data: selectedTask, status: 200, headers: {} }),
      );
      await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
      expect(
        router.state.location.pathname + router.state.location.search,
      ).toBe(url);
      expect(screen.getByPlaceholderText('Task title')).toHaveValue(
        'Fresh draft after returning',
      );
      expect(screen.getByPlaceholderText('Task description')).toHaveValue(
        'Fresh description after returning',
      );
    });

    test.each(['save', 'delete'] as const)(
      'does not let a completed %s close a different task selected with Back',
      async (operation) => {
        const pending = deferred<Awaited<ReturnType<typeof apiClient.patch>>>();
        const deletion =
          deferred<Awaited<ReturnType<typeof apiClient.delete>>>();
        if (operation === 'save')
          vi.mocked(apiClient.patch).mockReturnValueOnce(pending.promise);
        else vi.mocked(apiClient.delete).mockReturnValueOnce(deletion.promise);
        const { router, url } = await openTask(entryPoint);
        const nextUrl = `${router.state.location.pathname}?task=${otherTask.id}&view=expanded&date=2026-12-07`;
        await act(async () => router.navigate(nextUrl));
        await act(async () => router.navigate(url));
        if (operation === 'save') {
          await editDraft();
          fireEvent.click(screen.getByRole('button', { name: 'Update' }));
          await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));
        } else {
          fireEvent.click(screen.getByTitle('Delete task'));
          fireEvent.click(
            await screen.findByRole('button', { name: 'Delete permanently' }),
          );
          await waitFor(() =>
            expect(apiClient.delete).toHaveBeenCalledTimes(1),
          );
        }
        await act(async () => router.navigate(-1));
        expect(await screen.findByPlaceholderText('Task title')).toHaveValue(
          otherTask.title,
        );
        await act(async () => {
          if (operation === 'save')
            pending.resolve({ data: selectedTask, status: 200, headers: {} });
          else
            deletion.resolve({
              data: { message: 'Deleted' },
              status: 200,
              headers: {},
            });
        });
        await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
        expect(
          router.state.location.pathname + router.state.location.search,
        ).toBe(nextUrl);
        expect(screen.getByPlaceholderText('Task title')).toHaveValue(
          otherTask.title,
        );
      },
    );

    test.each(['selection cleared', 'page left'] as const)(
      'does not restore the old URL when a save finishes after the %s',
      async (destination) => {
        const pending = deferred<Awaited<ReturnType<typeof apiClient.patch>>>();
        vi.mocked(apiClient.patch).mockReturnValueOnce(pending.promise);
        const { router } = await openTask(entryPoint);
        await editDraft();
        fireEvent.click(screen.getByRole('button', { name: 'Update' }));
        await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));
        const nextUrl = `${destination === 'page left' ? '/away' : router.state.location.pathname}?view=expanded&date=2026-12-07`;
        await act(async () => router.navigate(nextUrl));
        await act(async () =>
          pending.resolve({ data: selectedTask, status: 200, headers: {} }),
        );
        expect(
          router.state.location.pathname + router.state.location.search,
        ).toBe(nextUrl);
        expect(screen.queryByRole('dialog')).toBeNull();
      },
    );

    test('preserves the latest unrelated parameters when the same task finishes saving', async () => {
      const pending = deferred<Awaited<ReturnType<typeof apiClient.patch>>>();
      vi.mocked(apiClient.patch).mockReturnValueOnce(pending.promise);
      const { router } = await openTask(entryPoint);
      await editDraft();
      fireEvent.click(screen.getByRole('button', { name: 'Update' }));
      await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));
      await act(async () =>
        router.navigate(
          `${router.state.location.pathname}?task=${selectedTask.id}&view=expanded&date=2026-12-07`,
        ),
      );
      await act(async () =>
        pending.resolve({ data: selectedTask, status: 200, headers: {} }),
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(router.state.location.search).toBe(
        '?view=expanded&date=2026-12-07',
      );
    });

    test('clears the selected URL after a delete refetch already removed its modal', async () => {
      const pending = deferred<Awaited<ReturnType<typeof apiClient.delete>>>();
      vi.mocked(apiClient.delete).mockReturnValueOnce(pending.promise);
      const { client, router } = await openTask(entryPoint);
      fireEvent.click(screen.getByTitle('Delete task'));
      fireEvent.click(
        await screen.findByRole('button', { name: 'Delete permanently' }),
      );
      await waitFor(() => expect(apiClient.delete).toHaveBeenCalledTimes(1));
      serverTasks = [otherTask];
      await act(async () => client.refetchQueries({ queryKey: ['tasks'] }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(
        new URLSearchParams(router.state.location.search).get('task'),
      ).toBe(selectedTask.id);
      await act(async () =>
        pending.resolve({
          data: { message: 'Deleted' },
          status: 200,
          headers: {},
        }),
      );
      await waitFor(() => expectSearchParamsPreserved(entryPoint));
    });

    test('uses the latest parameters when a pending custom date update navigates', async () => {
      serverTasks[1].dueDate = '2026-12-16T12:00:00.000Z';
      const pending = deferred<Awaited<ReturnType<typeof apiClient.patch>>>();
      vi.mocked(apiClient.patch).mockReturnValueOnce(pending.promise);
      const { router } = await openTask(entryPoint);
      fireEvent.click(screen.getByRole('button', { name: /Choose a date/ }));
      fireEvent.click(
        screen.getByRole('button', { name: /December 17th, 2026/ }),
      );
      fireEvent.click(screen.getByRole('button', { name: /^Use / }));
      fireEvent.click(screen.getByRole('button', { name: 'Update' }));
      await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));
      await act(async () =>
        router.navigate(
          `${router.state.location.pathname}?task=${selectedTask.id}&view=expanded&date=2026-12-07`,
        ),
      );
      await act(async () =>
        pending.resolve({ data: selectedTask, status: 200, headers: {} }),
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(router.state.location.pathname).toBe('/');
      const params = new URLSearchParams(router.state.location.search);
      expect(params.has('task')).toBe(false);
      expect(params.get('view')).toBe('expanded');
    });
  },
);
