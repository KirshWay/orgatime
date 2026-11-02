import { lazy } from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { LazyWidget } from './LazyWidget';

const PendingWidget = lazy(
  () => new Promise<{ default: () => null }>(() => {}),
);

test('loading a widget keeps its status in the document flow', () => {
  render(
    <>
      <header>Planner</header>
      <LazyWidget>
        <PendingWidget />
      </LazyWidget>
    </>,
  );
  expect(screen.getByRole('banner')).toBeVisible();
  const status = screen.getByRole('status');
  expect(status).toHaveTextContent('Loading');
  expect(status.closest('.fixed')).toBeNull();
});

test('accepts a null fallback while a modal chunk loads', () => {
  render(
    <LazyWidget fallback={null}>
      <PendingWidget />
    </LazyWidget>,
  );
  expect(screen.queryByRole('status')).toBeNull();
  expect(document.querySelector('.fixed')).toBeNull();
});
