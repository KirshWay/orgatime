import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { apiClient } from '@/shared/api';
import { useUserStore } from '@/shared/stores/userStore';

import { AuthContextType } from './AuthContext';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

let auth: AuthContextType;
let client: QueryClient;
const user = { username: 'owner', email: 'owner@example.test' };
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function Probe() {
  const currentAuth = useAuth();
  useEffect(() => {
    auth = currentAuth;
  }, [currentAuth]);
  return null;
}
function mount() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/auth/login']}>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  useUserStore.getState().clearUser();
});
afterEach(() => {
  client?.clear();
  vi.unstubAllGlobals();
});

test('shares one refresh and retries concurrent requests with the new authorization header', async () => {
  const refresh = deferred<Response>();
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/auth/login')
      return json({ accessToken: 'old-access', user });
    if (url === '/api/auth/refresh') return refresh.promise;
    return new Headers(init?.headers).get('Authorization') ===
      'Bearer new-access'
      ? json({ ok: true })
      : json({}, 401);
  });
  vi.stubGlobal('fetch', fetchMock);
  mount();
  await act(() => auth.login('owner@example.test', 'password'));
  const first = apiClient.get('/tasks');
  const second = apiClient.get('/users/profile');
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([url]) => url === '/api/auth/refresh'),
    ).toHaveLength(1),
  );
  await act(async () => {
    refresh.resolve(json({ accessToken: 'new-access' }));
    await Promise.all([first, second]);
  });
  expect(auth.accessToken).toBe('new-access');
  expect(
    fetchMock.mock.calls.filter(([url]) => url === '/api/auth/refresh'),
  ).toHaveLength(1);
});

test('logout clears private queries immediately and a pending refresh cannot restore the session', async () => {
  const refresh = deferred<Response>();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === '/api/auth/login')
        return json({ accessToken: 'old-access', user });
      if (url === '/api/auth/refresh') return refresh.promise;
      if (url === '/api/auth/logout') return json({ ok: true });
      return json({}, 401);
    }),
  );
  mount();
  await act(() => auth.login(user.email, 'password'));
  client.setQueryData(['task-attachment', 'private'], new Blob(['private']));
  const pending = apiClient.get('/tasks').catch((error: unknown) => error);
  await waitFor(() =>
    expect(
      vi.mocked(fetch).mock.calls.some(([url]) => url === '/api/auth/refresh'),
    ).toBe(true),
  );
  await act(() => auth.logout());
  expect(auth.isAuthenticated).toBe(false);
  expect(client.getQueryCache().getAll()).toHaveLength(0);
  await act(async () => {
    refresh.resolve(json({ accessToken: 'late-access' }));
    await pending;
  });
  expect(auth.isAuthenticated).toBe(false);
  expect(useUserStore.getState().user).toBeNull();
});

test('an old account response cannot refresh or retry under a replacement account', async () => {
  const oldResponse = deferred<Response>();
  let loginCount = 0;
  const fetchMock = vi.fn(async (url: string) => {
    if (url === '/api/auth/login')
      return json({ accessToken: `access-${++loginCount}`, user });
    if (url === '/api/tasks') return oldResponse.promise;
    return json({}, 401);
  });
  vi.stubGlobal('fetch', fetchMock);
  mount();
  await act(() => auth.login(user.email, 'password'));
  client.setQueryData(['private'], 'old data');
  const pending = apiClient.get('/tasks').catch((error: unknown) => error);
  await act(() => auth.login('replacement@example.test', 'password'));
  expect(client.getQueryData(['private'])).toBeUndefined();
  await act(async () => {
    oldResponse.resolve(json({}, 401));
    await pending;
  });
  expect(
    fetchMock.mock.calls.some(([url]) => url === '/api/auth/refresh'),
  ).toBe(false);
  expect(auth.accessToken).toBe('access-2');
});

test('a second 401 after refresh is returned instead of looping', async () => {
  const fetchMock = vi.fn(async (url: string) => {
    if (url === '/api/auth/login') return json({ accessToken: 'access', user });
    if (url === '/api/auth/refresh') return json({ accessToken: 'refreshed' });
    return json({}, 401);
  });
  vi.stubGlobal('fetch', fetchMock);
  mount();
  await act(() => auth.login(user.email, 'password'));
  await act(async () => {
    await expect(apiClient.get('/tasks')).rejects.toMatchObject({
      status: 401,
    });
  });
  expect(
    fetchMock.mock.calls.filter(([url]) => url === '/api/auth/refresh'),
  ).toHaveLength(1);
});
