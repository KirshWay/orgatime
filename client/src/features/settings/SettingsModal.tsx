import React, { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { useAvatar } from '@/shared/hooks/useAvatar';
import { parseApiError } from '@/shared/lib/parseApiError';
import { useUserStore } from '@/shared/stores/userStore';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Separator } from '@/shared/ui/separator';

import { updateAvatar, updatePassword, updateProfile } from './api';
import { AvatarUploader } from './AvatarUploader';
import { SettingsFormData } from './model/types';
import { createSettingsSchema } from './model/validation';
import { PasswordForm } from './ui/PasswordForm';
import { ProfileForm } from './ui/ProfileForm';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPasswordChanged: () => void;
};

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onPasswordChanged,
}) => {
  const { user, updateUser } = useUserStore();
  const { url: avatarUrl } = useAvatar();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [editingFields, setEditingFields] = useState({
    username: false,
    email: false,
    password: false,
  });
  const submitting = useRef(false);
  const methods = useForm<SettingsFormData>({
    resolver: zodResolver(createSettingsSchema(user?.username)),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  const {
    watch,
    reset,
    resetField,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;
  const values = watch();
  const isProfileChanged =
    (editingFields.username && values.username !== user?.username) ||
    (editingFields.email && values.email !== user?.email);
  const isPasswordReady =
    editingFields.password &&
    !!values.oldPassword.trim() &&
    !!values.newPassword.trim() &&
    !!values.confirmPassword.trim();
  const hasChanges = isProfileChanged || isPasswordReady || avatarFile !== null;

  useEffect(() => {
    if (!isOpen) {
      reset({
        username: user?.username || '',
        email: user?.email || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setEditingFields({ username: false, email: false, password: false });
      setAvatarFile(null);
    }
  }, [isOpen, reset, user]);

  const profileMutation = useMutation({ mutationFn: updateProfile });
  const passwordMutation = useMutation({ mutationFn: updatePassword });
  const avatarMutation = useMutation({ mutationFn: updateAvatar });
  const clearPassword = () => {
    resetField('oldPassword', { defaultValue: '' });
    resetField('newPassword', { defaultValue: '' });
    resetField('confirmPassword', { defaultValue: '' });
    setEditingFields((current) => ({ ...current, password: false }));
  };
  const onSubmit = async (data: SettingsFormData) => {
    if (!hasChanges) return;
    const requests: Promise<unknown>[] = [];
    if (isProfileChanged)
      requests.push(
        profileMutation
          .mutateAsync({
            ...(editingFields.username && data.username !== user?.username
              ? { username: data.username }
              : {}),
            ...(editingFields.email && data.email !== user?.email
              ? { email: data.email }
              : {}),
          })
          .then((saved) => {
            updateUser({ username: saved.username, email: saved.email });
            resetField('username', { defaultValue: saved.username });
            resetField('email', { defaultValue: saved.email });
            setEditingFields((current) => ({
              ...current,
              username: false,
              email: false,
            }));
          }),
      );
    if (avatarFile)
      requests.push(
        avatarMutation.mutateAsync(avatarFile).then((saved) => {
          updateUser({ avatar: saved.avatarUrl });
          setAvatarFile(null);
        }),
      );
    const results = await Promise.allSettled(requests);
    const failures = results.filter((result) => result.status === 'rejected');
    for (const failure of failures) toast.error(parseApiError(failure.reason));
    if (failures.length) return;
    if (editingFields.password && data.newPassword && data.oldPassword) {
      try {
        await passwordMutation.mutateAsync({
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
        });
      } catch (error) {
        toast.error(parseApiError(error));
        return;
      }
      clearPassword();
      toast.success('Password updated. Please sign in again.');
      onClose();
      onPasswordChanged();
      return;
    }
    toast.success('Settings updated');
    onClose();
  };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    try {
      await handleSubmit(onSubmit)(event);
    } finally {
      submitting.current = false;
    }
  };
  const close = () => {
    if (!isSubmitting && !submitting.current) onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent
        className="bg-white dark:bg-gray-900 max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0"
        onEscapeKeyDown={(event) => {
          if (isSubmitting) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isSubmitting) event.preventDefault();
        }}
      >
        <DialogHeader className="border-b px-4 py-4 sm:px-6">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="sr-only">
            User profile settings
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form
            id="settings-form"
            onSubmit={submit}
            className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6"
            aria-busy={isSubmitting}
          >
            <fieldset disabled={isSubmitting} className="min-w-0 space-y-4">
              <AvatarUploader
                img={avatarUrl || ''}
                file={avatarFile}
                onFileChange={setAvatarFile}
                disabled={isSubmitting}
              />
              <ProfileForm
                isEditingUsername={editingFields.username}
                setIsEditingUsername={(editing) => {
                  if (!editing)
                    resetField('username', {
                      defaultValue: user?.username || '',
                    });
                  setEditingFields((current) => ({
                    ...current,
                    username: editing,
                  }));
                }}
                isEditingEmail={editingFields.email}
                setIsEditingEmail={(editing) => {
                  if (!editing)
                    resetField('email', { defaultValue: user?.email || '' });
                  setEditingFields((current) => ({
                    ...current,
                    email: editing,
                  }));
                }}
              />
              <Separator />
              <PasswordForm
                isEditingPassword={editingFields.password}
                setIsEditingPassword={(editing) => {
                  if (!editing) clearPassword();
                  else
                    setEditingFields((current) => ({
                      ...current,
                      password: true,
                    }));
                }}
              />
            </fieldset>
          </form>
        </FormProvider>
        <DialogFooter className="flex-row justify-end gap-2 border-t px-4 py-4 sm:px-6 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={close}
            disabled={isSubmitting}
          >
            Close
          </Button>
          <Button
            type="submit"
            form="settings-form"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={!hasChanges || isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
