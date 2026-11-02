import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

import { TaskItem } from './TaskItem';

const mutate = vi.fn();
vi.mock('../hooks', () => ({ useUpdateTask: () => ({ mutate }) }));
vi.mock('./TaskModal', () => ({
  TaskModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role="dialog">Task details</div> : null,
}));

const props = {
  id: 'task',
  title: 'Plan the week',
  completed: false,
  dueDate: null,
};

test('completion and title are separate controls', async () => {
  render(<TaskItem {...props} />);
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'Mark Plan the week as complete' }),
  );
  expect(mutate).toHaveBeenCalledWith({
    id: 'task',
    data: { completed: true },
  });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Plan the week' }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
});

test('drag preview has no focusable task controls', () => {
  render(<TaskItem {...props} isDragging />);
  expect(screen.getByRole('button', { name: 'Plan the week' })).toBeDisabled();
  expect(screen.getByRole('checkbox')).toBeDisabled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
