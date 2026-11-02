import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { apiClient } from '@/shared/api/lib/apiClient';
import { useUserStore } from '@/shared/stores/userStore';

import { useTaskAttachment } from './useTaskAttachment';

let client: QueryClient;
const createObjectURL = vi.fn();
const revokeObjectURL = vi.fn();

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useUserStore.setState({
    user: { email: 'owner@example.test', username: 'owner' },
    sessionVersion: 1,
  });
  let nextUrl = 0;
  createObjectURL
    .mockReset()
    .mockImplementation(() => `blob:test-${++nextUrl}`);
  revokeObjectURL.mockReset();
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    },
  );
});
afterEach(() => {
  client.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const wrapper = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

test('uses authenticated blob client with cancellation and revokes object URLs when the consumer unmounts', async () => {
  const get = vi
    .spyOn(apiClient, 'get')
    .mockResolvedValue({ data: new Blob(['image']), status: 200, headers: {} });
  const hook = renderHook(() => useTaskAttachment('task', 'image'), {
    wrapper,
  });
  await waitFor(() => expect(hook.result.current.url).toBe('blob:test-1'));
  expect(get).toHaveBeenCalledWith('/tasks/task/images/image/content', {
    responseType: 'blob',
    signal: expect.any(AbortSignal),
  });
  const query = client
    .getQueryCache()
    .find({ queryKey: ['task-attachment', 'task', 'image', 1] });
  expect(query?.meta?.persist).toBe(false);
  hook.unmount();
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-1');
  await waitFor(() => expect(client.getQueryCache().getAll()).toHaveLength(0));
});

test('never renders an old URL after a session changes and rejects a late response from the previous session', async () => {
  let finish!: (value: {
    data: Blob;
    status: number;
    headers: Record<string, string>;
  }) => void;
  const get = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
    data: new Blob(['first']),
    status: 200,
    headers: {},
  });
  const hook = renderHook(() => useTaskAttachment('task', 'image'), {
    wrapper,
  });
  await waitFor(() => expect(hook.result.current.url).toBe('blob:test-1'));
  get.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  act(() => {
    useUserStore.getState().clearUser();
    useUserStore
      .getState()
      .setUser({ email: 'next@example.test', username: 'next' });
  });
  expect(hook.result.current.url).toBeNull();
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-1');
  await waitFor(() => expect(finish).toBeDefined());
  act(() => useUserStore.getState().clearUser());
  await act(async () =>
    finish({ data: new Blob(['obsolete']), status: 200, headers: {} }),
  );
  expect(hook.result.current.url).toBeNull();
  expect(createObjectURL).toHaveBeenCalledTimes(1);
});

test('unmount aborts pending fetches without creating URLs', async () => {
  let signal!: AbortSignal;
  vi.spyOn(apiClient, 'get').mockImplementation((_url, config) => {
    signal = config!.signal!;
    return new Promise(() => {});
  });
  const hook = renderHook(() => useTaskAttachment('task', 'image'), {
    wrapper,
  });
  await waitFor(() => expect(signal).toBeDefined());
  hook.unmount();
  expect(signal.aborted).toBe(true);
  expect(createObjectURL).not.toHaveBeenCalled();
});

test('failed images expose retry and a successful retry creates the image URL', async () => {
  const get = vi
    .spyOn(apiClient, 'get')
    .mockRejectedValueOnce(new Error('unavailable'))
    .mockResolvedValueOnce({
      data: new Blob(['image']),
      status: 200,
      headers: {},
    });
  const hook = renderHook(() => useTaskAttachment('task', 'image'), {
    wrapper,
  });
  await waitFor(() => expect(hook.result.current.isError).toBe(true));
  expect(hook.result.current.url).toBeNull();
  await act(async () => {
    await hook.result.current.retry();
  });
  await waitFor(() => expect(hook.result.current.url).toBe('blob:test-1'));
  expect(get).toHaveBeenCalledTimes(2);
});

test('attachment bytes travel through the authenticated client rather than an image URL token', async () => {
  const fetch = vi.fn(
    async () =>
      new Response(new Blob(['image'], { type: 'image/webp' }), {
        status: 200,
      }),
  );
  vi.stubGlobal('fetch', fetch);
  const interceptor = apiClient.interceptors.request.use((config) => ({
    ...config,
    headers: { ...config.headers, Authorization: 'Bearer public-test-fixture' },
  }));
  try {
    const hook = renderHook(() => useTaskAttachment('task', 'image'), {
      wrapper,
    });
    await waitFor(() => expect(hook.result.current.url).toBe('blob:test-1'));
    expect(fetch).toHaveBeenCalledWith(
      '/api/tasks/task/images/image/content',
      expect.objectContaining({
        headers: { Authorization: 'Bearer public-test-fixture' },
        credentials: 'include',
        signal: expect.any(AbortSignal),
      }),
    );
    expect(hook.result.current.url).not.toContain('public-test-fixture');
  } finally {
    apiClient.interceptors.request.eject(interceptor);
  }
});
