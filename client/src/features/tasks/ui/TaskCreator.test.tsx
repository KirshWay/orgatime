import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

import { TaskCreator } from './TaskCreator';

test('focuses the title and submits trimmed text with Enter', () => {
  const onConfirm = vi.fn();
  render(<TaskCreator onConfirm={onConfirm} onCancel={vi.fn()} />);
  const title = screen.getByRole('textbox', { name: 'New task title' });
  expect(title).toHaveFocus();
  fireEvent.change(title, { target: { value: '  Plan the week  ' } });
  fireEvent.keyDown(title, { key: 'Enter' });
  expect(onConfirm).toHaveBeenCalledExactlyOnceWith('Plan the week');
});

test('ignores composing Enter and Escape, then allows cancellation', () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(<TaskCreator onConfirm={onConfirm} onCancel={onCancel} />);
  const title = screen.getByRole('textbox', { name: 'New task title' });
  fireEvent.change(title, { target: { value: 'Draft' } });
  fireEvent.compositionStart(title);
  fireEvent.keyDown(title, { key: 'Enter' });
  fireEvent.keyDown(title, { key: 'Escape' });
  expect(onConfirm).not.toHaveBeenCalled();
  expect(onCancel).not.toHaveBeenCalled();
  fireEvent.compositionEnd(title);
  fireEvent.keyDown(title, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledOnce();
});

test('does not submit blank titles', () => {
  const onConfirm = vi.fn();
  render(<TaskCreator onConfirm={onConfirm} onCancel={vi.fn()} />);
  const title = screen.getByRole('textbox', { name: 'New task title' });
  fireEvent.change(title, { target: { value: '   ' } });
  fireEvent.keyDown(title, { key: 'Enter' });
  expect(onConfirm).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Create task' })).toBeDisabled();
});
