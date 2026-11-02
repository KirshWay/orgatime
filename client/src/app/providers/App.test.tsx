import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { act, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

import { App } from './App';

vi.mock('./PrivateRoute', async () => {
  const { Outlet } = await import('react-router-dom');
  return { PrivateRoute: Outlet };
});
vi.mock('@/shared/theme/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/pages/home', () => ({
  Home: () => (
    <>
      <header>Navigation</header>
      <main>Week</main>
    </>
  ),
}));
vi.mock('@/pages/all-tasks', () => ({
  AllTasks: () => (
    <>
      <header>Navigation</header>
      <main>All tasks</main>
    </>
  ),
}));

test('navigation immediately replaces the previous page without overlapping headers or hidden content', async () => {
  const router = createMemoryRouter([{ path: '*', element: <App /> }], {
    initialEntries: ['/'],
  });
  render(<RouterProvider router={router} />);
  await screen.findByText('Week');
  await act(() => router.navigate('/tasks'));
  await screen.findByText('All tasks');
  expect(screen.getAllByRole('banner')).toHaveLength(1);
  expect(screen.getAllByRole('main')).toHaveLength(1);
  expect(screen.queryByText('Week')).toBeNull();
  expect(screen.getByRole('main')).toBeVisible();
  await act(() => router.navigate('/'));
  expect(await screen.findByText('Week')).toBeVisible();
  expect(screen.getAllByRole('banner')).toHaveLength(1);
  expect(screen.queryByText('All tasks')).toBeNull();
});
