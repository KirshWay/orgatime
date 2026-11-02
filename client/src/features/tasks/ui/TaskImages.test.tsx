import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { TaskImages } from './TaskImages';

const mutateAsync = vi.fn();
vi.mock('../hooks', () => ({
  useUploadTaskImage: () => ({ isPending: false }),
  useDeleteTaskImage: () => ({ mutateAsync, isPending: false }),
}));
vi.mock('./ImageGallery', () => ({
  ImageGallery: ({ onDelete }: { onDelete: (id: string) => void }) => (
    <button onClick={() => onDelete('image')}>Remove attachment</button>
  ),
}));
afterEach(() => vi.resetAllMocks());
function setup() {
  const onImagesChange = vi.fn();
  render(
    <TaskImages
      taskId="task"
      taskImages={[{ id: 'image', filename: 'image.png', path: '/image' }]}
      onImagesChange={onImagesChange}
    />,
  );
  return onImagesChange;
}

test('canceling deletion sends no request, confirming deletes the selected image', async () => {
  const change = setup();
  screen.getByText('Remove attachment').focus();
  fireEvent.click(screen.getByText('Remove attachment'));
  expect(mutateAsync).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() =>
    expect(screen.getByText('Remove attachment')).toHaveFocus(),
  );
  expect(change).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Remove attachment'));
  fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));
  await waitFor(() => expect(change).toHaveBeenCalledWith([]));
  expect(mutateAsync).toHaveBeenCalledExactlyOnceWith({
    taskId: 'task',
    imageId: 'image',
  });
});

test('pending deletion ignores repeated confirmation and failure keeps retry available', async () => {
  let reject!: (error: Error) => void;
  mutateAsync.mockImplementationOnce(
    () =>
      new Promise((_, rejectPromise) => {
        reject = rejectPromise;
      }),
  );
  const change = setup();
  fireEvent.click(screen.getByText('Remove attachment'));
  fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));
  expect(mutateAsync).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error('offline')));
  expect(change).not.toHaveBeenCalled();
  expect(
    screen.getByRole('dialog', { name: 'Delete image?' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));
  await waitFor(() => expect(change).toHaveBeenCalledWith([]));
});
