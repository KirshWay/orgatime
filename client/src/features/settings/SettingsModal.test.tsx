import { useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { useUserStore } from '@/shared/stores/userStore';

import { updateAvatar, updatePassword, updateProfile } from './api';
import { SettingsModal } from './SettingsModal';

vi.mock('@/shared/hooks/useAvatar', () => ({
  useAvatar: () => ({ url: useUserStore((state) => state.user?.avatar) }),
}));

vi.mock('./api', () => ({
  updateAvatar: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
}));
vi.mock('@/shared/ui/optimized-image', () => ({
  OptimizedImage: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));
const saved = {
  username: 'saved-user',
  email: 'saved@example.com',
  avatar: '/old.png',
};
const clients: QueryClient[] = [];
const passwordChanged = vi.fn();
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
  useUserStore.getState().setUser(saved);
  vi.mocked(updateProfile).mockImplementation(async (data) => ({
    ...saved,
    ...data,
    avatar: '/old.png',
  }));
  vi.mocked(updatePassword).mockResolvedValue({ message: 'Updated' });
  vi.mocked(updateAvatar).mockResolvedValue({ avatarUrl: '/new.png' });
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => 'blob:preview');
      static revokeObjectURL = vi.fn();
    },
  );
});
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  toast.remove();
  vi.unstubAllGlobals();
});
function Harness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open settings</button>
      <SettingsModal
        onPasswordChanged={passwordChanged}
        isOpen={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      />
      <Toaster />
    </>
  );
}
function open() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  clients.push(client);
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <Harness onClose={onClose} />
    </QueryClientProvider>,
  );
  return onClose;
}
function editUsername(value = 'changed_user') {
  fireEvent.click(screen.getByRole('button', { name: 'Edit username' }));
  fireEvent.change(screen.getByLabelText('Username'), { target: { value } });
}
function editPassword() {
  fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
  fireEvent.change(screen.getByLabelText('Current Password'), {
    target: { value: 'old-test-password' },
  });
  fireEvent.change(screen.getByLabelText('New Password'), {
    target: { value: 'New-test-password1!' },
  });
  fireEvent.change(screen.getByLabelText('Confirm New Password'), {
    target: { value: 'New-test-password1!' },
  });
}
function chooseAvatar() {
  fireEvent.change(screen.getByLabelText('Change avatar'), {
    target: {
      files: [new File(['image'], 'avatar.png', { type: 'image/png' })],
    },
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test('keeps Update visible and disabled until there is a selected change', () => {
  open();
  expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
  editUsername();
  expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Cancel username change' }),
  );
  expect(screen.getByText(saved.username)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
});
test('discards canceled profile and password fields before submitting another selected section', async () => {
  open();
  editUsername();
  fireEvent.click(
    screen.getByRole('button', { name: 'Cancel username change' }),
  );
  editPassword();
  fireEvent.click(
    screen.getByRole('button', { name: 'Cancel password change' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
  expect(screen.getByLabelText('Current Password')).toHaveValue('');
  expect(screen.getByLabelText('New Password')).toHaveValue('');
  fireEvent.click(
    screen.getByRole('button', { name: 'Cancel password change' }),
  );
  chooseAvatar();
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  await waitFor(() => expect(updateAvatar).toHaveBeenCalledTimes(1));
  expect(updateProfile).not.toHaveBeenCalled();
  expect(updatePassword).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
});
test('closing or canceling an avatar revokes its preview and reopening cannot submit the abandoned file', async () => {
  open();
  chooseAvatar();
  expect(await screen.findByAltText('Preview avatar')).toHaveAttribute(
    'src',
    'blob:preview',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Cancel photo change' }));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
  chooseAvatar();
  editUsername();
  editPassword();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
  expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
  expect(screen.getByAltText('Preview avatar')).toHaveAttribute(
    'src',
    saved.avatar,
  );
  expect(screen.queryByLabelText('Current Password')).not.toBeInTheDocument();
  editUsername('newer_user');
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
  expect(updateAvatar).not.toHaveBeenCalled();
  expect(updatePassword).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
});
test('waits for every selected request, blocks duplicate submits, editing and all dismissal until they settle', async () => {
  const profile = deferred<Awaited<ReturnType<typeof updateProfile>>>();
  const avatar = deferred<Awaited<ReturnType<typeof updateAvatar>>>();
  vi.mocked(updateProfile).mockReturnValueOnce(profile.promise);
  vi.mocked(updateAvatar).mockReturnValueOnce(avatar.promise);
  const close = open();
  editUsername();
  chooseAvatar();
  fireEvent.submit(document.getElementById('settings-form')!);
  fireEvent.submit(document.getElementById('settings-form')!);
  await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
  expect(updateAvatar).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Updating...' })).toBeDisabled();
  expect(screen.getByLabelText('Username')).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Cancel username change' }),
  ).toBeDisabled();
  expect(screen.getByLabelText('Change avatar')).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  fireEvent.pointerDown(
    document.querySelector('[data-slot="dialog-overlay"]')!,
  );
  expect(close).not.toHaveBeenCalled();
  await act(async () => profile.reject(new Error('Profile failed')));
  expect(screen.getByRole('button', { name: 'Updating...' })).toBeDisabled();
  expect(close).not.toHaveBeenCalled();
  await act(async () => avatar.resolve({ avatarUrl: '/new.png' }));
  expect(await screen.findByText('Profile failed')).toBeInTheDocument();
  expect(screen.getByLabelText('Username')).toHaveValue('changed_user');
  expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled();
});
test('defers password change until failed profile saves are retried', async () => {
  vi.mocked(updateProfile).mockRejectedValueOnce(new Error('Profile failed'));
  open();
  editUsername();
  editPassword();
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  expect(await screen.findByText('Profile failed')).toBeInTheDocument();
  expect(screen.getByLabelText('Username')).toHaveValue('changed_user');
  expect(screen.getByLabelText('Current Password')).toHaveValue(
    'old-test-password',
  );
  expect(updatePassword).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(updatePassword).toHaveBeenCalledTimes(1);
  expect(passwordChanged).toHaveBeenCalledTimes(1);
});
test('keeps successful profile and avatar values when profile responds last with a stale avatar', async () => {
  const profile = deferred<Awaited<ReturnType<typeof updateProfile>>>();
  vi.mocked(updateProfile).mockReturnValueOnce(profile.promise);
  open();
  editUsername();
  chooseAvatar();
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  await waitFor(() =>
    expect(useUserStore.getState().user?.avatar).toBe('/new.png'),
  );
  await act(async () =>
    profile.resolve({ ...saved, username: 'changed_user' }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(useUserStore.getState().user).toEqual({
    ...saved,
    username: 'changed_user',
    avatar: '/new.png',
  });
});
test('preserves password validation and clears its errors on cancel', async () => {
  open();
  editPassword();
  fireEvent.change(screen.getByLabelText('Confirm New Password'), {
    target: { value: 'mismatch' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  expect(updatePassword).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Cancel password change' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
  expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
});

test('retries a failed password with its draft after profile and avatar already succeeded', async () => {
  vi.mocked(updatePassword).mockRejectedValueOnce(new Error('Password failed'));
  open();
  editUsername();
  editPassword();
  chooseAvatar();
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  expect(await screen.findByText('Password failed')).toBeInTheDocument();
  expect(screen.getByText('changed_user')).toBeInTheDocument();
  expect(screen.getByLabelText('Current Password')).toHaveValue(
    'old-test-password',
  );
  expect(screen.getByLabelText('New Password')).toHaveValue(
    'New-test-password1!',
  );
  expect(useUserStore.getState().user?.avatar).toBe('/new.png');
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(updatePassword).toHaveBeenCalledTimes(2);
  expect(updateProfile).toHaveBeenCalledTimes(1);
  expect(updateAvatar).toHaveBeenCalledTimes(1);
});

test('changing email omits the unchanged legacy username from the request', async () => {
  open();
  fireEvent.click(screen.getByRole('button', { name: 'Edit email' }));
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'new@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  await waitFor(() =>
    expect(vi.mocked(updateProfile).mock.calls[0]?.[0]).toEqual({
      email: 'new@example.com',
    }),
  );
});
